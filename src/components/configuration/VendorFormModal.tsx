import { useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { items } from "../../data/mockData";
import type { Vendor } from "./VendorManagement";

interface VendorFormModalProps {
  vendor: Vendor | null;
  onClose: () => void;
  onSave: (vendor: Vendor) => void;
}

interface VendorItem {
  itemCode: string;
  itemName: string;

  minQuantity: number;
  unitPrice: number;
  taxRate: string;
}

const taxRates = [
  "ID (VAT: 11%)",
  "0% Tax Exempt",
  "SG (GST: 9%)",
  "IN (GST: 18%)",
  "PH (VAT: 12%)",
];

export default function VendorFormModal({
  vendor,
  onClose,
  onSave,
}: VendorFormModalProps) {
  const [formData, setFormData] = useState<Vendor>(
    vendor || {
      vendorCode: "",
      vendorName: "",
      vendorIsland: "",
      vendorAddress: "",
      vendorEmail: "",
      vendorPhone: "",
      vendorAgreementLink: "",
      items: [],
      isActive: true,
    },
  );

  const [vendorItems, setVendorItems] = useState<VendorItem[]>(
    vendor?.items || [],
  );
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItem, setNewItem] = useState<VendorItem>({
    itemCode: "",
    itemName: "",

    minQuantity: 1,
    unitPrice: 0,
    taxRate: "",
  });

  // Filter to show only active items
  const activeItems = items.filter((item) => item.isActive);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleItemSelect = (itemCode: string) => {
    const selectedItem = items.find(
      (i) => i.itemCode === itemCode,
    );
    if (selectedItem) {
      setNewItem({
        itemCode: selectedItem.itemCode,
        itemName: selectedItem.itemName,

        minQuantity: 1,
        unitPrice: 0,
        taxRate: "",
      });
    }
  };

  const handleAddItemToVendor = () => {
    // Unit price is now optional, so we only require itemCode, minQuantity, and taxRate
    if (
      newItem.itemCode &&
      newItem.minQuantity > 0 &&
      newItem.taxRate
    ) {
      setVendorItems((prev) => [...prev, newItem]);
      setNewItem({
        itemCode: "",
        itemName: "",

        minQuantity: 1,
        unitPrice: 0,
        taxRate: "",
      });
      setShowAddItem(false);
    }
  };

  const handleRemoveItem = (index: number) => {
    setVendorItems((prev) =>
      prev.filter((_, i) => i !== index),
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Merge vendorItems into formData before saving
    onSave({
      ...formData,
      items: vendorItems,
    });
  };

  const selectedItemData = items.find(
    (i) => i.itemCode === newItem.itemCode,
  );

  const getItemDisplayName = (item: VendorItem) => {
    const properties = Object.entries(item.itemName)
      .map(([key, value]) => `${value}`)
      .join(", ");
    return properties
      ? `${item.itemName} - ${properties}`
      : item.itemName;
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
            <h3 className="text-gray-900">
              {vendor
                ? `Edit Vendor - ${vendor.vendorName}`
                : "Add New Vendor"}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit}>
            <div className="px-6 py-6 space-y-8">
              {/* Section 1: Basic Vendor Information */}
              <div>
                <h4 className="text-gray-900 mb-4">
                  Basic Vendor Information
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 mb-2">
                      Vendor Code{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.vendorCode}
                      onChange={(e) =>
                        handleInputChange(
                          "vendorCode",
                          e.target.value,
                        )
                      }
                      disabled={!!vendor}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ec2224] disabled:bg-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">
                      Vendor Name{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.vendorName}
                      onChange={(e) =>
                        handleInputChange(
                          "vendorName",
                          e.target.value,
                        )
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ec2224]"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">
                      Vendor Island/Region{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.vendorIsland}
                      onChange={(e) =>
                        handleInputChange(
                          "vendorIsland",
                          e.target.value,
                        )
                      }
                      placeholder="e.g., Java, Bali, Sumatra"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ec2224]"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">
                      Vendor Phone{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.vendorPhone}
                      onChange={(e) =>
                        handleInputChange(
                          "vendorPhone",
                          e.target.value,
                        )
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ec2224]"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-gray-700 mb-2">
                      Vendor Address{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      value={formData.vendorAddress}
                      onChange={(e) =>
                        handleInputChange(
                          "vendorAddress",
                          e.target.value,
                        )
                      }
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ec2224]"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">
                      Vendor Email{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.vendorEmail}
                      onChange={(e) =>
                        handleInputChange(
                          "vendorEmail",
                          e.target.value,
                        )
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ec2224]"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">
                      Vendor Agreement Link (Optional)
                    </label>
                    <input
                      type="url"
                      value={formData.vendorAgreementLink}
                      onChange={(e) =>
                        handleInputChange(
                          "vendorAgreementLink",
                          e.target.value,
                        )
                      }
                      placeholder="https://"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ec2224]"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Vendor Item/SKU Configuration */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-gray-900">
                    Vendor Item/SKU Configuration
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowAddItem(!showAddItem)}
                    className="px-4 py-2 bg-[#ec2224] text-white rounded-lg hover:bg-[#d11f21] transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Item to Vendor
                  </button>
                </div>

                {/* Add Item Form */}
                {showAddItem && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-4 space-y-4">
                    {/* Select Item */}
                    <div>
                      <label className="block text-gray-700 mb-2">
                        Choose Item{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={newItem.itemCode}
                        onChange={(e) =>
                          handleItemSelect(e.target.value)
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ec2224]"
                      >
                        <option value="">Select an item</option>
                        {activeItems.map((item) => (
                          <option
                            key={item.itemCode}
                            value={item.itemCode}
                          >
                            {item.itemName} ({item.itemCode})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Pricing Details */}
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-gray-700 mb-2">
                          Minimum Quantity{" "}
                          <span className="text-red-500">
                            *
                          </span>
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={newItem.minQuantity}
                          onChange={(e) =>
                            setNewItem((prev) => ({
                              ...prev,
                              minQuantity:
                                parseInt(e.target.value) || 1,
                            }))
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ec2224]"
                        />
                      </div>

                      <div>
                        <label className="block text-gray-700 mb-2">
                          Item Unit Price (IDR){" "}
                          <span className="text-gray-500">
                            (Optional)
                          </span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={newItem.unitPrice}
                          onChange={(e) =>
                            setNewItem((prev) => ({
                              ...prev,
                              unitPrice:
                                parseFloat(e.target.value) || 0,
                            }))
                          }
                          placeholder="Leave empty if price varies"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ec2224]"
                        />
                        <p className="text-sm text-gray-500 mt-1">
                          Leave empty if price is negotiated per
                          order
                        </p>
                      </div>

                      <div>
                        <label className="block text-gray-700 mb-2">
                          VHT/WHT Tax{" "}
                          <span className="text-red-500">
                            *
                          </span>
                        </label>
                        <select
                          value={newItem.taxRate}
                          onChange={(e) =>
                            setNewItem((prev) => ({
                              ...prev,
                              taxRate: e.target.value,
                            }))
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ec2224]"
                        >
                          <option value="">Select tax</option>
                          {taxRates.map((rate) => (
                            <option key={rate} value={rate}>
                              {rate}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Add Button */}
                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setShowAddItem(false)}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleAddItemToVendor}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Add Item
                      </button>
                    </div>
                  </div>
                )}

                {/* Items List */}
                {vendorItems.length > 0 && (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-gray-700">
                            Item Name + Properties
                          </th>
                          <th className="px-4 py-3 text-left text-gray-700">
                            Min Qty
                          </th>
                          <th className="px-4 py-3 text-left text-gray-700">
                            Unit Price
                          </th>
                          <th className="px-4 py-3 text-left text-gray-700">
                            Tax Rate
                          </th>
                          <th className="px-4 py-3 text-right text-gray-700">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {vendorItems.map((item, index) => (
                          <tr key={index}>
                            <td className="px-4 py-3 text-gray-900">
                              {getItemDisplayName(item)}
                            </td>
                            <td className="px-4 py-3 text-gray-700">
                              {item.minQuantity}
                            </td>
                            <td className="px-4 py-3 text-gray-700">
                              Rp{" "}
                              {item.unitPrice.toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-gray-700">
                              {item.taxRate}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                type="button"
                                onClick={() =>
                                  handleRemoveItem(index)
                                }
                                className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {vendorItems.length === 0 && !showAddItem && (
                  <div className="text-center py-8 text-gray-500">
                    No items configured yet. Click "Add Item to
                    Vendor" to get started.
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-[#ec2224] text-white rounded-lg hover:bg-[#d11f21] transition-colors"
              >
                Save Vendor
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}