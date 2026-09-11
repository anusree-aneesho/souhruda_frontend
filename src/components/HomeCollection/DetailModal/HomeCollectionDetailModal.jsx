// src/components/HomeCollection/DetailModal/HomeCollectionDetailModal.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ModalShell from "../../common/Modal/ModalShell";
import StatusStepper from "./StatusStepper";
import RequestInfoBar from "./RequestInfoBar";
import TestsList from "./TestsList";
import TrackingMap from "./TrackingMap";
import AssignTechnicianModal from "./AssignTechnicianModal";
import { useHomeCollectionModal } from "../../../Context/HomeCollectionModalContext";
import { getHomeCollectionRequestApi, updateHomeCollectionStatusApi, resolveHomeCollectionOrderApi } from "../../../api/api";

function formatStatus(status) {
  return (status || "")
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatPaymentMode(mode) {
  if (mode === "upi") return "UPI";
  if (mode === "cash") return "Cash";
  if (mode === "card") return "Card";
  return mode;
}

function formatPaymentStatus(status) {
  return status ? status.charAt(0).toUpperCase() + status.slice(1) : "";
}

// API response shape -> the shape RequestInfoBar / TestsList / StatusStepper expect
function mapDetail(r) {
  return {
    id: r.hc_code,
    patient: r.patient || { name: "—" },
    status: formatStatus(r.status),
    slot: [r.slot_date, r.slot_label].filter(Boolean).join(" · "),
    distance: r.distance_km != null ? `${r.distance_km} km from lab` : "—",
    address: r.address_line,
    payment: `${formatPaymentMode(r.payment_mode)} · ${formatPaymentStatus(r.payment_status)}`,
    collectionCharge: r.collection_charge || 0,
    sampleBarcode: r.barcode,
    technician: r.technician ? { ...r.technician, location: r.technician.zone, otp: r.debug_otp } : null,
    otpReady: r.otp_ready ?? false,
    linkedOrderId: r.order_no || null,
    tests: r.tests || [],
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
  const [otpInput, setOtpInput] = useState("");

  useEffect(() => {
    if (!activeId) {
      setBaseHc(null);
      setLocalHc(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError("");

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

  function handleAssign(updated) {
  setBaseHc(mapDetail(updated));
  setLocalHc(null);
  setAssignOpen(false);
}
  async function handleMarkEnRoute() {
  try {
    const updated = await updateHomeCollectionStatusApi(hc.id, "en_route");
    setBaseHc(mapDetail(updated));
    setLocalHc(null);
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
    const updated = await updateHomeCollectionStatusApi(hc.id, "collected", otpInput.trim());
    setBaseHc(mapDetail(updated));
    setLocalHc(null);
    setOtpInput("");
  } catch (err) {
    alert(err.message || "Couldn't confirm sample collection.");
  }
}

  async function handleMarkProcessing() {
    try {
      const updated = await updateHomeCollectionStatusApi(hc.id, "processing");
      setBaseHc(mapDetail(updated));
      setLocalHc(null);
    } catch (err) {
      alert(err.message || "Couldn't mark this as processing.");
    }
  }

    async function handleEnterResults() {
    try {
      // The linked order is auto-created server-side as soon as the sample is
      // marked collected, so hc.linkedOrderId is normally already set here.
      // resolveOrder is just a fallback (e.g. older collections from before
      // auto-create existed) — never invent an id, or /lab-orders/:orderId
      // 404s on a row that doesn't exist.
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
      alert(`Report sent to ${hc.patient.name} via WhatsApp.`);
    } catch (err) {
      alert(err.message || "Couldn't send the report.");
    }
  }

  return (
    <>
      <ModalShell title={`Home Collection — ${activeId}`} onClose={close} maxWidth="max-w-2xl">
        {isLoading && <p className="px-6 py-8 text-sm text-gray-400">Loading…</p>}
        {!isLoading && error && <p className="px-6 py-8 text-sm text-red-600">{error}</p>}

        {!isLoading && !error && hc && (
          <>
            <StatusStepper currentStatus={hc.status} />

            <div className="px-6 py-4 space-y-5 max-h-[60vh] overflow-y-auto">
              <RequestInfoBar hc={hc} />

              {hc.status === "Requested" && (
                <p className="text-sm text-gray-500">No technician assigned yet.</p>
              )}

              {hc.technician && (
                <div className="flex items-center gap-3 border border-gray-100 rounded-lg px-4 py-3">
                  <span className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center text-lg">🧑</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{hc.technician.name}</p>
                    <p className="text-xs text-gray-400">
                      {hc.technician.location} · ★{hc.technician.rating}
                      {hc.technician.otp && (
                        <>
                          {" "}· OTP for patient: <span className="font-semibold text-teal-600">{hc.technician.otp}</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>
              )}

              {hc.status === "En Route" && <TrackingMap />}

              <TestsList tests={hc.tests} />

              {hc.status === "Processing" && (
                <p className="text-sm text-gray-500 text-right">
                  Waiting on lab results —{" "}
                  <button onClick={handleOpenOrder} className="text-teal-600 font-medium hover:underline">
                    open the order →
                  </button>
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
              {hc.status === "Requested" && (
                <button onClick={() => setAssignOpen(true)} className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-teal-600 text-sm font-medium text-white hover:bg-teal-700">
                  Assign Technician
                </button>
              )}

              {hc.status === "Assigned" && (
                <button onClick={handleMarkEnRoute} className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-teal-600 text-sm font-medium text-white hover:bg-teal-700">
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
                  <input
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value)}
                    placeholder="Enter OTP from patient"
                    className="flex-1 w-full sm:w-auto rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  />
                  <button onClick={handleConfirmCollected} className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-teal-600 text-sm font-medium text-white hover:bg-teal-700 whitespace-nowrap">
                    Confirm Sample Collected
                  </button>
                </>
              )}

              {hc.status === "Collected" && (
                <>
                  <button onClick={handleMarkProcessing} className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">
                    Mark In-Lab Processing
                  </button>
                  <button onClick={handleEnterResults} className="w-full sm:w-auto text-sm text-teal-600 font-medium hover:underline">
                    Enter results →
                  </button>
                </>
              )}

              {hc.status === "Report Ready" && (
                <button onClick={handleSendWhatsApp} className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-teal-600 text-sm font-medium text-white hover:bg-teal-700">
                  💬 Send Report via WhatsApp
                </button>
              )}
            </div>
          </>
        )}
      </ModalShell>

{isAssignOpen && (
  <AssignTechnicianModal
    hcCode={activeId}
    onClose={() => setAssignOpen(false)}
    onAssign={handleAssign}
  />
)}    </>
  );
}