import { useState, useMemo, useEffect } from "react";
import { X, ChevronRight, Download } from "lucide-react";
import {
  type ProcurementRequest,
  type ProcurementItem,
} from "../data/mockData";
import MultiSelectDropdown from "./configuration/MultiSelectDropdown";
import { purchaseOrdersAPI } from "../utils/api";

interface GeneratePOModalProps {
  onClose: () => void;
  onGenerate: (poRequests: ProcurementRequest[]) => void;
  vendors: any[];
  requests: ProcurementRequest[];
}

// Requirement 2: Allowed Brand List
const ALLOWED_BRANDS = [
  "Reddoorz",
  "Reddoorz Premium",
  "RedLiving",
  "Sans",
  "Sans Vibe",
  "Sans Stay",
  "Sans Elite",
  "Urban View",
  "The Lavana",
  "No Branding",
  "Vibes by SANS",
];

interface POData {
  poNumber: string;
  poDate: string;
  eta: string;
  paymentTerms: string;
  vendorName: string;
  vendorAddress: string;
  vendorPIC: string;
  ppnPercentage: number;
  serviceChargePercentage: number;
  pb1Percentage: number;
  legalEntity: "CSI" | "RMI"; // Added for PO Generation
  agreementNumber: string;
  agreementDate: string;
  quotationNumber: string;
  quotationDate: string;
  note: string;
  items: Array<{
    id: string;
    prNumber: string;
    itemCode: string;
    itemName: string;
    brandItem: string;
    brandProperty: string;
    quantity: number;
    uom: string;
    unitPrice: number;
    whtPercentage: number;
    pic: string;
    picNumber: string;
    region: string;
    propertyCode: string;
    propertyName: string;
    propertyAddress: string;
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
  const [existingPONumbers, setExistingPONumbers] = useState<
    string[]
  >([]);

  // Fetch existing POs to calculate increment
  useEffect(() => {
    purchaseOrdersAPI.getAll().then((pos) => {
      setExistingPONumbers(pos.map((p) => p.poNumber));
    });
  }, []);

  // --- Helper: Roman Numeral Converter for Month ---
  const getRomanMonth = (date: Date): string => {
    const months = [
      "I",
      "II",
      "III",
      "IV",
      "V",
      "VI",
      "VII",
      "VIII",
      "IX",
      "X",
      "XI",
      "XII",
    ];
    return months[date.getMonth()];
  };

  // --- Helper: PO Number Generator ---
  // Format: PO[Year][3 Digit Increment][MonthRoman][ID][Entity]
  const generatePONumber = (
    entity: "CSI" | "RMI",
    dateStr: string,
  ) => {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const monthRoman = getRomanMonth(date);
    const countryCode = "ID"; // Fixed as per requirement

    // Filter existing POs for this Year to find max increment
    // Regex matches: PO2025(\d{3})...
    const pattern = new RegExp(`^PO${year}(\\d{3})`);

    let maxIncrement = 0;
    existingPONumbers.forEach((poNum) => {
      const match = poNum.match(pattern);
      if (match) {
        const inc = parseInt(match[1], 10);
        if (!isNaN(inc) && inc > maxIncrement) {
          maxIncrement = inc;
        }
      }
    });

    // Increment logic: Start 001, Reset after 999
    // If max is 999, we wrap to 001 (based on "reset to 001 after 999 maximum")
    let nextIncrement = maxIncrement + 1;
    if (nextIncrement > 999) nextIncrement = 1;

    const incrementStr = nextIncrement
      .toString()
      .padStart(3, "0");

    return `PO${year}${incrementStr}${monthRoman}${countryCode}${entity}`;
  };

  const vendorAgreements = useMemo(() => {
    const vendor = vendors.find(
      (v) => v.vendorName === selectedVendor,
    );
    return vendor?.agreements || [];
  }, [vendors, selectedVendor]);

  // ... [Filter Logic remains same] ...
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

    const poDate = new Date().toISOString().split("T")[0];
    const defaultEntity = "RMI"; // Default
    const poNumber = generatePONumber(defaultEntity, poDate);

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
      serviceChargePercentage:
        vendor?.serviceChargePercentage || 0,
      pb1Percentage: 0, // Default 0
      legalEntity: defaultEntity,
      agreementNumber: "",
      agreementDate: "",
      quotationNumber: "",
      quotationDate: "",
      note: "",
      items: matchingItems.map(({ request, item }) => ({
        id: item.id,
        prNumber: request.prNumber,
        itemCode: item.itemCode,
        itemName: `${item.itemName}`,
        brandItem:
          item.itemCategory === "Branding Item"
            ? request.brandName || "RedDoorz"
            : "Generic",
        brandProperty: request.brandName,
        quantity: item.quantity,
        uom: "Unit",
        unitPrice: item.unitPrice || 0,
        whtPercentage: getItemWHT(item.itemCode),
        pic: request.picName,
        picNumber: "",
        region: item.region,
        propertyCode: request.propertyCode,
        propertyName: request.propertyName,
        propertyAddress: request.propertyAddress,
        item: item,
        status: "Ready",
      })),
    };

