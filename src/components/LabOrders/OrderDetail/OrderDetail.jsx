// src/components/LabOrders/OrderDetail/OrderDetail.jsx
import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import OrderDetailHeader from "./OrderDetailHeader";
import ResultsTable from "./ResultsTable";
import ResultInsights from "./ResultInsights";
import { getOrderApi, saveOrderResultsApi, completeOrderApi } from "../../../api/api";
// import { calculateFlag } from "../../../utils/calculateFlag";

function mapOrder(o) {
  return {
    patient: {
      name: [o.patient?.first_name, o.patient?.last_name].filter(Boolean).join(" ") || "Unknown",
      age: o.patient?.age ?? "-",
      gender: o.patient?.gender ?? "-",
      regNo: o.patient?.patient_number ?? "-",
    },
    tests: (o.items || []).map((item) => {
      const lt = item.lab_test;
      const range =
        lt?.range_text ||
        (lt?.range_low != null && lt?.range_high != null
          ? `${lt.range_low} - ${lt.range_high}`
          : "-");

      return {
        id: item.id,
        name: lt?.name ?? "-",
        unit: lt?.unit ?? "",
        range,
        price: Number(item.price_at_order),
        result: item.result_value ?? "",
      };
    }),
    orderedAt: o.ordered_at,
    paymentDone: Boolean(o.payment_received),
  };
}

export default function OrderDetail() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [results, setResults] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);

    getOrderApi(orderId)
      .then((res) => {
        if (cancelled) return;
        const mapped = mapOrder(res.data);
        setOrder(mapped);
        setResults(Object.fromEntries(mapped.tests.map((t) => [t.id, t.result || ""])));
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err.message);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [orderId]);

  const patient = order?.patient || { name: "Unknown", age: "-", gender: "-", regNo: "-" };
  const tests = order?.tests || [];
  const orderedAt = order?.orderedAt || "-";
  const paymentDone = Boolean(order?.paymentDone);

  // const flags = useMemo(
  //   () => Object.fromEntries(tests.map((t) => [t.id, calculateFlag(t.range, results[t.id])])),
  //   [tests, results]
  // );

  const flags = useMemo(
    () => Object.fromEntries(tests.map((t) => [t.id, ""])),
    [tests]
  );

  function handleResultChange(id, value) {
    setResults((prev) => ({ ...prev, [id]: value }));
  }

  async function handleMarkCompleted() {
    setIsSaving(true);
    setSaveError(null);

    try {
      const resultsPayload = Object.entries(results).map(([itemId, value]) => ({
        order_item_id: Number(itemId),
        result_value: value || null,
      }));

      await completeOrderApi(orderId, resultsPayload);
      navigate(`/lab-orders/${orderId}/report`, { state: { patient, tests, orderedAt, results, paymentDone } });
    } catch (err) {
      setSaveError(err.message);
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <p className="text-sm text-gray-400 text-center py-10">Loading order…</p>;
  }

  if (loadError) {
    return <p className="text-sm text-red-500 text-center py-10">{loadError}</p>;
  }

  async function handleSaveClose() {
    setIsSaving(true);
    setSaveError(null);

    try {
      const resultsPayload = Object.entries(results).map(([itemId, value]) => ({
        order_item_id: Number(itemId),
        result_value: value || null,
      }));

      await saveOrderResultsApi(orderId, resultsPayload);
      navigate("/lab-orders");
    } catch (err) {
      setSaveError(err.message);
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6 ">
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
        onSaveClose={handleSaveClose}
        onMarkCompleted={handleMarkCompleted}
      />
      <ResultInsights tests={tests} flags={flags} />
    </div>
  );
}