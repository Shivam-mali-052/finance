import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit, getDocs } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { getFinancialInsights, FinancialInsight } from '../services/gemini';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  Loader2,
  Calendar
} from 'lucide-react';
import { TransactionPieChart, MonthlyTrendChart } from '../components/Charts';
import { formatCurrency, formatDate, cn } from '../lib/utils';
import { NavLink } from 'react-router-dom';

export default function Dashboard() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [budgetLimit, setBudgetLimit] = useState<number>(0);
  const [insights, setInsights] = useState<FinancialInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [insightsLoading, setInsightsLoading] = useState(false);
  
  const currentMonth = new Date().toISOString().slice(0, 7);

  useEffect(() => {
    if (!auth.currentUser) return;

    // Fetch Transactions
    const qT = query(
      collection(db, 'transactions'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('date', 'desc')
    );

    const unsubT = onSnapshot(qT, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTransactions(data);
      setLoading(false);
    });

    // Fetch Budget
    const qB = query(
      collection(db, 'budgets'),
      where('userId', '==', auth.currentUser.uid),
      where('month', '==', currentMonth),
      limit(1)
    );

    const unsubB = onSnapshot(qB, (snapshot) => {
      if (!snapshot.empty) {
        setBudgetLimit(snapshot.docs[0].data().monthlyLimit);
      }
    });

    return () => {
      unsubT();
      unsubB();
    };
  }, [currentMonth]);

  const generateInsights = async () => {
    if (transactions.length === 0) return;
    setInsightsLoading(true);
    const result = await getFinancialInsights(transactions, budgetLimit, currentMonth);
    setInsights(result);
    setInsightsLoading(false);
  };

  // Only auto-generate insights once we have data
  useEffect(() => {
    if (transactions.length > 0 && insights.length === 0 && !loading) {
      generateInsights();
    }
  }, [transactions, loading]);

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;
  const budgetUsage = budgetLimit > 0 ? (totalExpense / budgetLimit) * 100 : 0;
  const overBudget = totalExpense > budgetLimit && budgetLimit > 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-slate-300" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-medium text-white">Your Portfolio</h2>
          <p className="text-[10px] uppercase text-zinc-500 tracking-wider">Financial intelligence tracking active</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right leading-tight">
            <p className="text-[10px] uppercase text-zinc-500 tracking-wider">Server Status</p>
            <p className="text-xs font-mono text-emerald-400">Online • Live Sync</p>
          </div>
          <NavLink
            to="/transactions"
            className="px-5 py-2.5 bg-white text-black text-xs font-semibold rounded-full hover:bg-zinc-200 transition-all"
          >
            + Add Entry
          </NavLink>
        </div>
      </div>

      {/* Budget Status Alert */}
      {budgetLimit > 0 && (overBudget || budgetUsage >= 90) && (
        <div className={cn(
          "p-6 rounded-[32px] border flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-500",
          overBudget 
            ? "bg-rose-500/10 border-rose-500/20 text-rose-200 ai-glow" 
            : "bg-amber-500/10 border-amber-500/20 text-amber-200"
        )}>
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg",
              overBudget ? "bg-rose-500 text-white" : "bg-amber-500 text-black"
            )}>
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-base text-white leading-tight">
                {overBudget ? 'Budget Limit Exceeded' : 'Approaching Budget Limit'}
              </h4>
              <p className="text-xs opacity-70">
                {overBudget 
                  ? `You have spent ${formatCurrency(totalExpense - budgetLimit)} more than your monthly allocation.`
                  : `You've utilized ${Math.round(budgetUsage)}% of your monthly budget. Monitor remaining liquidity.`}
              </p>
            </div>
          </div>
          <NavLink 
            to="/budget" 
            className={cn(
              "px-6 py-3 rounded-xl font-bold text-[11px] uppercase tracking-widest transition-all",
              overBudget ? "bg-rose-500 text-white hover:bg-rose-600" : "bg-amber-500 text-black hover:bg-amber-600"
            )}
          >
            Adjust Budget
          </NavLink>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card-gradient border border-white/5 p-6 rounded-2xl relative overflow-hidden group shadow-2xl shadow-black/50">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-700">
            <Wallet className="w-20 h-20" />
          </div>
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Total Net Balance</p>
          <p className="text-3xl font-semibold tracking-tight text-white mb-2">
            {formatCurrency(balance).split('.')[0]}<span className="text-zinc-500">.{formatCurrency(balance).split('.')[1] || '00'}</span>
          </p>
          <div className="flex items-center gap-2 text-emerald-400 text-[10px] font-medium">
            <TrendingUp className="w-3 h-3" />
            <span>Aggregate performance measured</span>
          </div>
        </div>

        <div className="card-gradient border border-white/5 p-6 rounded-2xl relative overflow-hidden group">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Monthly Income</p>
          <p className="text-3xl font-semibold tracking-tight text-white mb-4">
            {formatCurrency(totalIncome).split('.')[0]}<span className="text-zinc-500">.{formatCurrency(totalIncome).split('.')[1] || '00'}</span>
          </p>
          <div className="w-full h-1 bg-zinc-800 rounded-full mt-4">
            <div className="w-[85%] h-full bg-blue-500 rounded-full"></div>
          </div>
        </div>

        <div className="card-gradient border border-white/5 p-6 rounded-2xl relative overflow-hidden group">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Monthly Expenses</p>
          <p className="text-3xl font-semibold tracking-tight text-white mb-4">
            {formatCurrency(totalExpense).split('.')[0]}<span className="text-zinc-500">.{formatCurrency(totalExpense).split('.')[1] || '00'}</span>
          </p>
          <div className="w-full h-1 bg-zinc-800 rounded-full mt-4 overflow-hidden">
            <div 
              className={cn("h-full transition-all duration-1000", overBudget ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]' : 'bg-rose-500/80')}
              style={{ width: `${Math.min(budgetUsage, 100)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8 min-h-[400px]">
        {/* Charts Section */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-8">
          <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-3xl relative h-full">
            <div className="flex justify-between items-start mb-8">
              <div className="space-y-1">
                <h3 className="text-lg font-medium text-white">Expense Projection</h3>
                <p className="text-xs text-zinc-500">Tracking category fluctuations over time</p>
              </div>
              <div className="flex gap-4 text-[10px]">
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-brand-purple"></span> Income</div>
                <div className="flex items-center gap-1.5 opacity-50"><span className="w-2 h-2 rounded-full bg-zinc-600"></span> Expenses</div>
              </div>
            </div>
            <div className="h-[250px]">
              <MonthlyTrendChart data={transactions} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {insightsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-40 bg-zinc-900/40 border border-white/5 animate-pulse rounded-3xl" />
              ))
            ) : insights.length > 0 ? (
              insights.map((insight, i) => (
                <div key={i} className={cn(
                  "p-8 rounded-[32px] border flex flex-col ai-glow transition-all hover:scale-[1.02]",
                  insight.detectedIssue ? "bg-rose-500/5 border-rose-500/10" : "bg-brand-purple/10 border-brand-purple/20"
                )}>
                  <div className="flex items-center gap-2 mb-4">
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center",
                      insight.detectedIssue ? "bg-rose-500" : "bg-brand-purple"
                    )}>
                      <Sparkles className="w-3 h-3 text-white" />
                    </div>
                    <span className={cn(
                      "text-xs font-semibold",
                      insight.detectedIssue ? "text-rose-200" : "text-brand-purple/80"
                    )}>Smart Insight</span>
                  </div>
                  <p className="text-serif text-lg leading-snug mb-4 text-white">“{insight.title}”</p>
                  <p className="text-[11px] text-zinc-500 leading-relaxed mb-4">{insight.description}</p>
                  <p className={cn(
                    "text-[10px] font-bold uppercase tracking-widest mt-auto",
                    insight.detectedIssue ? "text-rose-400" : "text-brand-purple"
                  )}>
                    Tip: {insight.suggestion}
                  </p>
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center py-12 text-zinc-600 italic bg-zinc-900/20 rounded-3xl border border-white/5">
                Financial patterns pending sufficient data population.
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Data */}
        <div className="col-span-12 lg:col-span-4 space-y-8">
          <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-3xl">
            <h3 className="text-xs font-semibold text-zinc-500 tracking-wider mb-6 uppercase">Category Distribution</h3>
            <div className="h-[200px] relative">
              <TransactionPieChart data={transactions} />
            </div>
            <div className="mt-8 grid grid-cols-2 gap-4 text-[10px] text-zinc-400">
               {/* Categories would go here, maybe dynamic based on legend but simple for now */}
               <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-brand-purple"></span> Major Category</div>
               <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Essentials</div>
            </div>
          </div>

          <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-3xl flex-1">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xs font-semibold text-zinc-500 tracking-wider uppercase">Recent Activity</h3>
              <NavLink to="/transactions" className="text-zinc-600 hover:text-white transition-all">
                <ArrowRight className="w-4 h-4" />
              </NavLink>
            </div>
            <div className="space-y-6">
              {transactions.slice(0, 5).map(t => (
                <div key={t.id} className="flex justify-between items-center group">
                  <div className="flex gap-4 items-center">
                    <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-white/5 flex items-center justify-center text-xs">
                      {t.type === 'income' ? '💰' : '💸'}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-zinc-200">{t.category}</span>
                      <span className="text-[10px] text-zinc-600">{t.date?.toDate ? formatDate(t.date.toDate()) : formatDate(t.date)}</span>
                    </div>
                  </div>
                  <span className={cn(
                    "text-xs font-mono font-bold tracking-tight",
                    t.type === 'income' ? 'text-emerald-400' : 'text-white'
                  )}>
                    {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
