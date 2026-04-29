import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PolicyWatch — AI 워치독',
  description: '한국 국회의 모든 법안을 AI가 실시간으로 분석해 시민 언어로 전달합니다. 진영 없음, 24/7, 무료.',
  keywords: ['정책', '법안', '국회', 'AI', '정치', '입법'],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-screen bg-gray-50 font-sans">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2">
              <span className="text-xl font-bold text-gray-900">PolicyWatch</span>
              <span className="text-xs text-gray-400 hidden sm:block">AI 워치독</span>
            </a>
            <nav className="flex items-center gap-4 text-sm">
              <a href="/bills" className="text-gray-500 hover:text-gray-900">법안 목록</a>
              <a href="/#subscribe" className="bg-gray-900 text-white px-3 py-1.5 rounded-md hover:bg-gray-700">
                무료 구독
              </a>
            </nav>
          </div>
        </header>
        <main>{children}</main>
        <footer className="border-t border-gray-200 mt-16 py-8 text-center text-sm text-gray-400">
          <p>PolicyWatch · AI 기반 국회 법안 모니터링 · 데이터 출처: 열린국회정보 OpenAPI</p>
          <p className="mt-1">모든 AI 분석은 참고용이며 오류가 있을 수 있습니다. 중요한 사항은 원문을 확인하세요.</p>
        </footer>
      </body>
    </html>
  )
}
