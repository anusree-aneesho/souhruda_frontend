// src/components/Settings/SettingsForm/SettingsForm.jsx
import { useState } from "react";
import FormField from "./FormField";

const initialState = {
  labName: "SOUHRUDA MEDICAL CENTRE",
  address: "Kozhikode, Kerala",
  regNoPrefix: "2001",
  orderNoStart: "28340",
  whatsappNumber: "+91 9xxxxxxxxx",
  homeVisitFee: "50",
  freeRadius: "5",
};

export default function SettingsForm() {
  const [formData, setFormData] = useState(initialState);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    // TODO: wire to API
    console.log("Saving settings:", formData);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] max-w-2xl space-y-5"
    >
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
        className="rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
      >
        Save Settings
      </button>
    </form>
  );
}