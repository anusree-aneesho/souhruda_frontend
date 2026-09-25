// src/components/Reports/Reports.jsx
import { useParams, useNavigate, Navigate } from "react-router-dom";
import ReportItemGrid from "./ReportItemGrid";
import ComingSoonReport from "./ComingSoonReport";
import { REPORT_CATEGORIES } from "./reportConfig";

export default function Reports() {
  const { categoryKey, itemKey } = useParams();
  const navigate = useNavigate();

  const category = REPORT_CATEGORIES.find((c) => c.key === categoryKey);

  // Unknown category in the URL — send back to the first real category.
  if (!category) {
    return <Navigate to={`/reports/${REPORT_CATEGORIES[0].key}`} replace />;
  }

  // Just a category was clicked in the sidebar — show its report cards as page content.
  if (!itemKey) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{category.title}</h1>
          <p className="text-sm text-gray-500 mt-1">
            Choose a report to see the numbers behind it.
          </p>
        </div>
        <ReportItemGrid
          category={category}
          onSelect={(key) => navigate(`/reports/${category.key}/${key}`)}
        />
      </div>
    );
  }

  const item = category.items.find((i) => i.key === itemKey);

  // Unknown report key under a valid category — fall back to the category's card list.
  if (!item) {
    return <Navigate to={`/reports/${category.key}`} replace />;
  }

  const ActiveComponent = item.component;
  const goBack = () => navigate(`/reports/${category.key}`);

  return (
    <div className="space-y-6">
      {ActiveComponent ? (
        <ActiveComponent onBack={goBack} />
      ) : (
        <ComingSoonReport
          title={item.title}
          description={item.description}
          icon={item.icon}
          onBack={goBack}
        />
      )}
    </div>
  );
}