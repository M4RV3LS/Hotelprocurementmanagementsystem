import { useState } from "react";
import {
  X,
  Plus,
  Trash2,
  FileText,
  CheckCircle,
  Link as LinkIcon,
  Eye,
  CheckSquare,
  Square,
} from "lucide-react";
import type { Vendor } from "./VendorManagement";
import MultiSelectDropdown from "./MultiSelectDropdown";
import { INDONESIA_REGIONS } from "../../data/mockData";
import ConfirmationModal from "./ConfirmationModal";

// --- Interfaces ---

interface Agreement {
  id: string;
  type: "Agreement" | "Offering";
  number: string;
  startDate: string;
  endDate: string;
  documentLink?: string;
  link: string;
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
  propertyTypes: string[];
  selectedPhotos: string[]; // For storing selected photo URLs
  masterPhotos?: string[]; // Read-only from master item for selection context
}

// Extended Vendor interface to include new fields
interface ExtendedVendor
  extends Omit<Vendor, "agreements" | "items"> {
  agreements: Agreement[];
  items: VendorItem[];
  deliveryFee?: number;
  // Legal & Admin Fields
  nibNumber?: string;
  nibFileLink?: string;
  ktpNumber?: string;
  ktpFileLink?: string;
  npwpdNumber?: string;
  npwpdFileLink?: string;
  bankName?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankAccountDocLink?: string;
  legalDocLink?: string;
}

interface VendorFormModalProps {
  vendor: ExtendedVendor | null;
  onClose: () => void;
  onSave: (vendor: ExtendedVendor) => void;
  activePaymentMethods: string[];
  items: any[]; // Master items list for lookup
}

const PROPERTY_TYPES = ["Franchise", "Leasing", "Management"];

// --- Helper Component ---

const FileUploadField = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
}) => (
  <div>
    <label className="block text-xs font-medium text-gray-700 mb-1">
      {label}
    </label>
    <div className="flex gap-2 items-center">
      {value ? (
        <div className="flex items-center gap-2">
          <span className="text-xs text-green-600 flex items-center gap-1 bg-green-50 px-2 py-1 rounded border border-green-200">
            <FileText className="w-3 h-3" /> File Attached
          </span>
          <a
            href={value}
            target="_blank"
            rel="noreferrer"
            className="text-gray-500 hover:text-blue-600"
            title="Preview File"
          >
            <Eye className="w-4 h-4" />
          </a>
        </div>
      ) : (
        <span className="text-xs text-gray-400 italic">
          No file
        </span>
      )}
      <label className="cursor-pointer text-xs text-blue-600 hover:underline font-medium">
        Upload
        <input
          type="file"
          className="hidden"
          accept=".pdf,.png,.jpg,.jpeg"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              // In a real app, upload logic goes here. For Figma prototype, we use blob URL.
              onChange(URL.createObjectURL(e.target.files[0]));
            }
          }}
        />
      </label>
    </div>
  </div>
);

// --- Main Component ---

