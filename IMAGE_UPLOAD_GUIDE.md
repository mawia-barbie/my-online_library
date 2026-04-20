# Book Cover Image Upload - Complete Guide

## ✅ Feature Added

The "Add Book" form now includes a **Book Cover Image** upload field.

---

## How to Use

### Adding a Book with Cover Image:

1. **Click "+ Add Book"** button on Explore page
2. **Fill in Title and Author** (required)
3. **Upload Book Cover Image:**
   - Click on the image upload box (dashed border area)
   - Select an image file from your computer
   - Image preview appears in the box
4. **Fill other fields** (optional):
   - Genre/Status
   - Rating (1-5 stars)
   - Review
5. **Click "Add Book"** to submit
6. **Book appears** at top of feed with cover image

---

## Image Upload Details

### Supported Formats

- ✅ JPG/JPEG
- ✅ PNG
- ✅ GIF
- ✅ WebP
- ✅ Any standard image format

### Image Size

- **Recommended**: 300x450px (book cover aspect ratio)
- **Accepted**: Any size (will be resized by frontend)
- **Max size**: Limited by browser (typically 50MB)

### Image Processing

- Converted to **Base64** for transmission
- Stored in database as **base64 string**
- Displayed as **image preview** before upload

---

## Form Fields (Updated)

| Field            | Required | Type      | Notes                  |
| ---------------- | -------- | --------- | ---------------------- |
| **Title**        | ✅ Yes   | Text      | Book title             |
| **Book Cover**   | ❌ No    | Image     | Click box to upload    |
| **Author**       | ✅ Yes   | Text      | Author name            |
| **Genre/Status** | ❌ No    | Text      | e.g., Fiction, Romance |
| **Rating**       | ❌ No    | 1-5 stars | Click stars to rate    |
| **Review**       | ❌ No    | Long text | Your thoughts          |

---

## Visual Design

### Upload Box (Before)

```
┌─────────────────────┐
│  📷 Click to upload │
│  (dashed border)    │
└─────────────────────┘
```

### Upload Box (After - Preview)

```
┌─────────────────────┐
│  [Book Cover Image] │
│  (preview visible)  │
└─────────────────────┘
```

---

## Technical Details

### Image Upload Flow

1. User clicks upload area
2. Hidden file input opens
3. User selects image
4. Image converted to Base64
5. Preview displays in box
6. Data sent to backend as JSON

### Form Data Structure

```javascript
{
  title: "The Great Gatsby",
  author: "F. Scott Fitzgerald",
  image: "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  status: "Fiction",
  rating: 5,
  review: "Amazing classic novel!"
}
```

### Backend Requirement

- API should accept `image` field as **base64 string**
- Store in database (text field or blob)
- Return in GET /books responses

---

## Testing

### Test 1: Upload Image

- [ ] Click "+ Add Book"
- [ ] Click on image box
- [ ] Select a local image file
- [ ] Image preview appears
- [ ] Image persists in form
- [ ] Fill other fields
- [ ] Click "Add Book"
- [ ] Book created successfully

### Test 2: Image Display

- [ ] Book appears in Explore feed
- [ ] Cover image visible on BookCard
- [ ] Click book card → detail view shows image

### Test 3: Without Image

- [ ] Add book WITHOUT uploading image
- [ ] Leave image field empty
- [ ] Fill title and author
- [ ] Click "Add Book"
- [ ] Book created (image optional)

---

## Common Issues

### Issue: Image upload button not responding

**Solution**:

1. Check browser console (F12)
2. Verify file input is not hidden
3. Try with different image file
4. Refresh page and retry

### Issue: Image not showing after upload

**Possible causes**:

1. Backend not storing/returning image
2. Base64 string too long (truncated)
3. Database field too small

**Solution**:

1. Check backend response in DevTools
2. Verify database field is TEXT or BLOB (not VARCHAR)
3. Test with smaller image

### Issue: Upload hangs/slow

**Causes**:

- Large image file (>5MB)
- Slow network

**Solution**:

- Use smaller image files
- Compress image before upload

---

## API Integration

### Expected Backend Behavior

When POST /books is called with image data:

```json
Request:
{
  "title": "Book Title",
  "author": "Author Name",
  "image": "data:image/jpeg;base64,/9j/4AAQ...",
  "rating": 5,
  "review": "Great book!"
}

Response:
{
  "id": 123,
  "title": "Book Title",
  "author": "Author Name",
  "image": "data:image/jpeg;base64,/9j/4AAQ...",
  "rating": 5,
  "review": "Great book!",
  "owner_id": 1,
  ...
}
```

### Database Schema (Example)

```sql
CREATE TABLE books (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  image LONGTEXT,  -- Store base64 here
  rating INTEGER,
  review TEXT,
  ...
)
```

---

## Features

✅ Click-to-upload interface
✅ Image preview before submission
✅ Supports all common image formats
✅ Mobile-friendly (works on phones)
✅ Optional field (not required)
✅ Base64 encoding for easy database storage
✅ Responsive design (adapts to screen size)

---

## Future Enhancements

- [ ] Image compression before upload
- [ ] Drag-and-drop image upload
- [ ] Crop/resize image tool
- [ ] Image CDN storage (S3, cloudinary)
- [ ] Multiple image support
- [ ] Image gallery on book details

---

## Browser Support

Works in all modern browsers:

- ✅ Chrome/Edge
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

Requires:

- FileReader API
- Base64 encoding support (built-in)
