// src/components/FollowUps/FollowUpsTable/EmptyState.jsx
export default function EmptyState() {
  return (
    <div className="py-16 text-center">
      <p className="text-sm text-teal-700">
        No follow-ups yet — they'll appear here when scheduled from a report.
      </p>
    </div>
  );
}