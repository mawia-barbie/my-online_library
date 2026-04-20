# Dual Feed System Documentation

## Overview

The Book Exchange app features two distinct content feeds with clear separation of purposes:

### 1. **Explore Feed** (`/feed`)

- **Purpose**: Discovery and browsing
- **Content**: All books from all users
- **Ordering**: Most recent first (chronological)
- **Personalization**: None - shows unfiltered community content
- **UI Icon**: Compass (🧭)

### 2. **For You Feed** (`/for-you`)

- **Purpose**: Personalized recommendations
- **Content**: Books tailored to user preferences
- **Ordering**: By relevance score (personalization algorithm)
- **Personalization**: Based on favorite genres, authors, and ratings
- **UI Icon**: Heart (❤️)

---

## Architecture

### File Structure

```
src/
├── pages/
│   ├── Feed.jsx          # Explore (general feed)
│   ├── ForYou.jsx        # For You (personalized feed)
│   └── Landing.jsx       # Landing/redirect logic
├── components/
│   ├── FeedTabs.jsx      # Tab navigation between feeds
│   ├── Navbar.jsx        # Navigation with links to both feeds
│   └── BookCard.jsx      # Reusable book display component
├── utils/
│   ├── recommendations.js # Personalization engine
│   └── authDebug.js      # Debug utilities
└── context/
    └── AuthContext.jsx   # Auth state management
```

---

## Feed Implementation Details

### Explore Feed (Feed.jsx)

**Key Features:**

- Fetches all books from `/books` endpoint
- Sorts by creation date (newest first)
- No filtering or personalization
- Full CRUD operations (add, edit, delete books)
- Search functionality for finding users

**Data Flow:**

```
GET /books
↓
Sort by created_at DESC
↓
Display in grid
```

### For You Feed (ForYou.jsx)

**Key Features:**

- Attempts to fetch from `/books/recommendations` endpoint (if available)
- Falls back to client-side personalization if not available
- Applies scoring algorithm to all books
- Shows only relevant recommendations
- "Recommended" badge on hover

**Data Flow:**

```
Try: GET /books/recommendations
  ↓
  Success: Use personalized data
  ↓
Fail: Fetch all books
  ↓
Apply client-side personalization
  ↓
Score books based on user preferences
  ↓
Sort by score DESC, limit to 20
  ↓
Display in grid
```

---

## Personalization Algorithm

### Recommendation Engine (`utils/recommendations.js`)

The scoring system prioritizes books based on:

1. **Genre Matching** (15 points)
   - Highest weight
   - Compares book genre with user's `favorite_genres`

2. **Author Preferences** (12 points)
   - Matches book author with user's `favorite_authors`

3. **Rating Boost** (1-2 points)
   - 4.5+ rating: +2 points
   - 4.0+ rating: +1 point

4. **Recency Boost** (1-3 points)
   - Last 7 days: +3 points
   - Last 30 days: +1 point

5. **Final Filter**: Only books with score > 0

### Example Scoring

```javascript
Book: "The Midnight Library"
- Genre: "Fiction" (matches user's favorite) → +15
- Author: "Matt Haig" (not in favorites) → +0
- Rating: 4.6 → +2
- Created: 3 days ago → +3
- Total Score: 20

Book: "Random Technical Book"
- Genre: "Tech" (not in favorites) → +0
- Author: Unknown → +0
- Rating: 4.2 → +1
- Created: 60 days ago → +0
- Total Score: 1 (filtered out if threshold > 1)
```

---

## User Data Requirements

For full personalization, the user object should include:

```javascript
{
  id: 1,
  email: "user@example.com",
  nickname: "BookLover",
  favorite_genres: ["Romance", "Mystery", "Fiction"],
  favorite_authors: ["Stephen King", "Agatha Christie"],
  read_books: [1, 5, 12, 45],        // IDs of books read
  interactions: {
    liked: [3, 7, 9],                // Liked books
    saved: [2, 8, 14],               // Saved for later
    viewed: [1, 2, 3, 4, 5]          // Recently viewed
  }
}
```

---

## Tab Navigation

### FeedTabs Component

