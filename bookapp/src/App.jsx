import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext.jsx"
import Landing from "./pages/Landing.jsx"
import GuestFeed from "./pages/GuestFeed.jsx"
import Feed from "./pages/Feed.jsx"
import ForYou from "./pages/ForYou.jsx"
import Login from "./pages/Login.jsx"
import Register from "./pages/Register.jsx"
import Profile from "./pages/Profile.jsx"
import Users from "./pages/Users.jsx"
import { RequireAuth } from "./components/RequireAuth.jsx"

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* Landing - redirects to feed */}
          <Route path="/" element={<Landing />} />

          {/* Guest accessible feed (with restrictions) */}
          <Route path="/browse" element={<GuestFeed />} />

          {/* Protected authenticated feeds */}
          <Route path="/feed" element={<RequireAuth><Feed /></RequireAuth>} />
          <Route path="/for-you" element={<RequireAuth><ForYou /></RequireAuth>} />

          {/* other pages */}
          <Route path="/users" element={<Users />} />
          <Route path="/profile/:id" element={<Profile />} />

          {/* auth pages */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App;