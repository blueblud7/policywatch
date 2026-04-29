'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function SubscribeForm() {
  const [email, setEmail] = useState('')
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, keyword: keyword.trim() || null }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setStatus('success')
      setMessage('구독 완료! 내일 아침 7시에 첫 브리핑을 보내드립니다.')
      setEmail('')
      setKeyword('')
    } catch (err) {
      setStatus('error')
      setMessage(err instanceof Error ? err.message : '오류가 발생했습니다.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full max-w-md">
      <Input
        type="email"
        placeholder="이메일 주소"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
        className="bg-white"
      />
      <Input
        type="text"
        placeholder="관심 키워드 (선택, 예: 부동산, 소상공인)"
        value={keyword}
        onChange={e => setKeyword(e.target.value)}
        className="bg-white"
      />
      <Button
        type="submit"
        disabled={status === 'loading'}
        className="bg-gray-900 hover:bg-gray-700 text-white"
      >
        {status === 'loading' ? '처리 중...' : '무료로 구독하기'}
      </Button>
      {message && (
        <p className={`text-sm text-center ${status === 'success' ? 'text-green-600' : 'text-red-500'}`}>
          {message}
        </p>
      )}
      <p className="text-xs text-gray-400 text-center">매일 아침 7시 · 무료 · 언제든 해지 가능</p>
    </form>
  )
}
