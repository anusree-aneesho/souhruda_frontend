// src/components/FollowUps/modals/FollowUpDetailModal.jsx
import { useState, useEffect } from "react";
import ModalShell from "../../common/Modal/ModalShell";
import {
  getFollowUpReminderApi,
  markFollowUpReminderDoneApi,
  rescheduleFollowUpReminderApi,
} from "../../../api/api";

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

export default function FollowUpDetailModal({ id, onClose, onActionComplete }) {
  const [detail, setDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [newDueDate, setNewDueDate] = useState("");

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    getFollowUpReminderApi(id)
      .then((res) => {
        if (!cancelled) setDetail(res.data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load follow-up.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleMarkCompleted() {
    setIsSaving(true);
    try {
      await markFollowUpReminderDoneApi(id);
      onActionComplete();
    } catch (err) {
      setError(err.message || "Failed to mark completed.");
      setIsSaving(false);
    }
  }

  async function handleReschedule(e) {
    e.preventDefault();
    if (!newDueDate) return;
    setIsSaving(true);
    try {
      await rescheduleFollowUpReminderApi(id, newDueDate);
      onActionComplete();
    } catch (err) {
      setError(err.message || "Failed to reschedule.");
      setIsSaving(false);
    }
  }

  return (
    <ModalShell title="Follow-up Details" onClose={onClose} maxWidth="max-w-md">
      <div className="px-6 py-5 space-y-4">
        {isLoading && (
          <p className="text-sm text-gray-400 text-center py-6">Loading...</p>
        )}

        {!isLoading && error && (
          <p className="text-sm text-red-500 text-center py-6">{error}</p>
        )}

        {!isLoading && !error && detail && (
          <>
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Patient</dt>
                <dd className="font-medium text-gray-900">{detail.patient_name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Test</dt>
                <dd className="font-medium text-gray-900">{detail.test_name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Previous result</dt>
                <dd className="font-medium text-gray-900">
                  {detail.previous_result !== null && detail.previous_result !== undefined
                    ? `${detail.previous_result} ${detail.unit || ""} ${
                        detail.abnormal_type === "HIGH" ? "↑" : detail.abnormal_type === "LOW" ? "↓" : ""
                      }`
                    : "-"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Reference range</dt>
                <dd className="font-medium text-gray-900">{detail.reference_range || "-"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Previous test date</dt>
                <dd className="font-medium text-gray-900">{formatDate(detail.previous_test_date)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Follow-up due</dt>
                <dd className="font-medium text-gray-900">{formatDate(detail.due_date)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Reason</dt>
                <dd className="font-medium text-gray-900">Abnormal result</dd>
              </div>
            </dl>

            {detail.status === "pending" && !isRescheduling && (
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleMarkCompleted}
                  disabled={isSaving}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-teal-600 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50 cursor-pointer"
                >
                  Mark Completed
                </button>
                <button
                  onClick={() => setIsRescheduling(true)}
                  disabled={isSaving}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
                >
                  Reschedule
                </button>
              </div>
            )}

            {detail.status === "pending" && isRescheduling && (
              <form onSubmit={handleReschedule} className="pt-2 space-y-3">
                <input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  required
                />
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 px-4 py-2.5 rounded-lg bg-teal-600 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50 cursor-pointer"
                  >
                    Confirm New Date
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsRescheduling(false)}
                    disabled={isSaving}
                    className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {detail.status !== "pending" && (
              <p className="text-sm text-gray-400 text-center pt-2">
                This follow-up is {detail.status}.
              </p>
            )}
          </>
        )}
      </div>
    </ModalShell>
  );
}