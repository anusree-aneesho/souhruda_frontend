
import { ClipboardList } from "lucide-react";
// import Pagination from "./shared/Pagination";

function formatAmount(value) {
  const amount = Number(value || 0);

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function PatientTable({
  rows = [],
  loading = false,
  page = 1,
  totalPages = 1,
  onPageChange,
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px]">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-400">
                PATIENT ID
              </th>

              <th className="px-5 py-3 text-left text-xs font-medium text-gray-400">
                PATIENT NAME
              </th>

              <th className="px-5 py-3 text-left text-xs font-medium text-gray-400">
                PHONE
              </th>

              <th className="px-5 py-3 text-left text-xs font-medium text-gray-400">
                TESTS
              </th>

              <th className="px-5 py-3 text-left text-xs font-medium text-gray-400">
                AMOUNT
              </th>

              <th className="px-5 py-3 text-left text-xs font-medium text-gray-400">
                DATE
              </th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-10 text-center text-sm text-gray-400"
                >
                  Loading...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-10 text-center text-sm text-gray-400"
                >
                  No patients found
                </td>
              </tr>
            ) : (
              rows.map((patient, index) => (
                <tr
                  key={patient.id ?? patient.patient_id ?? index}
                  className="border-b border-gray-50 last:border-b-0"
                >
                  <td className="px-5 py-3 text-sm font-medium text-gray-900">
                    {patient.patient_id ??
                      patient.patient_number ??
                      patient.id ??
                      "—"}
                  </td>

                  <td className="px-5 py-3 text-sm text-gray-700">
                    {patient.patient_name ?? patient.name ?? "—"}
                  </td>

                  <td className="px-5 py-3 text-sm text-gray-500">
                    {patient.phone ?? "—"}
                  </td>

                  <td className="px-5 py-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-600">
                      <ClipboardList size={13} />

                      {patient.tests ??
                        patient.total_tests ??
                        patient.test_count ??
                        0}
                    </span>
                  </td>

                  <td className="px-5 py-3 text-sm font-medium text-gray-700">
                    {formatAmount(
                      patient.amount ??
                        patient.total_amount ??
                        patient.total ??
                        0
                    )}
                  </td>

                  <td className="px-5 py-3 text-sm text-gray-500">
                    {formatDate(
                      patient.date ??
                        patient.visit_date ??
                        patient.created_at ??
                        patient.last_visit
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* {!loading && rows.length > 0 && (
        <div className="flex justify-end border-t border-gray-100 px-5 py-3">
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </div>
      )} */}
    </div>
  );
}

