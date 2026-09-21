// src/components/Statistics/Statistics.jsx
import { BarChart3 } from "lucide-react";

export default function Statistics() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Statistics</h1>
        <p className="text-sm text-gray-500 mt-1">
          Lab performance and activity at a glance.
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-12 flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center mb-4">
          <BarChart3 size={22} className="text-teal-600" />
        </div>
        <h2 className="text-base font-semibold text-gray-900">
          Statistics coming soon
        </h2>
        <p className="text-sm text-gray-500 mt-1 max-w-sm">
          This page is wired up and ready — charts and reports will go here.
        </p>
      </div>
    </div>
  );
}