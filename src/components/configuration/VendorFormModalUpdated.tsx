import { useState } from "react";
import {
  X,
  Plus,
  Trash2,
  CheckSquare,
  Square,
  AlertTriangle,
  Link as LinkIcon,
} from "lucide-react";
import type { Vendor } from "./VendorManagement";
import MultiSelectDropdown from "./MultiSelectDropdown";
import { INDONESIA_REGIONS } from "../../data/mockData";
import ConfirmationModal from "./ConfirmationModal";

interface ExtendedVendor extends Omit<Vendor, "agreements"> {
  agreements: Agreement[];
}

interface VendorFormModalProps {
  vendor: ExtendedVendor | null;
  onClose: () => void;
  onSave: (vendor: ExtendedVendor) => void;
  activePaymentMethods: string[];
  items: any[];
}

interface VendorItem {
  itemCode: string;
  itemName: string;
  minQuantity: number;
  multipleOf: number;
  priceType: "Fixed" | "Not Fixed";
  unitPrice: number;
  agreementNumber: string;
  taxPercentage: number;
  propertyTypes: string[]; // New Field
}

interface Agreement {
  id: string;
  type: "Agreement" | "Offering";
  number: string;
  startDate: string;
  endDate: string;
  documentLink?: string;
  link: string;
}

const PROPERTY_TYPES = ["Franchise", "Leasing", "Management"];

