import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import type { Bill } from '@/types/bill'

const CONFIDENCE_LABEL = { high: '분석 확실', medium: '추정 포함', low: '제목 기반' } as const
const CONFIDENCE_COLOR = { high: 'bg-green-100 text-green-700', medium: 'bg-yellow-100 text-yellow-700', low: 'bg-gray-100 text-gray-500' } as const

const PROC_COLOR: Record<string, string> = {
  '원안가결': 'bg-blue-100 text-blue-700',
  '수정가결': 'bg-blue-100 text-blue-700',
  '임기만료폐기': 'bg-red-100 text-red-500',
  '철회': 'bg-red-100 text-red-500',
  '접수': 'bg-gray-100 text-gray-600',
  '심사중': 'bg-orange-100 text-orange-600',
}

export default function BillCard({ bill }: { bill: Bill }) {
  const conf = bill.ai_confidence ?? 'low'
  const procColor = PROC_COLOR[bill.proc_result] ?? 'bg-gray-100 text-gray-600'

  return (
    <Link href={`/bills/${bill.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium text-gray-900 text-sm leading-snug line-clamp-2">
              {bill.bill_name}
            </h3>
            <Badge className={`${procColor} shrink-0 text-xs font-normal border-0`}>
              {bill.proc_result}
            </Badge>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {bill.proposer} · {bill.propose_dt?.toString().slice(0, 10)}
            {bill.committee && ` · ${bill.committee}`}
          </p>
        </CardHeader>
        <CardContent className="pt-0">
          {bill.ai_summary && (
            <p className="text-sm text-gray-600 line-clamp-2">{bill.ai_summary}</p>
          )}
          <div className="mt-3 flex items-center justify-between">
            <span className={`text-xs px-2 py-0.5 rounded-full ${CONFIDENCE_COLOR[conf]}`}>
              {CONFIDENCE_LABEL[conf]}
            </span>
            <span className="text-xs text-gray-400">자세히 →</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
