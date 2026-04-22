# 📍 Nearby Books - Architecture & Flow Diagrams

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         React Frontend                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐        ┌──────────────────┐              │
│  │   Profile.jsx    │        │  NearbyBooks.jsx │              │
│  │                  │        │                  │              │
│  │ Edit Location:   │        │ Browse Books:    │              │
│  │ - City input     │        │ - Filter UI      │              │
│  │ - Area input     │        │ - Book cards     │              │
│  │ - Save to API    │        │ - Grouping       │              │
│  └────────┬─────────┘        └────────┬─────────┘              │
│           │                           │                        │
│           │ PUT /users/me             │ GET /books/nearby      │
│           │ {city, area}              │                        │
│           └───────────┬───────────────┘                        │
│                       │                                        │
│            ┌──────────v──────────┐                             │
│            │   Navbar.jsx        │                             │
│            │ - "Nearby" link     │                             │
│            │ - MapPin icon       │                             │
│            └─────────────────────┘                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                            │
                  HTTP API (FastAPI)
                            │
┌─────────────────────────────────────────────────────────────────┐
│                      FastAPI Backend                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Endpoints:                                            │    │
│  │  • PUT /users/me                                       │    │
│  │    └─ Updates user.city, user.area                    │    │
│  │  • GET /books/nearby                                   │    │
│  │    ├─ Fetch current user location                     │    │
│  │    ├─ Query books WHERE city = user.city             │    │
│  │    ├─ Rank by area match                             │    │
│  │    └─ Return { proximity, area, city, ... }          │    │
│  │  • PUT /books/{id}                                     │    │
│  │    └─ Updates book.city, book.area, pickup_hint      │    │
│  └────────────────────────────────────────────────────────┘    │
│                       │                                         │
│                       │ SQLAlchemy ORM                          │
│                       │                                         │
│  ┌────────────────────v─────────────────────────────────┐      │
│  │  Database Models:                                    │      │
│  │  • User { city, area }                               │      │
│  │  • Book { city, area, pickup_hint }                 │      │
│  │  • Chat, Message (unchanged)                         │      │
│  └────────────────────────────────────────────────────────┘    │
│                       │                                         │
└───────────────────────┼─────────────────────────────────────────┘
                        │
┌───────────────────────v─────────────────────────────────────────┐
│                   SQLite Database                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  users table:                 books table:                      │
│  ├─ id                        ├─ id                             │
│  ├─ email                     ├─ title                          │
│  ├─ name                      ├─ author                         │
│  ├─ avatar                    ├─ owner_id                       │
│  ├─ city ⭐                    ├─ city ⭐                         │
│  └─ area ⭐                    ├─ area ⭐                         │
│                               ├─ pickup_hint ⭐                 │
│                               └─ ... (other fields)             │
│                                                                  │
│  ⭐ = New fields for location feature                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## User Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                       Start: User                           │
├─────────────────────────────────────────────────────────────┤
│                          │                                  │
└──────────────────────────┼──────────────────────────────────┘
                           │
                    ┌──────v──────┐
                    │ Click on    │
                    │ "My Profile"│
                    └──────┬──────┘
                           │
                    ┌──────v──────────────┐
                    │ Click "Edit Profile"│
                    └──────┬───────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
  ┌─────v────┐      ┌──────v──────┐    ┌────v────┐
  │ Edit Name │      │ Edit Bio    │    │  Enter  │
  │           │      │             │    │ Location│
  └───────────┘      └─────────────┘    └────┬────┘
                                             │
                                 ┌───────────v────────────┐
                                 │ City: "Nairobi"        │
                                 │ Area: "Westlands"      │
                                 └───────────┬────────────┘
                                             │
                                 ┌───────────v──────┐
                                 │ Click "Save"     │
                                 │ PUT /users/me    │
                                 └───────────┬──────┘
                                             │
                          ┌──────────────────v──────────────────┐
                          │ Location Saved Successfully          │
                          └──────────────────┬──────────────────┘
                                             │
                                   ┌─────────v─────────┐
                                   │ Click "Nearby" in │
                                   │ navbar            │
                                   └─────────┬─────────┘
                                             │
                        ┌────────────────────v────────────────────┐
                        │ Navigate to /nearby                      │
                        │ GET /books/nearby API call              │
                        └────────────────────┬────────────────────┘
                                             │
                    ┌────────────────────────v────────────────────┐
                    │ Display Books Grouped by Area:              │
                    │                                              │
                    │ 📍 Westlands (5 books) ✓ Same as user       │
                    │   ├─ Book 1: "Atomic Habits" [✓ Nearby]    │
                    │   ├─ Book 2: "Thinking Fast" [✓ Nearby]    │
                    │   └─ ...                                    │
                    │                                              │
                    │ 📍 Kilimani (3 books) - Different area      │
                    │   ├─ Book 6: "The 7 Habits" [Same City]    │
                    │   └─ ...                                    │
                    │                                              │
                    └────────────────────┬────────────────────────┘
                                         │
                        ┌────────────────v──────────────┐
                        │ Click "Contact Seller"        │
                        │ on a book                      │
                        └────────────────┬───────────────┘
                                         │
                        ┌────────────────v──────────────┐
                        │ Navigate to /users             │
                        │ (existing user search)         │
                        └────────────────┬───────────────┘
                                         │
                        ┌────────────────v──────────────┐
                        │ Click "Chat" on seller        │
                        │ Create/Open chat              │
                        └────────────────┬───────────────┘
                                         │
                        ┌────────────────v──────────────┐
                        │ Chat window opens             │
                        │ Users coordinate meetup       │
                        │ "Meet at Sarit, ground floor" │
                        │                               │
                        │ Exchange details manually     │
                        │ (privacy-first approach)      │
                        └───────────────────────────────┘
