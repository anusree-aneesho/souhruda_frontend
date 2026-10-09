// src/components/SettingPage/StaffManagement.jsx
import { useState, useMemo, useEffect } from "react";
import { Plus, Search, Pencil, Trash2, Star } from "lucide-react";
import AddStaffModal from "./modals/AddStaffModal";
import TechnicianDetailsDrawer from "./TechnicianDetailsDrawer";
import ConfirmModal from "../Patients/modals/ConfirmModal";
import { addStaffApi, getStaffMembersApi, updateStaffMemberApi, deleteStaffMemberApi, updateTechnicianRatingApi } from "../../api/api";
import Toast from "../common/Toast/Toast";
import { useToast } from "../common/Toast/useToast";
import { useAuth } from "../../Context/AuthContext";

const TECHNICIAN_ROLE = "Technician";

const TECHNICIAN_STATUS_STYLES = {
  Available: "bg-teal-50 text-teal-700",
  "On Job": "bg-amber-50 text-amber-700",
  Offline: "bg-gray-100 text-gray-500",
};

const ROLE_VALUE_MAP = {
  "Front Office": "front_office",
  "Technician": "technician",
  "Lab Assistant": "lab_assistant",
  "Admin": "admin",
};

function mapStaff(s) {
  return {
    id: s.id,
    staffId: s.staff_id,
    name: s.name,
    email: s.email,
    phone: s.phone,
    role: s.role,
    branch: s.branch || "-",
    branch_id: s.branch_id,
    status: s.status,
    latitude: s.latitude,
    longitude: s.longitude,
    // Technician-only (null for other roles)
    rating: s.rating,
    assignedJobs: s.assigned_jobs,
    completedJobs: s.completed_jobs,
    currentStatus: s.current_status,
  };
}

function StaffStatusBadge({ status }) {
  const isActive = status === "Active";
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
        isActive ? "bg-teal-50 text-teal-700" : "bg-gray-100 text-gray-500"
      }`}
    >
      {status}
    </span>
  );
}

function StaffHeader({ onAddStaff }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
        <p className="text-sm text-gray-500 mt-1">
          Everyone with access to the lab, across roles and branches.
        </p>
      </div>
      <button
        onClick={onAddStaff}
        className="flex items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-700 transition-colors w-full sm:w-auto cursor-pointer"
      >
        <Plus size={16} />
        Add Staff
      </button>
    </div>
  );
}

function StaffSearch({ value, onChange }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2.5 w-full sm:w-72">
      <Search size={16} className="text-gray-400 shrink-0" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search Staff..."
        className="flex-1 text-sm outline-none placeholder:text-gray-400 min-w-0"
      />
    </div>
  );
}

function RoleFilter({ value, onChange, roles }) {
  return (
    <div className="flex flex-col gap-1 w-full sm:w-48">
      <label htmlFor="staff-role-filter" className="text-xs font-medium text-gray-500">
        Role
      </label>
      <select
        id="staff-role-filter"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-teal-500 cursor-pointer"
      >
        <option value="">All Roles</option>
        {roles.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
    </div>
  );
}

// Name is a clickable link only for technicians (opens the details drawer).
function StaffName({ staff, onView }) {
  if (staff.role !== TECHNICIAN_ROLE) {
    return <span className="font-medium text-gray-900">{staff.name}</span>;
  }
  return (
    <button
      onClick={() => onView(staff)}
      className="font-medium text-gray-900 hover:text-teal-600 text-left cursor-pointer"
      title="View technician details"
    >
      {staff.name}
    </button>
  );
}

function TechnicianStatusBadge({ status }) {
  if (!status) return <span className="text-gray-400">-</span>;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
        TECHNICIAN_STATUS_STYLES[status] || "bg-gray-100 text-gray-500"
      }`}
    >
      {status}
    </span>
  );
}

