// src/components/Reports/Reports.jsx
import { useParams, useNavigate, Navigate, Link } from "react-router-dom";
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
          <p className="text-xs text-gray-400 mb-1">
            <Link to="/reports" className="hover:text-gray-600">Reports</Link>
            <span className="mx-1.5">/</span>
            <span className="text-gray-600">{category.title}</span>
          </p>
          <h1 className="text-2xl font-bold text-gray-900">{category.title}</h1>
          <p className="text-sm text-gray-500 mt-1">
            Choose a report to see the numbers behind it.
          </p>
        </div>
        <ReportItemGrid
          category={category}
          onSelect={(key) => navigate(`/reports/${category.key}/${key}`)}
        />
        {category.quickView && (
          <category.quickView onViewAll={() => navigate(`/reports/${category.key}/${category.items[0].key}`)} />
        )}
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
      <p className="text-xs text-gray-400">
        <Link to="/reports" className="hover:text-gray-600">Reports</Link>
        <span className="mx-1.5">/</span>
        <Link to={`/reports/${category.key}`} className="hover:text-gray-600">{category.title}</Link>
        <span className="mx-1.5">/</span>
        <span className="text-gray-600">{item.title}</span>
      </p>
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