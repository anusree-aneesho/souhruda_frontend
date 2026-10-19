// src/components/TestMaster/TestMaster.jsx
import { useState, useEffect } from "react";
import TestMasterHeader from "./TestMasterHeader";
import CategoryList from "./CategoryList/CategoryList";
import TestsTable from "../TestMaster/CategoryList/TestsTable/TestsTable";
import AddCategoryModal from "./modals/AddCategoryModal";
import AddTestModal from "./modals/AddTestModal";
import Toast from "../common/Toast/Toast";
import ConfirmModal from "../Patients/modals/ConfirmModal";
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

// Shapes one lab test from the API into what the Test Master components use.
// `parameters` is only filled for a group test (e.g. CBC): the tests that make
// it up. Each parameter is also a normal test in its own right.
function mapTest(t) {
  return {
    id: t.id,
    name: t.name,
    unit: t.unit,
    price: t.price,
    criticalLow: t.critical_low,
    criticalHigh: t.critical_high,
    followupWeeks: t.followup_weeks,
    criteria: t.criteria,
    note: t.note ?? "",
    isActive: t.is_active,
    parameters: (t.parameters || []).map((p) => ({ id: p.id, name: p.name })),
    parameterIds: (t.parameters || []).map((p) => p.id),
    demographicRanges: Object.fromEntries(
      (t.ranges || []).map((r) => [r.demographic_group, r.range_raw])
    ),
  };
}

export default function TestMaster() {
  const [categories, setCategories] = useState([]);
  const [testsByCategory, setTestsByCategory] = useState({});
  const [activeCategory, setActiveCategory] = useState("");
  const [loadingCategories, setLoadingCategories] = useState(true);

  const [isCategoryModalOpen, setCategoryModalOpen] = useState(false);
  const [testModalState, setTestModalState] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [toast, setToast] = useState(null); // { message, type }
  const [confirmingRemove, setConfirmingRemove] = useState(null); // test | null

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
          grouped[catName].push(mapTest(t));
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

  // Everything the Add/Edit modal needs to pick parameters: every test across
  // all categories, and which groups (if any) each test already belongs to.
  const allTests = Object.entries(testsByCategory).flatMap(([categoryName, list]) =>
    list.map((t) => ({
      id: t.id,
      name: t.name,
      category: categoryName,
      isGroup: (t.parameterIds || []).length > 0,
    }))
  );

  // Every test by id (with its category), so a group can show its parameters
  // even when they live in other categories.
  const testsById = {};
  Object.entries(testsByCategory).forEach(([categoryName, list]) => {
    list.forEach((t) => {
      testsById[t.id] = { ...t, category: categoryName };
    });
  });

  const groupNamesByTestId = {};
  Object.values(testsByCategory).forEach((list) => {
    list.forEach((group) => {
      (group.parameterIds || []).forEach((parameterId) => {
        if (!groupNamesByTestId[parameterId]) groupNamesByTestId[parameterId] = [];
        groupNamesByTestId[parameterId].push(group.name);
      });
    });
  });

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
      note: testData.note || null,
      is_active: testData.isActive, 
      ranges,
      // Only sent when the modal supplies it, so editing never clears a group by accident.
      ...(testData.parameterIds !== undefined && { parameter_ids: testData.parameterIds }),
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
          mapTest(saved),
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

  function handleRemoveTest(test) {
    setConfirmingRemove(test);
  }

  async function confirmRemoveTest() {
    const test = confirmingRemove;
    setConfirmingRemove(null);
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
          testsById={testsById}
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
          allTests={allTests}
          groupNamesByTestId={groupNamesByTestId}
          onClose={() => setTestModalState(null)}
          onSave={handleSaveTest}
        />
      )}

      {confirmingRemove && (
        <ConfirmModal
          title="Remove Test"
          message={`Do you want to remove "${confirmingRemove.name}" from ${activeCategory}?`}
          confirmLabel="Remove"
          cancelLabel="Cancel"
          danger
          onConfirm={confirmRemoveTest}
          onClose={() => setConfirmingRemove(null)}
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