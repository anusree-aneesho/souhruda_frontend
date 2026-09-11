// src/components/FollowUps/FollowUps.jsx
import { useState, useEffect } from "react";
import FollowUpsHeader from "./FollowUpsHeader";
import FollowUpsTable from "./FollowUpsTable/FollowUpsTable";
import { getFollowUpRemindersApi } from "../../api/api";

function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : str;
}

function mapReminder(r) {
  return {
    patient: [r.patient?.first_name, r.patient?.last_name].filter(Boolean).join(" "),
    test: r.lab_test?.name ?? "-",
    due: r.due_date
      ? new Date(r.due_date).toLocaleDateString("en-GB", {
          day: "2-digit", month: "short", year: "numeric",
        })
      : "-",
    status: capitalize(r.status),
  };
}

export default function FollowUps() {
  const [followUps, setFollowUps] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    getFollowUpRemindersApi()
      .then((res) => {
        if (!cancelled) setFollowUps((res.data || []).map(mapReminder));
      })
      .catch(() => {
        if (!cancelled) setFollowUps([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <FollowUpsHeader />

      {isLoading ? (
        <p className="text-sm text-gray-400 text-center py-6">Loading follow-ups...</p>
      ) : (
        <FollowUpsTable followUps={followUps} />
      )}
    </div>
  );
}