export default function VendorFormModalUpdated({
  vendor,
  onClose,
  onSave,
  activePaymentMethods,
  items,
}: VendorFormModalProps) {
  const [formData, setFormData] = useState<ExtendedVendor>(
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
    (vendor?.items || []).map((i) => ({
      ...i,
      propertyTypes: i.propertyTypes || [], // Ensure array exists
    })),
  );

  // ... (Agreements state and other existing state - no changes needed there)
  const [agreements, setAgreements] = useState<Agreement[]>(
    vendor?.agreements || [],
  );
  const [selectedPaymentMethods, setSelectedPaymentMethods] =
    useState<string[]>(vendor?.paymentMethods || []);
  const [showAddItem, setShowAddItem] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<
    number | null
  >(null);

  const [duplicateWarning, setDuplicateWarning] = useState<{
    isOpen: boolean;
    itemToAdd: VendorItem | null;
  }>({
    isOpen: false,
    itemToAdd: null,
  });

  // Item Form State
  const [newItem, setNewItem] = useState<VendorItem>({
    itemCode: "",
    itemName: "",
    minQuantity: 1,
    multipleOf: 1,
    priceType: "Fixed",
    unitPrice: 0,
    agreementNumber: "",
    taxPercentage: 0,
    propertyTypes: [], // Default empty
  });

  const activeItems = items.filter((item) => item.isActive);

  const [showBulkUpload, setShowBulkUpload] = useState(false);

  const handleToggleCell = (index: number, type: string) => {
    setVendorItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        const hasType = item.propertyTypes.includes(type);
        return {
          ...item,
          propertyTypes: hasType
            ? item.propertyTypes.filter((t) => t !== type)
            : [...item.propertyTypes, type],
        };
      }),
    );
  };

  const handleTickAllColumn = (type: string) => {
    const allTicked =
      vendorItems.length > 0 &&
      vendorItems.every((item) =>
        item.propertyTypes.includes(type),
      );

    setVendorItems((prev) =>
      prev.map((item) => {
        if (allTicked) {
          return {
            ...item,
            propertyTypes: item.propertyTypes.filter(
              (t) => t !== type,
            ),
          };
        } else {
          return item.propertyTypes.includes(type)
            ? item
            : {
                ...item,
                propertyTypes: [...item.propertyTypes, type],
              };
        }
      }),
    );
  };

  const handleNewItemPropertyTypeChange = (types: string[]) => {
    setNewItem((prev) => ({ ...prev, propertyTypes: types }));
  };

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
      setNewItem({
        itemCode: selectedItem.itemCode,
        itemName: selectedItem.itemName,
        minQuantity: 1,
        multipleOf: 1,
        priceType: "Fixed",
        unitPrice: 0,
        agreementNumber: "",
        taxPercentage: 0,
        propertyTypes: [], // Initialize as empty array
      });
    }
  };

  const handleAddItemToVendor = () => {
    // ... (Existing Validation) ...
    if (!newItem.itemCode || newItem.minQuantity <= 0) {
      alert("Please fill in all required fields");
      return;
    }

    // Save Logic
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

    // Reset Form
    setNewItem({
      itemCode: "",
      itemName: "",
      minQuantity: 1,
      multipleOf: 1,
      priceType: "Fixed",
      unitPrice: 0,
      agreementNumber: "",
      taxPercentage: 0,
      propertyTypes: [],
    });
    setShowAddItem(false);
  };

  const attemptAddItem = () => {
    if (!newItem.itemCode || newItem.minQuantity <= 0) {
      alert(
        "Please fill in all required fields (Item and Min Quantity).",
      );
      return;
    }

    // Check if item already exists in the list
    // We skip this check if we are EDITING the same row (index matches)
    const isDuplicate = vendorItems.some(
      (item, index) =>
        item.itemCode === newItem.itemCode &&
        index !== editingItemIndex,
    );

    if (isDuplicate) {
      // Trigger Warning Modal
      setDuplicateWarning({
        isOpen: true,
        itemToAdd: newItem,
      });
    } else {
      // No duplicate, add directly
      commitItemAdd(newItem);
    }
  };

  const commitItemAdd = (itemToCommit: VendorItem) => {
    if (editingItemIndex !== null) {
      setVendorItems((prev) =>
        prev.map((item, idx) =>
          idx === editingItemIndex ? itemToCommit : item,
        ),
      );
      setEditingItemIndex(null);
    } else {
      setVendorItems((prev) => [...prev, itemToCommit]);
    }

    // Reset Form
    setNewItem({
      itemCode: "",
      itemName: "",
      minQuantity: 1,
      multipleOf: 1,
      priceType: "Fixed",
      unitPrice: 0,
      agreementNumber: "",
      taxPercentage: 0,
      propertyTypes: [],
    });
    setShowAddItem(false);
    setDuplicateWarning({ isOpen: false, itemToAdd: null });
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
      link: "",
      documentLink: "",
    };
    setAgreements([...agreements, newAgreement]);
  };

  const handleAgreementChange = (
    index: number,
    field: keyof Agreement,
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="+62 21 1234 5678"
                  />
                </div>
              </div>
            </div>

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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              {/* ... Agreement Section (Keep existing code) ... */}
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
                  className="border border-gray-200 rounded-lg p-4 mb-3 bg-gray-50"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-gray-700 font-medium">
                      Document {index + 1}
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-2">
                        Type{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-4 mt-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name={`agreementType-${index}`}
                            checked={
                              agreement.type === "Agreement"
                            }
                            onChange={() =>
                              handleAgreementChange(
                                index,
                                "type",
                                "Agreement",
                              )
                            }
                            className="w-4 h-4 text-[#ec2224] focus:ring-[#ec2224] border-gray-300"
                          />
                          <span className="text-sm text-gray-700">
                            Agreement
                          </span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name={`agreementType-${index}`}
                            checked={
                              agreement.type === "Offering"
                            }
                            onChange={() =>
                              handleAgreementChange(
                                index,
                                "type",
                                "Offering",
                              )
                            }
                            className="w-4 h-4 text-[#ec2224] focus:ring-[#ec2224] border-gray-300"
                          />
                          <span className="text-sm text-gray-700">
                            Offering
                          </span>
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-2">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={agreement.startDate}
                        onChange={(e) =>
                          handleAgreementChange(
                            index,
                            "startDate",
                            e.target.value,
                          )
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-2">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={agreement.endDate}
                        onChange={(e) =>
                          handleAgreementChange(
                            index,
                            "endDate",
                            e.target.value,
                          )
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-gray-700 mb-2">
                        Document Link{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="url"
                          value={agreement.link}
                          onChange={(e) =>
                            handleAgreementChange(
                              index,
                              "link",
                              e.target.value,
                            )
                          }
                          placeholder="https://drive.google.com/..."
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

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

            {/* ITEM CONFIGURATION TABLE (REVAMPED) */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-900 font-medium">
                  Vendor Item/SKU Configuration
                </h3>
                <button
                  onClick={() => {
                    setShowAddItem(true);
                    setEditingItemIndex(null);
                    setNewItem({
                      itemCode: "",
                      itemName: "",
                      minQuantity: 1,
                      multipleOf: 1,
                      priceType: "Fixed",
                      unitPrice: 0,
                      agreementNumber: "",
                      taxPercentage: 0,
                      propertyTypes: [],
                    });
                  }}
                  className="px-4 py-2 bg-[#ec2224] text-white rounded-lg hover:bg-[#d11f21] flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Add Item
                </button>
              </div>

              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-gray-700 w-48">
                        Item Name
                      </th>
                      <th className="px-4 py-3 text-left text-gray-700 w-24">
                        Price
                      </th>

                      {/* REQ 3: Dynamic Property Type Columns with Tick All */}
                      {PROPERTY_TYPES.map((type) => (
                        <th
                          key={type}
                          className="px-4 py-3 text-center text-gray-700 w-32"
                        >
                          <div className="flex flex-col items-center gap-1">
                            <span>{type}</span>
                            <button
                              onClick={() =>
                                handleTickAllColumn(type)
                              }
                              className="text-xs text-blue-600 hover:underline"
                            >
                              {vendorItems.length > 0 &&
                              vendorItems.every((i) =>
                                i.propertyTypes.includes(type),
                              )
                                ? "Untick All"
                                : "Tick All"}
                            </button>
                          </div>
                        </th>
                      ))}

                      <th className="px-4 py-3 text-right text-gray-700">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {vendorItems.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3 text-gray-900">
                          <div>{item.itemName}</div>
                          <div className="text-xs text-gray-500">
                            {item.itemCode}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {item.priceType === "Fixed"
                            ? `Rp ${item.unitPrice.toLocaleString()}`
                            : "Floating"}
                        </td>

                        {/* REQ 3: Checkboxes for each type */}
                        {PROPERTY_TYPES.map((type) => (
                          <td
                            key={type}
                            className="px-4 py-3 text-center"
                          >
                            <button
                              onClick={() =>
                                handleToggleCell(index, type)
                              }
                              className={`p-1 rounded hover:bg-gray-100 transition-colors ${item.propertyTypes.includes(type) ? "text-green-600" : "text-gray-300"}`}
                            >
                              {item.propertyTypes.includes(
                                type,
                              ) ? (
                                <CheckSquare className="w-5 h-5" />
                              ) : (
                                <Square className="w-5 h-5" />
                              )}
                            </button>
                          </td>
                        ))}

                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() =>
                              handleEditItem(index)
                            }
                            className="text-[#ec2224] mr-3 hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteItem(index)
                            }
                            className="text-red-600 hover:underline"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                    {vendorItems.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-8 text-center text-gray-500"
                        >
                          No items configured.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ... Footer Actions ... */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg"
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

      {duplicateWarning.isOpen &&
        duplicateWarning.itemToAdd && (
          <ConfirmationModal
            title="Duplicate Item Detected"
            message={`The item "${duplicateWarning.itemToAdd.itemName}" (${duplicateWarning.itemToAdd.itemCode}) already exists in this vendor's list.\n\nAdding it again allows you to configure different properties (e.g., separate agreements or price types) for the same item.\n\nDo you want to proceed?`}
            confirmLabel="Yes, Add Duplicate"
            confirmStyle="primary"
            onConfirm={() =>
              commitItemAdd(duplicateWarning.itemToAdd!)
            }
            onCancel={() =>
              setDuplicateWarning({
                isOpen: false,
                itemToAdd: null,
              })
            }
          />
        )}

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
                <div>
                  <label className="block text-gray-700 mb-2">
                    Price Type{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={newItem.priceType === "Fixed"}
                        onChange={() =>
                          setNewItem({
                            ...newItem,
                            priceType: "Fixed",
                          })
                        }
                        className="w-4 h-4 text-[#ec2224] focus:ring-[#ec2224] border-gray-300"
                      />{" "}
                      Fixed
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
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
                        className="w-4 h-4 text-[#ec2224] focus:ring-[#ec2224] border-gray-300"
                      />{" "}
                      Not Fixed
                    </label>
                  </div>
                </div>
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
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ec2224] ${!newItem.agreementNumber && agreements.length > 0 ? "border-red-300 bg-red-50" : "border-gray-300"}`}
                      >
                        <option value="">
                          Select Agreement
                        </option>
                        {agreements.map((agr) => (
                          <option
                            key={agr.id}
                            value={agr.number}
                          >
                            {agr.number} ({agr.type})
                          </option>
                        ))}
                      </select>
                      {agreements.length === 0 && (
                        <p className="text-xs text-red-500 mt-1">
                          No agreements available. Please add an
                          Agreement/Offering above first.
                        </p>
                      )}
                    </div>
                  </>
                )}
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