"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import AppLayout from '@/components/AppLayout';
import {
  ShieldCheck,
  CreditCard,
  ChefHat,
  Monitor,
  BarChart2,
  UtensilsCrossed,
  Box,
  Leaf,
  Calculator,
  TrendingUp,
  PieChart,
  ArrowRight,
} from 'lucide-react';

interface Screen {
  name: string;
  href: string;
  icon: React.ReactNode;
  bgColor: string;
  bgLight: string;
  ghostIcon: React.ReactNode;
  description: string;
  badge: string;
  badgeIcon: React.ReactNode;
  badgeBg: string;
  arrowBg: string;
  roles: string[];
}

export default function Home() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <AppLayout showBackButton={false}>
        <div className="max-w-6xl w-full mx-auto p-4 md:p-8 animate-pulse">
          {/* Title skeleton */}
          <div className="text-center mb-10 space-y-3">
            <div className="h-14 w-56 bg-slate-200 rounded-2xl mx-auto" />
            <div className="h-5 w-72 bg-slate-100 rounded-full mx-auto" />
          </div>

          {/* Cards grid skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className={`glass-card rounded-3xl p-6 md:p-7 border border-white space-y-4 ${i >= 2 ? 'hidden md:block' : ''}`}>
                <div className="w-12 h-12 bg-slate-200 rounded-xl" />
                <div className="h-6 w-40 bg-slate-200 rounded-xl" />
              </div>
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  const screens: Screen[] = [
    {
      name: 'Cashier / Billing',
      href: '/cashier',
      icon: <CreditCard className="h-6 w-6 text-white" />,
      bgColor: 'bg-indigo-600',
      bgLight: 'bg-indigo-50',
      ghostIcon: <CreditCard className="h-20 w-20 text-indigo-200" />,
      description: 'Create orders, manage payments and generate bills.',
      badge: 'Fast & Easy Billing',
      badgeIcon: <CreditCard className="h-3.5 w-3.5 text-indigo-500" />,
      badgeBg: 'bg-white border border-indigo-100 text-indigo-600',
      arrowBg: 'bg-indigo-600',
      roles: ['Admin', 'User'],
    },
    {
      name: 'Kitchen Display',
      href: '/kitchen',
      icon: <ChefHat className="h-6 w-6 text-white" />,
      bgColor: 'bg-rose-500',
      bgLight: 'bg-rose-50',
      ghostIcon: <ChefHat className="h-20 w-20 text-rose-200" />,
      description: 'View and manage kitchen orders in real-time.',
      badge: 'Live Order Tracking',
      badgeIcon: <div className="h-3 w-3 rounded-full bg-rose-500 animate-pulse" />,
      badgeBg: 'bg-white border border-rose-100 text-rose-600',
      arrowBg: 'bg-rose-500',
      roles: ['Admin', 'User'],
    },
    {
      name: 'Customer Display',
      href: '/customer',
      icon: <Monitor className="h-6 w-6 text-white" />,
      bgColor: 'bg-emerald-600',
      bgLight: 'bg-emerald-50',
      ghostIcon: <Monitor className="h-20 w-20 text-emerald-200" />,
      description: 'Show live orders for your customers.',
      badge: 'Real-time Updates',
      badgeIcon: <Monitor className="h-3.5 w-3.5 text-emerald-500" />,
      badgeBg: 'bg-white border border-emerald-100 text-emerald-600',
      arrowBg: 'bg-emerald-600',
      roles: ['Admin', 'User'],
    },
    {
      name: 'Status Board',
      href: '/status',
      icon: <BarChart2 className="h-6 w-6 text-white" />,
      bgColor: 'bg-amber-500',
      bgLight: 'bg-amber-50',
      ghostIcon: <BarChart2 className="h-20 w-20 text-amber-200" />,
      description: 'Monitor orders, table status and overall operations.',
      badge: 'Live Status',
      badgeIcon: <BarChart2 className="h-3.5 w-3.5 text-amber-500" />,
      badgeBg: 'bg-white border border-amber-100 text-amber-600',
      arrowBg: 'bg-amber-500',
      roles: ['Admin', 'User'],
    },
    {
      name: 'Dining Management',
      href: '/dining',
      icon: <UtensilsCrossed className="h-6 w-6 text-white" />,
      bgColor: 'bg-sky-600',
      bgLight: 'bg-sky-50',
      ghostIcon: <UtensilsCrossed className="h-20 w-20 text-sky-200" />,
      description: 'Manage tables, reservations and dine-in orders.',
      badge: 'Table Management',
      badgeIcon: <UtensilsCrossed className="h-3.5 w-3.5 text-sky-500" />,
      badgeBg: 'bg-white border border-sky-100 text-sky-600',
      arrowBg: 'bg-sky-600',
      roles: ['Admin', 'User'],
    },
    {
      name: 'Items Management',
      href: '/items',
      icon: <Box className="h-6 w-6 text-white" />,
      bgColor: 'bg-violet-600',
      bgLight: 'bg-violet-50',
      ghostIcon: <Box className="h-20 w-20 text-violet-200" />,
      description: 'Add, edit and manage menu items and categories.',
      badge: 'Menu Control',
      badgeIcon: <Box className="h-3.5 w-3.5 text-violet-500" />,
      badgeBg: 'bg-white border border-violet-100 text-violet-600',
      arrowBg: 'bg-violet-600',
      roles: ['Admin'],
    },
    {
      name: 'Stock & Ingredients',
      href: '/ingredients',
      icon: <Leaf className="h-6 w-6 text-white" />,
      bgColor: 'bg-emerald-600',
      bgLight: 'bg-emerald-50',
      ghostIcon: <Leaf className="h-20 w-20 text-emerald-200" />,
      description: 'Track ingredients, manage stock and get low stock alerts.',
      badge: 'Inventory Control',
      badgeIcon: <Leaf className="h-3.5 w-3.5 text-emerald-500" />,
      badgeBg: 'bg-white border border-emerald-100 text-emerald-600',
      arrowBg: 'bg-emerald-600',
      roles: ['Admin', 'User'],
    },
    {
      name: 'Dish Estimations',
      href: '/estimations',
      icon: <Calculator className="h-6 w-6 text-white" />,
      bgColor: 'bg-sky-600',
      bgLight: 'bg-sky-50',
      ghostIcon: <Calculator className="h-20 w-20 text-sky-200" />,
      description: 'Calculate dish costs and manage profit margins.',
      badge: 'Cost Estimation',
      badgeIcon: <Calculator className="h-3.5 w-3.5 text-sky-500" />,
      badgeBg: 'bg-white border border-sky-100 text-sky-600',
      arrowBg: 'bg-sky-600',
      roles: ['Admin', 'User'],
    },
    {
      name: 'Sales Revenue',
      href: '/reports/sales',
      icon: <TrendingUp className="h-6 w-6 text-white" />,
      bgColor: 'bg-yellow-500',
      bgLight: 'bg-yellow-50',
      ghostIcon: <TrendingUp className="h-20 w-20 text-yellow-200" />,
      description: 'View sales reports, revenue and business insights.',
      badge: 'Business Growth',
      badgeIcon: <TrendingUp className="h-3.5 w-3.5 text-yellow-500" />,
      badgeBg: 'bg-white border border-yellow-100 text-yellow-600',
      arrowBg: 'bg-yellow-500',
      roles: ['Admin'],
    },
    {
      name: 'Ingredients Usage Report',
      href: '/reports/ingredients',
      icon: <PieChart className="h-6 w-6 text-white" />,
      bgColor: 'bg-fuchsia-600',
      bgLight: 'bg-fuchsia-50',
      ghostIcon: <PieChart className="h-20 w-20 text-fuchsia-200" />,
      description: 'View detailed ingredient usage and consumption reports.',
      badge: 'Usage Reports',
      badgeIcon: <PieChart className="h-3.5 w-3.5 text-fuchsia-500" />,
      badgeBg: 'bg-white border border-fuchsia-100 text-fuchsia-600',
      arrowBg: 'bg-fuchsia-600',
      roles: ['Admin', 'User'],
    },
  ];

  const allowedScreens = screens.filter(s => s.roles.includes(user?.role || ''));

  return (
    <AppLayout showBackButton={false}>
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 pb-6 w-full">
        <div
          className="relative overflow-hidden rounded-3xl shadow-sm"
          style={{
            background: 'linear-gradient(135deg, #e8eaf6 0%, #ede9fe 40%, #e0e7ff 70%, #ddd6fe 100%)',
            minHeight: '260px',
          }}
        >
          {/* Soft blob decorations */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-16 -left-16 w-72 h-72 rounded-full opacity-40"
              style={{ background: 'radial-gradient(circle, #c7d2fe 0%, transparent 70%)' }} />
            <div className="absolute bottom-0 left-1/4 w-56 h-56 rounded-full opacity-25"
              style={{ background: 'radial-gradient(circle, #a5b4fc 0%, transparent 70%)' }} />
            <div className="absolute -top-8 right-1/4 w-48 h-48 rounded-full opacity-20"
              style={{ background: 'radial-gradient(circle, #818cf8 0%, transparent 70%)' }} />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 px-6 sm:px-10 py-8 h-full">

            {/* LEFT — text block */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <p className="text-[11px] font-extrabold tracking-[0.25em] uppercase text-indigo-500 mb-3">
                FOR RESTAURANTS · BAKERIES · CAFES
              </p>
              <h1 className="font-extrabold text-slate-900 leading-[1.1] mb-4" style={{ fontSize: 'clamp(2rem, 3.5vw, 2.8rem)' }}>
                Food Business<br />
                <span className="text-indigo-600">Management System</span>
              </h1>
              <div className="flex items-start gap-3">
                <div className="w-[3px] self-stretch bg-indigo-600 rounded-full flex-shrink-0" style={{ minHeight: '40px' }} />
                <p className="text-sm text-slate-500 leading-relaxed">
                  Built for restaurants, bakeries &amp; cafes &mdash; manage<br className="hidden sm:inline" />all operations with our all-in-one solution.
                </p>
              </div>
            </div>

            {/* CENTER — food image with circular glow */}
            <div className="relative hidden md:flex items-center justify-center shrink-0 mx-2 lg:mx-6" style={{ width: '300px', height: '240px' }}>
              {/* Big circular glow */}
              <div
                className="absolute"
                style={{
                  width: '280px',
                  height: '280px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(199,210,254,0.9) 0%, rgba(199,210,254,0.4) 50%, transparent 75%)',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                }}
              />
              <Image
                src="/hero-food.png"
                alt="Restaurant food"
                width={300}
                height={220}
                priority
                className="object-contain relative z-10 drop-shadow-2xl"
                style={{ maxHeight: '230px', width: 'auto' }}
              />
            </div>

            {/* RIGHT — cursive script text */}
            <div className="shrink-0 pl-2 lg:pl-4 hidden lg:flex flex-col items-start justify-center" style={{ fontFamily: 'var(--font-caveat), cursive' }}>
              <p className="text-slate-500 leading-tight" style={{ fontSize: '2rem', lineHeight: '1.3' }}>
                Good<br />
                Food<br />
                <span className="text-slate-600">Better</span><br />
                <span className="text-slate-700">Business</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Module Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-8 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {allowedScreens.map((screen) => {
            const isMobileVisible =
              screen.href === '/reports/sales' || screen.href === '/reports/ingredients';

            return (
              <Link
                key={screen.href}
                href={screen.href}
                className={`group relative overflow-hidden rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-100/60 hover:-translate-y-1 transition-all duration-300 p-6 flex-col justify-between ${
                  isMobileVisible ? 'flex' : 'hidden md:flex'
                }`}
              >
                {/* Ghost icon background */}
                <div className="absolute top-2 right-3 opacity-100 transition-opacity duration-300">
                  {screen.ghostIcon}
                </div>

                <div className="relative z-10">
                  {/* Icon */}
                  <div className={`w-12 h-12 ${screen.bgColor} rounded-xl flex items-center justify-center shadow-lg mb-5`}>
                    {screen.icon}
                  </div>

                  {/* Name & Description */}
                  <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-1.5">{screen.name}</h2>
                  <p className="text-xs text-slate-500 leading-relaxed mb-5">{screen.description}</p>

                  {/* Badge + Arrow row */}
                  <div className="flex items-center justify-between">
                    <div className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg ${screen.badgeBg}`}>
                      {screen.badgeIcon}
                      <span>{screen.badge}</span>
                    </div>
                    <div className={`w-9 h-9 ${screen.arrowBg} rounded-full flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}>
                      <ArrowRight className="h-4 w-4 text-white" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
