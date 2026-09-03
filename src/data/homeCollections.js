// src/data/homeCollections.js
export const STATUS_STEPS = ["Requested", "Assigned", "En Route", "Collected", "Processing", "Report Ready", "Sent"];

export const homeCollections = [
  {
    id: "HC1003",
    patient: { name: "Karunakaran", regNo: "20018482", age: 85, gender: "Male" },
    status: "Requested",
    slot: "05 Aug 2026 · Mid-day · 11 AM–1 PM",
    distance: "8.1 km from lab",
    address: "Kunnamangalam Bypass, near Govt School",
    payment: "Card · Pending (pay via POS)",
    collectionCharge: 531,
    sampleBarcode: null,
    technician: null,
    linkedOrderId: null,
    tests: [
      { id: "tsh", name: "TSH", category: "Hormone", unit: "µIU/ml", range: "0.4-4.0", price: 250 },
      { id: "t3", name: "T3", category: "Hormone", unit: "ng/dl", range: "80-200", price: 250 },
    ],
  },
  {
    id: "HC1002",
    patient: { name: "Damodharan", regNo: "20018481", age: 58, gender: "Male" },
    status: "Processing",
    slot: "04 Aug 2026 · Evening · 4–6 PM",
    distance: "2.6 km from lab",
    address: "Near Municipal Office, Mavoor Road",
    payment: "Cash · Pending (collect on visit)",
    collectionCharge: 200,
    sampleBarcode: "SR-HC-HC1002",
    technician: { name: "Ravi Menon", location: "Kozhikode Town", rating: 4.8, otp: "7734" },
    linkedOrderId: "28339",
    tests: [
      { id: "hb", name: "Hemoglobin", category: "Hematology", unit: "g/dl", range: "13-17", price: 50 },
      { id: "wbc", name: "Total WBC Count", category: "Hematology", unit: "cells/cumm", range: "4000-11000", price: 60 },
      { id: "plt", name: "Platelet Count", category: "Hematology", unit: "lakhs/cumm", range: "1.5-4.5", price: 90 },
    ],
  },
  {
    id: "HC1001",
    patient: { name: "Omana", regNo: "20018480", age: 62, gender: "Female" },
    status: "Report Ready",
    slot: "04 Aug 2026 · Morning · 7–9 AM",
    distance: "1.4 km from lab",
    address: "12/45, Beach Road, Kozhikode",
    payment: "UPI · Paid (simulated)",
    collectionCharge: 50,
    sampleBarcode: "SR-HC-HC1001",
    technician: { name: "Anjali Nair", location: "Mavoor Road", rating: 4.9, otp: "4821" },
    linkedOrderId: "28336",
    tests: [
      { id: "fbs", name: "Fasting Blood Sugar", category: "Biochemistry", unit: "mg/dl", range: "70-110", price: 30 },
      { id: "hb", name: "Hemoglobin", category: "Hematology", unit: "g/dl", range: "13-17", price: 50 },
      { id: "tsh", name: "TSH", category: "Hormone", unit: "µIU/ml", range: "0.4-4.0", price: 250 },
      { id: "chol", name: "Total Cholesterol", category: "Biochemistry", unit: "mg/dl", range: "<200", price: 80 },
    ],
  },
];

export function findHomeCollectionById(id) {
  return homeCollections.find((hc) => hc.id === id) || null;
}