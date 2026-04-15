from pydantic import BaseModel

class BookCreate(BaseModel):
    title: str
    author: str
    review: str
    rating: int
    status: str
    image: str | None = None