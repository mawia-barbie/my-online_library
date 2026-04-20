import { motion } from "framer-motion"
import StarRating from "./StarRating.jsx"

export function BookCard({ book, onOpen, onClick, owner }) {
  const handleClick = onOpen || onClick
  
  const statusColors = {
    "Reading": "bg-blue-100 text-blue-800",
    "Done": "bg-green-100 text-green-800",
    "To Read": "bg-yellow-100 text-yellow-800",
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      onClick={handleClick}
      className="cursor-pointer group"
    >
      <div className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition relative">

        <div className="aspect-[3/4] overflow-hidden bg-gray-100 relative">
          {book.image ? (
            <img src={book.image} alt={book.title} className="w-full h-full object-cover" onError={(e) => e.target.src = '/public/hero.png'} />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl mb-2">📖</div>
                <p className="text-xs text-gray-500">No cover</p>
              </div>
            </div>
          )}
          
          {/* Status Badge */}
          {book.status && (
            <div className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-semibold ${statusColors[book.status] || 'bg-gray-100 text-gray-800'}`}>
              {book.status}
            </div>
          )}
          
          {/* Click to view overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-end justify-end p-2">
            <div className="text-white text-xs opacity-0 group-hover:opacity-100 transition">
              👁️ View details
            </div>
          </div>
        </div>

        <div className="p-4">
          <div className="space-y-2">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Title</p>
              <h3 className="font-semibold text-gray-800 leading-tight">{book.title}</h3>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Author</p>
              <p className="text-sm text-gray-700 font-medium">{book.author}</p>
            </div>
            {book.genre && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Genre</p>
                <p className="text-sm text-gray-700">{book.genre}</p>
              </div>
            )}
            {book.status && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</p>
                <p className="text-sm text-gray-700">{book.status}</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mt-4">
            <StarRating rating={book.rating} size={14} />
            {(book.owner || owner) && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                {(book.owner?.avatar || owner?.avatar) ? (
                  <img src={book.owner?.avatar || owner?.avatar} alt="owner" className="w-6 h-6 rounded-full object-cover" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">🙂</div>
                )}
                <span className="truncate">{(book.owner?.name || owner?.name) || (book.owner?.email || owner?.email)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}