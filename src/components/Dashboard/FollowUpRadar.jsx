// src/components/Dashboard/FollowUpRadar.jsx
import AICard from "../common/AIcard";

export default function FollowUpRadar() {
  return (
    <AICard title="Follow-up Radar">
      <p className="text-teal-700">
        No follow-ups scheduled yet — they're suggested automatically from
        abnormal reports.
      </p>
    </AICard>
  );
}