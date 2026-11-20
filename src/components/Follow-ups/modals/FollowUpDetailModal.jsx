// src/components/FollowUps/modals/FollowUpDetailModal.jsx
import { useState, useEffect, useMemo } from "react";
import ModalShell from "../../common/Modal/ModalShell";
import {
  getFollowUpReminderApi,
  rescheduleFollowUpReminderApi,
} from "../../../api/api";

const ABNORMAL_ARROWS = { HIGH: "↑", LOW: "↓" };

const STATUS_STYLES = {
  pending: "bg-amber-50 text-amber-700 ring-amber-600/20",
  completed: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  rescheduled: "bg-blue-50 text-blue-700 ring-blue-600/20",
};

const BUTTON_BASE =
  "px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2";
const BUTTON_PRIMARY = `${BUTTON_BASE} bg-teal-600 text-white hover:bg-teal-700`;
const BUTTON_SECONDARY = `${BUTTON_BASE} border border-gray-200 text-gray-700 hover:bg-gray-50`;

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatResult(detail) {
  const { previous_result, unit, abnormal_type } = detail;
  if (previous_result === null || previous_result === undefined) return "-";
  const arrow = ABNORMAL_ARROWS[abnormal_type] || "";
  return [previous_result, unit, arrow].filter(Boolean).join(" ");
}

function capitalize(text = "") {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function DetailRow({ label, children }) {
  return (
    <div className="flex items-baseline justify-between gap-6">
      <dt className="text-gray-500">{label}</dt>
      <dd className="text-right font-medium text-gray-900">{children}</dd>
    </div>
  );
}

function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || "bg-gray-50 text-gray-600 ring-gray-500/20";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${style}`}
    >
      {capitalize(status)}
    </span>
  );
}

export default function FollowUpDetailModal({ id, onClose, onActionComplete }) {
  const [detail, setDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [newDueDate, setNewDueDate] = useState("");

  // Earliest selectable date for rescheduling (today, in local time).
  const minDate = useMemo(() => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offset).toISOString().split("T")[0];
  }, []);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);

    getFollowUpReminderApi(id)
      .then((res) => {
        if (!cancelled) setDetail(res.data);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err.message || "Failed to load follow-up.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  function cancelReschedule() {
    setIsRescheduling(false);
    setNewDueDate("");
    setActionError(null);
  }

  async function handleReschedule(e) {
    e.preventDefault();
    if (!newDueDate || isSaving) return;

    setIsSaving(true);
    setActionError(null);
    try {
      await rescheduleFollowUpReminderApi(id, newDueDate);
      onActionComplete();
    } catch (err) {
      setActionError(err.message || "Failed to reschedule. Please try again.");
      setIsSaving(false);
    }
  }

  const isPending = detail?.status === "pending";

  return (
    <ModalShell title="Follow-up Details" onClose={onClose} maxWidth="max-w-md">
      <div className="px-6 py-5 space-y-5">
        {isLoading && (
          <p className="py-6 text-center text-sm text-gray-400" role="status">
            Loading...
          </p>
        )}

        {!isLoading && loadError && (
          <p className="py-6 text-center text-sm text-red-500" role="alert">
            {loadError}
          </p>
        )}

        {!isLoading && !loadError && detail && (
          <>
            <dl className="space-y-3 text-sm">
              <DetailRow label="Patient">{detail.patient_name}</DetailRow>
              <DetailRow label="Test">{detail.test_name}</DetailRow>
              <DetailRow label="Previous result">{formatResult(detail)}</DetailRow>
              <DetailRow label="Reference range">{detail.reference_range || "-"}</DetailRow>
              <DetailRow label="Previous test date">
                {formatDate(detail.previous_test_date)}
              </DetailRow>
              <DetailRow label="Follow-up due">{formatDate(detail.due_date)}</DetailRow>
              <DetailRow label="Reason">Abnormal result</DetailRow>
              <DetailRow label="Status">
                <StatusBadge status={detail.status} />
              </DetailRow>
            </dl>

            {actionError && (
              <p
                className="rounded-lg border border-red-100 bg-red-50 px-3.5 py-2.5 text-sm text-red-600"
                role="alert"
              >
                {actionError}
              </p>
            )}

            {isPending && !isRescheduling && (
              <div className="border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsRescheduling(true)}
                  className={`${BUTTON_PRIMARY} w-full`}
                >
                  Reschedule follow-up
                </button>
              </div>
            )}

            {isPending && isRescheduling && (
              <form
                onSubmit={handleReschedule}
                className="space-y-3 border-t border-gray-100 pt-4"
              >
                <div className="space-y-1.5">
                  <label
                    htmlFor="new-due-date"
                    className="block text-sm font-medium text-gray-700"
                  >
                    New due date
                  </label>
                  <input
                    id="new-due-date"
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    min={minDate}
                    required
                    autoFocus
                    className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={cancelReschedule}
                    disabled={isSaving}
                    className={`${BUTTON_SECONDARY} flex-1`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving || !newDueDate}
                    className={`${BUTTON_PRIMARY} flex-1`}
                  >
                    {isSaving ? "Saving..." : "Save new date"}
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </ModalShell>
  );
}