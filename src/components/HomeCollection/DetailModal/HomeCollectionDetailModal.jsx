// src/components/HomeCollection/DetailModal/HomeCollectionDetailModal.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ModalShell from "../../common/Modal/ModalShell";
import StatusStepper from "./StatusStepper";
import RequestInfoBar from "./RequestInfoBar";
import TestsList from "./TestsList";
import TrackingMap from "./TrackingMap";
import AssignTechnicianModal from "./AssignTechnicianModal";
import { useHomeCollectionModal } from "../../../Context/HomeCollectionModalContext";
import { findHomeCollectionById } from "../../../data/homeCollections";

function generateOtp() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export default function HomeCollectionDetailModal() {
  const { activeId, close } = useHomeCollectionModal();
  const navigate = useNavigate();

  const [localHc, setLocalHc] = useState(null);
  const [isAssignOpen, setAssignOpen] = useState(false);
  const [otpInput, setOtpInput] = useState("");

  const baseHc = activeId ? findHomeCollectionById(activeId) : null;
  const hc = localHc?.id === activeId ? localHc : baseHc;

  if (!activeId || !hc) return null;

  function updateHc(patch) {
    setLocalHc({ ...hc, ...patch });
  }

  function handleAssign(technician) {
    updateHc({
      status: "Assigned",
      technician: { ...technician, otp: generateOtp() },
      sampleBarcode: `SR-HC-${hc.id}`,
    });
    setAssignOpen(false);
  }

  function handleMarkEnRoute() {
    updateHc({ status: "En Route" });
  }

  function handleConfirmCollected() {
    if (otpInput !== hc.technician?.otp) {
      alert("OTP doesn't match. Ask the patient for the code shown to the technician.");
      return;
    }
    updateHc({ status: "Collected" });
    setOtpInput("");
  }

  function handleMarkProcessing() {
    updateHc({ status: "Processing" });
  }

  function handleEnterResults() {
    const orderId = hc.linkedOrderId || String(Math.floor(Math.random() * 900 + 28344));
    close();
    navigate(`/lab-orders/${orderId}`, {
      state: {
        patient: hc.patient,
        tests: hc.tests,
        orderedAt: new Date().toLocaleString("en-GB", {
          day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
        }),
      },
    });
  }

  function handleOpenOrder() {
    close();
    navigate(`/lab-orders/${hc.linkedOrderId}`);
  }

  function handleSendWhatsApp() {
    updateHc({ status: "Sent" });
    alert(`Report sent to ${hc.patient.name} via WhatsApp.`);
  }

  return (
    <>
      <ModalShell title={`Home Collection — ${hc.id}`} onClose={close} maxWidth="max-w-2xl">
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
                  {hc.technician.location} · ★{hc.technician.rating} · OTP for patient:{" "}
                  <span className="font-semibold text-teal-600">{hc.technician.otp}</span>
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
      </ModalShell>

      {isAssignOpen && <AssignTechnicianModal onClose={() => setAssignOpen(false)} onAssign={handleAssign} />}
    </>
  );
}