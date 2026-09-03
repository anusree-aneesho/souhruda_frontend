// src/layouts/MainLayout.jsx
import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Menu, X } from "lucide-react";
import Sidebar from "../components/common/Sidebar/Sidebar";
import Topbar from "../components/common/Topbar/Topbar";
import CommandPalette from "../components/common/CommandPalette/CommandPalette";
import NewOrderModal from "../components/common/NewOrderModal/NewOrderModal";
import HomeCollectionDetailModal from "../components/HomeCollection/DetailModal/HomeCollectionDetailModal";
import LabAssistant from "../components/common/LabAssistant/LabAssistant";

export default function MainLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#f5f5fa]">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Mobile sidebar drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-64">
            <Sidebar />
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-5 right-3 text-gray-400"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="md:hidden flex items-center px-4 py-3 border-b border-gray-200 bg-white">
          <button onClick={() => setMobileOpen(true)} className="text-gray-600">
            <Menu size={22} />
          </button>
        </div>
        <Topbar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>

      <CommandPalette />
      <NewOrderModal />
      <HomeCollectionDetailModal />
      <LabAssistant />
    </div>
  );
}