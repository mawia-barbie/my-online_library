import { motion, AnimatePresence } from "framer-motion"

export default function BookCard({ book, onOpen, onDelete }) {
  if (!book) return null

  const statusColor = {
    Reading: "bg-blue-100 text-blue-600",
    Done: "bg-green-100 text-green-600",
    "To Read": "bg-yellow-100 text-yellow-600",
  }

  return (
    <div
      className="bg-white rounded-2xl shadow p-4 cursor-pointer hover:shadow-md transition relative"
      onClick={onOpen}
    >
      {/* IMAGE */}
      <div className="h-56 flex items-start justify-center">
        <div className="bg-white p-3 rounded-lg shadow-md transform rotate-1 w-[90%] max-w-xs">
          <div className="bg-gray-100 rounded-md overflow-hidden h-48">
            {book.image ? (
              <img
                src={book.image}
                alt={book.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                No Image 📷
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="mt-3">
        <h3 className="text-lg font-semibold text-gray-800">{book.title}</h3>
        <p className="text-sm text-gray-500">{book.author}</p>

        <div className="flex items-center justify-between mt-3">
          <div className="text-yellow-400">
            {"⭐".repeat(book.rating || 0)}
            {"☆".repeat(5 - (book.rating || 0))}
          </div>

          <span
            className={`text-xs px-2 py-1 rounded-full ${statusColor[book.status]}`}
          >
            {book.status}
          </span>
        </div>
      </div>

      {/* DELETE BUTTON */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onDelete && onDelete(book.id)
        }}
        className="absolute top-3 right-3 text-red-500 text-sm"
        aria-label="Delete book"
      >
        🗑️
      </button>
    </div>
  )
}