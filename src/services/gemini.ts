import { GoogleGenAI, Type } from "@google/genai";
import { LessonPlan, Feedback, CurriculumAnalysis } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function getLessonPlanFeedback(plan: LessonPlan): Promise<Feedback> {
  const prompt = `
    당신은 대한민국 사범대학의 교육학 교수입니다. 
    다음은 2학년 학생이 '가네(Gagne)의 9가지 수업 사태' 이론에 기반하여 작성한 수업지도안입니다. 
    이 지도안과 첨부된 수업 자료를 정밀하게 분석하여 피드백을 제공해주세요.
    
    수업지도안 내용:
    ${JSON.stringify({
      subject: plan.subject,
      topic: plan.topic,
      grade: plan.grade,
      objectives: plan.objectives,
      events: plan.events
    }, null, 2)}
    
    첨부 자료 목록:
    ${plan.attachments.map(a => `- 파일명: ${a.name}, 타입: ${a.type}`).join('\n')}
    
    피드백 기준 (가네의 9가지 수업 사태):
    1. 주의 집중 및 동기유발의 적절성
    2. 학습 목표와 수업 내용의 일치성
    3. 선수학습 상기 및 비계 설정(Scaffolding)의 구체성
    4. 자극 제시 및 학습 안내 단계에서의 수업 자료 활용도
    5. 수행 유도 및 피드백 계획의 실효성
    6. 파지 및 전이를 위한 전략의 창의성
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER, description: "100점 만점 기준 점수" },
          strengths: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "가네의 이론을 잘 적용한 부분 (3가지 이상)" 
          },
          improvements: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "이론적 관점에서 보완이 필요한 부분 (3가지 이상)" 
          },
          overall: { type: Type.STRING, description: "교수님 관점의 최종 조언" }
        },
        required: ["score", "strengths", "improvements", "overall"]
      }
    }
  });

  return JSON.parse(response.text || "{}") as Feedback;
}

export async function analyzeCurriculum(text: string): Promise<CurriculumAnalysis> {
  const prompt = `
    당신은 대한민국의 교육과정 전문가입니다. 
    다음 교육과정 원문 또는 요약본을 분석하여 핵심 역량, 성취 기준, 교수학습 방법, 평가 유의사항을 정리해주세요.
    
    분석할 내용:
    ${text}
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          keyCompetencies: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "해당 단원의 핵심 역량" 
          },
          achievementStandards: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "주요 성취 기준" 
          },
          teachingSuggestions: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "교수학습 방법 및 유의사항" 
          },
          evaluationPoints: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "평가 방법 및 유의사항" 
          }
        },
        required: ["keyCompetencies", "achievementStandards", "teachingSuggestions", "evaluationPoints"]
      }
    }
  });

  return JSON.parse(response.text || "{}") as CurriculumAnalysis;
}
