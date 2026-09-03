// src/components/common/Sidebar/SidebarFooterHint.jsx
export default function SidebarFooterHint() {
  return (
    <div className="px-4 py-4 text-xs text-gray-400 leading-relaxed">
      Press{" "}
      <kbd className="text-teal-600 font-medium bg-teal-50 rounded px-1 py-0.5">⌘K</kbd>
      {" / "}
      <kbd className="text-teal-600 font-medium bg-teal-50 rounded px-1 py-0.5">Ctrl K</kbd>
      {" "}to jump anywhere. Demo build for developer handoff — data resets on page reload. Wire endpoints per the{" "}
      <span className="text-gray-500">// API:</span> comments in the script below.
    </div>
  );
}