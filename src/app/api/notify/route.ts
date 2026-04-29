import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendDailyBriefing, sendKeywordAlert } from '@/lib/mailer'
import type { Bill } from '@/types/bill'

// 매일 06:00 KST cron으로 호출
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const ymd = yesterday.toISOString().slice(0, 10)
  const dateLabel = yesterday.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })

  // 어제 발의된 법안 조회
  const { data: bills } = await supabaseAdmin
    .from('bills')
    .select('*')
    .eq('propose_dt', ymd)
    .order('created_at', { ascending: false })

  if (!bills || bills.length === 0) {
    return NextResponse.json({ message: '발의된 법안 없음', date: ymd })
  }

  // 모든 활성 구독자 조회
  const { data: users } = await supabaseAdmin
    .from('users')
    .select('email, keywords')
    .eq('is_active', true)

  if (!users) return NextResponse.json({ message: '구독자 없음' })

  let briefingSent = 0, alertSent = 0, errors = 0

  for (const user of users) {
    try {
      // 일일 브리핑 (전체)
      await sendDailyBriefing(user.email, bills as Bill[], dateLabel)
      briefingSent++

      // 키워드 알림 (개별)
      const keywords: string[] = user.keywords ?? []
      for (const keyword of keywords) {
        const matched = (bills as Bill[]).filter(b =>
          b.bill_name.includes(keyword) || b.ai_summary?.includes(keyword)
        )
        for (const bill of matched) {
          await sendKeywordAlert(user.email, bill, keyword)
          alertSent++
          // 알림 로그 기록
          await supabaseAdmin.from('notifications').insert({
            user_id: null, // TODO: users 테이블 UUID 연결
            bill_id: bill.id,
            channel: 'email',
          }).eq // 임시 — 추후 user_id 연결
        }
      }
    } catch (err) {
      console.error(`[notify] ${user.email}:`, err)
      errors++
    }
  }

  return NextResponse.json({
    date: ymd,
    bills: bills.length,
    briefingSent,
    alertSent,
    errors,
  })
}
