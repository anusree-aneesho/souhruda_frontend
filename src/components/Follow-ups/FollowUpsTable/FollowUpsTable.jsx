// src/components/FollowUps/FollowUpsTable/FollowUpsTable.jsx
import FollowUpRow from "./FollowUpRow";
import FollowUpCard from "./FollowUpCard";
import EmptyState from "./EmptyState";

export default function FollowUpsTable({ followUps, isFiltered, showCompleted = false, onView, onViewPatient }) {
  const dateHeader = showCompleted ? "COMPLETED" : "DUE";
  if (followUps.length === 0) {
    return (
      <div>
        <div className="hidden md:grid grid-cols-5 pb-2 border-b border-gray-100">
          {["REG NO", "PATIENT", "TEST", dateHeader, "STATUS"].map((h) => (
            <span key={h} className="text-xs font-medium text-gray-400 tracking-wide">
              {h}
            </span>
          ))}
        </div>
        <EmptyState filtered={isFiltered} />
      </div>
    );
  }

  return (
    <div>
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="text-left border-b border-gray-100">
              <th className="pb-2 text-xs font-medium text-gray-400 tracking-wide">REG NO</th>
              <th className="pb-2 text-xs font-medium text-gray-400 tracking-wide">PATIENT</th>
              <th className="pb-2 text-xs font-medium text-gray-400 tracking-wide">TEST</th>
              <th className="pb-2 text-xs font-medium text-gray-400 tracking-wide">{dateHeader}</th>
              <th className="pb-2 text-xs font-medium text-gray-400 tracking-wide">STATUS</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {followUps.map((f) => (
              <FollowUpRow key={f.id} {...f} showCompleted={showCompleted} onView={() => onView(f.id)} onViewPatient={() => onViewPatient(f.patientNumber)} />
            ))}
          </tbody>
        </table>
      </div>
      <div className="md:hidden space-y-3">
        {followUps.map((f) => (
          <FollowUpCard key={f.id} {...f} showCompleted={showCompleted} onView={() => onView(f.id)} onViewPatient={() => onViewPatient(f.patientNumber)} />
        ))}
      </div>
    </div>
  );
}