```

---

## Data Flow: GET /books/nearby

```
┌─────────────────────────────────────────────────┐
│ Client: GET /books/nearby (with Bearer token)   │
└────────────────────┬────────────────────────────┘
                     │
         ┌───────────v───────────┐
         │ FastAPI Endpoint      │
         │ get_nearby_books()    │
         └───────────┬───────────┘
                     │
         ┌───────────v──────────────────────────────┐
         │ 1. Validate Bearer Token                 │
         │    └─ Extract user_id                    │
         └───────────┬──────────────────────────────┘
                     │
         ┌───────────v──────────────────────────────┐
         │ 2. Get Current User                      │
         │    ├─ Query: User.id == user_id          │
         │    └─ Result: User { id, city, area }    │
         └───────────┬──────────────────────────────┘
                     │
         ┌───────────v──────────────────────────────┐
         │ 3. Check User Location                   │
         │    ├─ If user.city == NULL               │
         │    │  └─ Return empty array []           │
         │    └─ Otherwise continue...              │
         └───────────┬──────────────────────────────┘
                     │
         ┌───────────v──────────────────────────────┐
         │ 4. Query Books in Same City              │
         │    WHERE:                                │
         │    ├─ book.city == user.city             │
         │    ├─ book.availability == TRUE          │
         │    ├─ book.owner_id != current_user.id   │
         │    └─ book.owner_id != NULL              │
         └───────────┬──────────────────────────────┘
                     │
         ┌───────────v──────────────────────────────┐
         │ 5. Rank Books by Proximity               │
         │                                          │
         │ Priority 1: Same Area                    │
         │ ├─ books WHERE area == user.area        │
         │ └─ Set: proximity = "nearby"             │
         │                                          │
         │ Priority 2: Different Area               │
         │ ├─ books WHERE area != user.area        │
         │ └─ Set: proximity = "city"               │
         └───────────┬──────────────────────────────┘
                     │
         ┌───────────v──────────────────────────────┐
         │ 6. Fetch Owner Info for Each Book        │
         │    FOR each book:                        │
         │    ├─ owner = User.get(book.owner_id)   │
         │    ├─ Extract: id, name, email          │
         │    └─ Attach to book data               │
         └───────────┬──────────────────────────────┘
                     │
         ┌───────────v──────────────────────────────┐
         │ 7. Build Response                        │
         │                                          │
         │ FOR each book:                           │
         │ {                                        │
         │   "id": 1,                               │
         │   "title": "Atomic Habits",              │
         │   "author": "James Clear",               │
         │   "city": "Nairobi",                     │
         │   "area": "Westlands",                   │
         │   "pickup_hint": "Near Sarit",           │
         │   "proximity": "nearby",  ← Ranking      │
         │   "owner": { ... },       ← Owner info   │
         │   ... (other fields)                     │
         │ }                                        │
         │                                          │
         │ NOTE: NO coordinates, NO distance       │
         └───────────┬──────────────────────────────┘
                     │
         ┌───────────v──────────────────────────────┐
         │ 8. Return Response (JSON)                │
         │    HTTP 200 OK                           │
         │    [ book1, book2, book3, ... ]          │
         └───────────┬──────────────────────────────┘
                     │
