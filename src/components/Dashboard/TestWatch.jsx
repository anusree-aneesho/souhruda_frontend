// src/components/Dashboard/TestWatch.jsx
// Today's most abnormal tests from the AI service. Click a test to see its results.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AICard from "../common/AIcard";
import { getTestWatchApi, getTestWatchResultsApi } from "../../api/insightsApi";
import useInsight from "./useInsight";

function ResultsModal({ test, onClose }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    getTestWatchResultsApi(test.test_id)
      .then((d) => !cancelled && setData(d))
      .catch((e) => !cancelled && setError(e.message || "Failed to load"));
    return () => {
      cancelled = true;
    };
  }, [test.test_id]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="flex items-start justify-between p-5 border-b border-gray-100">
          <div>
            <h3 className="font-semibold text-gray-900">{test.test_name}</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {test.result_count} result{test.result_count === 1 ? "" : "s"} today ·{" "}
              {test.abnormal_count} abnormal
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Close">
            ✕
          </button>
        </div>

        <div className="p-5 overflow-y-auto text-sm">
          {error && <p className="text-red-600">{error}</p>}
          {!error && !data && <p className="text-gray-400">Loading…</p>}
          {data && data.results.length === 0 && (
            <p className="text-gray-500">No results entered today.</p>
          )}
          {data && data.results.length > 0 && (
            <ul className="divide-y divide-gray-100">
              {data.results.map((r) => (
                <li key={r.order_item_id} className="py-3 first:pt-0">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium text-gray-900">
                      {r.patient_name}{" "}
                      <span className="text-xs font-normal text-gray-400">{r.patient_number}</span>
                    </span>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                        r.flag && r.flag !== "normal"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {r.result_value}
                      {data.unit ? ` ${data.unit}` : ""}
                    </span>
                  </div>
                  {(r.message || r.insight) && (
                    <p className="text-xs text-gray-500 mt-1">{r.message || r.insight}</p>
                  )}
                  {r.order_no && (
                    <Link
                      to={`/lab-orders/${encodeURIComponent(r.order_no)}`}
                      className="text-xs text-teal-600 hover:underline"
                    >
                      Order {r.order_no} →
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TestWatch() {
  const { data, error, loading } = useInsight(() => getTestWatchApi(5));
  const [selected, setSelected] = useState(null);

  let body;
  if (loading) {
    body = (
      <div className="space-y-3" aria-busy="true">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />
        ))}
      </div>
    );
  } else if (!data) {
    body = <p className="text-gray-400">{error}</p>;
  } else if ((data.tests || []).length === 0) {
    body = <p className="text-gray-500">No results have been entered today yet.</p>;
  } else {
    body = (
      <div className="divide-y divide-gray-100">
        {data.tests.map((t) => (
          <button
            key={t.test_id}
            type="button"
            onClick={() => setSelected(t)}
            className="w-full flex items-center justify-between py-3 first:pt-0 last:pb-0 text-left hover:bg-gray-50"
          >
            <div>
              <p className="text-sm font-medium text-gray-900">{t.test_name}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {t.result_count} result{t.result_count === 1 ? "" : "s"} today
                {t.abnormal_count > 0 && ` · ${t.abnormal_count} abnormal`}
              </p>
            </div>
            <span
              className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                t.abnormal_count > 0 ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
              }`}
            >
              {t.result_count}
            </span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <>
      <AICard title="Test Watch" rightSlot={data?.title || "Most abnormal today"}>
        {body}
      </AICard>
      {selected && <ResultsModal test={selected} onClose={() => setSelected(null)} />}
    </>
  );
}