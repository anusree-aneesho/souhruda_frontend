import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Search,
  History,
  FlaskConical,
  CalendarDays,
  Receipt,
} from "lucide-react";
import { todayIso, daysAgoIso } from "./shared/format";
import { exportToCsv, exportToPdf } from "../../utils/reportExport";

const MOCK_PATIENTS = [
  {
    id: "20018480",
    name: "Omana",
    age: 62,
    gender: "Female",
    phone: "9846012345",
  },
  {
    id: "20018481",
    name: "Damodharan",
    age: 58,
    gender: "Male",
    phone: "9846098765",
  },
  {
    id: "20018482",
    name: "Karunakaran",
    age: 85,
    gender: "Male",
    phone: "9846011122",
  },
  {
    id: "20018483",
    name: "Suma Raj",
    age: 34,
    gender: "Female",
    phone: "9846055566",
  },
];

const MOCK_HISTORY = {
  "20018480": [
    {
      orderId: "28340",
      date: "2026-08-04",
      time: "9:05 AM",
      tests: [
        {
          name: "Total Cholesterol",
          category: "Biochemistry",
          result: "175",
          unit: "mg/dl",
          status: "Completed",
        },
      ],
      amount: 80,
    },
    {
      orderId: "28336",
      date: "2026-08-04",
      time: "7:15 AM",
      tests: [
        {
          name: "Fasting Blood Sugar",
          category: "Biochemistry",
          result: "96",
          unit: "mg/dl",
          status: "Completed",
        },
        {
          name: "Hemoglobin",
          category: "Hematology",
          result: "12.8",
          unit: "g/dl",
          status: "Completed",
        },
        {
          name: "TSH",
          category: "Hormone",
          result: "2.1",
          unit: "µIU/ml",
          status: "Completed",
        },
        {
          name: "Total Cholesterol",
          category: "Biochemistry",
          result: "188",
          unit: "mg/dl",
          status: "Completed",
        },
      ],
      amount: 410,
    },
  ],

  "20018481": [
    {
      orderId: "28341",
      date: "2026-08-04",
      time: "9:20 AM",
      tests: [
        {
          name: "Fasting Blood Sugar",
          category: "Biochemistry",
          result: "118",
          unit: "mg/dl",
          status: "Completed",
        },
      ],
      amount: 30,
    },
    {
      orderId: "28339",
      date: "2026-08-04",
      time: "8:52 AM",
      tests: [
        {
          name: "Blood Urea",
          category: "Biochemistry",
          result: "Pending",
          unit: "mg/dl",
          status: "Pending",
        },
        {
          name: "Serum Creatinine",
          category: "Biochemistry",
          result: "Pending",
          unit: "mg/dl",
          status: "Pending",
        },
        {
          name: "Widal Test",
          category: "Immunology",
          result: "Pending",
          unit: "",
          status: "Pending",
        },
      ],
      amount: 280,
    },
    {
      orderId: "28337",
      date: "2026-08-04",
      time: "7:28 AM",
      tests: [
        {
          name: "Widal Test",
          category: "Immunology",
          result: "Negative",
          unit: "",
          status: "Completed",
        },
      ],
      amount: 30,
    },
  ],

  "20018482": [
    {
      orderId: "28338",
      date: "2026-08-04",
      time: "7:38 AM",
      tests: [
        {
          name: "Blood Urea",
          category: "Biochemistry",
          result: "45",
          unit: "mg/dl",
          status: "Completed",
        },
        {
          name: "Serum Creatinine",
          category: "Biochemistry",
          result: "1.4",
          unit: "mg/dl",
          status: "Completed",
        },
      ],
      amount: 130,
    },
  ],

  "20018483": [
    {
      orderId: "28342",
      date: "2026-08-04",
      time: "9:35 AM",
      tests: [
        {
          name: "Hemoglobin",
          category: "Hematology",
          result: "13.5",
          unit: "g/dl",
          status: "Completed",
        },
        {
          name: "Total WBC Count",
          category: "Hematology",
          result: "7200",
          unit: "cells/cumm",
          status: "Completed",
        },
      ],
      amount: 110,
    },
  ],
};

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

