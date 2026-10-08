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

  return (
    <div className="bg-white rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] max-w-2xl">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Branches</h2>

      {loading ? (
        <p className="text-sm text-gray-500">Loading branches...</p>
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : !branches || branches.length === 0 ? (
        <p className="text-sm text-gray-500">No branches added yet.</p>
      ) : (
        <ul className="space-y-2">
          {branches.map((b) => {
            const isSelected = b.id === selectedBranchId;
            return (
              <li
                key={b.id}
                className="flex items-center justify-between text-sm text-gray-700 border-b border-gray-100 pb-2"
              >
                <span>
                  {canManageBranches ? (
                    <button
                      type="button"
                      onClick={() => onSelectBranch?.(b)}
                      title="View this branch's settings"
                      className={`font-medium underline-offset-2 hover:underline cursor-pointer ${
                        isSelected ? "text-teal-700" : "text-gray-900 hover:text-teal-600"
                      }`}
                    >
                      {b.name}
                    </button>
                  ) : (
                    <span className="font-medium">{b.name}</span>
                  )}
                  {b.address && <span className="text-gray-400"> — {b.address}</span>}
                  {b.is_active === false && (
                    <span className="ml-2 text-xs text-gray-400">(inactive)</span>
                  )}
                  {isSelected && (
                    <span className="ml-2 text-xs rounded-full bg-teal-50 text-teal-700 px-2 py-0.5">
                      Viewing
                    </span>
                  )}
                </span>
                {canManageBranches && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingBranch(b)}
                      className="text-gray-400 hover:text-teal-600 p-1 rounded-md hover:bg-gray-50 cursor-pointer"
                      title="Edit branch"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setBranchToDelete(b)}
                      className="text-gray-400 hover:text-red-600 p-1 rounded-md hover:bg-gray-50 cursor-pointer"
                      title="Delete branch"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
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