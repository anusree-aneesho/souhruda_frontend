// src/components/HomeCollection/HomeCollectionHeader.jsx
import { useState } from "react";
import { Plus } from "lucide-react";
import { useOrderModal } from "../../Context/OrderModalContext";
import OptimizeRouteModal from "./OptimizeRouteModal";

export default function HomeCollectionHeader() {
  const { open } = useOrderModal();
  const [isRouteModalOpen, setRouteModalOpen] = useState(false);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Home Collection</h1>
        <p className="text-sm text-gray-500 mt-1">
          Patient pickups — assign a technician, track distance, verify with OTP, and hand off results.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => setRouteModalOpen(true)}
          className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <span className="text-base">🤖</span>
          Optimize Today's Route
        </button>
        <button
          onClick={() => open("homeCollection")}
          className="flex items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-700 transition-colors cursor-pointer"
        >
          <Plus size={16} />
          Book Home Collection
        </button>
      </div>

      {isRouteModalOpen && <OptimizeRouteModal onClose={() => setRouteModalOpen(false)} />}
    </div>
  );
}