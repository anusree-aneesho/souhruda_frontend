// src/components/LabOrders/OrderDetail/OrderDetail.jsx
import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import OrderDetailHeader from "./OrderDetailHeader";
import ResultsTable from "./ResultsTable";
import ResultInsights from "./ResultInsights";
import Toast from "../../common/Toast/Toast";
import { useToast } from "../../common/Toast/useToast";
import ConfirmModal from "../../Patients/modals/ConfirmModal";
import AlertModal from "../../common/Modal/AlertModal";
import { getOrderApi, saveOrderResultsApi, completeOrderApi, deleteOrderApi } from "../../../api/api";
import { calculateFlag } from "../../../utils/calculateFlag";
import ConfirmCompleteOrderModal from "./ConfirmCompleteOrderModal";

function mapOrder(o) {
  return {
    patient: {
      name: [o.patient?.first_name, o.patient?.last_name].filter(Boolean).join(" ") || "Unknown",
      age: o.patient?.age ?? "-",
      gender: o.patient?.gender ?? "-",
      regNo: o.patient?.patient_number ?? "-",
       phone: o.patient?.phone ?? "",
    },
    tests: (o.items || []).map((item) => {
      const lt = item.lab_test;
      const range =
        item.resolved_range_text ||
        (item.resolved_range_low != null && item.resolved_range_high != null
          ? `${item.resolved_range_low} - ${item.resolved_range_high}`
          : "-");

    return {
  id: item.id,
  name: lt?.name ?? "-",
  unit: lt?.unit ?? "",
  category: lt?.category?.name ?? "General",
  range,
  rangeLow: item.resolved_range_low != null ? Number(item.resolved_range_low) : null,
  rangeHigh: item.resolved_range_high != null ? Number(item.resolved_range_high) : null,
  price: Number(item.price_at_order),
  result: item.result_value ?? "",
  // Which package (if any) this test was actually billed under — set
  // server-side at order creation (OrderService::priceTests()), not
  // re-detected here, so it always matches what the patient was charged.
  packageId: item.test_package_id ?? null,
  packageName: item.test_package?.name ?? null,
  packagePrice: item.test_package ? Number(item.test_package.price) : null,
};
    }),
    orderedAt: o.ordered_at,
    paymentDone: Boolean(o.payment_received),
    referredBy: o.referred_by || "Self",
    // Authoritative total the patient is actually billed, computed and
    // stored server-side — never re-summed from individual test prices,
    // so it stays correct when a package discount applied.
    billTotal: o.bill_total != null ? Number(o.bill_total) : null,
  };
}

export default function OrderDetail() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast, showToast, hideToast } = useToast();

  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [results, setResults] = useState({});
  const [savingAction, setSavingAction] = useState(null); 
  const [saveError, setSaveError] = useState(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const [confirmingComplete, setConfirmingComplete] = useState(false);

  // NewOrderModal navigates here with { justCreated: true, patient } right
  // after "Create Order" succeeds — same pattern as Home Collection's
  // justBooked. Show the confirmation once, then clear the state so a
  // later back-navigation or manual refresh doesn't re-fire it.
  useEffect(() => {
    if (location.state?.justCreated) {
      showToast(`Order #${orderId} created for ${location.state.patient?.name || "patient"}`);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate, orderId, showToast]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);

    getOrderApi(orderId)
      .then((res) => {
        if (cancelled) return;
        const mapped = mapOrder(res.data);

        if (res.data.status === "completed") {
          navigate(`/lab-orders/${orderId}/report`, {
            replace: true,
            state: {
              patient: mapped.patient,
              tests: mapped.tests,
              orderedAt: mapped.orderedAt,
              results: Object.fromEntries(mapped.tests.map((t) => [t.id, t.result || ""])),
              paymentDone: mapped.paymentDone,
              referredBy: mapped.referredBy,
              billTotal: mapped.billTotal,
            },
          });
          return;
        }

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
  const billTotal = order?.billTotal;

  function formatOrderedAt(raw) {
    if (!raw || raw === "-") return "-";
    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) return raw;
    return parsed.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const formattedOrderedAt = formatOrderedAt(orderedAt);

  const flags = useMemo(
    () => Object.fromEntries(tests.map((t) => [t.id, calculateFlag(t.range, results[t.id])])),
    [tests, results]
  );

  function handleResultChange(id, value) {
    setResults((prev) => ({ ...prev, [id]: value }));
  }

  async function handleMarkCompleted() {
  setSavingAction("complete");
  setSaveError(null);

  try {
    const resultsPayload = Object.entries(results).map(([itemId, value]) => ({
      order_item_id: Number(itemId),
      result_value: value || null,
    }));

    await completeOrderApi(orderId, resultsPayload);
    navigate(`/lab-orders/${orderId}/report`, {
      state: { patient, tests, orderedAt, results, paymentDone, referredBy: order?.referredBy || "Self", billTotal }
    });
  } catch (err) {
    setSaveError(err.message);
    setSavingAction(null);
  }
}

  if (isLoading) {
    return <p className="text-sm text-gray-400 text-center py-10">Loading order…</p>;
  }

  if (loadError) {
    return <p className="text-sm text-red-500 text-center py-10">{loadError}</p>;
  }

  async function handleSaveClose() {
    setSavingAction("close");
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
      setSavingAction(null);
    }
  }

  async function handleDelete() {
    setConfirmingDelete(false);

    try {
      await deleteOrderApi(orderId);
      navigate("/lab-orders", { state: { justDeleted: { orderId, patientName: patient.name } } });
    } catch (err) {
      setDeleteError(err.message || "Couldn't delete this order.");
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
        orderedAt={formattedOrderedAt}
        onDelete={() => setConfirmingDelete(true)}
      />
      <ResultsTable
      tests={tests}
      billTotal={billTotal}
      results={results}
      flags={flags}
      onResultChange={handleResultChange}
      onSaveClose={handleSaveClose}
      onMarkCompleted={() => setConfirmingComplete(true)}
      savingAction={savingAction}
      />
      <ResultInsights tests={tests} flags={flags} />

      {confirmingComplete && (
        <ConfirmCompleteOrderModal
          tests={tests}
          results={results}
          flags={flags}
          onResultChange={handleResultChange}
          isSaving={savingAction === "complete"}
          onConfirm={async () => {
          await handleMarkCompleted();
          setConfirmingComplete(false);
          }}
         onClose={() => setConfirmingComplete(false)}
        />
      )}

      {confirmingDelete && (
        <ConfirmModal
          title="Cancel Order"
          message="Delete this order? This cannot be undone from here."
          confirmLabel="Delete Order"
          cancelLabel="Keep Order"
          danger
          onConfirm={handleDelete}
          onClose={() => setConfirmingDelete(false)}
        />
      )}

      {deleteError && (
        <AlertModal title="Couldn't Delete" message={deleteError} onClose={() => setDeleteError(null)} />
      )}

      {saveError && (
        <AlertModal title="Couldn't Save" message={saveError} onClose={() => setSaveError(null)} />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  );
}