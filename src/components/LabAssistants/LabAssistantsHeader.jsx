// src/components/LabAssistants/LabAssistantsHeader.jsx
import { Plus } from "lucide-react";

export default function LabAssistantsHeader({ onAddLabAssistant }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Lab Assistant</h1>
        <p className="text-sm text-gray-500 mt-1">
          Lab assistants supporting sample processing across all branches.
        </p>
      </div>
      <button
        onClick={onAddLabAssistant}
        className="flex items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-700 transition-colors w-full sm:w-auto cursor-pointer"
      >
        <Plus size={16} />
        Add Lab Assistant
      </button>
    </div>
  );
}
