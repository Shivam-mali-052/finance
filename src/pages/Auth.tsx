import React, { useState } from 'react';
import { auth, db } from '../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider 
} from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Mail, Lock, Loader2, Chrome } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const { user } = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', user.uid), {
          displayName: fullName,
          email: user.email,
          createdAt: new Date().toISOString()
        });
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background blobs */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-brand-purple/20 blur-[120px] rounded-full" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-blue-500/10 blur-[120px] rounded-full" />

      <div className="w-full max-w-md relative z-10">
        <div className="glass rounded-[40px] border border-white/10 p-10 shadow-2xl relative overflow-hidden backdrop-blur-3xl">
          {/* Subtle line decoration */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-purple to-transparent opacity-50" />
          
          <div className="text-center space-y-2 mb-10">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 shadow-inner group transition-transform hover:scale-105">
                <TrendingUp className="w-8 h-8 text-brand-purple group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {isLogin ? 'Access Vault' : 'Initialize Account'}
            </h1>
            <p className="text-[10px] uppercase text-zinc-500 tracking-[0.2em] font-bold italic">
              AI-Powered Financial Intelligence
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-6">
            <div className="space-y-5">
              {!isLogin && (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                    Legal Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-purple/40 transition-all placeholder:text-zinc-700"
                    placeholder="Full Name"
                    required
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  Electronic Mail
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/5 rounded-xl pl-12 pr-4 py-3 text-sm text-white focus:outline-none focus:border-brand-purple/40 transition-all placeholder:text-zinc-700"
                    placeholder="name@nexus.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  Security Key
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/5 rounded-xl pl-12 pr-4 py-3 text-sm text-white focus:outline-none focus:border-brand-purple/40 transition-all placeholder:text-zinc-700"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-[11px] font-medium animate-in fade-in slide-in-from-top-1">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all disabled:opacity-50 text-[11px] uppercase tracking-widest shadow-lg shadow-white/5"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <span>{isLogin ? 'Authenticate' : 'Establish Nexus'}</span>
              )}
            </button>
          </form>

          <div className="mt-10 pt-10 border-t border-white/5 space-y-6">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full bg-white/5 border border-white/5 text-zinc-300 font-medium py-4 rounded-xl flex items-center justify-center gap-3 hover:bg-white/10 transition-all text-[11px] uppercase tracking-widest"
            >
              <Chrome className="w-4 h-4" />
              Google Authentication
            </button>

            <p className="text-center text-[10px] text-zinc-500 uppercase tracking-widest">
              {isLogin ? "New to the platform?" : "Already established?"}{' '}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-white font-bold hover:text-brand-purple transition-colors ml-1"
              >
                {isLogin ? 'Initialize' : 'Authenticate'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
