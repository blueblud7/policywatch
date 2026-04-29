import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date')
  const q = searchParams.get('q')
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = 20

  let query = supabase
    .from('bills')
    .select('id, bill_no, bill_name, proposer, propose_dt, proc_result, committee, ai_summary, ai_confidence')
    .order('propose_dt', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (date) query = query.eq('propose_dt', date)
  if (q) query = query.ilike('bill_name', `%${q}%`)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ bills: data, page })
}
