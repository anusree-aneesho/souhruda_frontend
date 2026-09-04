// src/components/Technicians/modals/CreateTechnicianModal.jsx
import { useState, useEffect } from "react";
import ModalShell from "../../common/Modal/ModalShell";

const emptyForm = { name: "", email: "", phone: "", zone: "", status: "Active" };

export default function CreateTechnicianModal({ editingTechnician, onClose, onSave }) {
  const [form, setForm] = useState(emptyForm);
  const isEditMode = Boolean(editingTechnician);

  useEffect(() => {
    if (editingTechnician) {
      setForm({
        name: editingTechnician.name,
        email: editingTechnician.email,
        phone: editingTechnician.phone,
        zone: editingTechnician.zone ?? "",
        status: editingTechnician.status,
      });
    } else {
      setForm(emptyForm);
    }
  }, [editingTechnician]);

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) return;
    onSave({
      ...form,
      id: editingTechnician?.id,
      techId: editingTechnician?.techId,
    });
  }

  return (
    <ModalShell title={isEditMode ? "Edit Technician" : "Add Technician"} onClose={onClose} maxWidth="max-w-md">
      <form onSubmit={handleSubmit}>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1.5">Full Name</label>
            <input
              autoFocus={!isEditMode}
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Technician name"
              className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1.5">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="technician@lab.com"
              className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1.5">Phone</label>
              <input
                value={form.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="10-digit number"
                className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1.5">Zone</label>
              <input
                value={form.zone}
                onChange={(e) => handleChange("zone", e.target.value)}
                placeholder="e.g. Kozhikode"
                className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1.5">Status</label>
            <select
              value={form.status}
              onChange={(e) => handleChange("status", e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            >
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2.5 rounded-lg bg-teal-600 text-sm font-medium text-white hover:bg-teal-700"
          >
            {isEditMode ? "Save Changes" : "Add Technician"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}