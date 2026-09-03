import { useRef, useState } from "react";
import SettingsHeader from "./SettingsHeader";
import SettingsForm from "./SettingsForm/SettingsForm";
import BranchesList from "./BranchesList";
import AddBranchModal from "./modals/AddBranchModal";

export default function Settings() {
  const [showAddBranch, setShowAddBranch] = useState(false);
  const branchesListRef = useRef(null);

  function handleBranchAdded() {
    branchesListRef.current?.refresh();
  }

  return (
    <div className="space-y-6">
      <SettingsHeader onAddBranch={() => setShowAddBranch(true)} />
      <SettingsForm />
      <BranchesList ref={branchesListRef} />

      {showAddBranch && (
        <AddBranchModal
          onClose={() => setShowAddBranch(false)}
          onBranchAdded={handleBranchAdded}
        />
      )}
    </div>
  );
}