// src/components/common/Sidebar/SidebarNavItem.jsx
import { NavLink } from "react-router-dom";

export default function SidebarNavItem({ label, icon: Icon, path, badge }) {
  return (
    <NavLink
      to={path}
      end={path === "/"}
      className={({ isActive }) =>
        `flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
          isActive
            ? "bg-teal-600 text-white"
            : "text-gray-600 hover:bg-gray-100"
        }`
      }
    >
      <span className="flex items-center gap-3">
        <Icon size={18} />
        {label}
      </span>
      {badge && (
        <span className="text-xs bg-red-100 text-red-600 font-semibold px-1.5 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </NavLink>
  );
}