import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { RequireAuth } from "../components/RequireAuth"
import Navbar from "../components/Navbar"
import { MessageCircle, Plus } from "lucide-react"

function ChatsInner() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [chats, setChats] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedChat, setSelectedChat] = useState(null)

  useEffect(() => {
    console.log("ChatsInner mounted, user:", user)
    fetchChats()
    // Poll for new messages every 2 seconds
    const interval = setInterval(fetchChats, 2000)
    return () => clearInterval(interval)
  }, [user])

  const fetchChats = () => {
    const token = localStorage.getItem("token")
    if (!token) {
      console.error("No token found")
      setLoading(false)
      return
    }
    
    fetch("http://127.0.0.1:8000/chats", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        console.log("Chat response status:", res.status)
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`)
        }
        return res.json()
      })
      .then((data) => {
        console.log("Raw chats data:", data)
        
        // Normalize IDs to numbers to avoid type mismatch issues
        const normalizedChats = (Array.isArray(data) ? data : []).map((chat) => ({
          ...chat,
          id: chat.id != null ? Number(chat.id) : chat.id,
          user1_id: chat.user1_id != null ? Number(chat.user1_id) : chat.user1_id,
          user2_id: chat.user2_id != null ? Number(chat.user2_id) : chat.user2_id,
          last_message: chat.last_message
            ? {
                ...chat.last_message,
                id: chat.last_message.id != null ? Number(chat.last_message.id) : chat.last_message.id,
                sender_id: chat.last_message.sender_id != null ? Number(chat.last_message.sender_id) : chat.last_message.sender_id,
              }
            : null,
          other_user: chat.other_user
            ? { ...chat.other_user, id: chat.other_user.id != null ? Number(chat.other_user.id) : chat.other_user.id }
            : null,
        }))
        console.log("Normalized chats:", normalizedChats)
        setChats(normalizedChats)
        setLoading(false)
      })
      .catch((err) => {
        console.error("Failed to fetch chats:", err)
        setChats([])
        setLoading(false)
      })
  }

  const handleChatClick = (chat) => {
    navigate(`/chat/${chat.id}`)
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-4xl mx-auto py-12 px-4">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 mb-2">
              <MessageCircle size={28} className="text-indigo-600" />
              <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
            </div>
            <button
              onClick={() => navigate("/users")}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              <Plus size={20} />
              New Chat
            </button>
          </div>
          <p className="text-gray-600">Your conversations</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border border-indigo-600 border-t-transparent"></div>
          </div>
        ) : chats.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-gray-400 text-5xl mb-4">💬</div>
            <p className="text-gray-600 mb-4">No conversations yet</p>
            <button
              onClick={() => navigate("/users")}
              className="inline-block px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              Start a conversation
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden divide-y">
            {chats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => handleChatClick(chat)}
                className="p-4 hover:bg-gray-50 cursor-pointer transition border-l-4 border-transparent hover:border-indigo-600"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {chat.other_user.avatar ? (
                      <img
                        src={chat.other_user.avatar}
                        alt={chat.other_user.name || chat.other_user.email}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">
                        {(chat.other_user.name || chat.other_user.email)[0].toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900">
                        {chat.other_user.name || chat.other_user.email.split("@")[0]}
                      </h3>
                      {chat.last_message && (
                        <p className="text-sm text-gray-600 truncate">
                          {chat.last_message.sender_id === user.id ? "You: " : ""}
                          {chat.last_message.content}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {chat.last_message && (
                      <p className="text-xs text-gray-500 mb-2">
                        {formatTime(chat.last_message.created_at)}
                      </p>
                    )}
                    {chat.unread_count > 0 && (
                      <span className="inline-block px-2 py-1 bg-red-500 text-white text-xs font-semibold rounded-full">
                        {chat.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default function Chats() {
  return (
    <RequireAuth>
      <ChatsInner />
    </RequireAuth>
  )
}
