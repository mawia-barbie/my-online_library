/**
 * Authentication Flow Debug Utilities
 * Helps diagnose and log the authentication state transitions
 */

export function logAuthFlow(message, data = {}) {
  const timestamp = new Date().toLocaleTimeString()
  console.log(
    `%c[AUTH FLOW - ${timestamp}]%c ${message}`,
    'color: #00695c; font-weight: bold; background: #b2dfdb; padding: 2px 6px; border-radius: 3px;',
    'color: #333; font-weight: normal;',
    data
  )
}

export function logUserState(user, token) {
  console.group('%c👤 USER STATE', 'color: #1976d2; font-weight: bold; font-size: 14px;')
  console.log('User:', user)
  console.log('Token:', token ? '✅ Present' : '❌ Missing')
  console.log('Authenticated:', !!user)
  console.groupEnd()
}

export function logNavigation(from, to, reason) {
  console.log(
    `%c→ NAVIGATION%c ${from} → ${to} (${reason})`,
    'color: #f57c00; font-weight: bold; background: #ffe0b2; padding: 2px 6px; border-radius: 3px;',
    'color: #333;'
  )
}

export function logAuthPrompt(action) {
  console.log(
    `%c🔐 AUTH PROMPT%c ${action}`,
    'color: #c62828; font-weight: bold; background: #ffcdd2; padding: 2px 6px; border-radius: 3px;',
    'color: #333;'
  )
}
