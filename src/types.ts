export interface LessonPlan {
  subject: string;
  topic: string;
  grade: string;
  objectives: string[];
  events: {
    gainingAttention: string;
    informingLearners: string;
    stimulatingRecall: string;
    presentingStimulus: string;
    providingGuidance: string;
    elicitingPerformance: string;
    providingFeedback: string;
    assessingPerformance: string;
    enhancingRetention: string;
  };
  attachments: {
    name: string;
    content: string;
    type: string;
  }[];
}

export interface EventFeedback {
  event: string;
  rating: 'good' | 'needs_work' | 'missing';
  comment: string;
}

export interface Feedback {
  score: number;
  strengths: string[];
  improvements: string[];
  overall: string;
  eventFeedbacks: EventFeedback[];
}

export interface CurriculumAnalysis {
  keyCompetencies: string[];
  achievementStandards: string[];
  teachingSuggestions: string[];
  evaluationPoints: string[];
}
