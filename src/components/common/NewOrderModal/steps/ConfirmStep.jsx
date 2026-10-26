// src/components/common/NewOrderModal/steps/ConfirmStep.jsx
import { useState, useEffect } from "react";
import { Tag, Info, Smartphone, Banknote, CreditCard } from "lucide-react";
import { computeOrderPricing, calcBillTotals } from "../../../../utils/orderPricing";
import { getGstSettingsApi } from "../../../../api/api";
import EditBillModal from "../../../LabOrders/Report/EditBillModal";
import QrCode from "../../QrCode"; // ADDED: QR for UPI payments

const UPI_ID = "souhruda@upi"; // ADDED: put your lab's real UPI ID

// ADDED: payment mode options (ids match the tab ids used in Home Collection)
const PAYMENT_MODES = [
  { id: "UPI", label: "UPI", Icon: Smartphone },
  { id: "Cash", label: "Cash", Icon: Banknote },
  { id: "Card", label: "Card", Icon: CreditCard },
];

// ADDED: the UPI / Cash / Card tabs
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

export default function ConfirmStep({
  patient,
  selectedTests,
  packages = [],
  appliedPackageIds = [],
  paymentDone,
  onPaymentDoneChange,
  discount,              // { type: "percentage" | "fixed", value: number }
  onDiscountChange,
  paymentMethod = "Cash",   // ADDED: "UPI" | "Cash" | "Card"
  onPaymentMethodChange,    // ADDED
}) {
  const pricing = computeOrderPricing(selectedTests, packages, appliedPackageIds);
  const testsTotal = pricing.total;

  const [gstRate, setGstRate] = useState(0);
  const [showDiscountModal, setShowDiscountModal] = useState(false);

  const discountOn = Number(discount.value) > 0;

  useEffect(() => {
    getGstSettingsApi()
      .then((res) => {
        const g = res.data;
        setGstRate(g?.is_gst_registered ? Number(g.gst_rate) || 0 : 0);
      })
      .catch(() => {});
  }, []);

  const totals = calcBillTotals({
    testsTotal,
    discountType: discount.type,
    discountValue: Number(discount.value) || 0,
    homeVisitFee: 0,
    gstRate,
  });

  // ADDED: amount in the UPI QR = the grand total shown below (includes discount + GST)
  const payableAmount = Number(totals.grandTotal) || 0;

  // Shape the discount modal expects (tests tagged with the package they're billed under).
  const billTests = [
    ...pricing.appliedPackages.flatMap((pkg) =>
      pkg.tests.map((t) => ({
        ...t,
        package_id: pkg.id,
        package_name: pkg.name,
        package_price: pkg.price,
      }))
    ),
    ...pricing.individualTests,
  ];

  function handleToggleDiscount() {
    if (discountOn) {
      onDiscountChange({ type: "percentage", value: 0 }); // switch off = remove discount
    } else {
      setShowDiscountModal(true); // switch on = open discount modal
    }
  }

  return (
    <div className="px-6 py-5 space-y-4">
      <p className="text-sm text-gray-700">
        Patient: <span className="font-semibold text-gray-900">{patient.name}</span> · {patient.age} Yrs, {patient.gender}
      </p>

      {/* Tests list */}
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

      {/* ADDED: Payment mode tabs (UPI / Cash / Card) */}
      <PaymentModeTabs value={paymentMethod} onChange={onPaymentMethodChange} />

      {/* ADDED: UPI QR, shown only when UPI is selected */}
      {paymentMethod === "UPI" && (
        <div className="rounded-xl border border-gray-100 bg-gray-50 px-5 py-5 flex flex-col items-center">
          <QrCode
            value={`upi://pay?pa=${UPI_ID}&pn=Souhruda${
              payableAmount > 0 ? `&am=${payableAmount.toFixed(2)}` : ""
            }&cu=INR`}
            size={160}
          />
          <p className="mt-3 text-sm font-semibold text-gray-900">
            {payableAmount > 0 ? `Scan to pay ₹${payableAmount.toFixed(2)}` : "Scan to pay"}
          </p>
          <p className="mt-1 text-xs text-gray-400">{UPI_ID}</p>
        </div>
      )}

      {/* Price summary */}
      <div className="rounded-xl bg-teal-50/60 px-5 py-4 space-y-2.5 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-gray-800">Total payable</span>
          <span className="font-semibold text-gray-900">₹{testsTotal.toFixed(2)}</span>
        </div>

        <div className="flex items-center justify-between text-gray-500">
          <span className="flex items-center gap-1.5">
            Discount
            <span title="Discount applies to tests only. GST is calculated after the discount.">
              <Info size={14} className="text-gray-400" />
            </span>
          </span>
          <span className={discountOn ? "text-green-700" : ""}>
            {discountOn ? "− " : ""}₹{totals.discountAmount.toFixed(2)}
          </span>
        </div>

        <div className="flex items-center justify-between text-gray-500">
          <span>Subtotal</span>
          <span>₹{totals.subtotal.toFixed(2)}</span>
        </div>

        {gstRate > 0 && (
          <div className="flex items-center justify-between text-gray-500">
            <span>GST ({gstRate}%)</span>
            <span>₹{totals.gstAmount.toFixed(2)}</span>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-teal-100 pt-3">
          <span className="text-base font-semibold text-teal-700">Total payable</span>
          <span className="text-2xl font-bold text-teal-700">₹{totals.grandTotal.toFixed(2)}</span>
        </div>
      </div>

      {/* Apply discount + payment received */}
      <div className="rounded-xl bg-teal-50/60 px-4 py-3.5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <Tag size={22} className="text-teal-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-gray-900">Apply Discount</p>
              <p className="text-xs text-gray-400">
                {discountOn ? (
                  <>
                    {discount.type === "percentage"
                      ? `${discount.value}% off`
                      : `₹${Number(discount.value).toFixed(2)} off`}{" "}
                    applied ·{" "}
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
            aria-checked={discountOn}
            onClick={handleToggleDiscount}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors cursor-pointer ${
              discountOn ? "bg-teal-600" : "bg-gray-200"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                discountOn ? "translate-x-5" : ""
              }`}
            />
          </button>
        </div>

        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={paymentDone}
            onChange={(e) => onPaymentDoneChange(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
          />
          <span className="text-sm text-gray-700">Already received payment</span>
        </label>
      </div>

      {showDiscountModal && (
        <EditBillModal
          orderId="NEW"
          tests={billTests}
          billTotal={testsTotal}
          homeVisitFee={0}
          initialDiscount={discount.value}
          initialDiscountType={discount.type}
          onClose={() => setShowDiscountModal(false)}
          onApply={(type, value) => {
            onDiscountChange({ type, value });
            setShowDiscountModal(false);
          }}
        />
      )}
    </div>
  );
}