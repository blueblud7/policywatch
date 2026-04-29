/**
 * 국회 OpenAPI 연결 테스트
 * 실행: npx ts-node -e "require('./scripts/test-assembly-api.ts')"
 * 또는: npx tsx scripts/test-assembly-api.ts
 */

import * as dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env.local') })

import { fetchRecentBills } from '../src/lib/assembly-api'

async function main() {
  console.log('국회 OpenAPI 테스트 시작...')
  console.log('API Key:', process.env.ASSEMBLY_API_KEY?.slice(0, 8) + '...')

  // 최근 7일 법안 조회
  const today = new Date()
  const weekAgo = new Date(today)
  weekAgo.setDate(weekAgo.getDate() - 7)

  const from = weekAgo.toISOString().slice(0, 10).replace(/-/g, '')
  const to = today.toISOString().slice(0, 10).replace(/-/g, '')

  console.log(`조회 기간: ${from} ~ ${to}`)

  const { bills, total } = await fetchRecentBills(from, to, 1, 5)

  console.log(`\n총 법안 수: ${total}`)
  console.log('\n--- 첫 5건 ---')
  bills.forEach((b, i) => {
    console.log(`${i + 1}. [${b.BILL_NO}] ${b.BILL_NAME}`)
    console.log(`   발의자: ${b.PROPOSER} | 날짜: ${b.PROPOSE_DT} | 위원회: ${b.COMMITTEE}`)
  })
}

main().catch(console.error)
