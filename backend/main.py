from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware  # 👈 ADD THIS
from sqlalchemy.orm import Session

from database import engine, Base, SessionLocal
import models, schemas

Base.metadata.create_all(bind=engine)

app = FastAPI()

# 👇 ADD CORS RIGHT HERE
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # allow frontend (React)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# DB dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ➕ CREATE BOOK
@app.post("/books")
def create_book(book: schemas.BookCreate, db: Session = Depends(get_db)):
    new_book = models.Book(**book.dict())
    db.add(new_book)
    db.commit()
    db.refresh(new_book)
    return new_book


# 📖 GET BOOKS
@app.get("/books")
def get_books(db: Session = Depends(get_db)):
    return db.query(models.Book).all()


# ❌ DELETE BOOK
@app.delete("/books/{book_id}")
def delete_book(book_id: int, db: Session = Depends(get_db)):
    book = db.query(models.Book).filter(models.Book.id == book_id).first()
    db.delete(book)
    db.commit()
    return {"message": "deleted"}