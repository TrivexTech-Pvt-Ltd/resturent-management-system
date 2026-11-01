"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  User as UserIcon,
  LogOut,
  ChevronDown,
  Home,
} from "lucide-react";

interface AppLayoutProps {
  children: React.ReactNode;
  /** Optional extra className on the inner content wrapper */
  className?: string;
}

export default function AppLayout({ children, className }: AppLayoutProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  // Build a readable page title from the pathname
  const pageLabel = (() => {
    const seg = pathname?.split("/").filter(Boolean);
    if (!seg || seg.length === 0) return "Dashboard";
    return seg
      .map((s) => s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()))
      .join(" › ");
  })();

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(135deg, #eef0fb 0%, #f3f4fd 50%, #eef0fb 100%)" }}>
      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <nav className="w-full bg-white shadow-sm border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-[1400px] mx-auto px-5 py-2.5 flex items-center justify-between gap-4">
          {/* Left: Logo + breadcrumb */}
          <div className="flex items-center gap-4 min-w-0">
            <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 group">
              <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 shadow-md group-hover:scale-105 transition-transform duration-200">
                <Image
                  src="/logo-letter.webp"
                  alt="NextServe Logo"
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="hidden sm:flex flex-col justify-center">
                <div className="text-[18px] font-black tracking-tight leading-tight">
                  <span className="text-slate-900">Next</span>
                  <span className="text-indigo-600">Serve</span>
                </div>
                <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-slate-400 leading-none mt-0.5">
                  Food Business Management Platform
                </p>
              </div>
            </Link>

            {/* Separator + page label */}
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-slate-200 font-light text-xl hidden md:block">|</span>
              <div className="flex items-center gap-1.5 min-w-0 hidden md:flex">
                <Link href="/" className="text-slate-400 hover:text-indigo-600 transition-colors">
                  <Home className="h-3.5 w-3.5" />
                </Link>
                <span className="text-slate-300 text-xs">›</span>
                <span className="text-xs font-bold text-slate-600 truncate">{pageLabel}</span>
              </div>
            </div>
          </div>

          {/* Right: user + logout */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-100 rounded-2xl px-3.5 py-2">
              <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                <UserIcon className="h-3.5 w-3.5 text-indigo-600" />
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-bold text-slate-800 leading-none">{user?.fullName || user?.username}</p>
                <p className="text-[9px] text-slate-400 leading-none mt-0.5 uppercase tracking-wider">
                  {user?.role === "Admin" ? "System Admin" : "Staff"}
                </p>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400 hidden sm:block" />
            </div>

            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 text-slate-500 hover:text-red-500 font-semibold rounded-xl transition-all cursor-pointer active:scale-95 text-xs"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Log Out</span>
            </button>
          </div>
        </div>
      </nav>

      {/* ── Page Content ────────────────────────────────────────────────────── */}
      <main className={`flex-1 ${className ?? ""}`}>
        {children}
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 bg-white mt-auto">
        <div className="max-w-[1400px] mx-auto px-5 py-3.5 flex items-center justify-between gap-4">
          <p className="text-[11px] text-slate-400 font-medium">
            © 2026 TrivexTech Pvt Ltd. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <p className="text-[11px] text-slate-400 font-medium">NextServe &nbsp;v1.0.0</p>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[11px] text-emerald-600 font-semibold">System Online</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
