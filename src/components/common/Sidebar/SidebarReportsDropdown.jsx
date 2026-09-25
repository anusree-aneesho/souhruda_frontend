// src/components/common/Sidebar/SidebarReportsDropdown.jsx
import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { ChevronDown, ChevronRight } from "lucide-react";
import { REPORT_CATEGORIES } from "../../Reports/reportConfig";

export default function SidebarReportsDropdown({ label = "Reports", icon: Icon, basePath = "/reports" }) {
  const location = useLocation();
  const isSectionActive = location.pathname.startsWith(basePath);

  const [isOpen, setIsOpen] = useState(isSectionActive);

  // Keep whichever category the current URL belongs to expanded by default;
  // more than one can be open at once so users can compare items across categories.
  const activeCategoryKey = REPORT_CATEGORIES.find((cat) =>
    location.pathname.startsWith(`${basePath}/${cat.key}`)
  )?.key;

  const [openCategories, setOpenCategories] = useState(() =>
    activeCategoryKey ? { [activeCategoryKey]: true } : {}
  );

  function toggleCategory(key) {
    setOpenCategories((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div>
      <button
        onClick={() => setIsOpen((v) => !v)}
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
          isSectionActive ? "bg-teal-600 text-white" : "text-gray-600 hover:bg-gray-100"
        }`}
      >
        <span className="flex items-center gap-3">
          <Icon size={18} />
          {label}
        </span>
        <ChevronDown size={16} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="mt-1 ml-4 pl-4 border-l border-gray-100 space-y-0.5">
          {REPORT_CATEGORIES.map((category) => {
            const CategoryIcon = category.icon;
            const isCategoryActive = location.pathname.startsWith(`${basePath}/${category.key}`);
            const isCategoryOpen = !!openCategories[category.key];

            return (
              <div key={category.key}>
                <button
                  onClick={() => toggleCategory(category.key)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isCategoryActive ? "text-teal-700" : "text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <CategoryIcon size={14} />
                    {category.title}
                  </span>
                  <ChevronRight
                    size={13}
                    className={`transition-transform ${isCategoryOpen ? "rotate-90" : ""}`}
                  />
                </button>

                {isCategoryOpen && (
                  <div className="ml-4 pl-4 border-l border-gray-100 space-y-0.5 py-0.5">
                    {category.items.map((item) => {
                      const ItemIcon = item.icon;
                      return (
                        <NavLink
                          key={item.key}
                          to={`${basePath}/${category.key}/${item.key}`}
                          className={({ isActive }) =>
                            `flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                              isActive ? "bg-teal-50 text-teal-700" : "text-gray-500 hover:bg-gray-100"
                            }`
                          }
                        >
                          {ItemIcon && <ItemIcon size={13} />}
                          {item.title}
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}