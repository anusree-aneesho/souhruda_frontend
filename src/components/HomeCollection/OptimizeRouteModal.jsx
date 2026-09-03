// src/components/HomeCollection/OptimizeRouteModal.jsx
import ModalShell from "../common/Modal/ModalShell";
import { getOptimizedRoute } from "../../utils/optimizeRoute";

export default function OptimizeRouteModal({ onClose }) {
  const route = getOptimizedRoute();

  return (
    <ModalShell title="Optimized Pickup Route" onClose={onClose} maxWidth="max-w-lg">
      <div className="px-6 py-5">
        {route.length === 0 ? (
          <p className="text-sm text-teal-700">
            No assigned or en-route pickups to plan right now — assign a technician to a request first.
          </p>
        ) : (
          <div className="space-y-3">
            {route.map((hc, index) => (
              <div key={hc.id} className="flex items-center gap-3 border border-gray-100 rounded-lg px-4 py-3">
                <span className="h-7 w-7 shrink-0 rounded-full bg-teal-100 text-teal-700 text-xs font-bold flex items-center justify-center">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">{hc.patient.name}</p>
                  <p className="text-xs text-gray-400">
                    {hc.id} · {hc.distance} · {hc.technician?.name || "Unassigned"}
                  </p>
                </div>
                <span className="text-xs font-medium text-teal-600">{hc.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-end px-6 py-4 border-t border-gray-100">
        <button onClick={onClose} className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">
          Close
        </button>
      </div>
    </ModalShell>
  );
}