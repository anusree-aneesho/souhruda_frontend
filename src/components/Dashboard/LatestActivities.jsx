// src/components/Dashboard/LatestActivities/LatestActivities.jsx
import ActivityItem from "./ActivityItem";
const activities = [
  { date: "04 Aug", text: "Report sent to Omana via WhatsApp for order #28336", type: "homeCollection", targetId: "HC1001" },
  { date: "04 Aug", text: "Sample collected for home request HC1002 (Damodharan)", type: "homeCollection", targetId: "HC1002" },
  { date: "04 Aug", text: "Order #28338 completed for Karunakaran", type: "order", targetId: "28338" },
  { date: "04 Aug", text: "New home collection HC1003 booked for Karunakaran", type: "homeCollection", targetId: "HC1003" },
  { date: "04 Aug", text: "Order #28339 created for Damodharan", type: "order", targetId: "28339" },
];
export default function LatestActivities() {
  return (
    <div className="bg-white rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <h3 className="font-semibold text-sm text-gray-900 mb-2">Latest Activities</h3>
      <div>
        {activities.map((activity, index) => (
          <ActivityItem key={index} {...activity} isLatest={index === 0} />
        ))}
      </div>
    </div>
  );
}