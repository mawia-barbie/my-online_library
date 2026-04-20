# Authentication Flow & Book Exchange Platform

## System Overview

The Book Exchange app implements a sophisticated authentication flow that distinguishes between **guest users** and **authenticated users**, enabling a seamless exploration-to-interaction journey.

---

## 1. User Flows

### Guest User Journey

```
User visits app
     ↓
Landing (/) → Redirects to GuestFeed
     ↓
GuestFeed (/browse)
├─ Can view all books (read-only)
├─ Can scroll and explore
└─ Cannot interact (post, message, comment)
     ↓
Attempts restricted action
     ↓
AuthPromptDialog appears
     ↓
User chooses: Login or Sign Up
     ↓
Redirected to /login or /register
```

### Authenticated User Journey

```
User logs in/registers
     ↓
AuthContext.login() stores token
     ↓
Backend validates token
     ↓
User state updated with user data
     ↓
Landing (/) → Auto-redirects to /feed
     ↓
Feed (/feed) - Full Authenticated Dashboard
├─ View all books
├─ Post new books
├─ Message other users
├─ Edit own profile
├─ Full interaction enabled
```

---

## 2. Component Architecture

### Core Auth Components

**AuthContext** (`src/context/AuthContext.jsx`)

- Central auth state management
- Methods: `login()`, `logout()`, `register()`, `updateProfile()`, `rateUser()`
- Debug logging for auth flow tracking
- Persists token to localStorage

**RequireAuth** (`src/components/RequireAuth.jsx`)

- Route guard component
- Redirects unauthenticated users to /login
- Wraps protected routes (currently `/feed`)

**AuthPromptDialog** (`src/components/AuthPromptDialog.jsx`)

- Modal shown when guest attempts restricted action
- Offers quick login or sign-up options
- Clean, dismissible UI

### Page Components

**Landing** (`src/pages/Landing.jsx`)

- Entry point (/)
- If authenticated → Auto-redirects to /feed
- If guest → Shows GuestFeed
- Includes debug logging for routing decisions

**GuestFeed** (`src/pages/GuestFeed.jsx`)

- Public feed for all users (/browse)
- Shows books in grid format
- Restricted interactions trigger AuthPromptDialog
- No "Add Book" button for guests
- Debug logging for guest actions

**Feed** (`src/pages/Feed.jsx`)

- Protected authenticated feed (/feed)
- Protected by RequireAuth component
- Full features:
  - Add books
  - Search users
  - View detailed book info
  - Delete own books
- Uses AuthContext user data

**Navbar** (`src/components/Navbar.jsx`)

- Shows different options based on auth state
- Guest: "Log in" and "Get Started" buttons
- Authenticated: User name, logout, profile link
- Conditionally shows "Feed" and "Profile" links for authenticated users

---

## 3. Routing Logic

```javascript
// App.jsx routes
/                    → Landing (redirects based on auth state)
/browse              → GuestFeed (public feed, guest/guest features only)
/feed                → Feed (protected, requires authentication)
/login               → Login page
/register            → Register page
/profile/:id         → Profile page
/users               → Users page
*                    → Navigate to / (fallback)
```

**Routing Rules:**

- Landing intelligently routes authenticated users to /feed
- /feed is protected by RequireAuth
- Unauthenticated attempts to /feed redirect to /login
- After login/registration, user is redirected to /feed
- Logout redirects to /login

---

## 4. Feature Comparison Table

| Feature           | Guest | Authenticated |
| ----------------- | ----- | ------------- |
| View Feed         | ✅    | ✅            |
| Browse Books      | ✅    | ✅            |
| Search Users      | ❌    | ✅            |
| Post Books        | ❌    | ✅            |
| Message Users     | ❌    | ✅            |
| Access Profile    | ❌    | ✅            |
| Edit Profile      | ❌    | ✅            |
| Rate Other Users  | ❌    | ✅            |
| See "Get Started" | ✅    | ❌            |

---

## 5. Debug Console Output

The app includes comprehensive debug logging. In browser DevTools console, you'll see:

### On App Load (Guest)

```
[AUTH FLOW - HH:MM:SS] 🚀 AuthProvider mounted - checking token
[AUTH FLOW - HH:MM:SS] ❌ No token found in localStorage
[AUTH FLOW - HH:MM:SS] 📍 Landing page - user is guest
[AUTH FLOW - HH:MM:SS] 📚 GuestFeed mounted
[AUTH FLOW - HH:MM:SS] ✅ Books loaded {count: 15}
```

### On Login

