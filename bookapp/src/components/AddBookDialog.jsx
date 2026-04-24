import { useState, useRef } from "react"
import StarRating from "./StarRating.jsx"
import { Plus, ImagePlus, X } from "lucide-react"

export function AddBookDialog({ onAdd }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [author, setAuthor] = useState("")
  const [rating, setRating] = useState(0)
  const [review, setReview] = useState("")
  const [thoughts, setThoughts] = useState("")
  const [coverImage, setCoverImage] = useState("")
  const fileInputRef = useRef(null)

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => setCoverImage(reader.result)
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!title || !author || !coverImage) return

    try {
      const res = await fetch("http://127.0.0.1:8000/books", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          author,
          rating,
          review,
          thoughts,
          coverImage,
        }),
      })

      const data = await res.json()
      onAdd(data)

      reset()
      setOpen(false)
    } catch (err) {
      console.error("Failed to add book", err)
    }
  }

  const reset = () => {
    setTitle("")
    setAuthor("")
    setRating(0)
    setReview("")
    setThoughts("")
    setCoverImage("")
  }

  return (
    <div className="inline-block">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full gap-2 px-6 py-2 bg-black text-white flex items-center"
      >
        <Plus size={18} />
        Add Book
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => { setOpen(false); reset(); }} />

          <div className="relative bg-white rounded-2xl w-full max-w-lg mx-4 p-6 shadow-lg max-h-[90vh] overflow-y-auto">
            <button onClick={() => { setOpen(false); reset(); }} className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"><X size={16} /></button>
            <h3 className="text-xl font-semibold mb-3">Add a New Book</h3>

            <form onSubmit={handleSubmit} className="space-y-5 pt-2">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer mx-auto w-40 aspect-[3/4] rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-2 overflow-hidden hover:border-gray-300 transition"
              >
                {coverImage ? (
                  <img src={coverImage} alt="cover" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <ImagePlus size={28} />
                    <span className="text-sm text-gray-500">Upload cover</span>
                  </>
                )}
              </div>

              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />

              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="w-full border p-2 rounded" />
              <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Author" className="w-full border p-2 rounded" />

              <StarRating rating={rating} onRate={setRating} />

              <textarea value={review} onChange={(e) => setReview(e.target.value)} placeholder="Review" className="w-full border p-2 rounded" />
              <textarea value={thoughts} onChange={(e) => setThoughts(e.target.value)} placeholder="Thoughts" className="w-full border p-2 rounded" />

              <button type="submit" disabled={!title || !author || !coverImage} className="w-full bg-black text-white py-2 rounded">
                Add Book
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}