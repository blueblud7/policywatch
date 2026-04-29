import { createClient } from '@supabase/supabase-js'
import BillCard from '@/components/BillCard'
import type { Bill } from '@/types/bill'

export const revalidate = 3600

interface Props {
  searchParams: Promise<{ q?: string; page?: string }>
}

async function getBills(q?: string, page = 1): Promise<{ bills: Bill[]; total: number }> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const limit = 24
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabase
    .from('bills')
    .select('id, bill_no, bill_name, proposer, propose_dt, proc_result, committee, ai_summary, ai_confidence', { count: 'exact' })
    .order('propose_dt', { ascending: false })
    .range(from, to)

  if (q) query = query.ilike('bill_name', `%${q}%`)

  const { data, count } = await query
  return { bills: (data as Bill[]) ?? [], total: count ?? 0 }
}

export default async function BillsPage({ searchParams }: Props) {
  const params = await searchParams
  const q = params.q ?? ''
  const page = parseInt(params.page ?? '1')
  const { bills, total } = await getBills(q || undefined, page)
  const totalPages = Math.ceil(total / 24)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">법안 목록</h1>
          <p className="text-sm text-gray-400 mt-1">총 {total.toLocaleString()}건</p>
        </div>
      </div>

      {/* 검색 */}
      <form method="GET" className="mb-6">
        <div className="flex gap-2">
          <input
            name="q"
            defaultValue={q}
            placeholder="법안명 검색..."
            className="flex-1 px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-700"
          >
            검색
          </button>
          {q && (
            <a href="/bills" className="px-4 py-2 border border-gray-200 text-sm rounded-md hover:bg-gray-50">
              초기화
            </a>
          )}
        </div>
        {q && (
          <p className="text-sm text-gray-500 mt-2">
            &ldquo;{q}&rdquo; 검색 결과 {total}건
          </p>
        )}
      </form>

      {bills.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🔍</p>
          <p>검색 결과가 없습니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {bills.map(bill => (
            <BillCard key={bill.id} bill={bill} />
          ))}
        </div>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {page > 1 && (
            <a href={`/bills?q=${q}&page=${page - 1}`} className="px-3 py-1.5 border rounded text-sm hover:bg-gray-50">
              ← 이전
            </a>
          )}
          <span className="px-3 py-1.5 text-sm text-gray-500">{page} / {totalPages}</span>
          {page < totalPages && (
            <a href={`/bills?q=${q}&page=${page + 1}`} className="px-3 py-1.5 border rounded text-sm hover:bg-gray-50">
              다음 →
            </a>
          )}
        </div>
      )}
    </div>
  )
}
