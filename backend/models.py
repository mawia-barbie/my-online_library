from sqlalchemy import Column, Integer, String
from database import Base

class Book(Base):
    __tablename__ = "books"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    author = Column(String)
    review = Column(String)
    rating = Column(Integer)
    status = Column(String)
    image = Column(String)  # store image URL/base64 for MVP