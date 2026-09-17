import { useAuth } from "../../Context/AuthContext";

export default function SettingsHeader({ onAddBranch }) {
  const { user } = useAuth();
  const canManageBranches = user?.role === "super_admin";

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Lab Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Basic details used on printed reports and WhatsApp messages.
        </p>
      </div>
      {canManageBranches && (
        <button
          onClick={onAddBranch}
          className="rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-700 transition-colors cursor-pointer"
        >
          + Add Branch
        </button>
      )}
    </div>
  );
}