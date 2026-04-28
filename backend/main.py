from fastapi import FastAPI, Depends, Query
from fastapi import HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware  # 👈 ADD THIS
from sqlalchemy.orm import Session, object_session
from jose import jwt, JWTError
from sqlalchemy import text, or_, func

from database import engine, Base, SessionLocal
import models, schemas
from auth import hash_password, verify_password, create_token
from location_data import CITY_AREA_MAP, is_valid_city_area
import json

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
        if 'genre_tags' not in cols:
            conn.execute(text("ALTER TABLE books ADD COLUMN genre_tags TEXT"))
        if 'city' not in cols:
            conn.execute(text("ALTER TABLE books ADD COLUMN city TEXT"))
        if 'area' not in cols:
            conn.execute(text("ALTER TABLE books ADD COLUMN area TEXT"))
        if 'pickup_hint' not in cols:
            conn.execute(text("ALTER TABLE books ADD COLUMN pickup_hint TEXT"))
        if 'location_display_name' not in cols:
            conn.execute(text("ALTER TABLE books ADD COLUMN location_display_name TEXT"))
        if 'location_latitude' not in cols:
            conn.execute(text("ALTER TABLE books ADD COLUMN location_latitude REAL"))
        if 'location_longitude' not in cols:
            conn.execute(text("ALTER TABLE books ADD COLUMN location_longitude REAL"))

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
        if 'interests' not in cols:
            conn.execute(text("ALTER TABLE users ADD COLUMN interests TEXT"))
        if 'city' not in cols:
            conn.execute(text("ALTER TABLE users ADD COLUMN city TEXT"))
        if 'area' not in cols:
            conn.execute(text("ALTER TABLE users ADD COLUMN area TEXT"))
        if 'location_display_name' not in cols:
            conn.execute(text("ALTER TABLE users ADD COLUMN location_display_name TEXT"))
        if 'location_latitude' not in cols:
            conn.execute(text("ALTER TABLE users ADD COLUMN location_latitude REAL"))
        if 'location_longitude' not in cols:
            conn.execute(text("ALTER TABLE users ADD COLUMN location_longitude REAL"))

ensure_users_columns()

def ensure_chat_tables():
    with engine.connect() as conn:
        try:
            res = conn.execute(text("PRAGMA table_info(chats)"))
            cols = [row[1] for row in res.fetchall()]
        except Exception:
            # chats table doesn't exist yet
            return
        
        try:
            res = conn.execute(text("PRAGMA table_info(messages)"))
            cols = [row[1] for row in res.fetchall()]
        except Exception:
            # messages table doesn't exist yet
            return

ensure_chat_tables()

app = FastAPI()

# important: ensure CORS middleware is added before routes are used
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173",
                   "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def parse_interests(raw_value):
    if not raw_value:
        return []
    if isinstance(raw_value, list):
        return raw_value
    try:
        parsed = json.loads(raw_value)
        return parsed if isinstance(parsed, list) else []
    except (TypeError, json.JSONDecodeError):
        return []


def serialize_interests(interests):
    if not interests:
        return None
    return json.dumps(interests)


def parse_genre_tags(raw_value, fallback_genre=None):
    parsed = parse_interests(raw_value)
    if parsed:
        return parsed
    if fallback_genre:
        return [fallback_genre]
    return []


def normalize_genres(genres):
    if not genres:
        return []
    normalized = []
    seen = set()
    for genre in genres:
        value = (genre or "").strip()
        if not value:
            continue
        key = value.lower()
        if key in seen:
            continue
        seen.add(key)
        normalized.append(value)
    return normalized


def serialize_genre_tags(genres):
    normalized = normalize_genres(genres)
    if not normalized:
        return None
    return json.dumps(normalized)


