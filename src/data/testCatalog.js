// src/data/testCatalog.js
export const categories = [
  { name: "Biochemistry", color: "teal" },
  { name: "Hematology", color: "pink" },
  { name: "Hormone", color: "purple" },
  { name: "Immunology", color: "amber" },
];

export const testsByCategory = {
  Biochemistry: [
    { id: "fbs", name: "Fasting Blood Sugar", unit: "mg/dl", range: "70-110", price: 30, lastResult: { date: "04 Aug 2026", value: "96" } },
    { id: "ppbs", name: "Post Prandial Blood Sugar", unit: "mg/dl", range: "70-140", price: 35 },
    { id: "chol", name: "Total Cholesterol", unit: "mg/dl", range: "<200", price: 80, lastResult: { date: "04 Aug 2026", value: "188" } },
    { id: "urea", name: "Blood Urea", unit: "mg/dl", range: "15-40", price: 60 },
    { id: "creat", name: "Serum Creatinine", unit: "mg/dl", range: "0.6-1.2", price: 70 },
  ],
  Hematology: [
    { id: "hb", name: "Hemoglobin", unit: "g/dl", range: "13-17", price: 50, lastResult: { date: "04 Aug 2026", value: "12.8" } },
    { id: "wbc", name: "Total WBC Count", unit: "cells/cumm", range: "4000-11000", price: 60 },
    { id: "plt", name: "Platelet Count", unit: "lakhs/cumm", range: "1.5-4.5", price: 90 },
  ],
  Hormone: [
    { id: "tsh", name: "TSH", unit: "µIU/ml", range: "0.4-4.0", price: 250, lastResult: { date: "04 Aug 2026", value: "2.1" } },
    { id: "t3", name: "T3", unit: "ng/dl", range: "80-200", price: 250 },
    { id: "t4", name: "T4", unit: "µg/dl", range: "5.1-14.1", price: 250 },
  ],
  Immunology: [
    { id: "widal", name: "Widal Test", unit: "", range: "Negative", price: 150, lastResult: { date: "04 Aug 2026", value: "Positive" } },
    { id: "hiv", name: "HIV I & II", unit: "", range: "Non-reactive", price: 200 },
  ],
};