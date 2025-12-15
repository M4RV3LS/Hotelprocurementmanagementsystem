import { useState, useEffect } from "react";
import {
  Plus,
  Settings,
  X,
  Search,
  Check,
  ChevronLeft,
  ArrowRightLeft,
} from "lucide-react";
import { itemCategoriesAPI, itemsAPI } from "../../utils/api";
import Toast from "../Toast";
import Toggle from "../Toggle"; // Assuming reusable Toggle component exists
import type { ItemCategory } from "../../data/mockData";

export default function ItemCategoryConfiguration() {
  const [categories, setCategories] = useState<ItemCategory[]>(
    [],
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState<{
    category: ItemCategory;
    items: any[];
  } | null>(null);

  const [isAddingItemsMode, setIsAddingItemsMode] =
    useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const [allItems, setAllItems] = useState<any[]>([]);
  const [availableItems, setAvailableItems] = useState<any[]>(
    [],
  );

  const [selectedToAdd, setSelectedToAdd] = useState<string[]>(
    [],
  );
  const [selectedForNewCategory, setSelectedForNewCategory] =
    useState<string[]>([]);
  const [selectedToMove, setSelectedToMove] = useState<
    string[]
  >([]);
  const [targetMoveCategory, setTargetMoveCategory] =
    useState<string>("");
  const [itemSearch, setItemSearch] = useState("");

  const loadData = async () => {
    try {
      const [cats, items] = await Promise.all([
        itemCategoriesAPI.getAll(),
        itemsAPI.getAll(),
      ]);
      setCategories(cats);
      setAllItems(items);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveCategory = async () => {
    if (!categoryName) return;
    try {
      const newCategory =
        await itemCategoriesAPI.save(categoryName);
      if (selectedForNewCategory.length > 0) {
        await itemsAPI.assignCategory(
          selectedForNewCategory,
          newCategory.id,
          newCategory.name,
        );
      }
      setToast({
        message: "Category saved successfully",
        type: "success",
      });
      setShowAddModal(false);
      setCategoryName("");
      setSelectedForNewCategory([]);
      loadData();
    } catch (e) {
      setToast({
        message: "Failed to save category",
        type: "error",
      });
    }
  };

  // Req 1: Logic to toggle active/inactive
  const handleToggleStatus = async (category: ItemCategory) => {
    if (category.isActive) {
      // Trying to deactivate: Check item count
      if ((category.itemCount || 0) > 0) {
        alert(
          `Cannot deactivate "${category.name}" because it still contains ${category.itemCount} items. Please move them first.`,
        );
        return;
      }
    }

    try {
      const newStatus = !category.isActive;
      await itemCategoriesAPI.toggleStatus(
        category.id,
        newStatus,
      );

      // Optimistic update
      setCategories((prev) =>
        prev.map((c) =>
          c.id === category.id
            ? { ...c, isActive: newStatus }
            : c,
        ),
      );

      setToast({
        message: `Category ${newStatus ? "activated" : "deactivated"}`,
        type: "success",
      });
    } catch (e) {
      console.error(e);
      setToast({
        message: "Failed to update status",
        type: "error",
      });
    }
  };

  const openManageModal = (cat: ItemCategory) => {
    const itemsInCategory = allItems.filter(
      (i) => i.categoryId === cat.id,
    );
    const unassigned = allItems.filter(
      (i) => !i.categoryId || i.categoryId === "null",
    );

    setAvailableItems(unassigned);
    setShowManageModal({
      category: cat,
      items: itemsInCategory,
    });
    setIsAddingItemsMode(false);
    setSelectedToAdd([]);
    setSelectedToMove([]);
    setTargetMoveCategory("");
    setItemSearch("");
  };

  const handleMoveItems = async () => {
    if (
      !showManageModal ||
      selectedToMove.length === 0 ||
      !targetMoveCategory
    )
      return;
    try {
      const targetCat = categories.find(
        (c) => c.id === targetMoveCategory,
      );
      if (!targetCat) return;

      await itemsAPI.assignCategory(
        selectedToMove,
        targetCat.id,
        targetCat.name,
      );
      setToast({
        message: `${selectedToMove.length} items moved`,
        type: "success",
      });
      await loadData();

      const updatedAll = await itemsAPI.getAll();
      setAllItems(updatedAll);
      const updatedCatItems = updatedAll.filter(
        (i) => i.categoryId === showManageModal.category.id,
      );

      setShowManageModal({
        ...showManageModal,
        items: updatedCatItems,
      });
      setSelectedToMove([]);
      setTargetMoveCategory("");
    } catch (e) {
      setToast({
        message: "Failed to move items",
        type: "error",
      });
    }
  };

  const handleAddItemsToExisting = async () => {
    if (!showManageModal || selectedToAdd.length === 0) return;
    try {
      await itemsAPI.assignCategory(
        selectedToAdd,
        showManageModal.category.id,
        showManageModal.category.name,
      );
      setToast({ message: "Items added", type: "success" });
      await loadData();
      const updatedAll = await itemsAPI.getAll();
      setAllItems(updatedAll);
      const updatedCatItems = updatedAll.filter(
        (i) => i.categoryId === showManageModal.category.id,
      );
      const updatedUnassigned = updatedAll.filter(
        (i) => !i.categoryId,
      );
      setShowManageModal({
        ...showManageModal,
        items: updatedCatItems,
      });
      setAvailableItems(updatedUnassigned);
      setSelectedToAdd([]);
      setIsAddingItemsMode(false);
    } catch (e) {
      setToast({
        message: "Failed to add items",
        type: "error",
      });
    }
  };

  const uncategorizedItems = allItems.filter(
    (i) => !i.categoryId || i.categoryId === "null",
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-gray-900 font-medium">
          Item Category Configuration
        </h2>
        <button
          onClick={() => {
            setCategoryName("");
            setSelectedForNewCategory([]);
            setShowAddModal(true);
          }}
          className="px-4 py-2 bg-[#ec2224] text-white rounded-lg hover:bg-[#d11f21] flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 font-medium text-gray-700">
                Category Name
              </th>
              <th className="px-6 py-3 font-medium text-gray-700">
                Total Items
              </th>
              <th className="px-6 py-3 font-medium text-gray-700">
                Status
              </th>
              <th className="px-6 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {categories.map((cat) => (
              <tr
                key={cat.id}
                className={`hover:bg-gray-50 ${!cat.isActive ? "bg-gray-50/50" : ""}`}
              >
                <td className="px-6 py-4 text-gray-900 font-medium">
                  {cat.name}
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {cat.itemCount} items
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      cat.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {cat.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-6 py-4 text-right flex justify-end gap-3 items-center">
                  <button
                    onClick={() => openManageModal(cat)}
                    className="px-3 py-1 border border-gray-300 rounded text-gray-700 hover:bg-gray-100 flex items-center gap-1 text-xs"
                  >
                    <Settings className="w-3 h-3" /> Manage
                    Items
                  </button>
                  {/* Req 1: Toggle Switch instead of Delete */}
                  <div
                    className="flex items-center"
                    title={
                      cat.isActive && (cat.itemCount || 0) > 0
                        ? "Cannot deactivate while items exist"
                        : "Toggle status"
                    }
                  >
                    <Toggle
                      enabled={cat.isActive}
                      onChange={() => handleToggleStatus(cat)}
                      disabled={false} // Logic handled in function
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Category Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-[600px] max-h-[80vh] flex flex-col shadow-xl">
            <h3 className="font-bold mb-4 text-lg">
              Add New Category
            </h3>
            <div className="space-y-4 flex-1 flex flex-col min-h-0">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category Name
                </label>
                <input
                  className="w-full border p-2 rounded focus:ring-[#ec2224] focus:outline-none"
                  placeholder="e.g., Electronics, Linen..."
                  value={categoryName}
                  onChange={(e) =>
                    setCategoryName(e.target.value)
                  }
                />
              </div>
              <div className="flex-1 flex flex-col min-h-0">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign Uncategorized Items (Optional)
                </label>
                <div className="flex-1 overflow-y-auto border rounded-lg bg-gray-50 p-2">
                  {uncategorizedItems.length > 0 ? (
                    uncategorizedItems.map((item) => (
                      <label
                        key={item.itemCode}
                        className="flex items-center gap-3 p-3 bg-white border mb-2 rounded hover:shadow-sm cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedForNewCategory.includes(
                            item.itemCode,
                          )}
                          onChange={(e) => {
                            if (e.target.checked)
                              setSelectedForNewCategory([
                                ...selectedForNewCategory,
                                item.itemCode,
                              ]);
                            else
                              setSelectedForNewCategory(
                                selectedForNewCategory.filter(
                                  (c) => c !== item.itemCode,
                                ),
                              );
                          }}
                          className="rounded text-green-600 focus:ring-green-500"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {item.itemName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {item.itemCode}
                          </p>
                        </div>
                      </label>
                    ))
                  ) : (
                    <p className="text-center text-gray-400 py-4 text-sm">
                      No uncategorized items available.
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCategory}
                disabled={!categoryName}
                className="px-4 py-2 bg-[#ec2224] text-white rounded hover:bg-[#d11f21] disabled:opacity-50"
              >
                Save Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Items Modal */}
      {showManageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-[700px] max-h-[85vh] flex flex-col shadow-xl">
            <div className="flex justify-between items-center mb-4 border-b pb-4">
              <div className="flex items-center gap-2">
                {isAddingItemsMode && (
                  <button
                    onClick={() => setIsAddingItemsMode(false)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}
                <div>
                  <h3 className="font-bold text-lg">
                    {isAddingItemsMode
                      ? "Add Items to Category"
                      : "Manage Items"}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {showManageModal.category.name}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowManageModal(null)}>
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col">
              {!isAddingItemsMode ? (
                <>
                  <div className="flex justify-between items-end mb-4 gap-4">
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-600 block mb-2">
                        {selectedToMove.length} items selected
                      </span>
                      <div className="flex gap-2">
                        <select
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-[#ec2224] focus:outline-none"
                          value={targetMoveCategory}
                          onChange={(e) =>
                            setTargetMoveCategory(
                              e.target.value,
                            )
                          }
                          disabled={selectedToMove.length === 0}
                        >
                          <option value="">
                            Move selected to...
                          </option>
                          {categories
                            .filter(
                              (c) =>
                                c.id !==
                                showManageModal.category.id,
                            )
                            .map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                        </select>
                        <button
                          onClick={handleMoveItems}
                          disabled={
                            selectedToMove.length === 0 ||
                            !targetMoveCategory
                          }
                          className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
                        >
                          <ArrowRightLeft className="w-3 h-3" />{" "}
                          Move
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsAddingItemsMode(true)}
                      className="px-3 py-1.5 bg-[#ec2224] text-white rounded text-sm hover:bg-[#d11f21] flex items-center gap-1 h-fit mb-0.5"
                    >
                      <Plus className="w-4 h-4" /> Add Item
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto border rounded-lg bg-gray-50 p-2">
                    {showManageModal.items.length > 0 ? (
                      showManageModal.items.map((item) => (
                        <label
                          key={item.itemCode}
                          className="flex items-center gap-3 p-3 bg-white border mb-2 rounded hover:shadow-sm cursor-pointer transition-shadow"
                        >
                          <input
                            type="checkbox"
                            checked={selectedToMove.includes(
                              item.itemCode,
                            )}
                            onChange={(e) => {
                              if (e.target.checked)
                                setSelectedToMove([
                                  ...selectedToMove,
                                  item.itemCode,
                                ]);
                              else
                                setSelectedToMove(
                                  selectedToMove.filter(
                                    (c) => c !== item.itemCode,
                                  ),
                                );
                            }}
                            className="rounded text-blue-600 focus:ring-blue-500"
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {item.itemName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {item.itemCode}
                            </p>
                          </div>
                        </label>
                      ))
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-gray-400">
                        <p>No items in this category.</p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="mb-4 space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                      <input
                        placeholder="Search uncategorized items..."
                        className="w-full border rounded-lg pl-9 p-2 text-sm focus:ring-[#ec2224] focus:outline-none"
                        value={itemSearch}
                        onChange={(e) =>
                          setItemSearch(e.target.value)
                        }
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">
                        Available: {availableItems.length}
                      </span>
                      <button
                        onClick={handleAddItemsToExisting}
                        disabled={selectedToAdd.length === 0}
                        className="px-4 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" /> Add
                        Selected ({selectedToAdd.length})
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto border rounded-lg bg-gray-50 p-2">
                    {availableItems
                      .filter((i) =>
                        i.itemName
                          .toLowerCase()
                          .includes(itemSearch.toLowerCase()),
                      )
                      .map((item) => (
                        <label
                          key={item.itemCode}
                          className="flex items-center gap-3 p-3 bg-white border mb-2 rounded hover:shadow-sm cursor-pointer transition-shadow"
                        >
                          <input
                            type="checkbox"
                            checked={selectedToAdd.includes(
                              item.itemCode,
                            )}
                            onChange={(e) => {
                              if (e.target.checked)
                                setSelectedToAdd([
                                  ...selectedToAdd,
                                  item.itemCode,
                                ]);
                              else
                                setSelectedToAdd(
                                  selectedToAdd.filter(
                                    (c) => c !== item.itemCode,
                                  ),
                                );
                            }}
                            className="rounded text-green-600 focus:ring-green-500"
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {item.itemName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {item.itemCode}
                            </p>
                          </div>
                        </label>
                      ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
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