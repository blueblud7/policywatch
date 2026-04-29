import OpenAI from 'openai'
import type { AiAnalysis, AssemblyBillDetail } from '@/types/bill'

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}

function getModel() {
  return process.env.OPENAI_MODEL ?? 'gpt-5-nano'
}

const SYSTEM_PROMPT = `당신은 한국 법률·정책 전문가입니다. 국회 법안을 분석해 시민이 이해할 수 있는 언어로 요약합니다.

반드시 지켜야 할 규칙:
1. 진영 편향 없이 사실만 서술 — "좋다/나쁘다/옳다/그르다" 등 가치판단 금지
2. 법안명에서 핵심 키워드를 추출해 관련 법률 영역과 영향 집단을 추론
3. 위원회 정보로 정책 영역 파악 (예: 환경노동위원회 → 환경·노동 관련)
4. 확신하지 못하는 부분은 disclaimer에 명시
5. 반드시 JSON 형식으로만 응답`

function buildPrompt(
  billName: string,
  proposer: string,
  committee: string | null,
  procResult: string | null,
  voteInfo: string | null,
  fullText: string | null
): string {
  const textSection = fullText
    ? `\n법안 본문:\n${fullText.slice(0, 6000)}`
    : `\n※ 법안 본문 미수집 — 법안명과 메타데이터 기반으로 분석`

  return `다음 법안을 분석해주세요.

법안명: ${billName}
대표발의자: ${proposer}
소관위원회: ${committee ?? '미배정'}
처리결과: ${procResult ?? '심사중'}
${voteInfo ? `표결: ${voteInfo}` : ''}
${textSection}

아래 JSON 형식으로 응답하세요:
{
  "summary": "법안 핵심을 시민 언어로 한 문장(50자 이내) 요약",
  "impact": {
    "positive": ["긍정적 영향 받는 집단"],
    "negative": ["부정적 영향 또는 규제 강화 대상 집단"],
    "neutral": ["직접 영향이 중립적인 집단"]
  },
  "stakeholders": [
    { "group": "집단명", "effect": "positive|negative|neutral", "detail": "구체적 영향 1~2문장" }
  ],
  "issues": ["핵심 쟁점 1", "핵심 쟁점 2", "핵심 쟁점 3"],
  "confidence": "high|medium|low",
  "disclaimer": "법안 본문 미수집 시 '제목 기반 추정' 명시, 불확실한 부분 기재"
}`
}

export async function analyzeBill(
  billName: string,
  proposer: string,
  committee: string | null,
  detail?: AssemblyBillDetail | null,
  fullText?: string | null
): Promise<AiAnalysis> {
  let voteInfo: string | null = null
  if (detail?.YES_TCNT != null) {
    voteInfo = `찬성 ${detail.YES_TCNT} / 반대 ${detail.NO_TCNT ?? 0} / 기권 ${detail.BLANK_TCNT ?? 0} (총 ${detail.VOTE_TCNT})`
  }

  const prompt = buildPrompt(
    billName,
    proposer,
    committee ?? detail?.COMMITTEE_NM ?? null,
    detail?.PROC_RESULT_CD ?? null,
    voteInfo,
    fullText ?? null
  )

  const response = await getClient().chat.completions.create({
    model: getModel(),
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    response_format: { type: 'json_object' },
  })

  const content = response.choices[0]?.message?.content
  if (!content) throw new Error('Empty response from OpenAI')

  return JSON.parse(content) as AiAnalysis
}