def build_book_payload(
    book: models.Book,
    owner: models.User | None = None,
    proximity: str | None = None,
):
    genre_tags = parse_genre_tags(getattr(book, "genre_tags", None), getattr(book, "genre", None))
    payload = {
        "id": book.id,
        "title": book.title,
        "author": book.author,
        "review": book.review,
        "rating": book.rating,
        "status": book.status,
        "genre": getattr(book, "genre", None) or (genre_tags[0] if genre_tags else None),
        "genre_tags": genre_tags,
        "image": book.image,
        "availability": getattr(book, "availability", 1),
        "owner_id": getattr(book, "owner_id", None),
        "city": getattr(book, "city", None),
        "area": getattr(book, "area", None),
        "pickup_hint": getattr(book, "pickup_hint", None),
    }
    if proximity is not None:
        payload["proximity"] = proximity
    if owner:
        payload["owner"] = {
            "id": owner.id,
            "name": owner.name if owner.name else owner.email,
            "email": owner.email,
            "avatar": owner.avatar,
        }
    else:
        payload["owner"] = {
            "id": None,
            "name": None,
            "email": None,
            "avatar": None,
        }
    return payload


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
def update_user_preference(db, user_id: int, book_id: int, interaction_type: str):
    # map interaction strength
    weights = {
        "view": 0.1,
        "click": 0.3,
        "like": 1.5,
        "save": 2.0
    }

    increment = weights.get(interaction_type, 0.0)

    if increment == 0:
        return

    # get book → extract genre
    book = db.query(models.Book).filter(models.Book.id == book_id).first()
    if not book:
        return

    genre_id = book.genre_id

    # find existing preference
    pref = db.query(models.UserPreference).filter_by(
        user_id=user_id,
        genre_id=genre_id
    ).first()

    # create if not exists
    if not pref:
        pref = models.UserPreference(
            user_id=user_id,
            genre_id=genre_id,
            weight=0.0
        )
        db.add(pref)

    # update weight
    pref.weight += increment

    db.commit()

# 👇 ADD IT HERE
def get_user_genre_weights(db, user_id: int):
    prefs = db.query(models.UserPreference).filter_by(user_id=user_id).all()
    return {p.genre_id: p.weight for p in prefs}


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

    print("LOGIN EMAIL:", user.email)
    print("DB USER:", db_user)
 
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
def create_book(
    book: schemas.BookCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):

    book_data = book.dict()

    # attach owner
    book_data["owner_id"] = current_user.id

    # normalize genres
    normalized_genres = normalize_genres(book_data.get("genre_tags"))
    book_data["genre_tags"] = serialize_genre_tags(normalized_genres)
    print("NORMALIZED GENRES:", normalized_genres)  # DEBUG

    # ⚠️ REMOVE THIS LINE (IMPORTANT)
    book_data.pop("genre", None)

    # safer: only use genre_id OR ignore genre relationship entirely
    book_data["genre"] = None  # OR just delete if not needed

    if not book_data.get("city"):
        book_data["city"] = current_user.city

    if not book_data.get("area"):
        book_data["area"] = current_user.area

    if not is_valid_city_area(book_data.get("city"), book_data.get("area")):
        raise HTTPException(status_code=400, detail="Area must belong to the selected city")

    new_book = models.Book(**book_data)   # now SAFE
    print("NEW BOOK DATA:", book_data)  # DEBUG
    db.add(new_book)
    db.commit()
    db.refresh(new_book)

    return build_book_payload(new_book, current_user)

# 📖 GET BOOKS
@app.get("/books")
def get_books(db: Session = Depends(get_db)):
    # return books with owner info so the frontend can show who posted each book
    rows = db.query(models.Book, models.User).outerjoin(models.User, models.Book.owner_id == models.User.id).all()
    return [build_book_payload(book, user) for book, user in rows]


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
    if "genre_tags" in update_data:
        normalized_genres = normalize_genres(update_data.get("genre_tags"))
        update_data["genre_tags"] = serialize_genre_tags(normalized_genres)
        update_data["genre"] = normalized_genres[0] if normalized_genres else None
    next_city = update_data.get("city", book.city)
    next_area = update_data.get("area", book.area)
    if not is_valid_city_area(next_city, next_area):
        raise HTTPException(status_code=400, detail="Area must belong to the selected city")
    for field, value in update_data.items():
        if value is not None:
            setattr(book, field, value)
    
    db.add(book)
    db.commit()
    db.refresh(book)
    return build_book_payload(book, current_user)


