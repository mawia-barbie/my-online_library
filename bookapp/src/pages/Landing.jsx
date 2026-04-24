
import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { logNavigation, logAuthFlow } from "../utils/authDebug"
import GuestFeed from "./GuestFeed"

export default function Landing() {
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) {
      logAuthFlow("📍 Landing page - user is authenticated")
      logNavigation("Landing", "/feed", "authenticated user redirecting")
      navigate('/feed', { replace: true })
    } else {
      logAuthFlow("📍 Landing page - user is guest")
    }
  }, [user, navigate])

  // For logged-in users, show nothing (redirecting)
  if (user) {
    return null
  }

  // For guests, show the guest feed
  return <GuestFeed />
}
