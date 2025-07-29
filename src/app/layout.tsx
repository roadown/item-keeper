import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/AuthProvider'
import HeaderActions from '@/components/HeaderActions'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '智能物品管家 - Smart Item Keeper',
  description: '通过自然语言记录和查询物品存放位置的 AI 应用',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '物品管家'
  },
  icons: {
    icon: '/icon.svg',
    apple: '/icon-192x192.png'
  }
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  shrinkToFit: 'no',
  themeColor: '#3b82f6'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="物品管家" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <script dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js');
              });
            }
          `
        }} />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <header className="bg-white shadow-sm border-b">
              <div className="max-w-4xl mx-auto px-4 py-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      智能物品管家
                    </h1>
                    <p className="text-gray-600 text-sm">
                      通过自然语言记录和查询物品位置
                    </p>
                  </div>
                  <HeaderActions />
                </div>
              </div>
            </header>
            <main className="max-w-4xl mx-auto px-2 sm:px-4 py-8">
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}