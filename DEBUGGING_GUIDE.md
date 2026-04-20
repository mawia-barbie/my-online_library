# Debugging Guide - Dual Feed System

## Common Issues & Solutions

### Issue 1: "Feed not working" / Blank page

**Symptoms**: Navigate to `/feed` or `/for-you`, see empty page or loading spinner forever

**Check list**:

1. ✅ Backend is running on `http://127.0.0.1:8000`

   ```bash
   # In backend folder
   python main.py
   ```

2. ✅ Test backend endpoints in browser or curl:

   ```bash
   # Test if backend is alive
   curl http://127.0.0.1:8000/books

   # Should return array of books or empty []
   ```

3. ✅ Check browser console for errors (F12)
   - Look for CORS errors
   - Look for 404 errors
   - Look for network errors

4. ✅ Verify you're logged in
   - Feed pages require authentication
   - If not logged in, you'll be redirected to login
   - Check localStorage for `token` key (F12 → Application → localStorage)

---

### Issue 2: 401 Unauthorized errors on `/users/{id}/books`

**Symptoms**: Console shows `GET http://127.0.0.1:8000/users/1/books 401 (Unauthorized)`

**Solution**: This endpoint now requires authentication.

- Profile.jsx was updated to send Bearer token
- Verify `localStorage.getItem("token")` exists
- If token is invalid/expired, log out and log in again

**File**: `bookapp/src/pages/Profile.jsx` (lines 38-42)

---

### Issue 3: ForYou feed shows different books than Explore

**This is correct!**

- **Explore** (`/feed`): ALL books from all users
- **For You** (`/for-you`): Only books matching user preferences (subset)

If you want to verify scoring is working:

1. Open ForYou page
2. Open browser console (F12)
3. Look for `📊 Recommendation Metrics` debug logs
4. Should show book scores and why they were recommended

---

### Issue 4: Backend error on `/books/recommendations`

**Symptoms**: ForYou shows nothing, even though Explore has books

**Solution**:

- The `/books/recommendations` endpoint was just added to backend
- It has a fallback in ForYou.jsx that uses client-side personalization
- If you see no books at all, check if backend is returning valid book data

**Test**:

```bash
# Get your token first (from localStorage or login response)
TOKEN="your-jwt-token-here"

# Test recommendations endpoint
curl -H "Authorization: Bearer $TOKEN" \
  http://127.0.0.1:8000/books/recommendations
```

---

### Issue 5: Books not appearing after adding

**Symptoms**: Add a book, but it doesn't show in Explore or For You

**Check**:

1. ✅ Add book endpoint returns 200 (not error)
2. ✅ Book appears at top of Explore (newest first)
3. ✅ Book may not appear in For You until scoring algorithm matches it

**Debug flow**:

1. Refresh page (`Ctrl+R`) - does book appear?
2. Check backend database (books.db) directly
3. Verify you're the owner of the book

---

## Testing Checklist

### Test 1: Basic Flow

- [ ] 1. Go to `/` (Landing page)
- [ ] 2. Not logged in → see Guest preview
- [ ] 3. Click "Get Started"
- [ ] 4. Register new account
- [ ] 5. Should auto-redirect to `/feed` (Explore)
- [ ] 6. See list of all books
- [ ] 7. Click "Explore" in navbar → `/feed` (same page)
- [ ] 8. Click "For You" in navbar → `/for-you` (personalized)

### Test 2: Add Book & Verify Appearance

- [ ] 1. Click "+ Add Book" on Explore
- [ ] 2. Fill form (title, author, genre/status, review, rating)
- [ ] 3. Click "Save"
- [ ] 4. Book should appear at TOP of Explore feed
- [ ] 5. Go to For You → book should appear if genre/rating match
- [ ] 6. Go to Profile → your book should be in "My Books" section

### Test 3: Security (Authentication)

- [ ] 1. Log out
- [ ] 2. Try to access `/feed` → redirected to `/login`
- [ ] 3. Try to access `/for-you` → redirected to `/login`
- [ ] 4. Try to access `/profile/1` → redirected to `/login`
- [ ] 5. Try to access `/profile/1/books` in DevTools → 401 error

### Test 4: Profile Access

- [ ] 1. Logged in as User A
- [ ] 2. Go to `/profile/1` (User A's profile)
- [ ] 3. Can edit bio/avatar (edit button visible)
- [ ] 4. Try `/profile/2` (User B's profile)
- [ ] 5. See their books (read-only, no edit button)
- [ ] 6. Cannot edit their profile

### Test 5: Personalization

- [ ] 1. Add 5-10 books with different genres
- [ ] 2. Check Explore → all books visible
- [ ] 3. Check For You → fewer books (only scoring > 0)
- [ ] 4. Update your user profile with favorite genres
- [ ] 5. For You should re-rank books based on preferences

---

## Debug Commands

### Check if Backend is Running

```bash
curl http://127.0.0.1:8000/books
```

### Get Your User ID

In browser console:

```javascript
const user = JSON.parse(localStorage.getItem("auth_user"));
console.log("User ID:", user?.id);
console.log("User Email:", user?.email);
```

### Get Your Auth Token

In browser console:

```javascript
console.log(localStorage.getItem("token"));
```

### Test API Endpoint Directly

```bash
TOKEN="your-token-from-above"
curl -H "Authorization: Bearer $TOKEN" \
  http://127.0.0.1:8000/users/me
```

### Check Recommendation Scoring

1. Open `/for-you`
2. F12 → Console
3. Look for messages like: `📊 Recommendation Metrics: [{id: 1, score: 25, ...}]`

---

## Performance Tips

### If Feeds Are Slow

1. **Browser cache**:
   - Hard refresh: `Ctrl+Shift+R`
   - Clear localStorage:
     ```javascript
     localStorage.clear();
     ```

2. **Backend optimization**:
   - Add database indexes on `owner_id`, `status` (genre)
   - Implement pagination (currently returns all books)

3. **Frontend optimization**:
   - Add lazy loading for book images
   - Implement infinite scroll instead of showing all at once

---

## File Reference

| File                                     | Purpose                      |
| ---------------------------------------- | ---------------------------- |
| `bookapp/src/pages/Feed.jsx`             | Explore - General feed       |
| `bookapp/src/pages/ForYou.jsx`           | Personalized recommendations |
| `bookapp/src/utils/recommendations.js`   | Scoring algorithm            |
| `backend/main.py`                        | REST API endpoints           |
| `bookapp/src/context/AuthContext.jsx`    | Auth state management        |
| `bookapp/src/components/RequireAuth.jsx` | Route protection             |

---

## Need More Help?

1. **Check console errors**: F12 → Console tab
2. **Check network requests**: F12 → Network tab
3. **Check local storage**: F12 → Application → localStorage
4. **Restart backend**: Kill process and restart `python main.py`
5. **Restart frontend**: Kill `npm run dev` and restart
