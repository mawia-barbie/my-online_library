import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import BookCard from "../components/BookCard"

// Profile page with left sidebar (polaroid style) and books list.
// - Displays avatar, display name (nickname), bio, and rating.
// - If the logged-in user is viewing their own profile, they can edit name/bio/avatar.
export default function Profile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)

  // editable fields
  const [name, setName] = useState("")
  const [bio, setBio] = useState("")
  const [avatar, setAvatar] = useState(null) // base64
  const [currentUserId, setCurrentUserId] = useState(null)

  useEffect(() => {
    // load profile (public)
    fetch(`http://127.0.0.1:8000/users/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setProfile(data)
        setName(data.name || "")
        setBio(data.bio || "")
        setAvatar(data.avatar || null)
      })
      .catch((err) => console.error(err))

    // load books for this user
    fetch(`http://127.0.0.1:8000/users/${id}/books`)
      .then((res) => res.json())
      .then((data) => setBooks(data))
      .catch((err) => console.error(err))

    // get current logged in user id if token available
    const token = localStorage.getItem("token")
    if (token) {
      fetch("http://127.0.0.1:8000/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (!res.ok) throw new Error("not auth")
          return res.json()
        })
        .then((d) => setCurrentUserId(d.id))
        .catch(() => setCurrentUserId(null))
    }

    setLoading(false)
  }, [id])

  const canEdit = currentUserId && String(currentUserId) === String(id)

  const handleAvatar = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => setAvatar(reader.result)
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    const token = localStorage.getItem("token")
    if (!token) return navigate('/login')

    const body = { name, bio, avatar }
    const res = await fetch("http://127.0.0.1:8000/users/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      // refresh profile
      const updated = await fetch(`http://127.0.0.1:8000/users/${id}`).then(r=>r.json())
      setProfile(updated)
      setEditing(false)
      return
    }

    const data = await res.json().catch(()=>({}))
    alert(data.detail || data.message || 'Update failed')
  }

  const deleteBook = async (id) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return
      const res = await fetch(`http://127.0.0.1:8000/books/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        setBooks((prev) => prev.filter((b) => b.id !== id))
      } else {
        console.error('Failed to delete', await res.text())
      }
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) return null

  return (
    <div className="min-h-screen bg-[#f8f5f2] p-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6">

        {/* LEFT SIDEBAR PROFILE */}
        <aside className="md:col-span-1 bg-white rounded-2xl p-6 shadow">

          {/* avatar */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100">
                {avatar ? (
                  <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">🙂</div>
                )}
              </div>
              {canEdit && (
                <label className="absolute bottom-0 right-0 bg-black text-white p-1 rounded-full cursor-pointer text-xs">
                  <input type="file" accept="image/*" onChange={handleAvatar} className="hidden" />
                  ✎
                </label>
              )}
            </div>

            <h2 className="mt-4 text-xl font-bold text-gray-800">{profile?.name || 'No display name'}</h2>
            <p className="text-sm text-gray-500 mt-1">{profile?.bio || 'No bio yet'}</p>

            {/* RATING */}
            <div className="mt-6 bg-gray-50 rounded-xl w-full p-4 flex items-center justify-between">
              <div>
                <div className="text-2xl font-semibold text-gray-800">4.9</div>
                <div className="text-sm text-gray-500">User Rating</div>
              </div>
              <div className="text-yellow-400 text-2xl">★</div>
            </div>

            {canEdit ? (
              <div className="w-full mt-4">
                <button onClick={() => setEditing((s) => !s)} className="w-full bg-black text-white p-2 rounded-lg">
                  {editing ? 'Cancel' : 'Edit Profile'}
                </button>
              </div>
            ) : null}

          </div>
        </aside>

        {/* MAIN: books and edit form */}
        <main className="md:col-span-3">
          {canEdit && editing && (
            <div className="bg-white rounded-2xl p-6 shadow mb-6">
              <h3 className="text-lg font-semibold mb-3">Edit Profile</h3>

              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Display name"
                className="w-full border p-2 rounded mb-3"
              />

              <textarea value={bio} onChange={(e)=>setBio(e.target.value)} placeholder="Short bio" className="w-full border p-2 rounded mb-3" />

              <div className="flex gap-3">
                <button onClick={handleSave} className="bg-black text-white px-4 py-2 rounded">Save</button>
                <button onClick={()=>setEditing(false)} className="px-4 py-2 rounded border">Cancel</button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {books.map((b) => (
              <BookCard
                key={b.id}
                book={b}
                onOpen={() => {}}
                // only allow delete when viewing your own profile
                onDelete={canEdit ? deleteBook : undefined}
                owner={b.owner ? b.owner : { id: profile.id, name: profile.name || profile.email, avatar: profile.avatar }}
              />
            ))}
          </div>
        </main>

      </div>
    </div>
  )
}