Located between Navbar and main content. Shows:

- **Explore** tab (Compass icon, indigo border when active)
- **For You** tab (Heart icon, red border when active)

Active tab is determined by current route (`/feed` or `/for-you`).

### Navigation Flow

```
User clicks "Explore" → Routes to /feed → FeedTabs highlights Explore
User clicks "For You" → Routes to /for-you → FeedTabs highlights For You
```

---

## API Endpoints

### Backend Requirements

| Endpoint                 | Method | Purpose                 | Auth |
| ------------------------ | ------ | ----------------------- | ---- |
| `/books`                 | GET    | Get all books (Explore) | No   |
| `/books`                 | POST   | Create new book         | Yes  |
| `/books/{id}`            | DELETE | Delete book             | Yes  |
| `/books/recommendations` | GET    | Get personalized books  | Yes  |
| `/users/me`              | GET    | Get current user data   | Yes  |
| `/users`                 | GET    | Search users            | No   |

### Expected Response Format

```javascript
// GET /books - General feed
[
  {
    id: 1,
    title: "The Midnight Library",
    author: "Matt Haig",
    genre: "Fiction",
    rating: 4.6,
    created_at: "2024-04-19T10:00:00Z",
    owner: { id: 5, name: "John", avatar: "..." }
  },
  // ... more books
]

// GET /books/recommendations - Personalized (optional)
[
  {
    id: 15,
    title: "Mystery Thriller",
    author: "Agatha Christie",
    genre: "Mystery",
    rating: 4.8,
    created_at: "2024-04-18T14:30:00Z",
    owner: { id: 3, name: "Jane", avatar: "..." }
  },
  // ... more books (pre-filtered by backend)
]
```

---

## Filtering & Sorting

### Explore Feed (Feed.jsx)

- **Sorting**: `created_at` DESC (newest first)
- **Filtering**: None
- **Limit**: No limit

### For You Feed (ForYou.jsx)

- **Sorting**: Score DESC (highest relevance first)
- **Filtering**: Score > 0 (relevance threshold)
- **Limit**: 20 books

---

## Error Handling

### Explore Feed

- **No books available**: Shows "No books available yet. Be the first to add one!"
- **Network error**: Logs to console, shows empty state

### For You Feed

- **No recommendations**: Shows "No personalized recommendations yet. Update your favorite genres in your profile!"
- **Recommendation endpoint down**: Falls back to client-side personalization
- **No user data**: Shows first 20 books from general feed

---

## Testing & Debugging

### Recommendation Metrics

Enable debugging in browser console:

```javascript
// Logs recommendation statistics
logRecommendationMetrics(books);
```

Output:

```
📊 Recommendation Metrics
Total books: 50
Scored books: 18
Average score: 12.33
Top scorer: "The Midnight Library" (score: 20)
```

### Auth Flow Logging

```javascript
import { logAuthFlow, logUserState } from "../utils/authDebug";

logAuthFlow("User logged in");
logUserState(user, token);
```

---

## Future Enhancements

1. **Backend Personalization**
   - Implement `/books/recommendations` endpoint
   - Use collaborative filtering
   - Track user interactions (likes, saves, views)

2. **Advanced Scoring**
   - ML-based recommendation engine
   - User behavior tracking
   - Cross-genre recommendations

3. **UI Improvements**
   - "Because you liked..." sections
   - Reading history
   - Saved books collection
   - Genre-specific filters

4. **Performance**
   - Pagination for feeds
   - Caching recommendations
   - Infinite scroll
   - Lazy loading book cards

---

## Troubleshooting

### "For You" showing same books as "Explore"

- Check if `favorite_genres` is set in user profile
- Verify `/books/recommendations` endpoint not available (check Network tab)
- Check browser console for recommendation metrics

### Personalization not working

- Ensure user object has `favorite_genres` array
- Verify genres match book `genre` field (case-insensitive)
- Check that backend `/books/recommendations` returns proper format

### FeedTabs not highlighting correctly

- Verify route is `/feed` or `/for-you`
- Check `useLocation()` hook is working
- Inspect browser URL bar
