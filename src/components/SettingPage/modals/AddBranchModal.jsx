import { useState } from "react";
import ModalShell from "../../common/Modal/ModalShell";
import { createBranchApi } from "../../../api/api";

function validate(formData) {
  const errors = {};
  if (!formData.name.trim()) errors.name = "Branch name is required.";
  if (!formData.code.trim()) {
    errors.code = "Branch code is required.";
  } else if (!/^[A-Za-z0-9]{2,10}$/.test(formData.code)) {
    errors.code = "Code should be 2–10 letters/numbers, no spaces.";
  }
  if (formData.pincode && !/^\d{6}$/.test(formData.pincode)) {
    errors.pincode = "Pincode must be 6 digits.";
  }
  if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errors.email = "Enter a valid email address.";
  }
  if (formData.phone && !/^[0-9\s\-+()]{7,20}$/.test(formData.phone)) {
    errors.phone = "Enter a valid phone number.";
  }
  return errors;
}

export default function AddBranchModal({ onClose, onBranchAdded }) {
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    phone: "",
    email: "",
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const errors = validate(formData);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError("Please fix the errors below.");
      return;
    }
    setFieldErrors({});
    setSaving(true);

    try {
      await createBranchApi({ ...formData, code: formData.code.toUpperCase() });
      onBranchAdded();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to create branch.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell title="Add Branch" onClose={onClose}>
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1.5">
              Branch Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Souhruda Kannur"
              className={`w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none focus:ring-1 ${
                fieldErrors.name
                  ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                  : "border-gray-200 focus:border-teal-500 focus:ring-teal-500"
              }`}
            />
            {fieldErrors.name && <p className="text-xs text-red-600 mt-1">{fieldErrors.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1.5">
              Branch Code
            </label>
            <input
              type="text"
              name="code"
              value={formData.code}
              onChange={handleChange}
              placeholder="e.g. KNR01"
              className={`w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none focus:ring-1 uppercase ${
                fieldErrors.code
                  ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                  : "border-gray-200 focus:border-teal-500 focus:ring-teal-500"
              }`}
            />
            {fieldErrors.code && <p className="text-xs text-red-600 mt-1">{fieldErrors.code}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-1.5">Address</label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="Building name, street, area"
            className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1.5">City</label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="e.g. Kannur"
              className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1.5">State</label>
            <input
              type="text"
              name="state"
              value={formData.state}
              onChange={handleChange}
              placeholder="e.g. Kerala"
              className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1.5">Pincode</label>
            <input
              type="text"
              name="pincode"
              value={formData.pincode}
              onChange={handleChange}
              placeholder="6-digit pincode"
              className={`w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none focus:ring-1 ${
                fieldErrors.pincode
                  ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                  : "border-gray-200 focus:border-teal-500 focus:ring-teal-500"
              }`}
            />
            {fieldErrors.pincode && (
              <p className="text-xs text-red-600 mt-1">{fieldErrors.pincode}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1.5">Phone</label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="0495 xxxxxxx"
              className={`w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none focus:ring-1 ${
                fieldErrors.phone
                  ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                  : "border-gray-200 focus:border-teal-500 focus:ring-teal-500"
              }`}
            />
            {fieldErrors.phone && <p className="text-xs text-red-600 mt-1">{fieldErrors.phone}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1.5">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="branch@souhruda.com"
              className={`w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none focus:ring-1 ${
                fieldErrors.email
                  ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                  : "border-gray-200 focus:border-teal-500 focus:ring-teal-500"
              }`}
            />
            {fieldErrors.email && <p className="text-xs text-red-600 mt-1">{fieldErrors.email}</p>}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {saving ? "Adding..." : "Add Branch"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}