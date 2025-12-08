import { useState } from "react";
import { X, ChevronRight, Download } from "lucide-react";
import {
  type ProcurementRequest,
  type ProcurementItem,
} from "../data/mockData";
import MultiSelectDropdown from "./configuration/MultiSelectDropdown";

interface GeneratePOModalProps {
  onClose: () => void;
  onGenerate: (poRequests: ProcurementRequest[]) => void;
  vendors: any[];
  requests: ProcurementRequest[];
}

// Requirement 2: Expanded PO Data interface for calculations
interface POData {
  poNumber: string;
  poDate: string;
  eta: string;
  paymentTerms: string;
  vendorName: string;
  vendorAddress: string;
  vendorPIC: string;
  ppnPercentage: number;
  serviceChargePercentage: number; // Added
  items: Array<{
    prNumber: string;
    itemName: string;
    brandItem: string; // Added: Item Brand
    brandProperty: string; // Added: Property Brand
    quantity: number;
    uom: string;
    unitPrice: number;
    whtPercentage: number;
    pic: string;
    region: string; // Used for City
    propertyCode: string; // Added
    propertyName: string; // Added
    propertyAddress: string; // Added
    item: ProcurementItem;
    status: "Ready" | "Not Ready";
  }>;
}

type StepType = "selection" | "preview";

