// src/components/TestMaster/TestMasterHeader.jsx
import { Plus } from "lucide-react";
import { useAuth } from "../../Context/AuthContext";

export default function TestMasterHeader({ onAddCategory }) {
  const { user } = useAuth();
  const canManage = user?.role !== "front_office";

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Test Master</h1>
      </div>
      {canManage && (
        <button
          onClick={onAddCategory}
          className="flex items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-700 transition-colors w-full sm:w-auto cursor-pointer"
        >
          <Plus size={16} />
          Category
        </button>
      )}
    </div>
  );
}