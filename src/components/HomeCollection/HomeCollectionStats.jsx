// src/components/HomeCollection/HomeCollectionStats.jsx
import StatCard from "../common/StatCard";
import { Clock, MapPin, FileText, CheckCircle } from "lucide-react";

export default function HomeCollectionStats({ counts }) {
  const c = counts || { requested: 0, inProgress: 0, reportReady: 0, sentToPatient: 0 };

  const stats = [
    { label: "Requested", value: c.requested, icon: Clock, color: "gray" },
    { label: "In Progress", value: c.inProgress, icon: MapPin, color: "amber" },
    { label: "Report Ready", value: c.reportReady, icon: FileText, color: "blue" },
    { label: "Sent to Patient", value: c.sentToPatient, icon: CheckCircle, color: "green" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <StatCard key={stat.label} {...stat} />
      ))}
    </div>
  );
}