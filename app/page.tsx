"use client";

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  LogOut,
  User as UserIcon,
  ShieldCheck,
  CreditCard,
  Utensils,
  Monitor,
  ClipboardList,
  UtensilsCrossed,
  TrendingUp
} from 'lucide-react';

export default function Home() {
  const { user, logout, isLoading } = useAuth();

  if (isLoading) return null;

  const screens = [
    { name: 'Cashier / Billing', href: '/cashier', icon: <CreditCard className="h-6 w-6 text-white" />, color: 'bg-indigo-600', roles: ['Admin', 'User'] },
    { name: 'Kitchen Display', href: '/kitchen', icon: <Utensils className="h-6 w-6 text-white" />, color: 'bg-rose-600', roles: ['Admin', 'User'] },
    { name: 'Customer Display', href: '/customer', icon: <Monitor className="h-6 w-6 text-white" />, color: 'bg-emerald-600', roles: ['Admin', 'User'] },
    { name: 'Status Board', href: '/status', icon: <ClipboardList className="h-6 w-6 text-white" />, color: 'bg-amber-600', roles: ['Admin', 'User'] },
    { name: 'Items Management', href: '/items', icon: <UtensilsCrossed className="h-6 w-6 text-white" />, color: 'bg-violet-600', roles: ['Admin'] },
    { name: 'Sales Revenue', href: '/reports/sales', icon: <TrendingUp className="h-6 w-6 text-white" />, color: 'bg-emerald-600', roles: ['Admin'] },
  ];

  const allowedScreens = screens.filter(s => s.roles.includes(user?.role || ''));

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col p-4 md:p-8 bg-[radial-gradient(circle_at_top_right,var(--tw-gradient-stops))] from-indigo-50/50 via-white to-white">
      {/* Top Navigation */}
      <div className="max-w-6xl w-full mx-auto flex flex-col md:flex-row justify-between items-center mb-6 md:mb-8 gap-4">
        <div className="flex items-center gap-4 bg-white p-2 pr-6 rounded-full shadow-sm border border-slate-100 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <UserIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Authenticated As</p>
              <p className="text-sm font-bold text-slate-900">{user?.fullName || user?.username}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 bg-slate-50 text-[10px] font-black text-slate-500 rounded-lg uppercase tracking-wider">
            {user?.role === 'Admin' && <ShieldCheck className="h-3 w-3 text-primary" />}
            {user?.role}
          </div>
        </div>

        <button
          type='button'
          onClick={logout}
          className="flex items-center cursor-pointer justify-center gap-2 px-6 py-3 bg-white hover:bg-red-50 text-slate-400 hover:text-red-500 font-bold rounded-2xl transition-all border border-slate-100 shadow-sm active:scale-95 w-full md:w-auto"
        >
          <LogOut className="h-4 w-4" />
          <span className="text-xs uppercase tracking-widest">Log Out</span>
        </button>
      </div>

      <div className="max-w-6xl w-full mx-auto flex-1 flex flex-col justify-center">
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-5xl md:text-6xl font-black text-slate-900 mb-2 tracking-tight italic">
            <span className="text-indigo-600">Next</span>Serve
          </h1>
          <p className="text-base md:text-lg text-slate-500 font-medium tracking-tight">Next-Gen Restaurant Management System</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {allowedScreens.map((screen) => (
            <Link
              key={screen.href}
              href={screen.href}
              className="group relative overflow-hidden glass-card rounded-3xl md:rounded-3xl p-6 md:p-7 hover:scale-[1.02] transition-all hover:shadow-2xl hover:shadow-indigo-200/40 border border-white"
            >
              <div className={`absolute top-0 right-0 w-24 h-24 ${screen.color} opacity-[0.03] rounded-bl-full translate-x-8 -translate-y-8 group-hover:scale-150 transition-transform duration-700`} />

              <div className="flex flex-col gap-4 relative z-10">
                <div className={`w-12 h-12 ${screen.color} rounded-xl flex items-center justify-center shadow-lg shadow-slate-200/50`}>
                  {screen.icon}
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 italic uppercase tracking-tight">{screen.name}</h2>
                </div>
              </div>

              <div className="mt-6 flex items-center text-indigo-600 font-black text-[10px] uppercase tracking-[0.2em] gap-2 opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all">
                <span>Go to {screen.name}</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-16 md:mt-24 text-center text-slate-400 font-bold uppercase tracking-[0.3em] border-t border-slate-100 pt-10 text-[10px]">
          <p>© Copyright 2026 TrivexTech Pvt Ltd || All Rights Reserved</p>
        </div>
      </div>
    </div>
  );
}
