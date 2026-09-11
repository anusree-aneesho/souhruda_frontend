// src/components/Technicians/Technicians.jsx
import { useState, useEffect, useMemo, useCallback } from "react";
import TechniciansHeader from "./TechniciansHeader";
import TechniciansSearch from "./TechniciansSearch";
import TechniciansTable from "./TechniciansTable/TechniciansTable";
import TechnicianCard from "./TechniciansTable/TechnicianCard";
import CreateTechnicianModal from "./modals/CreateTechnicianModal";
import {
  getTechniciansApi,
  createTechnicianApi,
  updateTechnicianApi,
  deleteTechnicianApi,
} from "../../api/api";

function mapTechnicianFromApi(t) {
  return {
    id: t.id,
    techId: `TECH-${String(t.id).padStart(3, "0")}`,
    name: t.name,
    email: t.email,
    phone: t.phone,
    zone: t.zone,
    branch_id: t.branch_id,
    latitude: t.latitude,
    longitude: t.longitude,
    rating: t.rating,
    status: t.status,
    assignedJobs: t.assignedJobs ?? 0,
    currentStatus: t.currentStatus,
  };
}

export default function Technicians() {
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalState, setModalState] = useState(null); // null | { editingTechnician: null | technician }
  const [showCreateModal, setShowCreateModal] = useState(false);

  const loadTechnicians = useCallback(() => {
    return getTechniciansApi()
      .then((data) => setTechnicians(data.map(mapTechnicianFromApi)))
      .catch((err) => console.error("Failed to load technicians", err));
  }, []);

  useEffect(() => {
    loadTechnicians().finally(() => setLoading(false));
  }, [loadTechnicians]);

  const filteredTechnicians = useMemo(() => {
    return technicians.filter(
      (t) =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.techId.toLowerCase().includes(search.toLowerCase()) ||
        t.phone.includes(search) ||
        (t.zone ?? "").toLowerCase().includes(search.toLowerCase())
    );
  }, [technicians, search]);

  async function handleSaveTechnician(formData) {
    const isEdit = Boolean(formData.id);
    const payload = {
  name: formData.name,
  email: formData.email,
  phone: formData.phone,
  branch_id: formData.branch_id,
  status: formData.status,
  latitude: formData.latitude,
  longitude: formData.longitude,
};

    // Rating is only editable (and only sent) on update — new technicians
    // default to 5.0 server-side, and StoreTechnicianRequest doesn't accept it.
    if (isEdit) {
      payload.rating = formData.rating;
    }

    try {
      if (isEdit) {
        await updateTechnicianApi(formData.id, payload);
      } else {
        await createTechnicianApi(payload);
      }

      // Refetch rather than patch local state — guarantees the same order
      // (newest first) and computed fields (assignedJobs, currentStatus)
      // a real page reload would show, instead of drifting out of sync.
      await loadTechnicians();
    } catch (err) {
      console.error("Failed to save technician", err);
      alert(err.message || "Failed to save technician. Please check the form and try again.");
      return;
    }

    setModalState(null);
    setShowCreateModal(false);
  }

  async function handleRemoveTechnician(tech) {
    if (!window.confirm(`Remove "${tech.name}"? This can't be undone.`)) return;

    try {
      await deleteTechnicianApi(tech.id);
      setTechnicians((prev) => prev.filter((t) => t.id !== tech.id));
    } catch (err) {
      console.error("Failed to remove technician", err);
      alert(err.message || "Something went wrong removing the technician.");
    }
  }

  return (
    <div className="space-y-6">
      <TechniciansHeader
        onAddTechnician={() => setModalState({ editingTechnician: null })}
        onCreateTechnician={() => setShowCreateModal(true)}
      />

      <div className="bg-white rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-5">
        <TechniciansSearch value={search} onChange={setSearch} />

        {loading ? (
          <p className="text-sm text-gray-400 text-center py-6">Loading technicians...</p>
        ) : (
          <>  
            <div className="hidden md:block">
              <TechniciansTable
                technicians={filteredTechnicians}
                onEdit={(t) => setModalState({ editingTechnician: t })}
                onRemove={handleRemoveTechnician}
              />
            </div>
            <div className="md:hidden space-y-3">
              {filteredTechnicians.map((t) => (
                <TechnicianCard
                  key={t.techId}
                  technician={t}
                  onEdit={(tech) => setModalState({ editingTechnician: tech })}
                  onRemove={handleRemoveTechnician}
                />
              ))}
            </div>

            {filteredTechnicians.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-6">No technicians found.</p>
            )}
          </>
        )}
      </div>

      {modalState && (
        <CreateTechnicianModal
          editingTechnician={modalState.editingTechnician}
          onClose={() => setModalState(null)}
          onSave={handleSaveTechnician}
        />
      )}

      {showCreateModal && (
        <CreateTechnicianModal
          onClose={() => setShowCreateModal(false)}
          onSave={handleSaveTechnician}
        />
      )}
    </div>
  );
}