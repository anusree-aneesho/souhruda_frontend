// src/components/Dashboard/TodaysOrders/StatusBadge.jsx
const styles = {
  Completed: "bg-green-100 text-green-700",
  Pending: "bg-gray-100 text-gray-500",
  Collected: "bg-amber-100 text-amber-700",
  "Report Ready": "bg-green-100 text-green-700",
  Requested: "bg-gray-100 text-gray-500",
  Assigned: "bg-blue-100 text-blue-700",
  "En Route": "bg-amber-100 text-amber-700",
  Processing: "bg-indigo-100 text-indigo-700",
  Sent: "bg-green-100 text-green-700",
  Cancelled: "bg-red-100 text-red-700",
  Normal: "bg-green-100 text-green-700",
  Low: "bg-amber-100 text-amber-700",
  High: "bg-red-100 text-red-700",
  Abnormal: "bg-red-100 text-red-700",
};

export default function StatusBadge({ status }) {
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${styles[status] || "bg-gray-100 text-gray-500"}`}>
      {status}
    </span>
  );
}