function StaffRow({ staff, onEdit, onRemove, onView, showTechnicianColumns }) {
  const { staffId, name, email, phone, role, branch, status, rating, assignedJobs, currentStatus } = staff;
  return (
    <tr className="border-b border-gray-100 last:border-0">
      <td className="py-3 text-sm text-gray-500">{staffId}</td>
      <td className="py-3 text-sm">
        <StaffName staff={staff} onView={onView} />
      </td>
      <td className="py-3 text-sm text-gray-500">{email}</td>
      <td className="py-3 text-sm text-gray-500">{phone}</td>
      <td className="py-3 text-sm text-gray-500">{role}</td>
      <td className="py-3 text-sm text-gray-500">{branch}</td>
      {showTechnicianColumns && (
        <>
          <td className="py-3 text-sm text-gray-700">
            {rating != null ? (
              <span className="inline-flex items-center gap-1">
                <Star size={14} className="text-amber-400 fill-amber-400" />
                {rating}
              </span>
            ) : (
              "-"
            )}
          </td>
          <td className="py-3 text-sm text-teal-600 font-medium">{assignedJobs ?? 0}</td>
          <td className="py-3 text-sm">
            <TechnicianStatusBadge status={currentStatus} />
          </td>
        </>
      )}
      <td className="py-3 text-sm">
        <StaffStatusBadge status={status} />
      </td>
      <td className="py-3 text-right">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => onEdit(staff)}
            className="p-1.5 rounded-md text-teal-600 hover:bg-teal-50 cursor-pointer"
            aria-label={`Edit ${name}`}
            title="Edit"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={() => onRemove(staff)}
            className="p-1.5 rounded-md text-red-500 hover:bg-red-50 cursor-pointer"
            aria-label={`Remove ${name}`}
            title="Remove"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </td>
    </tr>
  );
}

function StaffCard({ staff, onEdit, onRemove, onView }) {
  const { staffId, name, email, phone, role, branch, status } = staff;
  return (
    <div className="border border-gray-100 rounded-lg p-4 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">
          <StaffName staff={staff} onView={onView} />
        </p>
        <StaffStatusBadge status={status} />
      </div>
      <p className="text-xs text-gray-400">{staffId} · {role}</p>
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>{branch}</span>
        <span>{phone}</span>
      </div>
      <p className="text-sm text-gray-500">{email}</p>
      <div className="flex items-center gap-4 pt-1">
        <button onClick={() => onEdit(staff)} className="text-sm text-teal-600 font-medium hover:underline cursor-pointer">
          Edit
        </button>
        <button onClick={() => onRemove(staff)} className="text-sm text-red-500 font-medium hover:underline cursor-pointer">
          Remove
        </button>
      </div>
    </div>
  );
}

