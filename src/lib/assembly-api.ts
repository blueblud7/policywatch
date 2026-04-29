import axios from 'axios'
import type { AssemblyApiResponse, AssemblyBill, AssemblyBillDetail } from '@/types/bill'

const BASE_URL = 'https://open.assembly.go.kr/portal/openapi'
const API_KEY = process.env.ASSEMBLY_API_KEY!
const CURRENT_AGE = '22' // 22대 국회

// API 서버가 User-Agent 없으면 400 반환
const HTTP_HEADERS = { 'User-Agent': 'Mozilla/5.0 PolicyWatch/1.0' }

export async function fetchRecentBills(
  fromDate: string, // YYYYMMDD
  toDate: string,
  page = 1,
  pageSize = 100
): Promise<{ bills: AssemblyBill[]; total: number }> {
  const url = `${BASE_URL}/nzmimeepazxkubdpn`

  const params = {
    KEY: API_KEY,
    Type: 'json',
    pIndex: page,
    pSize: pageSize,
    AGE: CURRENT_AGE,
    PROPOSE_DT: `${fromDate}~${toDate}`,
  }

  const response = await axios.get<AssemblyApiResponse>(url, { params, headers: HTTP_HEADERS, timeout: 30000 })
  const arr = response.data?.nzmimeepazxkubdpn

  if (response.data?.RESULT) {
    const { CODE, MESSAGE } = response.data.RESULT
    if (CODE !== 'INFO-000') throw new Error(`Assembly API: ${CODE} - ${MESSAGE}`)
  }

  if (!arr) return { bills: [], total: 0 }

  const headBlock = arr[0] as { head: Array<Record<string, unknown>> }
  const rowBlock = arr[1] as { row?: AssemblyBill[] } | undefined

  const total = (headBlock.head?.[0]?.list_total_count as number) ?? 0
  const resultCode = (headBlock.head?.[1] as { RESULT?: { CODE: string; MESSAGE: string } })?.RESULT?.CODE
  if (resultCode && resultCode !== 'INFO-000') {
    const msg = (headBlock.head?.[1] as { RESULT?: { CODE: string; MESSAGE: string } })?.RESULT?.MESSAGE
    throw new Error(`Assembly API error: ${resultCode} - ${msg}`)
  }

  return { bills: rowBlock?.row ?? [], total }
}

// 법안 처리결과·위원회·표결정보 (nwbpacrgavhjryiph)
export async function fetchBillDetail(billNo: string, age = CURRENT_AGE): Promise<AssemblyBillDetail | null> {
  const url = `${BASE_URL}/nwbpacrgavhjryiph`
  const params = { KEY: API_KEY, Type: 'json', pIndex: 1, pSize: 1, BILL_NO: billNo, AGE: age }

  try {
    const response = await axios.get(url, { params, headers: HTTP_HEADERS, timeout: 15000 })
    const arr = response.data?.nwbpacrgavhjryiph
    if (!arr) return null
    const row = (arr[1] as { row?: AssemblyBillDetail[] })?.row
    return row?.[0] ?? null
  } catch {
    return null
  }
}

export async function fetchAllBillsForDateRange(
  fromDate: string,
  toDate: string
): Promise<AssemblyBill[]> {
  const pageSize = 100
  const { bills: firstPage, total } = await fetchRecentBills(fromDate, toDate, 1, pageSize)

  if (total <= pageSize) return firstPage

  const totalPages = Math.ceil(total / pageSize)
  const remaining = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, i) =>
      fetchRecentBills(fromDate, toDate, i + 2, pageSize).then((r) => r.bills)
    )
  )

  return [...firstPage, ...remaining.flat()]
}

export function getYesterdayRange(): { from: string; to: string } {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const ymd = yesterday.toISOString().slice(0, 10).replace(/-/g, '')
  return { from: ymd, to: ymd }
}

export function getTodayRange(): { from: string; to: string } {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  return { from: today, to: today }
}
