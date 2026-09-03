// src/data/labOrders.js
export const labOrders = [
  {
    orderId: "28342",
    patient: { regNo: "20018483", name: "Suma Raj", age: 34, gender: "Female" },
    orderedAt: "04 Aug 2026 at 9:35 AM",
    paymentDone: true,
    tests: [
      { id: "hb", name: "Hemoglobin", category: "Hematology", unit: "g/dl", range: "13-17", price: 50, result: "13.5" },
      { id: "wbc", name: "Total WBC Count", category: "Hematology", unit: "cells/cumm", range: "4000-11000", price: 60, result: "7200" },
    ],
  },
  {
    orderId: "28341",
    patient: { regNo: "20018481", name: "Damodharan", age: 58, gender: "Male" },
    orderedAt: "04 Aug 2026 at 9:20 AM",
    paymentDone: false,
    tests: [
      { id: "fbs", name: "Fasting Blood Sugar", category: "Biochemistry", unit: "mg/dl", range: "70-110", price: 30, result: "118" },
    ],
  },
  {
    orderId: "28340",
    patient: { regNo: "20018480", name: "Omana", age: 62, gender: "Female" },
    orderedAt: "04 Aug 2026 at 9:05 AM",
    paymentDone: true,
    tests: [
      { id: "chol", name: "Total Cholesterol", category: "Biochemistry", unit: "mg/dl", range: "<200", price: 80, result: "175" },
    ],
  },
  {
    orderId: "28339",
    patient: { regNo: "20018481", name: "Damodharan", age: 58, gender: "Male" },
    orderedAt: "04 Aug 2026 at 8:52 AM",
    tests: [
      { id: "urea", name: "Blood Urea", category: "Biochemistry", unit: "mg/dl", range: "15-40", price: 60, result: "" },
      { id: "creat", name: "Serum Creatinine", category: "Biochemistry", unit: "mg/dl", range: "0.6-1.2", price: 70, result: "" },
      { id: "widal", name: "Widal Test", category: "Immunology", unit: "", range: "Negative", price: 150, result: "" },
    ],
  },
  {
    orderId: "28338",
    patient: { regNo: "20018482", name: "Karunakaran", age: 85, gender: "Male" },
    orderedAt: "04 Aug 2026 at 7:38 AM",
    tests: [
      { id: "urea", name: "Blood Urea", category: "Biochemistry", unit: "mg/dl", range: "15-40", price: 60, result: "45" },
      { id: "creat", name: "Serum Creatinine", category: "Biochemistry", unit: "mg/dl", range: "0.6-1.2", price: 70, result: "1.4" },
    ],
  },
  {
    orderId: "28337",
    patient: { regNo: "20018481", name: "Damodharan", age: 58, gender: "Male" },
    orderedAt: "04 Aug 2026 at 7:28 AM",
    tests: [
      { id: "widal", name: "Widal Test", category: "Immunology", unit: "", range: "Negative", price: 30, result: "Negative" },
    ],
  },
  {
    orderId: "28336",
    patient: { regNo: "20018480", name: "Omana", age: 62, gender: "Female" },
    orderedAt: "04 Aug 2026 at 7:15 AM",
    tests: [
      { id: "fbs", name: "Fasting Blood Sugar", category: "Biochemistry", unit: "mg/dl", range: "70-110", price: 30, result: "96" },
      { id: "hb", name: "Hemoglobin", category: "Hematology", unit: "g/dl", range: "13-17", price: 50, result: "12.8" },
      { id: "tsh", name: "TSH", category: "Hormone", unit: "µIU/ml", range: "0.4-4.0", price: 250, result: "2.1" },
      { id: "chol", name: "Total Cholesterol", category: "Biochemistry", unit: "mg/dl", range: "<200", price: 80, result: "188" },
    ],
  },
];

export function findOrderById(orderId) {
  return labOrders.find((o) => o.orderId === orderId) || null;
}