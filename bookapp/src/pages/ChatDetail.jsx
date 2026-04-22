import { useState, useEffect, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { RequireAuth } from "../components/RequireAuth"
import Navbar from "../components/Navbar"
import { ArrowLeft, Send } from "lucide-react"

function ChatDetailInner() {
  const { chatId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [messages, setMessages] = useState([])
  const [otherUser, setOtherUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [messageInput, setMessageInput] = useState("")
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    fetchMessages()
    // Poll for new messages every 1.5 seconds
    const interval = setInterval(fetchMessages, 1500)
    return () => clearInterval(interval)
  }, [chatId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const fetchMessages = () => {
    const token = localStorage.getItem("token")
    fetch(`http://127.0.0.1:8000/chats/${chatId}/messages`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch messages")
        return res.json()
      })
      .then((data) => {
        // Normalize ids to numbers to avoid type-mismatch alignment issues
        const msgs = (Array.isArray(data) ? data : []).map((m) => ({
          ...m,
          id: m.id != null ? Number(m.id) : m.id,
          chat_id: m.chat_id != null ? Number(m.chat_id) : m.chat_id,
          sender_id: m.sender_id != null ? Number(m.sender_id) : m.sender_id,
        }))

        // Debug: log message alignment check (now uses numeric comparison)
        msgs.forEach((msg) => {
          console.log(
            `Message ${msg.id}: sender_id=${msg.sender_id} (${typeof msg.sender_id}), current_user=${Number(user?.id)} (${typeof Number(user?.id)}), match=${Number(msg.sender_id) === Number(user?.id)}`
          )
        })

        setMessages(msgs)
        setLoading(false)
      })
      .catch((err) => {
        console.error("Failed to fetch messages:", err)
        setLoading(false)
      })
  }

  // Fetch chat details to get other user info
  useEffect(() => {
    const token = localStorage.getItem("token")
    fetch(`http://127.0.0.1:8000/chats`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((chats) => {
        const chat = chats.find((c) => c.id === parseInt(chatId))
        if (chat) {
          setOtherUser(chat.other_user)
        }
      })
      .catch((err) => console.error("Failed to fetch chat details:", err))
  }, [chatId])

  const handleSendMessage = () => {
    if (!messageInput.trim()) return

    setSending(true)
    const token = localStorage.getItem("token")
    fetch(`http://127.0.0.1:8000/chats/${chatId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content: messageInput }),
    })
      .then((res) => res.json())
      .then((newMessage) => {
        // Normalize new message IDs to numbers
        const normalizedMessage = {
          ...newMessage,
          id: newMessage.id != null ? Number(newMessage.id) : newMessage.id,
          chat_id: newMessage.chat_id != null ? Number(newMessage.chat_id) : newMessage.chat_id,
          sender_id: newMessage.sender_id != null ? Number(newMessage.sender_id) : newMessage.sender_id,
        }
        setMessages([...messages, normalizedMessage])
        setMessageInput("")
        setSending(false)
      })
      .catch((err) => {
        console.error("Failed to send message:", err)
        setSending(false)
      })
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    const hours = String(date.getHours()).padStart(2, "0")
    const minutes = String(date.getMinutes()).padStart(2, "0")
    return `${hours}:${minutes}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border border-indigo-600 border-t-transparent"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      {/* Chat Header */}
      <div className="bg-white border-b sticky top-16 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/chats")}
              className="p-2 hover:bg-gray-100 rounded-full transition"
              title="Back to chats"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            {otherUser && (
              <div className="flex items-center gap-3">
                {otherUser.avatar ? (
                  <img
                    src={otherUser.avatar}
                    alt={otherUser.name || otherUser.email}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                    {(otherUser.name || otherUser.email)[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <h2 className="font-semibold text-gray-900 text-base">
                    {otherUser.name || otherUser.email.split("@")[0]}
                  </h2>
                  <p className="text-xs text-gray-500">{otherUser.email}</p>
                </div>
              </div>
            )}
          </div>
          {/* Optional: Add call, video, info buttons here */}
          <div className="flex items-center gap-2">
            {/* Future: add call, video icons */}
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 overflow-y-auto bg-gradient-to-b from-white via-gray-50 to-gray-50">
        {messages.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-5xl mb-3">💬</div>
            <p className="text-lg">No messages yet</p>
            <p className="text-sm">Start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message, index) => {
              // Safe comparison: convert both to numbers to handle type mismatches
              const isSentByCurrentUser = Number(message.sender_id) === Number(user?.id)
              const prevMessage = index > 0 ? messages[index - 1] : null
              const nextMessage = index < messages.length - 1 ? messages[index + 1] : null
              
              // Check if this is first/last message in a group from same sender
              const isFirstInGroup = !prevMessage || Number(prevMessage.sender_id) !== Number(message.sender_id)
              const isLastInGroup = !nextMessage || Number(nextMessage.sender_id) !== Number(message.sender_id)
              
              return (
                <div
                  key={message.id}
                  className={`flex ${isSentByCurrentUser ? "justify-end" : "justify-start"} animate-fadeIn`}
                >
                  <div className="flex items-end gap-2 max-w-md">
                    {/* Avatar for received messages */}
                    {!isSentByCurrentUser && isLastInGroup && (
                      <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {(otherUser?.name || otherUser?.email)[0].toUpperCase()}
                      </div>
                    )}
                    {!isSentByCurrentUser && !isLastInGroup && (
                      <div className="w-8 h-8 flex-shrink-0" />
                    )}

                    {/* Message Bubble */}
                    <div
                      className={`px-4 py-2 break-words transition-all ${
                        isSentByCurrentUser
                          ? `bg-indigo-600 text-white rounded-3xl ${
                              isFirstInGroup ? "rounded-tr-sm" : ""
                            } ${isLastInGroup ? "rounded-br-sm" : ""} shadow-md hover:shadow-lg`
                          : `bg-gray-200 text-gray-900 rounded-3xl ${
                              isFirstInGroup ? "rounded-tl-sm" : ""
                            } ${isLastInGroup ? "rounded-bl-sm" : ""} shadow-sm hover:shadow-md`
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{message.content}</p>
                      <p
                        className={`text-xs mt-1.5 ${
                          isSentByCurrentUser ? "text-indigo-100" : "text-gray-500"
                        }`}
                      >
                        {formatTime(message.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="bg-white border-t sticky bottom-0 shadow-lg">
        <div className="max-w-4xl w-full mx-auto px-4 py-4">
          <div className="flex gap-3 items-end">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage()
                }
              }}
              placeholder="Message..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none transition"
              rows="1"
              disabled={sending}
            />
            <button
              onClick={handleSendMessage}
              disabled={!messageInput.trim() || sending}
              className={`p-3 rounded-full flex items-center justify-center transition-all ${
                !messageInput.trim() || sending
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg active:scale-95"
              }`}
              title="Send message"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ChatDetail() {
  return (
    <RequireAuth>
      <ChatDetailInner />
    </RequireAuth>
  )
}
