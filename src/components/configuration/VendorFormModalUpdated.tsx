import { useState } from "react";
import {
  X,
  Plus,
  Trash2,
  FileText,
  CheckCircle,
  CheckSquare,
  Square,
} from "lucide-react";
import type { Vendor } from "./VendorManagement";

// --- Interfaces ---

interface Agreement {
  id: string;
  type: "Agreement" | "Offering";
  documentNumber: string;
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
  selectedPhotos: string[];
  masterPhotos?: string[];
}

interface ExtendedVendor
  extends Omit<Vendor, "agreements" | "items"> {
  agreements: Agreement[];
  items: VendorItem[];
  deliveryFee?: number;
  // ... Legal fields same as before
  nibNumber?: string;
  nibFileLink?: string;
  ktpNumber?: string;
  ktpFileLink?: string;
  npwpNumber?: string;
  npwpFileLink?: string;
  sppkpNumber?: string;
  sppkpFileLink?: string;
  deedNumber?: string;
  deedFileLink?: string;
  sbuNumber?: string;
  sbuFileLink?: string;
  constructionNumber?: string;
  constructionFileLink?: string;
  localTaxNumber?: string;
  localTaxFileLink?: string;
  corNumber?: string;
  corFileLink?: string;
  gptcNumber?: string;
  gptcFileLink?: string;
  otherLicenseFileLink?: string;
  bankName?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankAccountDocLink?: string;
  legalDocLink?: string;
  picName?: string;
  email2?: string;
}

interface VendorFormModalProps {
  vendor: ExtendedVendor | null;
  onClose: () => void;
  onSave: (vendor: ExtendedVendor) => void;
  activePaymentMethods: string[];
  items: any[];
}

const PROPERTY_TYPES = ["Franchise", "Leasing", "Management"];

// --- Helpers ---

const handleImageError = (
  e: React.SyntheticEvent<HTMLImageElement, Event>,
) => {
  e.currentTarget.src =
    "https://placehold.co/150x150?text=No+Image";
};

const ReadOnlyField = ({
  label,
  value,
}: {
  label: string;
  value: string | number | undefined;
}) => (
  <div className="mb-2">
    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
      {label}
    </label>
    <div className="text-gray-900 bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm min-h-[38px] flex items-center">
      {value || "-"}
    </div>
  </div>
);

const ReadOnlyFileLink = ({
  label,
  link,
}: {
  label: string;
  link?: string;
}) => (
  <div className="mb-2">
    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
      {label}
    </label>
    {link ? (
      <a
        href={link}
        target="_blank"
        rel="noreferrer"
        className="text-blue-600 hover:underline text-sm flex items-center gap-1 h-[38px]"
      >
        <FileText className="w-3 h-3" /> View Document
      </a>
    ) : (
      <span className="text-sm text-gray-400 italic h-[38px] flex items-center">
        No document
      </span>
    )}
  </div>
);

