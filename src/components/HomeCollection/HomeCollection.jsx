// src/components/HomeCollection/HomeCollection.jsx
import HomeCollectionHeader from "./HomeCollectionHeader";
import HomeCollectionStats from "./HomeCollectionStats";
import HomeCollectionTable from "./HomeCollectionTable/HomeCollectionTable";
import HomeCollectionCard from "./HomeCollectionTable/HomeCollectionCard";

const requests = [
  { requestId: "HC1003", patient: "Karunakaran", tests: 2, distance: "8.1 km", date: "05 Aug 2026", slot: "Mid-day · 11 AM–1 PM", payment: "Card", technician: "Unassigned", status: "Requested" },
  { requestId: "HC1002", patient: "Damodharan", tests: 3, distance: "2.6 km", date: "04 Aug 2026", slot: "Evening · 4–6 PM", payment: "Cash", technician: "Ravi Menon", status: "Collected" },
  { requestId: "HC1001", patient: "Omana", tests: 4, distance: "1.4 km", date: "04 Aug 2026", slot: "Morning · 7–9 AM", payment: "UPI", technician: "Anjali Nair", status: "Report Ready" },
];

export default function HomeCollection() {
  return (
    <div className="space-y-6">
      <HomeCollectionHeader />
      <HomeCollectionStats />

      <div className="bg-white rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-4">
        <div className="hidden md:block">
          <HomeCollectionTable requests={requests} />
        </div>
        <div className="md:hidden space-y-3">
          {requests.map((req) => (
            <HomeCollectionCard key={req.requestId} {...req} />
          ))}
        </div>
      </div>
    </div>
  );
}