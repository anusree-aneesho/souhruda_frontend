// src/components/common/Sidebar/Sidebar.jsx
import SidebarLogo from "./SidebarLogo";
import SidebarNavItem from "./SidebarNavItem";
import SidebarFooterHint from "./SidebarFooterHint";
import SidebarNavDropdown from "./SidebarNavDropdown";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../Context/AuthContext";
import { LogOut } from "lucide-react";
import {
  LayoutDashboard,
  ClipboardList,
  MapPin,
  FlaskConical,
  Users,
  Clock,
  Settings,
  Wrench,
  Receipt,
  UserCog,
  Package,
  Beaker,
  BarChart3,
  SlidersHorizontal,
} from "lucide-react";

const allNavItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { label: "Lab Orders", icon: ClipboardList, path: "/lab-orders" },
  { label: "Home Collection", icon: MapPin, path: "/home-collection" },
  // { label: "Front Office", icon: UserCog, path: "/staff" },
  { label: "Technicians", icon: Wrench, path: "/technicians" },
  // { label: "Lab Assistant", icon: Beaker, path: "/lab-assistants" },
  { label: "Test Master", icon: FlaskConical, path: "/test-master" },
  { label: "Patients", icon: Users, path: "/patients" },
  { label: "Follow-ups", icon: Clock, path: "/follow-ups" },
  { label: "Statistics", icon: BarChart3, path: "/statistics" },
];

// `roles` = who can see the item. Leave it out to show the item to everyone.
const settingsSubItems = [
  {
    label: "Lab Settings",
    path: "/settings/lab-settings",
    icon: Beaker,
  },
  {
    label: "GST Settings",
    path: "/settings/gst",
    icon: Receipt,
  },
  {
    label: "Staff Management",
    path: "/settings/staff-management",
    icon: UserCog,
    roles: ["admin", "super_admin", "superadmin"],
  },
  {
    label: "Test Configuration",
    path: "/settings/test-configuration",
    icon: SlidersHorizontal,
  },
  {
    label: "Stock",
    path: "/settings/stock",
    icon: Package,
  },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Normalise so "Super Admin", "super-admin" and "super_admin" all match
  const role = String(user?.role ?? "")
    .toLowerCase()
    .trim()
    .replace(/[\s-]+/g, "_");

  const isFrontOffice = role === "front_office";

  const navItems = isFrontOffice
    ? allNavItems.filter((item) => item.path !== "/home-collection")
    : allNavItems;

  const visibleSettingsItems = settingsSubItems.filter(
    (item) => !item.roles || item.roles.includes(role)
  );

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <aside className="sticky top-0 h-screen w-64 shrink-0 border-r border-gray-200 bg-white flex flex-col">
      <SidebarLogo />

      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => (
          <SidebarNavItem key={item.path} {...item} />
        ))}

        <SidebarNavDropdown
          label="Settings"
          icon={Settings}
          basePath="/settings"
          children={visibleSettingsItems}
        />
      </nav>

      <div className="px-3 pb-2">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
        >
          <LogOut size={18} />
          Log out
        </button>
      </div>

      <SidebarFooterHint />
    </aside>
  );
}