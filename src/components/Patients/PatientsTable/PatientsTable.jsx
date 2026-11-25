import PatientRow from "./PatientRow";

// Same right padding on every header cell so the gaps between columns are equal.
const TH = "pb-2 pr-4 text-xs font-medium text-gray-400 tracking-wide";

export default function PatientsTable({ patients, onView, onEdit, onDelete }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] table-fixed text-left">
        <colgroup>
          <col className="w-[14%]" />
          <col className="w-[24%]" />
          <col className="w-[16%]" />
          <col className="w-[16%]" />
          <col className="w-[10%]" />
          <col />
        </colgroup>
        <thead>
          <tr className="border-b border-gray-100">
            <th className={TH}>REG. NO</th>
            <th className={TH}>NAME</th>
            <th className={TH}>AGE / GENDER</th>
            <th className={TH}>CONTACT</th>
            <th className={TH}>ORDERS</th>
            <th className="pb-2">
              <span className="sr-only">Actions</span>
            </th>
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