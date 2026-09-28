
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getPatientsReportApi } from "../../api/api";
import { todayIso, daysAgoIso } from "./shared/format";
import PatientTable from "./PatientTable";

export default function PatientQuickView({ onViewAll }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;

    async function loadPatients() {
      setLoading(true);

      try {
        const response = await getPatientsReportApi({
          dateFrom: daysAgoIso(30),
          dateTo: todayIso(),
          page,
        });

        if (cancelled) return;

        setData(response);
      } catch (error) {
        console.error("Patient Quick View error:", error);

        if (!cancelled) {
          setData(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadPatients();

    return () => {
      cancelled = true;
    };
  }, [page]);

  /*
   * This is the same structure used by PatientsReport:
   *
   * data.rows
   * data.pagination.normal
   */

  const rows = data?.rows || [];

  const pagination = data?.pagination?.normal || {};

  const currentPage = pagination.current_page || page;

  const totalPages = pagination.last_page || 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            Patient Summary
          </h3>

          <p className="text-xs text-gray-400 mt-0.5">
            Recent patient activity
          </p>
        </div>

      </div>

      <PatientTable
        rows={rows}
        loading={loading}
        page={currentPage}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </div>
  );
}
