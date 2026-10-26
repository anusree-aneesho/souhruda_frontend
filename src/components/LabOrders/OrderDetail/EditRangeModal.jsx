// src/components/LabOrders/OrderDetail/EditRangeModal.jsx
import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { updateTestRangeApi } from "../../../api/api";

export default function EditRangeModal({ test, onClose, onSaved }) {
  const [value, setValue] = useState(test.rangeRaw || "");
  const [unit, setUnit] = useState(test.unit || "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape" && !isSaving) onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, isSaving]);

  async function handleSave(e) {
    e.preventDefault();
    const trimmed = value.trim();

    if (!trimmed) {
      setError("Enter a normal range, for example 13.5-24.0, <10 or Negative.");
      return;
    }
    if (!test.rangeId) {
      setError("No range is defined for this patient in Test Master. Add one there first.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await updateTestRangeApi(test.labTestId, {
        range_id: test.rangeId,
        range_raw: trimmed,
        unit: unit.trim() || null,
      });
      await onSaved();
    } catch (err) {
      setError(err.message || "Couldn't update the range and unit.");
      setIsSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={() => !isSaving && onClose()}
    >
      <form
        onSubmit={handleSave}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl"
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Edit range &amp; unit</h3>
            <p className="text-xs text-gray-500 mt-0.5">{test.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            aria-label="Close"
            className="text-gray-400 hover:text-gray-600 cursor-pointer disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        <p className="text-xs text-gray-500 mb-3">
          Patient group: <span className="font-medium text-gray-700">{test.demographicGroup || "-"}</span>
        </p>

        <label className="block text-xs font-medium text-gray-500 mb-1" htmlFor="edit-unit-input">
          UNIT
        </label>
        <input
          id="edit-unit-input"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          placeholder="e.g. cells/µL, kUA/L, mg/dL"
          maxLength={30}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 mb-1"
        />
        <p className="text-xs text-gray-400 mb-3">Applies to all patient groups of this test.</p>

        <label className="block text-xs font-medium text-gray-500 mb-1" htmlFor="edit-range-input">
          NORMAL RANGE
        </label>
        <input
          id="edit-range-input"
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="e.g. 13.5-24.0, <10, >40, Negative"
          maxLength={60}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
        />

        <p className="text-xs text-gray-400 mt-2">
          This changes the range for every patient in this group (shown above), and the unit for all groups of this test. Results already entered are not converted, and completed reports keep the range and unit they were issued with.
        </p>

        {error && <p className="text-xs text-red-500 mt-3">{error}</p>}

        <div className="flex justify-end gap-3 mt-5">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-2 rounded-lg bg-teal-600 text-sm font-medium text-white hover:bg-teal-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}