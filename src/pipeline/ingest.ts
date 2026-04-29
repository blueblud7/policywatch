import { fetchAllBillsForDateRange, fetchBillDetail, getYesterdayRange } from '@/lib/assembly-api'
import { analyzeBill } from '@/lib/analyzer'
import { supabaseAdmin } from '@/lib/supabase'
import type { Bill } from '@/types/bill'

export async function ingestBills(fromDate?: string, toDate?: string): Promise<{
  fetched: number
  inserted: number
  skipped: number
  errors: number
}> {
  const range = fromDate && toDate
    ? { from: fromDate, to: toDate }
    : getYesterdayRange()

  console.log(`[ingest] Fetching bills ${range.from} ~ ${range.to}`)
  const rawBills = await fetchAllBillsForDateRange(range.from, range.to)
  console.log(`[ingest] Fetched ${rawBills.length} bills`)

  let inserted = 0, skipped = 0, errors = 0

  for (const raw of rawBills) {
    try {
      // 중복 체크
      const { data: existing } = await supabaseAdmin
        .from('bills')
        .select('id')
        .eq('bill_no', raw.BILL_NO)
        .single()

      if (existing) { skipped++; continue }

      // 상세 처리정보 조회 (위원회·표결·처리결과)
      const detail = await fetchBillDetail(raw.BILL_NO)

      // AI 분석
      const analysis = await analyzeBill(
        raw.BILL_NAME,
        raw.PROPOSER,
        raw.COMMITTEE ?? detail?.COMMITTEE_NM ?? null,
        detail
      )

      const bill: Bill = {
        bill_no: raw.BILL_NO,
        bill_name: raw.BILL_NAME,
        proposer: raw.PROPOSER,
        propose_dt: raw.PROPOSE_DT,
        proc_result: raw.PROC_RESULT ?? detail?.PROC_RESULT_CD ?? '접수',
        committee: raw.COMMITTEE ?? detail?.COMMITTEE_NM ?? null,
        assembly_age: raw.AGE,
        detail_link: raw.DETAIL_LINK ?? null,
        full_text: null,
        ai_summary: analysis.summary,
        ai_impact: analysis.impact as unknown as Record<string, unknown>,
        ai_stakeholders: analysis.stakeholders as unknown as Record<string, unknown>,
        ai_issues: analysis.issues,
        ai_confidence: analysis.confidence,
      }

      const { error } = await supabaseAdmin.from('bills').insert(bill)
      if (error) throw error

      inserted++
      console.log(`[ingest] ✓ ${raw.BILL_NO} ${raw.BILL_NAME.slice(0, 30)} [${analysis.confidence}]`)

      await delay(300)
    } catch (err) {
      errors++
      console.error(`[ingest] ✗ ${raw.BILL_NO}:`, err)
    }
  }

  return { fetched: rawBills.length, inserted, skipped, errors }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
