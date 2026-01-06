
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Radar, Loader2, ArrowRight, User, Mail, Lock } from 'lucide-react';

export const Auth: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: firstName,
              last_name: lastName,
            }
          }
        });
        if (error) throw error;
        alert('Verification email sent! Check your inbox.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#09090b] px-6">
      <div className="max-w-md w-full space-y-8 p-8 bg-zinc-900/50 border border-zinc-800 rounded-2xl backdrop-blur-xl relative">
        <div className="absolute -top-12 left-1/2 -translate-x-1/2">
          <div className="bg-emerald-500 p-3 rounded-2xl shadow-xl shadow-emerald-500/20">
            <Radar className="w-8 h-8 text-black" />
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-white tracking-tighter">
            {isLogin ? 'Welcome Back Hunter' : 'Join the Signal Hunter'}
          </h2>
          <p className="text-zinc-500 mt-2">
            {isLogin ? 'Access your saved signals and market maps.' : 'Start hunting for your next micro-SaaS opportunity.'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase">First Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-black/50 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-white focus:border-emerald-500 transition-all outline-none"
                    placeholder="John"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase">Last Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-black/50 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-white focus:border-emerald-500 transition-all outline-none"
                    placeholder="Doe"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-500 uppercase">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/50 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-white focus:border-emerald-500 transition-all outline-none"
                placeholder="hunter@signal.com"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-500 uppercase">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/50 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-white focus:border-emerald-500 transition-all outline-none"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && <p className="text-red-400 text-sm text-center font-medium">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold rounded-xl transition-all flex items-center justify-center gap-2 group"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>
                {isLogin ? 'LOG IN' : 'CREATE ACCOUNT'}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-4">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-zinc-400 hover:text-white text-sm font-medium transition-colors underline decoration-zinc-800"
          >
            {isLogin ? "Don't have an account? Join now" : "Already a hunter? Log in"}
          </button>
        </div>
      </div>
    </div>
  );
};
