// src/components/SettingPage/TestConfiguration/TestConfiguration.jsx
import { useState } from "react";
import { Package2, Stethoscope, Tag } from "lucide-react";
import TestPackage from "./TestPackage";
import Doctors from "./Doctors";
import TestPrice from "./TestPrice";

const TABS = [
  { key: "test-package", label: "Test Package", icon: Package2, Component: TestPackage },
  { key: "doctors", label: "Doctors", icon: Stethoscope, Component: Doctors },
  { key: "test-price", label: "Test Price", icon: Tag, Component: TestPrice },
];

export default function TestConfiguration() {
  const [activeTab, setActiveTab] = useState(TABS[0].key);
  const ActivePanel = TABS.find((t) => t.key === activeTab)?.Component;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Test Configuration</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage test packages, referring doctors, and test pricing.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map(({ key, label, icon: Icon }) => (
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