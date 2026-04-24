# User Profile - View & Manage Your Posts Guide

## Overview

Users can now view and manage their book posts directly from their profile page. This includes viewing detailed information and updating the reading status of books they've shared.

---

## 🎯 Features Added

### 1. View Book Details from Profile

**What it does:** Click on any book card on your profile to view full details including:

- Complete book information (title, author, genre)
- Your rating and review
- Your reading status
- Larger cover image display

**How it works:**

1. Navigate to "My Profile" from the top menu
2. Scroll through your book cards
3. Click on any book card to open the detail modal
4. View all information about that book

---

### 2. Update Reading Status from Profile

**What it does:** Change your reading progress directly from the detail modal:

- 📖 **To Read** → Start reading
- 👀 **Reading** → Finish reading
- ✅ **Done** → Mark complete

**How it works:**

1. Open a book you posted
2. Click the new status button you want
3. If status changed, "💾 Save Status" appears
4. Click save to update
5. Status updates immediately on your profile

**Status Options:**

- Yellow: To Read (wishlist)
- Blue: Reading (in progress)
- Green: Done (completed)

---

### 3. Delete Your Posts from Profile

**What it does:** Remove books you've shared from your profile.

**How it works:**

1. Open a book you posted
2. Click "🗑️ Delete Book" button
3. Confirm the deletion
4. Book is removed from your profile

---

## 🛠️ Technical Implementation

### Frontend Changes

**Profile.jsx:**

- ✅ Added `BookDetailDialog` import
- ✅ Added `selectedBook` state to track opened books
- ✅ Added `updateBook()` callback function
- ✅ Updated BookCard to open detail modal on click
- ✅ Pass `onUpdate`, `onDelete`, and `currentUser` props to dialog
- ✅ BookDetailDialog shows save button for status updates

**BookDetailDialog.jsx:**

- ✅ Accepts `onUpdate` and `currentUser` props
- ✅ Shows "💾 Save Status" button only for book owner
- ✅ Handles status updates with PUT request
- ✅ Updates local state after save

### Backend (No Changes Required)

- ✅ Existing `PUT /books/{id}` endpoint handles updates
- ✅ Ownership validation prevents unauthorized changes
- ✅ Bearer token authentication protects updates

---

## 📱 User Workflows

### Workflow 1: View Your Book Details

1. Click "My Profile" in navbar
2. See your book cards displayed
3. Click any book card
4. Modal opens showing:
   - Large book cover image
   - Title and author
   - Your review
   - Your rating
   - Your reading status
   - Shared by (you)

### Workflow 2: Update Reading Status

1. Open a book from your profile
2. Current status shown at top (e.g., "To Read")
3. Click new status button (e.g., "Reading")
4. "💾 Save Status" button appears
5. Click save
6. Modal closes, status updated on card

### Workflow 3: Delete a Book Post

1. Open a book from your profile
2. Click "🗑️ Delete Book" button
3. Confirm deletion in popup
4. Book removed from profile

### Workflow 4: Track Reading Progress

1. Post a book with "To Read" status
2. Click book → Change to "Reading" → Save
3. Continue reading
4. Click book → Change to "Done" → Save
5. Your profile shows updated status

---

## 🔐 Security & Permissions

**Book Management:**

- ✅ Only book owner can see delete button
- ✅ Only book owner can update status
- ✅ 403 error if non-owner tries to update
- ✅ All operations require Bearer token
- ✅ Backend validates ownership before changes

**Profile View:**

- ✅ Authentication required to access any profile
- ✅ Public profile view doesn't allow editing
- ✅ Only current user can edit their own profile
- ✅ Profile edits (name/bio) separate from book management

---

## 🎨 UI Components

### Book Detail Modal

Located at: `bookapp/src/components/BookDetailDialog.jsx`

**Features:**

- Large image display (h-72 with object-contain)
- Status selector with 3 buttons
- Delete button (owner only)
- Save Status button (owner only, when changed)
- Close button
- Loading state during save
- Error handling with alerts

**Props:**

