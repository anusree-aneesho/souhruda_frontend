// src/components/Dashboard/WelcomeHeader.jsx
import { Home, Plus } from "lucide-react";
import { useOrderModal } from "../../Context/OrderModalContext";
import { useAuth } from "../../Context/AuthContext";

export default function WelcomeHeader() {
  const { open } = useOrderModal();
  const { user } = useAuth();
  const displayName = user?.name || "there";

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome, {displayName}</h1>
        <p className="text-sm text-gray-500 mt-1">
          Here's what's moving through the lab today.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={()=>open("homeCollection")} className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">
          <Home size={16} />
          Book Home Collection
        </button>

        <button
         onClick={() => open("order")}
          className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
        >
          <Plus size={16} />
          New Order
        </button>
      </div>
    </div>
  );
}