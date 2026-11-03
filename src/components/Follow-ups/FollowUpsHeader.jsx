// src/components/FollowUps/FollowUpsHeader.jsx
import BranchFilter from "../common/BranchFilter";

export default function FollowUpsHeader() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Follow-ups</h1>
      <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
        <span className="h-5 w-5 rounded-full bg-gray-100 flex items-center justify-center text-[10px] shrink-0">
          🤖
        </span>
        Re-test reminders suggested from abnormal results, so patients don't fall through the cracks.
      </p>
    </div>
    <BranchFilter />
    </div>
  );
}