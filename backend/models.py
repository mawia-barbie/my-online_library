from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, DateTime, Text, Float
from datetime import datetime
from database import Base
from sqlalchemy.orm import relationship

class Book(Base):
    __tablename__ = "books"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    author = Column(String, nullable=False)
    review = Column(String)
    rating = Column(Integer)
    status = Column(String)
    genre_id = Column(Integer, ForeignKey("genres.id"), nullable=False)
    genre = relationship("Genre", back_populates="books")
    genre_tags = Column(Text, nullable=True)
    image = Column(String)  # store image URL/base64 for 
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    availability = Column(Boolean, default=True)
    # Location fields (area-level only, no precise coordinates)
    city = Column(String, nullable=False)
    area = Column(String, nullable=True)
    pickup_hint = Column(String, nullable=True)
    location_display_name = Column(String, nullable=True)
    location_latitude = Column(Float, nullable=True)
    location_longitude = Column(Float, nullable=True)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String)
    # profile fields
    name = Column(String, nullable=True)
    bio = Column(String, nullable=True)
    avatar = Column(String, nullable=True)  # store image URL or base64
    interests = Column(Text, nullable=True)
    # Location fields (area-level only, no precise coordinates)
    city = Column(String, nullable=True)
    area = Column(String, nullable=True)
    location_display_name = Column(String, nullable=True)
    location_latitude = Column(Float, nullable=True)
    location_longitude = Column(Float, nullable=True)

class Chat(Base):
    __tablename__ = "chats"

    id = Column(Integer, primary_key=True, index=True)
    user1_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    user2_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    # Ensures each pair of users has only one chat conversation
    __table_args__ = ()

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    chat_id = Column(Integer, ForeignKey("chats.id"), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    read = Column(Boolean, default=False)
class Genre(Base):
    __tablename__ = "genres"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    books = relationship("Book", back_populates="genre")