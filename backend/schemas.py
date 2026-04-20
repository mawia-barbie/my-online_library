from pydantic import BaseModel

class BookCreate(BaseModel):
    title: str
    author: str
    review: str
    rating: int
    status: str
    genre: str | None = None
    image: str | None = None
    availability: bool | None = True
    owner_id: int | None = None

class BookUpdate(BaseModel):
    title: str | None = None
    author: str | None = None
    review: str | None = None
    rating: int | None = None
    status: str | None = None
    genre: str | None = None
    image: str | None = None
    availability: bool | None = None

class UserCreate(BaseModel):
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserOut(BaseModel):
    id: int
    email: str
    name: str | None = None
    bio: str | None = None
    avatar: str | None = None
    class Config:
        orm_mode = True

class UserUpdate(BaseModel):
    name: str | None = None
    bio: str | None = None
    avatar: str | None = None