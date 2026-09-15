import { useRef, useState } from "react";
import SettingsHeader from "./SettingsHeader";
import SettingsForm from "./SettingsForm/SettingsForm";
import GstSettings from "./GstSettings";
import BranchesList from "./BranchesList";
import AddBranchModal from "./modals/AddBranchModal";

export default function Settings() {
  const [showAddBranch, setShowAddBranch] = useState(false);
  const [activeTab, setActiveTab] = useState("lab");
  const branchesListRef = useRef(null);

  function handleBranchAdded() {
    branchesListRef.current?.refresh();
  }

  return (
    <div className="space-y-6">
      <SettingsHeader onAddBranch={() => setShowAddBranch(true)} />

      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("lab")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
            activeTab === "lab"
              ? "border-teal-600 text-teal-700"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Lab Settings
        </button>
        <button
          onClick={() => setActiveTab("gst")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
            activeTab === "gst"
              ? "border-teal-600 text-teal-700"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          GST Settings
        </button>
      </div>

      {activeTab === "lab" ? <SettingsForm /> : <GstSettings />}

      <BranchesList ref={branchesListRef} />

      {showAddBranch && (
        <AddBranchModal onClose={() => setShowAddBranch(false)} onBranchAdded={handleBranchAdded} />
      )}
    </div>
  );
}