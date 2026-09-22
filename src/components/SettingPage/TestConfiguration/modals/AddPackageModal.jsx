// src/components/SettingPage/TestConfiguration/modals/AddPackageModal.jsx
import { useState, useMemo } from "react";
import { FlaskConical, Loader2, Plus, Search } from "lucide-react";
import ModalShell from "../../../common/Modal/ModalShell";
import { createTestPackage, updateTestPackage } from "../../../../api/api";

const inputClass =
  "w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500";

export default function AddPackageModal({ tests, editingPackage, onClose, onSaved }) {
  const isEditing = Boolean(editingPackage);

  const [name, setName] = useState(editingPackage?.name ?? "");
  const [price, setPrice] = useState(editingPackage?.price ?? "");
  const [selectedIds, setSelectedIds] = useState(
    (editingPackage?.lab_tests ?? []).map((t) => t.id)
  );
  const [isActive, setIsActive] = useState(editingPackage?.is_active ?? true);
  const [searchTerm, setSearchTerm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const filteredTests = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return tests;
    return tests.filter((t) => t.name.toLowerCase().includes(q));
  }, [tests, searchTerm]);

  const selectedCount = selectedIds.length;

  const totalTestsPrice = useMemo(() => {
    return tests
      .filter((t) => selectedIds.includes(t.id))
      .reduce((sum, t) => sum + Number(t.price || 0), 0);
  }, [tests, selectedIds]);

  function toggleTest(id) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((tid) => tid !== id) : [...prev, id]
    );
  }

  async function handleSubmit() {
    setError("");

    if (!name.trim()) {
      setError("Package name is required.");
      return;
    }
    if (price === "" || Number.isNaN(Number(price)) || Number(price) < 0) {
      setError("Enter a valid price.");
      return;
    }
    if (selectedIds.length === 0) {
      setError("Select at least one test for this package.");
      return;
    }

    const payload = {
      name: name.trim(),
      price: Number(price),
      test_ids: selectedIds,
      is_active: isActive,
    };

    setSaving(true);
    try {
      const res = isEditing
        ? await updateTestPackage(editingPackage.id, payload)
        : await createTestPackage(payload);
      onSaved(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell title={isEditing ? "Edit Package" : "Add Package"} onClose={onClose} maxWidth="max-w-lg">
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-900 mb-1.5">
              Package Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Full Body Checkup"
              className={inputClass}
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-900 mb-1.5">
              Price (₹)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="e.g. 1499"
              className={inputClass}
            />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-gray-200 px-3.5 py-2.5">
          <div>
            <p className="text-xs font-semibold text-gray-900">Status</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {isActive ? "Package is active and can be used." : "Package is inactive and hidden from use."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsActive((v) => !v)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 cursor-pointer ${
              isActive ? "bg-teal-600" : "bg-gray-300"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isActive ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2 gap-3">
            <label className="block text-xs font-semibold text-gray-900">
              Select Tests
            </label>
            {selectedCount > 0 && (
              <span className="text-xs text-gray-500 shrink-0">
                {selectedCount} selected · ₹{totalTestsPrice.toFixed(2)}
              </span>
            )}
          </div>

          <div className="relative mb-2">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search tests..."
              className={`${inputClass} pl-8 py-2 text-xs`}
            />
          </div>

          {tests.length === 0 ? (
            <p className="text-xs text-gray-400 py-5 text-center">
              No tests found. Add tests under Test Master first.
            </p>
          ) : filteredTests.length === 0 ? (
            <p className="text-xs text-gray-400 py-5 text-center">
              No tests match "{searchTerm}".
            </p>
          ) : (
            <div className="border border-gray-100 rounded-lg divide-y divide-gray-100 max-h-52 overflow-y-auto">
              {filteredTests.map((test) => {
                const isSelected = selectedIds.includes(test.id);
                return (
                  <label
                    key={test.id}
                    className={`flex items-center gap-2.5 px-3 py-2 cursor-pointer transition-colors ${
                      isSelected ? "bg-teal-50/60" : "hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleTest(test.id)}
                      className="h-3.5 w-3.5 rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer shrink-0"
                    />
                    <FlaskConical size={12} className="text-teal-600 shrink-0" />
                    <span className="text-xs font-medium text-gray-900 truncate flex-1">
                      {test.name}
                    </span>
                    <span className="text-xs text-gray-400 shrink-0">
                      {test.unit ? `${test.unit} · ` : ""}₹{Number(test.price || 0).toFixed(2)}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <div className="flex justify-end gap-2 pt-1 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            {isEditing ? "Save" : "Add"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}