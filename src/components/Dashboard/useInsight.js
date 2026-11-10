// src/components/Dashboard/useInsight.js
// Loads an insight from the AI service (via Laravel) and refreshes it.
// Keeps showing the last good data if a refresh fails.
import { useEffect, useState } from "react";

export default function useInsight(fetcher, refreshMs = 60_000) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetcher();
        if (!cancelled) {
          setData(res);
          setError("");
        }
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load");
      }
    }

    load();
    const id = setInterval(load, refreshMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { data, error, loading: !data && !error };
}