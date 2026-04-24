import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LessonPlan, Feedback } from './types';
import { getLessonPlanFeedback, getApiKey, saveApiKey } from './services/claude';
import LessonPlanForm from './components/LessonPlanForm';
import FeedbackView from './components/FeedbackView';
import AnalysisView from './components/AnalysisView';
import { GraduationCap, Home, FileText, BarChart2, KeyRound } from 'lucide-react';
import { cn } from './lib/utils';

type View = 'landing' | 'form' | 'feedback' | 'analysis';

export default function App() {
  const [view, setView] = useState<View>('landing');
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKeyState] = useState(getApiKey());
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyDraft, setKeyDraft] = useState('');

  const handleSaveKey = () => {
    saveApiKey(keyDraft.trim());
    setApiKeyState(keyDraft.trim());
    setShowKeyModal(false);
  };

  const handleSubmit = async (plan: LessonPlan) => {
    if (!getApiKey()) { setKeyDraft(''); setShowKeyModal(true); return; }
    setIsLoading(true);
    try {
      const result = await getLessonPlanFeedback(plan);
      setFeedback(result);
      setView('feedback');
    } catch (error: any) {
      if (error.message === 'API_KEY_MISSING') { setKeyDraft(''); setShowKeyModal(true); }
      else alert('피드백 오류: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const navItems = [
    { id: 'landing',   label: '홈',       icon: Home,     view: 'landing'   as View },
    { id: 'form',      label: '지도안 작성', icon: FileText, view: 'form'      as View },
    { id: 'analysis',  label: '교육과정 분석', icon: BarChart2, view: 'analysis' as View },
  ];

  const pageTitle: Record<View, string> = {
    landing:  '수업지도안 AI 피드백',
    form:     '수업지도안 작성',
    feedback: 'AI 피드백 결과',
    analysis: '교육과정 분석',
  };
  const pageSub: Record<View, string> = {
    landing:  '가네의 9가지 수업 사태에 따라 지도안을 작성하고 AI 피드백을 받아보세요.',
    form:     '단계별 가이드에 따라 수업을 설계해보세요.',
    feedback: '교수님 관점에서 분석한 결과입니다.',
    analysis: '교육과정 성취기준을 분석하여 수업의 뼈대를 잡아보세요.',
  };

  const isNavActive = (v: View) =>
    v === 'form' ? (view === 'form' || view === 'feedback') : view === v;

  return (
    <div className="flex min-h-screen bg-bg-canvas text-text-main font-sans">
      {/* 사이드바 (데스크탑) */}
      <nav className="w-64 bg-white border-r border-border-canvas p-10 flex flex-col shrink-0 hidden lg:flex">
        <div className="flex items-center gap-2 mb-12 cursor-pointer" onClick={() => setView('landing')}>
          <div className="bg-primary-canvas p-1.5 rounded-lg">
            <GraduationCap className="text-white" size={20} />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-primary-canvas">EduPlanner</span>
        </div>

        <ul className="space-y-3 flex-1">
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => setView(item.view)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200',
                  isNavActive(item.view) ? 'bg-[#EBF3FF] text-primary-canvas' : 'text-text-sub hover:bg-gray-50'
                )}
              >
                <item.icon size={18} />
                {item.label}
              </button>
            </li>
          ))}
        </ul>
        <button onClick={() => { setKeyDraft(apiKey); setShowKeyModal(true); }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-text-sub hover:bg-gray-50 transition-all">
          <KeyRound size={18} />
          {apiKey ? 'API 키 변경' : '🔑 API 키 설정'}
        </button>
      </nav>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 flex flex-col p-6 lg:p-14 overflow-y-auto pb-24 lg:pb-14">
        <header className="mb-10">
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">{pageTitle[view]}</h1>
          <p className="text-text-sub mt-1">{pageSub[view]}</p>
        </header>

        <div className="flex-1">
          <AnimatePresence mode="wait">
            {view === 'landing' && (
              <motion.div key="landing" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
                <div className="bg-white rounded-3xl border border-border-canvas p-8 shadow-sm flex flex-col justify-center space-y-5">
                  <h2 className="text-3xl font-black leading-tight">
                    완벽한 수업지도안,<br />
                    <span className="text-primary-canvas">AI와 함께</span> 설계하세요
                  </h2>
                  <p className="text-text-sub leading-relaxed">
                    가네(Gagné)의 9가지 수업 사태 이론에 기반한 체계적인 가이드와 AI 피드백을 실시간으로 받아보세요.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button onClick={() => setView('form')}
                      className="px-7 py-4 bg-primary-canvas text-white rounded-2xl font-bold text-base hover:opacity-90 transition-all shadow-lg shadow-blue-100">
                      지도안 작성 시작하기
                    </button>
                    <button onClick={() => setView('analysis')}
                      className="px-7 py-4 bg-white text-text-main border border-border-canvas rounded-2xl font-bold text-base hover:bg-gray-50 transition-all">
                      교육과정 분석하기
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    { num: '01', title: '가네 9가지 수업 사태 입력', desc: '단계별 폼으로 빠르게 작성' },
                    { num: '02', title: 'AI 정밀 피드백 수령', desc: '각 단계별 강점·개선점 분석' },
                    { num: '03', title: 'PDF 저장 또는 텍스트 복사', desc: '결과물 바로 활용 가능' },
                  ].map((step) => (
                    <div key={step.num} className="bg-white border border-border-canvas rounded-2xl p-5 flex items-center gap-4">
                      <div className="w-10 h-10 bg-[#EBF3FF] rounded-xl flex items-center justify-center font-black text-primary-canvas text-sm shrink-0">
                        {step.num}
                      </div>
                      <div>
                        <p className="text-sm font-bold">{step.title}</p>
                        <p className="text-xs text-text-sub mt-0.5">{step.desc}</p>
                      </div>
                    </div>
                  ))}

                  <div className="bg-[#FFF9DB] p-5 rounded-2xl text-sm text-[#856404] leading-relaxed">
                    <b className="block mb-1">💡 꿀팁</b>
                    학습 목표는 '이해한다' 보다 '설명할 수 있다', '분류할 수 있다' 같은 관찰 가능한 동사를 사용하세요!
                  </div>
                </div>
              </motion.div>
            )}

            {view === 'form' && (
              <motion.div key="form" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <LessonPlanForm onSubmit={handleSubmit} isLoading={isLoading} />
              </motion.div>
            )}

            {view === 'feedback' && feedback && (
              <motion.div key="feedback" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <FeedbackView feedback={feedback} onBack={() => setView('form')} />
              </motion.div>
            )}

            {view === 'analysis' && (
              <motion.div key="analysis" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <AnalysisView />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* API 키 모달 */}
      {showKeyModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowKeyModal(false)}>
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-2">Anthropic API 키 설정</h2>
            <p className="text-sm text-text-sub mb-4">
              AI 피드백을 사용하려면 Anthropic API 키가 필요합니다.<br />
              <a href="https://console.anthropic.com" target="_blank" rel="noreferrer" className="text-primary-canvas underline">console.anthropic.com</a>에서 발급받으세요.
            </p>
            <input type="password" value={keyDraft} onChange={e => setKeyDraft(e.target.value)}
              placeholder="sk-ant-..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-primary-canvas" />
            <div className="flex gap-3">
              <button onClick={handleSaveKey}
                className="flex-1 bg-primary-canvas text-white rounded-xl py-3 font-bold text-sm hover:opacity-90">
                저장
              </button>
              <button onClick={() => setShowKeyModal(false)}
                className="flex-1 border border-gray-200 rounded-xl py-3 font-bold text-sm hover:bg-gray-50">
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 하단 네비 (모바일) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border-canvas flex z-50">
        {navItems.map((item) => (
          <button key={item.id} onClick={() => setView(item.view)}
            className={cn(
              'flex-1 flex flex-col items-center justify-center py-3 gap-1 text-[10px] font-bold transition-colors',
              isNavActive(item.view) ? 'text-primary-canvas' : 'text-text-sub'
            )}>
            <item.icon size={20} />
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
