import { NextRequest, NextResponse } from 'next/server'
import { ingestBills } from '@/pipeline/ingest'

// cron job 또는 수동 실행용 엔드포인트
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const { fromDate, toDate } = body

  try {
    const result = await ingestBills(fromDate, toDate)
    return NextResponse.json({ success: true, ...result })
  } catch (err) {
    console.error('[POST /api/bills/ingest]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
