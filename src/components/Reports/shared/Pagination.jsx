// src/components/Reports/shared/Pagination.jsx
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Plain prev/next pager — no numbered page buttons, just a "Page X of Y"
 * label between the two arrows. Renders nothing when there's only one page.
 */
export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const btnBase =
    "h-7 w-7 flex items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent";

  return (
    <div className="flex items-center gap-2 mr-14 sm:mr-16">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className={btnBase}
        aria-label="Previous page"
      >
        <ChevronLeft size={16} />
      </button>

      <span className="text-xs font-medium text-gray-500 tabular-nums px-1">
        Page {page} of {totalPages}
      </span>

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className={btnBase}
        aria-label="Next page"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}