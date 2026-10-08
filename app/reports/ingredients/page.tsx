"use client";

import IngredientsReport from "@/components/reports/IngredientsReport";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function StandaloneIngredientsReportPage() {
    return (
        <div className="min-h-screen bg-[#F8FAFC] p-6 md:p-10">
            <div className="max-w-7xl mx-auto space-y-8">
                <div>
                    <Link href="/" className="inline-flex items-center text-slate-400 hover:text-primary transition-colors text-sm font-bold gap-1 mb-2">
                        <ArrowLeft className="h-4 w-4" />
                        DASHBOARD
                    </Link>
                </div>

                <IngredientsReport initialTimeRange="daily" showTitle={true} />
            </div>
        </div>
    );
}
