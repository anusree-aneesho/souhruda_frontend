import { useState, useEffect, useCallback } from "react";
import StaffHeader from "./StaffHeader";
import StaffSearch from "./StaffSearch";
import StaffTable from "./StaffTable/StaffTable";
import StaffCard from "./StaffTable/StaffCard";
import AddStaffModal from "./modals/AddStaffModal";
import {
  getFrontOfficersApi,
  createFrontOfficerApi,
  updateFrontOfficerApi,
  deleteFrontOfficerApi,
} from "../../api/api";

function mapStaff(f) {
  return {
    id: f.id,
    staffId: f.front_officer_number,
    name: f.name,
    email: f.email,
    phone: f.phone,
    branch: f.branch,
    status: f.status,
  };
}

export default function Staff() {
  const [staff, setStaff] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalState, setModalState] = useState(null);

  const loadStaff = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getFrontOfficersApi();
      setStaff(res.data.map(mapStaff));
    } catch (err) {
      console.error("Failed to load front officers:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  const filteredStaff = staff.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.staffId.toLowerCase().includes(search.toLowerCase()) ||
      s.phone.includes(search) ||
      (s.branch || "").toLowerCase().includes(search.toLowerCase())
  );

  async function handleSaveStaff(formData) {
    try {
      if (formData.staffId) {
        // Editing — find the real database id
        const existing = staff.find((s) => s.staffId === formData.staffId);
       await updateFrontOfficerApi(existing.id, {
         name: formData.name,
         phone: formData.phone,
         branch: formData.branch,
         status: formData.status, // send "Active"/"Inactive" directly, matching backend
        });
      } else {
        // Creating new
        await createFrontOfficerApi({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          branch: formData.branch,
        });
      }
      setModalState(null);
      loadStaff();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleRemoveStaff(member) {
    if (!window.confirm(`Remove "${member.name}"? This can't be undone.`)) return;
    try {
      await deleteFrontOfficerApi(member.id);
      loadStaff();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="space-y-6">
      <StaffHeader onAddStaff={() => setModalState({ editingStaff: null })} />

      <div className="bg-white rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-5">
        <StaffSearch value={search} onChange={setSearch} />

        {loading ? (
          <p className="text-sm text-gray-400 text-center py-6">Loading...</p>
        ) : (
          <>
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
          </>
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