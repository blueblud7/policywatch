import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { email, keyword } = await req.json()

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: '유효한 이메일을 입력해주세요.' }, { status: 400 })
  }

  const keywords = keyword ? [keyword.trim()] : []

  const { error } = await supabaseAdmin
    .from('users')
    .upsert({ email, keywords }, { onConflict: 'email' })

  if (error) {
    console.error('[subscribe]', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
