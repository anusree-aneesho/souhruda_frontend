// src/components/FollowUps/FollowUps.jsx
import FollowUpsHeader from "./FollowUpsHeader";
import FollowUpsTable from "./FollowUpsTable/FollowUpsTable";

// Empty for now — matches the screenshot. Swap with real data once
// follow-ups start getting generated from abnormal reports.
const followUps = [];

export default function FollowUps() {
  return (
    <div className="space-y-6">
      <FollowUpsHeader />
      <FollowUpsTable followUps={followUps} />
    </div>
  );
}