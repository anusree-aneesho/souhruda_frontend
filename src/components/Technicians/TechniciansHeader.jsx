// src/components/Technicians/TechniciansHeader.jsx
import { Plus, UserPlus } from "lucide-react";

export default function TechniciansHeader({ onAddTechnician, onCreateTechnician }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Technicians</h1>
        <p className="text-sm text-gray-500 mt-1">
          Field technicians available for home collection jobs.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
        <button
          onClick={onCreateTechnician}
          className="flex items-center justify-center gap-2 rounded-lg border border-teal-600 px-4 py-2.5 text-sm font-medium text-teal-600 hover:bg-teal-50 transition-colors w-full sm:w-auto cursor-pointer"
        >
          <UserPlus size={16} />
          Add Technician
        </button>
        <button
          onClick={onAddTechnician}
          className="flex items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-700 transition-colors w-full sm:w-auto cursor-pointer"
        >
          <Plus size={16} />
          Assign Technician
        </button>
      </div>
    </div>
  );
}