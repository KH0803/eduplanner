import React from 'react';
import { motion } from 'motion/react';
import { Feedback } from '../types';
import { CheckCircle2, AlertCircle, Trophy, ArrowLeft, Printer, CheckCheck, MinusCircle } from 'lucide-react';
import { cn } from '../lib/utils';

interface Props {
  feedback: Feedback;
  onBack: () => void;
}

const ratingConfig = {
  good:       { label: '잘 됨',    icon: CheckCircle2, cls: 'bg-green-50 border-green-200 text-green-800',   iconCls: 'text-green-500' },
  needs_work: { label: '보완 필요', icon: AlertCircle,   cls: 'bg-yellow-50 border-yellow-200 text-yellow-800', iconCls: 'text-yellow-500' },
  missing:    { label: '미작성',   icon: MinusCircle,  cls: 'bg-red-50 border-red-200 text-red-800',         iconCls: 'text-red-400' },
};

export default function FeedbackView({ feedback, onBack }: Props) {
  const handlePrint = () => window.print();

  const handleCopy = () => {
    const lines = [
      `[수업지도안 AI 피드백] 종합 점수: ${feedback.score}점`,
      '',
      '■ 강점',
      ...feedback.strengths.map((s, i) => `${i + 1}. ${s}`),
      '',
      '■ 개선점',
      ...feedback.improvements.map((s, i) => `${i + 1}. ${s}`),
      '',
      '■ 가네 9단계별 피드백',
      ...(feedback.eventFeedbacks || []).map(
        e => `${e.event} [${e.rating === 'good' ? '잘 됨' : e.rating === 'needs_work' ? '보완 필요' : '미작성'}]\n   → ${e.comment}`
      ),
      '',
      '■ 총평',
      feedback.overall,
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    alert('피드백이 클립보드에 복사되었습니다!');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between print-hidden">
        <button onClick={onBack} className="flex items-center gap-2 text-text-sub hover:text-text-main transition-colors font-bold text-sm">
          <ArrowLeft size={18} /> 다시 작성하기
        </button>
        <div className="flex gap-3">
          <button onClick={handleCopy} className="flex items-center gap-2 px-4 py-2 border border-border-canvas rounded-xl text-sm font-bold hover:bg-gray-50 transition-all">
            <CheckCheck size={16} /> 텍스트 복사
          </button>
          <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-primary-canvas text-white rounded-xl text-sm font-bold hover:opacity-90 transition-all">
            <Printer size={16} /> PDF 저장
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-border-canvas flex flex-col items-center justify-center text-center">
          <div className="relative w-28 h-28 mb-4">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle className="text-[#F1F3F5]" strokeWidth="8" stroke="currentColor" fill="transparent" r="40" cx="50" cy="50" />
              <motion.circle
                className="text-primary-canvas"
                strokeWidth="8" strokeDasharray={251.2}
                initial={{ strokeDashoffset: 251.2 }}
                animate={{ strokeDashoffset: 251.2 - (251.2 * feedback.score) / 100 }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
                strokeLinecap="round" stroke="currentColor" fill="transparent" r="40" cx="50" cy="50"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl font-black text-text-main">{feedback.score}</span>
            </div>
          </div>
          <h3 className="text-sm font-black text-text-sub uppercase tracking-wider">종합 점수</h3>
        </div>

        <div className="md:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-border-canvas relative overflow-hidden flex flex-col justify-center">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-primary-canvas" />
          <h3 className="text-[11px] font-black text-primary-canvas uppercase tracking-[2px] mb-4 flex items-center gap-2">
            <Trophy size={16} /> Professor's Review
          </h3>
          <p className="text-text-main leading-relaxed text-lg font-bold italic">"{feedback.overall}"</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-border-canvas">
          <h3 className="text-[11px] font-black text-green-600 uppercase tracking-[2px] mb-5 flex items-center gap-2">
            <CheckCircle2 size={16} /> Key Strengths
          </h3>
          <ul className="space-y-3">
            {feedback.strengths.map((s, i) => (
              <motion.li key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                className="flex gap-3 p-3 bg-green-50 rounded-2xl text-green-900 text-sm font-semibold">
                <span className="w-5 h-5 bg-green-200 text-green-700 rounded-md flex items-center justify-center text-xs flex-shrink-0 font-black">{i + 1}</span>
                {s}
              </motion.li>
            ))}
          </ul>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-border-canvas">
          <h3 className="text-[11px] font-black text-accent-canvas uppercase tracking-[2px] mb-5 flex items-center gap-2">
            <AlertCircle size={16} /> Areas for Growth
          </h3>
          <ul className="space-y-3">
            {feedback.improvements.map((s, i) => (
              <motion.li key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                className="flex gap-3 p-3 bg-red-50 rounded-2xl text-red-900 text-sm font-semibold">
                <span className="w-5 h-5 bg-red-200 text-accent-canvas rounded-md flex items-center justify-center text-xs flex-shrink-0 font-black">{i + 1}</span>
                {s}
              </motion.li>
            ))}
          </ul>
        </div>
      </div>

      {feedback.eventFeedbacks && feedback.eventFeedbacks.length > 0 && (
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-border-canvas">
          <h3 className="text-[11px] font-black text-text-sub uppercase tracking-[2px] mb-6">가네 9단계별 상세 피드백</h3>
          <div className="space-y-3">
            {feedback.eventFeedbacks.map((ef, i) => {
              const cfg = ratingConfig[ef.rating as keyof typeof ratingConfig] ?? ratingConfig.needs_work;
              const Icon = cfg.icon;
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className={cn('flex gap-4 p-4 rounded-2xl border', cfg.cls)}>
                  <Icon size={18} className={cn('shrink-0 mt-0.5', cfg.iconCls)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-black">{ef.event}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/60 border border-current">{cfg.label}</span>
                    </div>
                    <p className="text-sm leading-relaxed opacity-90">{ef.comment}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      <style>{`@media print { nav, .print-hidden { display: none !important; } body { background: white !important; } }`}</style>
    </motion.div>
  );
}
