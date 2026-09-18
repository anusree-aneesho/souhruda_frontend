// src/components/TestMaster/CategoryList/CategoryList.jsx
import { useState, useEffect } from "react";
import CategoryItem from "./CategoryItem";

const PAGE_SIZE = 12;

export default function CategoryList({ categories, activeCategory, onSelect }) {
  const [page, setPage] = useState(1);

  // If the active category moves outside the current page (e.g. a new
  // category was just added), don't strand the user on a stale page.
  useEffect(() => {
    const activeIndex = categories.findIndex((c) => c.name === activeCategory);
    if (activeIndex === -1) return;
    const activePage = Math.floor(activeIndex / PAGE_SIZE) + 1;
    setPage(activePage);
  }, [activeCategory, categories]);

  const lastPage = Math.max(1, Math.ceil(categories.length / PAGE_SIZE));
  const pageCategories = categories.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="bg-white rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <h3 className="font-semibold text-sm text-gray-900 mb-3">Categories</h3>
      <div className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible">
        {pageCategories.map((cat) => (
          <CategoryItem
            key={cat.name}
            {...cat}
            isActive={activeCategory === cat.name}
            onClick={() => onSelect(cat.name)}
          />
        ))}
      </div>

      {lastPage > 1 && (
        <div className="flex items-center justify-between pt-3 mt-2 border-t border-gray-100">
          <span className="text-xs text-gray-400">Page {page} of {lastPage}</span>
          <div className="flex gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-2.5 py-1 rounded-md border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ←
            </button>
            <button
              onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
              disabled={page >= lastPage}
              className="px-2.5 py-1 rounded-md border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}