// src/components/LabOrders/LabOrdersFilters.jsx
import { Search } from "lucide-react";
const tabs = ["All", "Pending", "Completed"];
export default function LabOrdersFilters({ search, onSearchChange, activeTab, onTabChange }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2.5 w-full sm:w-72">
        <Search size={16} className="text-gray-400 shrink-0" />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search order, patient, ID..."
          className="flex-1 text-sm outline-none placeholder:text-gray-400 min-w-0"
        />
      </div>

      <div className="flex items-center gap-2 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === tab
                ? "bg-teal-600 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
    </div>
  );
}