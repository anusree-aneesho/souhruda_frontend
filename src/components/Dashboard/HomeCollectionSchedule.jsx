// src/components/Dashboard/HomeCollectionSchedule/HomeCollectionSchedule.jsx
import { Link } from "react-router-dom";
import ScheduleItem from "./ScheduleItem";

const schedule = [
  { patient: "Damodharan", date: "04 Aug 2026", slot: "Evening · 4–6 PM", person: "Ravi Menon", status: "Collected" },
  { patient: "Omana", date: "04 Aug 2026", slot: "Morning · 7–9 AM", person: "Anjali Nair", status: "Report Ready" },
  { patient: "Karunakaran", date: "05 Aug 2026", slot: "Mid-day · 11 AM–1 PM", person: "Unassigned", status: "Requested" },
];

export default function HomeCollectionSchedule() {
  return (
    <div className="bg-white rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-sm text-gray-900">Home Collection Schedule</h3>
        <Link to="/home-collection" className="text-sm text-teal-600 font-medium hover:underline">
          View all →
        </Link>
      </div>
      <div>
        {schedule.map((item, index) => (
          <ScheduleItem key={index} {...item} />
        ))}
      </div>
    </div>
  );
}