import { useState } from "react";
import { X, Plus, Trash2, Upload } from "lucide-react";
import type { Vendor } from "./VendorManagement";
import MultiSelectDropdown from "./MultiSelectDropdown";
import { INDONESIA_REGIONS } from "../../data/mockData";

interface VendorFormModalProps {
  vendor: Vendor | null;
  onClose: () => void;
  onSave: (vendor: Vendor) => void;
  activePaymentMethods: string[];
  items: any[];
}

interface VendorItem {
  itemCode: string;
  itemName: string;
  // Removed selectedProperties
  minQuantity: number;
  multipleOf: number;
  priceType: "Fixed" | "Not Fixed";
  unitPrice: number;
  agreementNumber: string;
  taxPercentage: number;
}

interface Agreement {
  id: string;
  type: "Agreement" | "Offering";
  number: string;
  startDate: string;
  endDate: string;
  documentLink?: string;
}

export default function VendorFormModal({
  vendor,
  onClose,
  onSave,
  activePaymentMethods,
  items,
}: VendorFormModalProps) {
  const [formData, setFormData] = useState<Vendor>(
    vendor || {
      vendorCode: "",
      vendorName: "",
      vendorRegion: [],
      vendorAddress: "",
      vendorEmail: "",
      vendorPhone: "",
      vendorAgreementLink: "",
      ppnPercentage: 11,
      serviceChargePercentage: 0,
      pb1Percentage: 0,
      paymentMethods: [],
      agreements: [],
      items: [],
      isActive: true,
    },
  );

  const [vendorItems, setVendorItems] = useState<VendorItem[]>(
    vendor?.items || [],
  );
  const [agreements, setAgreements] = useState<Agreement[]>(
    vendor?.agreements || [],
  );
  const [selectedPaymentMethods, setSelectedPaymentMethods] =
    useState<string[]>(vendor?.paymentMethods || []);

  const [showAddItem, setShowAddItem] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<
    number | null
  >(null);

  // FIXED: Initial state without selectedProperties
  const [newItem, setNewItem] = useState<VendorItem>({
    itemCode: "",
    itemName: "",
    minQuantity: 1,
    multipleOf: 1,
    priceType: "Fixed",
    unitPrice: 0,
    agreementNumber: "",
    taxPercentage: 11,
  });

  const [showBulkUpload, setShowBulkUpload] = useState(false);

  const activeItems = items.filter((item) => item.isActive);

  const handleInputChange = (
    field: string,
    value: string | number,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleItemSelect = (itemCode: string) => {
    const selectedItem = items.find(
      (i) => i.itemCode === itemCode,
    );
    if (selectedItem) {
      // FIXED: Removed selectedProperties assignment
      setNewItem({
        itemCode: selectedItem.itemCode,
        itemName: selectedItem.itemName,
        minQuantity: 1,
        multipleOf: 1,
        priceType: "Fixed",
        unitPrice: 0,
        agreementNumber: "",
        taxPercentage: formData.ppnPercentage,
      });
    }
  };

  const handleAddItemToVendor = () => {
    if (
      !newItem.itemCode ||
      newItem.minQuantity <= 0 ||
      newItem.taxPercentage < 0
    ) {
      alert("Please fill in all required fields");
      return;
    }

    if (newItem.priceType === "Fixed") {
      if (newItem.unitPrice <= 0) {
        alert("Unit price is required for fixed price items");
        return;
      }
      // Check if agreement is required only if agreements exist
      if (agreements.length > 0 && !newItem.agreementNumber) {
        alert(
          "Agreement/Offering number is required for fixed price items",
        );
        return;
      }
    }

    if (editingItemIndex !== null) {
      setVendorItems((prev) =>
        prev.map((item, idx) =>
          idx === editingItemIndex ? newItem : item,
        ),
      );
      setEditingItemIndex(null);
    } else {
      setVendorItems((prev) => [...prev, newItem]);
    }

    // FIXED: Reset state without selectedProperties
    setNewItem({
      itemCode: "",
      itemName: "",
      minQuantity: 1,
      multipleOf: 1,
      priceType: "Fixed",
      unitPrice: 0,
      agreementNumber: "",
      taxPercentage: formData.ppnPercentage,
    });
    setShowAddItem(false);
  };

  const handleEditItem = (index: number) => {
    setNewItem(vendorItems[index]);
    setEditingItemIndex(index);
    setShowAddItem(true);
  };

  const handleDeleteItem = (index: number) => {
    setVendorItems((prev) =>
      prev.filter((_, i) => i !== index),
    );
  };

  const handleAddAgreement = () => {
    const newAgreement: Agreement = {
      id: `agr-${Date.now()}`,
      type: "Agreement",
      number: "",
      startDate: "",
      endDate: "",
      documentLink: "",
    };
    setAgreements([...agreements, newAgreement]);
  };

  const handleAgreementChange = (
    index: number,
    field: string,
    value: string,
  ) => {
    setAgreements((prev) =>
      prev.map((agr, idx) =>
        idx === index ? { ...agr, [field]: value } : agr,
      ),
    );
  };

  const handleRemoveAgreement = (index: number) => {
    setAgreements((prev) =>
      prev.filter((_, idx) => idx !== index),
    );
  };

  const handleSave = () => {
    if (!formData.vendorCode || !formData.vendorName) {
      alert("Please fill in vendor code and name");
      return;
    }

    if (selectedRegions.length === 0) {
      alert("Please select at least one region");
      return;
    }

    if (selectedPaymentMethods.length === 0) {
      alert("Please select at least one payment method");
      return;
    }

    const updatedVendor = {
      ...formData,
      vendorRegion: selectedRegions,
      items: vendorItems,
      agreements: agreements,
      paymentMethods: selectedPaymentMethods,
    };

    onSave(updatedVendor);
  };

  const handleDownloadTemplate = () => {
    alert("Excel template download would be implemented here");
  };

  const handleBulkUpload = () => {
    alert(
      "Bulk upload functionality would be implemented here",
    );
  };

  const [selectedRegions, setSelectedRegions] = useState<
    string[]
  >(
    Array.isArray(formData.vendorRegion)
      ? formData.vendorRegion
      : formData.vendorRegion
        ? [formData.vendorRegion]
        : [],
  );

  const handleRegionChange = (regions: string[]) => {
    setSelectedRegions(regions);
    setFormData((prev) => ({ ...prev, vendorRegion: regions }));
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
            <h2 className="text-gray-900">
              {vendor ? "Edit Vendor" : "Add New Vendor"}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-6 space-y-6">
            {/* Vendor Information */}
            <div>
              <h3 className="text-gray-900 mb-4">
                Vendor Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 mb-2">
                    Vendor Code{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.vendorCode}
                    onChange={(e) =>
                      handleInputChange(
                        "vendorCode",
                        e.target.value,
                      )
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ec2224]"
                    placeholder="VND001"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">
                    Vendor Name{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.vendorName}
                    onChange={(e) =>
                      handleInputChange(
                        "vendorName",
                        e.target.value,
                      )
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ec2224]"
                    placeholder="PT Example Company"
                  />
                </div>
                <div>
                  <MultiSelectDropdown
                    options={INDONESIA_REGIONS}
                    selectedValues={selectedRegions}
                    onChange={handleRegionChange}
                    label="Vendor Region"
                    placeholder="Select Regions"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">
                    Vendor Email
                  </label>
                  <input
                    type="email"
                    value={formData.vendorEmail}
                    onChange={(e) =>
                      handleInputChange(
                        "vendorEmail",
                        e.target.value,
                      )
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ec2224]"
                    placeholder="contact@vendor.com"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-gray-700 mb-2">
                    Vendor Address
                  </label>
                  <textarea
                    value={formData.vendorAddress}
                    onChange={(e) =>
                      handleInputChange(
                        "vendorAddress",
                        e.target.value,
                      )
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ec2224]"
                    rows={2}
                    placeholder="Full address"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">
                    Vendor Phone
                  </label>
                  <input
                    type="text"
                    value={formData.vendorPhone}
                    onChange={(e) =>
                      handleInputChange(
                        "vendorPhone",
                        e.target.value,
                      )
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ec2224]"
                    placeholder="+62 21 1234 5678"
                  />
                </div>
              </div>
            </div>

            {/* Tax Configuration */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-gray-900 mb-4">
                Tax Configuration
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-gray-700 mb-2">
                    PPN (%){" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.ppnPercentage}
                    onChange={(e) =>
                      handleInputChange(
                        "ppnPercentage",
                        parseFloat(e.target.value) || 0,
                      )
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ec2224]"
                    placeholder="11"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">
                    Service Charge (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.serviceChargePercentage}
                    onChange={(e) =>
                      handleInputChange(
                        "serviceChargePercentage",
                        parseFloat(e.target.value) || 0,
                      )
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ec2224]"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">
                    PB1 (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.pb1Percentage}
                    onChange={(e) =>
                      handleInputChange(
                        "pb1Percentage",
                        parseFloat(e.target.value) || 0,
                      )
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ec2224]"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* Agreements */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-900">
                  Agreement / Offering Information
                </h3>
                <button
                  onClick={handleAddAgreement}
                  className="text-[#ec2224] hover:text-[#d11f21] text-sm flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Add
                  Agreement/Offering
                </button>
              </div>
              {agreements.map((agreement, index) => (
                <div
                  key={agreement.id}
                  className="border border-gray-200 rounded-lg p-4 mb-3"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-gray-700">
                      Agreement/Offering {index + 1}
                    </h4>
                    <button
                      onClick={() =>
                        handleRemoveAgreement(index)
                      }
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 mb-2">
                        Number{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={agreement.number}
                        onChange={(e) =>
                          handleAgreementChange(
                            index,
                            "number",
                            e.target.value,
                          )
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ec2224]"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-2">
                        Type
                      </label>
                      <select
                        value={agreement.type}
                        onChange={(e) =>
                          handleAgreementChange(
                            index,
                            "type",
                            e.target.value,
                          )
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ec2224]"
                      >
                        <option value="Agreement">
                          Agreement
                        </option>
                        <option value="Offering">
                          Offering
                        </option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Payment Methods */}
            <div className="border-t border-gray-200 pt-6">
              <MultiSelectDropdown
                options={activePaymentMethods}
                selectedValues={selectedPaymentMethods}
                onChange={setSelectedPaymentMethods}
                label="Payment Methods"
                placeholder="Select payment methods"
                error={
                  selectedPaymentMethods.length === 0
                    ? ""
                    : undefined
                }
              />
            </div>

            {/* Vendor Item/SKU Configuration */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-900">
                  Vendor Item/SKU Configuration
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowBulkUpload(true)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" /> Bulk Update
                  </button>
                  <button
                    onClick={() => {
                      setShowAddItem(true);
                      setEditingItemIndex(null);
                    }}
                    className="px-4 py-2 bg-[#ec2224] text-white rounded-lg hover:bg-[#d11f21] transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Add Item
                  </button>
                </div>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-gray-700">
                        Item Name
                      </th>
                      <th className="px-4 py-3 text-left text-gray-700">
                        Min Qty
                      </th>
                      <th className="px-4 py-3 text-left text-gray-700">
                        Unit Price
                      </th>
                      <th className="px-4 py-3 text-right text-gray-700">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {vendorItems.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3 text-gray-900">
                          {item.itemName}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {item.minQuantity}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {item.priceType === "Fixed"
                            ? `Rp ${item.unitPrice.toLocaleString()}`
                            : "-"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() =>
                              handleEditItem(index)
                            }
                            className="text-[#ec2224] mr-3"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteItem(index)
                            }
                            className="text-red-600"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-[#ec2224] text-white rounded-lg"
            >
              Save Vendor
            </button>
          </div>
        </div>
      </div>

      {/* Add/Edit Item Modal */}
      {showAddItem && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-[60]"
            onClick={() => setShowAddItem(false)}
          />
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
              <div className="border-b border-gray-200 px-6 py-4">
                <h3 className="text-gray-900">
                  {editingItemIndex !== null
                    ? "Edit Item"
                    : "Add Item"}
                </h3>
              </div>
              <div className="px-6 py-6 space-y-4">
                {/* Item Selection */}
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
                    disabled={editingItemIndex !== null}
                  >
                    <option value="">Select Item</option>
                    {activeItems.map((item) => (
                      <option
                        key={item.itemCode}
                        value={item.itemCode}
                      >
                        {item.itemName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Min Qty */}
                <div>
                  <label className="block text-gray-700 mb-2">
                    Minimum Quantity{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={newItem.minQuantity}
                    onChange={(e) =>
                      setNewItem({
                        ...newItem,
                        minQuantity:
                          parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    min="1"
                  />
                </div>

                {/* Price Type */}
                <div>
                  <label className="block text-gray-700 mb-2">
                    Price Type{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={newItem.priceType === "Fixed"}
                        onChange={() =>
                          setNewItem({
                            ...newItem,
                            priceType: "Fixed",
                          })
                        }
                      />{" "}
                      Fixed
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={
                          newItem.priceType === "Not Fixed"
                        }
                        onChange={() =>
                          setNewItem({
                            ...newItem,
                            priceType: "Not Fixed",
                            unitPrice: 0,
                            agreementNumber: "",
                          })
                        }
                      />{" "}
                      Not Fixed
                    </label>
                  </div>
                </div>

                {/* Fixed Price Fields */}
                {newItem.priceType === "Fixed" && (
                  <>
                    <div>
                      <label className="block text-gray-700 mb-2">
                        Unit Price (IDR){" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={newItem.unitPrice}
                        onChange={(e) =>
                          setNewItem({
                            ...newItem,
                            unitPrice:
                              parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-2">
                        Agreement/Offering{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={newItem.agreementNumber}
                        onChange={(e) =>
                          setNewItem({
                            ...newItem,
                            agreementNumber: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="">
                          Select Agreement
                        </option>
                        {agreements.map((agr) => (
                          <option
                            key={agr.id}
                            value={agr.number}
                          >
                            {agr.number}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {/* WHT */}
                <div>
                  <label className="block text-gray-700 mb-2">
                    WHT (%){" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={newItem.taxPercentage}
                    onChange={(e) =>
                      setNewItem({
                        ...newItem,
                        taxPercentage:
                          parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              <div className="border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
                <button
                  onClick={() => setShowAddItem(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddItemToVendor}
                  className="px-6 py-2 bg-[#ec2224] text-white rounded-lg"
                >
                  {editingItemIndex !== null
                    ? "Update Item"
                    : "Add Item"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}