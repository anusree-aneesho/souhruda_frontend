// src/components/Technicians/TechniciansTable/CurrentStatusBadge.jsx
const styles = {
  Available: "bg-teal-50 text-teal-700",
  "On Job": "bg-amber-50 text-amber-700",
  Offline: "bg-gray-100 text-gray-500",
};

export default function CurrentStatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
        styles[status] || "bg-gray-100 text-gray-500"
      }`}
    >
      {status}
    </span>
  );
}
