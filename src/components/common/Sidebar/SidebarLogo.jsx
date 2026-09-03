// src/components/common/Sidebar/SidebarLogo.jsx
export default function SidebarLogo() {
  return (
    <div className="flex items-center gap-3 px-5 py-6">
      <div className="h-9 w-9 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-sm">
        SR
      </div>
      <div>
        <p className="font-bold text-sm text-gray-900 leading-tight">SOUHRUDA</p>
        <p className="text-[10px] tracking-wide text-gray-400">LAB OS · DEMO</p>
      </div>
    </div>
  );
}