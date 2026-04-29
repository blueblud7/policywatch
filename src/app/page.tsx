import { createClient } from '@supabase/supabase-js'
import BillCard from '@/components/BillCard'
import SubscribeForm from '@/components/SubscribeForm'
import type { Bill } from '@/types/bill'

export const revalidate = 3600 // 1시간마다 갱신

async function getRecentBills(): Promise<Bill[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data } = await supabase
    .from('bills')
    .select('id, bill_no, bill_name, proposer, propose_dt, proc_result, committee, ai_summary, ai_confidence')
    .order('propose_dt', { ascending: false })
    .limit(12)
  return (data as Bill[]) ?? []
}

export default async function Home() {
  const bills = await getRecentBills()
  const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div>
      {/* Hero */}
      <section className="bg-gray-900 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gray-400 text-sm mb-3">진영 없음 · 24/7 · AI 분석</p>
          <h1 className="text-4xl font-bold mb-4 leading-tight">
            국회가 하는 모든 일,<br />
            <span className="text-gray-300">시민 언어로 매일 알려드립니다</span>
          </h1>
          <p className="text-gray-400 max-w-xl mx-auto mb-8">
            AI가 모든 법안을 동등하게 분석합니다. 뉴스에 나오지 않는 법안도, 주말에 발의된 법안도.
          </p>
          <div className="flex justify-center">
            <SubscribeForm />
          </div>
        </div>
      </section>

      {/* 오늘의 법안 */}
      <section className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">최근 발의 법안</h2>
            <p className="text-sm text-gray-400 mt-0.5">{today} 기준</p>
          </div>
          <a href="/bills" className="text-sm text-gray-500 hover:text-gray-900">
            전체 보기 →
          </a>
        </div>

        {bills.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">📭</p>
            <p>아직 수집된 법안이 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {bills.map(bill => (
              <BillCard key={bill.id} bill={bill} />
            ))}
          </div>
        )}
      </section>

      {/* 구독 섹션 */}
      <section id="subscribe" className="bg-white border-t border-gray-200 py-14 px-4">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">매일 아침 7시, 받아보세요</h2>
          <p className="text-gray-500 mb-6">
            어제 국회에서 발의된 법안을 AI가 분석해 이메일로 전달합니다.<br />
            관심 키워드를 등록하면 관련 법안이 발의될 때 즉시 알림을 받을 수 있습니다.
          </p>
          <div className="flex justify-center">
            <SubscribeForm />
          </div>
        </div>
      </section>

      {/* 신뢰 지표 */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <div className="grid grid-cols-3 gap-6 text-center">
          {[
            { num: '16,943+', label: '22대 국회 법안' },
            { num: '24/7', label: 'AI 자동 분석' },
            { num: '100%', label: '공개 데이터 기반' },
          ].map(item => (
            <div key={item.label} className="p-4">
              <p className="text-3xl font-bold text-gray-900">{item.num}</p>
              <p className="text-sm text-gray-500 mt-1">{item.label}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
