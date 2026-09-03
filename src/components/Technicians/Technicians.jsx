// src/components/Technicians/Technicians.jsx
import { useState, useMemo } from "react";
import TechniciansHeader from "./TechniciansHeader";
import TechniciansSearch from "./TechniciansSearch";
import TechniciansTable from "./TechniciansTable/TechniciansTable";
import TechnicianCard from "./TechniciansTable/TechnicianCard";
import AddTechnicianModal from "./modals/AddTechnicianModal";
import { technicianDirectory as initialTechnicians } from "../../data/technicianDirectory";

function generateTechId(existing) {
  const maxNo = existing.reduce((max, t) => {
    const num = parseInt(String(t.techId).replace(/\D/g, ""), 10) || 0;
    return Math.max(max, num);
  }, 0);
  return `TECH-${String(maxNo + 1).padStart(3, "0")}`;
}

export default function Technicians() {
  const [technicians, setTechnicians] = useState(initialTechnicians);
  const [search, setSearch] = useState("");
  const [modalState, setModalState] = useState(null); // null | { editingTechnician: null | technician }

  const filteredTechnicians = useMemo(() => {
    return technicians.filter(
      (t) =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.techId.toLowerCase().includes(search.toLowerCase()) ||
        t.phone.includes(search) ||
        t.zone.toLowerCase().includes(search.toLowerCase())
    );
  }, [technicians, search]);

  function handleSaveTechnician(formData) {
    if (formData.techId) {
      // Editing existing technician
      setTechnicians((prev) =>
        prev.map((t) => (t.techId === formData.techId ? { ...formData } : t))
      );
    } else {
      // Adding new technician
      const newTechnician = { ...formData, techId: generateTechId(technicians) };
      setTechnicians((prev) => [...prev, newTechnician]);
    }
    setModalState(null);
  }

  function handleRemoveTechnician(tech) {
    if (!window.confirm(`Remove "${tech.name}"? This can't be undone.`)) return;
    setTechnicians((prev) => prev.filter((t) => t.techId !== tech.techId));
  }

  return (
    <div className="space-y-6">
      <TechniciansHeader onAddTechnician={() => setModalState({ editingTechnician: null })} />

      <div className="bg-white rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-5">
        <TechniciansSearch value={search} onChange={setSearch} />

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
      </div>

      {modalState && (
        <AddTechnicianModal
          editingTechnician={modalState.editingTechnician}
          onClose={() => setModalState(null)}
          onSave={handleSaveTechnician}
        />
      )}
    </div>
  );
}
