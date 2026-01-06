
import React from 'react';
import { Problem, Category, SearchResult } from '../types';
import ProblemCard from './ProblemCard';
import { Layers, Zap, Info, ExternalLink } from 'lucide-react';

interface DashboardProps {
  data: SearchResult;
}

const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  const columns = [
    {
      id: Category.GOLD_MINE,
      title: 'Gold Mine',
      icon: <Zap className="w-5 h-5 text-emerald-400" />,
      desc: 'High pain, high repetition. Prime MVP candidates.',
      problems: data.problems.filter(p => p.category === Category.GOLD_MINE)
    },
    {
      id: Category.NICHE_GEM,
      title: 'Niche Gem',
      icon: <Layers className="w-5 h-5 text-blue-400" />,
      desc: 'Significant pain but specific audience.',
      problems: data.problems.filter(p => p.category === Category.NICHE_GEM)
    },
    {
      id: Category.NOISE,
      title: 'Market Noise',
      icon: <Info className="w-5 h-5 text-zinc-500" />,
      desc: 'Low value complaints or general gripes.',
      problems: data.problems.filter(p => p.category === Category.NOISE)
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h2 className="text-4xl font-extrabold text-white tracking-tighter">
            Signal Map: <span className="text-emerald-500 capitalize">"{data.query}"</span>
          </h2>
          <p className="text-zinc-500 mt-2 font-medium">
            Analyzed {data.problems.length} signals found across the web.
          </p>
        </div>
        <div className="flex gap-2">
           <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 flex items-center gap-2">
              <span className="text-xs text-zinc-500">Last Hunter Session</span>
              <span className="text-xs font-mono text-zinc-300">{new Date(data.timestamp).toLocaleTimeString()}</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {columns.map(col => (
          <div key={col.id} className="flex flex-col gap-4">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                {col.icon}
                <div>
                  <h3 className="font-bold text-lg text-white">{col.title}</h3>
                  <p className="text-xs text-zinc-500 font-medium">{col.desc}</p>
                </div>
              </div>
              <span className="bg-zinc-800 text-zinc-400 text-xs font-bold px-2 py-1 rounded-md">
                {col.problems.length}
              </span>
            </div>

            <div className="space-y-6 min-h-[500px] p-2 bg-zinc-900/30 rounded-2xl border border-zinc-800/50">
              {col.problems.length > 0 ? (
                col.problems.map(prob => (
                  <ProblemCard key={prob.id} problem={prob} />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-48 text-zinc-600 border-2 border-dashed border-zinc-800 rounded-xl">
                  <p className="text-sm italic">No signals identified in this sector</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {data.groundingSources.length > 0 && (
        <div className="bg-zinc-900/50 rounded-xl p-6 border border-zinc-800">
          <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-4">Evidence Sources (Grounding)</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {data.groundingSources.map((source, idx) => (
              <a 
                key={idx} 
                href={source.uri} 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-2 p-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-colors group"
              >
                <ExternalLink className="w-4 h-4 text-emerald-500" />
                <span className="text-xs text-zinc-300 truncate font-medium group-hover:text-white">
                  {source.title || source.uri}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