# USER PROFILE - current user
@app.get("/users/me")
def read_current_user(current_user: models.User = Depends(get_current_user)):
    # return basic user info for the logged-in user
    return {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.name,
        "bio": current_user.bio,
        "avatar": current_user.avatar,
        "interests": parse_interests(current_user.interests),
        "city": current_user.city,
        "area": current_user.area,
    }


@app.put("/users/me")
def update_current_user(update: schemas.UserUpdate, current_user: models.User = Depends(get_current_user)):
    # Use the same SQLAlchemy session that loaded current_user to avoid
    # 'Object ... is already attached to session' errors when committing.
    if not is_valid_city_area(update.city if update.city is not None else current_user.city, update.area if update.area is not None else current_user.area):
        raise HTTPException(status_code=400, detail="Area must belong to the selected city")
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
            if update.interests is not None:
                user.interests = serialize_interests(update.interests)
            if update.city is not None:
                user.city = update.city
            if update.area is not None:
                user.area = update.area
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
        if update.interests is not None:
            current_user.interests = serialize_interests(update.interests)
        if update.city is not None:
            current_user.city = update.city
        if update.area is not None:
            current_user.area = update.area
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
            "genre_tags": parse_genre_tags(getattr(book, "genre_tags", None), getattr(book, "genre", None)),
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
        "interests": parse_interests(user.interests),
        "city": user.city,
        "area": user.area,
    }

