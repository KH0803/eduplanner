import React, { useState } from 'react';
import { motion } from 'motion/react';
import { CurriculumAnalysis } from '../types';
import { analyzeCurriculum } from '../services/claude';
import { BookOpen, Target, Lightbulb, ClipboardCheck, Loader2 } from 'lucide-react';

export default function AnalysisView() {
  const [text, setText] = useState('');
  const [result, setResult] = useState<CurriculumAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    if (!text.trim()) return;
    setIsLoading(true);
    setError('');
    try {
      const data = await analyzeCurriculum(text);
      setResult(data);
    } catch (e) {
      setError('분석 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const sections = result ? [
    { title: '핵심 역량', icon: Target, color: 'blue', items: result.keyCompetencies },
    { title: '성취 기준', icon: BookOpen, color: 'green', items: result.achievementStandards },
    { title: '교수학습 방법', icon: Lightbulb, color: 'yellow', items: result.teachingSuggestions },
    { title: '평가 유의사항', icon: ClipboardCheck, color: 'purple', items: result.evaluationPoints },
  ] : [];

  const colorMap: Record<string, string> = {
    blue:   'bg-blue-50 text-blue-800 border-blue-200',
    green:  'bg-green-50 text-green-800 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    purple: 'bg-purple-50 text-purple-800 border-purple-200',
  };
  const iconColorMap: Record<string, string> = {
    blue: 'text-blue-600', green: 'text-green-600',
    yellow: 'text-yellow-600', purple: 'text-purple-600',
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white rounded-3xl border border-border-canvas p-8 shadow-sm">
        <h2 className="text-lg font-bold mb-2">교육과정 내용 입력</h2>
        <p className="text-text-sub text-sm mb-4">성취기준, 단원 목표, 교육과정 원문 등을 붙여넣으세요.</p>
        <textarea
          className="w-full h-48 p-4 rounded-xl border border-border-canvas focus:border-primary-canvas outline-none text-sm leading-relaxed resize-none"
          placeholder="예: [9수03-01] 소인수분해의 뜻을 알고, 자연수를 소인수분해할 수 있다..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button
          onClick={handleAnalyze}
          disabled={isLoading || !text.trim()}
          className="mt-4 w-full py-4 bg-primary-canvas text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50"
        >
          {isLoading ? <><Loader2 size={20} className="animate-spin" /> 분석 중...</> : 'AI 교육과정 분석'}
        </button>
        {error && <p className="mt-3 text-red-500 text-sm">{error}</p>}
      </div>

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {sections.map(({ title, icon: Icon, color, items }) => (
            <div key={title} className={`rounded-3xl border p-6 ${colorMap[color]}`}>
              <h3 className={`text-[11px] font-black uppercase tracking-[2px] mb-4 flex items-center gap-2 ${iconColorMap[color]}`}>
                <Icon size={16} /> {title}
              </h3>
              <ul className="space-y-2">
                {items.map((item, i) => (
                  <li key={i} className="text-sm leading-relaxed flex gap-2">
                    <span className="font-bold shrink-0">{i + 1}.</span> {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
