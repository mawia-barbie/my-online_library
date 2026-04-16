import { BrowserRouter, Routes, Route } from "react-router-dom"
import Index from "./pages/Index"
import Login from "./pages/Login"
import Register from "./pages/Register"
import Profile from "./pages/Profile"
import Users from "./pages/Users"

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* main app */}
        <Route path="/" element={<Index />} />
        <Route path="/users" element={<Users />} />
        <Route path="/profile/:id" element={<Profile />} />

        {/* auth pages */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

      </Routes>
    </BrowserRouter>
  )
}

export default App;