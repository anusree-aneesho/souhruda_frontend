import PatientRow from "./PatientRow";

export default function PatientsTable({ patients, onView, onEdit, onDelete }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px]">
        <thead>
          <tr className="text-left border-b border-gray-100">
            <th className="pb-2 text-xs font-medium text-gray-400 tracking-wide">REG. NO</th>
            <th className="pb-2 text-xs font-medium text-gray-400 tracking-wide">NAME</th>
            <th className="pb-2 text-xs font-medium text-gray-400 tracking-wide">AGE / GENDER</th>
            <th className="pb-2 text-xs font-medium text-gray-400 tracking-wide">CONTACT</th>
            <th className="pb-2 text-xs font-medium text-gray-400 tracking-wide">ORDERS</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {patients.map((p) => (
            <PatientRow key={p.id} {...p} onView={onView} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </tbody>
      </table>
    </div>
  );
}