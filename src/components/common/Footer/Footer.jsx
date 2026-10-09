export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="flex items-center justify-between border-t border-gray-200 bg-white px-6 py-3 text-xs text-gray-500">
      <span>© {year} KIWISOFT. All rights reserved.</span>
      <span>Version 2.0</span>
    </footer>
  );
}