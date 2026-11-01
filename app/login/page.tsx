"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/context/AuthContext";
import { login } from "@/lib/db";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Loader2,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  Globe,
  ChevronDown,
  Utensils,
  Cake,
  Coffee,
  BarChart3,
} from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(1, "Please enter your email or username"),
  password: z.string().min(1, "Please enter your password"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { loginUser } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      const user = await login(data);
      loginUser(user);
      router.push("/");
    } catch (err: any) {
      console.error("Login error:", err);
      setError(
        err.message || "Authentication failed. Please check your credentials."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white flex overflow-hidden">
      {/* Full Page Split Grid */}
      <div className="w-full min-h-screen grid grid-cols-1 lg:grid-cols-12 relative">
        
        {/* ── LEFT COLUMN: Brand & Features Showcase (Full Bleed) ── */}
        <div className="lg:col-span-7 relative flex flex-col justify-between p-8 sm:p-12 lg:p-16 xl:p-20 overflow-hidden bg-slate-900 min-h-[520px] lg:min-h-screen">
          {/* Background Restaurant Image */}
          <div
            className="absolute inset-0 bg-cover bg-center pointer-events-none transform scale-105 transition-transform duration-1000"
            style={{ backgroundImage: "url('/bg-login.png')" }}
          />

          {/* Deep dark gradient overlay for crisp readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/50 to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-transparent to-slate-950/40 pointer-events-none" />

          {/* Content container */}
          <div className="relative z-10 flex flex-col justify-between h-full w-full max-w-2xl">
            {/* Header: Logo */}
            <div>
              <Image
                src="/logo-white.webp"
                alt="NextServe Food Business Management Platform"
                width={217}
                height={72}
                className="h-12 lg:h-24 w-auto object-contain"
                priority
              />
            </div>

            {/* Middle Section: Hero Headline & Feature Cards */}
            <div className="my-auto py-10 lg:py-14">
              <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-bold text-white tracking-tight leading-[1.12] mb-5">
                One Platform.
                <br />
                Every <span className="text-[#7c65ff]">Food Business.</span>
              </h1>
              <p className="text-slate-300 text-sm sm:text-base font-normal max-w-lg leading-relaxed mb-12">
                Manage your restaurant, bakery, café and more with a simple,
                powerful system.
              </p>

              {/* 4 Feature Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 lg:gap-6">
                {/* 1. Restaurants */}
                <div className="flex flex-col">
                  <div className="w-11 h-11 rounded-xl bg-[#523de6]/85 backdrop-blur-md flex items-center justify-center text-white mb-3 shadow-md shadow-indigo-950/40">
                    <Utensils className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-sm font-bold text-white mb-0.5">
                    Restaurants
                  </h3>
                  <p className="text-[11px] text-slate-300/90 leading-snug">
                    Tables, orders, kitchen, billing.
                  </p>
                </div>

                {/* 2. Bakeries */}
                <div className="flex flex-col">
                  <div className="w-11 h-11 rounded-xl bg-[#523de6]/85 backdrop-blur-md flex items-center justify-center text-white mb-3 shadow-md shadow-indigo-950/40">
                    <Cake className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-sm font-bold text-white mb-0.5">
                    Bakeries
                  </h3>
                  <p className="text-[11px] text-slate-300/90 leading-snug">
                    Production, batches, stock, preorders.
                  </p>
                </div>

                {/* 3. Cafés */}
                <div className="flex flex-col">
                  <div className="w-11 h-11 rounded-xl bg-[#523de6]/85 backdrop-blur-md flex items-center justify-center text-white mb-3 shadow-md shadow-indigo-950/40">
                    <Coffee className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-sm font-bold text-white mb-0.5">Cafés</h3>
                  <p className="text-[11px] text-slate-300/90 leading-snug">
                    Counter sales, menu, inventory.
                  </p>
                </div>

                {/* 4. Business Insights */}
                <div className="flex flex-col">
                  <div className="w-11 h-11 rounded-xl bg-[#523de6]/85 backdrop-blur-md flex items-center justify-center text-white mb-3 shadow-md shadow-indigo-950/40">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-sm font-bold text-white mb-0.5">
                    Business Insights
                  </h3>
                  <p className="text-[11px] text-slate-300/90 leading-snug">
                    Sales, reports, and growth.
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Footer */}
            <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-300 font-medium pt-4">
              <span className="w-6 h-1 bg-[#6d54f5] rounded-full inline-block" />
              <span>Trusted by growing food businesses</span>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN: Sign In Form (Full Bleed) ── */}
        <div className="lg:col-span-5 relative flex flex-col justify-between p-6 sm:p-10 lg:p-14 xl:p-16 bg-white overflow-hidden min-h-[540px] lg:min-h-screen">
          {/* Subtle bottom-right decorative shapes (wave / cloud blur) */}
          <div className="absolute -bottom-16 -right-16 w-80 h-80 bg-indigo-100/60 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-4 -right-4 w-52 h-52 bg-purple-200/50 rounded-full blur-2xl pointer-events-none" />

          {/* Centered Form Section */}
          <div className="w-full max-w-97.5 mx-auto my-auto relative z-10 py-4">
            {/* Logo */}
            <div className="text-center mb-6">
              <Image
                src="/logo.png"
                alt="NextServe Food Business Management Platform"
                width={220}
                height={64}
                className="h-20 w-auto mx-auto object-contain"
                priority
              />
            </div>

            {/* Welcome Back Heading */}
            <div className="text-center mb-7">
              <h2 className="text-2xl sm:text-[1.85rem] font-bold text-slate-900 tracking-tight">
                Welcome Back
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-normal mt-1.5">
                Sign in to your account to continue
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-semibold animate-in fade-in">
                  {error}
                </div>
              )}

              {/* Email Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    {...register("username")}
                    type="text"
                    placeholder="you@company.com"
                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#5846f6] focus:ring-4 focus:ring-[#5846f6]/10 transition-all"
                  />
                </div>
                {errors.username && (
                  <p className="mt-1 text-xs font-medium text-red-500">
                    {errors.username.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    {...register("password")}
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#5846f6] focus:ring-4 focus:ring-[#5846f6]/10 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs font-medium text-red-500">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Keep me signed in & Forgot Password */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600">
                  <input
                    type="checkbox"
                    checked={keepSignedIn}
                    onChange={(e) => setKeepSignedIn(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-[#5846f6] focus:ring-[#5846f6]/20 cursor-pointer accent-[#5846f6]"
                  />
                  <span>Keep me signed in</span>
                </label>
                <Link
                  href="#"
                  className="font-semibold text-[#5846f6] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 bg-[#5846f6] hover:bg-[#4a39e6] active:scale-[0.99] text-white font-semibold py-3.5 px-4 rounded-xl shadow-lg shadow-[#5846f6]/25 flex items-center justify-center gap-2 text-sm transition-all cursor-pointer disabled:opacity-60"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
 
            {/* Bottom Contact Link */}
            <p className="text-center text-xs sm:text-sm text-slate-500 font-medium mt-6">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="text-[#5846f6] font-semibold hover:underline"
              >
                Contact us
              </Link>
            </p>
          </div>

          {/* Bottom space filler for balance */}
          <div className="h-4 hidden lg:block" />
        </div>
      </div>
    </div>
  );
}
