// src/components/Dashboard/DashboardStats.jsx
import StatCard from "../common/StatCard";
import { FileText, Clock, MapPin, IndianRupee } from "lucide-react";

const stats = [
  {
    label: "Today's Orders",
    value: 7,
    sublabel: "6 completed",
    icon: FileText,
    color: "teal",
  },
  {
    label: "Pending Results",
    value: 1,
    sublabel: "needs attention",
    icon: Clock,
    color: "amber",
  },
  {
    label: "Home Collections",
    value: 3,
    sublabel: "1 awaiting assignment",
    icon: MapPin,
    color: "blue",
  },
  {
    label: "Today's Revenue",
    value: "₹1230.00",
    sublabel: "lab orders only",
    icon: IndianRupee,
    color: "purple",
  },
];

export default function DashboardStats() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <StatCard key={stat.label} {...stat} />
      ))}
    </div>
  );
}