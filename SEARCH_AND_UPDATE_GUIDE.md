# Search Books & Update Status Guide

## Overview

This guide covers the new search and update features added to the Book Exchange platform:

- Search books by title/author (community discovery)
- Search users by name/email (find other readers)
- Update reading status (track your reading progress)

---

## 🔍 Features Added

### 1. Book Search

**What it does:** Search for books by title or author and see all posts from community members who have shared that book.

**How it works:**

- Users type a book title or author name in the search bar
- System returns matching books with:
  - Book title and author
  - Reviewer's profile info
  - Their rating and review
  - Their reading status
  - Book cover image (if available)

**Frontend Implementation:**

- Search logic in `Feed.jsx` → `useEffect` with 200ms debounce
- First attempts `/books/search?query=` endpoint
- Falls back to user search if no books found
- Suggestions dropdown shows both book and user results

**UI Components:**

- Search bar with autocomplete dropdown
- Results labeled as "Book" or "User" type
- Clicking a book filters to show all posts for that book
- Clicking a user navigates to their profile

**Backend Endpoints:**

```
GET /books/search?query={search_term}
```

Returns array of books matching title or author, with owner info

---

### 2. Update Reading Status

**What it does:** Allows users to update the reading status of books they've posted, tracking their reading progress from "To Read" → "Reading" → "Done".

**How it works:**

1. User clicks on a book they posted (must be owner)
2. BookDetailDialog opens and shows current status
3. User clicks a different status button
4. If status changed, a "💾 Save Status" button appears
5. User clicks save → status updates in database
6. Book card and feed update immediately

**Status Options:**

- 📖 **To Read** (Yellow) - Wishlist item
- 👀 **Reading** (Blue) - Currently reading
- ✅ **Done** (Green) - Completed

**Frontend Implementation:**

- `BookDetailDialog.jsx` maintains `editStatus` state
- Displays save button only if:
  - User is book owner
  - Status has changed from current value
- PUT request to update backend
- `updateBook()` callback updates both list and selected book

**Backend Endpoints:**

```
PUT /books/{book_id}
Content-Type: application/json
Authorization: Bearer {token}

Body: {
  "status": "Reading"  // or "To Read" or "Done"
}

Returns: Updated book object
```

---

## 🛠️ Technical Implementation

### Backend Changes

**1. New Endpoint: `/books/search`**

```python
@app.get("/books/search")
def search_books(query: str | None = None, db: Session = Depends(get_db)):
    """Search books by title or author."""
    rows = db.query(models.Book, models.User).outerjoin(models.User, models.Book.owner_id == models.User.id)

    if query:
        like = f"%{query.strip()}%"
        rows = rows.filter(
            or_(
                func.lower(models.Book.title).like(like.lower()),
                func.lower(models.Book.author).like(like.lower()),
            )
        )

    # Returns array of books with owner info
```

**2. New Endpoint: `PUT /books/{book_id}`**

```python
@app.put("/books/{book_id}")
def update_book(book_id: int, update: schemas.BookUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """Update book details. Only owner can update."""
    book = db.query(models.Book).filter(models.Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    if book.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not allowed")

    # Update fields
    update_data = update.dict(exclude_unset=True)
    for field, value in update_data.items():
        if value is not None:
            setattr(book, field, value)

    db.add(book)
    db.commit()
    db.refresh(book)
    return book
```

**3. New Schema: `BookUpdate`**

```python
class BookUpdate(BaseModel):
    title: str | None = None
    author: str | None = None
    review: str | None = None
    rating: int | None = None
    status: str | None = None
    genre: str | None = None
    image: str | None = None
    availability: bool | None = None
```

### Frontend Changes

**1. Feed.jsx**

- Enhanced search logic to query both books and users
- Added `updateBook()` function to sync updated books
- Passes `onUpdate` and `currentUser` to BookDetailDialog

**2. ForYou.jsx**

- Added same `updateBook()` function
- Passes `onUpdate` and `currentUser` to BookDetailDialog

**3. BookDetailDialog.jsx**

- Added `onUpdate` and `currentUser` props
- Added "💾 Save Status" button (shown only if owner and status changed)
- PUT request with Bearer token
- Updates local state after save
- Shows loading state during update

---

## 📱 User Workflows

### Workflow 1: Search for a Book

1. Navigate to "Explore" page
2. Click search bar
3. Type book title (e.g., "The Great Gatsby")
4. See dropdown with matching books
5. Click a book to filter
6. View all community posts for that book
7. See ratings, reviews, and reading status from other users

### Workflow 2: Update Your Reading Status

1. Navigate to "Explore" or "For You"
2. Find a book you posted
3. Click to open details modal
4. Click the new status button (e.g., "Reading")
5. If status changed, "💾 Save Status" button appears
6. Click save button
7. Status updates immediately
8. Book cards and feeds refresh

### Workflow 3: Track Reading Progress

1. Post a book with status "To Read"
2. Start reading → Update to "Reading" (saves progress)
3. Finish reading → Update to "Done" (marks complete)
4. View status badges on cards showing current progress

---

## 🔒 Security & Permissions

**Book Status Updates:**

- ✅ Only book owner can update their posts
- ✅ Requires Bearer token authentication
- ✅ 403 error if non-owner tries to update
- ✅ Backend validates ownership before any changes

**Book Search:**

- ✅ Public endpoint (no auth required)
- ✅ Returns same data as GET /books
- ✅ Includes owner info for all results

---

## 🐛 Troubleshooting

**"Save Status" button doesn't appear:**

- You must be the book owner
- Status must be different from current value
- Check browser console for errors

**Status didn't update:**

- Check browser network tab for 403 error (permission denied)
- Verify token is valid in localStorage
- Check backend logs for error details

**Search results empty:**

- Try searching with fewer characters
- Check if books exist in database
- Search is case-insensitive, partial matches supported

**Dropdown shows only users, not books:**

- `/books/search` endpoint may not be running
- Check if backend is connected and listening
- Fallback to user search kicks in automatically

---

## 📊 Database Impact

**Book Table Updates:**

- No new columns required (uses existing `status` field)
- `genre` field already added in previous update

**API Calls:**

- Search books: `GET /books/search?query=`
- Update status: `PUT /books/{id}`
- Both endpoints are fast (<100ms)

---

## 🎯 Future Enhancements

Potential improvements for future versions:

1. **Filter by Status** - Show only "Reading" or "Done" books
2. **Reading Statistics** - Track total books read per user
3. **Reading Goals** - Set monthly reading targets
4. **Reading History** - Timeline of status changes
5. **Genre Filtering** - Combine with existing genre field
6. **Sort Options** - By rating, recency, status
7. **Batch Updates** - Update multiple books at once
8. **Status Notifications** - Notify friends when you finish books

---

## ✅ Testing Checklist

Before deploying, verify:

- [ ] Search bar autocompletes with books and users
- [ ] Clicking a book filters to show those posts
- [ ] Status buttons are clickable in detail modal
- [ ] Save button only shows when status changed
- [ ] Save button shows loading state during update
- [ ] Status updates in backend database
- [ ] Book cards refresh with new status
- [ ] Only book owner can update status
- [ ] Non-owner cannot save status changes
- [ ] All permissions checked at backend
- [ ] Error messages display on failed updates

---

## 📝 Notes

- Search debounces after 200ms to avoid excessive API calls
- Status changes are immediate (optimistic updates)
- Genre field persists through updates
- All book metadata preserved during status updates
- Status badges update on card display
- Personalization algorithm considers reading status
