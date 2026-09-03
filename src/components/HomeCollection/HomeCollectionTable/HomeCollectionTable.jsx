// src/components/HomeCollection/HomeCollectionTable/HomeCollectionTable.jsx
import HomeCollectionRow from "./HomeCollectionRow";

export default function HomeCollectionTable({ requests }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[860px]">
        <thead>
          <tr className="text-left border-b border-gray-100">
            <th className="pb-2 text-xs font-medium text-gray-400 tracking-wide">REQUEST</th>
            <th className="pb-2 text-xs font-medium text-gray-400 tracking-wide">PATIENT</th>
            <th className="pb-2 text-xs font-medium text-gray-400 tracking-wide">TESTS</th>
            <th className="pb-2 text-xs font-medium text-gray-400 tracking-wide">DISTANCE</th>
            <th className="pb-2 text-xs font-medium text-gray-400 tracking-wide">SLOT</th>
            <th className="pb-2 text-xs font-medium text-gray-400 tracking-wide">PAYMENT</th>
            <th className="pb-2 text-xs font-medium text-gray-400 tracking-wide">TECHNICIAN</th>
            <th className="pb-2 text-xs font-medium text-gray-400 tracking-wide">STATUS</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {requests.map((req) => (
            <HomeCollectionRow key={req.requestId} {...req} />
          ))}
        </tbody>
      </table>
    </div>
  );
}