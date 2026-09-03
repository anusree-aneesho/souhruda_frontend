// src/components/HomeCollection/DetailModal/StatusStepper.jsx
import { STATUS_STEPS } from "../../../data/homeCollections";

export default function StatusStepper({ currentStatus }) {
  const currentIndex = STATUS_STEPS.indexOf(currentStatus);
  return (
    <div>
      <div className="flex gap-1 px-6 pt-4">
        {STATUS_STEPS.map((_, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= currentIndex ? "bg-teal-500" : "bg-gray-100"}`} />
        ))}
      </div>
      <div className="flex justify-between px-6 pt-1.5 pb-2">
        {STATUS_STEPS.map((step, i) => (
          <span key={step} className={`text-[10px] font-medium ${i <= currentIndex ? "text-teal-600" : "text-gray-300"}`}>
            {step}
          </span>
        ))}
      </div>
    </div>
  );
}