    setPOData(compiledPOData);
    setStep("preview");
  };

  // --- Aggregation Logic for Table 1 ---
  const aggregatedItems = useMemo(() => {
    if (!poData) return [];
    const map = new Map();

    poData.items.forEach((item) => {
      const key = item.itemCode;
      if (!map.has(key)) {
        map.set(key, {
          itemCode: item.itemCode,
          itemName: item.itemName,
          quantity: 0,
          unitPrice: item.unitPrice,
          whtPercentage: item.whtPercentage,
        });
      }
      const existing = map.get(key);
      existing.quantity += item.quantity;
    });

    return Array.from(map.values());
  }, [poData?.items]);

  const calculateTotals = () => {
    if (!poData)
      return {
        totalQty: 0,
        totalAmount: 0,
        ppn: 0,
        sc: 0,
        pb1: 0,
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

    const sc =
      totalAmount * (poData.serviceChargePercentage / 100);
    const ppn = totalAmount * (poData.ppnPercentage / 100);
    const pb1 = totalAmount * (poData.pb1Percentage / 100);

    const grandTotal = totalAmount + sc + ppn + pb1;

    return { totalQty, totalAmount, ppn, sc, pb1, grandTotal };
  };

  const totals = calculateTotals();

  // Handle Entity Change (Recalculate PO Number)
  const handleEntityChange = (entity: "CSI" | "RMI") => {
    if (!poData) return;
    const newPONumber = generatePONumber(entity, poData.poDate);
    setPOData({
      ...poData,
      legalEntity: entity,
      poNumber: newPONumber,
    });
  };

  const handleExportPO = () => {
    if (!poData) return;

    if (!poData.eta) {
      alert("Please input Estimated Time Arrival (ETA).");
      return;
    }

    import("../utils/api").then(({ purchaseOrdersAPI }) => {
      const vendorId = vendors.find(
        (v) => v.vendorName === selectedVendor,
      )?.id;
      if (!vendorId) return;

      const readyItems = poData.items.filter(
        (i) => i.status === "Ready",
      );

      const poPayload = {
        poNumber: poData.poNumber,
        vendorId: vendorId,
        generatedDate: poData.poDate,
        totalAmount: totals.grandTotal,
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
            `PO ${poData.poNumber} generated successfully!`,
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
            <h2 className="text-gray-900 font-semibold text-lg">
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
              // --- SELECTION STEP (Unchanged) ---
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-900 text-sm">
                    <strong>Note:</strong> Items are filtered by
                    Vendor &gt; Property Type &gt; Region &gt;
                    Payment Terms.
                  </p>
                </div>
                <div className="space-y-4">
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
              // --- PREVIEW STEP (Updated) ---
              <div className="space-y-8">
                {/* Header Information */}
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <h3 className="text-gray-900 font-medium mb-4 border-b border-gray-200 pb-2">
                    Vendor Information
                  </h3>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                    <div>
                      <span className="text-xs text-gray-500 uppercase font-semibold">
                        Vendor Name
                      </span>
                      <div className="text-gray-900 font-medium">
                        {poData?.vendorName}
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 uppercase font-semibold">
                        Vendor Address
                      </span>
                      <div className="text-gray-900">
                        {poData?.vendorAddress}
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 uppercase font-semibold">
                        Vendor PIC Name
                      </span>
                      <div className="text-gray-900">
                        {poData?.vendorPIC}
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 uppercase font-semibold">
                        Legal Entity (PO Suffix)
                      </span>
                      <select
                        value={poData?.legalEntity}
                        onChange={(e) =>
                          handleEntityChange(
                            e.target.value as "CSI" | "RMI",
                          )
                        }
                        className="mt-1 block w-32 border border-gray-300 rounded-md text-sm px-2 py-1"
                      >
                        <option value="RMI">RMI</option>
                        <option value="CSI">CSI</option>
                      </select>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 uppercase font-semibold">
                        PO Number
                      </span>
                      <div className="text-gray-900 font-mono font-bold text-lg">
                        {poData?.poNumber}
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 uppercase font-semibold">
                        Payment Terms
                      </span>
                      <div className="text-gray-900">
                        {poData?.paymentTerms}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-semibold block mb-1">
                        Delivery Date (ETA){" "}
                        <span className="text-red-500">*</span>
                      </label>
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
                        className="border border-gray-300 rounded px-3 py-1 text-sm w-full max-w-[200px] focus:ring-2 focus:ring-[#ec2224]"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Table 1 - Aggregate */}
                <div>
                  <h4 className="text-gray-800 font-medium mb-2">
                    1. Item Summary (Aggregated)
                  </h4>
                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-100 text-gray-700 font-semibold">
                        <tr>
                          <th className="px-4 py-3 w-12">No</th>
                          <th className="px-4 py-3">
                            Delivery Date
                          </th>
                          <th className="px-4 py-3">
                            Item Name
                          </th>
                          <th className="px-4 py-3 text-center">
                            Qty
                          </th>
                          <th className="px-4 py-3 text-right">
                            Unit Price (IDR)
                          </th>
                          <th className="px-4 py-3 text-right">
                            Amount (IDR)
                          </th>
                          <th className="px-4 py-3 text-center w-20">
                            WHT %
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {aggregatedItems.map((item, idx) => (
                          <tr key={idx} className="bg-white">
                            <td className="px-4 py-3 text-center">
                              {idx + 1}
                            </td>
                            <td className="px-4 py-3 text-gray-600">
                              {poData?.eta || "-"}
                            </td>
                            <td className="px-4 py-3 font-medium text-gray-900">
                              {item.itemName}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {item.quantity}
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
                                item.quantity * item.unitPrice,
                              )}
                            </td>
                            <td className="px-4 py-3 text-center bg-gray-50 text-gray-500 cursor-not-allowed">
                              {item.whtPercentage}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary 1 */}
                  <div className="mt-4 flex justify-end">
                    <div className="w-80 bg-gray-50 p-4 rounded-lg space-y-2 border border-gray-200">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          Total
                        </span>
                        <span className="font-medium">
                          {formatCurrency(totals.totalAmount)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          PPN ({poData?.ppnPercentage}%)
                        </span>
                        <span className="font-medium">
                          {formatCurrency(totals.ppn)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          Service Charge (
                          {poData?.serviceChargePercentage}%)
                        </span>
                        <span className="font-medium">
                          {formatCurrency(totals.sc)}
                        </span>
                      </div>
                      {/* Requirement 2: PB1 is NOT editable */}
                      <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600">
                            PB1
                          </span>
                          {/* Display only, effectively 0 or whatever calculated */}
                          <span className="text-gray-500 text-xs bg-gray-200 px-2 py-0.5 rounded">
                            {poData?.pb1Percentage}%
                          </span>
                        </div>
                        <span className="font-medium">
                          {formatCurrency(totals.pb1)}
                        </span>
                      </div>
                      <div className="border-t border-gray-300 pt-2 flex justify-between text-base font-bold text-gray-900">
                        <span>Grand Total</span>
                        <span>
                          {formatCurrency(totals.grandTotal)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Table 2 - Breakdown */}
                <div>
                  <h4 className="text-gray-800 font-medium mb-2">
                    2. Item Breakdown (Per Request)
                  </h4>
                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="w-full text-sm text-left whitespace-nowrap">
                      <thead className="bg-gray-100 text-gray-700 font-semibold">
                        <tr>
                          <th className="px-4 py-3 w-12">No</th>
                          <th className="px-4 py-3 w-48">
                            Brand
                          </th>
                          <th className="px-4 py-3">
                            Item Name
                          </th>
                          <th className="px-4 py-3 text-center">
                            Qty
                          </th>
                          <th className="px-4 py-3 w-40">
                            PIC Number (Manual)
                          </th>
                          <th className="px-4 py-3">
                            Prop Code
                          </th>
                          <th className="px-4 py-3">
                            Prop Name
                          </th>
                          <th className="px-4 py-3">
                            Prop Address
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {poData?.items.map((item, idx) => (
                          <tr
                            key={item.id}
                            className="bg-white hover:bg-gray-50"
                          >
                            <td className="px-4 py-3 text-center">
                              {idx + 1}
                            </td>
                            <td className="px-4 py-3">
                              {/* Requirement 2: Brand must be one from the list */}
                              <select
                                value={item.brandProperty}
                                onChange={(e) => {
                                  const newItems = [
                                    ...(poData?.items || []),
                                  ];
                                  newItems[idx] = {
                                    ...item,
                                    brandProperty:
                                      e.target.value,
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
                                className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-[#ec2224]"
                              >
                                {ALLOWED_BRANDS.map((brand) => (
                                  <option
                                    key={brand}
                                    value={brand}
                                  >
                                    {brand}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-4 py-3 font-medium">
                              {item.itemName}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {item.quantity}
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                placeholder="Input PIC No"
                                value={item.picNumber}
                                onChange={(e) => {
                                  const newItems = [
                                    ...(poData?.items || []),
                                  ];
                                  newItems[idx] = {
                                    ...item,
                                    picNumber: e.target.value,
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
                                className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:border-[#ec2224] focus:outline-none"
                              />
                            </td>
                            <td className="px-4 py-3 text-gray-600">
                              {item.propertyCode}
                            </td>
                            <td
                              className="px-4 py-3 truncate max-w-[150px]"
                              title={item.propertyName}
                            >
                              {item.propertyName}
                            </td>
                            <td
                              className="px-4 py-3 truncate max-w-[200px]"
                              title={item.propertyAddress}
                            >
                              {item.propertyAddress}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary 2 */}
                  <div className="mt-3 flex justify-end">
                    <div className="bg-gray-100 px-4 py-2 rounded-md font-medium text-gray-800 text-sm">
                      Total Quantity: {totals.totalQty}
                    </div>
                  </div>
                </div>

                {/* Footer Inputs */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-6">
                    {/* Agreement Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        No Agreement
                      </label>
                      <select
                        value={poData?.agreementNumber}
                        onChange={(e) => {
                          const selected =
                            vendorAgreements?.find(
                              (a: any) =>
                                a.agreementNumber ===
                                e.target.value,
                            );
                          setPOData(
                            poData
                              ? {
                                  ...poData,
                                  agreementNumber:
                                    e.target.value,
                                  agreementDate:
                                    selected?.date || "",
                                }
                              : null,
                          );
                        }}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-[#ec2224]"
                      >
                        <option value="">
                          Select Agreement
                        </option>
                        {vendorAgreements.map(
                          (a: any, i: number) => (
                            <option
                              key={i}
                              value={
                                a.agreementNumber || `AGR-${i}`
                              }
                            >
                              {a.agreementNumber ||
                                `Agreement ${i + 1}`}
                            </option>
                          ),
                        )}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date Agreement
                      </label>
                      <input
                        type="date"
                        value={poData?.agreementDate}
                        onChange={(e) =>
                          setPOData(
                            poData
                              ? {
                                  ...poData,
                                  agreementDate: e.target.value,
                                }
                              : null,
                          )
                        }
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
                      />
                    </div>

                    {/* Quotation Inputs */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        No Quotation
                      </label>
                      <input
                        type="text"
                        placeholder="Enter Quotation Number"
                        value={poData?.quotationNumber}
                        onChange={(e) =>
                          setPOData(
                            poData
                              ? {
                                  ...poData,
                                  quotationNumber:
                                    e.target.value,
                                }
                              : null,
                          )
                        }
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-[#ec2224]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date Quotation
                      </label>
                      <input
                        type="date"
                        value={poData?.quotationDate}
                        onChange={(e) =>
                          setPOData(
                            poData
                              ? {
                                  ...poData,
                                  quotationDate: e.target.value,
                                }
                              : null,
                          )
                        }
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      />
                    </div>
                  </div>

                  {/* Note */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Note
                    </label>
                    <textarea
                      rows={3}
                      value={poData?.note}
                      onChange={(e) =>
                        setPOData(
                          poData
                            ? {
                                ...poData,
                                note: e.target.value,
                              }
                            : null,
                        )
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-[#ec2224]"
                      placeholder="Enter additional notes..."
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-500">
                    {
                      poData?.items.filter(
                        (i) => i.status === "Ready",
                      ).length
                    }{" "}
                    items ready.
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setStep("selection")}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
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