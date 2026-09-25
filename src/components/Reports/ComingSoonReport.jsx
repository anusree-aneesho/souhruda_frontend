// src/components/Reports/ComingSoonReport.jsx
import { ArrowLeft } from "lucide-react";

export default function ComingSoonReport({ title, description, icon: Icon, onBack }) {
  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 w-fit"
      >
        <ArrowLeft size={16} />
        Back
      </button>

      <div className="bg-white rounded-xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)] px-6 py-16 flex flex-col items-center text-center">
        {Icon && (
          <span className="inline-flex h-12 w-12 rounded-full items-center justify-center bg-gray-50 text-gray-400 mb-4">
            <Icon size={22} />
          </span>
        )}
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500 mt-1 max-w-sm">
          {description || "This report isn't wired to live data yet."}
        </p>
        <p className="text-xs text-gray-400 mt-4">
          The menu entry is ready — this will show real numbers once a backend endpoint is built for it.
        </p>
      </div>
    </div>
  );
}