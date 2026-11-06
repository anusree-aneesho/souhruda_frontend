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
  deleteTestCategory,
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
    // Ranges are kept exactly as the API returns them (age_label,
    // age_min_value, ..., gender, range_raw) plus the test's range mode.
    rangeMode: t.range_mode || "general",
    ranges: t.ranges || [],
  };
}

export default function TestMaster() {
  const [categories, setCategories] = useState([]);
  const [testsByCategory, setTestsByCategory] = useState({});
  const [activeCategory, setActiveCategory] = useState("");
  const [loadingCategories, setLoadingCategories] = useState(true);

  const [isCategoryModalOpen, setCategoryModalOpen] = useState(false);
  const [testModalState, setTestModalState] = useState(null);
  const [toast, setToast] = useState(null); // { message, type }
  const [confirmingRemove, setConfirmingRemove] = useState(null); // test | null
  const [confirmingCategoryDelete, setConfirmingCategoryDelete] = useState(null); // category | null

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

  // Every full test from every category, in category order, each carrying its
  // own category. The tests search box looks through this instead of only the
  // selected category.
  const searchableTests = categories.flatMap((cat) =>
    (testsByCategory[cat.name] || []).map((t) => ({ ...t, category: cat.name }))
  );

  // { [testId]: [ids of the groups that include it] }
  const groupIdsByTestId = {};
  Object.values(testsByCategory).forEach((list) => {
    list.forEach((group) => {
      (group.parameterIds || []).forEach((parameterId) => {
        if (!groupIdsByTestId[parameterId]) groupIdsByTestId[parameterId] = [];
        groupIdsByTestId[parameterId].push(group.id);
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

  // A category can only be deleted when it has no tests. If it has any, show a
  // message instead; if it's empty, ask for confirmation first.
  function handleDeleteCategoryClick(cat) {
    const count = (testsByCategory[cat.name] || []).length;

    if (count > 0) {
      setToast({
        message: `"${cat.name}" contains ${count} test${count > 1 ? "s" : ""} and can't be deleted.`,
        type: "error",
      });
      return;
    }

    setConfirmingCategoryDelete(cat);
  }

  async function confirmDeleteCategory() {
    const cat = confirmingCategoryDelete;
    setConfirmingCategoryDelete(null);

    try {
      await deleteTestCategory(cat.id);

      setCategories((prev) => prev.filter((c) => c.id !== cat.id));
      setTestsByCategory((prev) => {
        const next = { ...prev };
        delete next[cat.name];
        return next;
      });

      // If the deleted category was the open one, fall back to the first remaining.
      if (activeCategory === cat.name) {
        const remaining = categories.filter((c) => c.id !== cat.id);
        setActiveCategory(remaining[0]?.name || "");
      }

      setToast({ message: "Category deleted successfully", type: "success" });
    } catch (err) {
      // Also shows the backend's message if it refuses (e.g. category has tests).
      setToast({ message: err.message || "Failed to delete category", type: "error" });
    }
  }

  async function handleSaveTest(testData) {
    const category = categories.find((c) => c.name === testData.category);
    if (!category) {
      setToast({ message: "Please select a valid category.", type: "error" });
      return;
    }

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
      // The modal supplies the range mode and the finished range rows. They are
      // only sent when the modal supplies them, so a save that doesn't know
      // about ranges can never wipe them.
      ...(testData.ranges !== undefined && {
        range_mode: testData.rangeMode,
        ranges: testData.ranges,
      }),
      // Only sent when the modal supplies it, so editing never clears a group by accident.
      ...(testData.parameterIds !== undefined && { parameter_ids: testData.parameterIds }),
      ...(testData.groupIds !== undefined && { group_ids: testData.groupIds }),
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

      // Adding/removing this test from groups changes those groups' parameter lists,
      // so reload the list instead of patching it by hand.
      if (testData.groupIds !== undefined) {
        try {
          const testRes = await getLabTests();
          const catIdToName = Object.fromEntries(categories.map((c) => [c.id, c.name]));
          const grouped = {};
          testRes.data.forEach((t) => {
            const catName = catIdToName[t.category_id];
            if (!catName) return;
            if (!grouped[catName]) grouped[catName] = [];
            grouped[catName].push(mapTest(t));
          });
          setTestsByCategory(grouped);
        } catch (refreshErr) {
          console.error("Failed to refresh tests:", refreshErr.message);
        }
      }

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
      // Use the test's own category, not the selected one: a test found through
      // the cross-category search can belong to a different category.
      setTestsByCategory((prev) => ({
        ...prev,
        [test.category]: (prev[test.category] || []).filter((t) => t.id !== test.id),
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
          onDeleteCategory={handleDeleteCategoryClick}
        />
        <TestsTable
          categoryName={activeCategory}
          tests={(testsByCategory[activeCategory] || []).map((t) => ({ ...t, category: activeCategory }))}
          searchableTests={searchableTests}
          testsById={testsById}
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
          allTests={allTests}
          groupIdsByTestId={groupIdsByTestId}
          onClose={() => setTestModalState(null)}
          onSave={handleSaveTest}
        />
      )}

      {confirmingRemove && (
        <ConfirmModal
          title="Remove Test"
          message={`Do you want to remove "${confirmingRemove.name}" from ${confirmingRemove.category}?`}
          confirmLabel="Remove"
          cancelLabel="Cancel"
          danger
          onConfirm={confirmRemoveTest}
          onClose={() => setConfirmingRemove(null)}
        />
      )}

      {confirmingCategoryDelete && (
        <ConfirmModal
          title="Delete Category"
          message={`Do you want to delete the category "${confirmingCategoryDelete.name}"?`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          danger
          onConfirm={confirmDeleteCategory}
          onClose={() => setConfirmingCategoryDelete(null)}
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