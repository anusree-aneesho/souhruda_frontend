// src/components/common/LabAssistant/MessageFeedback.jsx
import { useState } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";

export default function MessageFeedback({ rating, onRate }) {
  const [busy, setBusy] = useState(false);

  async function handleRate(nextRating) {
    if (busy || rating === nextRating) return;
    setBusy(true);
    try {
      await onRate(nextRating);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-1">
      <span className="text-[10px] text-gray-400 mr-0.5">
        {rating ? "Thanks for your feedback" : "Was this helpful?"}
      </span>
      <button
        type="button"
        disabled={busy}
        onClick={() => handleRate("helpful")}
        title="Helpful"
        aria-label="Mark as helpful"
        className={`rounded p-1 transition-colors disabled:opacity-50 ${
          rating === "helpful"
            ? "text-teal-600 bg-teal-50"
            : "text-gray-400 hover:text-teal-600 hover:bg-teal-50"
        }`}
      >
        <ThumbsUp size={12} />
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => handleRate("not_helpful")}
        title="Not helpful"
        aria-label="Mark as not helpful"
        className={`rounded p-1 transition-colors disabled:opacity-50 ${
          rating === "not_helpful"
            ? "text-teal-600 bg-teal-50"
            : "text-gray-400 hover:text-teal-600 hover:bg-teal-50"
        }`}
      >
        <ThumbsDown size={12} />
      </button>
    </div>
  );
}
