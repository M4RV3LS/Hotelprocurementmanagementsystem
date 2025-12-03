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

interface POData {
  poNumber: string;
  poDate: string;
  eta: string;
  paymentTerms: string;
  vendorName: string;
  vendorAddress: string;
  vendorPIC: string;
  ppnPercentage: number;
  items: Array<{
    prNumber: string;
    itemName: string;
    quantity: number;
    uom: string;
    unitPrice: number;
    whtPercentage: number;
    pic: string;
    region: string;
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
    useState(""); // REQ 2: New State
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

  // REQ 2: Filter logic for Property Types
  const getAvailablePropertyTypes = () => {
    if (!selectedVendor) return [];
    const availableItems = getAvailableItems();

    // Filter items by vendor first
    const vendorItems = availableItems.filter(
      ({ item }) => item.vendorName === selectedVendor,
    );

    // Extract property types from the LINKED REQUEST
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
        request.propertyType === selectedPropertyType, // REQ 2: Dependency
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

  // Helper count function
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
          request.propertyType === selectedPropertyType && // REQ 2: Match logic
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
      paymentTerms: selectedPaymentTerms,
      vendorName: selectedVendor,
      vendorAddress: vendor?.vendorAddress || "-",
      vendorPIC:
        vendor?.picName || vendor?.contact_person || "-",
      ppnPercentage: vendor?.ppnPercentage || 11,
      items: matchingItems.map(({ request, item }) => ({
        prNumber: request.prNumber,
        itemName: `${item.itemName}`,
        quantity: item.quantity,
        uom: item.uom,
        unitPrice: item.unitPrice || 0,
        whtPercentage: getItemWHT(item.itemCode),
        pic: request.picName,
        region: item.region,
        item: item,
        status: "Not Ready",
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

          // Optimistic Update for UI
          // We iterate over the *existing* requests state and update the relevant items
          const readyItemIds = new Set(
            readyItems.map((i) => i.item.id),
          );

          const updatedRequests = requests.map((req) => ({
            ...req,
            items: req.items.map((item) => {
              if (readyItemIds.has(item.id)) {
                return {
                  ...item,
                  status: "Waiting PO Approval" as const, // Force status change
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

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] overflow-y-auto">
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

                  {/* 2. Property Type (NEW) */}
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
              // ... Preview Mode (Reuse existing table structure) ...
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  {/* ... Header details ... */}
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
                    {/* ... other fields ... */}
                    <div className="col-span-2">
                      <span className="text-sm text-gray-500 block">
                        Property Type
                      </span>
                      <span className="text-gray-900">
                        {selectedPropertyType}
                      </span>
                    </div>
                    {/* ... ETA Input ... */}
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

                {/* Table Logic reused from original code but now using filtered items */}
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-700 font-medium border-b">
                      <tr>
                        <th className="px-4 py-3">PR Number</th>
                        <th className="px-4 py-3">Item Name</th>
                        <th className="px-4 py-3">Qty</th>
                        <th className="px-4 py-3 text-right">
                          Unit Price
                        </th>
                        <th
                          className="px-4 py-3 text-center"
                          style={{ width: "100px" }}
                        >
                          WHT %
                        </th>
                        <th className="px-4 py-3 text-right">
                          Total
                        </th>
                        <th className="px-4 py-3 text-center">
                          Status
                        </th>
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
                          <td className="px-4 py-3 text-gray-600">
                            {item.prNumber}
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-900">
                            {item.itemName}
                          </td>
                          <td className="px-4 py-3">
                            {item.quantity} {item.uom}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {new Intl.NumberFormat("id-ID", {
                              style: "currency",
                              currency: "IDR",
                            }).format(item.unitPrice)}
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
                              className="w-16 border rounded px-1 text-center text-sm"
                            />
                          </td>
                          <td className="px-4 py-3 text-right">
                            {new Intl.NumberFormat("id-ID", {
                              style: "currency",
                              currency: "IDR",
                            }).format(
                              item.unitPrice * item.quantity,
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <select
                              value={item.status}
                              onChange={(e) => {
                                const val = e.target.value as
                                  | "Ready"
                                  | "Not Ready";
                                const newItems = [
                                  ...(poData?.items || []),
                                ];
                                newItems[idx] = {
                                  ...item,
                                  status: val,
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
                              className={`text-xs rounded px-2 py-1 border ${
                                item.status === "Ready"
                                  ? "bg-green-100 text-green-800 border-green-200"
                                  : "bg-gray-100 text-gray-600 border-gray-300"
                              }`}
                            >
                              <option value="Not Ready">
                                Not Ready
                              </option>
                              <option value="Ready">
                                Ready
                              </option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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