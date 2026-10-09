// src/components/LabOrders/Report/TestDetailView.jsx
import {
  Receipt, MessageCircle, Printer,
  User, Phone, Stethoscope, CalendarDays, FileCheck2,
} from "lucide-react";
import StatusBadge from "../../Dashboard/TodaysOrders/StatusBadge";

const actionBtn =
  "flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer";

export default function TestDetailView({
  patient,
  orderId,
  test,
  flag,
  ageText,
  registered,
  reportDate,
  referredBy,
  letterheadOn,
  onLetterheadChange,
  onBack,
  onBill,
  onWhatsApp,
  onPrint,
}) {
  const hasRange = test.range && test.range !== "-";

  const initials = (patient.name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div className="space-y-6">
      {/* ── Top action bar ─────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="text-sm font-medium text-teal-600 hover:underline cursor-pointer"
        >
          ← Back to report
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={onBill} className={actionBtn}>
            <Receipt size={16} /> Bill
          </button>
          <button type="button" onClick={onWhatsApp} className={actionBtn}>
            <MessageCircle size={16} /> WhatsApp
          </button>



          <button type="button" onClick={onPrint} className={actionBtn}>
            <Printer size={16} /> Print
          </button>
        </div>
      </div>

      {/* ── Patient summary card ───────────────────────────────── */}
      <div className="rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-teal-500 via-teal-500 to-gray-900" />
        <div className="p-6 flex flex-col lg:flex-row lg:items-center gap-6">
          <div className="flex items-center gap-4 lg:w-[34%]">
            <span className="h-16 w-16 shrink-0 rounded-full bg-teal-600 text-white text-xl font-bold flex items-center justify-center ring-4 ring-teal-100">
              {initials}
            </span>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-gray-900 uppercase truncate">{patient.name}</h1>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <span className="rounded-full bg-teal-50 text-teal-700 text-xs font-semibold px-2.5 py-0.5">
                  Order #{orderId}
                </span>
                <span className="rounded-full border border-gray-200 text-gray-600 text-xs px-2.5 py-0.5">
                  Reg. {patient.regNo}
                </span>
              </div>
            </div>
          </div>

          <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4 lg:border-l lg:border-gray-100 lg:pl-6">
            {[
              { icon: User, label: "Age / Gender", value: `${ageText} · ${patient.gender || "—"}` },
              { icon: Phone, label: "Contact", value: patient.phone || "Not recorded" },
              { icon: Stethoscope, label: "Referred by", value: referredBy },
              { icon: CalendarDays, label: "Collection date", value: registered },
              { icon: FileCheck2, label: "Reported", value: reportDate },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-2.5">
                <span className="mt-0.5 h-7 w-7 shrink-0 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                  <Icon size={14} />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-wide text-gray-400">{label}</p>
                  <p className="text-sm font-medium text-gray-900 capitalize truncate">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Test details card ──────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-sm text-gray-900 uppercase">{test.name}</h3>
          <p className="text-xs text-gray-400">{test.category}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px]">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-6 py-2.5 text-xs font-medium text-gray-400 tracking-wide">TEST PARAMETER</th>
                <th className="py-2.5 text-xs font-medium text-gray-400 tracking-wide">RESULT</th>
                <th className="py-2.5 text-xs font-medium text-gray-400 tracking-wide">REFERENCE RANGE</th>
                <th className="px-6 py-2.5 text-xs font-medium text-gray-400 tracking-wide">FLAG</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-gray-100 hover:bg-teal-50/30 transition-colors">
                <td className="px-6 py-3.5">
                  <p className="text-sm font-medium text-gray-900">{test.name}</p>
                  <p className="text-xs text-gray-400">{test.category}</p>
                </td>
                <td className="py-3.5 text-sm font-semibold text-gray-900">
                  {test.result || "—"}
                  {test.result && test.unit ? (
                    <span className="ml-1 text-xs font-normal text-gray-400">{test.unit}</span>
                  ) : null}
                </td>
                <td className="py-3.5 text-sm text-gray-600">
                  {hasRange ? test.range : "—"}
                  {hasRange && test.unit ? <span className="ml-1 text-gray-400">{test.unit}</span> : null}
                </td>
                <td className="px-6 py-3.5">
                  <StatusBadge status={flag} />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}