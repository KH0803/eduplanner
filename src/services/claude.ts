import { LessonPlan, Feedback, CurriculumAnalysis } from '../types';

const API_KEY_STORAGE = 'eduplanner_apikey'

export const getApiKey = () => localStorage.getItem(API_KEY_STORAGE) || ''
export const saveApiKey = (k: string) => localStorage.setItem(API_KEY_STORAGE, k)

const FEEDBACK_SYSTEM = `당신은 대한민국 사범대학의 교육학 교수입니다.
가네(Gagné)의 9가지 수업 사태 이론을 깊이 이해하고, 예비교사 교육을 20년 이상 담당한 전문가입니다.
학생의 수업지도안을 정밀하게 분석하여 구체적이고 건설적인 피드백을 제공하세요.
반드시 JSON 형식으로만 응답하세요.`

const ANALYSIS_SYSTEM = `당신은 대한민국의 교육과정 전문가입니다.
2022 개정 교육과정을 포함한 국가 교육과정 문서 분석에 정통합니다.
제공된 교육과정 내용을 분석하여 핵심 역량, 성취기준, 교수학습 방법, 평가 유의사항을 정리하세요.
반드시 JSON 형식으로만 응답하세요.`

function buildContent(plan: LessonPlan): any[] {
  const e = plan.events as any || {}
  let textPrompt = `다음은 예비교사가 '가네의 9가지 수업 사태' 이론에 기반하여 작성한 수업지도안입니다.

수업지도안:
- 과목: ${plan.subject || ''}
- 대상 학년: ${plan.grade || ''}
- 수업 주제: ${plan.topic || ''}
- 학습 목표: ${(plan.objectives || []).join(', ')}

가네의 9가지 수업 사태:
1. 주의 집중 시키기: ${e.gainingAttention || ''}
2. 학습자에게 목표 알리기: ${e.informingLearners || ''}
3. 선수학습 회상 자극하기: ${e.stimulatingRecall || ''}
4. 자극 제시하기: ${e.presentingStimulus || ''}
5. 학습 안내 제공하기: ${e.providingGuidance || ''}
6. 수행 유도하기: ${e.elicitingPerformance || ''}
7. 피드백 제공하기: ${e.providingFeedback || ''}
8. 수행 평가하기: ${e.assessingPerformance || ''}
9. 파지 및 전이 강화하기: ${e.enhancingRetention || ''}
`
  const imageBlocks: any[] = []
  for (const att of (plan.attachments || []) as any[]) {
    if ((att.type || '').startsWith('text/') || att.type === 'application/json') {
      textPrompt += `\n[첨부파일: ${att.name}]\n${att.content || ''}`
    } else if ((att.type || '').startsWith('image/') && (att.content || '').startsWith('data:')) {
      const b64 = att.content.split(',')[1]
      imageBlocks.push({ type: 'image', source: { type: 'base64', media_type: att.type, data: b64 } })
    }
  }

  textPrompt += `

다음 JSON 형식으로 피드백을 제공하세요:
{
  "score": 100점 만점 점수(숫자),
  "strengths": ["강점1", "강점2", "강점3"],
  "improvements": ["개선점1", "개선점2", "개선점3"],
  "overall": "교수님 관점의 최종 총평 (2-3문장)",
  "eventFeedbacks": [
    {"event": "1. 주의 집중 시키기", "rating": "good", "comment": "구체적 코멘트"},
    {"event": "2. 학습자에게 목표 알리기", "rating": "needs_work", "comment": "구체적 코멘트"},
    {"event": "3. 선수학습 회상 자극하기", "rating": "missing", "comment": "구체적 코멘트"},
    {"event": "4. 자극 제시하기", "rating": "good", "comment": "구체적 코멘트"},
    {"event": "5. 학습 안내 제공하기", "rating": "good", "comment": "구체적 코멘트"},
    {"event": "6. 수행 유도하기", "rating": "needs_work", "comment": "구체적 코멘트"},
    {"event": "7. 피드백 제공하기", "rating": "good", "comment": "구체적 코멘트"},
    {"event": "8. 수행 평가하기", "rating": "needs_work", "comment": "구체적 코멘트"},
    {"event": "9. 파지 및 전이 강화하기", "rating": "good", "comment": "구체적 코멘트"}
  ]
}
rating 값은 반드시 "good"(잘 됨), "needs_work"(보완 필요), "missing"(미작성) 중 하나여야 합니다.`

  return [...imageBlocks, { type: 'text', text: textPrompt }]
}

async function callClaude(system: string, content: any[], maxTokens = 2048): Promise<any> {
  const key = getApiKey()
  if (!key) throw new Error('API_KEY_MISSING')
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: maxTokens, system, messages: [{ role: 'user', content }] }),
  })
  const json = await res.json()
  if (json.error) throw new Error(json.error.message)
  let text: string = json.content?.[0]?.text?.trim() || ''
  if (text.includes('```json')) text = text.split('```json')[1].split('```')[0].trim()
  else if (text.includes('```')) text = text.split('```')[1].split('```')[0].trim()
  return JSON.parse(text)
}

export async function getLessonPlanFeedback(plan: LessonPlan): Promise<Feedback> {
  return callClaude(FEEDBACK_SYSTEM, buildContent(plan), 2048)
}

export async function analyzeCurriculum(text: string): Promise<CurriculumAnalysis> {
  const prompt = `다음 교육과정 내용을 분석해주세요:\n\n${text}\n\n다음 JSON 형식으로 응답하세요:\n{"keyCompetencies":["핵심역량1"],"achievementStandards":["성취기준1"],"teachingSuggestions":["교수학습방법1"],"evaluationPoints":["평가유의사항1"]}`
  return callClaude(ANALYSIS_SYSTEM, [{ type: 'text', text: prompt }], 1024)
}
