import * as dotenv from 'dotenv'
import { resolve } from 'path'
dotenv.config({ path: resolve(process.cwd(), '.env.local') })

import { fetchRecentBills, fetchBillDetail } from '../src/lib/assembly-api'
import { analyzeBill } from '../src/lib/analyzer'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  console.log('=== PolicyWatch 파이프라인 테스트 ===\n')

  // 1. 법안 수집
  console.log('1️⃣  국회 OpenAPI 법안 3건 수집...')
  const { bills, total } = await fetchRecentBills('20260421', '20260428', 1, 3)
  console.log(`   ✓ 총 ${total}건 중 ${bills.length}건\n`)

  for (const raw of bills) {
    console.log(`\n📄 [${raw.BILL_NO}] ${raw.BILL_NAME}`)
    console.log(`   발의자: ${raw.PROPOSER} | 위원회: ${raw.COMMITTEE ?? '미배정'}`)

    // 2. 상세 처리정보 조회
    const detail = await fetchBillDetail(raw.BILL_NO)
    if (detail) {
      console.log(`   처리결과: ${detail.PROC_RESULT_CD ?? '심사중'} | 위원회: ${detail.COMMITTEE_NM ?? '-'}`)
      if (detail.YES_TCNT != null) {
        console.log(`   표결: 찬성 ${detail.YES_TCNT} / 반대 ${detail.NO_TCNT ?? 0} / 기권 ${detail.BLANK_TCNT ?? 0}`)
      }
    }

    // 3. GPT 분석
    console.log('   🤖 GPT-5-nano 분석 중...')
    try {
      const analysis = await analyzeBill(raw.BILL_NAME, raw.PROPOSER, raw.COMMITTEE ?? null, detail)
      console.log(`   ✓ 요약: ${analysis.summary}`)
      console.log(`   ✓ 신뢰도: ${analysis.confidence}`)
      console.log(`   ✓ 쟁점: ${analysis.issues.slice(0,2).join(' / ')}`)
      console.log(`   ✓ 주요 이해관계자:`)
      analysis.stakeholders.slice(0, 2).forEach(s =>
        console.log(`     - [${s.effect}] ${s.group}: ${s.detail}`)
      )

      // 4. Supabase 저장
      const { error } = await supabaseAdmin.from('bills').upsert({
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
        ai_impact: analysis.impact,
        ai_stakeholders: analysis.stakeholders,
        ai_issues: analysis.issues,
        ai_confidence: analysis.confidence,
      }, { onConflict: 'bill_no' })

      if (error) throw error
      console.log('   ✓ Supabase 저장 완료')
    } catch (err) {
      console.error('   ✗ 오류:', err)
    }
  }

  // 5. DB 확인
  console.log('\n\n5️⃣  Supabase 저장 확인...')
  const { data } = await supabaseAdmin
    .from('bills')
    .select('bill_no, bill_name, ai_summary, ai_confidence, committee')
    .order('created_at', { ascending: false })
    .limit(3)

  data?.forEach(b => {
    console.log(`\n   [${b.bill_no}] ${b.bill_name}`)
    console.log(`   위원회: ${b.committee ?? '미배정'} | 신뢰도: ${b.ai_confidence}`)
    console.log(`   요약: ${b.ai_summary}`)
  })

  console.log('\n✅ 완료')
}

main().catch(console.error)
