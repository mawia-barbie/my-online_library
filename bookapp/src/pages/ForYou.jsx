import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import { RequireAuth } from "../components/RequireAuth"
import Navbar from "../components/Navbar"
import { BookCard } from "../components/BookCard"
import BookDetailDialog from "../components/BookDetailDialog"
import { Heart } from "lucide-react"
import { personalizeFeed, logRecommendationMetrics } from "../utils/recommendations"

function ForYouInner() {
  const { user } = useAuth()
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedBook, setSelectedBook] = useState(null)

  useEffect(() => {
    setLoading(true)
    const token = localStorage.getItem('token')
    
    // Try to fetch personalized recommendations first
    fetch("http://127.0.0.1:8000/books/recommendations", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => {
        if (!res.ok) throw new Error("Recommendations endpoint not available")
        return res.json()
      })
      .then((data) => {
        setBooks(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        // Fallback: fetch all books and apply client-side personalization
        fetch("http://127.0.0.1:8000/books")
          .then((res) => res.json())
          .then((data) => {
            const personalized = applyClientSidePersonalization(Array.isArray(data) ? data : [], user)
            setBooks(personalized)
          })
          .catch((err) => {
            console.error("Failed to fetch books:", err)
            setBooks([])
          })
      })
      .finally(() => setLoading(false))
  }, [user])

  const applyClientSidePersonalization = (allBooks, currentUser) => {
    const personalized = personalizeFeed(allBooks, currentUser, 20)
    logRecommendationMetrics(personalized)
    return personalized
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
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Heart size={28} className="text-red-500" />
            <h1 className="text-3xl font-bold text-gray-900">For You</h1>
          </div>
          <p className="text-gray-600">Books tailored to your interests</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border border-indigo-600 border-t-transparent"></div>
          </div>
        ) : books.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-5xl mb-4">📚</div>
            <p className="text-gray-600">No personalized recommendations yet. Update your favorite genres in your profile!</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {books.map((book) => (
                <div key={book.id} className="relative group">
                  <BookCard
                    book={book}
                    onOpen={() => setSelectedBook(book)}
                    owner={book.owner}
                  />
                  {book.score && book.score > 0 && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold opacity-0 group-hover:opacity-100 transition">
                      Recommended
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
