// src/components/common/NewOrderModal/steps/PaymentStep.jsx
import { useMemo, useState } from "react";

const HOME_VISIT_FEE = 50;
const paymentMethods = ["UPI", "Cash", "Card"];

// Deterministic pseudo-QR pattern, purely decorative (no real payment integration).
function QrPattern({ seed = 1 }) {
  const cells = useMemo(() => {
    const size = 10;
    let s = seed;
    const rand = () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
    return Array.from({ length: size * size }, () => rand() > 0.5);
  }, [seed]);

  return (
    <div className="grid grid-cols-10 gap-0.5 w-40 h-40">
      {cells.map((filled, i) => (
        <div key={i} className={filled ? "bg-gray-900" : "bg-white"} />
      ))}
    </div>
  );
}

export default function PaymentStep({ selectedTests, paymentMethod, onPaymentMethodChange }) {
  const testsTotal = selectedTests.reduce((sum, t) => sum + t.price, 0);
  const total = testsTotal + HOME_VISIT_FEE;

  return (
    <div className="px-6 py-5 space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Tests ({selectedTests.length})</span>
          <span className="text-gray-900">₹{testsTotal.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Home visit fee</span>
          <span className="text-gray-900">₹{HOME_VISIT_FEE.toFixed(2)}</span>
        </div>
      </div>

      <div className="flex items-center justify-between bg-teal-50 rounded-lg px-4 py-3">
        <span className="text-sm font-medium text-teal-700">Total payable</span>
        <span className="text-lg font-bold text-teal-700">₹{total.toFixed(2)}</span>
      </div>

      <div className="flex gap-2">
        {paymentMethods.map((method) => (
          <button
            key={method}
            type="button"
            onClick={() => onPaymentMethodChange(method)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              paymentMethod === method ? "bg-teal-600 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            {method}
          </button>
        ))}
      </div>

      {paymentMethod === "UPI" && (
        <div className="rounded-lg bg-gray-50 border border-gray-100 py-6 flex flex-col items-center gap-3">
          <QrPattern seed={Math.round(total * 100) || 1} />
          <p className="text-sm font-semibold text-gray-900">Scan to pay ₹{total.toFixed(2)}</p>
          <p className="text-xs text-gray-400">souhruda@upi · auto-confirms via payment webhook in production</p>
        </div>
      )}

      {paymentMethod === "Cash" && (
        <div className="rounded-lg bg-gray-50 border border-gray-100 py-6 px-4 text-center">
          <p className="text-sm text-gray-700">Collect ₹{total.toFixed(2)} in cash at the time of home visit.</p>
        </div>
      )}

      {paymentMethod === "Card" && (
        <div className="rounded-lg bg-gray-50 border border-gray-100 py-6 px-4 text-center">
          <p className="text-sm text-gray-700">Card payment will be collected via the phlebotomist's POS device on arrival.</p>
        </div>
      )}
    </div>
  );
}
