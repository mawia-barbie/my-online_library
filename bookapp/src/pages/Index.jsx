import { useState, useEffect, useRef } from "react"
import { Link, useNavigate } from "react-router-dom"
import BookCard from "../components/BookCard"
import AddBookDialog from "../components/AddBookDialog"
import BookDetailDialog from "../components/BookDetailDialog"
import ProfileSidebar from "../components/ProfileSidebar"

export default function Index() {
  const [books, setBooks] = useState([])
  const [open, setOpen] = useState(false)
  const [selectedBook, setSelectedBook] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [suggestions, setSuggestions] = useState([])
  const [sLoading, setSLoading] = useState(false)
  const searchRef = useRef(null)
  const navigate = useNavigate()

  // fetch current user if token exists
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return
    fetch('http://127.0.0.1:8000/users/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('not auth')
        return res.json()
      })
      .then((data) => setCurrentUser(data))
      .catch(() => {
        localStorage.removeItem('token')
        setCurrentUser(null)
      })
  }, [])

  useEffect(() => {
    fetch("http://127.0.0.1:8000/books")
      .then((res) => res.json())
      .then((data) => setBooks(data))
      .catch((err) => console.error(err))
  }, [])

  useEffect(() => {
    if (!searchQuery) return setSuggestions([])
    const t = setTimeout(() => {
      setSLoading(true)
      fetch(`http://127.0.0.1:8000/users?query=${encodeURIComponent(searchQuery)}`)
        .then(r=>r.json())
        .then(d=>setSuggestions(d.slice(0,5)))
        .catch(()=>setSuggestions([]))
        .finally(()=>setSLoading(false))
    }, 200)
    return () => clearTimeout(t)
  }, [searchQuery])

  const handleLogout = () => {
    localStorage.removeItem('token')
    setCurrentUser(null)
    navigate('/login')
  }

  // ➕ Add book
  // When creating a book we need to send the JWT in the Authorization header
  // so the backend can associate the book with the authenticated user.
const addBook = async (book) => {
  try {
    const token = localStorage.getItem('token')
    if (!token) {
      // if not logged in, send user to login page
      return navigate('/login')
    }
    const res = await fetch("http://127.0.0.1:8000/books", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(book),
    })

    if (res.status === 401) {
      // token invalid/expired
      localStorage.removeItem('token')
      return navigate('/login')
    }

    const data = await res.json()

    // add to UI after backend saves
    // attach owner info from currentUser so UI shows who posted it
    const ownerData = {
      id: currentUser.id,
      name: currentUser.name || currentUser.email,
      avatar: currentUser.avatar,
    }
    setBooks((prev) => [...prev, { ...data, owner: ownerData }])

  } catch (err) {
    console.error("Error adding book:", err)
  }
}
  // 🗑️ Delete book
  const deleteBook = async (id) => {
  try {
    const token = localStorage.getItem('token')
    if (!token) return navigate('/login')
    await fetch(`http://127.0.0.1:8000/books/${id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` },
    })

    // update UI after backend deletes
    setBooks((prev) => prev.filter((b) => b.id !== id))
    setSelectedBook(null)

  } catch (err) {
    console.error("Delete failed:", err)
  }
}
  return (
    <div className="min-h-screen bg-[#f8f5f2] p-6">

      {/* HEADER */}
      <div className="max-w-6xl mx-auto flex items-center justify-between mb-8">
        <h1 className="text-3xl font-semibold text-gray-700">
          📚 My Bookshelf
        </h1>

        <div className="flex items-center gap-3">
          <div className="relative">
            <input ref={searchRef} value={searchQuery} onChange={(e)=>setSearchQuery(e.target.value)} placeholder="Search users..." className="border p-1 rounded px-2 text-sm" />
            {suggestions.length > 0 && (
              <div className="absolute mt-1 bg-white shadow rounded w-56">
                {suggestions.map(s=> (
                  <a key={s.id} href={`/profile/${s.id}`} className="block px-3 py-2 text-sm hover:bg-gray-100">{s.name || s.email}</a>
                ))}
              </div>
            )}
          </div>

          {currentUser ? (
            <>
              <Link to={`/profile/${currentUser.id}`} className="flex items-center gap-2 text-gray-700 hover:underline">
                {currentUser.avatar ? (
                  <img src={currentUser.avatar} alt="me" className="w-6 h-6 rounded-full object-cover" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-500">🙂</div>
                )}
                <span>My Profile</span>
              </Link>
               <button onClick={handleLogout} className="text-gray-600">Logout</button>
               <button
                onClick={() => setOpen(true)}
                className="bg-black text-white px-4 py-2 rounded-xl hover:opacity-80 transition"
              >
                + Add Book
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-gray-700 hover:underline">Login</Link>
              <Link to="/register" className="text-gray-700 hover:underline">Register</Link>
            </>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6">
        <ProfileSidebar />

        <div className="md:col-span-3">
          {/* EMPTY STATE */}
          {books.length === 0 ? (
            <div className="text-center mt-20 text-gray-400">
              No books yet 📖 <br />
              Start adding your reading journey
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {books.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  onOpen={() => setSelectedBook(book)}
                  onDelete={currentUser && book.owner && String(currentUser.id) === String(book.owner.id) ? deleteBook : undefined}
                  owner={book.owner}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ADD BOOK MODAL */}
      {open && (
        <AddBookDialog
          onClose={() => setOpen(false)}
          onSave={(book) => {
            addBook(book)
            setOpen(false)
          }}
        />
      )}

      {/* BOOK DETAIL MODAL */}
      <BookDetailDialog
        book={selectedBook}
        open={!!selectedBook}
        onClose={() => setSelectedBook(null)}
        onDelete={deleteBook}
      />
    </div>
  )
}