// src/components/Staff/Staff.jsx
import { useState, useMemo } from "react";
import StaffHeader from "./StaffHeader";
import StaffSearch from "./StaffSearch";
import StaffTable from "./StaffTable/StaffTable";
import StaffCard from "./StaffTable/StaffCard";
import AddStaffModal from "./modals/AddStaffModal";
import { staff as initialStaff } from "../../data/staff";

function generateStaffId(existing) {
  const maxNo = existing.reduce((max, s) => {
    const num = parseInt(String(s.staffId).replace(/\D/g, ""), 10) || 0;
    return Math.max(max, num);
  }, 0);
  return `FO-${String(maxNo + 1).padStart(3, "0")}`;
}

export default function Staff() {
  const [staff, setStaff] = useState(initialStaff);
  const [search, setSearch] = useState("");
  const [modalState, setModalState] = useState(null); // null | { editingStaff: null | staff }

  const filteredStaff = useMemo(() => {
    return staff.filter(
      (s) =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.staffId.toLowerCase().includes(search.toLowerCase()) ||
        s.phone.includes(search) ||
        s.branch.toLowerCase().includes(search.toLowerCase())
    );
  }, [staff, search]);

  function handleSaveStaff(formData) {
    if (formData.staffId) {
      // Editing existing staff
      setStaff((prev) =>
        prev.map((s) => (s.staffId === formData.staffId ? { ...formData } : s))
      );
    } else {
      // Adding new staff
      const newStaff = { ...formData, staffId: generateStaffId(staff) };
      setStaff((prev) => [...prev, newStaff]);
    }
    setModalState(null);
  }

  function handleRemoveStaff(member) {
    if (!window.confirm(`Remove "${member.name}"? This can't be undone.`)) return;
    setStaff((prev) => prev.filter((s) => s.staffId !== member.staffId));
  }

  return (
    <div className="space-y-6">
      <StaffHeader onAddStaff={() => setModalState({ editingStaff: null })} />

      <div className="bg-white rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-5">
        <StaffSearch value={search} onChange={setSearch} />

        <div className="hidden md:block">
          <StaffTable
            staff={filteredStaff}
            onEdit={(s) => setModalState({ editingStaff: s })}
            onRemove={handleRemoveStaff}
          />
        </div>
        <div className="md:hidden space-y-3">
          {filteredStaff.map((s) => (
            <StaffCard
              key={s.staffId}
              staff={s}
              onEdit={(st) => setModalState({ editingStaff: st })}
              onRemove={handleRemoveStaff}
            />
          ))}
        </div>

        {filteredStaff.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-6">No front officers found.</p>
        )}
      </div>

      {modalState && (
        <AddStaffModal
          editingStaff={modalState.editingStaff}
          onClose={() => setModalState(null)}
          onSave={handleSaveStaff}
        />
      )}
    </div>
  );
}