export default function VendorFormModalUpdated({
  vendor,
  onClose,
  onSave,
  activePaymentMethods,
  items,
}: VendorFormModalProps) {
  // Initialize form state
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
      deliveryFee: 0,
      paymentMethods: [],
      agreements: [],
      items: [],
      isActive: true,
      // New Fields Defaults
      nibNumber: "",
      nibFileLink: "",
      ktpNumber: "",
      ktpFileLink: "",
      npwpdNumber: "",
      npwpdFileLink: "",
      bankName: "",
      bankAccountName: "",
      bankAccountNumber: "",
      bankAccountDocLink: "",
      legalDocLink: "",
    },
  );

  // Local state for complex fields
  const [selectedRegions, setSelectedRegions] = useState<
    string[]
  >(
    Array.isArray(formData.vendorRegion)
      ? formData.vendorRegion
      : formData.vendorRegion
        ? [formData.vendorRegion]
        : [],
  );

  const [selectedPaymentMethods, setSelectedPaymentMethods] =
    useState<string[]>(formData.paymentMethods || []);

  const [vendorItems, setVendorItems] = useState<VendorItem[]>(
    (formData.items || []).map((i) => ({
      ...i,
      selectedPhotos: i.selectedPhotos || [],
      // Hydrate master photos if editing an existing vendor item, finding match in master items list
      masterPhotos:
        i.masterPhotos ||
        items.find((mi: any) => mi.itemCode === i.itemCode)
          ?.photos ||
        [],
    })),
  );

  const [agreements, setAgreements] = useState<Agreement[]>(
    formData.agreements || [],
  );

  // Modal States
  const [showAddItem, setShowAddItem] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<
    number | null
  >(null);

  // New Item State
  const [newItem, setNewItem] = useState<VendorItem>({
    itemCode: "",
    itemName: "",
    minQuantity: 1,
    multipleOf: 1,
    priceType: "Fixed",
    unitPrice: 0,
    agreementNumber: "",
    taxPercentage: 0,
    propertyTypes: [],
    selectedPhotos: [],
  });

  const [duplicateWarning, setDuplicateWarning] = useState<{
    isOpen: boolean;
    itemToAdd: VendorItem | null;
  }>({
    isOpen: false,
    itemToAdd: null,
  });

  // --- Handlers ---

  const handleInputChange = (
    field: keyof ExtendedVendor,
    value: any,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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

  const handleAddAgreement = () => {
    setAgreements([
      ...agreements,
      {
        id: `agr-${Date.now()}`,
        type: "Agreement",
        number: "",
        startDate: "",
        endDate: "",
        link: "",
        documentLink: "",
      },
    ]);
  };

  const handleRemoveAgreement = (index: number) => {
    setAgreements((prev) => prev.filter((_, i) => i !== index));
  };

  // Item Logic
  const handleItemSelect = (itemCode: string) => {
    const selectedItem = items.find(
      (i: any) => i.itemCode === itemCode,
    );
    if (selectedItem) {
      setNewItem({
        ...newItem,
        itemCode: selectedItem.itemCode,
        itemName: selectedItem.itemName,
        masterPhotos: selectedItem.photos || [],
        selectedPhotos: [], // Reset selection for new item
      });
    }
  };

  const handleAddItemToVendor = () => {
    if (!newItem.itemCode || newItem.minQuantity <= 0) {
      alert("Please fill in item code and minimum quantity");
      return;
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

    // Reset
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
      selectedPhotos: [],
    });
    setShowAddItem(false);
  };

  const handleEditItem = (index: number) => {
    setNewItem(vendorItems[index]);
    setEditingItemIndex(index);
    setShowAddItem(true);
  };

  const togglePhotoSelection = (
    itemIndex: number,
    photoUrl: string,
  ) => {
    setVendorItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== itemIndex) return item;
        const currentSelected = item.selectedPhotos || [];
        const isSelected = currentSelected.includes(photoUrl);
        return {
          ...item,
          selectedPhotos: isSelected
            ? currentSelected.filter((p) => p !== photoUrl)
            : [...currentSelected, photoUrl],
        };
      }),
    );
  };

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
    const allSelected = vendorItems.every((item) =>
      item.propertyTypes.includes(type),
    );
    setVendorItems((prev) =>
      prev.map((item) => {
        const hasType = item.propertyTypes.includes(type);
        if (allSelected) {
          // Untick all
          return {
            ...item,
            propertyTypes: item.propertyTypes.filter(
              (t) => t !== type,
            ),
          };
        } else {
          // Tick all (if not already ticked)
          return {
            ...item,
            propertyTypes: hasType
              ? item.propertyTypes
              : [...item.propertyTypes, type],
          };
        }
      }),
    );
  };

  const handleSave = () => {
    if (!formData.vendorCode || !formData.vendorName) {
      alert("Please fill in Vendor Code and Vendor Name");
      return;
    }

    onSave({
      ...formData,
      vendorRegion: selectedRegions,
      paymentMethods: selectedPaymentMethods,
      items: vendorItems,
      agreements: agreements,
    });
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
            <h2 className="text-gray-900 font-bold text-lg">
              {vendor ? "Edit Vendor" : "Add New Vendor"}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="px-6 py-6 space-y-8">
            {/* 1. Basic Information */}
            <section>
              <h3 className="text-gray-900 font-medium mb-4 border-b pb-2">
                Basic Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    Vendor Code{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-[#ec2224] outline-none"
                    value={formData.vendorCode}
                    onChange={(e) =>
                      handleInputChange(
                        "vendorCode",
                        e.target.value,
                      )
                    }
                    placeholder="VND001"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    Vendor Name{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-[#ec2224] outline-none"
                    value={formData.vendorName}
                    onChange={(e) =>
                      handleInputChange(
                        "vendorName",
                        e.target.value,
                      )
                    }
                    placeholder="PT Example"
                  />
                </div>
                <div>
                  <MultiSelectDropdown
                    options={INDONESIA_REGIONS}
                    selectedValues={selectedRegions}
                    onChange={setSelectedRegions}
                    label="Regions"
                    placeholder="Select Regions"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-[#ec2224] outline-none"
                    value={formData.vendorEmail}
                    onChange={(e) =>
                      handleInputChange(
                        "vendorEmail",
                        e.target.value,
                      )
                    }
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm text-gray-700 mb-1">
                    Address
                  </label>
                  <textarea
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-[#ec2224] outline-none"
                    rows={2}
                    value={formData.vendorAddress}
                    onChange={(e) =>
                      handleInputChange(
                        "vendorAddress",
                        e.target.value,
                      )
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-[#ec2224] outline-none"
                    value={formData.vendorPhone}
                    onChange={(e) =>
                      handleInputChange(
                        "vendorPhone",
                        e.target.value,
                      )
                    }
                  />
                </div>
              </div>
            </section>

            {/* 2. Legal & Admin Information (New) */}
            <section>
              <h3 className="text-gray-900 font-medium mb-4 border-b pb-2">
                Legal & Admin Information
              </h3>
              <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                <div className="grid grid-cols-3 gap-6 mb-6">
                  {/* NIB */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        NIB Number
                      </label>
                      <input
                        className="w-full border border-gray-300 rounded p-2 text-sm"
                        value={formData.nibNumber}
                        onChange={(e) =>
                          handleInputChange(
                            "nibNumber",
                            e.target.value,
                          )
                        }
                      />
                    </div>
                    <FileUploadField
                      label="NIB Document"
                      value={formData.nibFileLink || ""}
                      onChange={(url) =>
                        handleInputChange("nibFileLink", url)
                      }
                    />
                  </div>
                  {/* KTP */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        KTP Number
                      </label>
                      <input
                        className="w-full border border-gray-300 rounded p-2 text-sm"
                        value={formData.ktpNumber}
                        onChange={(e) =>
                          handleInputChange(
                            "ktpNumber",
                            e.target.value,
                          )
                        }
                      />
                    </div>
                    <FileUploadField
                      label="KTP Document"
                      value={formData.ktpFileLink || ""}
                      onChange={(url) =>
                        handleInputChange("ktpFileLink", url)
                      }
                    />
                  </div>
                  {/* NPWPD */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        NPWPD Number
                      </label>
                      <input
                        className="w-full border border-gray-300 rounded p-2 text-sm"
                        value={formData.npwpdNumber}
                        onChange={(e) =>
                          handleInputChange(
                            "npwpdNumber",
                            e.target.value,
                          )
                        }
                      />
                    </div>
                    <FileUploadField
                      label="NPWPD Document"
                      value={formData.npwpdFileLink || ""}
                      onChange={(url) =>
                        handleInputChange("npwpdFileLink", url)
                      }
                    />
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4 grid grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bank Name
                    </label>
                    <select
                      className="w-full border border-gray-300 rounded p-2 text-sm"
                      value={formData.bankName}
                      onChange={(e) =>
                        handleInputChange(
                          "bankName",
                          e.target.value,
                        )
                      }
                    >
                      <option value="">Select Bank</option>
                      <option value="BCA">BCA</option>
                      <option value="Mandiri">Mandiri</option>
                      <option value="BNI">BNI</option>
                      <option value="BRI">BRI</option>
                      <option value="CIMB Niaga">
                        CIMB Niaga
                      </option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Account Name
                    </label>
                    <input
                      className="w-full border border-gray-300 rounded p-2 text-sm"
                      value={formData.bankAccountName}
                      onChange={(e) =>
                        handleInputChange(
                          "bankAccountName",
                          e.target.value,
                        )
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Account Number
                    </label>
                    <input
                      className="w-full border border-gray-300 rounded p-2 text-sm"
                      value={formData.bankAccountNumber}
                      onChange={(e) =>
                        handleInputChange(
                          "bankAccountNumber",
                          e.target.value,
                        )
                      }
                    />
                  </div>
                  <div className="pt-6">
                    <FileUploadField
                      label="Bank Document"
                      value={formData.bankAccountDocLink || ""}
                      onChange={(url) =>
                        handleInputChange(
                          "bankAccountDocLink",
                          url,
                        )
                      }
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* 3. Tax & Fees */}
            <section className="border-t border-gray-200 pt-6">
              <h3 className="text-gray-900 mb-4 font-medium">
                Tax & Fees Configuration
              </h3>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    PPN (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full border border-gray-300 rounded-lg p-2"
                    value={formData.ppnPercentage}
                    onChange={(e) =>
                      handleInputChange(
                        "ppnPercentage",
                        parseFloat(e.target.value) || 0,
                      )
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    Service Charge (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full border border-gray-300 rounded-lg p-2"
                    value={formData.serviceChargePercentage}
                    onChange={(e) =>
                      handleInputChange(
                        "serviceChargePercentage",
                        parseFloat(e.target.value) || 0,
                      )
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    PB1 (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full border border-gray-300 rounded-lg p-2"
                    value={formData.pb1Percentage}
                    onChange={(e) =>
                      handleInputChange(
                        "pb1Percentage",
                        parseFloat(e.target.value) || 0,
                      )
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    Delivery Fee
                  </label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded-lg p-2"
                    value={formData.deliveryFee}
                    onChange={(e) =>
                      handleInputChange(
                        "deliveryFee",
                        parseFloat(e.target.value) || 0,
                      )
                    }
                  />
                </div>
              </div>
            </section>

            {/* 4. Payment Methods */}
            <section className="border-t border-gray-200 pt-6">
              <MultiSelectDropdown
                options={activePaymentMethods}
                selectedValues={selectedPaymentMethods}
                onChange={setSelectedPaymentMethods}
                label="Payment Methods"
                placeholder="Select payment methods"
              />
            </section>

            {/* 5. Agreements */}
            <section className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-900 font-medium">
                  Agreements / Offerings
                </h3>
                <button
                  onClick={handleAddAgreement}
                  className="text-[#ec2224] hover:text-[#d11f21] text-sm flex items-center gap-1 font-medium"
                >
                  <Plus className="w-4 h-4" /> Add Document
                </button>
              </div>
              {agreements.map((agreement, index) => (
                <div
                  key={agreement.id}
                  className="border border-gray-200 rounded-lg p-4 mb-3 bg-gray-50"
                >
                  <div className="flex justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-700">
                      Document {index + 1}
                    </h4>
                    <button
                      onClick={() =>
                        handleRemoveAgreement(index)
                      }
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Number
                      </label>
                      <input
                        className="w-full border rounded p-2 text-sm"
                        value={agreement.number}
                        onChange={(e) =>
                          handleAgreementChange(
                            index,
                            "number",
                            e.target.value,
                          )
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Type
                      </label>
                      <div className="flex gap-3 mt-2">
                        <label className="flex items-center gap-1 text-sm cursor-pointer">
                          <input
                            type="radio"
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
                            className="text-[#ec2224]"
                          />{" "}
                          Agreement
                        </label>
                        <label className="flex items-center gap-1 text-sm cursor-pointer">
                          <input
                            type="radio"
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
                            className="text-[#ec2224]"
                          />{" "}
                          Offering
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        className="w-full border rounded p-2 text-sm"
                        value={agreement.startDate}
                        onChange={(e) =>
                          handleAgreementChange(
                            index,
                            "startDate",
                            e.target.value,
                          )
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        End Date
                      </label>
                      <input
                        type="date"
                        className="w-full border rounded p-2 text-sm"
                        value={agreement.endDate}
                        onChange={(e) =>
                          handleAgreementChange(
                            index,
                            "endDate",
                            e.target.value,
                          )
                        }
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs text-gray-600 mb-1">
                        Link
                      </label>
                      <div className="relative">
                        <LinkIcon className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
                        <input
                          type="url"
                          className="w-full border rounded p-2 pl-8 text-sm"
                          placeholder="https://"
                          value={agreement.link}
                          onChange={(e) =>
                            handleAgreementChange(
                              index,
                              "link",
                              e.target.value,
                            )
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </section>

            {/* 6. Vendor Items with Photo Selection (Req 2) */}
            <section className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-900 font-medium">
                  Vendor Item Configuration
                </h3>
                <button
                  onClick={() => {
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
                      selectedPhotos: [],
                    });
                    setEditingItemIndex(null);
                    setShowAddItem(true);
                  }}
                  className="px-4 py-2 bg-[#ec2224] text-white rounded-lg hover:bg-[#d11f21] flex items-center gap-2 text-sm"
                >
                  <Plus className="w-4 h-4" /> Add Item
                </button>
              </div>

              {/* Requirement 2: Table View for Vendor Item Mapping */}
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200 text-left">
                    <tr>
                      <th className="px-4 py-3 font-medium text-gray-700 w-64">
                        Item Info
                      </th>
                      <th className="px-4 py-3 font-medium text-gray-700 w-32">
                        Pricing
                      </th>
                      {PROPERTY_TYPES.map((type) => (
                        <th
                          key={type}
                          className="px-4 py-3 font-medium text-gray-700 text-center w-24"
                        >
                          <div className="flex flex-col items-center gap-1">
                            <span>{type}</span>
                            <button
                              onClick={() =>
                                handleTickAllColumn(type)
                              }
                              className="text-[10px] text-blue-600 hover:underline"
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
                      <th className="px-4 py-3 font-medium text-gray-700 w-48 text-left">
                        Photos
                      </th>
                      <th className="px-4 py-3 font-medium text-gray-700 text-right w-24">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {vendorItems.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5 + PROPERTY_TYPES.length}
                          className="text-center py-8 text-gray-500 italic"
                        >
                          No items configured.
                        </td>
                      </tr>
                    ) : (
                      vendorItems.map((item, idx) => (
                        <tr
                          key={idx}
                          className="hover:bg-gray-50"
                        >
                          <td className="px-4 py-3 align-top">
                            <div className="font-medium text-gray-900">
                              {item.itemName}
                            </div>
                            <div className="text-xs text-gray-500">
                              {item.itemCode}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              Min Qty: {item.minQuantity} | Tax:{" "}
                              {item.taxPercentage}%
                            </div>
                          </td>
                          <td className="px-4 py-3 align-top text-gray-600">
                            <div>{item.priceType}</div>
                            {item.priceType === "Fixed" && (
                              <div className="text-xs">
                                Rp{" "}
                                {item.unitPrice.toLocaleString()}
                              </div>
                            )}
                          </td>

                          {/* Property Type Columns */}
                          {PROPERTY_TYPES.map((type) => (
                            <td
                              key={type}
                              className="px-4 py-3 align-top text-center"
                            >
                              <button
                                onClick={() =>
                                  handleToggleCell(idx, type)
                                }
                                className={`p-1 rounded hover:bg-gray-100 transition-colors ${
                                  item.propertyTypes.includes(
                                    type,
                                  )
                                    ? "text-green-600"
                                    : "text-gray-300"
                                }`}
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

                          {/* Photo Selection (Requirement 1) */}
                          <td className="px-4 py-3 align-top">
                            {item.masterPhotos &&
                            item.masterPhotos.length > 0 ? (
                              <div className="flex gap-2 flex-wrap">
                                {item.masterPhotos.map(
                                  (
                                    photo: string,
                                    pIdx: number,
                                  ) => {
                                    const isSelected =
                                      item.selectedPhotos?.includes(
                                        photo,
                                      );
                                    return (
                                      <div
                                        key={pIdx}
                                        onClick={() =>
                                          togglePhotoSelection(
                                            idx,
                                            photo,
                                          )
                                        }
                                        className={`relative w-12 h-12 border cursor-pointer rounded overflow-hidden transition-all ${
                                          isSelected
                                            ? "border-green-500 ring-2 ring-green-100"
                                            : "border-gray-200 opacity-60 hover:opacity-100"
                                        }`}
                                        title={
                                          isSelected
                                            ? "Photo Selected"
                                            : "Click to Select"
                                        }
                                      >
                                        <img
                                          src={photo}
                                          className="w-full h-full object-cover"
                                          alt="Item"
                                        />
                                        {isSelected && (
                                          <div className="absolute top-0 right-0 bg-green-500 text-white rounded-bl-md p-[1px]">
                                            <CheckCircle className="w-2.5 h-2.5" />
                                          </div>
                                        )}
                                      </div>
                                    );
                                  },
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400 italic">
                                No master photos
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-3 align-top text-right">
                            <div className="flex flex-col gap-2 items-end">
                              <button
                                onClick={() =>
                                  handleEditItem(idx)
                                }
                                className="text-blue-600 text-xs hover:underline"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() =>
                                  setVendorItems((prev) =>
                                    prev.filter(
                                      (_, i) => i !== idx,
                                    ),
                                  )
                                }
                                className="text-red-600 hover:bg-red-50 p-1 rounded transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end gap-3 rounded-b-lg">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-[#ec2224] text-white rounded-lg hover:bg-[#d11f21]"
            >
              Save Vendor
            </button>
          </div>
        </div>
      </div>

      {/* Add/Edit Item Modal Overlay */}
      {showAddItem && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-lg w-full max-w-lg shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="font-bold text-lg mb-6 border-b pb-2">
              {editingItemIndex !== null
                ? "Edit Item"
                : "Add Item to Vendor"}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Select Item
                </label>
                <select
                  className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-[#ec2224] outline-none"
                  value={newItem.itemCode}
                  onChange={(e) =>
                    handleItemSelect(e.target.value)
                  }
                  disabled={editingItemIndex !== null}
                >
                  <option value="">
                    -- Choose from Master List --
                  </option>
                  {items
                    .filter((i) => i.isActive)
                    .map((i: any) => (
                      <option
                        key={i.itemCode}
                        value={i.itemCode}
                      >
                        {i.itemName} ({i.itemCode})
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Min Quantity
                  </label>
                  <input
                    type="number"
                    className="w-full border rounded p-2"
                    value={newItem.minQuantity}
                    onChange={(e) =>
                      setNewItem({
                        ...newItem,
                        minQuantity:
                          parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Multiple Of
                  </label>
                  <input
                    type="number"
                    className="w-full border rounded p-2"
                    value={newItem.multipleOf}
                    onChange={(e) =>
                      setNewItem({
                        ...newItem,
                        multipleOf:
                          parseInt(e.target.value) || 1,
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Pricing Model
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer border p-2 rounded w-full hover:bg-gray-50">
                    <input
                      type="radio"
                      checked={newItem.priceType === "Fixed"}
                      onChange={() =>
                        setNewItem({
                          ...newItem,
                          priceType: "Fixed",
                        })
                      }
                      className="text-[#ec2224]"
                    />
                    <span className="text-sm">Fixed Price</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer border p-2 rounded w-full hover:bg-gray-50">
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
                        })
                      }
                      className="text-[#ec2224]"
                    />
                    <span className="text-sm">Not Fixed</span>
                  </label>
                </div>
              </div>

              {newItem.priceType === "Fixed" && (
                <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Unit Price (IDR)
                    </label>
                    <input
                      type="number"
                      className="w-full border rounded p-2"
                      value={newItem.unitPrice}
                      onChange={(e) =>
                        setNewItem({
                          ...newItem,
                          unitPrice:
                            parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Agreement
                    </label>
                    <select
                      className="w-full border rounded p-2"
                      value={newItem.agreementNumber}
                      onChange={(e) =>
                        setNewItem({
                          ...newItem,
                          agreementNumber: e.target.value,
                        })
                      }
                    >
                      <option value="">Select...</option>
                      {agreements.map((a) => (
                        <option key={a.id} value={a.number}>
                          {a.number}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">
                  WHT (%)
                </label>
                <input
                  type="number"
                  className="w-full border rounded p-2"
                  value={newItem.taxPercentage}
                  onChange={(e) =>
                    setNewItem({
                      ...newItem,
                      taxPercentage:
                        parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button
                onClick={() => setShowAddItem(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddItemToVendor}
                className="px-4 py-2 bg-[#ec2224] text-white rounded-lg hover:bg-[#d11f21]"
              >
                {editingItemIndex !== null
                  ? "Update Item"
                  : "Add Item"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Duplicate Warning Modal */}
      {duplicateWarning.isOpen &&
        duplicateWarning.itemToAdd && (
          <ConfirmationModal
            title="Duplicate Item"
            message={`Item ${duplicateWarning.itemToAdd.itemName} is already in the list. Add it anyway?`}
            confirmLabel="Yes, Add"
            onConfirm={() => {
              // Logic to commit add if confirm logic was separated
              setVendorItems((prev) => [
                ...prev,
                duplicateWarning.itemToAdd!,
              ]);
              setDuplicateWarning({
                isOpen: false,
                itemToAdd: null,
              });
              setShowAddItem(false);
            }}
            onCancel={() =>
              setDuplicateWarning({
                isOpen: false,
                itemToAdd: null,
              })
            }
          />
        )}
    </>
  );
}