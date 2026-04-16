from pydantic import BaseModel

class BookCreate(BaseModel):
    title: str
    author: str
    review: str
    rating: int
    status: str
    image: str | None = None
    availability: bool | None = True
    owner_id: int | None = None

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