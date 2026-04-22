import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect } from "react"
import { CITY_OPTIONS, getAreasForCity } from "../utils/locations"
import { GENRE_OPTIONS } from "../utils/genres"

export default function BookDetailDialog({ book, open, onClose, onDelete, onUpdate, currentUser }) {
  const [editStatus, setEditStatus] = useState(book?.status || "")
  const [editCity, setEditCity] = useState(book?.city || currentUser?.city || "")
  const [editArea, setEditArea] = useState(book?.area || currentUser?.area || "")
  const [editPickupHint, setEditPickupHint] = useState(book?.pickup_hint || "")
  const [editGenreTags, setEditGenreTags] = useState(book?.genre_tags || (book?.genre ? [book.genre] : []))
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    setEditStatus(book?.status || "")
    setEditCity(book?.city || currentUser?.city || "Nairobi")
    setEditArea(book?.area || currentUser?.area || "")
    setEditPickupHint(book?.pickup_hint || "")
    setEditGenreTags(book?.genre_tags || (book?.genre ? [book.genre] : []))
  }, [book, currentUser])

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
  const isOwner = Boolean(currentUser && (book.owner_id === currentUser.id || (book.owner && book.owner.id === currentUser.id)))
  const hasChanges =
    editStatus !== (book.status || "") ||
    editCity !== (book.city || "") ||
    editArea !== (book.area || "") ||
    editPickupHint !== (book.pickup_hint || "") ||
    JSON.stringify(editGenreTags) !== JSON.stringify(book.genre_tags || (book.genre ? [book.genre] : []))

  const toggleGenreTag = (genre) => {
    setEditGenreTags((prev) =>
      prev.includes(genre) ? prev.filter((item) => item !== genre) : [...prev, genre]
    )
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
              {(book.city || book.area) && (
                <div>
                  <p className="text-xs text-gray-600 font-medium">Location</p>
                  <p className="text-sm text-gray-900 font-semibold">📍 {book.area || "Area not set"}, {book.city || "City not set"}</p>
                </div>
              )}
              {((book.genre_tags && book.genre_tags.length > 0) || book.genre) && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-600 font-medium">Genres</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(book.genre_tags && book.genre_tags.length > 0 ? book.genre_tags : [book.genre]).map((genre) => (
                      <span key={genre} className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700">
                        {genre}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {book.pickup_hint && (
                <div>
                  <p className="text-xs text-gray-600 font-medium">Pickup Hint</p>
                  <p className="text-sm text-gray-900 font-semibold">{book.pickup_hint}</p>
                </div>
              )}
            </div>

            {isOwner && (
              <div className="mb-6 rounded-lg border border-emerald-100 bg-emerald-50 p-4">
                <h3 className="text-sm font-semibold text-emerald-900 mb-3">Pickup Location</h3>
                <p className="text-xs text-emerald-800 mb-4">
                  Update the safe area where this book should appear in Nearby. Exact location is never shared.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">County</label>
                    <select
                      value={editCity}
                      onChange={(e) => {
                        setEditCity(e.target.value)
                        setEditArea("")
                      }}
                      className="w-full border border-gray-300 rounded-lg bg-white px-3 py-2 text-sm"
                    >
                      <option value="">Select county</option>
                      {CITY_OPTIONS.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">Area</label>
                    <select
                      value={editArea}
                      onChange={(e) => setEditArea(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg bg-white px-3 py-2 text-sm"
                      disabled={!editCity}
                    >
                      <option value="">Select pickup area</option>
                      {getAreasForCity(editCity).map((area) => (
                        <option key={area} value={area}>
                          {area}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-700 mb-2">Genres</label>
                  <div className="flex flex-wrap gap-2">
                    {GENRE_OPTIONS.map((genre) => {
                      const active = editGenreTags.includes(genre)
                      return (
                        <button
                          key={genre}
                          type="button"
                          onClick={() => toggleGenreTag(genre)}
                          className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                            active
                              ? "border-indigo-300 bg-indigo-100 text-indigo-700"
                              : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          {genre}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">Pickup Hint</label>
                  <input
                    value={editPickupHint}
                    onChange={(e) => setEditPickupHint(e.target.value)}
                    placeholder="e.g. Near Sarit Centre"
                    className="w-full border border-gray-300 rounded-lg bg-white px-3 py-2 text-sm"
                  />
                </div>
              </div>
            )}

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
                {onUpdate && isOwner && hasChanges && (
                  <button
                    onClick={async () => {
                      if (!editCity || !editArea) {
                        alert("City and area are required for Nearby listing")
                        return
                      }
                      setUpdating(true)
                      try {
                        const token = localStorage.getItem('token')
                        const res = await fetch(`http://127.0.0.1:8000/books/${book.id}`, {
                          method: "PUT",
                          headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`,
                          },
                          body: JSON.stringify({
                            status: editStatus,
                            genre_tags: editGenreTags,
                            city: editCity,
                            area: editArea,
                            pickup_hint: editPickupHint,
                          }),
                        })
                        if (res.ok) {
                          const updated = await res.json()
                          onUpdate(updated)
                          onClose()
                        } else {
                          alert("Failed to update book")
                        }
                      } catch (err) {
                        console.error("Update failed:", err)
                        alert("Error updating book")
                      } finally {
                        setUpdating(false)
                      }
                    }}
                    disabled={updating}
                    className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 font-medium transition disabled:opacity-50"
                  >
                    {updating ? "Saving..." : "💾 Save Changes"}
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
