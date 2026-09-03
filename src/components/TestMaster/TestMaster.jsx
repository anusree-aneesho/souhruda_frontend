// src/components/TestMaster/TestMaster.jsx
import { useState } from "react";
import TestMasterHeader from "./TestMasterHeader";
import CategoryList from "./CategoryList/CategoryList";
import TestsTable from "../TestMaster/CategoryList/TestsTable/TestsTable";
import AddCategoryModal from "./modals/AddCategoryModal";
import AddTestModal from "./modals/AddTestModal";
import { categories as initialCategories, testsByCategory as initialTests } from "../../data/testCatalog";

const dotColors = ["teal", "pink", "purple", "amber"];

export default function TestMaster() {
  const [categories, setCategories] = useState(initialCategories);
  const [testsByCategory, setTestsByCategory] = useState(initialTests);
  const [activeCategory, setActiveCategory] = useState(initialCategories[0]?.name || "");

  const [isCategoryModalOpen, setCategoryModalOpen] = useState(false);
  const [testModalState, setTestModalState] = useState(null); // null | { editingTest: null | test }

  const categoriesWithCount = categories.map((cat) => ({
    ...cat,
    count: (testsByCategory[cat.name] || []).length,
  }));

  function handleAddCategory(name) {
    if (categories.some((c) => c.name.toLowerCase() === name.toLowerCase())) return;
    const color = dotColors[categories.length % dotColors.length];
    setCategories((prev) => [...prev, { name, color }]);
    setTestsByCategory((prev) => ({ ...prev, [name]: [] }));
    setActiveCategory(name);
    setCategoryModalOpen(false);
  }

  function handleSaveTest(testData) {
    setTestsByCategory((prev) => {
      const updated = { ...prev };

      // Remove from old category if editing and category changed
      if (testModalState?.editingTest) {
        const oldCategory = testModalState.editingTest.category;
        updated[oldCategory] = updated[oldCategory].filter((t) => t.id !== testModalState.editingTest.id);
      }

      const targetList = updated[testData.category] || [];
      updated[testData.category] = [...targetList, testData];
      return updated;
    });
    setActiveCategory(testData.category);
    setTestModalState(null);
  }

  function handleRemoveTest(test) {
    if (!window.confirm(`Remove "${test.name}"? This can't be undone.`)) return;
    setTestsByCategory((prev) => ({
      ...prev,
      [activeCategory]: prev[activeCategory].filter((t) => t.id !== test.id),
    }));
  }

  return (
    <div className="space-y-6">
      <TestMasterHeader onAddCategory={() => setCategoryModalOpen(true)} />

      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6">
        <CategoryList
          categories={categoriesWithCount}
          activeCategory={activeCategory}
          onSelect={setActiveCategory}
        />
        <TestsTable
          categoryName={activeCategory}
          tests={(testsByCategory[activeCategory] || []).map((t) => ({ ...t, category: activeCategory }))}
          onAddTest={() => setTestModalState({ editingTest: null })}
          onEditTest={(test) => setTestModalState({ editingTest: test })}
          onRemoveTest={handleRemoveTest}
        />
      </div>

      {isCategoryModalOpen && (
        <AddCategoryModal
          onClose={() => setCategoryModalOpen(false)}
          onAdd={handleAddCategory}
        />
      )}

      {testModalState && (
        <AddTestModal
          categories={categories}
          defaultCategory={activeCategory}
          editingTest={testModalState.editingTest}
          onClose={() => setTestModalState(null)}
          onSave={handleSaveTest}
        />
      )}
    </div>
  );
}