┌────────────────────v────────────────────────────┐
│ Client Receives Array of Books                  │
│ Frontend Groups by Area & Displays              │
└─────────────────────────────────────────────────┘
```

---

## Privacy Design

```
┌──────────────────────────────────────────────────────────┐
│           What Gets Shared                               │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ✅ SAFE TO SHARE:                                      │
│  ├─ City name: "Nairobi"                               │
│  ├─ Area/Neighborhood: "Westlands"                      │
│  ├─ Pickup hint: "Near Sarit Centre"                    │
│  └─ User wants to meet anyway → info in chat           │
│                                                          │
│  ❌ NEVER SHARE:                                        │
│  ├─ GPS coordinates: (1.2921°, 36.8219°)              │
│  ├─ Precise distance: "0.5 km away"                     │
│  ├─ Real-time location: "Location updated now"         │
│  ├─ Location history: "User was here 5 mins ago"       │
│  ├─ Exact address: "Apartment 42, Block C"             │
│  └─ Live tracking: Background location update          │
│                                                          │
└──────────────────────────────────────────────────────────┘
                     │
     ┌───────────────┼───────────────┐
     │               │               │
┌────v────────┐ ┌──v────────┐ ┌───v─────────┐
│ Before:     │ │ Instead:  │ │ Result:     │
│ "I'm at     │ │ "Meet at  │ │ Users can   │
│ coordinates │ │ Sarit     │ │ coordinate  │
│ (1.29,36.8) │ │ Centre,   │ │ safely in   │
│ 0.5km away" │ │ ground    │ │ chat without │
│             │ │ floor"    │ │ tracking    │
│ ⚠️ STALKING │ │           │ │ ✅ PRIVACY  │
│ RISK        │ │           │ │             │
└─────────────┘ └───────────┘ └─────────────┘
```

---

## Book Grouping Logic

```
GET /books/nearby Response:
[
  { id: 1, area: "Westlands", proximity: "nearby" },
  { id: 2, area: "Westlands", proximity: "nearby" },
  { id: 3, area: "Westlands", proximity: "nearby" },
  { id: 4, area: "Kilimani",  proximity: "city" },
  { id: 5, area: "Kilimani",  proximity: "city" },
  { id: 6, area: "CBD",       proximity: "city" },
]

Frontend Groups By Area:
┌─────────────────────────────────────┐
│ 📍 Westlands (3) - Your Area        │
├─────────────────────────────────────┤
│ [Book 1] [Book 2] [Book 3]         │
│  ✓ Nearby  ✓ Nearby  ✓ Nearby      │
├─────────────────────────────────────┤
│ 📍 Kilimani (2)                     │
├─────────────────────────────────────┤
│ [Book 4] [Book 5]                  │
├─────────────────────────────────────┤
│ 📍 CBD (1)                          │
├─────────────────────────────────────┤
│ [Book 6]                            │
└─────────────────────────────────────┘

