import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ReceiptText, Wallet, LogOut, TrendingUp } from 'lucide-react';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { cn } from '../lib/utils';

export default function Navbar() {
  const handleLogout = () => signOut(auth);

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/transactions', icon: ReceiptText, label: 'Transactions' },
    { to: '/budget', icon: Wallet, label: 'Budgeting' },
  ];

  return (
    <nav className="w-full md:w-64 bg-dark-bg border-b md:border-b-0 md:border-r border-white/5 flex flex-col h-auto md:h-screen sticky top-0 z-40">
      <div className="p-8 pb-12">
        <div className="flex items-center gap-2 mb-10">
          <div className="w-6 h-6 bg-brand-purple rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.5)]">
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
          <h1 className="text-lg font-semibold tracking-tight text-white">InsightFi</h1>
        </div>

        <div className="space-y-6 flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible no-scrollbar">
          <div className="space-y-3 w-full">
            <p className="text-[10px] uppercase tracking-widest text-zinc-600 font-semibold px-2 mb-2 hidden md:block">Overview</p>
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm whitespace-nowrap",
                    isActive 
                      ? "bg-zinc-900/50 text-white" 
                      : "text-zinc-400 hover:text-white hover:bg-white/5"
                  )
                }
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-auto p-8 border-t border-white/5 hidden md:block">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full text-zinc-500 hover:text-white transition-all text-sm group"
        >
          <LogOut className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          <span>Sign Out</span>
        </button>
      </div>
    </nav>
  );
}
