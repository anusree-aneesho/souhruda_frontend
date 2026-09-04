// src/components/Technicians/Technicians.jsx
import { useState, useEffect, useMemo } from "react";
import TechniciansHeader from "./TechniciansHeader";
import TechniciansSearch from "./TechniciansSearch";
import TechniciansTable from "./TechniciansTable/TechniciansTable";
import TechnicianCard from "./TechniciansTable/TechnicianCard";
import AddTechnicianModal from "./modals/AddTechnicianModal";
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
    rating: t.rating,
    status: t.status,
  };
}

export default function Technicians() {
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalState, setModalState] = useState(null); // null | { editingTechnician: null | technician }
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    getTechniciansApi()
      .then((data) => setTechnicians(data.map(mapTechnicianFromApi)))
      .catch((err) => console.error("Failed to load technicians", err))
      .finally(() => setLoading(false));
  }, []);

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
      zone: formData.zone || null,
      status: formData.status,
    };

    try {
      const saved = mapTechnicianFromApi(
        isEdit
          ? await updateTechnicianApi(formData.id, payload)
          : await createTechnicianApi(payload)
      );

      setTechnicians((prev) =>
        isEdit ? prev.map((t) => (t.id === saved.id ? saved : t)) : [...prev, saved]
      );
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
        <AddTechnicianModal
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