export default function StaffManagement() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [viewingTechnician, setViewingTechnician] = useState(null); // staff | null
  const [modalState, setModalState] = useState(null);
  const [staffMembers, setStaffMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmingRemove, setConfirmingRemove] = useState(null); // staff | null
  const { toast, showToast, hideToast } = useToast();
  const { user } = useAuth();

  // Admin accounts are only listed (and filterable) for super admins — mirrors StaffController@index.
  const roleOptions = useMemo(() => {
    const base = ["Front Office", "Technician", "Lab Assistant"];
    return String(user?.role ?? "").toLowerCase().replace(/[\s-]+/g, "_") === "super_admin"
      ? [...base, "Admin"]
      : base;
  }, [user]);

  const showTechnicianColumns = roleFilter === TECHNICIAN_ROLE;

  useEffect(() => {
    let cancelled = false;

    getStaffMembersApi()
      .then((res) => {
        if (!cancelled) setStaffMembers((res.data || []).map(mapStaff));
      })
      .catch(() => {
        if (!cancelled) setStaffMembers([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredStaff = useMemo(() => {
    const q = search.toLowerCase();
    return staffMembers.filter(
      (s) =>
        (!roleFilter || s.role === roleFilter) &&
        (s.name.toLowerCase().includes(q) ||
          s.staffId.toLowerCase().includes(q) ||
          (s.phone ?? "").includes(search) ||
          (s.branch ?? "").toLowerCase().includes(q))
    );
  }, [staffMembers, search, roleFilter]);

  function handleAddStaff() {
    setModalState({ editingStaff: null });
  }

  function handleEdit(staff) {
    setViewingTechnician(null);
    setModalState({ editingStaff: staff });
  }

  // Called from the Technician Details drawer; throws so the drawer can show the error.
  async function handleSaveRating(technician, rating) {
    const res = await updateTechnicianRatingApi(technician.id, rating);
    const saved = res?.data?.rating ?? rating;
    setStaffMembers((prev) => prev.map((s) => (s.id === technician.id ? { ...s, rating: saved } : s)));
    setViewingTechnician((prev) => (prev?.id === technician.id ? { ...prev, rating: saved } : prev));
    showToast(`Rating updated for ${technician.name}.`);
  }

  async function handleSaveStaff(formData) {
    const isEdit = Boolean(formData.id);

    try {
      if (isEdit) {
        const payload = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          branch_id: formData.branch_id,
          status: formData.status,
          latitude: formData.latitude || null,
          longitude: formData.longitude || null,
        };

        await updateStaffMemberApi(formData.id, payload);
        showToast(`${formData.name} updated successfully.`);
      } else {
        const payload = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          branch_id: formData.branch_id,
          role: ROLE_VALUE_MAP[formData.role],
          status: formData.status,
          latitude: formData.latitude || null,
          longitude: formData.longitude || null,
        };

        await addStaffApi(payload);
        showToast(`${formData.name} added successfully — credentials emailed.`);
      }

      setModalState(null);
      const res = await getStaffMembersApi();
      const refreshed = (res.data || []).map(mapStaff);
      setStaffMembers(refreshed);
      setViewingTechnician((prev) => (prev ? refreshed.find((s) => s.id === prev.id) ?? null : null));
    } catch (err) {
      showToast(err.message || "Failed to save staff member.", "error");
    }
  }

  function handleRemove(staff) {
    setConfirmingRemove(staff);
  }

  async function confirmRemove() {
    const staff = confirmingRemove;
    setConfirmingRemove(null);

    try {
      await deleteStaffMemberApi(staff.id);
      setStaffMembers((prev) => prev.filter((s) => s.id !== staff.id));
      setViewingTechnician((prev) => (prev?.id === staff.id ? null : prev));
      showToast(`${staff.name} removed successfully.`);
    } catch (err) {
      showToast(err.message || "Failed to remove staff member.", "error");
    }
  }
  return (
    <div className="space-y-6">
      <StaffHeader onAddStaff={handleAddStaff} />

      <div className="bg-white rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          <StaffSearch value={search} onChange={setSearch} />
          <RoleFilter value={roleFilter} onChange={setRoleFilter} roles={roleOptions} />
        </div>

        {isLoading ? (
          <p className="text-sm text-gray-400 text-center py-6">Loading staff...</p>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className={`w-full ${showTechnicianColumns ? "min-w-[1020px]" : "min-w-[820px]"}`}>
                <thead>
                  <tr className="text-left border-b border-gray-100">
                    <th className="pb-2 text-xs font-medium text-gray-400 tracking-wide">STAFF ID</th>
                    <th className="pb-2 text-xs font-medium text-gray-400 tracking-wide">NAME</th>
                    <th className="pb-2 text-xs font-medium text-gray-400 tracking-wide">EMAIL</th>
                    <th className="pb-2 text-xs font-medium text-gray-400 tracking-wide">PHONE</th>
                    <th className="pb-2 text-xs font-medium text-gray-400 tracking-wide">ROLE</th>
                    <th className="pb-2 text-xs font-medium text-gray-400 tracking-wide">BRANCH</th>
                    {showTechnicianColumns && (
                      <>
                        <th className="pb-2 text-xs font-medium text-gray-400 tracking-wide">RATING</th>
                        <th className="pb-2 text-xs font-medium text-gray-400 tracking-wide">ASSIGNED JOBS</th>
                        <th className="pb-2 text-xs font-medium text-gray-400 tracking-wide">CURRENT STATUS</th>
                      </>
                    )}
                    <th className="pb-2 text-xs font-medium text-gray-400 tracking-wide">STATUS</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStaff.map((staff) => (
                    <StaffRow
                      key={staff.staffId}
                      staff={staff}
                      onEdit={handleEdit}
                      onRemove={handleRemove}
                      onView={setViewingTechnician}
                      showTechnicianColumns={showTechnicianColumns}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden space-y-3">
              {filteredStaff.map((staff) => (
                <StaffCard key={staff.staffId} staff={staff} onEdit={handleEdit} onRemove={handleRemove} onView={setViewingTechnician} />
              ))}
            </div>

            {filteredStaff.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-6">No staff found.</p>
            )}
          </>
        )}
      </div>

      {modalState && (
        <AddStaffModal
          editingStaff={modalState.editingStaff}
          onClose={() => setModalState(null)}
          onSave={handleSaveStaff}
        />
      )}

      {viewingTechnician && (
        <TechnicianDetailsDrawer
          technician={viewingTechnician}
          onClose={() => setViewingTechnician(null)}
          onEditProfile={handleEdit}
          onSaveRating={handleSaveRating}
        />
      )}

      {confirmingRemove && (
        <ConfirmModal
          title="Remove Staff"
          message={`Are you sure you want to remove ${confirmingRemove.name} (${confirmingRemove.role})?`}
          confirmLabel="Remove"
          cancelLabel="Keep Staff"
          danger
          onConfirm={confirmRemove}
          onClose={() => setConfirmingRemove(null)}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  );
}