# GET books for a user (PROTECTED - only authenticated users)
@app.get("/users/{user_id}/books")
def read_user_books(user_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """Get books for a user. Requires authentication."""
    books = db.query(models.Book).filter(models.Book.owner_id == user_id).all()
    return books


# 📚 GET INTEREST-BASED PERSONALIZED BOOKS
@app.get("/books/for-you")
def get_for_you_books(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # normalize interests to trimmed lowercase strings to avoid mismatches
    interests = {(interest or "").strip().lower() for interest in parse_interests(current_user.interests)}

    rows = (
        db.query(models.Book, models.User)
        .outerjoin(models.User, models.Book.owner_id == models.User.id)
        .filter(models.Book.owner_id != current_user.id)
        .all()
    )

    ranked_books = []
    for book, owner in rows:
        genre_tags = parse_genre_tags(getattr(book, "genre_tags", None), getattr(book, "genre", None))
        # create normalized tag list for matching (trim + lower)
        normalized_tags = [ (g or "").strip().lower() for g in genre_tags ]
        matching_tags = [
            genre for genre, n in zip(genre_tags, normalized_tags)
            if n in interests
        ]
        same_city = bool(current_user.city and book.city == current_user.city)
        same_area = bool(current_user.area and book.area == current_user.area and same_city)
        is_nearby = same_city
        if not interests and not is_nearby:
            continue
        if not matching_tags and not is_nearby:
            continue

        rank = 0
        if is_nearby and matching_tags:
            rank = 3
        elif is_nearby:
            rank = 2
        elif matching_tags:
            rank = 1

        payload = build_book_payload(book, owner)
        payload["matches_interests"] = bool(matching_tags)
        payload["matching_genres"] = matching_tags
        payload["nearby"] = same_area
        payload["feed_reason"] = (
            "Nearby and matches your interests"
            if is_nearby and matching_tags
            else "Nearby"
            if is_nearby
            else "Matches your interests"
        )
        area_rank = 0 if same_area else 1
        city_rank = 0 if same_city else 1
        ranked_books.append((rank, area_rank, city_rank, book.id, payload))

    ranked_books.sort(key=lambda item: (-item[0], item[1], item[2], item[3]))
    return [payload for _, __, ___, ____, payload in ranked_books]


# 💬 CHAT ENDPOINTS

# Get or create chat between two users
@app.post("/chats/with/{other_user_id}")
def get_or_create_chat(
    other_user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.id == other_user_id:
        raise HTTPException(status_code=400, detail="Cannot chat with yourself")

    other_user = db.query(models.User).filter(models.User.id == other_user_id).first()
    if not other_user:
        raise HTTPException(status_code=404, detail="User not found")

    # 🔥 NORMALIZE ORDER (KEY FIX)
    user1_id = min(current_user.id, other_user_id)
    user2_id = max(current_user.id, other_user_id)

    # 🔍 single clean query
    chat = db.query(models.Chat).filter(
        models.Chat.user1_id == user1_id,
        models.Chat.user2_id == user2_id
    ).first()

    # 🆕 create if not exists
    if not chat:
        chat = models.Chat(user1_id=user1_id, user2_id=user2_id)
        db.add(chat)
        db.commit()
        db.refresh(chat)

    return {
        "id": chat.id,
        "user1_id": chat.user1_id,
        "user2_id": chat.user2_id
    }

# Get list of chats for current user
@app.get("/chats")
def get_chats(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """Get all chats for current user with latest message and unread count"""
    try:
        chats = db.query(models.Chat).filter(
            or_(
                models.Chat.user1_id == current_user.id,
                models.Chat.user2_id == current_user.id,
            )
        ).all()
        
        print(f"[DEBUG] User {current_user.id} has {len(chats)} chats")
        
        result = []
        for chat in chats:
            try:
                # Determine other user
                other_user_id = chat.user2_id if chat.user1_id == current_user.id else chat.user1_id
                other_user = db.query(models.User).filter(models.User.id == other_user_id).first()
                
                # Skip if other user doesn't exist (deleted account)
                if not other_user:
                    print(f"[DEBUG] Chat {chat.id}: Other user {other_user_id} not found, skipping")
                    continue
                
                # Get latest message
                latest_msg = db.query(models.Message).filter(
                    models.Message.chat_id == chat.id
                ).order_by(models.Message.created_at.desc()).first()
                
                # Get unread count
                unread_count = db.query(models.Message).filter(
                    models.Message.chat_id == chat.id,
                    models.Message.sender_id != current_user.id,
                    models.Message.read == False
                ).count()
                
                result.append({
                    "id": chat.id,
                    "user1_id": chat.user1_id,
                    "user2_id": chat.user2_id,
                    "created_at": chat.created_at,
                    "other_user": {
                        "id": other_user.id,
                        "email": other_user.email,
                        "name": other_user.name,
                        "avatar": other_user.avatar,
                    },
                    "last_message": {
                        "id": latest_msg.id,
                        "content": latest_msg.content,
                        "created_at": latest_msg.created_at,
                        "sender_id": latest_msg.sender_id,
                    } if latest_msg else None,
                    "unread_count": unread_count,
                })
            except Exception as e:
                print(f"[DEBUG] Error processing chat {chat.id}: {str(e)}")
                continue
        
        # Sort by latest message (most recent first)
        result.sort(key=lambda x: x["last_message"]["created_at"] if x["last_message"] else x["created_at"], reverse=True)
        
        print(f"[DEBUG] Returning {len(result)} chats to user {current_user.id}")
        return result
    except Exception as e:
        print(f"[DEBUG] Error in get_chats: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching chats: {str(e)}")


# Get messages in a chat
@app.get("/chats/{chat_id}/messages")
def get_messages(chat_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """Get all messages in a chat (user must be participant)"""
    chat = db.query(models.Chat).filter(models.Chat.id == chat_id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    # Check if user is participant
    if chat.user1_id != current_user.id and chat.user2_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not a participant in this chat")
    
    messages = db.query(models.Message).filter(
        models.Message.chat_id == chat_id
    ).order_by(models.Message.created_at.asc()).all()
    
    # Mark messages as read (if receiver)
    for msg in messages:
        if msg.sender_id != current_user.id and not msg.read:
            msg.read = True
    db.commit()
    
    return [
        {
            "id": msg.id,
            "chat_id": msg.chat_id,
            "sender_id": msg.sender_id,
            "content": msg.content,
            "created_at": msg.created_at,
            "read": msg.read,
        }
        for msg in messages
    ]


# Send a message
@app.post("/chats/{chat_id}/messages")
def send_message(chat_id: int, msg_create: schemas.MessageCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """Send a message in a chat (user must be participant)"""
    chat = db.query(models.Chat).filter(models.Chat.id == chat_id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    # Check if user is participant
    if chat.user1_id != current_user.id and chat.user2_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not a participant in this chat")
    
    new_msg = models.Message(
        chat_id=chat_id,
        sender_id=current_user.id,
        content=msg_create.content,
    )
    db.add(new_msg)
    db.commit()
    db.refresh(new_msg)
    
    return {
        "id": new_msg.id,
        "chat_id": new_msg.chat_id,
        "sender_id": new_msg.sender_id,
        "content": new_msg.content,
        "created_at": new_msg.created_at,
        "read": new_msg.read,
    }


@app.get("/locations/options")
def get_location_options():
    return CITY_AREA_MAP


# Get nearby books (area-level location matching, no precise coordinates)
@app.get("/books/nearby")
def get_nearby_books(
    area: str | None = Query(None),
    city: str | None = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Get books near the current user based on area-level matching.
    
    Privacy-first approach:
    - Only uses city + area (no GPS coordinates or precise distances)
    - Prioritizes books in user's area, then same city
    - Returns books that are available for sharing
    - Excludes user's own books
    """
    requested_city = (city or current_user.city or "").strip()
    requested_area = (area or current_user.area or "").strip()
    normalized_city = requested_city.lower()
    normalized_area = requested_area.lower()

    if not requested_city:
        return []

    rows = (
        db.query(models.Book, models.User)
        .join(models.User, models.Book.owner_id == models.User.id)
        .filter(
            func.lower(func.trim(models.Book.city)) == normalized_city,
            models.Book.availability == True,
        )
        .all()
    )

    ranked_books = []
    for book, owner in rows:
        book_area = (book.area or "").strip().lower()
        exact_area = bool(normalized_area and book_area == normalized_area)

        if normalized_area and not exact_area:
            continue

        proximity = "nearby" if exact_area else "city"
        rank = 0 if exact_area else 1
        ranked_books.append((rank, book.id, build_book_payload(book, owner, proximity)))

    ranked_books.sort(key=lambda item: (item[0], item[1]))
    return [payload for _, __, payload in ranked_books]
@app.post("/interactions")
def create_interaction(
    book_id: int,
    type: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    interaction = models.Interaction(
        user_id=current_user.id,
        book_id=book_id,
        type=type,
        weight={
            "view": 0.1,
            "click": 0.3,
            "like": 1.5,
            "save": 2.0
        }.get(type, 0.0)
    )

    db.add(interaction)
    db.commit()

    # 🔥 IMPORTANT: update preference immediately
    update_user_preference(
        db,
        current_user.id,
        book_id,
        type
    )

    return {"message": "interaction saved"}

@app.get("/users/me/preferences")
def get_my_preferences(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    prefs = db.query(models.UserPreference).filter(
        models.UserPreference.user_id == current_user.id
    ).all()

    return [
        {
            "genre_id": p.genre_id,
            "weight": p.weight
        }
        for p in prefs
    ]