```
[AUTH FLOW - HH:MM:SS] 🔑 Login attempt {token: "eyJhbG..."}
[AUTH FLOW - HH:MM:SS] ✅ Login successful {user: 42}
👤 USER STATE
   User: {id: 42, email: "user@example.com", ...}
   Token: ✅ Present
   Authenticated: true
→ NAVIGATION /login → /feed (authenticated user redirecting)
```

### On Guest Interaction

```
[AUTH FLOW - HH:MM:SS] 🔐 AUTH PROMPT Guest clicked restricted action (post/interact)
```

### On Logout

```
[AUTH FLOW - HH:MM:SS] 🚪 Logout
```

---

## 6. Key Implementation Details

### Token Management

```javascript
// AuthContext handles token lifecycle
-localStorage.setItem("token", token) - // On login
  localStorage.getItem("token") - // On app load
  localStorage.removeItem("token"); // On logout
```

### API Integration

```javascript
// All API calls include auth when available
const token = localStorage.getItem("token");
fetch(url, {
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
});
```

### Redirect Logic

```javascript
// Landing.jsx - Smart routing
useEffect(() => {
  if (user) {
    navigate("/feed", { replace: true }); // Authenticated
  }
  // Guests see GuestFeed
}, [user, navigate]);
```

---

## 7. User Experience Flow

### Scenario 1: First-time Guest

1. User lands on `/` → Sees GuestFeed
2. Browses available books
3. Clicks "Post Book" → AuthPromptDialog
4. Clicks "Get Started" → Navigate to /register
5. Completes registration
6. Auto-logged in → Redirected to /feed
7. Authenticated dashboard loads

### Scenario 2: Returning User

1. User lands on `/` → Token found
2. Token validated with backend
3. User loaded from AuthContext
4. Auto-redirected to `/feed`
5. Full dashboard available

### Scenario 3: Session Expiry

1. Token invalid/expired
2. API returns 401
3. Token removed from localStorage
4. User redirected to /login
5. Must re-authenticate

---

## 8. Security Considerations

✅ **Implemented:**

- JWT tokens in localStorage (accessible only via HTTPS in production)
- Backend token validation on app load
- Automatic token removal on 401 responses
- Protected routes with RequireAuth component
- Safe token extraction from responses

⚠️ **Production Recommendations:**

- Use `httpOnly` cookies instead of localStorage
- Implement token refresh mechanism
- Add CSRF protection
- Enable HTTPS/TLS
- Set secure headers (CSP, HSTS, etc.)

---

## 9. Troubleshooting

### "Does not provide an export named 'default'"

- Ensure Navbar.jsx uses: `export default function Navbar()`
- Clear Vite cache: `npm run dev` or restart dev server

### Guest can't see auth prompt

- Check browser console for errors
- Verify AuthPromptDialog component is imported
- Ensure onAuthRequired callback is passed to Navbar

### Auto-login after registration not working

- Check backend /login endpoint response format
- Verify token field: `access_token` or `token` or `accessToken`
- Check console logs for registration response

### Can't reach /feed after login

- Verify token is in localStorage
- Check backend /users/me endpoint returns valid user
- Ensure RequireAuth wrapper is active
- Check console for 401 errors

---

## 10. File Structure

```
src/
├── components/
│   ├── AuthPromptDialog.jsx     # Auth required modal
│   ├── Navbar.jsx              # Conditional nav with auth
│   └── ...other components
├── pages/
│   ├── Landing.jsx             # Entry point, smart routing
│   ├── GuestFeed.jsx           # Public read-only feed
│   ├── Feed.jsx                # Protected auth dashboard
│   ├── Login.jsx
│   ├── Register.jsx
│   └── ...other pages
├── context/
│   └── AuthContext.jsx         # Central auth state
├── utils/
│   └── authDebug.js            # Debug logging utilities
└── App.jsx                     # Route configuration
```

---

## 11. Testing the Flow

### Test Guest Experience

1. Open app in private/incognito window
2. Verify you see GuestFeed at `/`
3. Try clicking a book → Should show auth prompt
4. Click "Get Started" → Should navigate to /register
5. Check browser console for debug logs

### Test Authenticated Flow

1. Register and log in
2. Verify redirected to `/feed`
3. Try posting a book → Should work
4. Log out → Should redirect to /login
5. Verify token cleared from localStorage

### Test Auto-Login

1. Register with test credentials
2. Note token in localStorage
3. Refresh page
4. Should remain logged in (token re-validated)

---

## 12. Future Enhancements

- [ ] Email verification flow
- [ ] Social login (Google, GitHub)
- [ ] Two-factor authentication
- [ ] Session management with refresh tokens
- [ ] Remember me functionality
- [ ] Password reset flow
- [ ] Rate limiting on auth endpoints
- [ ] Audit logging for security events
