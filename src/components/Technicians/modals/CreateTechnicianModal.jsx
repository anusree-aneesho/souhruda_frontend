// src/components/Technicians/modals/CreateTechnicianModal.jsx
import { useState, useEffect } from "react";
import ModalShell from "../../common/Modal/ModalShell";
import { getBranchesApi } from "../../../api/api";

const emptyForm = { name: "", email: "", phone: "", branch_id: "", status: "Active", latitude: "", longitude: "" };

export default function CreateTechnicianModal({ editingTechnician, onClose, onSave }) {
  const [form, setForm] = useState(emptyForm);
  const [branches, setBranches] = useState([]);
  const [isLocating, setIsLocating] = useState(false);
  const isEditMode = Boolean(editingTechnician);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getBranchesApi();
        if (!cancelled) setBranches(res.data || []);
      } catch (err) {
        console.error("Failed to load branches:", err.message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (editingTechnician) {
      setForm({
        name: editingTechnician.name,
        email: editingTechnician.email,
        phone: editingTechnician.phone,
        branch_id: editingTechnician.branch_id ?? "",
        status: editingTechnician.status,
        latitude: editingTechnician.latitude ?? "",
        longitude: editingTechnician.longitude ?? "",
      });
    } else {
      setForm(emptyForm);
    }
  }, [editingTechnician]);

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleUseCurrentLocation() {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((prev) => ({
          ...prev,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        }));
        setIsLocating(false);
      },
      () => setIsLocating(false),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim() || !form.branch_id || form.latitude === "" || form.longitude === "") return;
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
              <label className="block text-sm font-semibold text-gray-900 mb-1.5">Branch</label>
              <select
                value={form.branch_id}
                onChange={(e) => handleChange("branch_id", e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              >
                <option value="">Select branch</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-semibold text-gray-900">Base Location</label>
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={isLocating}
                className="text-xs font-medium text-teal-600 hover:underline disabled:opacity-60"
              >
                {isLocating ? "Locating…" : "📍 Use current location"}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                step="any"
                value={form.latitude}
                onChange={(e) => handleChange("latitude", e.target.value)}
                placeholder="Latitude"
                className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
              <input
                type="number"
                step="any"
                value={form.longitude}
                onChange={(e) => handleChange("longitude", e.target.value)}
                placeholder="Longitude"
                className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">Used to match this technician to nearby home collection requests.</p>
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