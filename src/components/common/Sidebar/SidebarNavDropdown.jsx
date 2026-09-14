// src/components/common/Sidebar/SidebarNavDropdown.jsx
import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { ChevronDown } from "lucide-react";

export default function SidebarNavDropdown({ label, icon: Icon, basePath, children }) {
  const location = useLocation();
  const isChildActive = location.pathname.startsWith(basePath);
  const [isOpen, setIsOpen] = useState(isChildActive);

  return (
    <div>
      <button
        onClick={() => setIsOpen((v) => !v)}
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
          isChildActive ? "bg-teal-600 text-white" : "text-gray-600 hover:bg-gray-100"
        }`}
      >
        <span className="flex items-center gap-3">
          <Icon size={18} />
          {label}
        </span>
        <ChevronDown
          size={16}
          className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="mt-1 ml-4 pl-4 border-l border-gray-100 space-y-1">
          {children.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? "bg-teal-50 text-teal-700" : "text-gray-500 hover:bg-gray-100"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}