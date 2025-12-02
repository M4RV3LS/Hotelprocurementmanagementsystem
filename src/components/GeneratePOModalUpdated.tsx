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
  etaStart: string;
  etaEnd: string;
  paymentTerms: string;
  vendorName: string;
  vendorAddress: string;
  vendorPIC: string;
  ppnPercentage: number;
  serviceChargePercentage: number;
  pb1Percentage: number;
  whtPercentage: number;
  items: Array<{
    prNumber: string;
    brand: string;
    itemName: string;
    quantity: number;
    uom: string;
    unitPrice: number;
    whtPercentage: number;
    pic: string;
    propertyCode: string;
    propertyName: string;
    propertyAddress: string;
    itemStatus: "Not Set" | "Ready" | "Cancelled";
    region: string;
    item: ProcurementItem; // Reference to original item
  }>;
}

type StepType = "selection" | "preview";

export default function GeneratePOModal({
  onClose,
  onGenerate,
  vendors,
  requests,
}: GeneratePOModalProps) {
  const [step, setStep] = useState<StepType>("selection");

  // Selection state
  const [selectedVendor, setSelectedVendor] = useState("");
  const [selectedRegions, setSelectedRegions] = useState<
    string[]
  >([]);
  const [selectedPaymentTerms, setSelectedPaymentTerms] =
    useState("");

  // Preview state
  const [poData, setPOData] = useState<POData | null>(null);

  // -------------------------------------------------------------------------
  // CORE LOGIC: Get Items based on ITEM Status only
  // Requirement: Filter request_items status = "Waiting PO"
  // Requirement: Do NOT look at procurement_requests.status
  // -------------------------------------------------------------------------
  const getAvailableItems = () => {
    const items: Array<{
      request: ProcurementRequest;
      item: ProcurementItem;
    }> = [];

    requests.forEach((request) => {
      // Iterate through ALL items regardless of request status
      request.items.forEach((item) => {
        if (
          item.status === "Waiting PO" && // Strict Check: Item must be waiting for PO
          item.vendorName && // Item must have a vendor assigned
          (item.unitPrice || 0) > 0 // Item must have a price
        ) {
          items.push({ request, item });
        }
      });
    });

    return items;
  };

  // Get unique vendors from available items
  const getAvailableVendors = () => {
    const availableItems = getAvailableItems();
    const uniqueVendors = new Set(
      availableItems.map(({ item }) => item.vendorName),
    );
    return Array.from(uniqueVendors).filter(
      Boolean,
    ) as string[];
  };

  // Get regions for selected vendor
  const getAvailableRegions = () => {
    if (!selectedVendor) return [];
    const availableItems = getAvailableItems();
    const filteredItems = availableItems.filter(
      ({ item }) => item.vendorName === selectedVendor,
    );
    const regions = new Set(
      filteredItems.map(({ item }) => item.region),
    );
    return Array.from(regions).filter(Boolean) as string[];
  };

  // Get payment terms for selected vendor + regions
  const getAvailablePaymentTerms = () => {
    if (!selectedVendor || selectedRegions.length === 0)
      return [];
    const availableItems = getAvailableItems();
    const filteredItems = availableItems.filter((entry) => {
      return (
        entry.item.vendorName === selectedVendor &&
        selectedRegions.includes(entry.item.region)
      );
    });
    const paymentTerms = new Set(
      filteredItems.map(({ item }) => item.paymentTerms),
    );
    return Array.from(paymentTerms).filter(Boolean) as string[];
  };

  // Count helper
  const getMatchingItemsCount = (
    vendor?: string,
    regions?: string[],
    paymentTerms?: string,
  ) => {
    const availableItems = getAvailableItems();
    return availableItems.filter(({ item }) => {
      if (vendor && item.vendorName !== vendor) return false;
      if (
        regions &&
        regions.length > 0 &&
        !regions.includes(item.region)
      )
        return false;
      if (paymentTerms && item.paymentTerms !== paymentTerms)
        return false;
      return true;
    }).length;
  };

  const handleNext = () => {
    const availableItems = getAvailableItems();
    const matchingItems = availableItems.filter(({ item }) => {
      return (
        item.vendorName === selectedVendor &&
        selectedRegions.includes(item.region) &&
        item.paymentTerms === selectedPaymentTerms
      );
    });

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

    const compiledPOData: POData = {
      poNumber,
      poDate,
      etaStart: "",
      etaEnd: "",
      paymentTerms: selectedPaymentTerms,
      vendorName: selectedVendor,
      vendorAddress: vendor?.vendorAddress || "",
      vendorPIC: vendor?.picName || "",
      ppnPercentage: vendor?.ppnPercentage || 11,
      serviceChargePercentage:
        vendor?.serviceChargePercentage || 0,
      pb1Percentage: vendor?.pb1Percentage || 0,
      whtPercentage: 0,
      items: matchingItems.map(({ request, item }) => ({
        prNumber: request.prNumber,
        brand: request.brandName,
        itemName: `${item.itemName} - ${Object.values(item.selectedProperties || {}).join(", ")}`,
        quantity: item.quantity,
        uom: item.uom,
        unitPrice: item.unitPrice || 0,
        whtPercentage: 0,
        pic: request.picName,
        propertyCode: request.propertyCode,
        propertyName: request.propertyName,
        propertyAddress: request.propertyAddress,
        itemStatus: "Not Set",
        region: item.region,
        item: item,
      })),
    };

    setPOData(compiledPOData);
    setStep("preview");
  };

  // Pass data back to parent via onGenerate, parent handles API calls
  const handleExportPO = () => {
    if (!poData) return;

    // We pass the "previewed" PO data back up.
    // The parent (ProcurementDashboard or App) logic utilizing api.ts will handle the DB creation.
    // For visual feedback, we temporarily return the requests involved.

    // Logic: Identify distinct requests involved
    const involvedPRNumbers = new Set(
      poData.items.map((i) => i.prNumber),
    );
    const involvedRequests = requests.filter((r) =>
      involvedPRNumbers.has(r.prNumber),
    );

    // Note: The actual creation of purchase_orders record happens in the parent component
    // via the `purchaseOrdersAPI.create` call we set up in Phase 1.
    // Here we just trigger the callback with the PO configuration.

    // To support the Phase 1 flow properly, we should ideally pass the PO Data structure back.
    // Since the interface currently expects `poRequests`, we stick to that for now,
    // but we attach the PO metadata to the callback context if possible,
    // or rely on the parent to access state.

    // *Best Practice Adaptation*: The Parent (Dashboard) needs to know the PO details.
    // We will attach the PO Data to the first request merely as a carrier, or modify the interface.
    // For now, let's trigger the callback and assume the parent will refresh data from DB.

    // We need to pass the constructed PO object to the parent so it can save it to the DB.
    // Since the signature is fixed as `onGenerate(requests)`, we will modify the calling code
    // in ProcurementDashboard to read the `poData` state or we assume this component handles the save.

    // Actually, looking at previous Phase 1, we updated `handleExportPO` to call `purchaseOrdersAPI.create`.
    // I will implement that direct call here for robustness.

    import("../utils/api").then(({ purchaseOrdersAPI }) => {
      const itemIds = poData.items.map((i) => i.item.id);
      const totalAmount = poData.items.reduce(
        (sum, i) => sum + i.unitPrice * i.quantity,
        0,
      );

      // Find vendor ID
      const vendorId = vendors.find(
        (v) => v.vendorName === selectedVendor,
      )?.id;

      purchaseOrdersAPI
        .create(
          {
            poNumber: poData.poNumber,
            vendorId: vendorId, // Ensure your vendors list has IDs
            generatedDate: poData.poDate,
            totalAmount: totalAmount,
          },
          itemIds,
        )
        .then(() => {
          alert(
            `PO ${poData.poNumber} generated successfully!`,
          );
          onGenerate(requests); // Trigger refresh
          onClose();
        })
        .catch((err) => {
          console.error(err);
          alert("Failed to create PO in database.");
        });
    });
  };

  const availableVendors = getAvailableVendors();
  const availableRegions = getAvailableRegions();
  const availablePaymentTerms = getAvailablePaymentTerms();

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
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
                    <strong>Note:</strong> Only items with
                    status <u>"Waiting PO"</u> are shown here.
                    Items are filtered from all Open requests.
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
                        setSelectedRegions([]);
                        setSelectedPaymentTerms("");
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ec2224]"
                    >
                      <option value="">Select Vendor</option>
                      {availableVendors.map((vendor) => (
                        <option key={vendor} value={vendor}>
                          {vendor} (
                          {getMatchingItemsCount(vendor)} items)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 2. Region */}
                  <div>
                    <MultiSelectDropdown
                      options={availableRegions}
                      selectedValues={selectedRegions}
                      onChange={(regions) => {
                        setSelectedRegions(regions);
                        setSelectedPaymentTerms("");
                      }}
                      label="Region"
                      placeholder="Select Regions"
                    />
                  </div>

                  {/* 3. Payment Terms */}
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
                        selectedRegions.length === 0
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ec2224] disabled:bg-gray-100"
                    >
                      <option value="">
                        Select Payment Terms
                      </option>
                      {availablePaymentTerms.map((term) => (
                        <option key={term} value={term}>
                          {term}
                        </option>
                      ))}
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
              /* PREVIEW STEP */
              <div className="space-y-6">
                {/* PO Header Info */}
                <div className="bg-gray-50 rounded-lg p-6 grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-gray-900 font-medium mb-2">
                      PO Details
                    </h3>
                    <div className="text-sm text-gray-600">
                      PO Number:{" "}
                      <span className="text-gray-900">
                        {poData?.poNumber}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Vendor:{" "}
                      <span className="text-gray-900">
                        {poData?.vendorName}
                      </span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-gray-900 font-medium mb-2">
                      Dates
                    </h3>
                    <div className="flex gap-2 items-center">
                      <span className="text-sm text-gray-600">
                        PO Date:
                      </span>
                      <input
                        type="date"
                        value={poData?.poDate}
                        onChange={(e) =>
                          setPOData(
                            poData
                              ? {
                                  ...poData,
                                  poDate: e.target.value,
                                }
                              : null,
                          )
                        }
                        className="border rounded px-2 py-1 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-700 font-medium border-b">
                      <tr>
                        <th className="px-4 py-3">PR Number</th>
                        <th className="px-4 py-3">Item</th>
                        <th className="px-4 py-3">Region</th>
                        <th className="px-4 py-3">Qty</th>
                        <th className="px-4 py-3 text-right">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {poData?.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-3 text-gray-600">
                            {item.prNumber}
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-900">
                            {item.itemName}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {item.region}
                          </td>
                          <td className="px-4 py-3">
                            {item.quantity} {item.uom}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {new Intl.NumberFormat("id-ID", {
                              style: "currency",
                              currency: "IDR",
                            }).format(
                              item.unitPrice * item.quantity,
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-between pt-4 border-t border-gray-200">
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
                    <Download className="w-4 h-4" />
                    Confirm & Generate PO
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}