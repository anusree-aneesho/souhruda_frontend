// src/components/common/NewOrderModal/steps/PaymentStep.jsx
import { useEffect, useState } from "react";
import { Tag, Info } from "lucide-react";
import { computeOrderPricing, calcBillTotals } from "../../../../utils/orderPricing";
import { getGstSettingsApi } from "../../../../api/api";
import EditBillModal from "../../../LabOrders/Report/EditBillModal";

const fmt = (n) => `₹${Number(n).toFixed(2)}`;

// CHANGED: helpers to read a test's name / price. Adjust the field names
// below if your selectedTests objects use different ones.
const testName = (t) => t.name ?? t.test_name ?? t.testName ?? "Test";
const testPrice = (t) => Number(t.price ?? t.amount ?? t.test_price ?? 0);

// This step only shows the amount details (and the optional discount).
// The payment mode tabs (UPI / Cash / Card), the QR / card hints and the
// "Payment already received" checkbox were removed — no payment is taken at
// booking. The payment is recorded later.
export default function PaymentStep({
  selectedTests,
  packages = [],
  appliedPackageIds = [],
  collectionCharge = 0,
  feeBreakdown = null,
  // optional: let the parent read the discount when creating the booking
  onDiscountChange,
}) {
  const [discountEnabled, setDiscountEnabled] = useState(false);
  const [discount, setDiscount] = useState({ type: "percentage", value: 0 });
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [gstRate, setGstRate] = useState(0);

  useEffect(() => {
    getGstSettingsApi()
      .then((res) => {
        const g = res.data;
        setGstRate(g?.is_gst_registered ? Number(g.gst_rate) || 0 : 0);
      })
      .catch(() => {});
  }, []);

  const testsTotal = computeOrderPricing(selectedTests, packages, appliedPackageIds).total;

  // CHANGED: sum of the individually listed tests, and the difference when a
  // package price makes testsTotal differ from that sum.
  const listedTotal = selectedTests.reduce((sum, t) => sum + testPrice(t), 0);
  const packageAdjustment = testsTotal - listedTotal;

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
      {/* Price summary */}
      <div className="rounded-xl bg-teal-50/60 px-5 py-4 space-y-2.5 text-sm">
        {/* CHANGED: tests listed separately */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Tests ({selectedTests.length})
          </p>
          {/* add max-h-40 overflow-y-auto here if the list can get long */}
          {selectedTests.map((t, i) => (
            <div key={t.id ?? i} className="flex justify-between gap-4 text-gray-600">
              <span className="truncate">{testName(t)}</span>
              <span className="text-gray-800 shrink-0">{fmt(testPrice(t))}</span>
            </div>
          ))}
          {Math.abs(packageAdjustment) > 0.005 && (
            <div className="flex justify-between text-gray-600">
              <span>Package adjustment</span>
              <span className="text-gray-800">
                {packageAdjustment < 0 ? "− " : ""}
                {fmt(Math.abs(packageAdjustment))}
              </span>
            </div>
          )}
          <div className="flex justify-between border-t border-teal-100 pt-1.5 text-gray-600">
            <span>Tests total</span>
            <span className="text-gray-800">{fmt(testsTotal)}</span>
          </div>
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