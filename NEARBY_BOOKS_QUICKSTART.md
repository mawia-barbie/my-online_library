# 🚀 Nearby Books - Quick Start

## What's New?

Users can now discover books in their area without exposing their precise location!

## How It Works

### 1. Set Your Location (Profile)

- Go to "My Profile"
- Click "Edit Profile"
- Enter City (e.g., "Nairobi") and Area (e.g., "Westlands")
- Click "Save"

### 2. Browse Nearby Books

- Click "Nearby" in the navbar (📍 icon)
- See books grouped by neighborhood
- Filter: "All Books" or "My Area Only"
- Green "✓ Nearby" badge = same neighborhood

### 3. Contact Seller

- Click "Contact Seller"
- Chat to coordinate meetup
- No automated location sharing

---

## Privacy First 🔒

✅ **Safe:** Only area-level (city + neighborhood), no GPS
✅ **Private:** No tracking between sessions
✅ **Controlled:** Users choose what to share
✅ **Manual:** Meetup details in chat

---

## Try It Now

**As User A:**

1. Go to Profile
2. Set City: "Nairobi", Area: "Westlands"
3. Add a book with same location
4. Save

**As User B:**

1. Go to Profile
2. Set City: "Nairobi", Area: "Westlands"
3. Go to "Nearby" in navbar
4. See User A's book!

---

## Features

- 📍 **Area Grouping:** Books organized by neighborhood
- 🎯 **Smart Filtering:** All books or just your area
- ✓ **Nearby Badge:** Green badge for same-area books
- 💬 **Safe Chat:** Coordinate meetups in messages
- 📱 **Mobile Ready:** Works on all screen sizes
- 🔐 **Privacy:** No coordinate tracking

---

## Database Columns Added

User:

- `city` - e.g., "Nairobi"
- `area` - e.g., "Westlands"

Book:

- `city` - where book is available
- `area` - specific neighborhood
- `pickup_hint` - optional context

---

## Endpoints

**GET /books/nearby**

- Returns books in user's city/area
- Sorted by proximity
- No coordinates shared

**PUT /users/me**

- Now accepts `city` and `area` fields

**PUT /books/{id}**

- Now accepts `city`, `area`, `pickup_hint` fields

---

## Response Example

```json
[
  {
    "id": 1,
    "title": "Atomic Habits",
    "city": "Nairobi",
    "area": "Westlands",
    "pickup_hint": "Near Sarit Centre",
    "proximity": "nearby",
    "owner": { "id": 5, "name": "Sarah", "email": "..." }
  },
  {
    "id": 2,
    "title": "Thinking, Fast and Slow",
    "city": "Nairobi",
    "area": "Kilimani",
    "proximity": "city",
    "owner": { "id": 8, "name": "John", "email": "..." }
  }
]
```

---

## Component Locations

- **Page:** `bookapp/src/pages/NearbyBooks.jsx`
- **Profile Update:** `bookapp/src/pages/Profile.jsx`
- **Navbar Link:** `bookapp/src/components/Navbar.jsx`
- **Route:** `bookapp/src/App.jsx` → `/nearby`
- **API:** `backend/main.py` → `GET /books/nearby`

---

## Testing

1. **Setup:** Create 2 users with same city/area
2. **Books:** Add books with matching locations
3. **Filter:** Test "All Books" and "My Area Only"
4. **Display:** Verify grouping by area
5. **Badge:** Check "✓ Nearby" appears only for same area
6. **Chat:** Verify "Contact Seller" → chat works
7. **Mobile:** Test responsive layout

See **NEARBY_BOOKS_GUIDE.md** for full testing checklist.

---

## No Precise Coordinates ✓

The feature deliberately avoids:

- ❌ GPS coordinates (latitude/longitude)
- ❌ Distance calculations ("0.5 km away")
- ❌ Real-time location tracking
- ❌ Location history
- ❌ Map pins with precise locations

Instead, it uses:

- ✅ City name
- ✅ Neighborhood/area
- ✅ Optional pickup hint (e.g., "Near Sarit Centre")

---

## API Calls

**Get nearby books:**

```bash
curl -H "Authorization: Bearer {token}" \
  http://127.0.0.1:8000/books/nearby
```

**Update user location:**

```bash
curl -X PUT \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"city": "Nairobi", "area": "Westlands"}' \
  http://127.0.0.1:8000/users/me
```

**Update book location:**

```bash
curl -X PUT \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"city": "Nairobi", "area": "Westlands", "pickup_hint": "Near Sarit"}' \
  http://127.0.0.1:8000/books/{book_id}
```

---

## Done! 🎉

The Nearby Books feature is ready to use. Users can now safely discover books in their area!

For detailed documentation, see **NEARBY_BOOKS_GUIDE.md**.
