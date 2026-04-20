import { useState, useEffect } from "react"
import Navbar from "../components/Navbar"
import { BookCard } from "../components/BookCard"
import { AuthPromptDialog } from "../components/AuthPromptDialog"
import { useAuth } from "../context/AuthContext"
import { logAuthPrompt, logAuthFlow } from "../utils/authDebug"

export default function GuestFeed() {
  const { user } = useAuth()
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedBook, setSelectedBook] = useState(null)
  const [showAuthPrompt, setShowAuthPrompt] = useState(false)

  useEffect(() => {
    logAuthFlow("📚 GuestFeed mounted")
    fetch("http://127.0.0.1:8000/books")
      .then((res) => res.json())
      .then((data) => {
        logAuthFlow("✅ Books loaded", { count: (data || []).length })
        setBooks(data || [])
      })
      .catch((err) => {
        logAuthFlow("❌ Failed to fetch books", { error: err.message })
        console.error("Failed to fetch books:", err)
      })
      .finally(() => setLoading(false))
  }, [])

  const handleRestrictedAction = () => {
    logAuthPrompt("Guest clicked restricted action (post/interact)")
    setShowAuthPrompt(true)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onAuthRequired={handleRestrictedAction} />

      <main className="max-w-6xl mx-auto py-12 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">For you</h1>
          <p className="text-gray-600 mt-2">Available books from people in your community.</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border border-indigo-600 border-t-transparent"></div>
          </div>
        ) : books.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No books available yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {books.map((book) => (
              <div
                key={book.id}
                className="bg-white rounded-2xl shadow-sm hover:shadow-md transition overflow-hidden cursor-pointer group"
                onClick={handleRestrictedAction}
              >
                <BookCard book={book} disabled={!user} />
                {!user && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center rounded-2xl">
                    <div className="text-white text-center">
                      <p className="font-semibold">Sign in to interact</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      <AuthPromptDialog
        open={showAuthPrompt}
        onClose={() => setShowAuthPrompt(false)}
        title="Sign in to continue"
      />
    </div>
  )
}
