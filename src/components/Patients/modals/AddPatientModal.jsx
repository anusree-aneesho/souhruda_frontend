import { useState } from "react";
import ModalShell from "../../common/Modal/ModalShell";

const emptyForm = { name: "", date_of_birth: "", gender: "Male", contact: "", email: "", address: "", isPregnant: false };

export default function AddPatientModal({ onClose, onAdd }) {
  const [form, setForm] = useState(emptyForm);

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e) {
  e.preventDefault();
  if (!form.name.trim() || !form.date_of_birth || !form.contact.trim()) return;
  onAdd({
    ...form,
  });
}

  return (
    <ModalShell title="Add Patient" onClose={onClose} maxWidth="max-w-md">
      <form onSubmit={handleSubmit}>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1.5">Full Name</label>
            <input
              autoFocus
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Patient name"
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
                // placeholder="Years"
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
                placeholder="10-digit number"
                className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>

          {form.gender === "Female" && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPregnant"
                checked={form.isPregnant}
                onChange={(e) => handleChange("isPregnant", e.target.checked)}
                className="rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
              />
              <label htmlFor="isPregnant" className="text-sm text-gray-700 cursor-pointer">
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
              placeholder="patient@example.com"
              className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1.5">Address</label>
            <textarea
              value={form.address}
              onChange={(e) => handleChange("address", e.target.value)}
              placeholder="House name, street, city, PIN"
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
            Add Patient
          </button>
        </div>
      </form>
    </ModalShell>
  );
}