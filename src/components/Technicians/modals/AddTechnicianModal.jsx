// src/components/Technicians/modals/AddTechnicianModal.jsx
import { useState, useEffect } from "react";
import ModalShell from "../../common/Modal/ModalShell";

const emptyForm = {
  name: "",
  phone: "",
  zone: "",
  rating: "5.0",
  status: "Active",
  currentStatus: "Available",
  assignedJobs: "0",
};

export default function AddTechnicianModal({ editingTechnician, onClose, onSave }) {
  const [form, setForm] = useState(emptyForm);
  const isEditMode = Boolean(editingTechnician);

  useEffect(() => {
    if (editingTechnician) {
      setForm({
        name: editingTechnician.name,
        phone: editingTechnician.phone,
        zone: editingTechnician.zone,
        rating: String(editingTechnician.rating),
        status: editingTechnician.status,
        currentStatus: editingTechnician.currentStatus,
        assignedJobs: String(editingTechnician.assignedJobs),
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
    if (!form.name.trim() || !form.phone.trim() || !form.zone.trim()) return;
    onSave({
      ...form,
      rating: parseFloat(form.rating) || 5.0,
      assignedJobs: parseInt(form.assignedJobs, 10) || 0,
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1.5">Rating</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="5"
                value={form.rating}
                onChange={(e) => handleChange("rating", e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1.5">Assigned Jobs</label>
              <input
                type="number"
                min="0"
                value={form.assignedJobs}
                onChange={(e) => handleChange("assignedJobs", e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1.5">Availability</label>
              <select
                value={form.currentStatus}
                onChange={(e) => handleChange("currentStatus", e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              >
                <option>Available</option>
                <option>On Job</option>
                <option>Offline</option>
              </select>
            </div>
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
