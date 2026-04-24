import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { RequireAuth } from "../components/RequireAuth"
import Navbar from "../components/Navbar"
import { BookCard } from "../components/BookCard"
import BookDetailDialog from "../components/BookDetailDialog"
import { Heart } from "lucide-react"

function ForYouInner() {
  const { user } = useAuth()
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedBook, setSelectedBook] = useState(null)
  const [showNearbyOnly, setShowNearbyOnly] = useState(false)

  useEffect(() => {
    setLoading(true)
    const token = localStorage.getItem('token')

    fetch("http://127.0.0.1:8000/books/for-you", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => {
        if (!res.ok) throw new Error("For You endpoint failed")
        return res.json()
      })
      .then((data) => {
        setBooks(Array.isArray(data) ? data : [])
      })
      .catch((err) => {
        console.error("Failed to fetch For You books:", err)
        setBooks([])
      })
      .finally(() => setLoading(false))
  }, [user])

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

  const visibleBooks = showNearbyOnly ? books.filter((book) => book.feed_reason?.includes("Nearby")) : books

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-6xl mx-auto py-12 px-4">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Heart size={28} className="text-red-500" />
            <h1 className="text-3xl font-bold text-gray-900">For You</h1>
          </div>
          <p className="text-gray-600">Books tailored to your interests</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setShowNearbyOnly(false)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                !showNearbyOnly
                  ? "bg-gray-900 text-white"
                  : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Explore all genres
            </button>
            <button
              type="button"
              onClick={() => setShowNearbyOnly(true)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                showNearbyOnly
                  ? "bg-emerald-600 text-white"
                  : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Nearby first
            </button>
            <Link to="/" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
              Explore all books
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border border-indigo-600 border-t-transparent"></div>
          </div>
        ) : visibleBooks.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-5xl mb-4">📚</div>
            <p className="text-gray-600">No books match this view yet.</p>
            <p className="text-sm text-gray-500 mt-2">Try adding more genres in your profile or switch back to Explore all genres.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleBooks.map((book) => (
                <div key={book.id} className="relative group">
                  <BookCard
                    book={book}
                    onOpen={() => setSelectedBook(book)}
                    owner={book.owner}
                    currentUser={user}
                  />
                  {book.matches_interests && (
                    <div className="absolute top-2 right-2 bg-emerald-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                      Matches your interests
                    </div>
                  )}
                  {book.feed_reason && (
                    <div className="mt-2 text-xs font-medium text-gray-500">
                      {book.feed_reason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      <BookDetailDialog
        book={selectedBook}
        open={!!selectedBook}
        onClose={() => setSelectedBook(null)}
        onUpdate={updateBook}
        currentUser={user}
      />
    </div>
  )
}

export default function ForYou() {
  return (
    <RequireAuth>
      <ForYouInner />
    </RequireAuth>
  )
}
