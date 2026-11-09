// src/components/Dashboard/DailyBrief.jsx
// Live operational summary from the AI service. Each part is a link to the
// page that lists those records.
import { Fragment, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getDailyBriefApi } from "../../api/insightsApi";

const REFRESH_MS = 60_000;

export default function DailyBrief() {
  const [brief, setBrief] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await getDailyBriefApi();
        if (!cancelled) {
          setBrief(data);
          setError("");
        }
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load the daily brief");
      }
    }

    load();
    const id = setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  if (!brief && !error) {
    return (
      <div className="space-y-2" aria-busy="true">
        <div className="h-4 w-3/4 bg-gray-100 rounded animate-pulse" />
        <div className="h-4 w-1/2 bg-gray-100 rounded animate-pulse" />
      </div>
    );
  }

  // Keep showing the last good brief if a refresh fails.
  if (!brief) return <p className="text-gray-400">{error}</p>;

  const sections = brief.sections || [];

  if (sections.length === 0) {
    return <p>{brief.message}</p>;
  }

  return (
    <p>
      {sections.map((s, i) => {
        // "1 order awaiting results" -> link only the count part ("1 order")
        const rest = s.text.startsWith(s.label) ? s.text.slice(s.label.length) : ` ${s.text}`;
        return (
          <Fragment key={s.key}>
            {i > 0 && " · "}
            <Link to={s.href} className="text-teal-600 font-medium hover:underline">
              {s.label}
            </Link>
            {rest}
          </Fragment>
        );
      })}
      .
    </p>
  );
}