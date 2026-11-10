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
  ArrowLeft,
} from "lucide-react";

interface AppLayoutProps {
  children: React.ReactNode;
  /** Optional extra className on the inner content wrapper */
  className?: string;
  /** Optional custom back link URL (defaults to "/") */
  backHref?: string;
  /** Optional custom back button label (defaults to "Back to Menu") */
  backLabel?: string;
  /** Optional flag to show/hide the back button (defaults to false on "/" and true on other routes) */
  showBackButton?: boolean;
}

const ROUTE_LABELS: Record<string, string> = {
  "/cashier": "Cashier & Billing",
  "/dining": "Dining Tables",
  "/items": "Menu Items",
  "/ingredients": "Stock & Ingredients",
  "/estimations": "Dish Cost Estimations",
  "/reports/sales": "Sales & Revenue Report",
  "/reports/ingredients": "Ingredients Usage Report",
};

export default function AppLayout({
  children,
  className,
  backHref = "/",
  backLabel = "Back to Menu",
  showBackButton,
}: AppLayoutProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const isHome = pathname === "/";
  const shouldShowBack = showBackButton ?? !isHome;

  // Build a readable page title from the pathname
  const pageLabel = (() => {
    if (!pathname || pathname === "/") return "Dashboard";
    if (ROUTE_LABELS[pathname]) return ROUTE_LABELS[pathname];
    const seg = pathname.split("/").filter(Boolean);
    return seg
      .map((s) => s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()))
      .join(" › ");
  })();

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background:
          "linear-gradient(135deg, #eef0fb 0%, #f3f4fd 50%, #eef0fb 100%)",
      }}
    >
      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <nav className="w-full bg-white shadow-sm border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
          {/* Left: Back to Menu button + Separator + Logo + breadcrumb */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            {/* Back button to the menu */}
            {shouldShowBack && (
              <>
                <Link
                  href={backHref}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-700 hover:text-indigo-600 font-semibold text-xs transition-all cursor-pointer active:scale-95 flex-shrink-0 group shadow-xs"
                  title={backLabel}
                >
                  <ArrowLeft className="h-4 w-4 text-slate-500 group-hover:text-indigo-600 transition-transform group-hover:-translate-x-0.5" />
                  <span className="font-bold hidden sm:inline">{backLabel}</span>
                  <span className="font-bold sm:hidden">Menu</span>
                </Link>

                <span className="text-slate-200 font-light text-xl">|</span>
              </>
            )}

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 group">
              <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 shadow-md group-hover:scale-105 transition-transform duration-200">
                <Image
                  src="/logo-letter.webp"
                  alt="NextServe Logo"
                  width={36}
                  height={36}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className={`${shouldShowBack ? "hidden sm:flex" : "flex"} flex-col justify-center`}>
                <div className="text-[18px] font-black tracking-tight leading-tight">
                  <span className="text-slate-900">Next</span>
                  <span className="text-indigo-600">Serve</span>
                </div>
                <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-slate-400 leading-none mt-0.5 hidden sm:block">
                  Food Business Management Platform
                </p>
              </div>
            </Link>

            {/* Separator + page label */}
            {!isHome && (
              <div className="flex items-center gap-2 min-w-0 hidden md:flex">
                <span className="text-slate-200 font-light text-xl">|</span>
                <div className="flex items-center gap-1.5 min-w-0">
                  <Link
                    href="/"
                    className="text-slate-400 hover:text-indigo-600 transition-colors"
                    title="Dashboard"
                  >
                    <Home className="h-3.5 w-3.5" />
                  </Link>
                  <span className="text-slate-300 text-xs">›</span>
                  <span className="text-xs font-bold text-slate-600 truncate">
                    {pageLabel}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Right: user + logout */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-100 rounded-2xl px-3.5 py-2">
              <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                <UserIcon className="h-3.5 w-3.5 text-indigo-600" />
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-bold text-slate-800 leading-none">
                  {user?.fullName || user?.username}
                </p>
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
      <main className={`flex-1 flex flex-col ${className ?? ""}`}>
        {children}
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 bg-white mt-auto">
        <div className="max-w-[1400px] mx-auto px-5 py-3.5 flex items-center justify-between gap-4">
          <p className="text-[11px] text-slate-400 font-medium">
            © 2026 TrivexTech Pvt Ltd. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <p className="text-[11px] text-slate-400 font-medium">
              NextServe &nbsp;v1.0.0
            </p>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[11px] text-emerald-600 font-semibold">
                System Online
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
