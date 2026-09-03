// src/components/LabOrders/OrderDetail/OrderDetail.jsx
import { useState, useMemo } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import OrderDetailHeader from "./OrderDetailHeader";
import ResultsTable from "./ResultsTable";
import ResultInsights from "./ResultInsights";
import { findOrderById } from "../../../data/labOrders";
import { calculateFlag } from "../../../utils/calculateFlag";

export default function OrderDetail() {
  const { orderId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();

  const existingOrder = findOrderById(orderId);
  const order = existingOrder || (state ? { orderId, ...state } : null);

  const patient = order?.patient || { name: "Unknown", age: "-", gender: "-", regNo: "-" };
  const tests = order?.tests || [];
  const orderedAt = order?.orderedAt || "-";
  const paymentDone = Boolean(order?.paymentDone);

  const [results, setResults] = useState(() =>
    Object.fromEntries(tests.map((t) => [t.id, t.result || ""]))
  );

  const flags = useMemo(
    () => Object.fromEntries(tests.map((t) => [t.id, calculateFlag(t.range, results[t.id])])),
    [tests, results]
  );

  function handleResultChange(id, value) {
    setResults((prev) => ({ ...prev, [id]: value }));
  }

  function handleMarkCompleted() {
    navigate(`/lab-orders/${orderId}/report`, { state: { patient, tests, orderedAt, results, paymentDone } });
  }

  return (
    <div className="space-y-6">
      <OrderDetailHeader
        patientName={patient.name}
        orderId={orderId}
        regNo={patient.regNo}
        age={patient.age}
        gender={patient.gender}
        orderedAt={orderedAt}
        onDelete={() => navigate("/lab-orders")}
      />
      <ResultsTable
        tests={tests}
        results={results}
        flags={flags}
        onResultChange={handleResultChange}
        onSaveClose={() => navigate("/lab-orders")}
        onMarkCompleted={handleMarkCompleted}
      />
      <ResultInsights tests={tests} flags={flags} />
    </div>
  );
}