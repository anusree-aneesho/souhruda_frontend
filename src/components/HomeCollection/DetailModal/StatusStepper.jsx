// src/components/HomeCollection/DetailModal/StatusStepper.jsx
import { STATUS_STEPS } from "../../../data/homeCollections";

export default function StatusStepper({
  currentStatus,
  paymentPending = false,
  paymentDone = false,
}) {
  // Build the step list with "Payment" right after "Collected"
  const steps = [];
  STATUS_STEPS.forEach((s) => {
    steps.push(s);
    if (s === "Collected") steps.push("Payment");
  });

  const statusIndex = STATUS_STEPS.indexOf(currentStatus);
  const collectedIndex = steps.indexOf("Collected");
  const paymentIndex = steps.indexOf("Payment");

  let currentIndex;
  if (currentStatus === "Collected") {
    // Collected but unpaid -> bar stops at Payment (Payment is the active step)
    // Collected and paid   -> Payment is complete
    currentIndex = paymentPending || paymentDone ? paymentIndex : collectedIndex;
    if (paymentPending && !paymentDone) currentIndex = paymentIndex;
  } else if (statusIndex > STATUS_STEPS.indexOf("Collected")) {
    // Processing, Report Ready, Sent: everything before is done,
    // shift by 1 because of the inserted Payment step
    currentIndex = statusIndex + 1;
  } else {
    currentIndex = statusIndex;
  }

  return (
    <div>
      <div className="flex gap-1 px-6 pt-4">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full ${
              i <= currentIndex ? "bg-teal-500" : "bg-gray-100"
            }`}
          />
        ))}
      </div>
      <div className="flex justify-between px-6 pt-1.5 pb-2">
        {steps.map((step, i) => (
          <span
            key={step}
            className={`text-[10px] font-medium ${
              i <= currentIndex ? "text-teal-600" : "text-gray-300"
            }`}
          >
            {step}
          </span>
        ))}
      </div>
    </div>
  );
}