export default function GeneratePOModalUpdated({
  onClose,
  onGenerate,
  vendors,
  requests,
}: GeneratePOModalProps) {
  const [step, setStep] = useState<StepType>("selection");

  // Selection state
  const [selectedVendor, setSelectedVendor] = useState("");
  const [selectedPropertyType, setSelectedPropertyType] =
    useState("");
  const [selectedRegions, setSelectedRegions] = useState<
    string[]
  >([]);
  const [selectedPaymentTerms, setSelectedPaymentTerms] =
    useState("");

  // Preview state
  const [poData, setPOData] = useState<POData | null>(null);

  const getAvailableItems = () => {
    const items: Array<{
      request: ProcurementRequest;
      item: ProcurementItem;
    }> = [];

    requests.forEach((request) => {
      request.items.forEach((item) => {
        if (
          item.status === "Waiting PO" &&
          item.vendorName &&
          (item.unitPrice || 0) > 0
        ) {
          items.push({ request, item });
        }
      });
    });
    return items;
  };

  const getAvailableVendors = () => {
    const availableItems = getAvailableItems();
    const uniqueVendors = new Set(
      availableItems.map(({ item }) => item.vendorName),
    );
    return Array.from(uniqueVendors).filter(
      Boolean,
    ) as string[];
  };

  const getAvailablePropertyTypes = () => {
    if (!selectedVendor) return [];
    const availableItems = getAvailableItems();
    const vendorItems = availableItems.filter(
      ({ item }) => item.vendorName === selectedVendor,
    );
    const types = new Set(
      vendorItems.map(({ request }) => request.propertyType),
    );
    return Array.from(types).filter(Boolean) as string[];
  };

  const getAvailableRegions = () => {
    if (!selectedVendor || !selectedPropertyType) return [];
    const availableItems = getAvailableItems();
    const filteredItems = availableItems.filter(
      ({ item, request }) =>
        item.vendorName === selectedVendor &&
        request.propertyType === selectedPropertyType,
    );
    const regions = new Set(
      filteredItems.map(({ item }) => item.region),
    );
    return Array.from(regions).filter(Boolean) as string[];
  };

  const getAvailablePaymentTerms = () => {
    if (
      !selectedVendor ||
      !selectedPropertyType ||
      selectedRegions.length === 0
    )
      return [];

    const availableItems = getAvailableItems();
    const filteredItems = availableItems.filter(
      ({ item, request }) =>
        item.vendorName === selectedVendor &&
        request.propertyType === selectedPropertyType &&
        selectedRegions.includes(item.region),
    );

    const paymentTerms = new Set(
      filteredItems.map(({ item }) => item.paymentTerms),
    );
    return Array.from(paymentTerms).filter(Boolean) as string[];
  };

  const getMatchingItemsCount = (
    vendor?: string,
    propType?: string,
  ) => {
    const availableItems = getAvailableItems();
    return availableItems.filter(({ item, request }) => {
      if (vendor && item.vendorName !== vendor) return false;
      if (propType && request.propertyType !== propType)
        return false;
      return true;
    }).length;
  };

  const handleNext = () => {
    const availableItems = getAvailableItems();
    const matchingItems = availableItems.filter(
      ({ item, request }) => {
        return (
          item.vendorName === selectedVendor &&
          request.propertyType === selectedPropertyType &&
          selectedRegions.includes(item.region) &&
          item.paymentTerms === selectedPaymentTerms
        );
      },
    );

    if (matchingItems.length === 0) {
      alert("No items match the selected criteria");
      return;
    }

    const poNumber = `PO${new Date().getFullYear()}${Math.floor(
      Math.random() * 10000,
    )
      .toString()
      .padStart(4, "0")}IDR`;

    // Requirement 2a: PO Date Autofilled (Today)
    const poDate = new Date().toISOString().split("T")[0];

    const vendor = vendors.find(
      (v) => v.vendorName === selectedVendor,
    );

    const getItemWHT = (itemCode: string) => {
      const vendorItem = vendor?.items?.find(
        (vi: any) => vi.itemCode === itemCode,
      );
      return vendorItem?.taxPercentage || 0;
    };

    const compiledPOData: POData = {
      poNumber,
      poDate,
      eta: "",
      paymentTerms: selectedPaymentTerms, // Requirement 2b: Autofilled
      vendorName: selectedVendor,
      vendorAddress: vendor?.vendorAddress || "-",
      vendorPIC:
        vendor?.picName || vendor?.contact_person || "-",
      ppnPercentage: vendor?.ppnPercentage || 11,
      serviceChargePercentage:
        vendor?.serviceChargePercentage || 0, // Requirement 2d
      items: matchingItems.map(({ request, item }) => ({
        prNumber: request.prNumber,
        itemName: `${item.itemName}`,
        brandItem:
          item.itemCategory === "Branding Item"
            ? request.brandName || "RedDoorz"
            : "Generic", // Approximate logic for Brand Item
        brandProperty: request.brandName, // Property Brand
        quantity: item.quantity,
        uom: item.uom,
        unitPrice: item.unitPrice || 0,
        whtPercentage: getItemWHT(item.itemCode),
        pic: request.picName,
        region: item.region,
        propertyCode: request.propertyCode,
        propertyName: request.propertyName,
        propertyAddress: request.propertyAddress,
        item: item,
        status: "Ready", // Default to Ready for preview logic
      })),
    };

    setPOData(compiledPOData);
    setStep("preview");
  };

  const handleExportPO = () => {
    if (!poData) return;

    const readyItems = poData.items.filter(
      (i) => i.status === "Ready",
    );

    if (readyItems.length === 0) {
      alert(
        "No items are marked as 'Ready'. PO cannot be generated.",
      );
      return;
    }

    if (!poData.eta) {
      alert("Please input Estimated Time Arrival (ETA).");
      return;
    }

    import("../utils/api").then(({ purchaseOrdersAPI }) => {
      const vendorId = vendors.find(
        (v) => v.vendorName === selectedVendor,
      )?.id;

      if (!vendorId) {
        alert(
          "System Error: Vendor ID not found. Please refresh vendor data.",
        );
        return;
      }

      const poPayload = {
        poNumber: poData.poNumber,
        vendorId: vendorId,
        generatedDate: poData.poDate,
        totalAmount: readyItems.reduce(
          (sum, i) => sum + i.unitPrice * i.quantity,
          0,
        ),
        items: readyItems.map((i) => ({
          id: i.item.id,
          whtPercentage: i.whtPercentage,
          eta: poData.eta,
        })),
      };

      purchaseOrdersAPI
        .create(poPayload)
        .then(() => {
          alert(
            `PO ${poData.poNumber} generated successfully with ${readyItems.length} items!`,
          );

          const readyItemIds = new Set(
            readyItems.map((i) => i.item.id),
          );

          const updatedRequests = requests.map((req) => ({
            ...req,
            items: req.items.map((item) => {
              if (readyItemIds.has(item.id)) {
                return {
                  ...item,
                  status: "Waiting PO Approval" as const,
                  poNumber: poData.poNumber,
                };
              }
              return item;
            }),
          }));

          onGenerate(updatedRequests);
          onClose();
        })
        .catch((err) => {
          console.error(err);
          alert("Failed to create PO in database.");
        });
    });
  };

  // Requirement 2d: Calculations
  const calculateTotals = () => {
    if (!poData)
      return {
        totalQty: 0,
        totalAmount: 0,
        ppn: 0,
        sc: 0,
        grandTotal: 0,
      };

    const readyItems = poData.items.filter(
      (i) => i.status === "Ready",
    );

    const totalQty = readyItems.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );
    const totalAmount = readyItems.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );

    // Standard Tax Calc: Total + Service Charge + PPN
    // WHT is usually deducted from payment, so standard Invoice Grand Total = Total + SC + PPN
    const sc =
      totalAmount * (poData.serviceChargePercentage / 100);
    const taxableAmount = totalAmount + sc;
    const ppn = taxableAmount * (poData.ppnPercentage / 100);

    const grandTotal = totalAmount + sc + ppn;

    return { totalQty, totalAmount, ppn, sc, grandTotal };
  };

  const totals = calculateTotals();

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-[95vw] max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 flex items-center justify-between z-10">
            <h2 className="text-gray-900">
              Generate Purchase Order
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="px-8 py-6">
            {step === "selection" ? (
              // ... [Selection Step Code Remains Same] ...
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-900 text-sm">
                    <strong>Note:</strong> Items are filtered by
                    Vendor &gt; Property Type &gt; Region &gt;
                    Payment Terms.
                  </p>
                </div>
                <div className="space-y-4">
                  {/* 1. Vendor */}
                  <div>
                    <label className="block text-gray-700 mb-2">
                      Vendor{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedVendor}
                      onChange={(e) => {
                        setSelectedVendor(e.target.value);
                        setSelectedPropertyType("");
                        setSelectedRegions([]);
                        setSelectedPaymentTerms("");
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ec2224]"
                    >
                      <option value="">Select Vendor</option>
                      {getAvailableVendors().map((vendor) => (
                        <option key={vendor} value={vendor}>
                          {vendor} (
                          {getMatchingItemsCount(vendor)} items)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 2. Property Type */}
                  <div>
                    <label className="block text-gray-700 mb-2">
                      Property Type{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedPropertyType}
                      onChange={(e) => {
                        setSelectedPropertyType(e.target.value);
                        setSelectedRegions([]);
                        setSelectedPaymentTerms("");
                      }}
                      disabled={!selectedVendor}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ec2224] disabled:bg-gray-100"
                    >
                      <option value="">
                        Select Property Type
                      </option>
                      {getAvailablePropertyTypes().map(
                        (type) => (
                          <option key={type} value={type}>
                            {type} (
                            {getMatchingItemsCount(
                              selectedVendor,
                              type,
                            )}{" "}
                            items)
                          </option>
                        ),
                      )}
                    </select>
                  </div>

                  {/* 3. Region */}
                  <div>
                    <MultiSelectDropdown
                      options={getAvailableRegions()}
                      selectedValues={selectedRegions}
                      onChange={(regions) => {
                        setSelectedRegions(regions);
                        setSelectedPaymentTerms("");
                      }}
                      label="Region"
                      placeholder="Select Regions"
                    />
                  </div>

                  {/* 4. Payment Terms */}
                  <div>
                    <label className="block text-gray-700 mb-2">
                      Payment Terms{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedPaymentTerms}
                      onChange={(e) =>
                        setSelectedPaymentTerms(e.target.value)
                      }
                      disabled={
                        !selectedVendor ||
                        !selectedPropertyType ||
                        selectedRegions.length === 0
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ec2224] disabled:bg-gray-100"
                    >
                      <option value="">
                        Select Payment Terms
                      </option>
                      {getAvailablePaymentTerms().map(
                        (term) => (
                          <option key={term} value={term}>
                            {term}
                          </option>
                        ),
                      )}
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={onClose}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={
                      !selectedVendor ||
                      !selectedPropertyType ||
                      selectedRegions.length === 0 ||
                      !selectedPaymentTerms
                    }
                    className="px-6 py-2 bg-[#ec2224] text-white rounded-lg hover:bg-[#d11f21] disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    Next: Preview PO{" "}
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : (
              // Requirement 2: Preview Mode Updates
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  {/* Header details */}
                  <h3 className="text-gray-900 font-medium mb-4 border-b pb-2">
                    PO Header Details
                  </h3>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                    <div>
                      <span className="text-sm text-gray-500 block">
                        PO Number
                      </span>
                      <span className="text-gray-900 font-medium">
                        {poData?.poNumber}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500 block">
                        Vendor Name
                      </span>
                      <span className="text-gray-900 font-medium">
                        {poData?.vendorName}
                      </span>
                    </div>
                    <div>
                      {/* Requirement 2a: Read Only PO Date */}
                      <span className="text-sm text-gray-500 block">
                        PO Date
                      </span>
                      <input
                        type="date"
                        value={poData?.poDate}
                        disabled
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm bg-gray-100 text-gray-500 px-3 py-2 sm:text-sm"
                      />
                    </div>
                    <div>
                      {/* Requirement 2b: Autofilled Payment Terms */}
                      <span className="text-sm text-gray-500 block">
                        Payment Terms
                      </span>
                      <input
                        type="text"
                        value={poData?.paymentTerms}
                        disabled
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm bg-gray-100 text-gray-500 px-3 py-2 sm:text-sm"
                      />
                    </div>

                    {/* ETA Input */}
                    <div>
                      <span className="text-sm text-gray-500 block mb-1">
                        ETA{" "}
                        <span className="text-red-500">*</span>
                      </span>
                      <input
                        type="date"
                        value={poData?.eta}
                        onChange={(e) =>
                          setPOData(
                            poData
                              ? {
                                  ...poData,
                                  eta: e.target.value,
                                }
                              : null,
                          )
                        }
                        className="border border-gray-300 rounded px-2 py-1 text-sm w-full focus:ring-2 focus:ring-[#ec2224]"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Requirement 2c: Adjusted Table Columns */}
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="w-full text-sm text-left whitespace-nowrap">
                    <thead className="bg-gray-50 text-gray-700 font-medium border-b">
                      <tr>
                        <th className="px-4 py-3">No</th>
                        <th className="px-4 py-3">Brand</th>
                        <th className="px-4 py-3">
                          Brand Item
                        </th>
                        <th className="px-4 py-3">Item Name</th>
                        <th className="px-4 py-3">City</th>
                        <th className="px-4 py-3">Qty</th>
                        <th className="px-4 py-3">PIC</th>
                        <th className="px-4 py-3">Prop Code</th>
                        <th className="px-4 py-3">Prop Name</th>
                        <th className="px-4 py-3">Address</th>
                        <th className="px-4 py-3 text-right">
                          Unit Price
                        </th>
                        <th className="px-4 py-3 text-right">
                          Total
                        </th>
                        <th
                          className="px-4 py-3 text-center"
                          style={{ width: "80px" }}
                        >
                          WHT %
                        </th>
                        {/* Requirement 2e: Status Column Removed */}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {poData?.items.map((item, idx) => (
                        <tr
                          key={idx}
                          className={
                            item.status === "Not Ready"
                              ? "bg-gray-50/50"
                              : ""
                          }
                        >
                          <td className="px-4 py-3">
                            {idx + 1}
                          </td>
                          <td className="px-4 py-3">
                            {item.brandProperty}
                          </td>
                          <td className="px-4 py-3">
                            {item.brandItem}
                          </td>
                          <td className="px-4 py-3 font-medium">
                            {item.itemName}
                          </td>
                          <td className="px-4 py-3">
                            {item.region}
                          </td>
                          <td className="px-4 py-3">
                            {item.quantity} {item.uom}
                          </td>
                          <td className="px-4 py-3">
                            {item.pic}
                          </td>
                          <td className="px-4 py-3">
                            {item.propertyCode}
                          </td>
                          <td
                            className="px-4 py-3 truncate max-w-[150px]"
                            title={item.propertyName}
                          >
                            {item.propertyName}
                          </td>
                          <td
                            className="px-4 py-3 truncate max-w-[150px]"
                            title={item.propertyAddress}
                          >
                            {item.propertyAddress}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {new Intl.NumberFormat(
                              "id-ID",
                            ).format(item.unitPrice)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {new Intl.NumberFormat(
                              "id-ID",
                            ).format(
                              item.unitPrice * item.quantity,
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <input
                              type="number"
                              value={item.whtPercentage}
                              onChange={(e) => {
                                const val =
                                  parseFloat(e.target.value) ||
                                  0;
                                const newItems = [
                                  ...(poData?.items || []),
                                ];
                                newItems[idx] = {
                                  ...item,
                                  whtPercentage: val,
                                };
                                setPOData(
                                  poData
                                    ? {
                                        ...poData,
                                        items: newItems,
                                      }
                                    : null,
                                );
                              }}
                              className="w-12 border rounded px-1 text-center text-xs"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Requirement 2d: Total Calculations */}
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      Total Quantity:
                    </span>
                    <span className="font-medium">
                      {totals.totalQty}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      Total Amount:
                    </span>
                    <span className="font-medium">
                      {formatCurrency(totals.totalAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      Service Charge (
                      {poData?.serviceChargePercentage}%):
                    </span>
                    <span className="font-medium">
                      {formatCurrency(totals.sc)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      PPN ({poData?.ppnPercentage}%):
                    </span>
                    <span className="font-medium">
                      {formatCurrency(totals.ppn)}
                    </span>
                  </div>
                  <div className="border-t border-gray-300 pt-2 flex justify-between text-lg font-bold text-gray-900">
                    <span>Grand Total:</span>
                    <span>
                      {formatCurrency(totals.grandTotal)}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-500">
                    {
                      poData?.items.filter(
                        (i) => i.status === "Ready",
                      ).length
                    }{" "}
                    items marked as Ready.
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setStep("selection")}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleExportPO}
                      className="px-6 py-2 bg-[#ec2224] text-white rounded-lg hover:bg-[#d11f21] flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" /> Generate
                      PO
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}