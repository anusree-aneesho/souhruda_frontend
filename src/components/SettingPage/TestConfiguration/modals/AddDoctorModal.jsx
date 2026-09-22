import { useState } from "react";
import { createDoctorApi, updateDoctorApi } from "../../../../api/api";

export default function AddDoctorModal({ doctor, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: doctor?.name || "",
    registration_no: doctor?.registration_no || "",
    specialization: doctor?.specialization || "",
    phone: doctor?.phone || "",
    email: doctor?.email || "",
    address: doctor?.address || "",
    hospital_clinic: doctor?.hospital_clinic || "",
    notes: doctor?.notes || "",
    qualifications:
      doctor?.qualifications?.map((q) => q.qualification).join(", ") || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (doctor) {
        await updateDoctorApi(doctor.id, form);
      } else {
        await createDoctorApi(form);
      }
      onSaved();
    } catch (err) {
      setError(err.message || "Failed to save doctor.");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-8 pb-2">
          <h3 className="text-xl font-bold text-gray-900">
            {doctor ? "Edit Doctor" : "Add Doctor"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ×
          </button>
        </div>

        {error && (
          <p className="text-red-500 text-sm px-8 pt-2">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="px-8 pb-8 pt-4 space-y-5">
          <div>
            <label className={labelClass}>Full Name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Doctor name"
              required
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Registration No.</label>
              <input
                name="registration_no"
                value={form.registration_no}
                onChange={handleChange}
                placeholder="e.g. KMC-12345"
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="10-digit number"
                required
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Qualifications</label>
              <input
                name="qualifications"
                value={form.qualifications}
                onChange={handleChange}
                placeholder="MBBS, MD"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Specialization</label>
              <input
                name="specialization"
                value={form.specialization}
                onChange={handleChange}
                placeholder="Cardiology"
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Email</label>
              <input
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="doctor@email.com"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Hospital / Clinic</label>
              <input
                name="hospital_clinic"
                value={form.hospital_clinic}
                onChange={handleChange}
                placeholder="Hospital or clinic name"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Address</label>
            <textarea
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="Address"
              rows={2}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Notes</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Any additional notes"
              rows={2}
              className={inputClass}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-sm rounded-lg border border-gray-300 font-medium text-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 text-sm rounded-lg bg-teal-600 text-white font-medium disabled:opacity-50"
            >
              {saving ? "Saving..." : doctor ? "Save Changes" : "Add Doctor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}