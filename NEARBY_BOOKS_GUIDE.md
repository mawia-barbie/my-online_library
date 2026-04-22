# 📍 Nearby Books Feature - Privacy-First Location Discovery

## Overview

The "Nearby Books" feature allows users to discover books close to them without exposing precise locations or enabling tracking. Instead of GPS coordinates, it uses **area-level matching** (city + neighborhood).

**Privacy Principle:**

> Only share area-level information (city + neighborhood), never precise coordinates or real-time tracking.

---

## Architecture

### Data Model

#### User Fields (Added to `users` table)

```python
- city: str (e.g., "Nairobi", "Lagos", "Kampala")
- area: str (e.g., "Westlands", "CBD", "Kilimani")
```

#### Book Fields (Added to `books` table)

```python
- city: str (where the book is available)
- area: str (specific neighborhood/area)
- pickup_hint: str (optional context, e.g., "Near Sarit Centre", "At Eastleigh")
```

### API Endpoint

**GET /books/nearby**

```
Authorization: Bearer {token}
```

**Response:**

```json
[
  {
    "id": 1,
    "title": "Atomic Habits",
    "author": "James Clear",
    "city": "Nairobi",
    "area": "Westlands",
    "pickup_hint": "Near Sarit Centre",
    "proximity": "nearby", // "nearby" or "city"
    "rating": 5,
    "genre": "Self-Help",
    "image": "...",
    "owner": {
      "id": 5,
      "name": "Sarah",
      "email": "sarah@example.com"
    }
  },
  {
    "id": 2,
    "title": "Thinking, Fast and Slow",
    "author": "Daniel Kahneman",
    "city": "Nairobi",
    "area": "Kilimani",
    "pickup_hint": "Near Nairobi Hospital",
    "proximity": "city", // Same city, different area
    "rating": 4,
    "genre": "Psychology",
    "image": "...",
    "owner": {
      "id": 8,
      "name": "John",
      "email": "john@example.com"
    }
  }
]
```

**Ranking Logic:**

1. Books in **same area** → `proximity: "nearby"` (highest priority)
2. Books in **same city, different area** → `proximity: "city"` (medium priority)
3. Other books → excluded

---

## Frontend Components

### 1. Profile Update UI (`src/pages/Profile.jsx`)

Users can now set their location in their profile:

```jsx
<div className="grid grid-cols-2 gap-3 mb-3">
  <input
    value={city}
    onChange={(e) => setCity(e.target.value)}
    placeholder="City (e.g., Nairobi)"
    className="border p-2 rounded"
  />
  <input
    value={area}
    onChange={(e) => setArea(e.target.value)}
    placeholder="Area (e.g., Westlands)"
    className="border p-2 rounded"
  />
</div>
```

**Location Display:**

```jsx
{
  profile?.city && (
    <p className="text-sm text-indigo-600 mt-2">
      📍 {profile.area || "Area"}, {profile.city}
    </p>
  );
}
```

### 2. Nearby Books Page (`src/pages/NearbyBooks.jsx`)

Full-featured page for discovering nearby books:

**Features:**

- ✅ Filters: "All Books" vs "My Area Only"
- ✅ Grouping: Books organized by area
- ✅ "Nearby" badge: Green badge on same-area books
- ✅ Pickup hints: Helpful context for meetup
- ✅ Owner info: Display seller profile
- ✅ Responsive: Works on mobile & desktop
- ✅ Privacy: No coordinates or distance meters

**Layout:**

```
┌─────────────────────────────────────┐
│ 📍 Nearby Books                      │
│ 📍 Westlands, Nairobi               │
├─────────────────────────────────────┤
│ [All Books (12)] [My Area (5)]       │
├─────────────────────────────────────┤
│ 📍 Westlands (5 books)               │
│ ┌──────────┐ ┌──────────┐ ...       │
│ │ Atomic   │ │ Thinking │           │
│ │ Habits   │ │ Fast...  │           │
│ │ ✓ Nearby │ │ ✓ Nearby │           │
│ │ [Contact]│ │ [Contact]│           │
│ └──────────┘ └──────────┘           │
│                                      │
│ 📍 Kilimani (7 books)                │
│ ┌──────────┐ ┌──────────┐ ...       │
│ │ Book 3   │ │ Book 4   │           │
│ │ [Contact]│ │ [Contact]│           │
│ └──────────┘ └──────────┘           │
└─────────────────────────────────────┘
```

### 3. Navbar Update

Added "Nearby" link with map pin icon:

```jsx
<Link
  to="/nearby"
  className="text-gray-700 hover:text-gray-900 font-medium flex items-center gap-1"
>
  <MapPin size={18} />
  Nearby
</Link>
```

---

## User Flow

### 1. Setup (First Time)

```
1. User registers/logs in
2. User clicks "My Profile" → "Edit Profile"
3. User enters:
   - City: "Nairobi"
   - Area: "Westlands"
4. User clicks "Save"
5. Location is now stored
```

