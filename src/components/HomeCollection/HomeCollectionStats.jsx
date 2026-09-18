// src/components/HomeCollection/HomeCollectionStats.jsx
import StatCard from "../common/StatCard";
import { Clock, MapPin, FileText, CheckCircle } from "lucide-react";

export default function HomeCollectionStats({ counts, activeFilter, onFilterChange }) {
  const c = counts || { requested: 0, inProgress: 0, reportReady: 0, sentToPatient: 0 };

  const stats = [
    { key: "requested", label: "Requested", value: c.requested, icon: Clock, color: "gray" },
    { key: "inProgress", label: "In Progress", value: c.inProgress, icon: MapPin, color: "amber" },
    { key: "reportReady", label: "Report Ready", value: c.reportReady, icon: FileText, color: "blue" },
    { key: "sentToPatient", label: "Sent to Patient", value: c.sentToPatient, icon: CheckCircle, color: "green" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <StatCard
          key={stat.key}
          {...stat}
          active={activeFilter === stat.key}
          onClick={onFilterChange ? () => onFilterChange(stat.key) : undefined}
        />
      ))}
    </div>
  );
}