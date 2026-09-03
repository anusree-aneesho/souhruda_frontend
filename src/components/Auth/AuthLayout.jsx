// src/components/Auth/AuthLayout.jsx
export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen flex bg-[#f5f5fa]">
      {/* Brand panel - hidden on small screens, matches Sidebar styling */}
      <div className="hidden lg:flex lg:w-[42%] bg-teal-600 flex-col justify-between p-10 text-white">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-white text-teal-600 flex items-center justify-center font-bold text-sm">
            SR
          </div>
          <div>
            <p className="font-bold text-base leading-tight">SOUHRUDA</p>
            <p className="text-[11px] tracking-wide text-teal-100">LAB OS · DEMO</p>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-3xl font-bold leading-snug">
            Run your lab, <br /> not your spreadsheets.
          </h2>
          <p className="text-sm text-teal-100 max-w-sm">
            Orders, home collections, results and front officers — all in one place, built for
            everyday lab operations.
          </p>
        </div>

        <p className="text-xs text-teal-100">© {new Date().getFullYear()} Souhruda Lab OS</p>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Logo shown only when brand panel is hidden */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="h-9 w-9 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-sm">
              SR
            </div>
            <div>
              <p className="font-bold text-sm text-gray-900 leading-tight">SOUHRUDA</p>
              <p className="text-[10px] tracking-wide text-gray-400">LAB OS · DEMO</p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 sm:p-8 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
