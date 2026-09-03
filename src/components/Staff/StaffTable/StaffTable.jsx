// src/components/Staff/StaffTable/StaffTable.jsx
import StaffRow from "./StaffRow";

export default function StaffTable({ staff, onEdit, onRemove }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px]">
        <thead>
          <tr className="text-left border-b border-gray-100">
            <th className="pb-2 text-xs font-medium text-gray-400 tracking-wide">FRONT OFFICER ID</th>
            <th className="pb-2 text-xs font-medium text-gray-400 tracking-wide">NAME</th>
            <th className="pb-2 text-xs font-medium text-gray-400 tracking-wide">EMAIL</th>
            <th className="pb-2 text-xs font-medium text-gray-400 tracking-wide">PHONE</th>
            <th className="pb-2 text-xs font-medium text-gray-400 tracking-wide">BRANCH</th>
            <th className="pb-2 text-xs font-medium text-gray-400 tracking-wide">STATUS</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {staff.map((s) => (
            <StaffRow key={s.staffId} staff={s} onEdit={onEdit} onRemove={onRemove} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
