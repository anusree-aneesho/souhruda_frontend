import { useState, useEffect } from "react";
import FormField from "./FormField";
import { getSettingsApi, updateSettingsApi } from "../../../api/api";

function validate(formData) {
  const errors = {};

  if (!formData.labName.trim()) errors.labName = "Lab name is required.";
  if (!formData.address.trim()) errors.address = "Address is required.";

  if (formData.pincode && !/^\d{6}$/.test(formData.pincode)) {
    errors.pincode = "Pincode must be 6 digits.";
  }
  if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errors.email = "Enter a valid email address.";
  }
  if (formData.phone && !/^[0-9\s\-+()]{7,20}$/.test(formData.phone)) {
    errors.phone = "Enter a valid phone number.";
  }
  if (formData.whatsappNumber && !/^\+?[0-9\s]{10,15}$/.test(formData.whatsappNumber)) {
    errors.whatsappNumber = "Enter a valid WhatsApp number.";
  }
  if (formData.website && !/^https?:\/\/.+\..+/.test(formData.website)) {
    errors.website = "Website must start with http:// or https://.";
  }
  if (formData.homeVisitFee !== "" && Number(formData.homeVisitFee) < 0) {
    errors.homeVisitFee = "Fee cannot be negative.";
  }
  if (formData.freeRadius !== "" && Number(formData.freeRadius) < 0) {
    errors.freeRadius = "Radius cannot be negative.";
  }

  return errors;
}

export default function SettingsForm() {
  const [formData, setFormData] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await getSettingsApi();
        const s = res.data;
        setFormData({
          labName: s.lab_name || "",
          address: s.address || "",
          city: s.city || "",
          state: s.state || "",
          pincode: s.pincode || "",
          regNoPrefix: s.reg_no_prefix || "",
          orderNoStart: s.order_no_start ?? "",
          whatsappNumber: s.whatsapp_number || "",
          phone: s.phone || "",
          email: s.email || "",
          website: s.website || "",
          licenseNo: s.license_no || "",
          workingHours: s.working_hours || "",
          footerNote: s.footer_note || "",
          homeVisitFee: s.home_visit_fee ?? "",
          freeRadius: s.free_radius ?? "",
        });
      } catch (err) {
        setError(err.message || "Failed to load settings.");
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    const errors = validate(formData);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError("Please fix the errors below before saving.");
      return;
    }
    setFieldErrors({});
    setSaving(true);

    try {
      await updateSettingsApi({
        lab_name: formData.labName,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        reg_no_prefix: formData.regNoPrefix,
        order_no_start: Number(formData.orderNoStart) || 0,
        whatsapp_number: formData.whatsappNumber,
        phone: formData.phone,
        email: formData.email,
        website: formData.website,
        license_no: formData.licenseNo,
        working_hours: formData.workingHours,
        footer_note: formData.footerNote,
        home_visit_fee: Number(formData.homeVisitFee) || 0,
        free_radius: Number(formData.freeRadius) || 0,
      });
      setSuccess(true);
    } catch (err) {
      setError(err.message || "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-gray-500">Loading settings...</p>;
  if (!formData) return <p className="text-sm text-red-500">{error || "Unable to load settings."}</p>;

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] max-w-2xl space-y-5"
    >
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}
      {success && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          Settings saved successfully.
        </p>
      )}

      <FormField label="Lab Name" name="labName" value={formData.labName} onChange={handleChange} error={fieldErrors.labName} />
      <FormField label="Address" name="address" value={formData.address} onChange={handleChange} error={fieldErrors.address} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <FormField label="City" name="city" value={formData.city} onChange={handleChange} />
        <FormField label="State" name="state" value={formData.state} onChange={handleChange} />
        <FormField label="Pincode" name="pincode" value={formData.pincode} onChange={handleChange} error={fieldErrors.pincode} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <FormField label="Phone Number" name="phone" value={formData.phone} onChange={handleChange} placeholder="0495 xxxxxxx" error={fieldErrors.phone} />
        <FormField label="WhatsApp Sender Number" name="whatsappNumber" value={formData.whatsappNumber} onChange={handleChange} placeholder="+91 9xxxxxxxxx" error={fieldErrors.whatsappNumber} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <FormField label="Email Address" name="email" type="email" value={formData.email} onChange={handleChange} error={fieldErrors.email} />
        <FormField label="Website" name="website" value={formData.website} onChange={handleChange} placeholder="https://..." error={fieldErrors.website} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <FormField label="Reg. No. Prefix" name="regNoPrefix" value={formData.regNoPrefix} onChange={handleChange} />
        <FormField label="Order No. Start" name="orderNoStart" value={formData.orderNoStart} onChange={handleChange} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <FormField label="Lab License No." name="licenseNo" value={formData.licenseNo} onChange={handleChange} placeholder="NABL / ICMR / State License No." />
        <FormField label="Working Hours" name="workingHours" value={formData.workingHours} onChange={handleChange} placeholder="Mon-Sat, 7 AM - 8 PM" />
      </div>

      <div>
        <label htmlFor="footerNote" className="block text-sm font-semibold text-gray-900 mb-1.5">
          Report Footer Note / Disclaimer
        </label>
        <textarea
          id="footerNote"
          name="footerNote"
          rows={3}
          value={formData.footerNote}
          onChange={handleChange}
          placeholder="e.g. Reports are not valid for medico-legal purposes."
          className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <FormField label="Home Visit Fee (₹)" name="homeVisitFee" type="number" value={formData.homeVisitFee} onChange={handleChange} error={fieldErrors.homeVisitFee} />
        <FormField label="Free Radius (km)" name="freeRadius" type="number" value={formData.freeRadius} onChange={handleChange} error={fieldErrors.freeRadius} />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-700 transition-colors disabled:opacity-50 cursor-pointer"
      >
        {saving ? "Saving..." : "Save Settings"}
      </button>
    </form>
  );
}