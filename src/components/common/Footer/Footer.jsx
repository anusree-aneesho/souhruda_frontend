export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-200 bg-white px-6 py-3 text-right text-xs text-gray-500">
      © {year} KIWISOFT. All rights reserved. · Version 2.0
    </footer>
  );
}