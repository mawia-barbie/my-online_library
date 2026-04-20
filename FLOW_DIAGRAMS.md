# Authentication System Visual Flows

## System Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                    Browser / Frontend                        │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              App.jsx (BrowserRouter)                  │ │
│  │                                                        │ │
│  │  ┌──────────┬──────────┬────────┬──────────┬────────┐ │ │
│  │  │   /      │ /browse  │ /feed  │ /login   │/register
│  │  │ Landing  │GuestFeed │ Feed   │  Login   │ Register
│  │  └────┬─────┴────┬─────┴───┬────┴──────────┴─────────┘ │
│  │       │          │         │                           │
│  │       └──────────┼─────────┘                           │
│  │                  │                                     │
│  │    AuthContext (Global State)                          │
│  │    ├─ user: User | null                               │
│  │    ├─ login(token)                                    │
│  │    ├─ logout()                                        │
│  │    ├─ register(email, pwd, nickname)                  │
│  │    └─ + Debug Logging                                 │
│  └────────────┬──────────────────────────────────────────┘ │
│               │                                            │
│               ▼                                            │
│         localStorage                                      │
│         ├─ token (JWT)                                    │
│         └─ [+ other app state]                           │
│                                                           │
└────────────────────┬──────────────────────────────────────┘
                     │ (HTTPS)
                     ▼
┌──────────────────────────────────────────────────────────────┐
│              Backend API (:8000)                             │
├──────────────────────────────────────────────────────────────┤
│ POST   /register        → Create user, return response       │
│ POST   /login           → Validate creds, return JWT token   │
│ GET    /users/me        → Get current user (Bearer token)    │
│ GET    /books           → List all books (public)            │
│ POST   /books           → Create book (requires auth)        │
│ [+ other endpoints]                                         │
└──────────────────────────────────────────────────────────────┘
```

---

## Guest User Flow Diagram

```
                    START (Private Incognito)
                           │
                           ▼
        ┌──────────────────────────────────┐
        │   User visits localhost:5173     │
        └──────────────────┬───────────────┘
                           │
                           ▼
        ┌──────────────────────────────────┐
        │  Landing (/) loads               │
        │  AuthContext checks localStorage │
        │  - No token found                │
        │  - user = null                   │
        └──────────────────┬───────────────┘
                           │
                           ▼
        ┌──────────────────────────────────┐
        │  Landing renders GuestFeed       │
        │  Navbar shows:                   │
        │  - "Log in" button               │
        │  - "Get Started" button          │
        │  - NO "Add Book" button          │
        │  - NO user menu                  │
        └──────────────────┬───────────────┘
                           │
                    ┌──────┴──────┬──────────┐
                    │             │          │
                    ▼             ▼          ▼
          ┌─────────────────┐ ┌───────┐ ┌─────────────┐
          │ Scrolls books   │ │Clicks │ │ Tries "Add  │
          │ Views them      │ │book   │ │ Book" or    │
          │ (Read-only)     │ │       │ │ messaging   │
          └─────────────────┘ │       │ └──────┬──────┘
                              ▼       │        │
                         ┌──────┐    │        │
                         │Modal │    │        │
                         │shows │    │        │
                         └──────┘    │        │
                              │      │        │
                              └──────┴────────┘
                                     │
                    ┌────────────────┴────────────────┐
                    │                                 │
                    ▼ (Clicks "Get Started")          ▼
        ┌──────────────────────────────────┐  (Clicks "Log in")
        │  /register page                  │  │
        │  Email, Password, Nickname form  │  │
        │                                  │  │
        │  [Submit]                        │  │
        └──────────────────┬───────────────┘  │
                           │                   │
                           ▼                   ▼
        ┌──────────────────────────────────┐  /login page
        │  Backend validates & creates     │  [Enter creds, submit]
        │  user                            │  │
        │  Returns token                   │  │
        └──────────────────┬───────────────┘  │
                           │                   │
                           ▼ (Auto-login)      ▼
        ┌──────────────────────────────────┐
        │  AuthContext.login(token)        │
        │  - Save token to localStorage    │
        │  - Fetch /users/me               │
        │  - Update user state             │
        └──────────────────┬───────────────┘
                           │
                    ┌──────┴──────┐
                    │   Success   │
                    ▼             │
        ┌──────────────────────────────────┐
        │  Landing detects user !== null   │
        │  Auto-redirects to /feed         │
        └──────────────────┬───────────────┘
                           │
                           ▼
        ┌──────────────────────────────────┐
        │  AUTHENTICATED FEED (/feed)      │
        │  - RequireAuth guard passed ✅   │
        │  - Books grid displayed          │
        │  - "Add Book" button visible ✅  │
        │  - Search users available ✅     │
        │  - All interactions enabled ✅   │
        │  - Navbar shows username ✅      │
        └──────────────────────────────────┘
