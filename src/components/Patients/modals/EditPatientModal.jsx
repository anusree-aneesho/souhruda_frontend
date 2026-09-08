import { useState } from "react";
import ModalShell from "../../common/Modal/ModalShell";

export default function EditPatientModal({ patient, onClose, onSave }) {
  const [form, setForm] = useState({
  name: patient.name,
  date_of_birth: patient.date_of_birth || "",
  gender: patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1),
  contact: patient.contact,
  email: patient.email || "",
  address: patient.address || "",
  isPregnant: patient.isPregnant || false,
});

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e) {
  e.preventDefault();
  if (!form.name.trim() || !form.date_of_birth || !form.contact.trim()) return;
  onSave(patient.id, { ...form });
  }

  return (
    <ModalShell title="Edit Patient" onClose={onClose} maxWidth="max-w-md">
      <form onSubmit={handleSubmit}>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1.5">Full Name</label>
            <input
              autoFocus
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1.5">Date of Birth</label>
              <input
                type="date"
                value={form.date_of_birth}
                onChange={(e) => handleChange("date_of_birth",e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1.5">Gender</label>
              <select
                value={form.gender}
                onChange={(e) => handleChange("gender", e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              >
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1.5">Contact</label>
              <input
                value={form.contact}
                onChange={(e) => handleChange("contact", e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>

          {form.gender === "Female" && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="editIsPregnant"
                checked={form.isPregnant}
                onChange={(e) => handleChange("isPregnant", e.target.checked)}
                className="rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
              />
              <label htmlFor="editIsPregnant" className="text-sm text-gray-700 cursor-pointer">
                Currently pregnant
              </label>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1.5">Email ID</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1.5">Address</label>
            <textarea
              value={form.address}
              onChange={(e) => handleChange("address", e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 resize-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2.5 rounded-lg bg-teal-600 text-sm font-medium text-white hover:bg-teal-700 cursor-pointer"
          >
            Save Changes
          </button>
        </div>
      </form>
    </ModalShell>
  );
}