```jsx
<BookDetailDialog
  book={selectedBook} // Book object with all data
  open={!!selectedBook} // Boolean - show modal
  onClose={() => {}} // Close handler
  onDelete={deleteBook} // Delete handler (optional)
  onUpdate={updateBook} // Update handler (optional)
  currentUser={currentUserId} // Current user object
/>
```

### Profile Page Layout

- **Left Sidebar:** User profile, avatar, bio, edit button
- **Main Content:** Grid of book cards
- **Detail Modal:** Opens when book clicked

---

## 🐛 Troubleshooting

**Can't see detail modal when clicking book:**

- Check if BookDetailDialog is imported
- Verify `onOpen` prop is correctly set to `setSelectedBook`
- Check browser console for errors

**Save Status button doesn't appear:**

- Must be viewing your own book
- Status must be different from current value
- Check that `currentUser` prop is passed correctly

**Delete button not showing:**

- You must be the book owner
- Check that you're viewing your own profile
- Button only shows for books you posted

**Status didn't save:**

- Check network tab for 403 error (permission denied)
- Verify token is valid in browser DevTools localStorage
- Check that `onUpdate` callback is passed
- Look at browser console for error messages

**Modal won't close:**

- Try clicking outside the modal
- Click the "Close" button
- Refresh page if stuck

---

## 📊 Data Flow

```
User clicks book card
        ↓
setSelectedBook(book) → selectedBook state updates
        ↓
BookDetailDialog renders with book prop
        ↓
User clicks status button → editStatus state updates
        ↓
User clicks "Save Status"
        ↓
PUT request to /books/{id} with Bearer token
        ↓
Backend validates ownership & updates database
        ↓
updateBook() callback updates local books array
        ↓
setSelectedBook updates to new status
        ↓
Modal closes, book cards refresh with new status
```

---

## ✅ Features Implemented

On your profile you can now:

- ✅ View all your book posts in a grid
- ✅ Click any book to see full details
- ✅ View large book cover image
- ✅ See your complete review and rating
- ✅ Update your reading status (To Read → Reading → Done)
- ✅ Delete books from your collection
- ✅ See changes reflected immediately
- ✅ Edit profile name and bio
- ✅ Upload profile avatar

---

## 🎯 Next Steps

Potential enhancements:

1. **Sort Options** - Sort books by status, date added, rating
2. **Filter Books** - Filter by status or genre
3. **Reading Stats** - Show books read this month
4. **Quick Stats** - Display total books, favorite genre
5. **Export** - Download reading history
6. **Social Features** - See friends' recent reads
7. **Reading Goals** - Track monthly reading targets
8. **Wishlist** - Separate books to read from completed

---

## 📝 Testing Checklist

Before confirming working:

- [ ] Can navigate to "My Profile"
- [ ] Profile shows my book cards
- [ ] Can click a book card to open detail modal
- [ ] Detail modal shows all book information
- [ ] Can change status in detail modal
- [ ] Save Status button appears when status changed
- [ ] Clicking save updates status
- [ ] Status updates immediately on book card
- [ ] Delete button visible for my books
- [ ] Can delete a book
- [ ] Book removed from profile after delete
- [ ] Modal closes after save or delete
- [ ] Cannot edit status on other users' books (if viewing)
- [ ] Cannot delete other users' books
- [ ] Profile edit still works (name/bio/avatar)

---

## 💾 Database & API

**Endpoints Used:**

- `GET /users/{id}` - Profile info
- `GET /users/{id}/books` - User's books (requires auth)
- `PUT /books/{id}` - Update book status/details (requires auth)
- `DELETE /books/{id}` - Delete book (requires auth)
- `GET /users/me` - Current user info

**Data Returned:**
All endpoints return complete book objects with:

- id, title, author, review, rating, status, genre, image
- owner_id (for ownership validation)
- owner object with user info

---

## 🚀 Summary

Your profile now has full book management capabilities:

1. **View Details** - Click books to see everything
2. **Track Progress** - Update reading status easily
3. **Manage Collection** - Delete unwanted posts
4. **All in One Place** - No need to search for your books

All changes sync in real-time across your profile! 📚✨
