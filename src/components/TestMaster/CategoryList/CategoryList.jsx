// src/components/TestMaster/CategoryList/CategoryList.jsx
import CategoryItem from "./CategoryItem";

export default function CategoryList({ categories, activeCategory, onSelect }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <h3 className="font-semibold text-sm text-gray-900 mb-3">Categories</h3>
      <div className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible">
        {categories.map((cat) => (
          <CategoryItem
            key={cat.name}
            {...cat}
            isActive={activeCategory === cat.name}
            onClick={() => onSelect(cat.name)}
          />
        ))}
      </div>
    </div>
  );
}