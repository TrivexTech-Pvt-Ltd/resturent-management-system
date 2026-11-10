"use client";

import IngredientsReport from "@/components/reports/IngredientsReport";
import AppLayout from "@/components/AppLayout";

export default function StandaloneIngredientsReportPage() {
    return (
        <AppLayout>
            <div className="bg-transparent p-4 sm:p-6 md:p-10 w-full">
                <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 w-full">
                    <IngredientsReport initialTimeRange="daily" showTitle={true} />
                </div>
            </div>
        </AppLayout>
    );
}
