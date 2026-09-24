import { useEffect, useState } from "react";
import { getDoctorsApi, deleteDoctorApi } from "../../../api/api";
import AddDoctorModal from "./modals/AddDoctorModal";
import Toast from "../../common/Toast/Toast";
import { useToast } from "../../common/Toast/useToast";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Phone,
  Building2,
  Stethoscope,
  Loader2,
  UserRound,
} from "lucide-react";

export default function Doctors() {
  const { toast, showToast, hideToast } = useToast();
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);

  const fetchDoctors = async (pageNum = 1) => {
    setLoading(true);
    const res = await getDoctorsApi(pageNum);
    setDoctors(res.data);
    setLastPage(res.last_page);
    setPage(res.current_page);
    setLoading(false);
  };

  useEffect(() => {
    fetchDoctors(1);
  }, []);

  const handleDelete = async (id) => {
    if (!confirm("Remove this doctor?")) return;
    const target = doctors.find((d) => d.id === id);
    try {
      await deleteDoctorApi(id);
      showToast(`Doctor ${target?.name || ""} was removed.`, "success");
      fetchDoctors(page);
    } catch (err) {
      showToast(err.message || "Failed to remove doctor.", "error");
    }
  };

  const handleSaved = (savedDoctor, isEdit) => {
    setShowAddModal(false);
    setEditingDoctor(null);
    showToast(
      `Doctor ${savedDoctor?.name || ""} was ${isEdit ? "updated" : "added"}.`,
      "success"
    );
    fetchDoctors(page);
  };

  const filteredDoctors = doctors.filter((doc) =>
    doc.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
            <Stethoscope size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Doctors
            
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Referring doctors linked to patient reports.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search doctors..."
              className="w-64 border border-gray-200 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 transition-colors text-white px-5 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap"
          >
            <Plus size={16} />
            Add Doctor
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl p-8 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 text-xs uppercase tracking-wide bg-gray-50">
              <th className="py-3 px-3 font-medium rounded-l-lg">Reg. No</th>
              <th className="font-medium px-3">Name</th>
              <th className="font-medium px-3">Qualification</th>
              <th className="font-medium px-3">Specialization</th>
              <th className="font-medium px-3">Phone</th>
              <th className="font-medium px-3">Hospital/Clinic</th>
              <th className="font-medium text-right pr-5 rounded-r-lg">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-gray-400">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    Loading doctors...
                  </div>
                </td>
              </tr>
            ) : filteredDoctors.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-14 text-center">
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center">
                      <UserRound size={22} />
                    </div>
                    <p className="text-sm">No doctors found.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredDoctors.map((doc) => (
                <tr
                  key={doc.id}
                  className="border-b border-gray-100 last:border-0 hover:bg-gray-50/70 transition-colors"
                >
                  <td className="py-4 px-3 text-gray-600">{doc.registration_no}</td>
                  <td className="px-3">
                    <span className="font-semibold text-gray-900">
                      <span className="text-teal-600">Dr. </span>
                      {doc.name}
                    </span>
                  </td>
                  <td className="px-3 text-gray-600">{doc.qualifications_summary || "-"}</td>
                  <td className="px-3">
                    {doc.specialization ? (
                      <span className="inline-flex items-center rounded-full bg-teal-50 text-teal-700 text-xs font-medium px-2.5 py-1">
                        {doc.specialization}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-3 text-gray-600">
                    <span className="inline-flex items-center gap-1.5">
                      <Phone size={13} className="text-gray-400" />
                      {doc.phone}
                    </span>
                  </td>
                  <td className="px-3 text-gray-600">
                    {doc.hospital_clinic ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Building2 size={13} className="text-gray-400" />
                        {doc.hospital_clinic}
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="text-right pr-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setEditingDoctor(doc)}
                        title="Edit"
                        className="p-1.5 rounded-md text-teal-600 hover:bg-teal-50 transition-colors"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        title="Delete"
                        className="p-1.5 rounded-md text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {lastPage > 1 && (
          <div className="flex justify-end items-center gap-2 mt-6 text-sm">
            <button
              disabled={page === 1}
              onClick={() => fetchDoctors(page - 1)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors disabled:hover:bg-transparent"
            >
              Prev
            </button>
            <span className="px-2 py-1 text-gray-500">
              Page {page} of {lastPage}
            </span>
            <button
              disabled={page === lastPage}
              onClick={() => fetchDoctors(page + 1)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors disabled:hover:bg-transparent"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {(showAddModal || editingDoctor) && (
        <AddDoctorModal
          doctor={editingDoctor}
          onClose={() => {
            setShowAddModal(false);
            setEditingDoctor(null);
          }}
          onSaved={handleSaved}
        />
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}
    </div>
  );
}