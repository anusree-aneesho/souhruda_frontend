// src/components/Dashboard/TodaysRevenueCard.jsx
import { useState } from "react";
import { CheckCircle2, Clock, IndianRupee } from "lucide-react";
import StatCard from "../common/StatCard";
import ModalShell from "../common/Modal/ModalShell";

const money = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const plural = (n) => `${n} ${n === 1 ? "order" : "orders"}`;

const LIMIT = 10;

function formatTime(raw) {
  if (!raw) return "—";
  let normalized = String(raw).replace(" ", "T");
  normalized = normalized.replace(/([+-]\d{2})$/, "$1:00");
  const hasZone = /(Z|[+-]\d{2}:\d{2})$/i.test(normalized);
  const d = new Date(hasZone ? normalized : normalized + "Z");
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const toTime = (raw) => new Date(String(raw || "").replace(" ", "T")).getTime() || 0;

const statusLabel = (s) =>
  String(s || "—")
    .replace(/_/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase());

/**
 * revenue = {
 *   paid:    { amount, orders, items: [{ orderNo, patientName, orderedAt, status, amount }] },
 *   pending: { amount, orders, items: [...] },
 *   total
 * }
 */
export default function TodaysRevenueCard({ revenue, onOpenOrder }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("paid"); // "paid" | "pending"

  const paid = revenue?.paid ?? { amount: 0, orders: 0, items: [] };
  const pending = revenue?.pending ?? { amount: 0, orders: 0, items: [] };
  const total = revenue?.total ?? Number(paid.amount) + Number(pending.amount);

  const isPaidView = tab === "paid";
  const group = isPaidView ? paid : pending;

  // newest first, then keep only the latest 10
  const latestItems = [...group.items]
    .sort((a, b) => toTime(b.orderedAt) - toTime(a.orderedAt))
    .slice(0, LIMIT);

  return (
    <>
      {/* Main card — shows PAID revenue, click to see details */}
      <div
        className="cursor-pointer"
        onClick={() => {
          setTab("paid");
          setOpen(true);
        }}
      >
        <StatCard
          label="Today's Revenue"
          value={money(paid.amount)}
          sublabel={`paid · ${plural(paid.orders)}`}
          icon={IndianRupee}
          color="purple"
        />
      </div>

      {open && (
        <ModalShell
          title="Today's Lab Orders Revenue"
          onClose={() => setOpen(false)}
          maxWidth="max-w-3xl"
        >
          <div className="px-6 py-5">
            {/* Total */}
            <div className="mb-4 flex items-center justify-between rounded-lg bg-violet-50 px-4 py-3 text-violet-700">
              <span className="text-sm font-medium">Total ({plural(paid.orders + pending.orders)})</span>
              <span className="text-lg font-bold">{money(total)}</span>
            </div>

            {/* Paid / Pending tabs */}
            <div className="mb-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTab("paid")}
                className={`rounded-xl border p-3 text-left transition ${
                  isPaidView
                    ? "border-green-400 bg-green-50 ring-2 ring-green-200"
                    : "border-green-200 bg-white hover:bg-green-50"
                }`}
              >
                <span className="flex items-center gap-1.5 text-xs font-semibold text-green-700">
                  <CheckCircle2 size={14} /> Paid
                </span>
                <p className="mt-1 text-xl font-bold text-green-700">{money(paid.amount)}</p>
                <p className="text-[11px] text-green-700/70">{plural(paid.orders)}</p>
              </button>

              <button
                type="button"
                onClick={() => setTab("pending")}
                className={`rounded-xl border p-3 text-left transition ${
                  !isPaidView
                    ? "border-orange-400 bg-orange-50 ring-2 ring-orange-200"
                    : "border-orange-200 bg-white hover:bg-orange-50"
                }`}
              >
                <span className="flex items-center gap-1.5 text-xs font-semibold text-orange-700">
                  <Clock size={14} /> Pending
                </span>
                <p className="mt-1 text-xl font-bold text-orange-700">{money(pending.amount)}</p>
                <p className="text-[11px] text-orange-700/70">{plural(pending.orders)}</p>
              </button>
            </div>

            {/* Orders for selected tab (latest 10) */}
            {group.items.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">
                No {isPaidView ? "paid" : "pending"} lab orders today.
              </p>
            ) : (
              <div className="max-h-[45vh] overflow-x-auto overflow-y-auto">
                <table className="w-full min-w-[520px]">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      <th className="px-4 py-2.5 text-xs font-medium tracking-wide text-gray-400">ORDER</th>
                      <th className="py-2.5 text-xs font-medium tracking-wide text-gray-400">PATIENT</th>
                      <th className="py-2.5 text-xs font-medium tracking-wide text-gray-400">TIME</th>
                      <th className="py-2.5 text-xs font-medium tracking-wide text-gray-400">STATUS</th>
                      <th className="px-4 py-2.5 text-right text-xs font-medium tracking-wide text-gray-400">AMOUNT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {latestItems.map((item) => (
                      <tr
                        key={item.orderNo}
                        onClick={() => {
                          setOpen(false);
                          onOpenOrder?.(item);
                        }}
                        className="cursor-pointer border-t border-gray-100 transition-colors hover:bg-teal-50/40"
                      >
                        <td className="px-4 py-3 text-sm font-medium text-teal-700">{item.orderNo}</td>
                        <td className="py-3 text-sm text-gray-900">{item.patientName || "—"}</td>
                        <td className="py-3 text-sm text-gray-500">{formatTime(item.orderedAt)}</td>
                        <td className="py-3 text-sm text-gray-500">{statusLabel(item.status)}</td>
                        <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                          {money(item.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <p className="mt-3 text-xs text-gray-400">
              {group.items.length > LIMIT
                ? `Showing latest ${LIMIT} of ${group.items.length} orders · `
                : ""}
              Click an order to open it.
            </p>
          </div>
        </ModalShell>
      )}
    </>
  );
}