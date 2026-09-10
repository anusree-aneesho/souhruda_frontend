// src/components/common/Sidebar/SidebarFooterHint.jsx
export default function SidebarFooterHint() {
  return (
    <div className="px-4 py-4 text-xs text-gray-400 leading-relaxed">
      Use{" "}
      <kbd className="text-teal-600 font-medium bg-teal-50 rounded px-1 py-0.5">
        ⌘K
      </kbd>
      {" / "}
      <kbd className="text-teal-600 font-medium bg-teal-50 rounded px-1 py-0.5">
        Ctrl K
      </kbd>
      {" "}to quickly access pages and features.
    </div>
  );
}