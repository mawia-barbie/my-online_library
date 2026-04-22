import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import Navbar from "../components/Navbar"
import { MapPin, MessageCircle, Loader } from "lucide-react"
import { CITY_OPTIONS, getAreasForCity } from "../utils/locations"

function NearbyCard({ book, onChat, compact = false }) {
  const isNearby = book.proximity === "nearby"
  const isOwnListing = book.owner_id != null && Number(book.owner_id) === Number(book.current_user_id)

  return (
    <article
      className={`bg-white rounded-3xl border shadow-sm transition hover:shadow-md ${
        isNearby ? "border-green-300" : "border-gray-200"
      } ${compact ? "min-w-[260px] max-w-[260px]" : ""}`}
    >
      {book.image && (
        <img
          src={book.image}
          alt={book.title}
          className={`${compact ? "h-36" : "h-44"} w-full object-cover rounded-t-3xl`}
        />
      )}

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 leading-tight">{book.title}</h3>
            <p className="text-sm text-gray-500 mt-1">{book.author}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            {isNearby && (
              <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                Nearby
              </span>
            )}
            {isOwnListing && (
              <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                Your listing
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <p className="text-sm text-indigo-700">📍 {book.area}, {book.city}</p>
          {book.pickup_hint && <p className="text-sm text-gray-600">💬 {book.pickup_hint}</p>}
        </div>

        {!compact && book.owner && (
          <div className="mt-4 border-t border-gray-100 pt-4">
            <p className="text-sm font-medium text-gray-900">{book.owner.name || book.owner.email}</p>
          </div>
        )}

        {isOwnListing ? (
          <div className="mt-4 w-full rounded-2xl bg-gray-100 px-4 py-2.5 text-center text-sm font-medium text-gray-500">
            This is your book
          </div>
        ) : (
          <button
            onClick={() => onChat(book)}
            className="mt-4 w-full flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
          >
            <MessageCircle size={16} />
            Open Chat
          </button>
        )}
      </div>
    </article>
  )
}

function NearbyBooks() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [nearbyBooks, setNearbyBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterMode, setFilterMode] = useState("my-area")
  const [resolvedUser, setResolvedUser] = useState(user)
  const [selectedCity, setSelectedCity] = useState("")
  const [selectedArea, setSelectedArea] = useState("")
  const [activeArea, setActiveArea] = useState("")
  const displayCity = selectedCity || resolvedUser?.city || "Nairobi"

  useEffect(() => {
    setResolvedUser(user)
  }, [user])

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      setLoading(false)
      return
    }
    setLoading(true)

    fetch("http://127.0.0.1:8000/users/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch profile")
        }
        return res.json()
      })
      .then((profile) => {
        setResolvedUser(profile)
        const effectiveArea = (selectedArea || profile?.area || "").trim()
        const effectiveCity = (selectedCity || profile?.city || "Nairobi").trim()
        setActiveArea(effectiveArea)
        const params = new URLSearchParams()
        if (effectiveCity) params.set("city", effectiveCity)
        if (effectiveArea) params.set("area", effectiveArea)
        return fetch(`http://127.0.0.1:8000/books/nearby?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then((res) => ({ res, profile }))
      })
      .then((payload) => {
        if (!payload) return null
        if (!payload.res.ok) {
          throw new Error(`HTTP error! status: ${payload.res.status}`)
        }
        return payload.res.json().then((data) => ({ data, profile: payload.profile }))
      })
      .then((payload) => {
        if (!payload) return
        setNearbyBooks(
          Array.isArray(payload.data)
            ? payload.data.map((book) => ({ ...book, current_user_id: payload.profile?.id }))
            : []
        )
      })
      .catch((err) => {
        console.error("Failed to load nearby books:", err)
        setNearbyBooks([])
      })
      .finally(() => setLoading(false))
  }, [user?.id, selectedCity, selectedArea])

  const handleChat = async (book) => {
    const token = localStorage.getItem("token")
    if (!token || !book?.owner_id) return

    try {
      const res = await fetch(`http://127.0.0.1:8000/chats/with/${book.owner_id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error("Failed to open chat")
      const chat = await res.json()
      navigate(`/chat/${chat.id}`)
    } catch (err) {
      console.error("Failed to open chat:", err)
    }
  }

  const sameAreaBooks = nearbyBooks.filter((book) => book.proximity === "nearby")

  const filteredBooks = filterMode === "my-area" ? sameAreaBooks : nearbyBooks

  const groupedByArea = filteredBooks.reduce((acc, book) => {
    const area = book.area || "Unknown Area"
    if (!acc[area]) {
      acc[area] = []
    }
    acc[area].push(book)
    return acc
  }, {})

  const orderedGroups = Object.entries(groupedByArea).sort(([a], [b]) => {
    if (activeArea && a === activeArea) return -1
    if (activeArea && b === activeArea) return 1
    return a.localeCompare(b)
  })

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7fafc_0%,#eef5ff_100%)]">
      <Navbar />

      <main className="max-w-6xl mx-auto py-12 px-4">
        <section className="rounded-[32px] bg-white/90 border border-white shadow-sm p-6 md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <MapPin size={28} className="text-indigo-600" />
                <h1 className="text-3xl font-bold text-gray-900">Nearby Books</h1>
              </div>
              <p className="text-lg text-gray-700">{resolvedUser?.area || "All Areas"}, {displayCity}</p>
              <p className="mt-2 text-sm text-gray-500">
                Your neighborhood feed shows the same area first, then the rest of your county. Exact location is never shared.
              </p>
            </div>

            <div className="inline-flex rounded-full border border-gray-200 bg-gray-50 p-1">
              <button
                onClick={() => setFilterMode("my-area")}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  filterMode === "my-area" ? "bg-green-600 text-white shadow-sm" : "text-gray-600"
                }`}
              >
                My Area Only
              </button>
              <button
                onClick={() => setFilterMode("city")}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  filterMode === "city" ? "bg-indigo-600 text-white shadow-sm" : "text-gray-600"
                }`}
              >
                My County
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <select
              value={selectedCity}
              onChange={(e) => {
                setSelectedCity(e.target.value)
                setSelectedArea("")
              }}
              className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-600"
            >
              <option value="">Use My County</option>
              {CITY_OPTIONS.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              disabled={!(selectedCity || resolvedUser?.city)}
            >
              <option value="">Use My Area</option>
              {getAreasForCity(selectedCity || resolvedUser?.city).map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </div>

          <p className="mt-3 text-sm text-gray-500">
            {selectedArea
              ? `Showing books for ${selectedArea}, ${displayCity}`
              : `Showing books across ${displayCity}, with your area first when available`}
          </p>
        </section>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin">
              <Loader size={32} className="text-indigo-600" />
            </div>
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="mt-8 bg-white rounded-[32px] shadow p-8 text-center">
            <MapPin size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-xl font-semibold text-gray-900 mb-2">
              {filterMode === "my-area"
                ? `No books in ${resolvedUser?.area || "your area"} yet`
                : `No books in ${displayCity} yet`}
            </p>
            <p className="text-gray-600 mb-4">
              {filterMode === "my-area"
                ? `Try expanding to ${displayCity} county`
                : "Be the first to share a book in your neighborhood feed."}
            </p>
            {filterMode === "my-area" && (
              <button
                onClick={() => setFilterMode("city")}
                className="inline-block px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                View County Books
              </button>
            )}
          </div>
        ) : (
          <div className="mt-8 space-y-10">
            {sameAreaBooks.length > 0 && filterMode !== "my-area" && (
              <section>
                <div className="flex items-end justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Closest to You</h2>
                    <p className="text-sm text-gray-500">Books already in {activeArea || resolvedUser?.area || "your area"}</p>
                  </div>
                  <span className="text-sm font-medium text-green-700">{sameAreaBooks.length} nearby</span>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {sameAreaBooks.map((book) => (
                    <NearbyCard key={`closest-${book.id}`} book={book} onChat={handleChat} compact />
                  ))}
                </div>
              </section>
            )}

            {orderedGroups.map(([area, books]) => (
              <section key={area} className="space-y-4">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {area === (activeArea || resolvedUser?.area) ? `${area} (Your Area)` : area}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {books.length} {books.length === 1 ? "book" : "books"} available
                    </p>
                  </div>
                  <p className="text-sm text-gray-500">{displayCity}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {books.map((book) => (
                    <NearbyCard key={book.id} book={book} onChat={handleChat} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default NearbyBooks