export default function VendorFormModalUpdated({
  vendor,
  onClose,
  onSave,
  items,
}: VendorFormModalProps) {
  // Main Form State
  const [formData] = useState<ExtendedVendor>(
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
      nibNumber: "",
      ktpNumber: "",
      npwpNumber: "",
      bankName: "",
      bankAccountName: "",
      bankAccountNumber: "",
    },
  );

  // Vendor Items State
  const [vendorItems, setVendorItems] = useState<VendorItem[]>(
    (formData.items || []).map((i) => ({
      ...i,
      multipleOf: i.multipleOf || 1,
      selectedPhotos: i.selectedPhotos || [],
      masterPhotos:
        i.masterPhotos ||
        items.find((mi: any) => mi.itemCode === i.itemCode)
          ?.photos ||
        [],
    })),
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

  // --- Handlers ---

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
        selectedPhotos: [],
      });
    }
  };

  const handleAddItemToVendor = () => {
    if (!newItem.itemCode)
      return alert("Please select an item");
    if (newItem.minQuantity <= 0)
      return alert("Min Qty must be > 0");
    if (newItem.multipleOf <= 0)
      return alert("Multiple Of must be > 0");

    if (newItem.priceType === "Fixed") {
      if (!newItem.agreementNumber)
        return alert("Fixed Price requires an Agreement");
      if (newItem.unitPrice <= 0)
        return alert("Fixed Price requires Unit Price > 0");
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

  // --- Tick All Logic ---
  const isAllSelected = (type: string) => {
    if (vendorItems.length === 0) return false;
    return vendorItems.every((item) =>
      item.propertyTypes.includes(type),
    );
  };

  const handleToggleAll = (type: string) => {
    const allSelected = isAllSelected(type);
    setVendorItems((prev) =>
      prev.map((item) => {
        const types = new Set(item.propertyTypes);
        if (allSelected) {
          types.delete(type);
        } else {
          types.add(type);
        }
        return { ...item, propertyTypes: Array.from(types) };
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

  const togglePhoto = (photoUrl: string) => {
    const current = newItem.selectedPhotos;
    const exists = current.includes(photoUrl);
    setNewItem({
      ...newItem,
      selectedPhotos: exists
        ? current.filter((p) => p !== photoUrl)
        : [...current, photoUrl],
    });
  };

  const handleSave = () => {
    onSave({
      ...formData,
      items: vendorItems,
    });
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[95vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
            <h2 className="text-gray-900 font-bold text-lg">
              {vendor
                ? "Vendor Details (Read Only)"
                : "New Vendor"}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="px-6 py-6 space-y-8">
            {/* 1. General Information */}
            <section>
              <h3 className="text-gray-900 font-bold mb-4 border-b pb-2 flex items-center gap-2">
                <span className="bg-gray-200 text-gray-700 w-6 h-6 rounded-full flex items-center justify-center text-xs">
                  1
                </span>
                General Information
              </h3>
              <div className="grid grid-cols-3 gap-6 bg-gray-50/50 p-4 rounded-lg border border-gray-100">
                <ReadOnlyField
                  label="Vendor Code"
                  value={formData.vendorCode}
                />
                <ReadOnlyField
                  label="Vendor Name"
                  value={formData.vendorName}
                />
                <ReadOnlyField
                  label="PIC Name"
                  value={formData.picName}
                />
                <div className="col-span-3">
                  <ReadOnlyField
                    label="Address"
                    value={formData.vendorAddress}
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                    Regional Coverage
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {Array.isArray(formData.vendorRegion) &&
                    formData.vendorRegion.length > 0 ? (
                      formData.vendorRegion.map((r, i) => (
                        <span
                          key={i}
                          className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded border border-blue-200"
                        >
                          {r}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-gray-500">
                        -
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* 2. Legal & Admin Information */}
            <section>
              <h3 className="text-gray-900 font-bold mb-4 border-b pb-2 flex items-center gap-2">
                <span className="bg-gray-200 text-gray-700 w-6 h-6 rounded-full flex items-center justify-center text-xs">
                  2
                </span>
                Legal & Admin Information
              </h3>
              <div className="grid grid-cols-4 gap-6 bg-gray-50/50 p-4 rounded-lg border border-gray-100">
                <ReadOnlyField
                  label="Vendor Type"
                  value={formData.vendorType}
                />
                <div className="col-span-3"></div>

                {/* Standard Fields */}
                <ReadOnlyField
                  label="NPWP Number"
                  value={formData.npwpNumber}
                />
                <ReadOnlyFileLink
                  label="NPWP Doc"
                  link={formData.npwpFileLink}
                />

                <ReadOnlyField
                  label="NIB Number"
                  value={formData.nibNumber}
                />
                <ReadOnlyFileLink
                  label="NIB Doc"
                  link={formData.nibFileLink}
                />

                <ReadOnlyField
                  label="KTP Number"
                  value={formData.ktpNumber}
                />
                <ReadOnlyFileLink
                  label="KTP Doc"
                  link={formData.ktpFileLink}
                />

                {/* Additional Requested Fields */}
                <ReadOnlyField
                  label="SPPKP Number"
                  value={formData.sppkpNumber}
                />
                <ReadOnlyFileLink
                  label="SPPKP Doc"
                  link={formData.sppkpFileLink}
                />

                <ReadOnlyField
                  label="Deed Number"
                  value={formData.deedNumber}
                />
                <ReadOnlyFileLink
                  label="Deed Doc"
                  link={formData.deedFileLink}
                />

                <ReadOnlyField
                  label="SBU Number"
                  value={formData.sbuNumber}
                />
                <ReadOnlyFileLink
                  label="SBU Doc"
                  link={formData.sbuFileLink}
                />

                <ReadOnlyField
                  label="Construction Lic."
                  value={formData.constructionNumber}
                />
                <ReadOnlyFileLink
                  label="Construction Doc"
                  link={formData.constructionFileLink}
                />

                <ReadOnlyField
                  label="Local Tax Reg"
                  value={formData.localTaxNumber}
                />
                <ReadOnlyFileLink
                  label="Local Tax Doc"
                  link={formData.localTaxFileLink}
                />

                <ReadOnlyField
                  label="COR Number"
                  value={formData.corNumber}
                />
                <ReadOnlyFileLink
                  label="COR Doc"
                  link={formData.corFileLink}
                />

                <ReadOnlyField
                  label="GPTC Number"
                  value={formData.gptcNumber}
                />
                <ReadOnlyFileLink
                  label="GPTC Doc"
                  link={formData.gptcFileLink}
                />

                <div className="col-span-1"></div>
                <ReadOnlyFileLink
                  label="Other License (File Only)"
                  link={formData.otherLicenseFileLink}
                />
              </div>

              <h4 className="text-gray-700 font-medium mt-4 mb-2 pl-4">
                Bank Information
              </h4>
              <div className="grid grid-cols-3 gap-6 bg-gray-50/50 p-4 rounded-lg border border-gray-100">
                <ReadOnlyField
                  label="Bank Name"
                  value={formData.bankName}
                />
                <ReadOnlyField
                  label="Account Name"
                  value={formData.bankAccountName}
                />
                <ReadOnlyField
                  label="Account Number"
                  value={formData.bankAccountNumber}
                />
                <ReadOnlyFileLink
                  label="Bank Document"
                  link={formData.bankAccountDocLink}
                />
              </div>
            </section>

            {/* 3. Tax & Fees */}
            <section>
              <h3 className="text-gray-900 font-bold mb-4 border-b pb-2 flex items-center gap-2">
                <span className="bg-gray-200 text-gray-700 w-6 h-6 rounded-full flex items-center justify-center text-xs">
                  3
                </span>
                Tax Configuration
              </h3>
              <div className="grid grid-cols-4 gap-6 bg-gray-50/50 p-4 rounded-lg border border-gray-100">
                <ReadOnlyField
                  label="PPN (%)"
                  value={formData.ppnPercentage}
                />
                <ReadOnlyField
                  label="Service Charge (%)"
                  value={formData.serviceChargePercentage}
                />
                <ReadOnlyField
                  label="PB1 (%)"
                  value={formData.pb1Percentage}
                />
                {/* Requirement #1: Added Payment Method Field */}
                <ReadOnlyField
                  label="Payment Method"
                  value={
                    formData.paymentMethods?.join(", ") || "-"
                  }
                />
              </div>
            </section>

            {/* 4. Agreements */}
            <section>
              <h3 className="text-gray-900 font-bold mb-4 border-b pb-2 flex items-center gap-2">
                <span className="bg-gray-200 text-gray-700 w-6 h-6 rounded-full flex items-center justify-center text-xs">
                  4
                </span>
                Agreements / Offerings
              </h3>
              <div className="space-y-3">
                {formData.agreements?.map((agr, idx) => (
                  <div
                    key={idx}
                    className="border border-gray-200 rounded p-3 flex justify-between items-center bg-gray-50"
                  >
                    <div>
                      <p className="font-medium text-sm">
                        {agr.documentNumber}{" "}
                        <span className="text-gray-500 font-normal">
                          ({agr.type})
                        </span>
                      </p>
                      <p className="text-xs text-gray-500">
                        {agr.startDate} - {agr.endDate}
                      </p>
                    </div>
                    {agr.link && (
                      <a
                        href={agr.link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline text-sm"
                      >
                        View Link
                      </a>
                    )}
                  </div>
                ))}
                {(!formData.agreements ||
                  formData.agreements.length === 0) && (
                  <p className="text-gray-400 italic text-sm">
                    No agreements listed.
                  </p>
                )}
              </div>
            </section>

            {/* 5. Vendor Item Configuration (Editable Table) */}
            <section className="border-t-4 border-[#ec2224] pt-6 mt-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-900 font-bold text-lg flex items-center gap-2">
                  <span className="bg-[#ec2224] text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">
                    5
                  </span>
                  Vendor Item Configuration (Editable)
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

              <div className="overflow-x-auto border rounded-lg shadow-sm">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-100 text-gray-700 uppercase font-semibold text-xs border-b">
                    <tr>
                      <th className="px-4 py-3 min-w-[150px]">
                        Item
                      </th>
                      <th className="px-4 py-3">Price Type</th>
                      <th className="px-4 py-3">Unit Price</th>
                      <th className="px-4 py-3">Min Qty</th>
                      <th className="px-4 py-3">Multiple Of</th>
                      <th className="px-4 py-3">Agreement</th>
                      {/* Tick All Headers */}
                      {PROPERTY_TYPES.map((type) => (
                        <th
                          key={type}
                          className="px-4 py-3 text-center w-[100px]"
                        >
                          <div
                            className="flex flex-col items-center gap-1 cursor-pointer group"
                            onClick={() =>
                              handleToggleAll(type)
                            }
                          >
                            <span>{type}</span>
                            <div
                              className={`p-0.5 rounded ${isAllSelected(type) ? "text-green-600" : "text-gray-400 group-hover:text-gray-600"}`}
                            >
                              {isAllSelected(type) ? (
                                <CheckSquare className="w-4 h-4" />
                              ) : (
                                <Square className="w-4 h-4" />
                              )}
                            </div>
                          </div>
                        </th>
                      ))}
                      <th className="px-4 py-3 text-center">
                        Photos
                      </th>
                      <th className="px-4 py-3 text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {vendorItems.map((item, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">
                            {item.itemName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {item.itemCode}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {item.priceType}
                        </td>
                        <td className="px-4 py-3">
                          {item.priceType === "Fixed"
                            ? `Rp ${item.unitPrice.toLocaleString()}`
                            : "-"}
                        </td>
                        <td className="px-4 py-3">
                          {item.minQuantity}
                        </td>
                        <td className="px-4 py-3">
                          {item.multipleOf}
                        </td>
                        <td
                          className="px-4 py-3 text-xs text-gray-600 truncate max-w-[100px]"
                          title={item.agreementNumber}
                        >
                          {item.agreementNumber || "-"}
                        </td>
                        {PROPERTY_TYPES.map((type) => (
                          <td
                            key={type}
                            className="px-4 py-3 text-center"
                          >
                            <input
                              type="checkbox"
                              checked={item.propertyTypes.includes(
                                type,
                              )}
                              onChange={() =>
                                handleToggleCell(idx, type)
                              }
                              className="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500 cursor-pointer"
                            />
                          </td>
                        ))}
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {item.selectedPhotos.length}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() =>
                                handleEditItem(idx)
                              }
                              className="text-blue-600 hover:underline text-xs"
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
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {vendorItems.length === 0 && (
                      <tr>
                        <td
                          colSpan={11}
                          className="px-4 py-8 text-center text-gray-500 italic"
                        >
                          No items configured for this vendor.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end gap-3 rounded-b-lg">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Close
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-[#ec2224] text-white rounded-lg hover:bg-[#d11f21]"
            >
              Save & Update Vendor
            </button>
          </div>
        </div>
      </div>

      {/* Add/Edit Item Modal Overlay */}
      {showAddItem && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-lg mb-6 border-b pb-2 text-gray-900">
              {editingItemIndex !== null
                ? "Edit Item Config"
                : "Add Item to Vendor"}
            </h3>

            <div className="space-y-6">
              {/* Item Selection */}
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Select Item
                </label>
                <select
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#ec2224] outline-none bg-white"
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

              {/* Quantities */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">
                    Min Quantity (MOQ)
                  </label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded p-2"
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
                  <label className="block text-sm font-medium mb-1 text-gray-700">
                    Multiple Of
                  </label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded p-2"
                    value={newItem.multipleOf}
                    onChange={(e) =>
                      setNewItem({
                        ...newItem,
                        multipleOf:
                          parseInt(e.target.value) || 1,
                      })
                    }
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    e.g. Box of 12, enter 12
                  </p>
                </div>
              </div>

              {/* Pricing & Agreement */}
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <label className="block text-sm font-medium mb-3 text-gray-700">
                  Pricing Configuration
                </label>

                <div className="flex gap-6 mb-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="priceType"
                      checked={newItem.priceType === "Fixed"}
                      onChange={() =>
                        setNewItem({
                          ...newItem,
                          priceType: "Fixed",
                        })
                      }
                      className="text-red-600 focus:ring-red-500"
                    />
                    <span className="text-sm">Fixed Price</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="priceType"
                      checked={
                        newItem.priceType === "Not Fixed"
                      }
                      onChange={() =>
                        setNewItem({
                          ...newItem,
                          priceType: "Not Fixed",
                        })
                      }
                      className="text-red-600 focus:ring-red-500"
                    />
                    <span className="text-sm">
                      Not Fixed / Market Price
                    </span>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">
                      Agreement{" "}
                      {newItem.priceType === "Fixed" && (
                        <span className="text-red-500">*</span>
                      )}
                    </label>
                    <select
                      className="w-full border border-gray-300 rounded p-2 text-sm"
                      value={newItem.agreementNumber}
                      onChange={(e) =>
                        setNewItem({
                          ...newItem,
                          agreementNumber: e.target.value,
                        })
                      }
                    >
                      <option value="">Select Agreement</option>
                      {formData.agreements?.map((agr) => (
                        <option
                          key={agr.documentNumber}
                          value={agr.documentNumber}
                        >
                          {agr.documentNumber} ({agr.type})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">
                      Unit Price{" "}
                      {newItem.priceType === "Fixed" && (
                        <span className="text-red-500">*</span>
                      )}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-gray-500 text-sm">
                        Rp
                      </span>
                      <input
                        type="number"
                        className="w-full border border-gray-300 rounded p-2 pl-9 disabled:bg-gray-100 disabled:text-gray-400"
                        value={newItem.unitPrice}
                        disabled={
                          newItem.priceType === "Not Fixed"
                        }
                        onChange={(e) =>
                          setNewItem({
                            ...newItem,
                            unitPrice:
                              parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                  </div>
                  {/* Requirement #8: Changed Tax Label to WHT% */}
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">
                      WHT%
                    </label>
                    <input
                      type="number"
                      className="w-full border border-gray-300 rounded p-2"
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
              </div>

              {/* Photo Selection */}
              {newItem.masterPhotos &&
                newItem.masterPhotos.length > 0 && (
                  <div className="border-t pt-4">
                    <label className="block text-sm font-medium mb-2 text-gray-700">
                      Select Item Photos to Display
                    </label>
                    <div className="grid grid-cols-4 gap-3">
                      {newItem.masterPhotos.map(
                        (photo, idx) => {
                          const isSelected =
                            newItem.selectedPhotos.includes(
                              photo,
                            );
                          return (
                            <div
                              key={idx}
                              onClick={() => togglePhoto(photo)}
                              className={`relative aspect-square border-2 rounded-lg cursor-pointer transition-all ${isSelected ? "border-green-500 ring-2 ring-green-100" : "border-gray-200 hover:border-gray-300"}`}
                            >
                              <img
                                src={photo}
                                className="w-full h-full object-cover rounded-md"
                                alt="Master"
                                onError={handleImageError}
                              />
                              {isSelected && (
                                <div className="absolute top-1 right-1 bg-green-500 text-white rounded-full p-0.5 shadow-sm">
                                  <CheckCircle className="w-4 h-4" />
                                </div>
                              )}
                            </div>
                          );
                        },
                      )}
                    </div>
                  </div>
                )}
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-4 border-t">
              <button
                onClick={() => setShowAddItem(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddItemToVendor}
                className="px-6 py-2 bg-[#ec2224] text-white rounded-lg hover:bg-[#d11f21]"
              >
                {editingItemIndex !== null
                  ? "Update Item"
                  : "Add Item"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}