// src/components/LabAssistants/LabAssistants.jsx
import { useState, useMemo, useEffect } from "react";
import LabAssistantsHeader from "./LabAssistantsHeader";
import LabAssistantsSearch from "./LabAssistantsSearch";
import LabAssistantsTable from "./LabAssistantsTable/LabAssistantsTable";
import LabAssistantCard from "./LabAssistantsTable/LabAssistantCard";
import AddLabAssistantModal from "./modals/AddLabAssistantModal";
import Toast from "../common/Toast/Toast";
import { useToast } from "../common/Toast/useToast";
import {
  getLabAssistantsApi,
  createLabAssistantApi,
  updateLabAssistantApi,
  deleteLabAssistantApi,
  getBranchesApi,
} from "../../api/api";

function mapFromApi(apiLabAssistant) {
  return {
    id: apiLabAssistant.id,
    laId: apiLabAssistant.number,
    name: apiLabAssistant.name,
    email: apiLabAssistant.email,
    phone: apiLabAssistant.phone,
    branch: apiLabAssistant.branch,
    status: apiLabAssistant.status,
  };
}

// Inline confirmation modal — no separate file needed.
function RemoveLabAssistantModal({ labAssistant, isRemoving, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Remove Lab Assistant</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 cursor-pointer">
            ✕
          </button>
        </div>

        <div className="px-6 py-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to remove Lab Assistant {labAssistant.name}?
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

export default function LabAssistants() {
  const [labAssistants, setLabAssistants] = useState([]);
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
        const [labAssistantsResult, branchesResult] = await Promise.all([
          getLabAssistantsApi(),
          getBranchesApi(),
        ]);

        setLabAssistants(labAssistantsResult.map(mapFromApi));
        setBranches(branchesResult.data ?? branchesResult);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const filteredLabAssistants = useMemo(() => {
    return labAssistants.filter(
      (la) =>
        la.name.toLowerCase().includes(search.toLowerCase()) ||
        la.laId.toLowerCase().includes(search.toLowerCase()) ||
        (la.phone ?? "").includes(search) ||
        (la.branch ?? "").toLowerCase().includes(search.toLowerCase())
    );
  }, [labAssistants, search]);

  async function handleSaveLabAssistant(formData) {
    try {
      if (formData.id) {
        const updated = await updateLabAssistantApi(formData.id, {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          branch_id: formData.branch_id,
          status: formData.status.toLowerCase(),
        });

        setLabAssistants((prev) =>
          prev.map((la) => (la.id === formData.id ? mapFromApi(updated) : la))
        );
        showToast(`${formData.name} updated successfully`);
      } else {
        const created = await createLabAssistantApi({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          branch_id: formData.branch_id,
          status: formData.status.toLowerCase(),
        });

        setLabAssistants((prev) => [...prev, mapFromApi(created)]);
        showToast(`${formData.name} added successfully`);
      }
      setModalState(null);
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  async function handleRemoveLabAssistant() {
    if (!removeTarget) return;

    setIsRemoving(true);
    try {
      await deleteLabAssistantApi(removeTarget.id);
      setLabAssistants((prev) => prev.filter((la) => la.id !== removeTarget.id));
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
      <LabAssistantsHeader onAddLabAssistant={() => setModalState({ editingLabAssistant: null })} />

      <div className="bg-white rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-5">
        <LabAssistantsSearch value={search} onChange={setSearch} />

        {loading && <p className="text-sm text-gray-400 text-center py-6">Loading...</p>}
        {error && <p className="text-sm text-red-500 text-center py-6">Failed to load lab assistants.</p>}

        {!loading && !error && (
          <>
            <div className="hidden md:block">
              <LabAssistantsTable
                labAssistants={filteredLabAssistants}
                onEdit={(la) => setModalState({ editingLabAssistant: la })}
                onRemove={(la) => setRemoveTarget(la)}
              />
            </div>
            <div className="md:hidden space-y-3">
              {filteredLabAssistants.map((la) => (
                <LabAssistantCard
                  key={la.laId}
                  labAssistant={la}
                  onEdit={(item) => setModalState({ editingLabAssistant: item })}
                  onRemove={(la) => setRemoveTarget(la)}
                />
              ))}
            </div>

            {filteredLabAssistants.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-6">No lab assistants found.</p>
            )}
          </>
        )}
      </div>

      {modalState && (
        <AddLabAssistantModal
          editingLabAssistant={modalState.editingLabAssistant}
          branches={branches}
          onClose={() => setModalState(null)}
          onSave={handleSaveLabAssistant}
        />
      )}

      {removeTarget && (
        <RemoveLabAssistantModal
          labAssistant={removeTarget}
          isRemoving={isRemoving}
          onCancel={() => setRemoveTarget(null)}
          onConfirm={handleRemoveLabAssistant}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  );
}