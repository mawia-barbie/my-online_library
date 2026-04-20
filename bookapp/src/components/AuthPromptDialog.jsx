import { useState } from "react"
import { Link } from "react-router-dom"
import { X, LogIn, UserPlus } from "lucide-react"

export function AuthPromptDialog({ open, onClose, title = "Sign in to continue" }) {
  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-lg max-w-sm w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-100 rounded-lg transition"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <p className="text-gray-600 mb-6">
              To interact with the Book Exchange community, please log in or create an account.
            </p>

            <div className="space-y-3">
              <Link
                to="/login"
                onClick={onClose}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition"
              >
                <LogIn size={18} />
                Log In
              </Link>
              <Link
                to="/register"
                onClick={onClose}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-indigo-600 text-indigo-600 rounded-lg font-medium hover:bg-indigo-50 transition"
              >
                <UserPlus size={18} />
                Sign Up
              </Link>
            </div>

            <button
              onClick={onClose}
              className="w-full mt-3 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              Continue browsing
            </button>
          </div>
        </div>
      )}
    </>
  )
}
