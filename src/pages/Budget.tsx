import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, setDoc, doc, getDocs, limit } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { Wallet, Info, Loader2, Save, CalendarDays, TrendingUp, AlertCircle } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { NavLink } from 'react-router-dom';

export default function Budget() {
  const [budgetLimit, setBudgetLimit] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'budgets'),
      where('userId', '==', auth.currentUser.uid),
      where('month', '==', currentMonth),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setBudgetLimit(snapshot.docs[0].data().monthlyLimit);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [currentMonth]);

  const handleSave = async () => {
    if (!auth.currentUser) return;
    setSaving(true);
    setMessage('');

    try {
      const budgetId = `${auth.currentUser.uid}_${currentMonth}`;
      await setDoc(doc(db, 'budgets', budgetId), {
        userId: auth.currentUser.uid,
        month: currentMonth,
        monthlyLimit: budgetLimit,
        updatedAt: new Date().toISOString()
      });
      setMessage('Budget updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setMessage('Failed to save budget.');
      handleFirestoreError(err, OperationType.WRITE, `budgets/${auth.currentUser.uid}_${currentMonth}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h2 className="text-xl font-medium text-white">Budget Settings</h2>
        <p className="text-[10px] uppercase text-zinc-500 tracking-wider">Plan your spending for {new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date())}</p>
      </div>

      <div className="bg-zinc-900/40 rounded-[32px] p-10 border border-white/5 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <TrendingUp className="w-48 h-48" />
        </div>
        
        <div className="relative z-10 space-y-10 text-center">
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/5 rounded-full border border-white/5">
            <CalendarDays className="w-4 h-4 text-zinc-500" />
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest italic">
              {new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date())} Cycle
            </span>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest italic leading-none">Monthly Expenditure Limit</label>
            <div className="relative flex justify-center items-baseline gap-2">
              <span className="text-zinc-500 text-3xl font-light">₹</span>
              <input
                type="number"
                value={budgetLimit || ''}
                onChange={(e) => setBudgetLimit(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full max-w-[300px] bg-transparent text-white text-7xl font-bold focus:outline-none transition-all text-center placeholder:text-zinc-800 outline-none tabular-nums tracking-tighter"
              />
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-2xl bg-zinc-950 border border-white/5 text-zinc-400 text-left max-w-lg mx-auto">
            <Info className="w-5 h-5 flex-shrink-0 mt-0.5 text-brand-purple" />
            <div className="text-[11px] leading-relaxed">
              <p className="font-bold mb-1 text-white uppercase tracking-wider">Strategic Budgeting</p>
              <p className="opacity-80">Defining a limit enables the AI engine to calibrate insights. We will trigger real-time alerts if algorithmic projections indicate a threshold breach.</p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4 pt-4">
            <button
              onClick={handleSave}
              disabled={loading || saving}
              className="bg-white text-black font-bold px-12 py-4 rounded-xl flex items-center gap-3 hover:bg-zinc-200 transition-all shadow-xl shadow-white/5 disabled:opacity-50 text-xs uppercase tracking-widest"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Commit Changes</span>
            </button>
            {message && (
              <span className={cn(
                "font-medium text-[10px] uppercase tracking-widest transition-all animate-in fade-in slide-in-from-bottom-2",
                message.includes('successfully') ? "text-emerald-400" : "text-rose-500"
              )}>
                {message}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white text-black p-8 rounded-[32px] space-y-2 group overflow-hidden relative">
          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-125 transition-transform duration-700">
             <TrendingUp className="w-32 h-32" />
          </div>
          <p className="text-zinc-400 font-bold uppercase tracking-widest text-[10px] italic">Annual Forecast</p>
          <p className="text-3xl font-bold font-mono tracking-tighter italic">
            {formatCurrency(budgetLimit * 12)}
          </p>
          <p className="text-[10px] text-zinc-500 opacity-80 leading-tight pr-12">Projected annual liquidity requirement based on current monthly settings.</p>
        </div>
        <div className="bg-zinc-900 text-white p-8 rounded-[32px] border border-white/5 space-y-2 group overflow-hidden relative">
          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-125 transition-transform duration-700">
             <CalendarDays className="w-32 h-32" />
          </div>
          <p className="text-zinc-600 font-bold uppercase tracking-widest text-[10px] italic">Daily Allocation</p>
          <p className="text-3xl font-bold font-mono tracking-tighter text-white italic">
            {formatCurrency(budgetLimit / 30)}
          </p>
          <p className="text-[10px] text-zinc-500 leading-tight pr-12">Target daily burn rate to maintain portfolio integrity over 30 days.</p>
        </div>
      </div>
    </div>
  );
}
