// src/components/Technicians/TechniciansTable/TechniciansTable.jsx
import TechnicianRow from "./TechnicianRow";

export default function TechniciansTable({ technicians, onEdit, onRemove }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[920px]">
        <thead>
          <tr className="text-left border-b border-gray-100">
            <th className="pb-2 text-xs font-medium text-gray-400 tracking-wide">TECH ID</th>
            <th className="pb-2 text-xs font-medium text-gray-400 tracking-wide">NAME</th>
            <th className="pb-2 text-xs font-medium text-gray-400 tracking-wide">PHONE</th>
            <th className="pb-2 text-xs font-medium text-gray-400 tracking-wide">ZONE</th>
            <th className="pb-2 text-xs font-medium text-gray-400 tracking-wide">RATING</th>
            <th className="pb-2 text-xs font-medium text-gray-400 tracking-wide">ASSIGNED JOBS</th>
            <th className="pb-2 text-xs font-medium text-gray-400 tracking-wide">CURRENT STATUS</th>
            <th className="pb-2 text-xs font-medium text-gray-400 tracking-wide">STATUS</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {technicians.map((t) => (
            <TechnicianRow key={t.techId} technician={t} onEdit={onEdit} onRemove={onRemove} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
