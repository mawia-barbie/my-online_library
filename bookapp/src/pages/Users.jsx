import { useState, useEffect } from "react"
import { Link, useSearchParams, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import Navbar from "../components/Navbar"
import { MessageCircle } from "lucide-react"

export default function Users() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const initial = searchParams.get("query") || ""
  const [query, setQuery] = useState(initial)
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [creatingChat, setCreatingChat] = useState(null)

  useEffect(() => {
    if (!query) return setResults([])
    const t = setTimeout(() => {
      setLoading(true)
      fetch(`http://127.0.0.1:8000/users?query=${encodeURIComponent(query)}`)
        .then((res) => res.json())
        .then((data) => setResults(data))
        .catch(() => setResults([]))
        .finally(() => setLoading(false))
    }, 250)
    return () => clearTimeout(t)
  }, [query])

  const doSearch = (e) => {
    e?.preventDefault()
    setSearchParams(query ? { query } : {})
  }

  const handleStartChat = async (userId) => {
    if (!user) return
    setCreatingChat(userId)
    
    const token = localStorage.getItem("token")
    try {
      const response = await fetch(`http://127.0.0.1:8000/chats/with/${userId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      navigate(`/chat/${data.id}`)
    } catch (err) {
      console.error("Failed to create chat:", err)
      setCreatingChat(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">Find Users</h1>

        <form onSubmit={doSearch} className="flex gap-2 mb-8">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or email"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
          />
          <button className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
            Search
          </button>
        </form>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border border-indigo-600 border-t-transparent"></div>
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {query ? "No users found" : "Start searching to find users"}
            </div>
          ) : (
            <ul className="divide-y">
              {results.map((u) => (
                <li key={u.id} className="p-4 hover:bg-gray-50 transition">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {u.avatar ? (
                        <img
                          src={u.avatar}
                          alt={u.name || u.email}
                          className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                          {(u.name || u.email)[0].toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/profile/${u.id}`}
                          className="font-semibold text-gray-900 hover:text-indigo-600 transition"
                        >
                          {u.name || u.email}
                        </Link>
                        <div className="text-sm text-gray-500">{u.email}</div>
                      </div>
                    </div>
                    {user && user.id !== u.id && (
                      <button
                        onClick={() => handleStartChat(u.id)}
                        disabled={creatingChat === u.id}
                        className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        <MessageCircle size={18} />
                        {creatingChat === u.id ? "..." : "Chat"}
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
