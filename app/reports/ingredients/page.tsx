"use client";

import IngredientsReport from "@/components/reports/IngredientsReport";
import AppLayout from "@/components/AppLayout";

export default function StandaloneIngredientsReportPage() {
    return (
        <AppLayout>
            <div className="bg-transparent p-6 md:p-10">
                <div className="max-w-7xl mx-auto space-y-8">
                    <IngredientsReport initialTimeRange="daily" showTitle={true} />
                </div>
            </div>
        </AppLayout>
    );
}
