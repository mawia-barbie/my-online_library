import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect } from "react"

export default function BookDetailDialog({ book, open, onClose, onDelete, onUpdate, currentUser }) {
  const [editStatus, setEditStatus] = useState(book?.status || "")
  const [updating, setUpdating] = useState(false)

  // Debug: log ownership info when book changes
  useEffect(() => {
    if (book) {
      console.log("Book loaded:", {
        id: book.id,
        owner_id: book.owner_id,
        owner: book.owner,
        currentUser_id: currentUser?.id,
        isOwner: book.owner_id === currentUser?.id || (book.owner && book.owner.id === currentUser?.id)
      })
    }
  }, [book, currentUser])

  if (!open || !book) return null

  const statusColors = {
    "Reading": "bg-blue-100 text-blue-800 border-blue-300",
    "Done": "bg-green-100 text-green-800 border-green-300",
    "To Read": "bg-yellow-100 text-yellow-800 border-yellow-300",
  }

  const statusOptions = ["To Read", "Reading", "Done"]

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
          className="bg-white w-full max-w-3xl rounded-2xl overflow-hidden shadow-xl max-h-[90vh] overflow-y-auto"
        >

          {/* IMAGE */}
          <div className="h-72 bg-gray-100 relative">
            {book.image ? (
              <img
                src={book.image}
                alt={book.title}
                className="w-full h-full object-contain object-center"
                onError={(e) => e.target.style.display = 'none'}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <div className="text-6xl mb-2">📖</div>
                  <p>No Image</p>
                </div>
              </div>
            )}
          </div>

          {/* CONTENT */}
          <div className="p-8">

            {/* HEADER with STATUS */}
            <div className="flex justify-between items-start mb-6">
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  {book.title}
                </h2>
                <p className="text-xl text-gray-600 mb-4">{book.author}</p>
                
                {/* STATUS SELECTOR */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-sm font-medium text-gray-700">Status:</span>
                  <div className="flex gap-2">
                    {statusOptions.map((status) => (
                      <button
                        key={status}
                        onClick={() => setEditStatus(status)}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition border ${
                          editStatus === status
                            ? statusColors[status] + ' border-current'
                            : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* CURRENT STATUS BADGE */}
              {book.status && (
                <span
                  className={`text-sm px-4 py-2 rounded-full font-semibold border ${statusColors[book.status] || 'bg-gray-100 text-gray-800 border-gray-300'}`}
                >
                  {book.status}
                </span>
              )}
            </div>

            {/* RATING */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-600 mb-2">Rating</h3>
              <div className="text-2xl">
                {"⭐".repeat(book.rating || 0)}
                {"☆".repeat(5 - (book.rating || 0))}
              </div>
              {book.rating && <p className="text-sm text-gray-500 mt-1">{book.rating} out of 5 stars</p>}
            </div>

            {/* REVIEW */}
            {book.review && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-600 mb-2">
                  ✍️ Review
                </h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line bg-gray-50 p-4 rounded-lg">
                  {book.review}
                </p>
              </div>
            )}

            {/* BOOK INFO */}
            <div className="grid grid-cols-2 gap-4 mb-6 bg-gray-50 p-4 rounded-lg">
              <div>
                <p className="text-xs text-gray-600 font-medium">Title</p>
                <p className="text-sm text-gray-900 font-semibold">{book.title}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 font-medium">Author</p>
                <p className="text-sm text-gray-900 font-semibold">{book.author}</p>
              </div>
              {book.status && (
                <div>
                  <p className="text-xs text-gray-600 font-medium">Current Status</p>
                  <p className="text-sm text-gray-900 font-semibold">{book.status}</p>
                </div>
              )}
              {book.rating && (
                <div>
                  <p className="text-xs text-gray-600 font-medium">Your Rating</p>
                  <p className="text-sm text-gray-900 font-semibold">{book.rating}/5 ⭐</p>
                </div>
              )}
            </div>

            {/* OWNER INFO */}
            {book.owner && (
              <div className="mb-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                <p className="text-xs text-gray-600 font-medium mb-2">Shared by</p>
                <div className="flex items-center gap-3">
                  {book.owner.avatar ? (
                    <img 
                      src={book.owner.avatar} 
                      alt={book.owner.name || book.owner.email} 
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-indigo-200 flex items-center justify-center text-lg">👤</div>
                  )}
                  <div>
                    <p className="font-semibold text-gray-900">{book.owner.name || book.owner.email}</p>
                    {book.owner.name && <p className="text-xs text-gray-600">{book.owner.email}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* ACTIONS */}
            <div className="flex justify-between items-center pt-6 border-t">

              {/* DELETE (only if owner) */}
              {onDelete && (
                <button
                  onClick={() => {
                    if (window.confirm("Are you sure you want to delete this book?")) {
                      onDelete(book.id)
                      onClose()
                    }
                  }}
                  className="text-red-600 hover:text-red-700 hover:underline text-sm font-medium"
                >
                  🗑️ Delete Book
                </button>
              )}

              <div className="flex gap-3">

                {/* UPDATE STATUS (only if owner and status changed) */}
                {onUpdate && currentUser && (book.owner_id === currentUser.id || (book.owner && book.owner.id === currentUser.id)) && editStatus !== book.status && (
                  <button
                    onClick={async () => {
                      setUpdating(true)
                      try {
                        const token = localStorage.getItem('token')
                        const res = await fetch(`http://127.0.0.1:8000/books/${book.id}`, {
                          method: "PUT",
                          headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`,
                          },
                          body: JSON.stringify({ status: editStatus }),
                        })
                        if (res.ok) {
                          const updated = await res.json()
                          onUpdate(updated)
                          onClose()
                        } else {
                          alert("Failed to update book status")
                        }
                      } catch (err) {
                        console.error("Update failed:", err)
                        alert("Error updating book status")
                      } finally {
                        setUpdating(false)
                      }
                    }}
                    disabled={updating}
                    className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 font-medium transition disabled:opacity-50"
                  >
                    {updating ? "Saving..." : "💾 Save Status"}
                  </button>
                )}

                {/* CLOSE */}
                <button
                  onClick={onClose}
                  className="px-6 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium transition"
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