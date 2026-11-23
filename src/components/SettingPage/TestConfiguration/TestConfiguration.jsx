// src/components/SettingPage/TestConfiguration/TestConfiguration.jsx
import { useState, useMemo } from "react";
import { Package2, Stethoscope, Tag } from "lucide-react";
import TestPackage from "./TestPackage";
import Doctors from "./Doctors";
import TestPrice from "./TestPrice";
import { useAuth } from "../../../Context/AuthContext";

// Tabs without `allowedRoles` are visible to everyone.
// Tabs with `allowedRoles` are visible only to those roles (e.g. front officers won't see Test Price).
const TABS = [
  { key: "test-package", label: "Test Package", icon: Package2, Component: TestPackage },
  { key: "doctors", label: "Doctors", icon: Stethoscope, Component: Doctors },
  {
    key: "test-price",
    label: "Test Price",
    icon: Tag,
    Component: TestPrice,
    allowedRoles: ["super_admin", "admin", "lab_incharge"],
  },
];

export default function TestConfiguration() {
  const { user } = useAuth();
  const role = user?.role;

  const visibleTabs = useMemo(
    () => TABS.filter((t) => !t.allowedRoles || t.allowedRoles.includes(role)),
    [role]
  );

  const [activeTab, setActiveTab] = useState(visibleTabs[0]?.key);

  // Fall back to the first allowed tab if the active one isn't permitted
  const ActivePanel = (
    visibleTabs.find((t) => t.key === activeTab) ?? visibleTabs[0]
  )?.Component;

  const canSeePricing = visibleTabs.some((t) => t.key === "test-price");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Test Configuration</h1>
        <p className="text-sm text-gray-500 mt-1">
          {canSeePricing
            ? "Manage test packages, referring doctors, and test pricing."
            : "Manage test packages and referring doctors."}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {visibleTabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              activeTab === key
                ? "bg-teal-600 text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {ActivePanel && <ActivePanel />}
    </div>
  );
}