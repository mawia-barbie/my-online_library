import { motion, AnimatePresence } from "framer-motion"

export default function BookDetailDialog({ book, open, onClose, onDelete }) {
  if (!open || !book) return null

  const statusColor = {
    "Reading": "bg-blue-100 text-blue-600",
    "Done": "bg-green-100 text-green-600",
    "To Read": "bg-yellow-100 text-yellow-600",
  }

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white w-full max-w-2xl rounded-2xl overflow-hidden shadow-xl"
        >

          {/* IMAGE */}
          <div className="h-64 bg-gray-100">
            {book.image ? (
              <img
                src={book.image}
                alt={book.title}
                className="w-full h-full object-contain object-center"
              />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                No Image 📷
              </div>
            )}
          </div>

          {/* CONTENT */}
          <div className="p-6">

            {/* HEADER */}
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-semibold text-gray-800">
                  {book.title}
                </h2>
                <p className="text-gray-500">{book.author}</p>
              </div>

              {/* STATUS */}
              <span
                className={`text-xs px-3 py-1 rounded-full ${statusColor[book.status]}`}
              >
                {book.status}
              </span>
            </div>

            {/* RATING */}
            <div className="text-yellow-400 mt-2">
              {"⭐".repeat(book.rating || 0)}
              {"☆".repeat(5 - (book.rating || 0))}
            </div>

            {/* REVIEW */}
            <div className="mt-5">
              <h3 className="text-sm font-semibold text-gray-600 mb-1">
                My Thoughts
              </h3>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {book.review}
              </p>
            </div>

            {/* ACTIONS */}
            <div className="flex justify-between items-center mt-6">

              {/* DELETE */}
              <button
                onClick={() => onDelete(book.id)}
                className="text-red-500 hover:underline text-sm"
              >
                🗑️ Delete
              </button>

              <div className="flex gap-3">

                {/* CLOSE */}
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700"
                >
                  Close
                </button>

              </div>

            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}