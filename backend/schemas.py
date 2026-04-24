from pydantic import BaseModel
from datetime import datetime

class BookCreate(BaseModel):
    title: str
    author: str
    review: str
    rating: int
    status: str
    genre: str | None = None
    genre_tags: list[str] | None = None
    image: str | None = None
    availability: bool | None = True
    owner_id: int | None = None
    city: str | None = None
    area: str | None = None
    pickup_hint: str | None = None
    location_display_name: str | None = None
    location_latitude: float | None = None
    location_longitude: float | None = None

class BookUpdate(BaseModel):
    title: str | None = None
    author: str | None = None
    review: str | None = None
    rating: int | None = None
    status: str | None = None
    genre: str | None = None
    genre_tags: list[str] | None = None
    image: str | None = None
    availability: bool | None = None
    city: str | None = None
    area: str | None = None
    pickup_hint: str | None = None
    location_display_name: str | None = None
    location_latitude: float | None = None
    location_longitude: float | None = None

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
    interests: list[str] | None = None
    city: str | None = None
    area: str | None = None
    location_display_name: str | None = None
    location_latitude: float | None = None
    location_longitude: float | None = None
    class Config:
        orm_mode = True

class UserUpdate(BaseModel):
    name: str | None = None
    bio: str | None = None
    avatar: str | None = None
    interests: list[str] | None = None
    city: str | None = None
    area: str | None = None
    location_display_name: str | None = None
    location_latitude: float | None = None
    location_longitude: float | None = None


class LocationSuggestion(BaseModel):
    display_name: str
    public_label: str
    latitude: float
    longitude: float

class MessageCreate(BaseModel):
    content: str

class MessageOut(BaseModel):
    id: int
    chat_id: int
    sender_id: int
    content: str
    created_at: datetime
    read: bool
    class Config:
        orm_mode = True

class ChatOut(BaseModel):
    id: int
    user1_id: int
    user2_id: int
    created_at: datetime
    class Config:
        orm_mode = True

class ChatDetailOut(BaseModel):
    id: int
    user1_id: int
    user2_id: int
    created_at: datetime
    other_user: UserOut
    last_message: MessageOut | None = None
    unread_count: int = 0
    class Config:
        orm_mode = True
