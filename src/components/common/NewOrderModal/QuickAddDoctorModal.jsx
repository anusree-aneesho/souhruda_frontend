import { useState } from "react";
import { createDoctorApi } from "../../../api/api";

export default function QuickAddDoctorModal({ onClose, onCreated }) {
  const [name, setName] = useState("");
  const [hospital, setHospital] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    const cleanName = name.trim().replace(/^dr\.?\s*/i, "");

    if (!cleanName) {
      setError("Doctor name is required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await createDoctorApi({
        name: cleanName,
        hospital_clinic: hospital.trim() || null,
      });

      const saved = res?.data?.data ?? res?.data ?? res ?? {};
      onCreated({
        ...saved,
        name: saved.name || cleanName,
        hospital_clinic: saved.hospital_clinic ?? (hospital.trim() || null),
      });
    } catch (err) {
      setError(err.message || "Couldn't add the doctor.");
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">Add Doctor</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            You can add the remaining details later from the Doctors page.
          </p>
        </div>

        <div className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Doctor name *</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Dr. Raflan"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-teal-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hospital</label>
            <input
              value={hospital}
              onChange={(e) => setHospital(e.target.value)}
              placeholder="e.g. City Hospital"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-teal-500"
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-teal-600 text-sm font-medium text-white hover:bg-teal-700 cursor-pointer disabled:opacity-40"
          >
            {saving ? "Saving…" : "Save & Select"}
          </button>
        </div>
      </div>
    </div>
  );
}