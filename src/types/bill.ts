export interface AssemblyBillDetail {
  AGE: string
  BILL_NO: string
  BILL_NM: string
  BILL_KIND: string
  PROPOSER: string
  COMMITTEE_NM: string | null
  PROC_RESULT_CD: string | null
  VOTE_TCNT: number | null
  YES_TCNT: number | null
  NO_TCNT: number | null
  BLANK_TCNT: number | null
  PROPOSE_DT: string
  COMMITTEE_PROC_DT: string | null
  LAW_PROC_DT: string | null
  BILL_ID: string
  LINK_URL: string
}

export interface AssemblyBill {
  BILL_ID: string
  BILL_NO: string
  BILL_NAME: string
  PROPOSER: string
  PROPOSE_DT: string
  PROC_RESULT: string
  COMMITTEE: string
  AGE: string
  DETAIL_LINK: string
}

// 실제 응답: { "nzmimeepazxkubdpn": [ { head: [...] }, { row: [...] } ] }
export interface AssemblyApiResponse {
  nzmimeepazxkubdpn?: Array<
    | { head: Array<{ list_total_count?: number } | { RESULT: { CODE: string; MESSAGE: string } }> }
    | { row: AssemblyBill[] }
  >
  // 에러 응답
  RESULT?: { CODE: string; MESSAGE: string }
}

export interface Bill {
  id?: number
  bill_no: string
  bill_name: string
  proposer: string
  propose_dt: string
  proc_result: string
  committee: string | null
  assembly_age: string
  detail_link: string | null
  full_text: string | null
  ai_summary: string | null
  ai_impact: Record<string, unknown> | null
  ai_stakeholders: Record<string, unknown> | null
  ai_issues: string[] | null
  ai_confidence: 'high' | 'medium' | 'low' | null
  created_at?: string
}

export interface AiAnalysis {
  summary: string
  impact: {
    positive: string[]
    negative: string[]
    neutral: string[]
  }
  stakeholders: Array<{ group: string; effect: 'positive' | 'negative' | 'neutral'; detail: string }>
  issues: string[]
  confidence: 'high' | 'medium' | 'low'
  disclaimer: string
}
