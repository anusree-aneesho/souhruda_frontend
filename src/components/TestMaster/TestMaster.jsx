// src/components/TestMaster/TestMaster.jsx
import { useState, useEffect } from "react";
import TestMasterHeader from "./TestMasterHeader";
import CategoryList from "./CategoryList/CategoryList";
import TestsTable from "../TestMaster/CategoryList/TestsTable/TestsTable";
import AddCategoryModal from "./modals/AddCategoryModal";
import AddTestModal from "./modals/AddTestModal";
import { testsByCategory as initialTests } from "../../data/testCatalog";
import {
  getTestCategories,
  createTestCategory,
  createLabTest,
  updateLabTest,
  deleteLabTest,
} from "../../api/api"; // ⬅ CHANGED: added createLabTest, updateLabTest, deleteLabTest

const dotColors = ["teal", "pink", "purple", "amber"];

export default function TestMaster() {
  const [categories, setCategories] = useState([]);
  const [testsByCategory, setTestsByCategory] = useState(initialTests);
  const [activeCategory, setActiveCategory] = useState("");
  const [loadingCategories, setLoadingCategories] = useState(true);

  const [isCategoryModalOpen, setCategoryModalOpen] = useState(false);
  const [testModalState, setTestModalState] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      try {
        const res = await getTestCategories();
        if (cancelled) return;
        const mapped = res.data.map((c, i) => ({
          id: c.id,
          name: c.name,
          color: dotColors[i % dotColors.length],
        }));
        setCategories(mapped);
        setActiveCategory(mapped[0]?.name || "");
      } catch (err) {
        console.error("Failed to load categories:", err.message);
      } finally {
        if (!cancelled) setLoadingCategories(false);
      }
    }

    loadCategories();
    return () => { cancelled = true; };
  }, []);

  const categoriesWithCount = categories.map((cat) => ({
    ...cat,
    count: (testsByCategory[cat.name] || []).length,
  }));

  async function handleAddCategory(name) {
    if (categories.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      alert("A category with this name already exists.");
      return;
    }

    try {
      const res = await createTestCategory({ name });
      const created = res.data;
      const color = dotColors[categories.length % dotColors.length];

      setCategories((prev) => [...prev, { id: created.id, name: created.name, color }]);
      setTestsByCategory((prev) => ({ ...prev, [created.name]: [] }));
      setActiveCategory(created.name);
      setCategoryModalOpen(false);
    } catch (err) {
      alert(err.message);
    }
  }

  // ⬇ CHANGED: was local-state-only, now calls createLabTest / updateLabTest
  async function handleSaveTest(testData) {
    const category = categories.find((c) => c.name === testData.category);
    if (!category) {
      alert("Please select a valid category.");
      return;
    }

    const ranges = Object.entries(testData.demographicRanges || {})
      .filter(([, range_raw]) => range_raw.trim() !== "")
      .map(([demographic_group, range_raw]) => ({ demographic_group, range_raw }));

    const payload = {
      category_id: category.id,
      name: testData.name.trim(),
      unit: testData.unit || null,
      price: testData.price,
      critical_low: testData.criticalLow,
      critical_high: testData.criticalHigh,
      followup_weeks: testData.followupWeeks,
      criteria: testData.criteria || null,
      ranges,
    };

    try {
      let saved;
      if (testModalState?.editingTest) {
        const res = await updateLabTest(testModalState.editingTest.id, payload);
        saved = res.data;
      } else {
        const res = await createLabTest(payload);
        saved = res.data;
      }

      setTestsByCategory((prev) => {
        const updated = { ...prev };

        if (testModalState?.editingTest) {
          const oldCategory = testModalState.editingTest.category;
          updated[oldCategory] = (updated[oldCategory] || []).filter(
            (t) => t.id !== testModalState.editingTest.id
          );
        }

        const targetList = updated[testData.category] || [];
        updated[testData.category] = [
          ...targetList,
          {
            id: saved.id,
            name: saved.name,
            unit: saved.unit,
            price: saved.price,
            criticalLow: saved.critical_low,
            criticalHigh: saved.critical_high,
            followupWeeks: saved.followup_weeks,
            criteria: saved.criteria,
            demographicRanges: Object.fromEntries(
              (saved.ranges || []).map((r) => [r.demographic_group, r.range_raw])
            ),
          },
        ];
        return updated;
      });

      setActiveCategory(testData.category);
      setTestModalState(null);
    } catch (err) {
      alert(err.message);
    }
  }

  // ⬇ CHANGED: was local-state-only, now calls deleteLabTest
  async function handleRemoveTest(test) {
    if (!window.confirm(`Remove "${test.name}"? This can't be undone.`)) return;
    try {
      await deleteLabTest(test.id);
      setTestsByCategory((prev) => ({
        ...prev,
        [activeCategory]: prev[activeCategory].filter((t) => t.id !== test.id),
      }));
    } catch (err) {
      alert(err.message);
    }
  }

  if (loadingCategories) {
    return <div className="text-sm text-gray-500 p-6">Loading categories…</div>;
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