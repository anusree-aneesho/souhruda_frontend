import { useEffect, useImperativeHandle, forwardRef, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { getBranchesApi, deleteBranchApi } from "../../api/api";
import { useAuth } from "../../Context/AuthContext";
import EditBranchModal from "./modals/EditBranchModal";
import ConfirmModal from "../common/Modal/ConfirmModal";
import AlertModal from "../common/Modal/AlertModal";

const BranchesList = forwardRef(function BranchesList(
  { selectedBranchId = null, onSelectBranch, onBranchUpdated },
  ref
) {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingBranch, setEditingBranch] = useState(null);
  const [branchToDelete, setBranchToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [alert, setAlert] = useState(null); // { title, message }
  const { user } = useAuth();
  const canManageBranches = user?.role === "super_admin";

  async function loadBranches() {
    setLoading(true);
    try {
      const res = await getBranchesApi();
      setBranches(res.data);
    } catch (err) {
      setError(err.message || "Failed to load branches.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBranches();
  }, []);

  useImperativeHandle(ref, () => ({
    refresh: loadBranches,
  }));

  async function confirmDelete() {
    if (!branchToDelete) return;
    setDeleting(true);
    try {
      await deleteBranchApi(branchToDelete.id);
      if (branchToDelete.id === selectedBranchId) onSelectBranch?.(null);
      setBranchToDelete(null);
      await loadBranches();
    } catch (err) {
      setBranchToDelete(null);
      setAlert({
        title: "Delete failed",
        message: err.message || "Failed to delete branch. Please try again.",
      });
    } finally {
      setDeleting(false);
    }
  }

  // Highlight the branch in effect. A super admin has no branch of their own, so
  // only their explicit pick counts (nothing is highlighted until they choose).
  // Everyone else works in their own branch.
  const firstActiveId = [...(branches || [])]
    .filter((b) => b.is_active !== false)
    .sort((a, b) => a.id - b.id)[0]?.id;
  const activeBranchId = canManageBranches
    ? selectedBranchId ?? null
    : user?.branchId ?? firstActiveId ?? null;

  return (
    <div className="bg-white rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] flex flex-col self-start">
      <h3 className="font-semibold text-sm text-gray-900 mb-3">Branches</h3>

      {loading ? (
        <p className="text-sm text-gray-500 px-3 py-2">Loading branches...</p>
      ) : error ? (
        <p className="text-sm text-red-600 px-3 py-2">{error}</p>
      ) : !branches || branches.length === 0 ? (
        <p className="text-sm text-gray-500 px-3 py-2">No branches added yet.</p>
      ) : (
        <div className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible">
          {branches.map((b) => {
            const isActive = b.id === activeBranchId;
            return (
              <div
                key={b.id}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group ${
                  isActive ? "bg-teal-50 text-teal-700" : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                {canManageBranches ? (
                  <button
                    type="button"
                    onClick={() => onSelectBranch?.(b)}
                    title={b.address || "Work in this branch"}
                    className="flex items-center gap-2 flex-1 min-w-0 text-left cursor-pointer"
                  >
                    <span className={`h-2 w-2 shrink-0 rounded-full ${isActive ? "bg-teal-500" : "bg-gray-300"}`} />
                    <span className="truncate">{b.name}</span>
                    {b.is_active === false && (
                      <span className="text-xs font-normal text-gray-400">(inactive)</span>
                    )}
                  </button>
                ) : (
                  <span className="flex items-center gap-2 flex-1 min-w-0" title={b.address || undefined}>
                    <span className={`h-2 w-2 shrink-0 rounded-full ${isActive ? "bg-teal-500" : "bg-gray-300"}`} />
                    <span className="truncate">{b.name}</span>
                  </span>
                )}

                {canManageBranches && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setEditingBranch(b)}
                      className="text-gray-400 hover:text-teal-600 p-1 rounded-md cursor-pointer"
                      title="Edit branch"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => setBranchToDelete(b)}
                      className="text-gray-400 hover:text-red-600 p-1 rounded-md cursor-pointer"
                      title="Delete branch"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {editingBranch && (
        <EditBranchModal
          branch={editingBranch}
          onClose={() => setEditingBranch(null)}
          onBranchUpdated={() => {
            loadBranches();
            onBranchUpdated?.();
          }}
        />
      )}

      {branchToDelete && (
        <ConfirmModal
          title="Delete Branch"
          message={`Delete "${branchToDelete.name}"? This cannot be undone.`}
          confirmLabel="Delete"
          loading={deleting}
          onConfirm={confirmDelete}
          onClose={() => setBranchToDelete(null)}
        />
      )}

      {alert && (
        <AlertModal
          title={alert.title}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}
    </div>
  );
});

export default BranchesList;