import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { BookMarked } from "lucide-react"

export default function Navbar({ onAuthRequired }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="w-full bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto flex items-center justify-between py-4 px-4">
        <Link to="/" className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-600 to-pink-500 flex items-center justify-center text-white shadow">
            <BookMarked size={18} />
          </div>
          <span className="font-semibold text-lg text-gray-800">Book Exchange</span>
        </Link>

        <nav className="flex items-center gap-6">
          <Link to="/" className="text-gray-700 hover:text-gray-900 font-medium">Home</Link>
          {user && (
            <>
              <Link to="/feed" className="text-gray-700 hover:text-gray-900 font-medium">Explore</Link>
              <Link to="/for-you" className="text-gray-700 hover:text-gray-900 font-medium">For You</Link>
              <Link to={`/profile/${user.id}`} className="text-gray-700 hover:text-gray-900 font-medium">My Profile</Link>
            </>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="text-sm text-gray-600">{user.nickname || user.email}</span>
              <button onClick={handleLogout} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="px-4 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Log in
              </Link>
              <Link to="/register" className="px-4 py-2 rounded-md bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700">
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
