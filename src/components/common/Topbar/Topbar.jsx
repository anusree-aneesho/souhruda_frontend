// src/components/common/Topbar/Topbar.jsx
import SearchBar from "./SearchBar";
import TopbarActions from "../Topbar/TopbarActions";

export default function Topbar() {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
      <SearchBar />
      <TopbarActions />
    </header>
  );
}