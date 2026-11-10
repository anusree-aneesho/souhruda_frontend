// src/components/common/CriticalAlerts/CriticalAlertsBell.jsx
// Bell dropdown for today's critical results (replaces static HTML bell).
import { useCallback, useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  getCriticalAlertsApi,
  getCriticalAlertDetailApi,
  getTatAlertsApi,
} from "../../../api/insightsApi";

const SEEN_KEY = "souhruda_critical_seen_ids";
const REFRESH_MS = 60_000;

// An ops alert is "seen" for the day it was shown, so it can come back tomorrow.
function tatKey(a) {
  return `tat-${a.test_id}-${a.severity}-${new Date().toISOString().slice(0, 10)}`;
}

function loadSeenIds() {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(arr) ? arr.map(String) : []);
  } catch {
    return new Set();
  }
}

function markSeen(ids) {
  const seen = loadSeenIds();
  for (const id of ids) seen.add(String(id));
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify([...seen].slice(-200)));
  } catch {
    /* ignore */
  }
}

function timeAgo(iso) {
  if (!iso) return "";
  const mins = Math.max(
    0,
    Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  );
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  return `${Math.floor(mins / 60)} h ago`;
}

function DetailModal({ orderItemId, onClose }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [d, setD] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getCriticalAlertDetailApi(orderItemId);
        if (!cancelled) setD(data);
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orderItemId]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[85vh] overflow-y-auto p-5">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-semibold text-gray-900">
              {d?.test_name || "Critical result"}
            </h3>
            <p className="text-xs text-gray-400">
              {d?.category ? `${d.category} · ` : ""}Critical result
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
        {loading && (
          <div className="space-y-2">
            <div className="h-10 bg-gray-100 rounded animate-pulse" />
            <div className="h-10 bg-gray-100 rounded animate-pulse" />
          </div>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {d && !loading && (
          <div className="space-y-3 text-sm">
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate(`/lab-orders/${d.order_no}`);
              }}
              className="font-medium text-gray-900 hover:text-teal-700 hover:underline text-left"
              title="Open patient report"
            >
              {d.patient_name}
            </button>
            <p className="text-xs text-gray-400">
              Patient · {d.patient_number}
              {d.gender ? ` · ${d.gender}` : ""}
              {d.age != null ? ` · ${d.age} yrs` : ""}
            </p>
            <div className="rounded-xl bg-gray-50 p-3">
              <p className="text-xs text-gray-400">Result</p>
              <p className="text-lg font-semibold">
                {d.result_value}
                {d.unit ? ` ${d.unit}` : ""}
              </p>
            </div>
            {(d.message || d.insight) && (
              <p className="text-red-600 text-sm">{d.message || d.insight}</p>
            )}
            {d.order_no && (
              <p className="text-xs text-gray-400">Order {d.order_no}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CriticalAlertsBell() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [detailId, setDetailId] = useState(null);
  const [seenTick, setSeenTick] = useState(0);
  const panelRef = useRef(null);
  const [tat, setTat] = useState([]);

  const load = useCallback(async () => {
    try {
      const res = await getCriticalAlertsApi(20);
      setData(res);
      setError("");
    } catch (err) {
      setError(err.message || "Failed to load alerts");
    }
    // Ops delays are secondary: if this fails the clinical alerts must still work.
    try {
      const t = await getTatAlertsApi();
      setTat(t?.alerts || []);
    } catch {
      setTat([]);
    }
  }, []);

  useEffect(() => {
    // Deferred one tick so the first fetch doesn't set state synchronously
    // inside the effect body (react-hooks/set-state-in-effect).
    const first = setTimeout(load, 0);
    const id = setInterval(load, REFRESH_MS);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [load]);

  useEffect(() => {
    function onDocClick(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const alerts = data?.alerts || [];
  const seen = loadSeenIds();
  const unreadClinical = alerts.filter((a) => !seen.has(String(a.order_item_id))).length;
  // Only critical delays raise the badge; "watch" delays are listed but stay quiet.
  const unreadOps = tat.filter((a) => a.severity === "critical" && !seen.has(tatKey(a))).length;
  const unread = unreadClinical + unreadOps;
  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        className="relative text-gray-500 hover:text-gray-700 cursor-pointer"
        aria-label="Critical alerts"
        aria-expanded={open}
        onClick={() => {
          setOpen((v) => !v);
          if (!open) load();
        }}
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-9 w-[min(22rem,calc(100vw-2rem))] bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
            <span className="text-sm font-semibold text-gray-900">
              Critical results today
            </span>
            <span className="text-xs text-gray-400">
              {unread > 0
                ? `${unread} unread · ${data?.total ?? 0} today`
                : `${data?.total ?? 0} today`}
            </span>
          </div>

          {error && (
            <p className="text-sm text-red-600 px-4 py-3">{error}</p>
          )}

          {!error && alerts.length === 0 && tat.length === 0 && (
            <p className="text-sm text-gray-400 px-4 py-4">
              No critical results or delays today.
            </p>
          )}

          {alerts.length > 0 && (
            <p className="px-4 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              Critical results
            </p>
          )}

          <ul className="max-h-80 overflow-y-auto py-1">
            {alerts.map((a) => {
              const isRead = seen.has(String(a.order_item_id));
              const sentence =
                a.message || a.insight || "Result needs attention.";
              return (
                <li key={a.order_item_id}>
                  <button
                    type="button"
                    className={`w-full text-left px-4 py-2.5 flex gap-2.5 hover:bg-red-50/60 ${
                      isRead ? "opacity-70" : ""
                    }`}
                    onClick={() => {
                      markSeen([a.order_item_id]);
                      setSeenTick((t) => t + 1);
                      setOpen(false);
                      setDetailId(a.order_item_id);
                    }}
                  >
                    <span
                      className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${
                        isRead ? "bg-slate-300" : "bg-red-500"
                      }`}
                    />
                    <span className="min-w-0">
                      <span
                        className={`block text-sm ${
                          isRead
                            ? "text-gray-500"
                            : "text-gray-900 font-medium"
                        }`}
                      >
                        {a.patient_name || "Patient"}
                        {a.test_name ? ` · ${a.test_name}` : ""}
                      </span>
                      <span className="block text-xs text-gray-500 mt-0.5">
                        {sentence}
                      </span>
                      <span className="block text-[11px] text-gray-400 mt-0.5">
                        {timeAgo(a.entered_at)}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          {tat.length > 0 && (
            <>
              <p className="px-4 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400 border-t border-gray-50">
                Ops delays
              </p>
              <ul className="max-h-48 overflow-y-auto pb-1">
                {tat.map((a) => {
                  const key = tatKey(a);
                  const isRead = seen.has(key);
                  const isCritical = a.severity === "critical";
                  return (
                    <li key={key}>
                      <button
                        type="button"
                        className={`w-full text-left px-4 py-2.5 flex gap-2.5 hover:bg-gray-50 ${
                          isRead ? "opacity-70" : ""
                        }`}
                        onClick={() => {
                          markSeen([key]);
                          setSeenTick((t) => t + 1);
                        }}
                      >
                        <span
                          className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${
                            isRead
                              ? "bg-slate-300"
                              : isCritical
                                ? "bg-red-500"
                                : "bg-amber-500"
                          }`}
                        />
                        <span className="min-w-0">
                          <span
                            className={`block text-xs ${
                              isCritical ? "text-red-600" : "text-amber-700"
                            }`}
                          >
                            {a.message}
                          </span>
                          <span className="block text-[11px] text-gray-400 mt-0.5">
                            Based on {a.recent_samples} results in the last 24 h
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
          {/* force re-read of localStorage after markSeen */}
          <span className="hidden">{seenTick}</span>
        </div>
      )}

      {detailId != null && (
        <DetailModal
          orderItemId={detailId}
          onClose={() => setDetailId(null)}
        />
      )}
    </div>
  );
}