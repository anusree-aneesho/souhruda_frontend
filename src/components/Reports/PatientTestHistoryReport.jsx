import { useEffect, useState } from "react";
import {
  Search,
  History,
  FlaskConical,
  CalendarDays,
  Receipt,
  UserSearch,
} from "lucide-react";
import ReportToolbar from "./shared/ReportToolbar";
import { todayIso, daysAgoIso } from "./shared/format";
import { exportToCsv, exportToPdf } from "../../utils/reportExport";
import {
  getPatientTestHistoryApi,
  getPatientTestHistorySearchApi,
} from "../../api/api";

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getInitials(name) {
  if (!name) return "?";

  const parts = name.trim().split(/\s+/);

  if (parts.length > 1) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return parts[0].slice(0, 2).toUpperCase();
}

function getStatusClass(status) {
  if (status === "Completed") {
    return "bg-green-50 text-green-700";
  }

  if (status === "Pending") {
    return "bg-amber-50 text-amber-700";
  }

  return "bg-gray-100 text-gray-600";
}

function isAbnormal(flag) {
  return Boolean(flag) && String(flag).toLowerCase() !== "normal";
}

export default function PatientTestHistoryReport({ onBack }) {
  // History defaults to the last year so older visits aren't hidden.
  const [dateFrom, setDateFrom] = useState(daysAgoIso(365));
  const [dateTo, setDateTo] = useState(todayIso());

  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const [selectedPatientNumber, setSelectedPatientNumber] = useState(null);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /*
   * ---------------------------------------------------------
   * PATIENT SEARCH (debounced)
   * ---------------------------------------------------------
   */
  useEffect(() => {
    const term = search.trim();

    if (!term) {
      setResults([]);
      setSearching(false);
      return undefined;
    }

    let cancelled = false;

    const timer = setTimeout(async () => {
      setSearching(true);

      try {
        const res = await getPatientTestHistorySearchApi(term);

        if (!cancelled) setResults(res.patients || []);
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search]);

  /*
   * ---------------------------------------------------------
   * LOAD HISTORY when patient or date range changes
   * ---------------------------------------------------------
   */
  useEffect(() => {
    if (!selectedPatientNumber) {
      setData(null);
      return undefined;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);
      setError("");

      try {
        const res = await getPatientTestHistoryApi({
          patientNumber: selectedPatientNumber,
          dateFrom,
          dateTo,
        });

        if (!cancelled) setData(res);
      } catch (err) {
        if (!cancelled) {
          setData(null);
          setError(err.message || "Failed to load test history.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedPatientNumber, dateFrom, dateTo]);

  const selectPatient = (patient) => {
    setData(null);
    setSelectedPatientNumber(patient.id);
    setSearch("");
    setResults([]);
  };

  const patient = data?.patient || null;
  const summary = data?.summary || {
    orders: 0,
    tests: 0,
    amount: 0,
    abnormal: 0,
    pending: 0,
  };
  const orders = data?.orders || [];

  /*
   * ---------------------------------------------------------
   * EXPORT
   * ---------------------------------------------------------
   */
  const headers = [
    "Date",
    "Order ID",
    "Test",
    "Category",
    "Result",
    "Unit",
    "Flag",
    "Status",
  ];

  const csvRows = orders.flatMap((order) =>
    order.tests.map((test) => [
      order.date,
      order.orderId,
      test.name,
      test.category,
      test.result,
      test.unit,
      test.flag ?? "",
      test.status,
    ])
  );

  const exportTitle = patient
    ? `Patient Test History — ${patient.name} (${patient.id})`
    : "Patient Test History";

  // Export buttons stay clickable at all times (ReportToolbar has no disabled
  // state for them) — these guards just no-op until a patient with rows is loaded.
  const canExport = Boolean(patient) && csvRows.length > 0;

  return (
    <div className="space-y-6">
      <ReportToolbar
        onBack={onBack}
        fields={[
          { label: "Date From", value: dateFrom, max: dateTo, onChange: setDateFrom },
          { label: "Date To", value: dateTo, min: dateFrom, onChange: setDateTo },
        ]}
        onExportPdf={() => canExport && exportToPdf(exportTitle, headers, csvRows)}
        onExportCsv={() =>
          canExport &&
          exportToCsv(`patient-test-history-${patient?.id ?? "report"}`, headers, csvRows)
        }
      />

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">
          Patient Test History
        </h1>

        <p className="text-sm text-gray-500 mt-1">
          View every test a patient has taken in one timeline.
        </p>
      </div>

      {/* Patient search */}
      <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <label className="block text-xs font-medium text-gray-500 mb-1.5">
          Search Patient
        </label>

        <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 focus-within:border-teal-500 focus-within:ring-1 focus-within:ring-teal-500 sm:max-w-md">
          <Search size={15} className="text-gray-400 shrink-0" />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by patient name, ID or phone..."
            className="flex-1 text-sm outline-none min-w-0"
          />
        </div>

        {search.trim() && (
          <div className="mt-2 rounded-lg border border-gray-100 bg-white shadow-md overflow-hidden sm:max-w-md">
            {searching && results.length === 0 ? (
              <div className="px-3 py-3 text-sm text-gray-400">
                Searching…
              </div>
            ) : results.length === 0 ? (
              <div className="px-3 py-3 text-sm text-gray-400">
                No patients found.
              </div>
            ) : (
              results.map((p) => (
                <button
                  key={p.id}
                  onClick={() => selectPatient(p)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-50 cursor-pointer"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-50 text-teal-700 text-xs font-semibold">
                    {getInitials(p.name)}
                  </span>

                  <span>
                    <span className="block text-sm font-medium text-gray-900">
                      {p.name}
                    </span>

                    <span className="block text-xs text-gray-400">
                      {p.id} · {p.phone ?? "—"}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      {/* No patient selected yet */}
      {!selectedPatientNumber && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)] py-16 text-center">
          <UserSearch size={30} className="mx-auto mb-2 text-gray-300" />

          <p className="text-sm font-medium text-gray-500">
            Search for a patient to view their test history
          </p>

          <p className="text-xs text-gray-400 mt-1">
            Search by name, patient ID or phone number.
          </p>
        </div>
      )}

      {/* Patient header */}
      {patient && (
        <div className="rounded-xl border border-teal-100 border-l-4 border-l-teal-500 bg-gradient-to-r from-teal-50/80 via-white to-white p-6 shadow-[0_2px_8px_rgba(13,148,136,0.10)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-5">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-teal-600 text-xl font-bold text-white ring-4 ring-teal-100">
                {getInitials(patient.name)}
              </span>

              <div>
                <h2 className="text-2xl font-bold leading-tight text-gray-900">
                  {patient.name}
                </h2>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="inline-flex rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-semibold text-teal-800">
                    ID: {patient.id}
                  </span>

                  {[
                    patient.gender,
                    patient.age != null ? `${patient.age} years` : null,
                    patient.phone,
                  ]
                    .filter(Boolean)
                    .map((item) => (
                      <span
                        key={item}
                        className="inline-flex rounded-full border border-gray-200 bg-white px-2.5 py-0.5 text-xs capitalize text-gray-600"
                      >
                        {item}
                      </span>
                    ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-5 lg:border-l lg:border-teal-100 lg:pl-8">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                  Orders
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {summary.orders}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                  Tests
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {summary.tests}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                  Amount
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{Number(summary.amount).toLocaleString("en-IN")}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                  Abnormal
                </p>
                <p
                  className={`text-2xl font-bold ${
                    summary.abnormal > 0 ? "text-red-600" : "text-gray-900"
                  }`}
                >
                  {summary.abnormal}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                  Pending
                </p>
                <p
                  className={`text-2xl font-bold ${
                    summary.pending > 0 ? "text-amber-600" : "text-gray-900"
                  }`}
                >
                  {summary.pending}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Timeline */}
      {selectedPatientNumber && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-5">
          <div className="flex items-center gap-2 mb-6">
            <History size={18} className="text-teal-600" />

            <div>
              <h2 className="text-sm font-semibold text-gray-900">
                Test Timeline
              </h2>

              <p className="text-xs text-gray-500 mt-1">
                Complete history of tests and orders
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center gap-2 py-14 text-gray-400">
              <span className="h-6 w-6 rounded-full border-2 border-gray-200 border-t-teal-600 animate-spin" />
              <span className="text-sm">Loading history…</span>
            </div>
          ) : orders.length === 0 ? (
            <div className="py-14 text-center text-gray-400">
              <FlaskConical
                size={28}
                className="mx-auto mb-2 text-gray-300"
              />

              <p className="text-sm font-medium text-gray-500">
                No test history found
              </p>

              <p className="text-xs text-gray-400 mt-1">
                Try widening the date range or selecting another patient.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {orders.map((order) => (
                <div key={order.orderId} className="relative pl-8">
                  <div className="absolute left-0 top-1.5 h-3 w-3 rounded-full bg-teal-500 ring-4 ring-teal-50" />

                  <div className="absolute left-[5px] top-5 bottom-[-32px] w-px bg-gray-100 last:hidden" />

                  {/* Order heading */}
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <CalendarDays size={15} className="text-gray-400" />

                        <span className="text-sm font-semibold text-gray-900">
                          {formatDate(order.date)}
                        </span>

                        <span className="text-xs text-gray-400">
                          {order.time}
                        </span>
                      </div>

                      <p className="text-xs text-gray-500 mt-1">
                        Order #{order.orderId}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Receipt size={14} />₹
                      {Number(order.amount).toLocaleString("en-IN")}
                    </div>
                  </div>

                  {/* Tests */}
                  <div className="mt-4 overflow-hidden rounded-lg border border-gray-100">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 text-xs text-gray-500">
                            <th className="px-3 py-2 text-left">Test</th>
                            <th className="px-3 py-2 text-left">Category</th>
                            <th className="px-3 py-2 text-left">Result</th>
                            <th className="px-3 py-2 text-left">Status</th>
                          </tr>
                        </thead>

                        <tbody>
                          {order.tests.map((test, index) => (
                            <tr
                              key={`${order.orderId}-${index}`}
                              className="border-t border-gray-100"
                            >
                              <td className="px-3 py-3">
                                <div className="flex items-center gap-2">
                                  <FlaskConical
                                    size={14}
                                    className="text-gray-400"
                                  />

                                  <span className="font-medium text-gray-900">
                                    {test.name}
                                  </span>
                                </div>
                              </td>

                              <td className="px-3 py-3 text-gray-500">
                                {test.category ?? "—"}
                              </td>

                              <td className="px-3 py-3 font-medium text-gray-900">
                                <span
                                  className={
                                    isAbnormal(test.flag) ? "text-red-600" : ""
                                  }
                                >
                                  {test.result}
                                </span>

                                {test.unit && (
                                  <span className="ml-1 text-xs text-gray-400">
                                    {test.unit}
                                  </span>
                                )}

                                {isAbnormal(test.flag) && (
                                  <span className="ml-2 inline-flex rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-red-700">
                                    {test.flag}
                                  </span>
                                )}
                              </td>

                              <td className="px-3 py-3">
                                <span
                                  className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${getStatusClass(
                                    test.status
                                  )}`}
                                >
                                  {test.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}