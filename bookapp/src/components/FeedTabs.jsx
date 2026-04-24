import { Link, useLocation } from "react-router-dom"
import { Compass, Heart } from "lucide-react"

export function FeedTabs() {
  const location = useLocation()
  const isExplore = location.pathname === '/feed'
  const isForYou = location.pathname === '/for-you'

  return (
    <div className="border-b border-gray-200 bg-white sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 flex items-center gap-8">
        <Link
          to="/feed"
          className={`py-4 px-2 flex items-center gap-2 font-medium border-b-2 transition ${
            isExplore
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <Compass size={20} />
          Explore
        </Link>
        <Link
          to="/for-you"
          className={`py-4 px-2 flex items-center gap-2 font-medium border-b-2 transition ${
            isForYou
              ? 'border-red-500 text-red-500'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <Heart size={20} />
          For You
        </Link>
      </div>
    </div>
  )
}
