"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { register as registerApi } from "@/lib/db";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Loader2, Lock, User as UserIcon, UserPlus, Info } from "lucide-react";

const registerSchema = z.object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    password: z.string().min(4, "Password must be at least 4 characters"),
    fullName: z.string().optional(),
    role: z.enum(["Admin", "User"]),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            role: "User"
        }
    });

    const onSubmit = async (data: RegisterFormValues) => {
        setIsLoading(true);
        setError(null);
        try {
            await registerApi(data);
            router.push("/login");
        } catch (err: any) {
            setError(err.response?.data || "Registration failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-50/50 via-white to-white">
            <div className="max-w-md w-full">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-[2.5rem] mb-6 animate-in zoom-in duration-500">
                        <UserPlus className="h-10 w-10 text-primary" />
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight italic">
                        REGISTER <span className="text-primary not-italic">ACCOUNT</span>
                    </h1>
                    <p className="text-slate-500 font-medium mt-2">Initialize your member profile</p>
                </div>

                <div className="glass-card p-8 rounded-[3rem] border border-white shadow-2xl shadow-indigo-100/50">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {error && (
                            <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-bold border border-red-100">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Full Name</label>
                            <div className="relative">
                                <Info className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                                <input
                                    {...register("fullName")}
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold text-slate-800 placeholder:text-slate-300"
                                    placeholder="John Doe"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Unique Identifier</label>
                            <div className="relative">
                                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                                <input
                                    {...register("username")}
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold text-slate-800 placeholder:text-slate-300"
                                    placeholder="Username"
                                />
                            </div>
                            {errors.username && <p className="mt-1 text-xs font-bold text-red-500 px-1">{errors.username.message}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Access Key</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                                <input
                                    {...register("password")}
                                    type="password"
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold text-slate-800 placeholder:text-slate-300"
                                    placeholder="••••••••"
                                />
                            </div>
                            {errors.password && <p className="mt-1 text-xs font-bold text-red-500 px-1">{errors.password.message}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Clearance Level</label>
                            <select
                                {...register("role")}
                                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold text-slate-800 appearance-none cursor-pointer"
                            >
                                <option value="User">Standard User</option>
                                <option value="Admin">Administrator</option>
                            </select>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-primary text-white font-black rounded-2xl py-5 hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 flex items-center justify-center uppercase text-xs tracking-[0.2em] active:scale-[0.98] disabled:opacity-50"
                        >
                            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Establish Profile"}
                        </button>
                    </form>

                    <p className="text-center mt-8 text-slate-500 font-bold text-sm">
                        Existing profile? {" "}
                        <Link href="/login" className="text-primary hover:underline underline-offset-4">
                            Access Terminal
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
