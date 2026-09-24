// src/components/NewOrderModal/steps/ConfirmStep.jsx
import { computeOrderPricing } from "../../../../utils/orderPricing";

export default function ConfirmStep({ patient, selectedTests, packages = [], appliedPackageIds = [], paymentDone, onPaymentDoneChange }) {
  const pricing = computeOrderPricing(selectedTests, packages, appliedPackageIds);
  const total = pricing.total;

  return (
    <div className="px-6 py-5 space-y-4">
      <p className="text-sm text-gray-700">
        Patient: <span className="font-semibold text-gray-900">{patient.name}</span> · {patient.age} Yrs, {patient.gender}
      </p>

      <div>
        <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-1">
          <span className="text-xs font-medium text-gray-400 tracking-wide">TEST</span>
          <span className="text-xs font-medium text-gray-400 tracking-wide">PRICE</span>
        </div>

        {pricing.appliedPackages.map((pkg) => (
          <div key={`pkg-${pkg.id}`} className="py-2 border-b border-gray-50">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-medium text-gray-900">
                <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                {pkg.name} <span className="text-xs text-gray-400 font-normal">(package)</span>
              </span>
              <span className="text-sm text-gray-700">₹{pkg.price.toFixed(2)}</span>
            </div>
            <p className="pl-3.5 text-xs text-gray-400 mt-0.5">
              {pkg.tests.map((t) => t.name).join(", ")}
            </p>
          </div>
        ))}

        {pricing.individualTests.map((test) => (
          <div key={test.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
            <span className="flex items-center gap-2 text-sm text-gray-900">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
              {test.name}
            </span>
            <span className="text-sm text-gray-700">₹{test.price.toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div
        className={`flex items-center justify-between rounded-lg px-4 py-3 ${
          paymentDone ? "bg-green-50" : "bg-teal-50"
        }`}
      >
        <span className={`text-sm font-medium ${paymentDone ? "text-green-700" : "text-teal-700"}`}>
          {paymentDone ? "Already paid" : "Total payable"}
        </span>
        <span className={`text-lg font-bold ${paymentDone ? "text-green-700" : "text-teal-700"}`}>
          ₹{total.toFixed(2)}
        </span>
      </div>

      <label className="flex items-center gap-2.5 px-1 cursor-pointer">
        <input
          type="checkbox"
          checked={paymentDone}
          onChange={(e) => onPaymentDoneChange(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
        />
        <span className="text-sm text-gray-700">
          Payment already received
          <span className="block text-xs text-gray-400">
            Leave unticked if the patient will pay when the bill is ready.
          </span>
        </span>
      </label>
    </div>
  );
}