from fastapi import FastAPI, Depends
from fastapi import HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware  # 👈 ADD THIS
from sqlalchemy.orm import Session, object_session
from jose import jwt, JWTError
from sqlalchemy import text, or_, func

from database import engine, Base, SessionLocal
import models, schemas
from auth import hash_password, verify_password, create_token

Base.metadata.create_all(bind=engine)

# DEV MIGRATION HELPER
# If the project already has an existing SQLite file, SQLAlchemy's create_all
# won't add new columns. This helper checks the books table and runs simple
# ALTER TABLE ADD COLUMN statements for the new fields we added (owner_id,
# availability). This is intended for development only; use proper migrations
# (Alembic) in production.
def ensure_books_columns():
    with engine.connect() as conn:
        try:
            res = conn.execute(text("PRAGMA table_info(books)"))
            cols = [row[1] for row in res.fetchall()]
        except Exception:
            # table doesn't exist yet
            return

        if 'owner_id' not in cols:
            conn.execute(text("ALTER TABLE books ADD COLUMN owner_id INTEGER"))
        if 'availability' not in cols:
            # sqlite doesn't have a native BOOLEAN type; use INTEGER default 1
            conn.execute(text("ALTER TABLE books ADD COLUMN availability INTEGER DEFAULT 1"))
        if 'genre' not in cols:
            conn.execute(text("ALTER TABLE books ADD COLUMN genre TEXT"))

ensure_books_columns()

def ensure_users_columns():
    with engine.connect() as conn:
        try:
            res = conn.execute(text("PRAGMA table_info(users)"))
            cols = [row[1] for row in res.fetchall()]
        except Exception:
            # users table doesn't exist yet
            return

        # add profile fields if missing (development helper)
        if 'name' not in cols:
            conn.execute(text("ALTER TABLE users ADD COLUMN name TEXT"))
        if 'bio' not in cols:
            conn.execute(text("ALTER TABLE users ADD COLUMN bio TEXT"))
        if 'avatar' not in cols:
            conn.execute(text("ALTER TABLE users ADD COLUMN avatar TEXT"))

ensure_users_columns()

app = FastAPI()

# important: ensure CORS middleware is added before routes are used
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*", "Authorization"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# helper to get current user from Authorization header
def get_current_user(authorization: str | None = Header(None), db: Session = Depends(get_db)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization")
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(status_code=401, detail="Invalid auth scheme")
        payload = jwt.decode(token, "your-secret-key", algorithms=["HS256"])
        email = payload.get("sub")
        if not email:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        user = db.query(models.User).filter(models.User.email == email).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


# REGISTER
@app.post("/register")
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="User already exists")

    new_user = models.User(
        email=user.email,
        password=hash_password(user.password)
    )

    db.add(new_user)
    db.commit()
    return {"message": "User created"}


