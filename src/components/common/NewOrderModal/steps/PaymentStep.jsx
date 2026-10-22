// src/components/common/NewOrderModal/steps/PaymentStep.jsx
import { useEffect, useMemo, useState } from "react";
import { Smartphone, Banknote, CreditCard, Tag, Info } from "lucide-react";
import { computeOrderPricing, calcBillTotals } from "../../../../utils/orderPricing";
import { getGstSettingsApi } from "../../../../api/api";
import EditBillModal from "../../../LabOrders/Report/EditBillModal";

const paymentMethods = [
  { id: "UPI", icon: Smartphone },
  { id: "Cash", icon: Banknote },
  { id: "Card", icon: CreditCard },
];

const fmt = (n) => `₹${Number(n).toFixed(2)}`;

// Deterministic pseudo-QR pattern, purely decorative.
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

export default function PaymentStep({
  selectedTests,
  packages = [],
  appliedPackageIds = [],
  collectionCharge = 0,
  feeBreakdown = null,
  paymentMethod,
  onPaymentMethodChange,
  // optional: let the parent read these values when creating the order
  onDiscountChange,
  onPaymentReceivedChange,
}) {
  const [discountEnabled, setDiscountEnabled] = useState(false);
  const [discount, setDiscount] = useState({ type: "percentage", value: 0 });
  const [billOrder, setBillOrder] = useState(null);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [paymentReceived, setPaymentReceived] = useState(false);
  const [gstRate, setGstRate] = useState(0);

  useEffect(() => {
    getGstSettingsApi()
      .then((res) => {
        const g = res.data;
        setGstRate(g?.is_gst_registered ? Number(g.gst_rate) || 0 : 0);
      })
      .catch(() => {});
  }, []);

  // Default to Cash whenever this step opens
  useEffect(() => {
    onPaymentMethodChange("Cash");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const testsTotal = computeOrderPricing(selectedTests, packages, appliedPackageIds).total;

  const totals = calcBillTotals({
    testsTotal,
    discountType: discount.type,
    discountValue: discount.value,
    homeVisitFee: collectionCharge,
    gstRate,
  });
  const subtotal = totals.grandTotal - totals.gstAmount;
  const total = totals.grandTotal;

  function handleToggle() {
    if (!discountEnabled) {
      setDiscountEnabled(true);
      setShowDiscountModal(true);
    } else {
      setDiscountEnabled(false);
      const reset = { type: "percentage", value: 0 };
      setDiscount(reset);
      onDiscountChange?.(reset);
    }
  }

  function handleApply(type, value) {
    const next = { type, value };
    setDiscount(next);
    onDiscountChange?.(next);
    setShowDiscountModal(false);
    // if they applied 0, keep the toggle in sync
    if (!value) setDiscountEnabled(false);
  }

  function handleModalClose() {
    setShowDiscountModal(false);
    // cancelled without ever applying a discount -> switch back off
    if (!discount.value) setDiscountEnabled(false);
  }

  return (
    <div className="px-6 py-5 space-y-4">
      {/* Payment method tabs */}
      <div className="flex gap-3">
        {paymentMethods.map(({ id, icon: Icon }) => {
          const active = paymentMethod === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onPaymentMethodChange(id)}
              className={`flex items-center gap-2.5 px-5 py-2.5 rounded-full text-sm font-semibold transition-colors cursor-pointer ${
                active ? "bg-teal-600 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Icon size={18} />
              {id}
            </button>
          );
        })}
      </div>

      {/* Price summary */}
      <div className="rounded-xl bg-teal-50/60 px-5 py-4 space-y-2.5 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>Tests ({selectedTests.length})</span>
          <span className="text-gray-800">{fmt(testsTotal)}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Home visit fee</span>
          <span className="text-gray-800">{fmt(collectionCharge)}</span>
        </div>
        {feeBreakdown && (
          <p className="text-xs text-gray-400 -mt-1">
            Base fee {fmt(feeBreakdown.base_fee)}
            {feeBreakdown.chargeable_km > 0
              ? ` + ${feeBreakdown.chargeable_km} km beyond the ${feeBreakdown.free_radius_km} km free radius × ${fmt(feeBreakdown.per_km_rate)}/km = ${fmt(feeBreakdown.extra_charge)}`
              : ` · within the ${feeBreakdown.free_radius_km} km free radius, no distance charge`}
          </p>
        )}
        <div className="flex justify-between text-gray-600">
          <span className="flex items-center gap-1.5">
            Discount <Info size={14} className="text-gray-400" />
          </span>
          <span className="text-gray-800">
            {totals.discountAmount > 0 ? `− ${fmt(totals.discountAmount)}` : fmt(0)}
          </span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Subtotal</span>
          <span className="text-gray-800">{fmt(subtotal)}</span>
        </div>
        {gstRate > 0 && (
          <div className="flex justify-between text-gray-600">
            <span>GST ({gstRate}%)</span>
            <span className="text-gray-800">{fmt(totals.gstAmount)}</span>
          </div>
        )}
        <div className="flex justify-between items-center border-t border-teal-100 pt-3">
          <span className="text-base font-semibold text-teal-700">Total payable</span>
          <span className="text-2xl font-bold text-teal-700">{fmt(total)}</span>
        </div>
      </div>

      {/* Apply discount toggle */}
      <div className="flex items-center justify-between rounded-xl bg-teal-50/60 px-5 py-4">
        <div className="flex items-center gap-4">
          <Tag size={26} className="text-teal-600" />
          <div>
            <p className="text-sm font-semibold text-gray-900">Apply Discount</p>
            <p className="text-xs text-gray-500">
              {discountEnabled && discount.value > 0 ? (
                <>
                  {discount.type === "percentage" ? `${discount.value}% off` : `${fmt(discount.value)} off`} applied ·{" "}
                  <button
                    type="button"
                    onClick={() => setShowDiscountModal(true)}
                    className="text-teal-600 font-medium hover:underline cursor-pointer"
                  >
                    Edit
                  </button>
                </>
              ) : (
                "Turn on to add discount (if applicable)."
              )}
            </p>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={discountEnabled}
          onClick={handleToggle}
          className={`relative w-12 h-7 rounded-full transition-colors cursor-pointer ${
            discountEnabled ? "bg-teal-600" : "bg-gray-200"
          }`}
        >
          <span
            className={`absolute top-1 left-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${
              discountEnabled ? "translate-x-5" : ""
            }`}
          />
        </button>
      </div>

      {/* Method-specific content */}
      {paymentMethod === "UPI" && (
        <div className="rounded-lg bg-gray-50 border border-gray-100 py-6 flex flex-col items-center gap-3">
          <QrPattern seed={Math.round(total * 100) || 1} />
          <p className="text-sm font-semibold text-gray-900">Scan to pay {fmt(total)}</p>
          <p className="text-xs text-gray-400">souhruda@upi · auto-confirms via payment webhook in production</p>
        </div>
      )}
      {/* {paymentMethod === "Cash" && (
        <p className="text-sm text-gray-600">Collect {fmt(total)} in cash at the time of home visit.</p>
      )} */}
      {paymentMethod === "Card" && (
        <p className="text-sm text-gray-600">Card payment will be collected via the phlebotomist's POS device on arrival.</p>
      )}

      {/* Payment already received */}
      <label className="flex items-center gap-3 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={paymentReceived}
          onChange={(e) => {
            setPaymentReceived(e.target.checked);
            onPaymentReceivedChange?.(e.target.checked);
          }}
          className="h-5 w-5 rounded border-teal-600 accent-teal-600 cursor-pointer"
        />
        <span className="text-sm font-medium text-gray-900">Payment already received</span>
      </label>

      {showDiscountModal && (
        <EditBillModal
          tests={selectedTests}
          billTotal={testsTotal}
          homeVisitFee={collectionCharge}
          initialDiscount={discount.value}
          initialDiscountType={discount.type}
          onClose={handleModalClose}
          onApply={handleApply}
        />
      )}
    </div>
  );
}