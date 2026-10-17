// src/components/FollowUps/FollowUpsTable/EmptyState.jsx
export default function EmptyState({ filtered = false }) {
  return (
    <div className="py-16 text-center">
      <p className={`text-sm ${filtered ? "text-gray-400" : "text-teal-700"}`}>
        {filtered
          ? "No follow-ups found."
          : "No follow-ups yet — they'll appear here when scheduled from a report."}
      </p>
    </div>
  );
}