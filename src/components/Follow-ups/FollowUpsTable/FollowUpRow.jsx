// src/components/FollowUps/FollowUpsTable/FollowUpRow.jsx
import StatusBadge from "../../Dashboard/TodaysOrders/StatusBadge";

import { nameWithTitle } from "../../Patients/patientTitles";

export default function FollowUpRow({ title, patient, patientNumber, test, due, status, onView, onViewPatient }) {
  return (
    <tr className="border-b border-gray-100 last:border-0">
      <td className="py-3 text-sm text-teal-600">{patientNumber}</td>
      <td className="py-3 text-sm font-medium text-gray-900">
        <button
          onClick={onViewPatient}
          className="font-medium text-gray-900 hover:text-teal-600 cursor-pointer text-left"
        >
          {nameWithTitle(title, patient)}
        </button>
      </td>
      <td className="py-3 text-sm text-gray-700">{test}</td>
      <td className="py-3 text-sm text-gray-500">{due}</td>
      <td className="py-3">
        <StatusBadge status={status} />
      </td>
      <td className="py-3 text-right">
        <button
          onClick={onView}
          className="text-sm text-teal-600 font-medium hover:underline cursor-pointer"
        >
          View →
        </button>
      </td>
    </tr>
  );
}