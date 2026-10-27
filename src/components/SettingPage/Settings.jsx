import { useRef, useState } from "react";
import { Building2 } from "lucide-react";
import { useAuth } from "../../Context/AuthContext";
import { useSelectedBranch, setSelectedBranch } from "../../utils/selectedBranch";
import SettingsHeader from "./SettingsHeader";
import SettingsForm from "./SettingsForm/SettingsForm";
import BranchesList from "./BranchesList";
import AddBranchModal from "./modals/AddBranchModal";

export default function Settings() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";
  const [showAddBranch, setShowAddBranch] = useState(false);
  // The branch the super admin is working in. Shared app-wide (see
  // utils/selectedBranch.js): new orders, home collections and patients are
  // created under it, and the settings below are for it.
  const selectedBranch = useSelectedBranch();
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

    // keep the remembered working-branch name in sync too
    if (selectedBranch) {
      setSelectedBranch({ ...selectedBranch, name: labName });
    }
  }

  function handleSelectBranch(branch) {
    setSelectedBranch(branch); // null clears the selection
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="space-y-6">
      <SettingsHeader onAddBranch={() => setShowAddBranch(true)} />

      {isSuperAdmin && (
        <div
          className={`flex items-start gap-3 rounded-xl px-4 py-3 text-sm ${
            selectedBranch
              ? "bg-teal-50 text-teal-800"
              : "bg-amber-50 text-amber-800"
          }`}
        >
          <Building2 size={18} className="mt-0.5 shrink-0" />
          {selectedBranch ? (
            <p>
              Working branch: <span className="font-semibold">{selectedBranch.name}</span>.
              New patients, lab orders and home collections are created under this
              branch. Pick another branch below to switch.
            </p>
          ) : (
            <p>
              No branch selected. Pick a branch below — you need one before you can
              create patients, lab orders or home collections.
            </p>
          )}
        </div>
      )}
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