// src/components/TestMaster/TestMaster.jsx
import { useState, useEffect } from "react";
import TestMasterHeader from "./TestMasterHeader";
import CategoryList from "./CategoryList/CategoryList";
import TestsTable from "../TestMaster/CategoryList/TestsTable/TestsTable";
import AddCategoryModal from "./modals/AddCategoryModal";
import AddTestModal from "./modals/AddTestModal";
import Toast from "../common/Toast/Toast";
import {
  getTestCategories,
  getLabTests,
  createTestCategory,
  updateTestCategory,
  createLabTest,
  updateLabTest,
  deleteLabTest,
} from "../../api/api";

const dotColors = ["teal", "pink", "purple", "amber"];

export default function TestMaster() {
  const [categories, setCategories] = useState([]);
  const [testsByCategory, setTestsByCategory] = useState({});
  const [activeCategory, setActiveCategory] = useState("");
  const [loadingCategories, setLoadingCategories] = useState(true);

  const [isCategoryModalOpen, setCategoryModalOpen] = useState(false);
  const [testModalState, setTestModalState] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [toast, setToast] = useState(null); // { message, type }

  useEffect(() => {
    let cancelled = false;

    async function loadCategoriesAndTests() {
      try {
        const [catRes, testRes] = await Promise.all([
          getTestCategories(),
          getLabTests(),
        ]);
        if (cancelled) return;

        const mapped = catRes.data.map((c, i) => ({
          id: c.id,
          name: c.name,
          color: dotColors[i % dotColors.length],
        }));
        setCategories(mapped);
        setActiveCategory(mapped[0]?.name || "");

        const catIdToName = Object.fromEntries(mapped.map((c) => [c.id, c.name]));
        const grouped = {};
        testRes.data.forEach((t) => {
          const catName = catIdToName[t.category_id];
          if (!catName) return;
          if (!grouped[catName]) grouped[catName] = [];
          grouped[catName].push({
            id: t.id,
            name: t.name,
            unit: t.unit,
            price: t.price,
            criticalLow: t.critical_low,
            criticalHigh: t.critical_high,
            followupWeeks: t.followup_weeks,
            criteria: t.criteria,
            isActive: t.is_active,  
            demographicRanges: Object.fromEntries(
              (t.ranges || []).map((r) => [r.demographic_group, r.range_raw])
            ),
          });
        });
        setTestsByCategory(grouped);
      } catch (err) {
        console.error("Failed to load categories/tests:", err.message);
      } finally {
        if (!cancelled) setLoadingCategories(false);
      }
    }

    loadCategoriesAndTests();
    return () => { cancelled = true; };
  }, []);

  const categoriesWithCount = categories.map((cat) => ({
    ...cat,
    count: (testsByCategory[cat.name] || []).length,
  }));

  async function handleAddCategory(name) {
    if (categories.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      setToast({ message: "A category with this name already exists.", type: "error" });
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
      setToast({ message: "Category added successfully", type: "success" });
    } catch (err) {
      setToast({ message: err.message || "Failed to add category", type: "error" });
    }
  }

  async function handleEditCategory(id, newName) {
    if (categories.some((c) => c.id !== id && c.name.toLowerCase() === newName.toLowerCase())) {
      setToast({ message: "A category with this name already exists.", type: "error" });
      return;
    }

    try {
      const res = await updateTestCategory(id, { name: newName });
      const updated = res.data;
      const oldCategory = categories.find((c) => c.id === id);

      setCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, name: updated.name } : c))
      );

      // The tests map is keyed by category name, so renaming means moving
      // that category's tests under the new key.
      if (oldCategory && oldCategory.name !== updated.name) {
        setTestsByCategory((prev) => {
          const updatedMap = { ...prev };
          updatedMap[updated.name] = updatedMap[oldCategory.name] || [];
          delete updatedMap[oldCategory.name];
          return updatedMap;
        });

        if (activeCategory === oldCategory.name) {
          setActiveCategory(updated.name);
        }
      }

      setCategoryModalOpen(false);
      setEditingCategory(null);
      setToast({ message: "Category updated successfully", type: "success" });
    } catch (err) {
      setToast({ message: err.message || "Failed to update category", type: "error" });
    }
  }

  async function handleSaveTest(testData) {
    const category = categories.find((c) => c.name === testData.category);
    if (!category) {
      setToast({ message: "Please select a valid category.", type: "error" });
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
      is_active: testData.isActive, 
      ranges,
    };

    const isEditing = Boolean(testModalState?.editingTest);

    try {
      let saved;
      if (isEditing) {
        const res = await updateLabTest(testModalState.editingTest.id, payload);
        saved = res.data;
      } else {
        const res = await createLabTest(payload);
        saved = res.data;
      }

      setTestsByCategory((prev) => {
        const updated = { ...prev };

        if (isEditing) {
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
            isActive: saved.is_active,   
            demographicRanges: Object.fromEntries(
              (saved.ranges || []).map((r) => [r.demographic_group, r.range_raw])
            ),
          },
        ];
        return updated;
      });

      setActiveCategory(testData.category);
      setTestModalState(null);
      setToast({
        message: isEditing ? "Test updated successfully" : "Test added successfully",
        type: "success",
      });
    } catch (err) {
      setToast({ message: err.message || "Failed to save test", type: "error" });
    }
  }

  async function handleRemoveTest(test) {
    if (!window.confirm(`Remove "${test.name}"? This can't be undone.`)) return;
    try {
      await deleteLabTest(test.id);
      setTestsByCategory((prev) => ({
        ...prev,
        [activeCategory]: prev[activeCategory].filter((t) => t.id !== test.id),
      }));
      setToast({ message: "Test removed successfully", type: "success" });
    } catch (err) {
      setToast({ message: err.message || "Failed to remove test", type: "error" });
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
          onEditCategory={(cat) => {
            setEditingCategory(cat);
            setCategoryModalOpen(true);
          }}
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
          editingCategory={editingCategory}
          onClose={() => {
            setCategoryModalOpen(false);
            setEditingCategory(null);
          }}
          onAdd={handleAddCategory}
          onEdit={handleEditCategory}
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

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}