import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { RequireAuth } from "../components/RequireAuth"
import Navbar from "../components/Navbar"
import { BookCard } from "../components/BookCard"
import BookDetailDialog from "../components/BookDetailDialog"
import { Plus, Compass, X } from "lucide-react"
import StarRating from "../components/StarRating"

function FeedInner() {
  const { user } = useAuth()
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [selectedBook, setSelectedBook] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [suggestions, setSuggestions] = useState([])
  const [sLoading, setSLoading] = useState(false)
  const searchRef = useRef(null)
  const fileInputRef = useRef(null)
  const navigate = useNavigate()
  
  // Form state for adding book
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    rating: 0,
    review: "",
    status: "",
    genre: "",
    image: "",
  })

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result }))
      }
      reader.readAsDataURL(file)
    }
  }

  useEffect(() => {
    setLoading(true)
    fetch("http://127.0.0.1:8000/books")
      .then((res) => res.json())
      .then((data) => {
        setBooks(Array.isArray(data) ? data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) : [])
      })
      .catch((err) => {
        console.error("Failed to fetch books:", err)
        setBooks([])
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!searchQuery) return setSuggestions([])
    const t = setTimeout(() => {
      setSLoading(true)
      // Search both books AND users simultaneously
      Promise.all([
        fetch(`http://127.0.0.1:8000/books/search?query=${encodeURIComponent(searchQuery)}`)
          .then(r => r.ok ? r.json() : [])
          .catch(() => []),
        fetch(`http://127.0.0.1:8000/users?query=${encodeURIComponent(searchQuery)}`)
          .then(r => r.ok ? r.json() : [])
          .catch(() => [])
      ])
        .then(([books, users]) => {
          // Combine results: books first, then users
          const combined = [
            // Books results (up to 5)
            ...(Array.isArray(books) ? books.slice(0, 5).map(book => ({
              type: "book",
              id: book.id,
              name: `📖 ${book.title} by ${book.author}`,
              title: book.title,
              author: book.author,
              owner: book.owner
            })) : []),
            // Users results (up to 5)
            ...(Array.isArray(users) ? users.slice(0, 5).map(user => ({
              type: "user",
              id: user.id,
              name: `👤 ${user.name || user.email}`,
              email: user.email
            })) : [])
          ]
          setSuggestions(combined.slice(0, 10)) // Show up to 10 total results
        })
        .catch(() => setSuggestions([]))
        .finally(() => setSLoading(false))
    }, 200)
    return () => clearTimeout(t)
  }, [searchQuery])

  const addBook = async (bookData) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        return navigate('/login')
      }
      const res = await fetch("http://127.0.0.1:8000/books", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(bookData),
      })

      if (res.status === 401) {
        localStorage.removeItem('token')
        return navigate('/login')
      }

      if (!res.ok) {
        const error = await res.json()
        alert(`Error: ${error.detail || 'Failed to add book'}`)
        return
      }

      const data = await res.json()
      const ownerData = {
        id: user.id,
        name: user.name || user.email,
        avatar: user.avatar,
      }
      setBooks((prev) => [{ ...data, owner: ownerData }, ...prev])
      // Reset form
      setFormData({ title: "", author: "", rating: 0, review: "", status: "", genre: "", image: "" })
      setOpen(false)
    } catch (err) {
      console.error("Error adding book:", err)
      alert("Error adding book. Check console for details.")
    }
  }

  const deleteBook = async (id) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return navigate('/login')
      await fetch(`http://127.0.0.1:8000/books/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` },
      })
      setBooks((prev) => prev.filter((b) => b.id !== id))
      setSelectedBook(null)
    } catch (err) {
      console.error("Delete failed:", err)
    }
  }

  const updateBook = (updatedBook) => {
    // Update the book in the list
    setBooks((prev) =>
      prev.map((b) =>
        b.id === updatedBook.id
          ? { ...b, ...updatedBook }
          : b
      )
    )
    // Update selected book display
    if (selectedBook && selectedBook.id === updatedBook.id) {
      setSelectedBook({ ...selectedBook, ...updatedBook })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-6xl mx-auto py-12 px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Compass size={28} className="text-indigo-600" />
              <h1 className="text-3xl font-bold text-gray-900">Explore</h1>
            </div>
            <p className="text-gray-600">Discover books from everyone in the community</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                ref={searchRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users..."
                className="border border-gray-300 px-3 py-2 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />

              {suggestions.length > 0 && (
                <div className="absolute mt-1 bg-white shadow-lg rounded-lg w-56 z-10">
                  {suggestions.map((s) => (
                    s.type === "book" ? (
                      <button
                        key={`book-${s.id}`}
                        onClick={() => {
                          // Set search query to filter books by this title
                          fetch(`http://127.0.0.1:8000/books/search?query=${encodeURIComponent(s.title)}`)
                            .then(r => r.json())
                            .then(books => {
                              setBooks(books)
                              setSuggestions([])
                              setSearchQuery("")
                            })
                            .catch(err => console.error("Failed to search books:", err))
                        }}
                        className="w-full text-left block px-3 py-2 text-sm hover:bg-gray-100 border-b last:border-b-0"
                      >
                        <div className="font-medium text-gray-900">📖 {s.title}</div>
                        <div className="text-xs text-gray-500">by {s.author}</div>
                      </button>
                    ) : (
                      <a 
                        key={`user-${s.id}`}
                        href={`/profile/${s.id}`} 
                        className="block px-3 py-2 text-sm hover:bg-gray-100 border-b last:border-b-0"
                      >
                        <div className="font-medium">👤 {s.email.split('@')[0]}</div>
                        <div className="text-xs text-gray-500">{s.email}</div>
                      </a>
                    )
                  ))}
                </div>
              )}
            </div>

            <button 
              onClick={() => setOpen(true)} 
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition"
            >
              <Plus size={18} />
              Add Book
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border border-indigo-600 border-t-transparent"></div>
          </div>
        ) : books.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No books available yet. Be the first to add one!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {books.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onOpen={() => setSelectedBook(book)}
                onDelete={user && book.owner && String(user.id) === String(book.owner.id) ? deleteBook : undefined}
                owner={book.owner}
              />
            ))}
          </div>
        )}
      </main>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          
          <div className="relative bg-white rounded-2xl w-full max-w-lg mx-4 p-6 shadow-lg max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>

            <h2 className="text-2xl font-bold text-gray-900 mb-6">Add a New Book</h2>

            <form 
              onSubmit={(e) => {
                e.preventDefault()
                if (!formData.title || !formData.author) {
                  alert("Title and author are required")
                  return
                }
                addBook(formData)
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Book title"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Book Cover Image</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="cursor-pointer mx-auto w-32 aspect-[3/4] rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center gap-2 overflow-hidden hover:border-indigo-600 hover:bg-indigo-50 transition"
                >
                  {formData.image ? (
                    <img src={formData.image} alt="cover" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-xs text-gray-500 text-center">Click to upload</span>
                    </>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Author *</label>
                <input
                  type="text"
                  value={formData.author}
                  onChange={(e) => setFormData({...formData, author: e.target.value})}
                  placeholder="Author name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reading Status</label>
                <div className="flex gap-2">
                  {["To Read", "Reading", "Done"].map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setFormData({...formData, status})}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition border ${
                        formData.status === status
                          ? status === "To Read"
                            ? "bg-yellow-100 text-yellow-800 border-yellow-300"
                            : status === "Reading"
                            ? "bg-blue-100 text-blue-800 border-blue-300"
                            : "bg-green-100 text-green-800 border-green-300"
                          : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
                      }`}
                    >
                      {status === "To Read" ? "📖" : status === "Reading" ? "👀" : "✅"} {status}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Genre (Optional)</label>
                <input
                  type="text"
                  value={formData.genre || ""}
                  onChange={(e) => setFormData({...formData, genre: e.target.value})}
                  placeholder="e.g., Fiction, Romance, Thriller, Mystery"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                <StarRating 
                  rating={formData.rating} 
                  onRate={(rating) => setFormData({...formData, rating})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Review</label>
                <textarea
                  value={formData.review}
                  onChange={(e) => setFormData({...formData, review: e.target.value})}
                  placeholder="Your thoughts about the book"
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                >
                  Add Book
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <BookDetailDialog
        book={selectedBook}
        open={!!selectedBook}
        onClose={() => setSelectedBook(null)}
        onDelete={deleteBook}
        onUpdate={updateBook}
        currentUser={user}
      />
    </div>
  )
}

export default function Feed() {
  return (
    <RequireAuth>
      <FeedInner />
    </RequireAuth>
  )
}