```

---

## Authenticated User Flow Diagram

```
                START (Browser with saved token)
                            │
                            ▼
        ┌──────────────────────────────────┐
        │   User visits localhost:5173     │
        │   OR refreshes existing session  │
        └──────────────────┬───────────────┘
                           │
                           ▼
        ┌──────────────────────────────────┐
        │  Landing (/) loads               │
        │  AuthContext mounts              │
        │  Checks localStorage             │
        │  - Token FOUND ✅                │
        └──────────────────┬───────────────┘
                           │
                           ▼
        ┌──────────────────────────────────┐
        │  AuthContext.login(token)        │
        │  - Send: Bearer ${token}         │
        │  - GET /users/me                 │
        │  - Backend validates             │
        └──────────────────┬───────────────┘
                           │
                    ┌──────┴──────┐
                    ▼             ▼
            ┌──────────────┐  ┌──────────────┐
            │ Valid token  │  │Invalid token │
            │ ✅           │  │ ❌           │
            └──────┬───────┘  └──────┬───────┘
                   │                 │
                   ▼                 ▼
        ┌──────────────────────┐  ┌─────────────────────────┐
        │ setUser(userData)    │  │ Clear token             │
        │ user !== null        │  │ setUser(null)           │
        │                      │  │ user = null             │
        └──────────┬───────────┘  └──────────┬──────────────┘
                   │                         │
                   ▼                         ▼
        ┌──────────────────────────────┐   /login (redirect)
        │ Landing detects user !== null│
        │ Auto-redirects to /feed      │
        └──────────┬───────────────────┘
                   │
                   ▼
        ┌──────────────────────────────────┐
        │  RequireAuth Guard                │
        │  - user !== null? YES ✅          │
        │  - Renders Feed component         │
        └──────────┬───────────────────────┘
                   │
                   ▼
        ┌──────────────────────────────────┐
        │  Authenticated Dashboard         │
        │  /feed                           │
        │                                  │
        │  Navbar:                         │
        │  - Shows user email/nickname ✅  │
        │  - "Feed" link ✅                │
        │  - "My Profile" link ✅          │
        │  - "Logout" button ✅            │
        │                                  │
        │  Feed:                           │
        │  - Book grid from /books         │
        │  - "Add Book" button ✅          │
        │  - Search users ✅               │
        │  - All interactions enabled ✅   │
        └──────────────────────────────────┘
```

---

## Logout Flow Diagram

```
        Authenticated User in /feed
                   │
                   ▼
        ┌──────────────────────────────┐
        │  Clicks "Logout" button      │
        │  in Navbar                   │
        └──────────┬───────────────────┘
                   │
                   ▼
        ┌──────────────────────────────┐
        │  AuthContext.logout()        │
        │  - localStorage.removeItem   │
        │  - setUser(null)             │
        │  - dispatch logout event     │
        └──────────┬───────────────────┘
                   │
                   ▼
        ┌──────────────────────────────┐
        │  navigate('/login')          │
        └──────────┬───────────────────┘
                   │
                   ▼
        ┌──────────────────────────────┐
        │  Login page displayed        │
        │  [Email input]               │
        │  [Password input]            │
        │  [Login button]              │
        └──────────────────────────────┘