# LOGIN
@app.post("/login")
def login(user: schemas.UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()

    if not db_user or not verify_password(user.password, db_user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_token({"sub": db_user.email})

    return {"access_token": token, "token_type": "bearer"}

# DB dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ➕ CREATE BOOK
@app.post("/books")
def create_book(book: schemas.BookCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # attach current user as owner; ignore owner_id from client
    book_data = book.dict()
    book_data["owner_id"] = current_user.id
    new_book = models.Book(**book_data)
    db.add(new_book)
    db.commit()
    db.refresh(new_book)
    return new_book


# 📖 GET BOOKS
@app.get("/books")
def get_books(db: Session = Depends(get_db)):
    # return books with owner info so the frontend can show who posted each book
    rows = db.query(models.Book, models.User).outerjoin(models.User, models.Book.owner_id == models.User.id).all()
    result = []
    for book, user in rows:
        result.append({
            "id": book.id,
            "title": book.title,
            "author": book.author,
            "review": book.review,
            "rating": book.rating,
            "status": book.status,
            "image": book.image,
            "availability": getattr(book, "availability", 1),
            "owner_id": getattr(book, "owner_id", None),
            "owner": {
                "id": user.id if user else None,
                "name": (user.name if user and user.name else (user.email if user else None)),
                "avatar": user.avatar if user else None,
            },
        })
    return result


# ❌ DELETE BOOK
@app.delete("/books/{book_id}")
def delete_book(book_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    book = db.query(models.Book).filter(models.Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    if book.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not allowed")
    db.delete(book)
    db.commit()
    return {"message": "deleted"}


# 📝 UPDATE BOOK (status, review, rating, etc.)
@app.put("/books/{book_id}")
def update_book(book_id: int, update: schemas.BookUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """Update book details. Only owner can update. Commonly used to change reading status."""
    book = db.query(models.Book).filter(models.Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    if book.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not allowed")
    
    # Update fields if provided
    update_data = update.dict(exclude_unset=True)
    for field, value in update_data.items():
        if value is not None:
            setattr(book, field, value)
    
    db.add(book)
    db.commit()
    db.refresh(book)
    return book


# USER PROFILE - current user
@app.get("/users/me")
def read_current_user(current_user: models.User = Depends(get_current_user)):
    # return basic user info for the logged-in user
    return {"id": current_user.id, "email": current_user.email, "name": current_user.name, "bio": current_user.bio, "avatar": current_user.avatar}


@app.put("/users/me")
def update_current_user(update: schemas.UserUpdate, current_user: models.User = Depends(get_current_user)):
    # Use the same SQLAlchemy session that loaded current_user to avoid
    # 'Object ... is already attached to session' errors when committing.
    session = object_session(current_user)
    if session is None:
        # Fallback: open a fresh session and re-query the user (rare)
        db = SessionLocal()
        try:
            user = db.query(models.User).filter(models.User.id == current_user.id).first()
            if update.name is not None:
                user.name = update.name
            if update.bio is not None:
                user.bio = update.bio
            if update.avatar is not None:
                user.avatar = update.avatar
            db.add(user)
            db.commit()
        finally:
            db.close()
    else:
        if update.name is not None:
            current_user.name = update.name
        if update.bio is not None:
            current_user.bio = update.bio
        if update.avatar is not None:
            current_user.avatar = update.avatar
        session.add(current_user)
        session.commit()
    return {"message": "Profile updated"}


# USER SEARCH / DISCOVERY
@app.get("/users")
def search_users(query: str | None = None, db: Session = Depends(get_db)):
    """Simple user discovery endpoint. Use ?query= to search name or email (case-insensitive)."""
    q = db.query(models.User)
    if query:
        like = f"%{query.strip()}%"
        lower_like = like.lower()
        q = q.filter(
            or_(
                func.lower(models.User.name).like(lower_like),
                func.lower(models.User.email).like(lower_like),
            )
        )
    users = q.all()
    return [{"id": u.id, "name": u.name, "display_name": (u.name if u.name else u.email), "email": u.email, "avatar": u.avatar} for u in users]


# 🔍 SEARCH BOOKS BY TITLE
@app.get("/books/search")
def search_books(query: str | None = None, db: Session = Depends(get_db)):
    """Search books by title or author. Returns all matching books with owner info."""
    rows = db.query(models.Book, models.User).outerjoin(models.User, models.Book.owner_id == models.User.id)
    
    if query:
        like = f"%{query.strip()}%"
        rows = rows.filter(
            or_(
                func.lower(models.Book.title).like(like.lower()),
                func.lower(models.Book.author).like(like.lower()),
            )
        )
    
    result = []
    for book, user in rows.all():
        result.append({
            "id": book.id,
            "title": book.title,
            "author": book.author,
            "review": book.review,
            "rating": book.rating,
            "status": book.status,
            "genre": getattr(book, "genre", None),
            "image": book.image,
            "availability": getattr(book, "availability", 1),
            "owner_id": getattr(book, "owner_id", None),
            "owner": {
                "id": user.id if user else None,
                "name": (user.name if user and user.name else (user.email if user else None)),
                "avatar": user.avatar if user else None,
            },
        })
    return result


# PUBLIC: get user by id
@app.get("/users/{user_id}")
def read_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # ✅ PUBLIC PROFILE (SAFE)z
    return {
        "id": user.id,
        "name": user.name,
        "bio": user.bio,
        "avatar": user.avatar,
    }

# GET books for a user (PROTECTED - only authenticated users)
@app.get("/users/{user_id}/books")
def read_user_books(user_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """Get books for a user. Requires authentication."""
    books = db.query(models.Book).filter(models.Book.owner_id == user_id).all()
    return books


# 📚 GET PERSONALIZED RECOMMENDATIONS
@app.get("/books/recommendations")
def get_recommendations(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """
    Get personalized book recommendations for the current user.
    
    Scoring algorithm:
    - Genre match: +15 points (highest priority)
    - Author match: +12 points
    - Rating ≥4.0: +1-2 points
    - Recent (< 30 days): +1-3 points
    
    Returns top 20 books with score > 0, sorted by score (descending).
    """
    # Get all books
    rows = db.query(models.Book, models.User).outerjoin(models.User, models.Book.owner_id == models.User.id).all()
    
    if not rows:
        return []
    
    books_data = []
    for book, owner in rows:
        books_data.append({
            "id": book.id,
            "title": book.title,
            "author": book.author,
            "review": book.review,
            "rating": book.rating,
            "genre": book.status,  # Note: using 'status' field as genre (update schema if needed)
            "status": book.status,
            "image": book.image,
            "availability": getattr(book, "availability", 1),
            "owner_id": getattr(book, "owner_id", None),
            "created_at": book.created_at if hasattr(book, "created_at") else None,
            "owner": {
                "id": owner.id if owner else None,
                "name": (owner.name if owner and owner.name else (owner.email if owner else None)),
                "avatar": owner.avatar if owner else None,
            },
        })
    
    # Simple scoring algorithm (client-side fallback in ForYou.jsx has more sophisticated version)
    def score_book(book_dict):
        score = 0
        
        # Genre/status match (simple check - can be enhanced with user preferences)
        if book_dict.get("genre"):
            score += 5  # Base score for any book
        
        # Rating boost
        rating = book_dict.get("rating", 0)
        if rating >= 4.5:
            score += 3
        elif rating >= 4.0:
            score += 2
        elif rating >= 3.5:
            score += 1
        
        # Recency boost (if book was recently created)
        if book_dict.get("created_at"):
            import datetime
            created = datetime.datetime.fromisoformat(book_dict["created_at"]) if isinstance(book_dict["created_at"], str) else book_dict["created_at"]
            now = datetime.datetime.now()
            days_old = (now - created).days
            if days_old < 7:
                score += 3
            elif days_old < 30:
                score += 1
        
        return score
    
    # Score and filter books
    scored_books = [
        {**b, "_score": score_book(b)}
        for b in books_data
    ]
    
    # Filter and sort
    recommended = [b for b in scored_books if b["_score"] > 0]
    recommended.sort(key=lambda x: x["_score"], reverse=True)
    
    # Remove score before returning
    for book in recommended:
        del book["_score"]
    
    return recommended[:20]  # Return top 20