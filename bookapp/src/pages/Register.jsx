import { useState } from "react"
import { useNavigate } from "react-router-dom"

export default function Register() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleRegister = async (e) => {
    e.preventDefault()

    // client-side validation
    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    setLoading(true)
    const res = await fetch("http://127.0.0.1:8000/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })

    let data = {}
    try {
      data = await res.json()
    } catch (err) {
      // no json body
    }

    console.log("REGISTER RESPONSE:", res.status, data)
    if (res.ok) {
      // registration successful on backend -> redirect to login
      navigate('/login')
      return
    }

    // show backend-provided message if available
    setError(data.detail || data.message || "Registration failed")
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleRegister} className="bg-white p-6 rounded-xl shadow w-80">
        <h2 className="text-xl mb-4">Register</h2>

        <input
          placeholder="Email"
          className="w-full border p-2 mb-3"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          placeholder="Password"
          type="password"
          className="w-full border p-2 mb-1"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value)
            if (error) setError("")
          }}
        />

        <p className="text-xs text-gray-500 mb-3">Password must be at least 8 characters</p>

        {error && (
          <div className="text-sm text-red-500 mb-2">{error}</div>
        )}

        <button
          className={`bg-black text-white w-full p-2 rounded ${password.length < 8 ? 'opacity-50 cursor-not-allowed' : ''}`}
          type="submit"
          disabled={password.length < 8 || loading}
        >
          {loading ? 'Creating...' : 'Create Account'}
        </button>
      </form>
    </div>
  )
}