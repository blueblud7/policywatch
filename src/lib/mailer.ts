import nodemailer from 'nodemailer'
import type { Bill } from '@/types/bill'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

const FROM = `PolicyWatch <${process.env.GMAIL_USER}>`
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://policywatch.kr'

function buildBillHtml(bill: Bill): string {
  const procBadge = bill.proc_result !== '접수'
    ? `<span style="background:#dbeafe;color:#1d4ed8;padding:1px 6px;border-radius:4px;font-size:11px;">${bill.proc_result}</span>`
    : ''

  return `
    <div style="border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin-bottom:12px;">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;">
        <p style="font-weight:600;font-size:14px;color:#111827;margin:0 0 4px 0;">${bill.bill_name}</p>
        ${procBadge}
      </div>
      <p style="font-size:12px;color:#9ca3af;margin:0 0 8px 0;">
        ${bill.proposer}${bill.committee ? ` · ${bill.committee}` : ''} · ${bill.propose_dt?.toString().slice(0, 10)}
      </p>
      ${bill.ai_summary ? `<p style="font-size:13px;color:#374151;margin:0 0 8px 0;">${bill.ai_summary}</p>` : ''}
      <a href="${SITE_URL}/bills/${bill.id}" style="font-size:12px;color:#6b7280;">전체 분석 보기 →</a>
    </div>
  `
}

export async function sendDailyBriefing(to: string, bills: Bill[], date: string): Promise<void> {
  const billsHtml = bills.map(buildBillHtml).join('')

  await transporter.sendMail({
    from: FROM,
    to,
    subject: `[PolicyWatch] ${date} 국회 법안 브리핑 (${bills.length}건)`,
    html: `
      <!DOCTYPE html>
      <html lang="ko">
      <body style="font-family:-apple-system,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#111827;">
        <div style="margin-bottom:24px;">
          <h1 style="font-size:20px;font-weight:700;margin:0 0 4px 0;">PolicyWatch 일일 브리핑</h1>
          <p style="font-size:13px;color:#9ca3af;margin:0;">${date} · AI 분석 · 진영 없음</p>
        </div>
        <p style="font-size:14px;color:#374151;margin-bottom:16px;">
          오늘 국회에 발의된 법안 <strong>${bills.length}건</strong>을 분석했습니다.
        </p>
        ${billsHtml}
        <div style="margin-top:24px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af;">
          <p>PolicyWatch · 모든 AI 분석은 참고용이며 오류가 있을 수 있습니다.</p>
          <p><a href="${SITE_URL}/unsubscribe?email=${encodeURIComponent(to)}" style="color:#9ca3af;">구독 해지</a></p>
        </div>
      </body>
      </html>
    `,
  })
}

export async function sendKeywordAlert(to: string, bill: Bill, keyword: string): Promise<void> {
  await transporter.sendMail({
    from: FROM,
    to,
    subject: `[PolicyWatch 알림] "${keyword}" 관련 법안 발의 — ${bill.bill_name.slice(0, 40)}`,
    html: `
      <!DOCTYPE html>
      <html lang="ko">
      <body style="font-family:-apple-system,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#111827;">
        <h2 style="font-size:16px;font-weight:600;margin-bottom:4px;">키워드 알림: "${keyword}"</h2>
        <p style="font-size:13px;color:#9ca3af;margin-bottom:16px;">관심 키워드가 포함된 법안이 발의되었습니다.</p>
        ${buildBillHtml(bill)}
        <p style="font-size:11px;color:#9ca3af;margin-top:16px;">
          <a href="${SITE_URL}/unsubscribe?email=${encodeURIComponent(to)}" style="color:#9ca3af;">알림 해제</a>
        </p>
      </body>
      </html>
    `,
  })
}
