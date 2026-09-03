// src/components/HomeCollection/DetailModal/AssignTechnicianModal.jsx
import ModalShell from "../../common/Modal/ModalShell";
import { technicians } from "../../../data/technicians";

export default function AssignTechnicianModal({ onClose, onAssign }) {
  return (
    <ModalShell title="Assign Technician" onClose={onClose} maxWidth="max-w-lg">
      <div className="px-6 py-4">
        <p className="text-sm text-gray-500 mb-4">
          Ranked by an AI match score combining distance to the patient, current workload, and rating.
        </p>
        <div className="space-y-3">
          {technicians.map((tech) => (
            <div key={tech.name} className="flex items-center justify-between border border-gray-100 rounded-lg px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center text-lg">🧑</span>
                <div>
                  <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                    {tech.name}
                    {tech.aiRecommended && (
                      <span className="text-[10px] font-medium text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-full">
                        🤖 AI Recommended
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-400">
                    {tech.location} · ★{tech.rating} · {tech.distanceKm} km · ~{tech.etaMin} min ETA · {tech.activeJobs} active job(s)
                  </p>
                </div>
              </div>
              <button onClick={() => onAssign(tech)} className="px-4 py-1.5 rounded-lg bg-teal-600 text-sm font-medium text-white hover:bg-teal-700 shrink-0">
                Assign
              </button>
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-end px-6 py-4 border-t border-gray-100">
        <button onClick={onClose} className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">
          Cancel
        </button>
      </div>
    </ModalShell>
  );
}