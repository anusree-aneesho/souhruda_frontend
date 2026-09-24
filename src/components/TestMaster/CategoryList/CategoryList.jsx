// src/components/TestMaster/CategoryList/CategoryList.jsx
import { useState, useEffect, useMemo } from "react";
import { Search } from "lucide-react";
import CategoryItem from "./CategoryItem";
import { useAuth } from "../../../Context/AuthContext";

const PAGE_SIZE = 11;
const ROW_HEIGHT = 44;
const LIST_MIN_HEIGHT = PAGE_SIZE * ROW_HEIGHT;

export default function CategoryList({ categories, activeCategory, onSelect, onEditCategory }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const { user } = useAuth();
  const canManage = user?.role !== "front_office";

  useEffect(() => {
    const activeIndex = categories.findIndex((c) => c.name === activeCategory);
    if (activeIndex === -1) return;
    const activePage = Math.floor(activeIndex / PAGE_SIZE) + 1;
    setPage(activePage);
  }, [activeCategory, categories]);

  const filteredCategories = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) => c.name.toLowerCase().includes(q));
  }, [categories, search]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const lastPage = Math.max(1, Math.ceil(filteredCategories.length / PAGE_SIZE));
  const pageCategories = filteredCategories.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="bg-white rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] flex flex-col">
      <h3 className="font-semibold text-sm text-gray-900 mb-3">Categories</h3>

      {categories.length > 4 && (
        <div className="relative mb-3">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search categories..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
          />
        </div>
      )}

      <div className="flex-1" style={{ minHeight: `${LIST_MIN_HEIGHT}px` }}>
        <div className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible">
          {pageCategories.length === 0 ? (
            <p className="text-sm text-gray-400 px-3 py-2">No categories match your search.</p>
          ) : (
            pageCategories.map((cat) => (
              <CategoryItem
                key={cat.name}
                {...cat}
                isActive={activeCategory === cat.name}
                onClick={() => onSelect(cat.name)}
                onEdit={onEditCategory}
                canManage={canManage}
              />
            ))
          )}
        </div>
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