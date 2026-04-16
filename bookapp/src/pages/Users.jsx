import { useState, useEffect } from "react"
import { Link, useSearchParams } from "react-router-dom"

export default function Users() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initial = searchParams.get("query") || ""
  const [query, setQuery] = useState(initial)
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)

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

  return (
    <div className="min-h-screen bg-[#f8f5f2] p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4">Find users</h1>

        <form onSubmit={doSearch} className="flex gap-2 mb-4">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or email"
            className="flex-1 border p-2 rounded"
          />
          <button className="bg-black text-white px-4 py-2 rounded">Search</button>
        </form>

        <div className="bg-white rounded-2xl p-4 shadow">
          {loading ? (
            <div className="text-gray-500">Searching...</div>
          ) : results.length === 0 ? (
            <div className="text-gray-400">No users found</div>
          ) : (
            <ul className="space-y-3">
              {results.map((u) => (
                <li key={u.id} className="flex items-center gap-3">
                  {u.avatar ? (
                    <img src={u.avatar} alt="a" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">🙂</div>
                  )}
                  <div>
                    <Link to={`/profile/${u.id}`} className="font-medium hover:underline">{u.name || u.email}</Link>
                    <div className="text-xs text-gray-500">{u.email}</div>
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
