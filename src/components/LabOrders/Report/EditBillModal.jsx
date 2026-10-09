import { useState, useEffect } from "react";
import ModalShell from "../../common/Modal/ModalShell";
import { updateOrderDiscountApi, getGstSettingsApi } from "../../../api/api";
import { groupTestsByPackage, calcBillTotals } from "../../../utils/orderPricing";

export default function EditBillModal({
  orderId, tests, billTotal, homeVisitFee = 0, initialDiscount = 0, onClose, onSaved,
}) {
  const [discount, setDiscount] = useState(String(initialDiscount || 0));
  const [gstRate, setGstRate] = useState(0);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const { packageGroups, individualTests } = groupTestsByPackage(tests);
  const testsTotal = billTotal != null ? Number(billTotal) : tests.reduce((s, t) => s + t.price, 0);

  useEffect(() => {
    getGstSettingsApi()
      .then((res) => {
        const g = res.data;
        setGstRate(g?.is_gst_registered ? Number(g.gst_rate) || 0 : 0);
      })
      .catch(() => {});
  }, []);

  const pct = Number(discount);
  const invalid = discount === "" || Number.isNaN(pct) || pct < 0 || pct > 100;
  const totals = calcBillTotals({
    testsTotal, discountPercent: invalid ? 0 : pct, homeVisitFee, gstRate,
  });

  async function handleSave() {
    if (invalid) {
      setError("Enter a discount between 0 and 100.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await updateOrderDiscountApi(orderId, pct);
      onSaved(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell title="Edit Price Details" onClose={onClose} maxWidth="max-w-md">
      <div className="px-6 py-5 space-y-4">
        <div className="space-y-1.5">
          {packageGroups.map((pkg) => (
            <div key={`pkg-${pkg.id}`} className="flex justify-between text-sm text-gray-700">
              <span>{pkg.name} <span className="text-xs text-gray-400">(package)</span></span>
              <span>Rs. {pkg.price.toFixed(2)}</span>
            </div>
          ))}
          {individualTests.map((t) => (
            <div key={t.id} className="flex justify-between text-sm text-gray-700">
              <span>{t.name}</span>
              <span>Rs. {t.price.toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-1.5">Discount (%)</label>
          <input
            type="number" min="0" max="100" step="any"
            value={discount}
            onChange={(e) => { setDiscount(e.target.value); setError(""); }}
            className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
          />
          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>

        <div className="bg-teal-50 rounded-lg px-4 py-3 space-y-1 text-sm text-teal-800">
          <div className="flex justify-between"><span>Tests total</span><span>Rs. {testsTotal.toFixed(2)}</span></div>
          <div className="flex justify-between">
            <span>Discount ({invalid ? 0 : pct}%)</span>
            <span>− Rs. {totals.discountAmount.toFixed(2)}</span>
          </div>
          {homeVisitFee > 0 && (
            <div className="flex justify-between"><span>Home visit fee</span><span>Rs. {Number(homeVisitFee).toFixed(2)}</span></div>
          )}
          {gstRate > 0 && (
            <div className="flex justify-between"><span>GST ({gstRate}%)</span><span>Rs. {totals.gstAmount.toFixed(2)}</span></div>
          )}
          <div className="flex justify-between font-bold text-base pt-1 border-t border-teal-100">
            <span>Total</span><span>Rs. {totals.grandTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
        <button onClick={onClose} className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer">
          Cancel
        </button>
        <button onClick={handleSave} disabled={saving} className="px-4 py-2.5 rounded-lg bg-teal-600 text-sm font-medium text-white hover:bg-teal-700 cursor-pointer disabled:opacity-60">
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </ModalShell>
  );
}