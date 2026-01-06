
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  Target, 
  Zap, 
  BarChart3, 
  Layers, 
  Cpu, 
  ArrowRight, 
  Loader2, 
  ShieldAlert, 
  History,
  Radar,
  LogOut,
  User as UserIcon,
  Crown
} from 'lucide-react';
import { SearchResult, PipelineStatus, UserProfile } from './types';
import { SignalHunterService } from './services/geminiService';
import Dashboard from './components/Dashboard';
import { supabase } from './lib/supabase';
import { Auth } from './components/Auth';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<PipelineStatus>({ stage: 'idle', message: '' });
  const [result, setResult] = useState<SearchResult | null>(null);
  const [history, setHistory] = useState<SearchResult[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const hunter = new SignalHunterService();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user) {
      fetchProfile();
      fetchHistory();
    } else {
      setProfile(null);
      setHistory([]);
    }
  }, [session]);

  const fetchProfile = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
    
    if (data) setProfile(data);
  };

  const fetchHistory = async () => {
    setLoadingHistory(true);
    const { data, error } = await supabase
      .from('searches')
      .select(`
        id,
        user_query,
        created_at,
        opportunities (*)
      `)
      .order('created_at', { ascending: false });

    if (data) {
      const formatted = data.map((s: any) => ({
        id: s.id,
        query: s.user_query,
        timestamp: s.created_at,
        problems: s.opportunities.map((o: any) => ({
          id: o.id,
          title: o.problem_title,
          pain_score: o.pain_score,
          frequency_score: o.frequency_score,
          evidence: o.evidence_quote,
          category: o.category,
          solution_idea: {
            title: o.solution_title,
            pitch: o.solution_pitch,
            type: o.solution_type
          }
        })),
        groundingSources: [] // We don't save grounding sources in DB yet for simplicity
      }));
      setHistory(formatted);
    }
    setLoadingHistory(false);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setStatus({ stage: 'expanding', message: 'Expanding search queries with AI...' });
    setResult(null);

    try {
      const expandedQueries = await hunter.expandQuery(query);
      
      setStatus({ stage: 'hunting', message: `Hunting for real-world pain points...` });
      const { problems, sources } = await hunter.huntAndSynthesize(expandedQueries);

      // Save to Supabase
      const { data: searchData, error: searchError } = await supabase
        .from('searches')
        .insert({ user_id: session.user.id, user_query: query })
        .select()
        .single();

      if (searchData && problems.length > 0) {
        await supabase.from('opportunities').insert(
          problems.map(p => ({
            search_id: searchData.id,
            problem_title: p.title,
            pain_score: p.pain_score,
            frequency_score: p.frequency_score,
            evidence_quote: p.evidence,
            solution_title: p.solution_idea.title,
            solution_pitch: p.solution_idea.pitch,
            solution_type: p.solution_idea.type,
            category: p.category
          }))
        );

        // Update Credits
        if (profile) {
          await supabase
            .from('profiles')
            .update({ credits_used: (profile.credits_used || 0) + 1 })
            .eq('id', session.user.id);
          fetchProfile();
        }
      }

      const newResult: SearchResult = {
        id: searchData?.id || Math.random().toString(),
        query: query,
        problems,
        timestamp: new Date().toISOString(),
        groundingSources: sources
      };

      setResult(newResult);
      fetchHistory();
      setStatus({ stage: 'completed', message: 'Analysis complete.' });
    } catch (error) {
      console.error(error);
      setStatus({ stage: 'error', message: 'The signal was lost. Please check your connection.' });
    }
  };

  const handleLogout = () => supabase.auth.signOut();

  if (!session) return <Auth />;

  const PipelineStep: React.FC<{ active: boolean; done: boolean; title: string; icon: React.ReactNode }> = ({ active, done, title, icon }) => (
    <div className={`flex items-center gap-3 transition-all duration-500 ${active ? 'opacity-100 scale-105' : done ? 'opacity-50' : 'opacity-30'}`}>
      <div className={`p-2 rounded-lg ${active ? 'bg-emerald-500/20 text-emerald-400' : done ? 'bg-zinc-800 text-zinc-500' : 'bg-zinc-900 text-zinc-700'}`}>
        {active ? <Loader2 className="w-5 h-5 animate-spin" /> : icon}
      </div>
      <span className={`text-sm font-bold tracking-tight ${active ? 'text-white' : 'text-zinc-500'}`}>{title}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 pb-20 selection:bg-emerald-500 selection:text-black">
      <nav className="border-b border-zinc-800/50 bg-black/40 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => { setStatus({ stage: 'idle', message: '' }); setResult(null); }}>
            <div className="bg-emerald-500 p-1.5 rounded-lg shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
              <Radar className="w-5 h-5 text-black" />
            </div>
            <span className="font-extrabold text-xl tracking-tighter">SIGNAL HUNTER</span>
          </div>
          
          <div className="flex items-center gap-4">
            {profile && (
              <div className="hidden md:flex items-center gap-3 px-3 py-1.5 bg-zinc-900/50 border border-zinc-800 rounded-full">
                <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-400 uppercase tracking-tight">
                  <Zap className="w-3 h-3 text-emerald-400" />
                  <span>{profile.credits_used} Credits</span>
                </div>
                {profile.is_pro && (
                  <div className="flex items-center gap-1 text-xs font-bold text-emerald-400 uppercase bg-emerald-500/10 px-2 rounded-full">
                    <Crown className="w-3 h-3" /> PRO
                  </div>
                )}
              </div>
            )}
            
            <div className="h-6 w-[1px] bg-zinc-800 mx-2"></div>
            
            <button 
              onClick={handleLogout}
              className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-all"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 pt-12">
        {status.stage === 'idle' && !result && (
          <div className="max-w-3xl mx-auto text-center py-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest">
                <UserIcon className="w-3 h-3" /> Welcome back, {profile?.first_name || 'Hunter'}
              </div>
              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-white leading-[1.1]">
                Target your next <br />
                <span className="bg-gradient-to-r from-emerald-400 to-emerald-200 bg-clip-text text-transparent">Opportunity.</span>
              </h1>
            </div>

            <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto group">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/50 to-emerald-300/50 rounded-2xl blur opacity-25 group-focus-within:opacity-100 transition duration-1000"></div>
              <div className="relative flex items-center bg-zinc-900/90 border-2 border-zinc-800 rounded-2xl p-2 pr-4 focus-within:border-emerald-500/50 transition-all">
                <div className="pl-4 pr-2 text-zinc-500">
                  <Target className="w-6 h-6" />
                </div>
                <input 
                  type="text" 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="What niche are we hunting today?"
                  className="bg-transparent border-none focus:ring-0 text-white w-full py-4 text-lg font-medium placeholder:text-zinc-600 outline-none"
                />
                <button 
                  type="submit"
                  disabled={!query.trim() || status.stage !== 'idle'}
                  className="bg-emerald-500 hover:bg-emerald-400 text-black px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  HUNT <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        )}

        {status.stage !== 'idle' && status.stage !== 'completed' && status.stage !== 'error' && (
          <div className="max-w-2xl mx-auto py-24 space-y-12 animate-in fade-in duration-500">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Radar className="w-10 h-10 text-emerald-500 animate-pulse" />
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Crawling for real signals...</h2>
              <p className="text-zinc-500 font-medium">{status.message}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <PipelineStep title="Expanding" icon={<Target className="w-5 h-5" />} active={status.stage === 'expanding'} done={['hunting', 'synthesizing'].includes(status.stage)} />
              <PipelineStep title="Extracting" icon={<Search className="w-5 h-5" />} active={status.stage === 'hunting'} done={status.stage === 'synthesizing'} />
              <PipelineStep title="Mapping" icon={<Cpu className="w-5 h-5" />} active={status.stage === 'synthesizing'} done={false} />
            </div>
          </div>
        )}

        {result && <Dashboard data={result} />}

        {history.length > 0 && !result && status.stage === 'idle' && (
          <div className="max-w-5xl mx-auto pt-12 space-y-6">
             <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
               <History className="w-5 h-5 text-zinc-500" />
               <h3 className="text-lg font-bold text-zinc-400 tracking-tight uppercase">Your Persistent Signals</h3>
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {history.map((h) => (
                  <div 
                    key={h.id} 
                    onClick={() => setResult(h)}
                    className="p-4 bg-zinc-900/40 border border-zinc-800 rounded-2xl hover:border-emerald-500/40 cursor-pointer transition-all group relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 blur-2xl rounded-full"></div>
                    <div className="flex justify-between items-start mb-2 relative">
                       <span className="text-sm font-bold text-white group-hover:text-emerald-400 truncate pr-2 capitalize">{h.query}</span>
                       <span className="text-[10px] text-zinc-600 font-mono shrink-0">{new Date(h.timestamp).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 relative">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 bg-zinc-800 text-zinc-500 rounded uppercase">
                        {h.problems.length} signals
                      </span>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
