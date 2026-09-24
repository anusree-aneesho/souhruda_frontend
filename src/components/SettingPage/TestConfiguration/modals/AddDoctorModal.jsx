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
  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validate = (values) => {
    const errors = {};

    if (!values.name.trim()) {
      errors.name = "Full name is required.";
    } else if (!/^[A-Za-z\s]+$/.test(values.name.trim())) {
      errors.name = "Name can only contain letters.";
    }

    if (
      values.qualifications.trim() &&
      !/^[A-Za-z\s.,]+$/.test(values.qualifications.trim())
    ) {
      errors.qualifications =
        "Only letters, commas, and periods are allowed.";
    }

    if (
      values.specialization.trim() &&
      !/^[A-Za-z\s.,]+$/.test(values.specialization.trim())
    ) {
      errors.specialization =
        "Only letters, commas, and periods are allowed.";
    }

    if (!values.registration_no.trim()) {
      errors.registration_no = "Registration number is required.";
    } else if (!/^[A-Za-z0-9/-]+$/.test(values.registration_no.trim())) {
      errors.registration_no =
        "Use only letters, numbers, hyphens, and slashes.";
    }

    if (!values.phone.trim()) {
      errors.phone = "Phone number is required.";
    } else if (!/^[6-9]\d{9}$/.test(values.phone.trim())) {
      errors.phone = "Enter a valid 10-digit phone number.";
    }

    if (values.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
      errors.email = "Enter a valid email address.";
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const errors = validate(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        name: form.name.trim(),
        registration_no: form.registration_no.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
      };
      if (doctor) {
        const updated = await updateDoctorApi(doctor.id, payload);
        onSaved(updated, true);
      } else {
        const created = await createDoctorApi(payload);
        onSaved(created, false);
      }
    } catch (err) {
      const apiErrors = err.errors;
      if (apiErrors) {
        setFieldErrors(
          Object.fromEntries(
            Object.entries(apiErrors).map(([k, v]) => [
              k,
              Array.isArray(v) ? v[0] : v,
            ])
          )
        );
      }
      setError(err.message || "Failed to save doctor.");
    } finally {
      setSaving(false);
    }
  };

  const inputClass = (field) =>
    `w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 ${
      fieldErrors[field]
        ? "border-red-400 focus:ring-red-400 focus:border-red-400"
        : "border-gray-300 focus:ring-teal-500 focus:border-teal-500"
    }`;
  const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";
  const errorClass = "text-red-500 text-xs mt-1";

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
              className={inputClass("name")}
            />
            {fieldErrors.name && <p className={errorClass}>{fieldErrors.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Registration No.</label>
              <input
                name="registration_no"
                value={form.registration_no}
                onChange={handleChange}
                placeholder="e.g. KMC-12345"
                className={inputClass("registration_no")}
              />
              {fieldErrors.registration_no && (
                <p className={errorClass}>{fieldErrors.registration_no}</p>
              )}
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="10-digit number"
                maxLength={10}
                inputMode="numeric"
                className={inputClass("phone")}
              />
              {fieldErrors.phone && <p className={errorClass}>{fieldErrors.phone}</p>}
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
                className={inputClass("qualifications")}
              />
              {fieldErrors.qualifications && (
                <p className={errorClass}>{fieldErrors.qualifications}</p>
              )}
            </div>
            <div>
              <label className={labelClass}>Specialization</label>
              <input
                name="specialization"
                value={form.specialization}
                onChange={handleChange}
                placeholder="Cardiology"
                className={inputClass("specialization")}
              />
              {fieldErrors.specialization && (
                <p className={errorClass}>{fieldErrors.specialization}</p>
              )}
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
                className={inputClass("email")}
              />
              {fieldErrors.email && <p className={errorClass}>{fieldErrors.email}</p>}
            </div>
            <div>
              <label className={labelClass}>Hospital / Clinic</label>
              <input
                name="hospital_clinic"
                value={form.hospital_clinic}
                onChange={handleChange}
                placeholder="Hospital or clinic name"
                className={inputClass("hospital_clinic")}
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
              className={inputClass("address")}
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
              className={inputClass("notes")}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="px-6 py-2.5 text-sm rounded-lg border border-gray-300 font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Cancel
            </button>
            <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 text-sm rounded-lg bg-teal-600 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {saving ? "Saving..." : doctor ? "Save Changes" : "Add Doctor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}