// src/components/Settings/SettingsForm/SettingsForm.jsx
import { useState, useEffect } from "react";
import FormField from "./FormField";
import { getSettingsApi, updateSettingsApi } from "../../../api/api";

export default function SettingsForm() {
  const [formData, setFormData] = useState(null);
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
          regNoPrefix: s.reg_no_prefix || "",
          orderNoStart: s.order_no_start ?? "",
          whatsappNumber: s.whatsapp_number || "",
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
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);

    try {
      await updateSettingsApi({
        lab_name: formData.labName,
        address: formData.address,
        reg_no_prefix: formData.regNoPrefix,
        order_no_start: Number(formData.orderNoStart) || 0,
        whatsapp_number: formData.whatsappNumber,
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

  if (loading) {
    return <p className="text-sm text-gray-500">Loading settings...</p>;
  }

  if (!formData) {
    return <p className="text-sm text-red-500">{error || "Unable to load settings."}</p>;
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] max-w-2xl space-y-5"
    >
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      {success && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          Settings saved successfully.
        </p>
      )}

      <FormField
        label="Lab Name"
        name="labName"
        value={formData.labName}
        onChange={handleChange}
      />

      <FormField
        label="Address"
        name="address"
        value={formData.address}
        onChange={handleChange}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <FormField
          label="Reg. No. Prefix"
          name="regNoPrefix"
          value={formData.regNoPrefix}
          onChange={handleChange}
        />
        <FormField
          label="Order No. Start"
          name="orderNoStart"
          value={formData.orderNoStart}
          onChange={handleChange}
        />
      </div>

      <FormField
        label="WhatsApp Sender Number"
        name="whatsappNumber"
        value={formData.whatsappNumber}
        onChange={handleChange}
        placeholder="+91 9xxxxxxxxx"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <FormField
          label="Home Visit Fee (₹)"
          name="homeVisitFee"
          type="number"
          value={formData.homeVisitFee}
          onChange={handleChange}
        />
        <FormField
          label="Free Radius (km)"
          name="freeRadius"
          type="number"
          value={formData.freeRadius}
          onChange={handleChange}
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-700 transition-colors disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save Settings"}
      </button>
    </form>
  );
}