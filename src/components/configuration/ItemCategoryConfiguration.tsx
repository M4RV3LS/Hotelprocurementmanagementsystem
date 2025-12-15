import { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Settings,
  X,
  Search,
  Check,
  ChevronLeft,
} from "lucide-react";
import { itemCategoriesAPI, itemsAPI } from "../../utils/api";
import Toast from "../Toast";
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

  // Manage Modal State
  const [isAddingItemsMode, setIsAddingItemsMode] =
    useState(false); // Requirement 1: Toggle View

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
  const [selectedToRemove, setSelectedToRemove] = useState<
    string[]
  >([]);
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
      await itemCategoriesAPI.save(categoryName);
      setToast({ message: "Category saved", type: "success" });
      setShowAddModal(false);
      setCategoryName("");
      loadData();
    } catch (e) {
      setToast({
        message: "Failed to save category",
        type: "error",
      });
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (
      !confirm(
        "Are you sure? Items in this category will become uncategorized.",
      )
    )
      return;
    try {
      await itemCategoriesAPI.delete(id);
      loadData();
    } catch (e) {
      alert("Failed to delete");
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
    setIsAddingItemsMode(false); // Reset to view mode
    setSelectedToAdd([]);
    setSelectedToRemove([]);
    setItemSearch("");
  };

  const handleAddItems = async () => {
    if (!showManageModal || selectedToAdd.length === 0) return;
    try {
      await itemsAPI.assignCategory(
        selectedToAdd,
        showManageModal.category.id,
        showManageModal.category.name,
      );
      setToast({
        message: `${selectedToAdd.length} items added`,
        type: "success",
      });
      await loadData();

      // Refresh State
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
      setIsAddingItemsMode(false); // Return to list view
    } catch (e) {
      console.error(e);
      setToast({
        message: "Failed to add items",
        type: "error",
      });
    }
  };

  const handleRemoveItems = async () => {
    if (!showManageModal || selectedToRemove.length === 0)
      return;
    try {
      await itemsAPI.unassignCategory(selectedToRemove);
      setToast({
        message: `${selectedToRemove.length} items removed`,
        type: "success",
      });
      await loadData();

      // Refresh State
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
      setSelectedToRemove([]);
    } catch (e) {
      console.error(e);
      setToast({
        message: "Failed to remove items",
        type: "error",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-gray-900 font-medium">
          Item Categories
        </h2>
        <button
          onClick={() => setShowAddModal(true)}
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
              <th className="px-6 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {categories.map((cat) => (
              <tr key={cat.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-gray-900 font-medium">
                  {cat.name}
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {cat.itemCount} items
                </td>
                <td className="px-6 py-4 text-right flex justify-end gap-2">
                  <button
                    onClick={() => openManageModal(cat)}
                    className="px-3 py-1 border border-gray-300 rounded text-gray-700 hover:bg-gray-100 flex items-center gap-1 text-xs"
                  >
                    <Settings className="w-3 h-3" /> Manage
                    Items
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="text-red-600 hover:text-red-800 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Category Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 shadow-xl">
            <h3 className="font-bold mb-4">Add Category</h3>
            <input
              className="w-full border p-2 rounded mb-4 focus:ring-[#ec2224] focus:outline-none"
              placeholder="Category Name"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCategory}
                className="px-4 py-2 bg-[#ec2224] text-white rounded"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Items Modal */}
      {showManageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-[600px] max-h-[80vh] flex flex-col shadow-xl">
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

            {/* Requirement 1: Hide uncategorized until user presses "Add Item" */}
            <div className="flex-1 overflow-hidden flex flex-col">
              {!isAddingItemsMode ? (
                // VIEW MODE: Show Current Items + Add Button
                <>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm font-medium text-gray-600">
                      Current Items:{" "}
                      {showManageModal.items.length}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={handleRemoveItems}
                        disabled={selectedToRemove.length === 0}
                        className="px-3 py-1.5 bg-white border border-red-200 text-red-600 rounded text-sm hover:bg-red-50 disabled:opacity-50"
                      >
                        Remove ({selectedToRemove.length})
                      </button>
                      <button
                        onClick={() =>
                          setIsAddingItemsMode(true)
                        }
                        className="px-3 py-1.5 bg-[#ec2224] text-white rounded text-sm hover:bg-[#d11f21] flex items-center gap-1"
                      >
                        <Plus className="w-4 h-4" /> Add Item
                      </button>
                    </div>
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
                            checked={selectedToRemove.includes(
                              item.itemCode,
                            )}
                            onChange={(e) => {
                              if (e.target.checked)
                                setSelectedToRemove([
                                  ...selectedToRemove,
                                  item.itemCode,
                                ]);
                              else
                                setSelectedToRemove(
                                  selectedToRemove.filter(
                                    (c) => c !== item.itemCode,
                                  ),
                                );
                            }}
                            className="rounded text-red-600 focus:ring-red-500"
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
                // ADD MODE: Show Uncategorized Items
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
                        onClick={handleAddItems}
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
                    {availableItems.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center text-gray-400">
                        <p>No uncategorized items found.</p>
                      </div>
                    )}
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