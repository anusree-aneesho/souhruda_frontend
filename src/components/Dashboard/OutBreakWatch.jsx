// src/components/Dashboard/OutBreakWatch.jsx
// Live outbreak clusters from the AI service: several patients with an abnormal
// result for the same test in the scan window.
import { Link } from "react-router-dom";
import { getOutbreakWatchApi } from "../../api/insightsApi";
import useInsight from "./useInsight";

function Skeleton() {
  return (
    <div className="space-y-2" aria-busy="true">
      <div className="h-4 w-3/4 bg-gray-100 rounded animate-pulse" />
      <div className="h-4 w-1/2 bg-gray-100 rounded animate-pulse" />
    </div>
  );
}

export default function OutbreakWatch() {
  const { data, error, loading } = useInsight(getOutbreakWatchApi);

  if (loading) return <Skeleton />;
  if (!data) return <p className="text-gray-400">{error}</p>;

  const clusters = data.clusters || [];

  if (clusters.length === 0) {
    return (
      <p className="text-teal-700">
        No outbreak patterns detected today — you'll be alerted if several
        patients show the same abnormal result.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {clusters.map((c) => (
        <div
          key={c.id}
          className="bg-orange-50 border border-orange-100 rounded-lg p-4 text-sm text-gray-700"
        >
          <span className="font-semibold">{c.patient_count} patients</span> have
          an abnormal <span className="font-semibold">{c.test_name}</span>{" "}
          result today:{" "}
          {(c.patients || []).map((p, i) => (
            <span key={p.id}>
              {i > 0 && ", "}
              <Link
                to={`/patients?search=${encodeURIComponent(p.display_name)}`}
                className="text-teal-600 font-medium hover:underline"
              >
                {p.display_name}
              </Link>
            </span>
          ))}
          . Worth checking for a common source or a reagent/calibration issue.
        </div>
      ))}
    </div>
  );
}