### 2. Browse Nearby Books

```
1. User clicks "Nearby" in navbar
2. System fetches GET /books/nearby
3. Backend returns:
   - Books in user's area first (5 books)
   - Books in same city next (10 books)
4. Frontend displays grouped by area
5. User sees "✓ Nearby" badge on same-area books
6. User can filter: "All Books" or "My Area Only"
```

### 3. Contact Seller

```
1. User clicks "Contact Seller" on a book
2. Redirects to /users page
3. User can click "Chat" button for that user
4. Chat opens where users coordinate meetup
5. Users exchange location details manually in chat
   (Example: "Meet at Sarit Centre, ground floor")
```

---

## Privacy & Security

### ✅ What We DO Protect

- **No GPS coordinates** stored or shared
- **No real-time tracking** implemented
- **No distance calculations** (e.g., "0.5 km away")
- **No precise location maps** with pins
- **No user tracking** between sessions
- **No location history** stored

### ✅ Privacy Features

1. **Area-Level Only:** Neighborhoods, not buildings
2. **User Choice:** Users opt-in by setting location
3. **Manual Coordination:** Meetup details in chat, not automated
4. **No Background Tracking:** Location only used on request
5. **Data Minimization:** Only city + area, nothing else

### Example - Safe vs Unsafe

❌ **UNSAFE:**

```json
{
  "latitude": 1.2921,
  "longitude": 36.8219,
  "distance": "0.5 km",
  "timestamp": "2026-04-21T10:30:00Z"
}
```

✅ **SAFE:**

```json
{
  "city": "Nairobi",
  "area": "Westlands",
  "pickup_hint": "Near Sarit Centre",
  "proximity": "nearby"
}
```

---

## Database Schema

### Users Table (Added Columns)

```sql
ALTER TABLE users ADD COLUMN city TEXT;
ALTER TABLE users ADD COLUMN area TEXT;
```

### Books Table (Added Columns)

```sql
ALTER TABLE books ADD COLUMN city TEXT;
ALTER TABLE books ADD COLUMN area TEXT;
ALTER TABLE books ADD COLUMN pickup_hint TEXT;
```

### Migration Helper

The backend includes automatic migration for existing databases:

```python
def ensure_users_columns():
    # Automatically adds city, area columns
    ...

def ensure_books_columns():
    # Automatically adds city, area, pickup_hint columns
    ...
```

---

## API Endpoints

### Update User Profile (Extended)

```
PUT /users/me
Content-Type: application/json
Authorization: Bearer {token}

{
  "name": "Sarah",
  "bio": "Love reading",
  "city": "Nairobi",
  "area": "Westlands",
  "avatar": "data:image/png;base64,..."
}

Response: 200 OK
{
  "id": 5,
  "email": "sarah@example.com",
  "name": "Sarah",
  "bio": "Love reading",
  "city": "Nairobi",
  "area": "Westlands",
  "avatar": "..."
}
```

### Update Book (Extended)

```
PUT /books/{book_id}
Content-Type: application/json
Authorization: Bearer {token}

{
  "title": "Atomic Habits",
  "city": "Nairobi",
  "area": "Westlands",
  "pickup_hint": "Near Sarit Centre",
  "availability": true
}

Response: 200 OK
{
  "id": 1,
  "title": "Atomic Habits",
  "city": "Nairobi",
  "area": "Westlands",
  "pickup_hint": "Near Sarit Centre",
  ...
}
```

### Get Nearby Books

```
GET /books/nearby
Authorization: Bearer {token}

Response: 200 OK
[
  { "id": 1, "proximity": "nearby", ... },
  { "id": 2, "proximity": "nearby", ... },
  { "id": 3, "proximity": "city", ... },
  ...
]
```

---

## Testing Checklist

### Setup

- [ ] Create 2 test user accounts
- [ ] Set location for both users: City = "Nairobi", Area = "Westlands"
- [ ] Create books for both users with matching city/area
- [ ] Create books with same city but different area

### Profile Update

- [ ] Edit profile and add city
- [ ] Edit profile and add area
- [ ] Verify location displays on profile (📍 Area, City)
- [ ] Verify location is saved

### Nearby Books Page

- [ ] Navigate to /nearby
- [ ] Verify page shows "📍 Your area, Your city"
- [ ] Verify "All Books" button shows count
- [ ] Verify "My Area Only" button shows count
- [ ] Verify books are grouped by area
- [ ] Verify same-area books have "✓ Nearby" badge (green)
- [ ] Verify different-area books don't have badge

### Filtering

- [ ] Click "My Area Only" filter
- [ ] Verify only same-area books show (with "nearby" badge)
- [ ] Click "All Books" filter
- [ ] Verify all nearby books show (same area + same city)

### Book Details

- [ ] Verify book title, author, rating display
- [ ] Verify location shows: 📍 Area, City
- [ ] Verify pickup_hint displays if set
- [ ] Verify owner info displays
- [ ] Verify "Contact Seller" button works

