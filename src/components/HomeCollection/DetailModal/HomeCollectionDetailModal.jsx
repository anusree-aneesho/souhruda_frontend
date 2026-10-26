// src/components/HomeCollection/DetailModal/HomeCollectionDetailModal.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Smartphone, Banknote, CreditCard } from "lucide-react";
import ModalShell from "../../common/Modal/ModalShell";
import ConfirmModal from "../../Patients/modals/ConfirmModal";
import AlertModal from "../../common/Modal/AlertModal";
import Toast from "../../common/Toast/Toast";
import { useToast } from "../../common/Toast/useToast";
import { formatNameWithTitle } from "../../Patients/patientTitles";
import StatusStepper from "./StatusStepper";
import RequestInfoBar from "./RequestInfoBar";
import TrackingMap from "./TrackingMap";
import AssignTechnicianModal from "./AssignTechnicianModal";
import PrintLabelModal from "./PrintLabelModal";
import { useHomeCollectionModal } from "../../../Context/HomeCollectionModalContext";
import QrCode from "../../common/QrCode";
import {
  getHomeCollectionRequestApi,
  updateHomeCollectionStatusApi,
  resolveHomeCollectionOrderApi,
  markOrderPaidApi,
} from "../../../api/api";

function formatStatus(status) {
  return (status || "")
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// Returns "" when no mode is recorded (payment is taken later)
function formatPaymentMode(mode) {
  if (mode === "upi") return "UPI";
  if (mode === "cash") return "Cash";
  if (mode === "card") return "Card";
  return "";
}

function formatPaymentStatus(status) {
  return status ? status.charAt(0).toUpperCase() + status.slice(1) : "";
}

const rs = (n) => `Rs. ${Number(n || 0).toFixed(2)}`;
const fmt = (n) => `₹${Number(n || 0).toFixed(2)}`;

// Payment mode options for the Payment step
const PAYMENT_MODES = [
  { id: "UPI", label: "UPI", Icon: Smartphone },
  { id: "Cash", label: "Cash", Icon: Banknote },
  { id: "Card", label: "Card", Icon: CreditCard },
];

// The UPI / Cash / Card tabs
function PaymentModeTabs({ value, onChange }) {
  return (
    <div role="radiogroup" aria-label="Payment mode" className="flex gap-2">
      {PAYMENT_MODES.map(({ id, label, Icon }) => {
        const active = value === id;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${
              active ? "bg-teal-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        );
      })}
    </div>
  );
}

// DEMO QR: a fake pattern (not scannable). Replace with a real QR later.
const UPI_ID = "souhruda@upi";
const QR_SIZE = 11;

function demoQrCells(seedText) {
  let seed = 0;
  for (const ch of String(seedText)) seed = (seed * 31 + ch.charCodeAt(0)) % 100000;
  const next = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  const cells = [];
  for (let r = 0; r < QR_SIZE; r++) {
    for (let c = 0; c < QR_SIZE; c++) {
      // solid corner squares so it looks like a QR
      const inCorner =
        (r < 3 && c < 3) || (r < 3 && c >= QR_SIZE - 3) || (r >= QR_SIZE - 3 && c < 3);
      cells.push(inCorner ? true : next() > 0.5);
    }
  }
  return cells;
}

function DemoQr({ seed }) {
  const cells = demoQrCells(seed);
  return (
    <div
      className="grid gap-px bg-white p-2 rounded"
      style={{ gridTemplateColumns: `repeat(${QR_SIZE}, 1fr)`, width: 176, height: 176 }}
    >
      {cells.map((on, i) => (
        <div key={i} className={on ? "bg-gray-900" : "bg-white"} />
      ))}
    </div>
  );
}

// QR only (the "Payment already received" checkbox lives in the modal, for all modes)
function UpiPanel({ amount }) {
  const upiLink = `upi://pay?pa=${UPI_ID}&pn=Souhruda&am=${Number(amount || 0).toFixed(2)}&cu=INR`;
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 px-5 py-6 flex flex-col items-center">
      <QrCode value={upiLink} size={176} />
      <p className="mt-4 text-sm font-semibold text-gray-900">Scan to pay {fmt(amount)}</p>
      <p className="mt-1 text-xs text-gray-400">{UPI_ID}</p>
    </div>
  );
}

// Tests list + full payment breakdown, same layout as the bill
function BillSection({ hc }) {
  const isPercentage = hc.discountType === "percentage";

  return (
    <div>
      <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-1">
        <span className="text-xs font-medium text-gray-400 tracking-wide">ITEM</span>
        <span className="text-xs font-medium text-gray-400 tracking-wide">AMOUNT</span>
      </div>

      {hc.tests.map((t) => (
        <div
          key={t.id}
          className="flex items-center justify-between gap-4 py-2 border-b border-gray-50 text-sm"
        >
          <span className="text-gray-900 min-w-0 break-words">{t.name}</span>
          <span className="text-gray-700 shrink-0">{rs(t.price)}</span>
        </div>
      ))}

      <div className="mt-3 space-y-1 text-sm text-gray-600">
        <div className="flex justify-between">
          <span>Tests total</span>
          <span>{rs(hc.testsTotal)}</span>
        </div>
        {hc.discountAmount > 0 && (
          <div className="flex justify-between text-green-700">
            <span>Discount{isPercentage ? ` (${hc.discountValue}%)` : ""}</span>
            <span>− {rs(hc.discountAmount)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Home visit fee</span>
          <span>{rs(hc.collectionCharge)}</span>
        </div>
      </div>

      {hc.gstRate > 0 && (
        <div className="mt-3 space-y-1 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{rs(hc.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>GST ({hc.gstRate}%)</span>
            <span>{rs(hc.gstAmount)}</span>
          </div>
        </div>
      )}

      <div
        className={`flex items-center justify-between rounded-lg px-4 py-3 mt-3 ${
          hc.isPaid ? "bg-green-50" : "bg-teal-50"
        }`}
      >
        <span className={`text-sm font-medium ${hc.isPaid ? "text-green-700" : "text-teal-700"}`}>
          {hc.isPaid ? "Paid" : "Total payable"}
        </span>
        <span className={`text-lg font-bold ${hc.isPaid ? "text-green-700" : "text-teal-700"}`}>
          {rs(hc.grandTotal)}
        </span>
      </div>
    </div>
  );
}

// API response shape -> the shape RequestInfoBar / StatusStepper / BillSection expect
function mapDetail(r) {
  return {
    id: r.hc_code,
    patient: r.patient
      ? { ...r.patient, name: formatNameWithTitle(r.patient.title, r.patient.name) }
      : { name: "—" },
    status: formatStatus(r.status),
    referredBy: r.referred_by || "—",
    slot: [r.slot_date, r.slot_label].filter(Boolean).join(" · "),
    distance: r.distance_km != null ? `${r.distance_km} km from lab` : "—",
    address: r.address_line,
    payment: [formatPaymentMode(r.payment_mode), formatPaymentStatus(r.payment_status)]
      .filter(Boolean)
      .join(" · "),
    collectionCharge: r.collection_charge || 0,
    sampleBarcode: r.barcode,
    technician: r.technician
      ? {
          ...r.technician,
          name: formatNameWithTitle(r.technician.title, r.technician.name),
          location: r.technician.zone,
          otp: r.debug_otp,
        }
      : null,
    otpReady: r.otp_ready ?? false,
    otpLocked: r.otp_locked ?? false,
    assignable: r.assignable ?? true,
    slotDate: r.slot_date,
    linkedOrderId: r.order_no || null,
    tests: r.tests || [],
    testsTotal: r.tests_total,
    grandTotal: r.grand_total,
    discountType: r.discount_type,
    discountValue: Number(r.discount_value) || 0,
    discountAmount: Number(r.discount_amount) || 0,
    subtotal: Number(r.subtotal) || 0,
    gstRate: Number(r.gst_rate) || 0,
    gstAmount: Number(r.gst_amount) || 0,
    isPaid: r.payment_status === "paid",
  };
}

export default function HomeCollectionDetailModal() {
  const { activeId, close } = useHomeCollectionModal();
  const navigate = useNavigate();

  const [baseHc, setBaseHc] = useState(null);
  const [localHc, setLocalHc] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isAssignOpen, setAssignOpen] = useState(false);
  const [isLabelOpen, setLabelOpen] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [cancelError, setCancelError] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [isPaying, setIsPaying] = useState(false);
  // Ticked = staff confirm the money was received (UPI, Cash or Card)
  const [paymentReceived, setPaymentReceived] = useState(false);
  // true = staff continued without recording payment (request stays Unpaid)
  const [paymentDeferred, setPaymentDeferred] = useState(false);
  // "details" = normal popup, "payment" = the separate Payment page
  const [view, setView] = useState("details");
  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    if (!activeId) {
      setBaseHc(null);
      setLocalHc(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError("");
    setPaymentMethod("Cash");
    setPaymentReceived(false);
    setPaymentDeferred(false);
    setView("details");

    (async () => {
      try {
        const data = await getHomeCollectionRequestApi(activeId);
        if (!cancelled) {
          setBaseHc(mapDetail(data));
          setLocalHc(null);
        }
      } catch (err) {
        if (!cancelled) setError(err.message || "Couldn't load this request.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeId]);

  const hc = localHc || baseHc;

  if (!activeId) return null;

  // Sample is collected, payment not recorded, and staff haven't chosen to continue unpaid.
  const needsPayment = hc?.status === "Collected" && !hc?.isPaid && !paymentDeferred;
  // Difference between the listed test prices and the billed tests total (package price)
  const listedAdjustment = hc
    ? Number(hc.testsTotal || 0) - hc.tests.reduce((sum, t) => sum + Number(t.price || 0), 0)
    : 0;

  function handleAssign(updated) {
    setBaseHc(mapDetail(updated));
    setLocalHc(null);
    setAssignOpen(false);
    showToast(`${updated.hc_code} assigned to ${updated.technician?.name || "technician"}`);
  }

  async function handleCancel() {
    setConfirmingCancel(false);

    try {
      const updated = await updateHomeCollectionStatusApi(hc.id, "cancelled");
      setBaseHc(mapDetail(updated));
      setLocalHc(null);
      showToast(`${hc.id} cancelled for ${hc.patient?.name || "patient"}`);
    } catch (err) {
      setCancelError(err.message || "Couldn't cancel this request.");
    }
  }

  async function handleMarkEnRoute() {
    try {
      const updated = await updateHomeCollectionStatusApi(hc.id, "en_route");
      setBaseHc(mapDetail(updated));
      setLocalHc(null);
      showToast(`${hc.id} marked En Route`);
    } catch (err) {
      alert(err.message || "Couldn't update status.");
    }
  }

  async function handleConfirmCollected() {
    if (!otpInput.trim()) {
      alert("Enter the OTP from the patient first.");
      return;
    }

    try {
      // No payment is taken at collection; payment is recorded on the Payment step.
      const updated = await updateHomeCollectionStatusApi(hc.id, "collected", otpInput.trim(), false);
      setBaseHc(mapDetail(updated));
      setLocalHc(null);
      setOtpInput("");
      showToast(`${hc.id} marked Collected`);
    } catch (err) {
      alert(err.message || "Couldn't confirm sample collection.");
    }
  }

  // Ticked   -> records the payment (UPI / Cash / Card) and marks Paid.
  // Unticked -> saves nothing, request stays Unpaid, but the process continues.
  async function handleConfirmPayment() {
    if (!paymentReceived) {
      setPaymentDeferred(true);
      setView("details");
      showToast(`${hc.id} continues as Unpaid`);
      return;
    }

    setIsPaying(true);
    try {
      const orderNo = hc.linkedOrderId || (await resolveHomeCollectionOrderApi(hc.id)).order_no;
      await markOrderPaidApi(orderNo, paymentMethod.toLowerCase());

      // Reload so the Paid badge, amount box and payment mode show what was really saved
      const fresh = await getHomeCollectionRequestApi(hc.id);
      setBaseHc(mapDetail(fresh));
      setLocalHc(null);
      setPaymentReceived(false);
      setPaymentDeferred(false);
      setView("details");
      showToast(`Payment received for ${hc.id}`);
    } catch (err) {
      alert(err.message || "Couldn't record the payment.");
    } finally {
      setIsPaying(false);
    }
  }

  async function handleMarkProcessing() {
    try {
      const updated = await updateHomeCollectionStatusApi(hc.id, "processing");
      setBaseHc(mapDetail(updated));
      setLocalHc(null);
      showToast(`${hc.id} marked Processing`);
    } catch (err) {
      alert(err.message || "Couldn't mark this as processing.");
    }
  }

  async function handleEnterResults() {
    try {
      // The linked order is auto-created server-side when the sample is collected,
      // so hc.linkedOrderId is normally set. resolveOrder is only a fallback.
      const orderId = hc.linkedOrderId || (await resolveHomeCollectionOrderApi(hc.id)).order_no;
      close();
      navigate(`/lab-orders/${orderId}`);
    } catch (err) {
      alert(err.message || "Couldn't open the lab order for this collection.");
    }
  }

  function handleOpenOrder() {
    close();
    navigate(`/lab-orders/${hc.linkedOrderId}`);
  }

  async function handleSendWhatsApp() {
    try {
      const updated = await updateHomeCollectionStatusApi(hc.id, "sent");
      setBaseHc(mapDetail(updated));
      setLocalHc(null);
      showToast(`Report sent to ${hc.patient.name} via WhatsApp`);
    } catch (err) {
      alert(err.message || "Couldn't send the report.");
    }
  }

  return (
    <>
      <ModalShell
        title={view === "payment" ? "Home Collection — Payment" : `Home Collection — ${activeId}`}
        onClose={close}
        maxWidth="max-w-4xl"
      >
        {isLoading && <p className="px-6 py-8 text-sm text-gray-400">Loading…</p>}
        {!isLoading && error && <p className="px-6 py-8 text-sm text-red-600">{error}</p>}

        {!isLoading && !error && hc && (
          <>
            {hc.status === "Cancelled" ? (
              <div className="mx-6 mt-4 flex items-start gap-3 rounded-lg border border-red-100 bg-red-50 px-4 py-3">
                <span className="text-lg leading-none">⛔</span>
                <div>
                  <p className="text-sm font-semibold text-red-700">This request was cancelled</p>
                  <p className="text-xs text-red-600/80 mt-0.5">
                    Cancelled before a technician was assigned. No collection will take place.
                  </p>
                </div>
              </div>
            ) : (
              <StatusStepper
                currentStatus={hc.status}
                paymentPending={needsPayment}
                paymentDone={hc.isPaid || paymentDeferred}
              />
            )}

            {view === "payment" && needsPayment ? (
              <>
                {/* Payment page */}
                <div className="px-6 py-5 space-y-4 max-h-[75vh] overflow-y-auto overflow-x-hidden w-full max-w-xl mx-auto">
                  <PaymentModeTabs
                    value={paymentMethod}
                    onChange={(mode) => {
                      setPaymentMethod(mode);
                      setPaymentReceived(false); // must tick again for the new mode
                    }}
                  />

                  <div className="rounded-xl bg-teal-50/60 px-5 py-4 space-y-2.5 text-sm">
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                        Tests ({hc.tests.length})
                      </p>
                      {hc.tests.map((t) => (
                        <div key={t.id} className="flex justify-between gap-4 text-gray-600">
                          <span className="truncate">{t.name}</span>
                          <span className="text-gray-800 shrink-0">{fmt(t.price)}</span>
                        </div>
                      ))}
                      {Math.abs(listedAdjustment) > 0.005 && (
                        <div className="flex justify-between text-gray-600">
                          <span>Package adjustment</span>
                          <span className="text-gray-800">
                            {listedAdjustment < 0 ? "− " : ""}
                            {fmt(Math.abs(listedAdjustment))}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between border-t border-teal-100 pt-1.5 text-gray-600">
                        <span>Tests total</span>
                        <span className="text-gray-800">{fmt(hc.testsTotal)}</span>
                      </div>
                    </div>

                    <div className="flex justify-between text-gray-600">
                      <span>Home visit fee</span>
                      <span className="text-gray-800">{fmt(hc.collectionCharge)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Discount</span>
                      <span className="text-gray-800">
                        {hc.discountAmount > 0 ? `− ${fmt(hc.discountAmount)}` : fmt(0)}
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal</span>
                      <span className="text-gray-800">{fmt(hc.subtotal)}</span>
                    </div>
                    {hc.gstRate > 0 && (
                      <div className="flex justify-between text-gray-600">
                        <span>GST ({hc.gstRate}%)</span>
                        <span className="text-gray-800">{fmt(hc.gstAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center border-t border-teal-100 pt-3">
                      <span className="text-base font-semibold text-teal-700">Total payable</span>
                      <span className="text-2xl font-bold text-teal-700">{fmt(hc.grandTotal)}</span>
                    </div>
                  </div>

                  {/* Demo QR only for UPI */}
                  {paymentMethod === "UPI" && <UpiPanel amount={hc.grandTotal} />}

                  {/* Shown for UPI, Cash and Card */}
                  <label className="flex items-center gap-3 text-sm font-medium text-gray-900 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={paymentReceived}
                      onChange={(e) => setPaymentReceived(e.target.checked)}
                      className="h-4 w-4 accent-teal-600"
                    />
                    Payment already received
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
                  <button
                    onClick={() => setView("details")}
                    disabled={isPaying}
                    className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={handleConfirmPayment}
                    disabled={isPaying}
                    className="px-4 py-2.5 rounded-lg bg-teal-600 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50 cursor-pointer"
                  >
                    {isPaying ? "Saving…" : "Confirm Payment"}
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Details page: two columns, like the Bill popup */}
                <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-[320px_1fr] gap-5 max-h-[75vh] overflow-y-auto overflow-x-hidden">
                  {/* LEFT: request info */}
                  <div className="min-w-0 space-y-3">
                    <RequestInfoBar hc={hc} />

                    {hc.sampleBarcode && (
                      <div className="flex justify-end">
                        <button
                          onClick={() => setLabelOpen(true)}
                          className="text-xs font-medium text-teal-600 hover:underline cursor-pointer"
                        >
                          🖨️ Print sample label
                        </button>
                      </div>
                    )}
                  </div>

                  {/* RIGHT: technician + bill */}
                  <div className="min-w-0 space-y-4">
                    {hc.status === "Requested" && (
                      <p className="text-sm text-gray-500">No technician assigned yet.</p>
                    )}

                    {hc.technician && (
                      <div className="flex items-center gap-3 border border-gray-100 rounded-lg px-4 py-3">
                        <span className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center text-lg">
                          🧑
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900">{hc.technician.name}</p>
                          <p className="text-xs text-gray-400">
                            {hc.technician.location} · ★{hc.technician.rating}
                            {hc.technician.otp && (
                              <>
                                {" "}· OTP for patient:{" "}
                                <span className="font-semibold text-teal-600">{hc.technician.otp}</span>
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                    )}

                    {hc.status === "En Route" && <TrackingMap />}

                    <BillSection hc={hc} />

                    {hc.status === "Processing" && (
                      <p className="text-sm text-gray-500 text-right">
                        Waiting on lab results —{" "}
                        <button
                          onClick={handleOpenOrder}
                          className="text-teal-600 font-medium hover:underline cursor-pointer"
                        >
                          open the order →
                        </button>
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
                  {hc.status === "Requested" && (
                    <>
                      {!hc.assignable && (
                        <p className="text-xs text-amber-600 w-full sm:w-auto sm:mr-2">
                          This is a future-dated request — assigning a technician unlocks on {hc.slotDate}.
                        </p>
                      )}
                      <button
                        onClick={() => setConfirmingCancel(true)}
                        className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-red-200 text-sm font-medium text-red-600 hover:bg-red-50 cursor-pointer"
                      >
                        Cancel Request
                      </button>
                      <button
                        onClick={() => setAssignOpen(true)}
                        disabled={!hc.assignable}
                        title={!hc.assignable ? `Available on ${hc.slotDate}` : undefined}
                        className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-teal-600 text-sm font-medium text-white hover:bg-teal-700 disabled:bg-gray-300 cursor-pointer disabled:hover:bg-gray-300"
                      >
                        Assign Technician
                      </button>
                    </>
                  )}

                  {hc.status === "Assigned" && (
                    <button
                      onClick={handleMarkEnRoute}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-teal-600 text-sm font-medium text-white hover:bg-teal-700 cursor-pointer"
                    >
                      Mark Technician En Route
                    </button>
                  )}

                  {hc.status === "En Route" && (
                    <>
                      {!hc.otpReady && (
                        <p className="text-xs text-amber-600 w-full sm:w-auto sm:mr-2">
                          OTP hasn't been generated for this collection yet — it's created automatically on the morning of the slot date.
                        </p>
                      )}
                      {hc.otpLocked && (
                        <p className="text-xs text-red-600 w-full sm:w-auto sm:mr-2">
                          Too many incorrect attempts — OTP entry is temporarily locked. Try again shortly.
                        </p>
                      )}
                      <input
                        value={otpInput}
                        onChange={(e) => setOtpInput(e.target.value)}
                        placeholder="Enter OTP from patient"
                        disabled={hc.otpLocked}
                        className="flex-1 w-full sm:w-auto rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 disabled:bg-gray-50 disabled:text-gray-400"
                      />
                      <button
                        onClick={handleConfirmCollected}
                        disabled={hc.otpLocked}
                        className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-teal-600 text-sm font-medium text-white hover:bg-teal-700 whitespace-nowrap disabled:bg-gray-300 cursor-pointer"
                      >
                        Confirm Sample Collected
                      </button>
                    </>
                  )}

                  {/* After the sample is collected, Make Payment comes first.
                      Processing / Enter results unlock once Confirm Payment is clicked
                      (ticked = Paid, unticked = continues as Unpaid). */}
                  {hc.status === "Collected" && needsPayment && (
                    <button
                      onClick={() => setView("payment")}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-teal-600 text-sm font-medium text-white hover:bg-teal-700 cursor-pointer"
                    >
                      Make Payment →
                    </button>
                  )}

                  {hc.status === "Collected" && !needsPayment && (
                    <>
                      {!hc.isPaid && (
                        <p className="text-xs text-amber-600 w-full sm:w-auto sm:mr-auto">
                          Payment pending (Unpaid) ·{" "}
                          <button
                            onClick={() => {
                              setPaymentDeferred(false);
                              setView("payment");
                            }}
                            className="font-medium text-teal-600 hover:underline cursor-pointer"
                          >
                            Collect payment
                          </button>
                        </p>
                      )}
                      <button
                        onClick={handleMarkProcessing}
                        className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
                      >
                        Mark In-Lab Processing
                      </button>
                      <button
                        onClick={handleEnterResults}
                        className="w-full sm:w-auto text-sm text-teal-600 font-medium hover:underline cursor-pointer"
                      >
                        Enter results →
                      </button>
                    </>
                  )}

                  {hc.status === "Report Ready" && (
                    <button
                      onClick={handleSendWhatsApp}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-teal-600 text-sm font-medium text-white hover:bg-teal-700 cursor-pointer"
                    >
                      💬 Send Report via WhatsApp
                    </button>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </ModalShell>

      {isAssignOpen && (
        <AssignTechnicianModal
          hcCode={activeId}
          onClose={() => setAssignOpen(false)}
          onAssign={handleAssign}
        />
      )}

      {isLabelOpen && hc && <PrintLabelModal hc={hc} onClose={() => setLabelOpen(false)} />}

      {confirmingCancel && (
        <ConfirmModal
          title="Cancel Request"
          message={`Cancel request ${hc?.id}? This can't be undone.`}
          confirmLabel="Cancel Request"
          cancelLabel="Keep Request"
          danger
          onConfirm={handleCancel}
          onClose={() => setConfirmingCancel(false)}
        />
      )}

      {cancelError && (
        <AlertModal title="Couldn't Cancel" message={cancelError} onClose={() => setCancelError(null)} />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </>
  );
}