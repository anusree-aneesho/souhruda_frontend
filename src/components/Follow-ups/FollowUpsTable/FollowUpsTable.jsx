// src/components/FollowUps/FollowUpsTable/FollowUpsTable.jsx
import FollowUpRow from "./FollowUpRow";
import FollowUpCard from "./FollowUpCard";
import EmptyState from "./EmptyState";

export default function FollowUpsTable({ followUps }) {
  if (followUps.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="hidden md:grid grid-cols-4 px-5 py-3 border-b border-gray-100">
          {["PATIENT", "TEST", "DUE", "STATUS"].map((h) => (
            <span key={h} className="text-xs font-medium text-gray-400 tracking-wide">
              {h}
            </span>
          ))}
        </div>
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="text-left border-b border-gray-100">
              <th className="pb-2 text-xs font-medium text-gray-400 tracking-wide">PATIENT</th>
              <th className="pb-2 text-xs font-medium text-gray-400 tracking-wide">TEST</th>
              <th className="pb-2 text-xs font-medium text-gray-400 tracking-wide">DUE</th>
              <th className="pb-2 text-xs font-medium text-gray-400 tracking-wide">STATUS</th>
            </tr>
          </thead>
          <tbody>
            {followUps.map((f, i) => (
              <FollowUpRow key={i} {...f} />
            ))}
          </tbody>
        </table>
      </div>
      <div className="md:hidden space-y-3">
        {followUps.map((f, i) => (
          <FollowUpCard key={i} {...f} />
        ))}
      </div>
    </div>
  );
}