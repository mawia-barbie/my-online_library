from sqlalchemy import Column, Integer, String, ForeignKey, Boolean
from database import Base

class Book(Base):
    __tablename__ = "books"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    author = Column(String)
    review = Column(String)
    rating = Column(Integer)
    status = Column(String)
    genre = Column(String, nullable=True)
    image = Column(String)  # store image URL/base64 for 
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    availability = Column(Boolean, default=True)
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String)
    # profile fields
    name = Column(String, nullable=True)
    bio = Column(String, nullable=True)
    avatar = Column(String, nullable=True)  # store image URL or base64