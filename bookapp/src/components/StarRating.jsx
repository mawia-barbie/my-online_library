import { Star } from "lucide-react"
import React from "react"

// Simple star rating component used for display and selecting a rating.
// Props:
// - rating: number (0-5)
// - onRate: optional function(newRating) called when user selects a star
// - size: icon size
export default function StarRating({ rating = 0, onRate, size = 16 }) {
  const interactive = typeof onRate === "function"

  const handleSelect = (value) => {
    if (!interactive) return
    onRate(value)
  }

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type={interactive ? "button" : "button"}
          onClick={() => handleSelect(i)}
          onKeyDown={(e) => {
            if (!interactive) return
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              handleSelect(i)
            }
          }}
          aria-label={`${i} star${i > 1 ? "s" : ""}`}
          className={`flex items-center justify-center p-0.5 rounded ${interactive ? 'hover:text-yellow-500 focus:outline-none' : ''}`}
        >
          <Star size={size} className={i <= Math.round(rating || 0) ? "text-yellow-500" : "text-gray-300"} />
        </button>
      ))}
    </div>
  )
}
