"use client";

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { LogOut, User as UserIcon, ShieldCheck } from 'lucide-react';

export default function Home() {
  const { user, logout, isLoading } = useAuth();

  if (isLoading) return null;

  const screens = [
    { name: 'Cashier / Billing', href: '/cashier', icon: '💰', color: 'bg-indigo-600', roles: ['Admin', 'User'] },
    { name: 'Kitchen Display', href: '/kitchen', icon: '👨‍🍳', color: 'bg-rose-600', roles: ['Admin', 'User'] },
    { name: 'Customer Display', href: '/customer', icon: '📺', color: 'bg-emerald-600', roles: ['Admin', 'User'] },
    { name: 'Status Board', href: '/status', icon: '📋', color: 'bg-amber-600', roles: ['Admin', 'User'] },
    { name: 'Items Management', href: '/items', icon: '🍔', color: 'bg-violet-600', roles: ['Admin'] },
    { name: 'Sales Revenue', href: '/reports/sales', icon: '📈', color: 'bg-emerald-600', roles: ['Admin'] },
  ];

  const allowedScreens = screens.filter(s => s.roles.includes(user?.role || ''));

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col p-8 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-50/50 via-white to-white">
      {/* Top Navigation */}
      <div className="max-w-6xl w-full mx-auto flex justify-between items-center mb-10">
        <div className="flex items-center gap-4 bg-white p-2 pr-6 rounded-full shadow-sm border border-slate-100">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
            <UserIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Authenticated As</p>
            <p className="text-sm font-bold text-slate-900">{user?.fullName || user?.username}</p>
          </div>
          <div className="ml-4 flex items-center gap-1 px-2 py-1 bg-slate-50 text-[10px] font-black text-slate-500 rounded-lg uppercase tracking-wider">
            {user?.role === 'Admin' && <ShieldCheck className="h-3 w-3 text-primary" />}
            {user?.role}
          </div>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-red-50 text-slate-400 hover:text-red-500 font-bold rounded-2xl transition-all border border-slate-100 shadow-sm active:scale-95"
        >
          <LogOut className="h-4 w-4" />
          <span className="text-xs uppercase tracking-widest">Terminate Session</span>
        </button>
      </div>

      <div className="max-w-6xl w-full mx-auto flex-1 flex flex-col justify-center">
        <div className="text-center mb-16">
          <h1 className="text-7xl font-black text-slate-900 mb-4 tracking-tight italic">
            <span className="text-indigo-600">Next</span>Serve
          </h1>
          <p className="text-xl text-slate-500 font-medium">Next-Gen Restaurant Management System</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {allowedScreens.map((screen) => (
            <Link
              key={screen.href}
              href={screen.href}
              className="group relative overflow-hidden glass-card rounded-[2.5rem] p-10 hover:scale-[1.03] transition-all hover:shadow-2xl hover:shadow-indigo-200/50 border border-white"
            >
              <div className={`absolute top-0 right-0 w-32 h-32 ${screen.color} opacity-[0.03] rounded-bl-full translate-x-8 -translate-y-8 group-hover:scale-150 transition-transform duration-700`} />

              <div className="flex flex-col gap-6 relative z-10">
                <div className={`w-16 h-16 ${screen.color} rounded-2xl flex items-center justify-center text-3xl shadow-xl shadow-slate-200/50`}>
                  {screen.icon}
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 italic uppercase tracking-tight">{screen.name}</h2>
                  <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Initialize Terminal</p>
                </div>
              </div>

              <div className="mt-10 flex items-center text-indigo-600 font-black text-xs uppercase tracking-[0.2em] gap-2 opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all">
                <span>Access Interface</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-24 text-center text-slate-400 font-bold uppercase tracking-[0.3em] border-t border-slate-100 pt-10 text-[10px]">
          <p>© 2026 NextServe Systems. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
