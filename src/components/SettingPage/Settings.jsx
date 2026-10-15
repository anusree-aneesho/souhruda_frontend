import { useRef, useState } from "react";
import SettingsHeader from "./SettingsHeader";
import SettingsForm from "./SettingsForm/SettingsForm";
import BranchesList from "./BranchesList";
import AddBranchModal from "./modals/AddBranchModal";

const STORAGE_KEY = "souhruda_selected_branch";

export default function Settings() {
  const [showAddBranch, setShowAddBranch] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [formVersion, setFormVersion] = useState(0);
  const branchesListRef = useRef(null);

  function handleBranchAdded() {
    branchesListRef.current?.refresh();
  }

  function handleBranchUpdated() {
    setFormVersion((v) => v + 1);
  }

  function handleSettingsSaved(labName) {
    branchesListRef.current?.refresh();

    // keep the remembered "Viewing" branch name in sync too
    setSelectedBranch((prev) => {
      if (!prev) return prev;
      const next = { ...prev, name: labName };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  }

  function handleSelectBranch(branch) {
    setSelectedBranch(branch);
    try {
      if (branch) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(branch));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // ignore storage errors (private browsing, quota, etc.)
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="space-y-6">
      <SettingsHeader onAddBranch={() => setShowAddBranch(true)} />
      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6">
        <BranchesList
          ref={branchesListRef}
          selectedBranchId={selectedBranch?.id ?? null}
          onSelectBranch={handleSelectBranch}
          onBranchUpdated={handleBranchUpdated}
        />
        <SettingsForm
          key={`${selectedBranch?.id ?? "default"}-${formVersion}`}
          branchId={selectedBranch?.id ?? null}
          branchName={selectedBranch?.name ?? ""}
          onSaved={handleSettingsSaved}
        />
      </div>

      {showAddBranch && (
        <AddBranchModal onClose={() => setShowAddBranch(false)} onBranchAdded={handleBranchAdded} />
      )}
    </div>
  );
}