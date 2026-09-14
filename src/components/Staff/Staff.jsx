import { useState, useMemo, useEffect } from "react";
import StaffHeader from "./StaffHeader";
import StaffSearch from "./StaffSearch";
import StaffTable from "./StaffTable/StaffTable";
import StaffCard from "./StaffTable/StaffCard";
import AddStaffModal from "./modals/AddStaffModal";
import Toast from "../common/Toast/Toast";
import { useToast } from "../common/Toast/useToast";
import {
  getFrontOfficersApi,
  createFrontOfficerApi,
  updateFrontOfficerApi,
  deleteFrontOfficerApi,
  getBranchesApi,
} from "../../api/api";

function mapStaff(f) {
  return {
    id: f.id,
    staffId: f.front_officer_number,
    name: f.name,
    email: f.email,
    phone: f.phone,
    branch: f.branch,
    branch_id: f.branch_id,
    status: f.status,
  };
}

// Inline confirmation modal — no separate file needed.
function RemoveStaffModal({ staff, isRemoving, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Remove Front Officer</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 cursor-pointer">
            ✕
          </button>
        </div>

        <div className="px-6 py-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to remove Front Officer {staff.name}?
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button
            onClick={onCancel}
            className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isRemoving}
            className="px-4 py-2.5 rounded-lg bg-red-600 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60 cursor-pointer"
          >
            {isRemoving ? "Removing…" : "Remove"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Staff() {
  const [staff, setStaff] = useState([]);
  const [branches, setBranches] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalState, setModalState] = useState(null);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    async function loadData() {
      try {
        const [staffResult, branchesResult] = await Promise.all([
          getFrontOfficersApi(),
          getBranchesApi(),
        ]);

        setStaff(staffResult.data.map(mapStaff));
        setBranches(branchesResult.data ?? branchesResult);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const filteredStaff = useMemo(() => {
    return staff.filter(
      (s) =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.staffId.toLowerCase().includes(search.toLowerCase()) ||
        (s.phone ?? "").includes(search) ||
        (s.branch ?? "").toLowerCase().includes(search.toLowerCase())
    );
  }, [staff, search]);

  async function handleSaveStaff(formData) {
    try {
      if (formData.id) {
        await updateFrontOfficerApi(formData.id, {
          name: formData.name,
          phone: formData.phone,
          branch_id: formData.branch_id,
          status: formData.status,
        });
        showToast(`${formData.name} updated successfully`);
      } else {
        await createFrontOfficerApi({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          branch_id: formData.branch_id,
        });
        showToast(`${formData.name} added successfully`);
      }
      setModalState(null);

      // Reload the full list to reflect the change
      const res = await getFrontOfficersApi();
      setStaff(res.data.map(mapStaff));
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  async function handleRemoveStaff() {
    if (!removeTarget) return;

    setIsRemoving(true);
    try {
      await deleteFrontOfficerApi(removeTarget.id);
      setStaff((prev) => prev.filter((s) => s.id !== removeTarget.id));
      showToast(`${removeTarget.name} removed successfully`);
      setRemoveTarget(null);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setIsRemoving(false);
    }
  }

  return (
    <div className="space-y-6">
      <StaffHeader onAddStaff={() => setModalState({ editingStaff: null })} />

      <div className="bg-white rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-5">
        <StaffSearch value={search} onChange={setSearch} />

        {loading && <p className="text-sm text-gray-400 text-center py-6">Loading...</p>}
        {error && <p className="text-sm text-red-500 text-center py-6">Failed to load front officers.</p>}

        {!loading && !error && (
          <>
            <div className="hidden md:block">
              <StaffTable
                staff={filteredStaff}
                onEdit={(s) => setModalState({ editingStaff: s })}
                onRemove={(s) => setRemoveTarget(s)}
              />
            </div>
            <div className="md:hidden space-y-3">
              {filteredStaff.map((s) => (
                <StaffCard
                  key={s.staffId}
                  staff={s}
                  onEdit={(item) => setModalState({ editingStaff: item })}
                  onRemove={(s) => setRemoveTarget(s)}
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
          editingFrontOfficer={modalState.editingStaff}
          branches={branches}
          onClose={() => setModalState(null)}
          onSave={handleSaveStaff}
        />
      )}

      {removeTarget && (
        <RemoveStaffModal
          staff={removeTarget}
          isRemoving={isRemoving}
          onCancel={() => setRemoveTarget(null)}
          onConfirm={handleRemoveStaff}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  );
}