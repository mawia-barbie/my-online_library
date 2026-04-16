import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"

export default function ProfileSidebar() {
  const [profile, setProfile] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) return
    fetch("http://127.0.0.1:8000/users/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("not auth")
        return res.json()
      })
      .then((data) => setProfile(data))
      .catch(() => setProfile(null))
  }, [])

  if (!profile) {
    return (
      <div className="hidden md:block md:col-span-1">
        <div className="bg-white rounded-2xl p-4 shadow h-full max-w-xs">
          <div className="w-full h-20 flex items-center justify-center text-gray-400">Not signed in</div>
          <div className="mt-3 text-center text-sm">
            <Link to="/login" className="text-blue-600 hover:underline">Login</Link>
            <span className="mx-2 text-gray-300">|</span>
            <Link to="/register" className="text-blue-600 hover:underline">Register</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <aside className="hidden md:block md:col-span-1">
      <div className="bg-white rounded-2xl p-4 shadow max-w-[14rem]">
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100">
            {profile.avatar ? (
              <img src={profile.avatar} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">🙂</div>
            )}
          </div>

          <h3 className="mt-3 text-md font-semibold text-center">{profile.name || profile.email}</h3>
          <p className="text-sm text-gray-500 mt-1 line-clamp-2 text-center">{profile.bio || 'No bio yet'}</p>

          <div className="mt-3 w-full">
            <div className="flex gap-2">
              <button onClick={() => navigate(`/profile/${profile.id}`)} className="flex-1 bg-black text-white py-1 text-sm rounded">Profile</button>
              <button onClick={() => navigate('/profile/' + profile.id)} className="flex-1 border rounded py-1 text-sm">Edit</button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
