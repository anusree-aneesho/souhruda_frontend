// src/components/Staff/StaffTable/StaffStatusBadge.jsx
export default function StaffStatusBadge({ status }) {
  const isActive = status === "Active";
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
        isActive ? "bg-teal-50 text-teal-700" : "bg-gray-100 text-gray-500"
      }`}
    >
      {status}
    </span>
  );
}
