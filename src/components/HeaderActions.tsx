'use client'

import { useAuth } from './AuthProvider'

export default function HeaderActions() {
  const { user, signOut } = useAuth()

  if (!user) {
    return null
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 hidden sm:block">
        👤 {user.email}
      </span>
      <button
        onClick={signOut}
        className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
      >
        退出登录
      </button>
    </div>
  )
}