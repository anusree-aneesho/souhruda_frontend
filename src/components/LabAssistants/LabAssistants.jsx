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

export default function LabAssistants() {
  const [labAssistants, setLabAssistants] = useState([]);
  const [branches, setBranches] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalState, setModalState] = useState(null);

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

  async function handleRemoveLabAssistant(member) {
    if (!window.confirm(`Remove "${member.name}"? This can't be undone.`)) return;

    try {
      await deleteLabAssistantApi(member.id);
      setLabAssistants((prev) => prev.filter((la) => la.id !== member.id));
      showToast(`${member.name} removed successfully`);
    } catch (err) {
      showToast(err.message, "error");
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

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  );
}