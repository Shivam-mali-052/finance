import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, Timestamp, orderBy, serverTimestamp } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { Plus, Trash2, ArrowUpRight, ArrowDownLeft, X, Loader2 } from 'lucide-react';
import { formatCurrency, formatDate, cn } from '../lib/utils';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  date: any;
  description: string;
}

const CATEGORIES = {
  income: ['Salary', 'Freelance', 'Investment', 'Gift', 'Other'],
  expense: ['Food', 'Rent', 'Transport', 'Shopping', 'Entertainment', 'Health', 'Other']
};

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // Form state
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Transaction[];
      setTransactions(data);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    setSubmitting(true);

    try {
      setError(null);
      await addDoc(collection(db, 'transactions'), {
        type,
        amount: parseFloat(amount),
        category,
        date: Timestamp.fromDate(new Date(date)),
        description: description || '',
        userId: auth.currentUser.uid,
        createdAt: serverTimestamp()
      });
      setShowModal(false);
      resetForm();
    } catch (err: any) {
      console.error(err);
      setError('Transaction failed. Please try again.');
      handleFirestoreError(err, OperationType.CREATE, 'transactions');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this transaction?')) {
      await deleteDoc(doc(db, 'transactions', id));
    }
  };

  const resetForm = () => {
    setType('expense');
    setAmount('');
    setCategory('Food');
    setDate(new Date().toISOString().split('T')[0]);
    setDescription('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-medium text-white">General Transactions</h2>
          <p className="text-[10px] uppercase text-zinc-500 tracking-wider">Detailed activity log</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-5 py-2.5 bg-white text-black text-xs font-semibold rounded-full hover:bg-zinc-200 transition-all shadow-sm"
        >
          + Add Entry
        </button>
      </div>

      <div className="bg-zinc-900/40 rounded-3xl border border-white/5 overflow-hidden shadow-sm no-scrollbar">
        {loading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-zinc-700" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-zinc-900 border border-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-zinc-700" />
            </div>
            <p className="text-zinc-500 text-sm">No transaction records found in the current buffer.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 bg-white/2">
                  <th className="px-6 py-4 font-semibold text-zinc-500 text-[10px] uppercase tracking-widest italic">Type</th>
                  <th className="px-6 py-4 font-semibold text-zinc-500 text-[10px] uppercase tracking-widest italic">Category</th>
                  <th className="px-6 py-4 font-semibold text-zinc-500 text-[10px] uppercase tracking-widest italic">Description</th>
                  <th className="px-6 py-4 font-semibold text-zinc-500 text-[10px] uppercase tracking-widest italic">Date</th>
                  <th className="px-6 py-4 font-semibold text-zinc-500 text-[10px] uppercase tracking-widest italic text-right">Amount</th>
                  <th className="px-6 py-4 font-semibold text-zinc-500 text-[10px] uppercase tracking-widest italic w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-5">
                      {t.type === 'income' ? (
                        <div className="flex items-center gap-2 text-emerald-400 font-medium text-xs">
                          <ArrowUpRight className="w-3 h-3" />
                          <span>Income</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-zinc-400 font-medium text-xs">
                          <ArrowDownLeft className="w-3 h-3" />
                          <span>Expense</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <span className="px-2 py-1 bg-zinc-800 text-zinc-300 rounded text-[10px] font-bold uppercase tracking-wider">
                        {t.category}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-zinc-400 text-sm">{t.description || '-'}</span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-zinc-500 font-mono text-xs tabular-nums tracking-tighter">
                        {t.date?.toDate ? formatDate(t.date.toDate()) : formatDate(t.date)}
                      </span>
                    </td>
                    <td className={cn(
                      "px-6 py-5 text-right font-bold text-base font-mono tabular-nums tracking-tighter",
                      t.type === 'income' ? 'text-emerald-400' : 'text-white'
                    )}>
                      {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                    </td>
                    <td className="px-6 py-5">
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="p-2 text-zinc-700 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowModal(false)}></div>
          <div className="relative glass border-white/10 w-full max-w-lg rounded-[32px] p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-medium text-white">Create Entry</h3>
              <button 
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-white/5 rounded-full transition-all text-zinc-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdd} className="space-y-6">
              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-[10px] font-medium animate-in fade-in slide-in-from-top-1">
                  {error}
                </div>
              )}
              <div className="flex p-1 bg-white/5 rounded-xl border border-white/5">
                <button
                  type="button"
                  onClick={() => { setType('expense'); setCategory('Food'); }}
                  className={cn(
                    "flex-1 py-2 text-xs rounded-lg font-bold transition-all uppercase tracking-widest",
                    type === 'expense' ? "bg-white text-black shadow-sm" : "text-zinc-500 hover:text-white"
                  )}
                >
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() => { setType('income'); setCategory('Salary'); }}
                  className={cn(
                    "flex-1 py-2 text-xs rounded-lg font-bold transition-all uppercase tracking-widest",
                    type === 'income' ? "bg-white text-black shadow-sm" : "text-zinc-500 hover:text-white"
                  )}
                >
                  Income
                </button>
              </div>

              <div className="space-y-2 text-center py-4">
                <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest italic leading-none">Transaction amount</label>
                <div className="relative flex justify-center items-baseline gap-1">
                  <span className="text-zinc-500 text-2xl font-light">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full max-w-[200px] bg-transparent text-white text-5xl font-bold focus:outline-none transition-all text-center placeholder:text-zinc-800 outline-none tabular-nums tracking-tighter"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest italic ml-1">Category</label>
                  <select
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-purple transition-all text-sm font-medium text-white appearance-none cursor-pointer"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {CATEGORIES[type].map(c => <option key={c} value={c} className="bg-zinc-900">{c}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest italic ml-1">Date</label>
                  <input
                    type="date"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-purple transition-all text-sm font-medium text-white cursor-pointer color-scheme-dark"
                    style={{ colorScheme: 'dark' }}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest italic ml-1">Notes</label>
                <input
                  type="text"
                  placeholder="Reference details..."
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-purple transition-all text-sm font-medium text-white placeholder:text-zinc-700"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-brand-purple text-white font-bold py-4 rounded-xl hover:bg-brand-purple/90 transition-all shadow-lg shadow-brand-purple/20 disabled:opacity-50 flex items-center justify-center gap-2 text-xs uppercase tracking-widest"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Transfer'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const ReceiptText = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1Z"/>
    <path d="M16 8H8"/><path d="M16 12H8"/><path d="M13 16H8"/>
  </svg>
);
