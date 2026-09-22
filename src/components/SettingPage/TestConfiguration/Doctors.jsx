import { useEffect, useState } from "react";
import { getDoctorsApi, deleteDoctorApi } from "../../../api/api";
import AddDoctorModal from "./modals/AddDoctorModal";

export default function Doctors() {
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
    await deleteDoctorApi(id);
    fetchDoctors(page);
  };

  const handleSaved = () => {
    setShowAddModal(false);
    setEditingDoctor(null);
    fetchDoctors(page);
  };

  const filteredDoctors = doctors.filter((doc) =>
    doc.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Doctors</h2>
          <p className="text-sm text-gray-500 mt-1">
            Referring doctors linked to patient reports.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search doctors..."
            className="w-64 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-teal-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap"
          >
            + Add Doctor
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl p-8 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400 text-xs uppercase tracking-wide border-b">
              <th className="py-3 font-medium">Reg. No</th>
              <th className="font-medium">Name</th>
              <th className="font-medium">Qualification</th>
              <th className="font-medium">Specialization</th>
              <th className="font-medium">Phone</th>
              <th className="font-medium">Hospital/Clinic</th>
              <th className="font-medium text-right pr-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="py-6 text-center text-gray-400">
                  Loading...
                </td>
              </tr>
            ) : filteredDoctors.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-6 text-center text-gray-400">
                  No doctors found.
                </td>
              </tr>
            ) : (
              filteredDoctors.map((doc) => (
                <tr key={doc.id} className="border-b last:border-0">
                  <td className="py-4 text-gray-600">{doc.registration_no}</td>
                  <td className="font-semibold text-gray-900">{doc.name}</td>
                  <td className="text-gray-600">{doc.qualifications_summary || "-"}</td>
                  <td className="text-gray-600">{doc.specialization || "-"}</td>
                  <td className="text-gray-600">{doc.phone}</td>
                  <td className="text-gray-600">{doc.hospital_clinic || "-"}</td>
                  <td className="text-right pr-2">
                    <button
                      onClick={() => setEditingDoctor(doc)}
                      className="text-teal-600 font-medium"
                    >
                      Edit
                    </button>
                    <span className="text-gray-300 mx-2">·</span>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="text-red-500 font-medium"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {lastPage > 1 && (
          <div className="flex justify-end gap-2 mt-6 text-sm">
            <button
              disabled={page === 1}
              onClick={() => fetchDoctors(page - 1)}
              className="px-3 py-1 border rounded disabled:opacity-40"
            >
              Prev
            </button>
            <span className="px-2 py-1 text-gray-500">
              Page {page} of {lastPage}
            </span>
            <button
              disabled={page === lastPage}
              onClick={() => fetchDoctors(page + 1)}
              className="px-3 py-1 border rounded disabled:opacity-40"
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
    </div>
  );
}