// src/components/Patients/PatientsSearch.jsx
import { useRef } from "react";
import { Search, X } from "lucide-react";

export default function PatientsSearch({ value, onChange }) {
  const inputRef = useRef(null);

  const handleClear = () => {
    onChange("");
    inputRef.current?.focus();
  };

  return (
    <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2.5 w-full sm:w-72">
      <Search size={16} className="text-gray-400 shrink-0" />
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape" && value) handleClear();
        }}
        placeholder="Search patients..."
        className="flex-1 text-sm outline-none placeholder:text-gray-400 min-w-0"
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search"
          className="shrink-0 rounded-full p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors cursor-pointer"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}