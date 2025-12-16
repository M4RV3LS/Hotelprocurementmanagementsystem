import { useState, useMemo, useEffect } from "react";
import { Plus, Edit2, Download, Upload } from "lucide-react";
import ItemFormModal from "./ItemFormModal";
import ConfirmationModal from "./ConfirmationModal";
import Toast from "../Toast";
import Toggle from "../Toggle";

export type Item = {
  itemCode: string;
  itemName: string;
  brandName: string;
  itemCategory: string;
  categoryId: string;
  uom: string;
  isActive: boolean;
  weightage?: number;
  description?: string;
  photos?: string[];
  commodityCode?: string;
  commodityName?: string;
  itemType?: "Product" | "Service";
  length?: number;
  width?: number;
  height?: number;
  weight?: number;
};

interface ItemConfigurationProps {
  items: Item[];
  onSaveItem: (item: Item) => Promise<Item>;
  onDeleteItem: (itemCode: string) => Promise<void>;
}

export default function ItemConfiguration({
  items,
  onSaveItem,
  onDeleteItem,
}: ItemConfigurationProps) {
  const [itemsList, setItemsList] = useState<Item[]>(items);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(
    null,
  );
  const [confirmAction, setConfirmAction] = useState<{
    type: "activate" | "deactivate";
    item: Item;
  } | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "inactive"
  >("all");

  // Sync with props when they change
  useEffect(() => {
    setItemsList(items);
  }, [items]);

  // Filter items based on status
  const filteredItems = useMemo(() => {
    if (filterStatus === "all") return itemsList;
    if (filterStatus === "active")
      return itemsList.filter((item) => item.isActive);
    return itemsList.filter((item) => !item.isActive);
  }, [itemsList, filterStatus]);

  const handleAddItem = () => {
    setEditingItem(null);
    setShowModal(true);
  };

  const handleEditItem = (item: Item) => {
    setEditingItem(item);
    setShowModal(true);
  };

  const handleToggleActive = (item: Item) => {
    setConfirmAction({
      type: item.isActive ? "deactivate" : "activate",
      item,
    });
  };

  const handleConfirmToggle = async () => {
    if (!confirmAction) return;

    const { type, item } = confirmAction;

    try {
      // Update the item's active status
      const updatedItem = { ...item, isActive: !item.isActive };
      await onSaveItem(updatedItem);

      // Update local state
      setItemsList((prev) =>
        prev.map((i) =>
          i.itemCode === item.itemCode ? updatedItem : i,
        ),
      );

      setToast({
        message: `Item ${type === "activate" ? "activated" : "deactivated"} successfully`,
        type: "success",
      });

      setTimeout(() => setToast(null), 5000);
    } catch (error) {
      console.error("Error toggling item status:", error);
      setToast({
        message: `Failed to ${type} item`,
        type: "error",
      });
      setTimeout(() => setToast(null), 5000);
    }

    setConfirmAction(null);
  };

  const handleSaveItem = async (item: Item) => {
    try {
      await onSaveItem(item);

      if (editingItem) {
        // Update existing
        setItemsList((prev) =>
          prev.map((i) =>
            i.itemCode === editingItem.itemCode ? item : i,
          ),
        );
      } else {
        // Add new
        setItemsList((prev) => [...prev, item]);
      }
      setShowModal(false);

      setToast({
        message: `Item ${editingItem ? "updated" : "created"} successfully`,
        type: "success",
      });
      setTimeout(() => setToast(null), 5000);
    } catch (error) {
      console.error("Error saving item:", error);
      setToast({
        message: `Failed to ${editingItem ? "update" : "create"} item`,
        type: "error",
      });
      setTimeout(() => setToast(null), 5000);
    }
  };

  // --- Design Only Handlers ---
  const handleDownloadTemplate = () => {
    alert(
      "Design Only: Download template logic will be implemented here.",
    );
  };

  const handleBulkUpload = () => {
    alert(
      "Design Only: Bulk upload logic will be implemented here.",
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-gray-900 text-lg font-medium">
          Item Configuration
        </h2>

        <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
          {/* Filter Dropdown */}
          <select
            value={filterStatus}
            onChange={(e) =>
              setFilterStatus(
                e.target.value as "all" | "active" | "inactive",
              )
            }
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#ec2224] text-sm"
          >
            <option value="all">All</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>

          {/* Download Template Button */}
          <button
            onClick={handleDownloadTemplate}
            className="px-4 py-2 border border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm font-medium whitespace-nowrap"
            title="Download Bulk Update Template"
          >
            <Download className="w-4 h-4" />
            <span className="hidden xl:inline">Template</span>
          </button>

          {/* Bulk Upload Button */}
          <button
            onClick={handleBulkUpload}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm font-medium whitespace-nowrap"
            title="Bulk Upload Weightage"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden xl:inline">
              Bulk Upload
            </span>
          </button>

          <div className="w-px h-8 bg-gray-300 mx-1 hidden sm:block"></div>

          {/* Add New Item Button */}
          <button
            onClick={handleAddItem}
            className="px-4 py-2 bg-[#ec2224] text-white rounded-lg hover:bg-[#d11f21] transition-colors flex items-center gap-2 text-sm font-medium whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-gray-700 text-sm font-semibold">
                  Item Code
                </th>
                <th className="px-6 py-3 text-left text-gray-700 text-sm font-semibold">
                  Item Name
                </th>
                <th className="px-6 py-3 text-left text-gray-700 text-sm font-semibold">
                  Brand Name
                </th>
                <th className="px-6 py-3 text-left text-gray-700 text-sm font-semibold">
                  Category
                </th>
                {/* Requirement 1: UoM Column Removed */}
                <th className="px-6 py-3 text-left text-gray-700 text-sm font-semibold">
                  Weightage
                </th>
                <th className="px-6 py-3 text-left text-gray-700 text-sm font-semibold">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-gray-700 text-sm font-semibold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={7} // Reduced colspan due to removed column
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    No items found
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr
                    key={item.itemCode}
                    className={`transition-colors ${
                      item.isActive
                        ? "hover:bg-gray-50"
                        : "bg-gray-50 opacity-75"
                    }`}
                  >
                    <td className="px-6 py-4 text-gray-900 font-mono text-sm">
                      {item.itemCode}
                    </td>
                    <td className="px-6 py-4 text-gray-900">
                      {item.itemName}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {item.brandName}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {item.itemCategory}
                    </td>
                    {/* Requirement 1: UoM Cell Removed */}
                    <td className="px-6 py-4 text-gray-900">
                      {item.weightage ?? "-"}
                    </td>

                    <td className="px-6 py-4">
                      {item.isActive ? (
                        <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-700">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end items-center gap-3">
                        <button
                          onClick={() => handleEditItem(item)}
                          className="p-2 text-gray-600 hover:text-[#ec2224] transition-colors"
                          title="Edit item"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <div className="flex items-center gap-2">
                          <Toggle
                            enabled={item.isActive}
                            onChange={() =>
                              handleToggleActive(item)
                            }
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Item Form Modal */}
      {showModal && (
        <ItemFormModal
          item={editingItem}
          onClose={() => setShowModal(false)}
          onSave={handleSaveItem}
        />
      )}

      {/* Confirmation Modal */}
      {confirmAction && (
        <ConfirmationModal
          title={
            confirmAction.type === "activate"
              ? "Activate Item?"
              : "Deactivate Item?"
          }
          message={
            confirmAction.type === "activate"
              ? `Are you sure you want to activate "${confirmAction.item.itemName}"?\n\nThis item will become available in vendor item selection dropdowns.`
              : `Are you sure you want to deactivate "${confirmAction.item.itemName}"?\n\nThis item will no longer appear in vendor item selection dropdowns but can be reactivated anytime.`
          }
          confirmLabel={
            confirmAction.type === "activate"
              ? "Activate Item"
              : "Deactivate Item"
          }
          confirmStyle={
            confirmAction.type === "activate"
              ? "primary"
              : "secondary"
          }
          onConfirm={handleConfirmToggle}
          onCancel={() => setConfirmAction(null)}
        />
      )}

      {/* Toast Notification */}
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