### No Location Set

- [ ] Log in with user that has no city
- [ ] Navigate to /nearby
- [ ] Verify message: "Set Your Location"
- [ ] Verify link to profile works

### Mobile

- [ ] Test on mobile screen (375px)
- [ ] Verify responsive layout
- [ ] Verify buttons are tappable
- [ ] Verify text is readable

### Privacy

- [ ] Verify no GPS coordinates in API response
- [ ] Verify no distance meters displayed
- [ ] Verify no real-time location tracking
- [ ] Verify coordinates are NOT in response JSON

---

## Configuration

### City/Area Options

The app is designed to work with any city/area combination. Examples:

**Nairobi (Kenya)**

- Westlands
- CBD
- Kilimani
- Lavington
- Parklands
- Eastleigh
- Gigiri

**Lagos (Nigeria)**

- VI (Victoria Island)
- Lekki
- Ikoyi
- Yaba
- Ikeja

**Kampala (Uganda)**

- CBD
- Kololo
- Ntinda
- Makindye

**Etc. for any city**

Users can enter any city/area they want - no validation required.

---

## Future Enhancements

### Level 2: Neighborhoods

- [ ] Pre-defined area lists per city
- [ ] Dropdown selectors instead of free text
- [ ] Area slugs for URL mapping

### Level 3: Radius Matching

- [ ] Optional: "Also show books 2 areas away"
- [ ] Distance-based ranking (but NOT showing exact km)
- [ ] "Sort by proximity" toggle

### Level 4: Advanced Filters

- [ ] Filter by author, genre, rating
- [ ] Sort by newest, most popular
- [ ] Save favorite sellers
- [ ] "Wishlists" for books to watch

### Level 5: Offline Features

- [ ] Download book listings
- [ ] Offline meeting coordinates
- [ ] QR codes for book pickup

---

## Troubleshooting

### Problem: "No conversations yet" message on /nearby

**Cause:** User hasn't set location

**Solution:**

1. Go to /profile/{userId}
2. Click "Edit Profile"
3. Set city and area
4. Click "Save"

### Problem: No books showing even with location set

**Cause:** No books available in user's area

**Cause:** Books don't have city/area set

**Solution:**

1. Create a test book with city/area matching user's location
2. Or update existing books with location info

### Problem: All books show "proximity: city" instead of "nearby"

**Cause:** Books have different area than user

**Solution:**

1. Edit book: PUT /books/{id}
2. Set area to match user's area
3. Send request

### Problem: Location not showing on profile

**Cause:** API not updated with new fields

**Solution:**

1. Check backend migration ran
2. Verify database has city/area columns
3. Restart backend server

---

## Files Modified

### Backend

- `backend/models.py` - Added city, area, pickup_hint fields
- `backend/schemas.py` - Added location fields to schemas
- `backend/main.py` - Added GET /books/nearby endpoint & migration helpers

### Frontend

- `bookapp/src/pages/NearbyBooks.jsx` - New page for nearby books
- `bookapp/src/pages/Profile.jsx` - Added city/area input fields
- `bookapp/src/components/Navbar.jsx` - Added "Nearby" link
- `bookapp/src/App.jsx` - Added /nearby route

### Database

- `backend/books.db` - Auto-migrated with new columns

---

## Code Examples

### Update User with Location

```javascript
const handleSave = async () => {
  const token = localStorage.getItem("token");
  const body = {
    name,
    bio,
    avatar,
    city: "Nairobi", // New
    area: "Westlands", // New
  };

  const res = await fetch("http://127.0.0.1:8000/users/me", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
};
```

### Fetch Nearby Books

```javascript
const fetchNearbyBooks = () => {
  const token = localStorage.getItem("token");

  fetch("http://127.0.0.1:8000/books/nearby", {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then((res) => res.json())
    .then((data) => {
      // data[0] = { proximity: "nearby", area: "Westlands", ... }
      // data[1] = { proximity: "city", area: "Kilimani", ... }
      setNearbyBooks(data);
    });
};
```

### Display Books Grouped by Area

```javascript
const groupedByArea = nearbyBooks.reduce((acc, book) => {
  const area = book.area || "Unknown Area";
  if (!acc[area]) acc[area] = [];
  acc[area].push(book);
  return acc;
}, {});

// Render:
Object.entries(groupedByArea).map(([area, books]) => (
  <div key={area}>
    <h2>
      📍 {area} ({books.length})
    </h2>
    {books.map((book) => (
      <BookCard
        key={book.id}
        book={book}
        proximity={book.proximity} // "nearby" or "city"
      />
    ))}
  </div>
));
```

---

## Summary

✅ **Nearby Books Feature:**

- Privacy-first: area-level only, no coordinates
- User-friendly: simple city + area fields
- Discovery-focused: grouped by neighborhood
- Safe: no tracking or real-time location
- Extensible: ready for future enhancements

**Users can now safely discover books close to them while maintaining complete privacy!**
