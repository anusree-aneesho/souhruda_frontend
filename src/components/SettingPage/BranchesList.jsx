import { useEffect, useImperativeHandle, forwardRef, useState } from "react";
import { getBranchesApi } from "../../api/api";

const BranchesList = forwardRef(function BranchesList(_, ref) {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  // allows the parent (Settings.jsx) to trigger a refresh after adding a branch
  useImperativeHandle(ref, () => ({
    refresh: loadBranches,
  }));

  return (
    <div className="bg-white rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] max-w-2xl">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Branches</h2>

      {loading ? (
        <p className="text-sm text-gray-500">Loading branches...</p>
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : branches.length === 0 ? (
        <p className="text-sm text-gray-500">No branches added yet.</p>
      ) : (
        <ul className="space-y-2">
          {branches.map((b) => (
            <li key={b.id} className="text-sm text-gray-700 border-b border-gray-100 pb-2">
              <span className="font-medium">{b.name}</span>
              {b.address && <span className="text-gray-400"> — {b.address}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});

export default BranchesList;