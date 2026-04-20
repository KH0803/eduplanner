import { LessonPlan, Feedback, CurriculumAnalysis } from '../types';

export async function getLessonPlanFeedback(plan: LessonPlan): Promise<Feedback> {
  const res = await fetch('/api/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(plan),
  });
  if (!res.ok) throw new Error('피드백 요청 실패');
  return res.json();
}

export async function analyzeCurriculum(text: string): Promise<CurriculumAnalysis> {
  const res = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error('교육과정 분석 요청 실패');
  return res.json();
}
