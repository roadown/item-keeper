'use client'

import { useAuth } from '@/components/AuthProvider'
import AuthUI from '@/components/AuthUI'
import ItemKeeperApp from '@/components/ItemKeeperApp'

export default function Home() {
  const { user, loading } = useAuth()

  // 检查是否配置了 Supabase 环境变量
  const isSupabaseConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  // 如果没有配置 Supabase，直接显示应用（本地模式）
  if (!isSupabaseConfigured) {
    return <ItemKeeperApp />
  }

  // 如果配置了 Supabase 但用户未登录，显示登录界面
  if (!user) {
    return <AuthUI />
  }

  // 用户已登录，显示应用
  return <ItemKeeperApp />
}