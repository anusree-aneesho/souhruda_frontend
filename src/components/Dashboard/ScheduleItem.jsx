// src/components/Dashboard/HomeCollectionSchedule/ScheduleItem.jsx
import StatusBadge, { BranchTag } from "../Dashboard/TodaysOrders/StatusBadge";

export default function ScheduleItem({ patient, date, slot, person, status, branchName }) {
  return (
    <div className="flex items-center justify-between py-3 first:pt-0 last:pb-0 border-b border-gray-100 last:border-0">
      <div>
        <p className="text-sm font-semibold text-gray-900">
          {patient} <BranchTag name={branchName} className="ml-1 align-middle" />
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          {date} · {slot} · {person}
        </p>
      </div>
      <StatusBadge status={status} />
    </div>
  );
}