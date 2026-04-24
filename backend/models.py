from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, DateTime, Text, Float
from datetime import datetime
from database import Base
from sqlalchemy.orm import relationship
from sqlalchemy import UniqueConstraint


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
    interactions = relationship("Interaction", back_populates="user")
    preferences = relationship("UserPreference", back_populates="user")
    books = relationship("Book", back_populates="owner")
class Chat(Base):
    __tablename__ = "chats"

    id = Column(Integer, primary_key=True, index=True)
    user1_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    user2_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("user1_id", "user2_id", name="uq_chat_pair"),
    )

    # ADD THIS LINE
    messages = relationship("Message", back_populates="chat")

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    chat_id = Column(Integer, ForeignKey("chats.id"), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    read = Column(Boolean, default=False)
    chat = relationship("Chat", back_populates="messages")
    sender = relationship("User")
class Genre(Base):
    __tablename__ = "genres"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    books = relationship("Book", back_populates="genre")
    preferences = relationship("UserPreference", back_populates="genre")
class Interaction(Base):
    __tablename__ = "interactions"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    book_id = Column(Integer, ForeignKey("books.id"), nullable=False)

    type = Column(String, nullable=False)  
    # examples: "view", "like", "save", "click"
    weight = Column(Float, default=1.0)

    created_at = Column(DateTime, default=datetime.utcnow)
    user = relationship("User", back_populates="interactions")
    book = relationship("Book", back_populates="interactions")
class UserPreference(Base):
    __tablename__ = "user_preferences"

    __table_args__ = (
    UniqueConstraint("user_id", "genre_id", name="uq_user_genre"),
    )


    id = Column(Integer, primary_key=True)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    genre_id = Column(Integer, ForeignKey("genres.id"), nullable=True)

    weight = Column(Float, default=0.0)  # learned preference strength
    user = relationship("User", back_populates="preferences")
    genre = relationship("Genre", back_populates="preferences")

class Book(Base):
    __tablename__ = "books"

    id = Column(Integer, primary_key=True)
    title = Column(String)
    author = Column(String, nullable=False)
    review = Column(String)
    rating = Column(Integer)
    status = Column(String)
    image = Column(String)
    owner_id = Column(Integer, ForeignKey("users.id"))
    genre_id = Column(Integer, ForeignKey("genres.id"))

    owner = relationship("User", back_populates="books")
    genre = relationship("Genre", back_populates="books")
    interactions = relationship("Interaction", back_populates="book")