export default function PatientTestHistoryReport({ onBack }) {
  const [dateFrom, setDateFrom] = useState(daysAgoIso(30));
  const [dateTo, setDateTo] = useState(todayIso());

  const [search, setSearch] = useState("");

  const [selectedPatientId, setSelectedPatientId] =
    useState("20018480");

  const filteredPatients = useMemo(() => {
    if (!search.trim()) {
      return MOCK_PATIENTS;
    }

    const query = search.toLowerCase();

    return MOCK_PATIENTS.filter(
      (patient) =>
        patient.name.toLowerCase().includes(query) ||
        patient.id.toLowerCase().includes(query) ||
        patient.phone.includes(query)
    );
  }, [search]);

  const selectedPatient =
    MOCK_PATIENTS.find(
      (patient) => patient.id === selectedPatientId
    ) || null;

  const history = MOCK_HISTORY[selectedPatientId] || [];

  const totalTests = history.reduce(
    (total, order) => total + order.tests.length,
    0
  );

  const totalOrders = history.length;

  const totalAmount = history.reduce(
    (total, order) => total + order.amount,
    0
  );

  const headers = [
    "Date",
    "Order ID",
    "Test",
    "Category",
    "Result",
    "Unit",
    "Status",
  ];

  const csvRows = history.flatMap((order) =>
    order.tests.map((test) => [
      order.date,
      order.orderId,
      test.name,
      test.category,
      test.result,
      test.unit,
      test.status,
    ])
  );

  return (
    <div className="space-y-6">
      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 w-fit"
      >
        <ArrowLeft size={16} />
        Back to Reports
      </button>

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">
          Patient Test History
        </h1>

        <p className="text-sm text-gray-500 mt-1">
          View every test a patient has taken in one timeline.
        </p>
      </div>

      {/* Search + date filters */}
      <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Search Patient
            </label>

            <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 focus-within:border-teal-500 focus-within:ring-1 focus-within:ring-teal-500">
              <Search
                size={15}
                className="text-gray-400 shrink-0"
              />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by patient name, ID or phone..."
                className="flex-1 text-sm outline-none min-w-0"
              />
            </div>

            {search && (
              <div className="mt-2 rounded-lg border border-gray-100 bg-white shadow-md overflow-hidden">
                {filteredPatients.length === 0 ? (
                  <div className="px-3 py-3 text-sm text-gray-400">
                    No patients found.
                  </div>
                ) : (
                  filteredPatients.map((patient) => (
                    <button
                      key={patient.id}
                      onClick={() => {
                        setSelectedPatientId(patient.id);
                        setSearch("");
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-50"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-50 text-teal-700 text-xs font-semibold">
                        {getInitials(patient.name)}
                      </span>

                      <span>
                        <span className="block text-sm font-medium text-gray-900">
                          {patient.name}
                        </span>

                        <span className="block text-xs text-gray-400">
                          {patient.id} · {patient.phone}
                        </span>
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Date From
            </label>

            <input
              type="date"
              value={dateFrom}
              max={dateTo}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Date To
            </label>

            <input
              type="date"
              value={dateTo}
              min={dateFrom}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() =>
                exportToPdf(
                  "Patient Test History",
                  headers,
                  csvRows
                )
              }
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Export PDF
            </button>

            <button
              onClick={() =>
                exportToCsv(
                  "patient-test-history",
                  headers,
                  csvRows
                )
              }
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Export Excel
            </button>
          </div>
        </div>
      </div>

      {/* Patient header */}
      {selectedPatient && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-5">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 text-teal-700 font-semibold">
                {getInitials(selectedPatient.name)}
              </span>

              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  {selectedPatient.name}
                </h2>

                <p className="text-xs text-gray-500 mt-1">
                  Patient ID: {selectedPatient.id}
                </p>

                <p className="text-xs text-gray-500">
                  {selectedPatient.gender} · {selectedPatient.age} years ·{" "}
                  {selectedPatient.phone}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div>
                <p className="text-xs text-gray-400">
                  Orders
                </p>

                <p className="text-lg font-semibold text-gray-900">
                  {totalOrders}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-400">
                  Tests
                </p>

                <p className="text-lg font-semibold text-gray-900">
                  {totalTests}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-400">
                  Amount
                </p>

                <p className="text-lg font-semibold text-gray-900">
                  ₹{totalAmount.toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Timeline */}
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

        {history.length === 0 ? (
          <div className="py-14 text-center text-gray-400">
            <FlaskConical
              size={28}
              className="mx-auto mb-2 text-gray-300"
            />

            <p className="text-sm font-medium text-gray-500">
              No test history found
            </p>

            <p className="text-xs text-gray-400 mt-1">
              Try selecting another patient or date range.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {history.map((order) => (
              <div
                key={order.orderId}
                className="relative pl-8"
              >
                <div className="absolute left-0 top-1.5 h-3 w-3 rounded-full bg-teal-500 ring-4 ring-teal-50" />

                <div className="absolute left-[5px] top-5 bottom-[-32px] w-px bg-gray-100 last:hidden" />

                {/* Order heading */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <CalendarDays
                        size={15}
                        className="text-gray-400"
                      />

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
                    <Receipt size={14} />

                    ₹{order.amount.toLocaleString("en-IN")}
                  </div>
                </div>

                {/* Tests */}
                <div className="mt-4 overflow-hidden rounded-lg border border-gray-100">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 text-xs text-gray-500">
                          <th className="px-3 py-2 text-left">
                            Test
                          </th>

                          <th className="px-3 py-2 text-left">
                            Category
                          </th>

                          <th className="px-3 py-2 text-left">
                            Result
                          </th>

                          <th className="px-3 py-2 text-left">
                            Status
                          </th>
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
                              {test.category}
                            </td>

                            <td className="px-3 py-3 font-medium text-gray-900">
                              {test.result}
                              {test.unit && (
                                <span className="ml-1 text-xs text-gray-400">
                                  {test.unit}
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
    </div>
  );
}