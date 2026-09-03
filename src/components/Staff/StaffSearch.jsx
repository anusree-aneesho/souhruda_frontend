// src/components/Staff/StaffSearch.jsx
import { Search } from "lucide-react";

export default function StaffSearch({ value, onChange }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2.5 w-full sm:w-72">
      <Search size={16} className="text-gray-400 shrink-0" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search Front officer..."
        className="flex-1 text-sm outline-none placeholder:text-gray-400 min-w-0"
      />
    </div>
  );
}
