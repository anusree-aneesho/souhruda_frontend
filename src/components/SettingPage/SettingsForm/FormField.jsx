export default function FormField({ label, name, value, onChange, placeholder, type = "text", error }) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-semibold text-gray-900 mb-1.5">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-gray-900 outline-none focus:ring-1 transition-colors ${
          error
            ? "border-red-300 focus:border-red-500 focus:ring-red-500"
            : "border-gray-200 focus:border-teal-500 focus:ring-teal-500"
        }`}
      />
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}