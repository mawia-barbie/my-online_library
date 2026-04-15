
import { useState, useEffect } from "react"
import BookCard from "../components/BookCard"
import AddBookDialog from "../components/AddBookDialog"
import BookDetailDialog from "../components/BookDetailDialog"

export default function Index() {
  const [books, setBooks] = useState([])
  const [open, setOpen] = useState(false)
  const [selectedBook, setSelectedBook] = useState(null)

  useEffect(() => {
    fetch("http://127.0.0.1:8000/books")
      .then((res) => res.json())
      .then((data) => setBooks(data))
      .catch((err) => console.error(err))
  }, [])

  // ➕ Add book
  
const addBook = async (book) => {
  try {
    const res = await fetch("http://127.0.0.1:8000/books", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(book),
    })

    const data = await res.json()

    // add to UI after backend saves
    setBooks((prev) => [...prev, data])

  } catch (err) {
    console.error("Error adding book:", err)
  }
}
  // 🗑️ Delete book
  const deleteBook = async (id) => {
  try {
    await fetch(`http://127.0.0.1:8000/books/${id}`, {
      method: "DELETE",
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
      <div className="max-w-5xl mx-auto flex items-center justify-between mb-8">
        <h1 className="text-3xl font-semibold text-gray-700">
          📚 My Bookshelf
        </h1>

        <button
          onClick={() => setOpen(true)}
          className="bg-black text-white px-4 py-2 rounded-xl hover:opacity-80 transition"
        >
          + Add Book
        </button>
      </div>

      {/* EMPTY STATE */}
      {books.length === 0 ? (
        <div className="text-center mt-20 text-gray-400">
          No books yet 📖 <br />
          Start adding your reading journey
        </div>
      ) : (
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {books.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onOpen={() => setSelectedBook(book)}
              onDelete={deleteBook}
            />
          ))}
        </div>
      )}

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