// src/components/HomeCollection/HomeCollectionStats.jsx
import StatCard from "../common/StatCard";
import { Clock, MapPin, FileText, CheckCircle } from "lucide-react";

const stats = [
  { label: "Requested", value: 1, icon: Clock, color: "gray" },
  { label: "In Progress", value: 1, icon: MapPin, color: "amber" },
  { label: "Report Ready", value: 1, icon: FileText, color: "blue" },
  { label: "Sent to Patient", value: 0, icon: CheckCircle, color: "green" },
];

export default function HomeCollectionStats() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <StatCard key={stat.label} {...stat} />
      ))}
    </div>
  );
}