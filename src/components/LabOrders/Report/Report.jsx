// src/components/LabOrders/Report/Report.jsx
import { useState, useMemo, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import ReportHeader from "./ReportHeader";
import ReportLetterhead from "./ReportLetterhead";
import PatientInfoBar from "./PatientInfoBar";
import AISummary from "./AISummary";
import ReportCategorySection from "./ReportCategorySection";
import FollowUpSuggestions from "./FollowUpSuggestions";
import BillModal from "./BillModal";
import WhatsAppSentModal from "./WhatsAppSentModal";
import { findOrderById } from "../../../data/labOrders";
import { calculateFlag } from "../../../utils/calculateFlag";

export default function Report() {
  const { orderId } = useParams();
  const { state } = useLocation();
  const [letterheadOn, setLetterheadOn] = useState(true);
  const [isBillOpen, setBillOpen] = useState(false);
  const [isWhatsAppOpen, setWhatsAppOpen] = useState(false);

  const existingOrder = findOrderById(orderId);
  const order = existingOrder || (state ? { orderId, ...state } : null);

  const [paymentDone, setPaymentDone] = useState(Boolean(order?.paymentDone));

  // Keep the payment status in sync if the person navigates between orders
  // without this component remounting (same route, different orderId).
  useEffect(() => {
    setPaymentDone(Boolean(order?.paymentDone));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const patient = order?.patient || { name: "Unknown", age: "-", gender: "-", regNo: "-" };
  const tests = order?.tests || [];
  const reportDate = order?.orderedAt?.split(" at ")[0] || "-";

  const results = state?.results || Object.fromEntries(tests.map((t) => [t.id, t.result || ""]));

  const flags = useMemo(
    () => Object.fromEntries(tests.map((t) => [t.id, calculateFlag(t.range, results[t.id])])),
    [tests, results]
  );

  const testsWithResults = tests.map((t) => ({ ...t, result: results[t.id] }));
  const testsByCategory = testsWithResults.reduce((acc, t) => {
    acc[t.category] = acc[t.category] || [];
    acc[t.category].push(t);
    return acc;
  }, {});

  function handlePrint() {
    window.print();
  }

  function handleScheduleReminder(test) {
    console.log("Schedule reminder for", test.name);
  }

  return (
    <div className="space-y-6">
      <ReportHeader
        orderId={orderId}
        letterheadOn={letterheadOn}
        onLetterheadToggle={setLetterheadOn}
        onPrint={handlePrint}
        onBillClick={() => setBillOpen(true)}
        onWhatsAppClick={() => setWhatsAppOpen(true)}
      />

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Report — {patient.name}</h1>
        <p className="text-sm text-gray-500 mt-1">Order #{orderId} · {reportDate}</p>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        {letterheadOn && <ReportLetterhead />}

        <PatientInfoBar patient={patient} orderId={orderId} reportDate={reportDate} />
        <AISummary tests={testsWithResults} flags={flags} />

        {Object.entries(testsByCategory).map(([category, categoryTests]) => (
          <ReportCategorySection
            key={category}
            category={category}
            tests={categoryTests}
            flags={flags}
          />
        ))}

        <p className="text-center text-xs text-gray-400 mt-6">** End of report **</p>
      </div>

      <FollowUpSuggestions
        tests={testsWithResults}
        flags={flags}
        reportDate={reportDate}
        onSchedule={handleScheduleReminder}
      />

      {isBillOpen && (
        <BillModal
          orderId={orderId}
          patient={patient}
          tests={testsWithResults}
          paymentDone={paymentDone}
          onClose={() => setBillOpen(false)}
        />
      )}

      {isWhatsAppOpen && (
        <WhatsAppSentModal
          patientName={patient.name}
          onClose={() => setWhatsAppOpen(false)}
        />
      )}
    </div>
  );
}