Filter: "My Area Only"
┌─────────────────────────────────────┐
│ 📍 Westlands (3) - Your Area        │
├─────────────────────────────────────┤
│ [Book 1] [Book 2] [Book 3]         │
│  ✓ Nearby  ✓ Nearby  ✓ Nearby      │
└─────────────────────────────────────┘
```

---

## Component Hierarchy

```
App
├─ Navbar (with "Nearby" link)
├─ Routes
│  ├─ /nearby
│  │  └─ RequireAuth
│  │     └─ NearbyBooks
│  │        ├─ Header with user location
│  │        ├─ Filter buttons
│  │        ├─ Books grid (grouped by area)
│  │        │  ├─ BookCard
│  │        │  │  ├─ Image
│  │        │  │  ├─ "Nearby" badge (conditional)
│  │        │  │  ├─ Location: 📍 Area, City
│  │        │  │  ├─ Pickup hint (conditional)
│  │        │  │  ├─ Owner info
│  │        │  │  └─ "Contact Seller" button
│  │        │  └─ ...
│  │        └─ Empty/Loading states
│  │
│  ├─ /profile/:id
│  │  └─ Profile
│  │     ├─ Sidebar (profile info + location display)
│  │     │  └─ 📍 Area, City (conditional)
│  │     ├─ Edit form (when editing)
│  │     │  ├─ Name input
│  │     │  ├─ Bio textarea
│  │     │  ├─ City input ⭐
│  │     │  └─ Area input ⭐
│  │     └─ Books grid
│  │
│  └─ /chats
│     └─ Chats page
│
│  (Other existing routes...)
└─ AuthContext (provides user with city/area)
```

---

## Database Changes

```
BEFORE:
┌────────────────────────┐     ┌────────────────────────┐
│      users             │     │      books             │
├────────────────────────┤     ├────────────────────────┤
│ id                     │     │ id                     │
│ email                  │     │ title                  │
│ password               │     │ author                 │
│ name                   │     │ review                 │
│ bio                    │     │ rating                 │
│ avatar                 │     │ status                 │
│                        │     │ genre                  │
│                        │     │ image                  │
│                        │     │ owner_id               │
│                        │     │ availability           │
└────────────────────────┘     └────────────────────────┘

AFTER:
┌────────────────────────┐     ┌────────────────────────┐
│      users             │     │      books             │
├────────────────────────┤     ├────────────────────────┤
│ id                     │     │ id                     │
│ email                  │     │ title                  │
│ password               │     │ author                 │
│ name                   │     │ review                 │
│ bio                    │     │ rating                 │
│ avatar                 │     │ status                 │
│ city ⭐                │     │ genre                  │
│ area ⭐                │     │ image                  │
│                        │     │ owner_id               │
│                        │     │ availability           │
│                        │     │ city ⭐                │
│                        │     │ area ⭐                │
│                        │     │ pickup_hint ⭐         │
└────────────────────────┘     └────────────────────────┘

⭐ = New fields
```

---

## Error Handling Flow

```
Request: GET /books/nearby

┌─ No token?
│  └─ Return 401 Unauthorized
│
├─ Invalid token?
│  └─ Return 401 Unauthorized
│
├─ User not found?
│  └─ Return 401 Unauthorized
│
├─ User.city is NULL?
│  └─ Return 200 OK with empty array []
│
├─ Books query fails?
│  └─ Return 500 Internal Server Error
│     └─ Log error with [DEBUG] prefix
│
└─ Success!
   └─ Return 200 OK with books array
      └─ Sorted by proximity
```

---

## Timeline: Getting Nearby Books

```
User navigates to /nearby
         │
         ├─ Frontend checks auth ✓
         │
         ├─ Component mounts
         │  └─ useEffect triggers
         │
         ├─ fetch("GET /books/nearby")
         │
         ├─ Backend processes:
         │  ├─ Validate token        (10ms)
         │  ├─ Get current user      (5ms)
         │  ├─ Query books           (50ms)
         │  ├─ Rank by proximity     (10ms)
         │  ├─ Fetch owner info      (30ms)
         │  └─ Build response        (5ms)
         │     Total: ~100-150ms
         │
         ├─ Response received
         │
         ├─ Frontend processes:
         │  ├─ Parse JSON            (2ms)
         │  ├─ Normalize data        (5ms)
         │  ├─ Group by area         (10ms)
         │  └─ Render UI             (20ms)
         │     Total: ~35-40ms
         │
         └─ Books displayed on screen ✓
            Total latency: ~150-200ms
```

---

These diagrams show the complete architecture, flow, privacy model, and component structure of the Nearby Books feature!
