// src/components/HomeCollection/DetailModal/AssignTechnicianModal.jsx
import { useEffect, useState } from "react";
import ModalShell from "../../common/Modal/ModalShell";
import { getNearbyTechniciansApi, assignTechnicianApi } from "../../../api/api";

export default function AssignTechnicianModal({ hcCode, onClose, onAssign }) {
  const [technicians, setTechnicians] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [assigningId, setAssigningId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getNearbyTechniciansApi(hcCode);
        if (!cancelled) setTechnicians(data);
      } catch (err) {
        if (!cancelled) setError(err.message || "Couldn't load technicians.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hcCode]);

  async function handleAssign(tech) {
    setAssigningId(tech.id);
    setError("");
    try {
      const updated = await assignTechnicianApi(hcCode, tech.id);
      onAssign(updated);
    } catch (err) {
      setError(err.message || "Couldn't assign this technician.");
      setAssigningId(null);
    }
  }

  return (
    <ModalShell title="Assign Technician" onClose={onClose} maxWidth="max-w-lg">
      <div className="px-6 py-4">
        <p className="text-sm text-gray-500 mb-4">
          Ranked by distance to the patient, current workload, and rating.
        </p>

        {isLoading && <p className="text-sm text-gray-400">Finding nearby technicians…</p>}
        {!isLoading && error && <p className="text-sm text-red-600">{error}</p>}
        {!isLoading && !error && technicians.length === 0 && (
          <p className="text-sm text-gray-400">No active technicians with a saved base location yet.</p>
        )}

        <div className="space-y-3">
          {technicians.map((tech) => (
            <div key={tech.id} className="flex items-center justify-between border border-gray-100 rounded-lg px-4 py-3">
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
                    {tech.location} · ★{tech.rating}
                    {tech.distanceKm != null && ` · ${tech.distanceKm} km`}
                    {tech.etaMin != null && ` · ~${tech.etaMin} min ETA`}
                    {" "}· {tech.activeJobs} active job(s)
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleAssign(tech)}
                disabled={assigningId !== null}
                className="px-4 py-1.5 rounded-lg bg-teal-600 text-sm font-medium text-white hover:bg-teal-700 shrink-0 disabled:opacity-60"
              >
                {assigningId === tech.id ? "Assigning…" : "Assign"}
              </button>
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-end px-6 py-4 border-t border-gray-100">
        <button onClick={onClose} className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer">
          Cancel
        </button>
      </div>
    </ModalShell>
  );
}