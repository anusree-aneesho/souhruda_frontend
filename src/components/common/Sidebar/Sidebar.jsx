// src/components/common/Sidebar/Sidebar.jsx
import SidebarLogo from "./SidebarLogo";
import SidebarNavItem from "./SidebarNavItem";
import SidebarFooterHint from "./SidebarFooterHint";
import {
  LayoutDashboard, ClipboardList, MapPin, FlaskConical,
  Users, Clock, Settings, UserCog, Wrench, Beaker,
} from "lucide-react";
const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { label: "Lab Orders", icon: ClipboardList, path: "/lab-orders", badge: 1 },
  { label: "Home Collection", icon: MapPin, path: "/home-collection", badge: 1 },
  { label: "Front Officer", icon: UserCog, path: "/staff" },
  { label: "Technicians", icon: Wrench, path: "/technicians" },
  { label: "Lab Assistant", icon: Beaker, path: "/lab-assistants" },
  { label: "Test Master", icon: FlaskConical, path: "/test-master" },
  { label: "Patients", icon: Users, path: "/patients" },
  { label: "Follow-ups", icon: Clock, path: "/follow-ups" },
  { label: "Settings", icon: Settings, path: "/settings" },
];
export default function Sidebar() {
  return (
    <aside className="sticky top-0 h-screen w-64 shrink-0 border-r border-gray-200 bg-white flex flex-col">
      <SidebarLogo />
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => (
          <SidebarNavItem key={item.path} {...item} />
        ))}
      </nav>
      <SidebarFooterHint />
    </aside>
  );
}