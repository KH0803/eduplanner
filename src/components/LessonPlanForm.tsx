import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LessonPlan } from '../types';
import { 
  Plus, Trash2, ChevronLeft, ChevronRight, Sparkles, 
  Upload, FileText, X, Info
} from 'lucide-react';
import { cn } from '../lib/utils';

interface Props {
  onSubmit: (plan: LessonPlan) => void;
  isLoading: boolean;
}

const initialPlan: LessonPlan = {
  subject: '',
  topic: '',
  grade: '',
  objectives: [''],
  events: {
    gainingAttention: '',
    informingLearners: '',
    stimulatingRecall: '',
    presentingStimulus: '',
    providingGuidance: '',
    elicitingPerformance: '',
    providingFeedback: '',
    assessingPerformance: '',
    enhancingRetention: '',
  },
  attachments: [],
};

const STORAGE_KEY = 'eduplanner_draft';

export default function LessonPlanForm({ onSubmit, isLoading }: Props) {
  const [step, setStep] = useState(0);
  const [plan, setPlan] = useState<LessonPlan>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? { ...initialPlan, ...JSON.parse(saved), attachments: [] } : initialPlan;
    } catch { return initialPlan; }
  });
  const [savedIndicator, setSavedIndicator] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 변경될 때마다 자동 저장 (첨부파일 제외)
  useEffect(() => {
    const { attachments, ...rest } = plan;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rest));
    setSavedIndicator(true);
    const t = setTimeout(() => setSavedIndicator(false), 1500);
    return () => clearTimeout(t);
  }, [plan]);

  const steps = [
    { title: '기본 정보', description: '과목, 주제, 대상 및 학습 목표 설정', tag: 'Basic Info' },
    { title: '도입 (Events 1-3)', description: '주의 집중, 목표 제시, 선수학습 상기', tag: 'Introduction' },
    { title: '전개 (Events 4-6)', description: '자극 제시, 학습 안내, 수행 유도', tag: 'Development' },
    { title: '정리 (Events 7-9)', description: '피드백, 수행 평가, 파지 및 전이', tag: 'Conclusion' },
    { title: '수업 자료', description: '참고 자료 및 첨부 파일 업로드', tag: 'Materials' },
  ];

  const updatePlan = (path: string, value: any) => {
    const newPlan = { ...plan };
    const keys = path.split('.');
    let current: any = newPlan;
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    setPlan(newPlan);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setPlan(prev => ({
          ...prev,
          attachments: [...prev.attachments, {
            name: file.name,
            content: content,
            type: file.type
          }]
        }));
      };
      if (file.type.startsWith('text/') || file.type === 'application/json') {
        reader.readAsText(file);
      } else {
        reader.readAsDataURL(file);
      }
    });
  };

  const removeAttachment = (index: number) => {
    setPlan(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const nextStep = () => setStep((s) => Math.min(s + 1, steps.length - 1));
  const prevStep = () => setStep((s) => Math.max(s - 1, 0));

  const handleReset = () => {
    if (confirm('작성 중인 내용을 모두 초기화할까요?')) {
      localStorage.removeItem(STORAGE_KEY);
      setPlan(initialPlan);
      setStep(0);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border border-border-canvas p-6 lg:p-10">
      {/* 임시저장 표시 */}
      <div className="flex justify-between items-center mb-6">
        <span className={cn('text-xs font-semibold transition-all', savedIndicator ? 'text-green-500' : 'text-transparent')}>
          ✓ 임시저장됨
        </span>
        <button onClick={handleReset} className="text-xs text-text-sub hover:text-accent-canvas font-semibold transition-colors">
          초기화
        </button>
      </div>
      {/* Progress Bar */}
      <div className="mb-10">
        <div className="flex justify-between mb-4">
          {steps.map((s, i) => (
            <div
              key={i}
              className={cn(
                "flex flex-col items-center transition-all duration-300",
                step >= i ? "text-primary-canvas" : "text-text-sub"
              )}
            >
              <div className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center mb-2 text-xs font-bold",
                step === i ? "bg-primary-canvas text-white" : 
                step > i ? "bg-[#EBF3FF] text-primary-canvas" : "bg-[#F1F3F5]"
              )}>
                {i + 1}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:block">{s.title}</span>
            </div>
          ))}
        </div>
        <div className="h-1 w-full bg-[#F1F3F5] rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary-canvas"
            initial={{ width: 0 }}
            animate={{ width: `${((step + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          className="min-h-[450px]"
        >
          <div className="mb-8">
            <span className="text-[11px] uppercase tracking-[2px] font-black text-primary-canvas mb-2 block">
              {steps[step].tag}
            </span>
            <h2 className="text-2xl font-bold text-text-main">{steps[step].title}</h2>
            <p className="text-text-sub mt-1">{steps[step].description}</p>
          </div>

          {step === 0 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[11px] font-black text-text-sub uppercase tracking-wider mb-2">과목</label>
                  <input
                    type="text"
                    className="w-full p-4 rounded-xl border border-border-canvas focus:border-primary-canvas outline-none transition-all text-sm"
                    placeholder="예: 국어, 수학, 사회..."
                    value={plan.subject}
                    onChange={(e) => updatePlan('subject', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-text-sub uppercase tracking-wider mb-2">대상 학년</label>
                  <input
                    type="text"
                    className="w-full p-4 rounded-xl border border-border-canvas focus:border-primary-canvas outline-none transition-all text-sm"
                    placeholder="예: 초등학교 5학년"
                    value={plan.grade}
                    onChange={(e) => updatePlan('grade', e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-black text-text-sub uppercase tracking-wider mb-2">수업 주제</label>
                <input
                  type="text"
                  className="w-full p-4 text-xl font-bold border-none border-b-2 border-[#F1F3F5] focus:border-primary-canvas outline-none transition-all"
                  placeholder="수업 제목을 입력하세요"
                  value={plan.topic}
                  onChange={(e) => updatePlan('topic', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[11px] font-black text-text-sub uppercase tracking-wider mb-2">학습 목표</label>
                <div className="space-y-3">
                  {plan.objectives.map((obj, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        type="text"
                        className="flex-1 p-3 rounded-xl border border-border-canvas focus:border-primary-canvas outline-none transition-all text-sm"
                        placeholder={`학습 목표 ${i + 1}`}
                        value={obj}
                        onChange={(e) => {
                          const newObjs = [...plan.objectives];
                          newObjs[i] = e.target.value;
                          updatePlan('objectives', newObjs);
                        }}
                      />
                      {plan.objectives.length > 1 && (
                        <button onClick={() => updatePlan('objectives', plan.objectives.filter((_, idx) => idx !== i))} className="p-3 text-accent-canvas hover:bg-red-50 rounded-xl">
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button onClick={() => updatePlan('objectives', [...plan.objectives, ''])} className="text-xs font-bold text-primary-canvas flex items-center gap-1 hover:underline">
                    <Plus size={14} /> 목표 추가
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              {[
                { key: 'gainingAttention', label: '1. 주의 집중 시키기', placeholder: '학생들의 흥미를 유발할 수 있는 시각 자료나 질문은 무엇인가요?' },
                { key: 'informingLearners', label: '2. 학습자에게 목표 알리기', placeholder: '오늘 배울 내용을 명확하게 안내하는 방법은?' },
                { key: 'stimulatingRecall', label: '3. 선수학습 회상 자극하기', placeholder: '지난 시간에 배운 내용 중 오늘 수업과 연결되는 부분은?' },
              ].map((item) => (
                <div key={item.key}>
                  <label className="block text-[11px] font-black text-text-sub uppercase tracking-wider mb-2">{item.label}</label>
                  <textarea
                    className="w-full p-4 rounded-xl border border-border-canvas focus:border-primary-canvas outline-none transition-all h-28 text-sm leading-relaxed"
                    placeholder={item.placeholder}
                    value={(plan.events as any)[item.key]}
                    onChange={(e) => updatePlan(`events.${item.key}`, e.target.value)}
                  />
                </div>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              {[
                { key: 'presentingStimulus', label: '4. 자극 제시하기 (학습 내용 제시)', placeholder: '핵심 개념이나 원리를 어떻게 설명할까요?' },
                { key: 'providingGuidance', label: '5. 학습 안내 제공하기', placeholder: '학생들이 내용을 잘 이해하도록 돕는 비계(Scaffolding) 전략은?' },
                { key: 'elicitingPerformance', label: '6. 수행 유도하기', placeholder: '학생들이 직접 활동하거나 문제를 풀어보는 과정은?' },
              ].map((item) => (
                <div key={item.key}>
                  <label className="block text-[11px] font-black text-text-sub uppercase tracking-wider mb-2">{item.label}</label>
                  <textarea
                    className="w-full p-4 rounded-xl border border-border-canvas focus:border-primary-canvas outline-none transition-all h-28 text-sm leading-relaxed"
                    placeholder={item.placeholder}
                    value={(plan.events as any)[item.key]}
                    onChange={(e) => updatePlan(`events.${item.key}`, e.target.value)}
                  />
                </div>
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              {[
                { key: 'providingFeedback', label: '7. 피드백 제공하기', placeholder: '수행 결과에 대해 어떤 긍정적/교정적 피드백을 줄까요?' },
                { key: 'assessingPerformance', label: '8. 수행 평가하기', placeholder: '학습 목표 달성 여부를 어떻게 확인할까요?' },
                { key: 'enhancingRetention', label: '9. 파지 및 전이 강화하기', placeholder: '배운 내용을 기억하고 실생활에 적용하도록 돕는 방법은?' },
              ].map((item) => (
                <div key={item.key}>
                  <label className="block text-[11px] font-black text-text-sub uppercase tracking-wider mb-2">{item.label}</label>
                  <textarea
                    className="w-full p-4 rounded-xl border border-border-canvas focus:border-primary-canvas outline-none transition-all h-28 text-sm leading-relaxed"
                    placeholder={item.placeholder}
                    value={(plan.events as any)[item.key]}
                    onChange={(e) => updatePlan(`events.${item.key}`, e.target.value)}
                  />
                </div>
              ))}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-8">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border-canvas rounded-3xl p-12 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-all"
              >
                <div className="bg-[#EBF3FF] p-4 rounded-2xl text-primary-canvas mb-4">
                  <Upload size={32} />
                </div>
                <p className="font-bold text-text-main">수업 자료 업로드</p>
                <p className="text-text-sub text-sm mt-1">PDF, 이미지, 텍스트 파일을 첨부하여 AI 진단을 받아보세요.</p>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  multiple 
                  className="hidden" 
                />
              </div>

              {plan.attachments.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {plan.attachments.map((file, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-[#F8F9FA] rounded-2xl border border-border-canvas">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <FileText className="text-primary-canvas shrink-0" size={20} />
                        <span className="text-sm font-medium truncate">{file.name}</span>
                      </div>
                      <button onClick={() => removeAttachment(i)} className="text-text-sub hover:text-accent-canvas">
                        <X size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="bg-[#FFF9DB] p-6 rounded-3xl flex gap-4">
                <Info className="text-[#F59F00] shrink-0" size={24} />
                <div className="text-sm text-[#856404] leading-relaxed">
                  <b className="block mb-1">AI 진단 팁</b>
                  업로드된 자료는 가네의 9가지 수업 사태 중 '자극 제시(Event 4)'와 '학습 안내(Event 5)' 단계의 적절성을 분석하는 데 주로 활용됩니다.
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="mt-10 flex justify-between items-center pt-8 border-t border-border-canvas">
        <button
          onClick={prevStep}
          disabled={step === 0}
          className={cn(
            "flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all",
            step === 0 ? "text-gray-300 cursor-not-allowed" : "text-text-sub hover:bg-gray-100"
          )}
        >
          <ChevronLeft size={20} /> 이전
        </button>

        {step === steps.length - 1 ? (
          <button
            onClick={() => onSubmit(plan)}
            disabled={isLoading}
            className="flex items-center gap-2 px-10 py-4 bg-primary-canvas text-white rounded-2xl font-bold hover:opacity-90 shadow-lg shadow-blue-100 transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              >
                <Sparkles size={20} />
              </motion.div>
            ) : <Sparkles size={20} />}
            AI 정밀 진단 시작
          </button>
        ) : (
          <button
            onClick={nextStep}
            className="flex items-center gap-2 px-10 py-4 bg-text-main text-white rounded-2xl font-bold hover:bg-black shadow-lg shadow-gray-200 transition-all"
          >
            다음 <ChevronRight size={20} />
          </button>
        )}
      </div>
    </div>
  );
}
