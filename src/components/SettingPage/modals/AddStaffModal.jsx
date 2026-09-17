// src/components/SettingPage/modals/AddStaffModal.jsx
import { useState, useEffect } from "react";
import ModalShell from "../../common/Modal/ModalShell";
import { getBranchesApi } from "../../../api/api";
import { useAuth } from "../../../Context/AuthContext";


const ALL_ROLES = ["Front Office", "Technician", "Lab Assistant", "Admin"];

const NAME_REGEX = /^[A-Za-z\s]+$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\d{10}$/;

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  branch_id: "",
  role: "Front Office",
  status: "Active",
  latitude: "",
  longitude: "",
};

function validate(form, isTechnician, isAdmin) {
  const errors = {};

  if (!form.name.trim()) {
    errors.name = "Name is required.";
  } else if (!NAME_REGEX.test(form.name.trim())) {
    errors.name = "Only letters and spaces are allowed.";
  } else if (form.name.trim().length < 3) {
    errors.name = "Name must be at least 3 characters.";
  }

  if (!form.email.trim()) {
    errors.email = "Email is required.";
  } else if (!EMAIL_REGEX.test(form.email.trim())) {
    errors.email = "Enter a valid email address.";
  }

  if (!form.phone.trim()) {
    errors.phone = "Phone is required.";
  } else if (!PHONE_REGEX.test(form.phone.trim())) {
    errors.phone = "Enter exactly 10 digits, numbers only.";
  }

  if (!form.branch_id) {
    errors.branch_id = "Select a branch.";
  }

  if (isTechnician) {
    const lat = Number(form.latitude);
    const lng = Number(form.longitude);

    if (form.latitude === "" || Number.isNaN(lat)) {
      errors.latitude = "Latitude is required.";
    } else if (lat < -90 || lat > 90) {
      errors.latitude = "Must be between -90 and 90.";
    }

    if (form.longitude === "" || Number.isNaN(lng)) {
      errors.longitude = "Longitude is required.";
    } else if (lng < -180 || lng > 180) {
      errors.longitude = "Must be between -180 and 180.";
    }
  }

  return errors;
}

export default function AddStaffModal({ editingStaff, onClose, onSave }) {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";
  const ROLES = isSuperAdmin ? ALL_ROLES : ALL_ROLES.filter((r) => r !== "Admin");

  const [form, setForm] = useState(emptyForm);
  const [branches, setBranches] = useState([]);
  const [isLocating, setIsLocating] = useState(false);
  const [errors, setErrors] = useState({});
  const isEditMode = Boolean(editingStaff);
  const isTechnician = form.role === "Technician";
  const isAdmin = form.role === "Admin";

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
    if (editingStaff) {
      setForm({
        name: editingStaff.name,
        email: editingStaff.email,
        phone: editingStaff.phone,
        branch_id: editingStaff.branch_id ?? "",
        role: editingStaff.role ?? "Front Office",
        status: editingStaff.status ?? "Active",
        latitude: editingStaff.latitude ?? "",
        longitude: editingStaff.longitude ?? "",
      });
    } else {
      setForm(emptyForm);
    }
    setErrors({});
  }, [editingStaff]);

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
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
        setErrors((prev) => ({ ...prev, latitude: undefined, longitude: undefined }));
        setIsLocating(false);
      },
      () => setIsLocating(false),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  function handleSubmit(e) {
    e.preventDefault();

    const validationErrors = validate(form, isTechnician, isAdmin);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    onSave({
      ...form,
      id: editingStaff?.id,
      staffId: editingStaff?.staffId,
      latitude: isTechnician ? form.latitude : null,
      longitude: isTechnician ? form.longitude : null,
    });
  }

  return (
    <ModalShell title={isEditMode ? "Edit Staff" : "Add Staff"} onClose={onClose} maxWidth="max-w-md">
      <form onSubmit={handleSubmit} noValidate>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1.5">Full Name</label>
            <input
              autoFocus={!isEditMode}
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Staff name"
              className={`w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none focus:ring-1 ${
                errors.name ? "border-red-300 focus:border-red-400 focus:ring-red-400" : "border-gray-200 focus:border-teal-500 focus:ring-teal-500"
              }`}
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1.5">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="staff@lab.com"
              className={`w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none focus:ring-1 ${
                errors.email ? "border-red-300 focus:border-red-400 focus:ring-red-400" : "border-gray-200 focus:border-teal-500 focus:ring-teal-500"
              }`}
            />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1.5">Phone</label>
              <input
                value={form.phone}
                onChange={(e) => handleChange("phone", e.target.value.replace(/[^\d]/g, "").slice(0, 10))}
                placeholder="10-digit number"
                inputMode="numeric"
                className={`w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none focus:ring-1 ${
                  errors.phone ? "border-red-300 focus:border-red-400 focus:ring-red-400" : "border-gray-200 focus:border-teal-500 focus:ring-teal-500"
                }`}
              />
              {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1.5">Branch</label>
              <select
                value={form.branch_id}
                onChange={(e) => handleChange("branch_id", e.target.value)}
                className={`w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none focus:ring-1 ${
                  errors.branch_id ? "border-red-300 focus:border-red-400 focus:ring-red-400" : "border-gray-200 focus:border-teal-500 focus:ring-teal-500"
                }`}
              >
                <option value="">Select branch</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              {errors.branch_id && <p className="text-xs text-red-500 mt-1">{errors.branch_id}</p>}
            </div>
          </div>

          {isTechnician && (
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
                <div>
                  <input
                    type="number"
                    step="any"
                    value={form.latitude}
                    onChange={(e) => handleChange("latitude", e.target.value)}
                    placeholder="Latitude"
                    className={`w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none focus:ring-1 ${
                      errors.latitude ? "border-red-300 focus:border-red-400 focus:ring-red-400" : "border-gray-200 focus:border-teal-500 focus:ring-teal-500"
                    }`}
                  />
                  {errors.latitude && <p className="text-xs text-red-500 mt-1">{errors.latitude}</p>}
                </div>
                <div>
                  <input
                    type="number"
                    step="any"
                    value={form.longitude}
                    onChange={(e) => handleChange("longitude", e.target.value)}
                    placeholder="Longitude"
                    className={`w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none focus:ring-1 ${
                      errors.longitude ? "border-red-300 focus:border-red-400 focus:ring-red-400" : "border-gray-200 focus:border-teal-500 focus:ring-teal-500"
                    }`}
                  />
                  {errors.longitude && <p className="text-xs text-red-500 mt-1">{errors.longitude}</p>}
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-1">Used to match this technician to nearby home collection requests.</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1.5">Role</label>
              <select
                value={form.role}
                onChange={(e) => handleChange("role", e.target.value)}
                disabled={isEditMode}
                className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                {ROLES.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
              {isEditMode && <p className="text-xs text-gray-400 mt-1">Role can't be changed after creation.</p>}
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
            {isEditMode ? "Save Changes" : "Add Staff"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}