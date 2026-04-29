import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import type { Bill, AiAnalysis } from '@/types/bill'

export const revalidate = 3600

interface Props {
  params: Promise<{ id: string }>
}

async function getBill(id: string): Promise<Bill | null> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data } = await supabase
    .from('bills')
    .select('*')
    .eq('id', id)
    .single()
  return data as Bill | null
}

const EFFECT_LABEL = { positive: '긍정적', negative: '부정적', neutral: '중립적' } as const
const EFFECT_COLOR = {
  positive: 'bg-green-50 border-green-200 text-green-800',
  negative: 'bg-red-50 border-red-200 text-red-800',
  neutral: 'bg-gray-50 border-gray-200 text-gray-700',
} as const

export default async function BillDetailPage({ params }: Props) {
  const { id } = await params
  const bill = await getBill(id)
  if (!bill) notFound()

  const impact = bill.ai_impact as unknown as AiAnalysis['impact'] | null
  const stakeholders = bill.ai_stakeholders as unknown as AiAnalysis['stakeholders'] | null

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* 뒤로가기 */}
      <a href="/bills" className="text-sm text-gray-400 hover:text-gray-700 mb-6 inline-block">
        ← 법안 목록으로
      </a>

      {/* 헤더 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h1 className="text-xl font-bold text-gray-900 leading-snug">{bill.bill_name}</h1>
          <span className="shrink-0 text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
            {bill.proc_result}
          </span>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
          <span>발의자: {bill.proposer}</span>
          <span>발의일: {bill.propose_dt?.toString().slice(0, 10)}</span>
          {bill.committee && <span>위원회: {bill.committee}</span>}
          <span>법안번호: {bill.bill_no}</span>
        </div>
        {bill.detail_link && (
          <a
            href={bill.detail_link}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block text-xs text-blue-600 hover:underline"
          >
            국회 원문 보기 →
          </a>
        )}
      </div>

      {/* AI 분석 배너 */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>🤖</span>
          <span>AI 분석 결과</span>
          {bill.ai_confidence && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              bill.ai_confidence === 'high' ? 'bg-green-100 text-green-700' :
              bill.ai_confidence === 'medium' ? 'bg-yellow-100 text-yellow-700' :
              'bg-gray-200 text-gray-500'
            }`}>
              {bill.ai_confidence === 'high' ? '분석 확실' : bill.ai_confidence === 'medium' ? '추정 포함' : '제목 기반'}
            </span>
          )}
        </div>
        <span className="text-xs text-gray-400">참고용 · 오류 가능</span>
      </div>

      {/* 한 줄 요약 */}
      {bill.ai_summary && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">한 줄 요약</h2>
          <p className="text-lg font-medium text-gray-900">{bill.ai_summary}</p>
        </div>
      )}

      {/* 핵심 쟁점 */}
      {bill.ai_issues && bill.ai_issues.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">핵심 쟁점</h2>
          <ul className="space-y-2">
            {bill.ai_issues.map((issue, i) => (
              <li key={i} className="flex gap-2 text-sm text-gray-700">
                <span className="text-gray-400 shrink-0">{i + 1}.</span>
                <span>{issue}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 이해관계자 분석 */}
      {stakeholders && stakeholders.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">이해관계자 분석</h2>
          <div className="space-y-3">
            {stakeholders.map((s, i) => (
              <div key={i} className={`border rounded-lg px-4 py-3 ${EFFECT_COLOR[s.effect]}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">{s.group}</span>
                  <span className="text-xs opacity-70">{EFFECT_LABEL[s.effect]}</span>
                </div>
                <p className="text-sm">{s.detail}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 영향 집단 요약 */}
      {impact && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">영향 집단</h2>
          <div className="space-y-3">
            {impact.positive?.length > 0 && (
              <div>
                <p className="text-xs font-medium text-green-600 mb-1">긍정적 영향</p>
                <div className="flex flex-wrap gap-2">
                  {impact.positive.map((g, i) => (
                    <span key={i} className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded-full">{g}</span>
                  ))}
                </div>
              </div>
            )}
            {impact.negative?.length > 0 && (
              <div>
                <p className="text-xs font-medium text-red-500 mb-1">부정적 영향</p>
                <div className="flex flex-wrap gap-2">
                  {impact.negative.map((g, i) => (
                    <span key={i} className="text-xs bg-red-50 text-red-600 border border-red-200 px-2 py-1 rounded-full">{g}</span>
                  ))}
                </div>
              </div>
            )}
            {impact.neutral?.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-400 mb-1">중립적 영향</p>
                <div className="flex flex-wrap gap-2">
                  {impact.neutral.map((g, i) => (
                    <span key={i} className="text-xs bg-gray-50 text-gray-500 border border-gray-200 px-2 py-1 rounded-full">{g}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