```

---

## Component Dependency Graph

```
                    App.jsx
                      │
         ┌────────────┼────────────┐
         │            │            │
         ▼            ▼            ▼
      Landing    AuthProvider   Routes
         │            │
         ├─►user state◄─┤
         │            │
         ▼            ▼
      GuestFeed    Feed (Protected)
         │            │
         ├──────┬─────┤
         │      │     │
         ▼      ▼     ▼
       Navbar  BookCard  AddBookDialog
         │      │
         ▼      ▼
    AuthPromptDialog
         │
         ▼
    [Navigate to Login/Register]
```

---

## State Transitions Diagram

```
            ┌─────────────────┐
            │   Initial Load  │
            │   user = null   │
            └────────┬────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼ (Guest Mode)           ▼ (Auth Mode)
    ┌─────────────┐         ┌──────────────┐
    │   GUEST     │         │   FETCHING   │
    │             │         │   Token      │
    │ localStorage│         │ validation   │
    │ = no token  │         │   (from API) │
    └──────┬──────┘         └──────┬───────┘
           │                       │
           │              ┌────────┴────────┐
           │              ▼                 ▼
           │          ┌────────┐        ┌────────┐
           │          │VALID   │        │INVALID │
           │          │TOKEN   │        │TOKEN   │
           │          └───┬────┘        └───┬────┘
           │              │                 │
           │      ┌───────▼──────┐   ┌──────▼──────┐
           │      │ AUTHENTICATED│   │ DELETE TOKEN│
           │      │ user loaded  │   │ BACK TO     │
           │      │ from /users/me   │ GUEST       │
           │      └───────┬──────┘   └──────┬──────┘
           │              │                 │
           │              └────────┬────────┘
           │                       │
           │         ┌─────────────┴──────────┐
           │         │                        │
           │         ▼ (User clicks "Get")    ▼
           │    ┌──────────────┐         ┌─────────┐
           │    │ REGISTERING  │         │ LOGGING │
           │    │              │         │  IN     │
           │    │ POST /register│       │ POST   │
           │    └──────┬───────┘         │ /login  │
           │           │                 └────┬────┘
           │           └─────────┬─────────────┘
           │                     │
           │              ┌──────▼────────┐
           │              │ TOKEN RECEIVED│
           │              │ Save to       │
           │              │ localStorage  │
           │              └──────┬────────┘
           │                     │
           └─────────────┬───────┘
                         │
                         ▼
                   ┌──────────────┐
                   │AUTHENTICATED │
                   │ user !== null│
                   └──────┬───────┘
                          │
                   ┌──────▼───────┐
                   │              │
            (refresh)      (logout)
                   │              │
                   ▼              ▼
            [STAY AUTH]      ┌──────────┐
                             │ DELETE   │
                             │ TOKEN    │
                             │ BACK TO  │
                             │ GUEST    │
                             └──────────┘
```

---

## Request/Response Cycle

### Registration Flow

```
FRONTEND                          BACKEND
   │                                 │
   │─────────────────────────────────►│
   │  POST /register                  │
   │  { email, password, nickname }   │
   │                                  │
   │  AuthContext.register()          │
   │  ├─ Validate inputs              │
   │  ├─ POST to backend              │
   │  └─ Wait for response            │
   │                                  │
   │                    Validate      │
   │                    Create user   │
   │                    Hash password │
   │                    Generate token
   │                                  │
   │◄─────────────────────────────────│
   │  200 OK                          │
   │  { user, access_token }          │
   │                                  │
   │  AuthContext:                    │
   │  ├─ localStorage.setItem(token)  │
   │  ├─ Call login(token)            │
   │  ├─ GET /users/me ──────────────►│
   │  │                               │
   │  │              Validate token   │
   │  │              Return user data │
   │  │◄──────────────────────────────│
   │  │  200 OK { id, email, ... }    │
   │  │                               │
   │  ├─ setUser(data)                │
   │  └─ navigate('/feed')            │
   │                                  │
   │  Feed renders ✅                 │
