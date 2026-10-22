// src/components/LabOrders/OrderDetail/GroupHeaderRows.jsx
//
// The two rows that sit above a group test's parameters (e.g. CBC):
//  1. the group's name with its single, common price
//  2. a column header where the first column reads "Test Parameters"
// A group has no result or flag of its own — its parameters do.
const thClass = "py-2 text-xs font-medium text-gray-400 tracking-wide";

export default function GroupHeaderRows({ test, parameterCount }) {
  return (
    <>
      <tr className="bg-teal-50/60">
        <td colSpan={5} className="py-2.5 pl-3">
          <p className="text-sm font-semibold text-gray-900">{test.name}</p>
          <p className="text-xs text-gray-400">
            {test.category} · {parameterCount} {parameterCount === 1 ? "parameter" : "parameters"}
          </p>
        </td>
        <td className="py-2.5 text-sm">
          {test.packageId != null ? (
            <span className="text-teal-600 text-xs font-medium">In package</span>
          ) : (
            <span className="font-medium text-gray-900">₹{Number(test.price).toFixed(2)}</span>
          )}
        </td>
      </tr>
      <tr className="border-b border-gray-100 text-left">
        <th className={`${thClass} pl-5`}>TEST PARAMETERS</th>
        <th className={thClass}>UNIT</th>
        <th className={thClass}>NORMAL RANGE</th>
        <th className={thClass}>RESULT</th>
        <th className={thClass}>FLAG</th>
        <th className={thClass}></th>
      </tr>
    </>
  );
}