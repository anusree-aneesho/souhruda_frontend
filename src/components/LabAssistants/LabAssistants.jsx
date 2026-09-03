// src/components/LabAssistants/LabAssistants.jsx
import { useState, useMemo } from "react";
import LabAssistantsHeader from "./LabAssistantsHeader";
import LabAssistantsSearch from "./LabAssistantsSearch";
import LabAssistantsTable from "./LabAssistantsTable/LabAssistantsTable";
import LabAssistantCard from "./LabAssistantsTable/LabAssistantCard";
import AddLabAssistantModal from "./modals/AddLabAssistantModal";
import { labAssistants as initialLabAssistants } from "../../data/labAssistants";

function generateLabAssistantId(existing) {
  const maxNo = existing.reduce((max, la) => {
    const num = parseInt(String(la.laId).replace(/\D/g, ""), 10) || 0;
    return Math.max(max, num);
  }, 0);
  return `LA-${String(maxNo + 1).padStart(3, "0")}`;
}

export default function LabAssistants() {
  const [labAssistants, setLabAssistants] = useState(initialLabAssistants);
  const [search, setSearch] = useState("");
  const [modalState, setModalState] = useState(null); // null | { editingLabAssistant: null | labAssistant }

  const filteredLabAssistants = useMemo(() => {
    return labAssistants.filter(
      (la) =>
        la.name.toLowerCase().includes(search.toLowerCase()) ||
        la.laId.toLowerCase().includes(search.toLowerCase()) ||
        la.phone.includes(search) ||
        la.branch.toLowerCase().includes(search.toLowerCase())
    );
  }, [labAssistants, search]);

  function handleSaveLabAssistant(formData) {
    if (formData.laId) {
      // Editing existing lab assistant
      setLabAssistants((prev) =>
        prev.map((la) => (la.laId === formData.laId ? { ...formData } : la))
      );
    } else {
      // Adding new lab assistant
      const newLabAssistant = { ...formData, laId: generateLabAssistantId(labAssistants) };
      setLabAssistants((prev) => [...prev, newLabAssistant]);
    }
    setModalState(null);
  }

  function handleRemoveLabAssistant(member) {
    if (!window.confirm(`Remove "${member.name}"? This can't be undone.`)) return;
    setLabAssistants((prev) => prev.filter((la) => la.laId !== member.laId));
  }

  return (
    <div className="space-y-6">
      <LabAssistantsHeader onAddLabAssistant={() => setModalState({ editingLabAssistant: null })} />

      <div className="bg-white rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-5">
        <LabAssistantsSearch value={search} onChange={setSearch} />

        <div className="hidden md:block">
          <LabAssistantsTable
            labAssistants={filteredLabAssistants}
            onEdit={(la) => setModalState({ editingLabAssistant: la })}
            onRemove={handleRemoveLabAssistant}
          />
        </div>
        <div className="md:hidden space-y-3">
          {filteredLabAssistants.map((la) => (
            <LabAssistantCard
              key={la.laId}
              labAssistant={la}
              onEdit={(item) => setModalState({ editingLabAssistant: item })}
              onRemove={handleRemoveLabAssistant}
            />
          ))}
        </div>

        {filteredLabAssistants.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-6">No lab assistants found.</p>
        )}
      </div>

      {modalState && (
        <AddLabAssistantModal
          editingLabAssistant={modalState.editingLabAssistant}
          onClose={() => setModalState(null)}
          onSave={handleSaveLabAssistant}
        />
      )}
    </div>
  );
}
