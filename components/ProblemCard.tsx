
import React from 'react';
import { Problem, Category } from '../types';
import { Quote, TrendingUp, AlertCircle, Lightbulb, ExternalLink } from 'lucide-react';

interface ProblemCardProps {
  problem: Problem;
}

const ProblemCard: React.FC<ProblemCardProps> = ({ problem }) => {
  const getCategoryStyles = (category: Category) => {
    switch (category) {
      case Category.GOLD_MINE:
        return 'border-emerald-500/50 bg-emerald-500/5 text-emerald-400';
      case Category.NICHE_GEM:
        return 'border-blue-500/50 bg-blue-500/5 text-blue-400';
      case Category.NOISE:
        return 'border-zinc-700 bg-zinc-900/50 text-zinc-500';
      default:
        return 'border-zinc-800 bg-zinc-900';
    }
  };

  return (
    <div className={`p-5 rounded-xl border-2 transition-all hover:scale-[1.02] hover:shadow-xl ${getCategoryStyles(problem.category)}`}>
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-bold text-white tracking-tight leading-tight flex-1 pr-4">
          {problem.title}
        </h3>
        <div className="flex items-center gap-1 shrink-0">
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase font-bold opacity-70">Pain</span>
            <span className="font-mono text-lg">{problem.pain_score}/10</span>
          </div>
        </div>
      </div>

      <div className="flex items-start gap-3 mb-4 p-3 bg-black/30 rounded-lg italic text-sm text-zinc-300">
        <Quote className="w-4 h-4 shrink-0 text-zinc-500 mt-1" />
        <p>"{problem.evidence}"</p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Lightbulb className={`w-4 h-4 ${problem.category === Category.GOLD_MINE ? 'text-emerald-400' : 'text-blue-400'}`} />
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Proposed Solution</span>
        </div>
        
        <div className="bg-white/5 p-4 rounded-lg border border-white/10 group cursor-default">
          <div className="flex justify-between items-center mb-1">
            <h4 className="font-bold text-white group-hover:text-emerald-300 transition-colors">
              {problem.solution_idea.title}
            </h4>
            <span className="px-2 py-0.5 text-[10px] bg-zinc-800 rounded-full font-bold uppercase text-zinc-300">
              {problem.solution_idea.type}
            </span>
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed">
            {problem.solution_idea.pitch}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProblemCard;
