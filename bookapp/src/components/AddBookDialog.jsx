import { useState } from "react"

export default function AddBookDialog({ onClose, onSave }) {
  const [title, setTitle] = useState("")
  const [author, setAuthor] = useState("")
  const [review, setReview] = useState("")
  const [rating, setRating] = useState(0)
  const [status, setStatus] = useState("To Read")
  const [image, setImage] = useState(null)

  // 📸 handle image upload
  const handleImage = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      setImage(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    console.log("🔥 SUBMIT FIRED") // DEBUG

    if (!title.trim() || !author.trim()) return

    const newBook = {
      id: Date.now(),
      title,
      author,
      review,
      rating,
      status,
      image,
    }

    console.log("📚 NEW BOOK:", newBook)

    onSave(newBook)

    // reset
    setTitle("")
    setAuthor("")
    setReview("")
    setRating(0)
    setStatus("To Read")
    setImage(null)

    onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >

        {/* TITLE */}
        <h2 className="text-xl font-semibold mb-4">
          ➕ Add New Book
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* IMAGE */}
          <div>
            <label className="text-sm text-gray-600">Book Cover</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImage}
              className="w-full mt-1"
            />

            {image && (
              <img
                src={image}
                className="h-40 w-full object-contain rounded-xl mt-2 bg-white p-2"
                alt="preview"
              />
            )}
          </div>

          {/* TITLE */}
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Book title"
            className="w-full border p-2 rounded-lg"
          />

          {/* AUTHOR */}
          <input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Author"
            className="w-full border p-2 rounded-lg"
          />

          {/* REVIEW */}
          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="Your thoughts..."
            className="w-full border p-2 rounded-lg h-24"
          />

          {/* ⭐ RATING */}
          <div>
            <p className="text-sm text-gray-600 mb-1">Rating</p>
            <div className="flex gap-1 text-2xl cursor-pointer">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  onClick={() => setRating(star)}
                  className={star <= rating ? "text-yellow-400" : "text-gray-300"}
                >
                  ★
                </span>
              ))}
            </div>
          </div>

          {/* STATUS */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full border p-2 rounded-lg"
          >
            <option>To Read</option>
            <option>Reading</option>
            <option>Done</option>
          </select>

          {/* ACTIONS */}
          <div className="flex justify-between pt-2">

            <button
              type="button"
              onClick={onClose}
              className="text-gray-500"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="bg-black text-white px-4 py-2 rounded-lg"
            >
              Save Book
            </button>

          </div>

        </form>
      </div>
    </div>
  )
}