```

### Login Flow

```
FRONTEND                          BACKEND
   │                                 │
   │─────────────────────────────────►│
   │  POST /login                     │
   │  { email, password }             │
   │                                  │
   │                    Validate creds│
   │                    Generate token│
   │                                  │
   │◄─────────────────────────────────│
   │  200 OK                          │
   │  { access_token }                │
   │                                  │
   │  AuthContext.login(token):       │
   │  ├─ localStorage.setItem(token)  │
   │  ├─ GET /users/me ──────────────►│
   │  │  Header: Authorization: Bearer${token}
   │  │                               │
   │  │              Validate token   │
   │  │              Return user data │
   │  │◄──────────────────────────────│
   │  │  200 OK { id, email, ... }    │
   │  │                               │
   │  ├─ setUser(data)                │
   │  └─ navigate('/feed')            │
   │                                  │
   │  Authenticated ✅                │
```

### Session Validation Flow

```
FRONTEND (on page load/refresh)  BACKEND
   │                                 │
   │  AuthContext.useEffect():       │
   │  ├─ Check localStorage           │
   │  │  "token" = "eyJhbG..."       │
   │  │                              │
   │  └─ GET /users/me ─────────────►│
   │     Header: Authorization: Bearer${token}
   │                                  │
   │                    Validate token│
   │                                  │
   │     ┌──────────────────────────┐ │
   │     │ Valid?                   │ │
   │     │ ├─ YES: Return user data │ │
   │     │ └─ NO: Return 401        │ │
   │     └──────────────────────────┘ │
   │                                  │
   │◄─────────────────────────────────│
   │  200 OK                          │
   │  { id, email, ... }              │
   │                                  │
   │  setUser(data)                   │
   │  Navigate to /feed ✅            │
   │                                  │
   │  OR                              │
   │                                  │
   │◄─────────────────────────────────│
   │  401 Unauthorized                │
   │                                  │
   │  localStorage.removeItem(token)  │
   │  setUser(null)                   │
   │  Show login page ❌              │
```

---

## Debug Log Output Examples

### Complete Guest Session

```
[AUTH FLOW - 14:23:45] 🚀 AuthProvider mounted - checking token
[AUTH FLOW - 14:23:45] ❌ No token found in localStorage
[AUTH FLOW - 14:23:46] 📍 Landing page - user is guest
[AUTH FLOW - 14:23:47] 📚 GuestFeed mounted
[AUTH FLOW - 14:23:48] ✅ Books loaded {count: 15}

(User clicks a book)
[AUTH FLOW - 14:23:55] 🔐 AUTH PROMPT Guest clicked restricted action (post/interact)

(User clicks "Get Started")
→ NAVIGATION /browse → /register (user requesting auth)

(On registration page)
[AUTH FLOW - 14:24:10] 📝 Registration attempt {email: "newuser@example.com"}
[AUTH FLOW - 14:24:11] ✅ Auto-login after registration
[AUTH FLOW - 14:24:12] 🔑 Login attempt {token: "eyJhbGciOiJ..."}
[AUTH FLOW - 14:24:13] ✅ Login successful {user: 123}
👤 USER STATE
   User: {id: 123, email: "newuser@example.com", nickname: "New User"}
   Token: ✅ Present
   Authenticated: true
→ NAVIGATION /register → /feed (authenticated user redirecting)
```

### Returning User Session

```
[AUTH FLOW - 14:24:30] 🚀 AuthProvider mounted - checking token
[AUTH FLOW - 14:24:30] ✅ Token found, validating with backend
[AUTH FLOW - 14:24:31] ✅ User authenticated on mount {user: 123}
👤 USER STATE
   User: {id: 123, email: "user@example.com", nickname: "User"}
   Token: ✅ Present
   Authenticated: true
[AUTH FLOW - 14:24:32] 📍 Landing page - user is authenticated
→ NAVIGATION / → /feed (authenticated user redirecting)
```

### Logout Session

```
[AUTH FLOW - 14:25:00] 🚪 Logout
→ NAVIGATION /feed → /login (user logged out)
```

---

These visual diagrams help understand the complete authentication flow at a glance! 🎯
