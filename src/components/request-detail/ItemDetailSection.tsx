import { useState, useMemo, useEffect } from "react";
import {
  FileText,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import type {
  ProcurementItem,
  PaymentTerms,
  PropertyType,
} from "../../data/mockData";

interface ItemDetailSectionProps {
  item: ProcurementItem;
  requestStatus: string;
  requestPropertyType: PropertyType;
  vendors: any[];
  onUpdate: (updatedItem: Partial<ProcurementItem>) => void;
}

export default function ItemDetailSection({
  item,
  requestStatus,
  requestPropertyType,
  vendors,
  onUpdate,
}: ItemDetailSectionProps) {
  // --- State for Confirmation Flow (Review by Procurement) ---
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState(item.paymentTerms || "");
  const [manualUnitPrice, setManualUnitPrice] = useState(
    item.unitPrice?.toString() || "",
  );

  // State for general editing (other statuses)
  const [isEditingPrice, setIsEditingPrice] = useState(false);

  // --- Derived Data ---
  // Find the assigned vendor object from the full vendors list
  const assignedVendorData = useMemo(() => {
    if (!item.vendorName) return null;
    return vendors.find(
      (v) =>
        v.vendorName === item.vendorName ||
        v.vendorCode === item.vendorCode,
    );
  }, [vendors, item.vendorName, item.vendorCode]);

  // Find the specific item in that vendor's catalog to check pricing type
  const catalogItem = useMemo(() => {
    if (!assignedVendorData?.items) return null;
    return assignedVendorData.items.find(
      (vi: any) => vi.itemCode === item.itemCode,
    );
  }, [assignedVendorData, item.itemCode]);

  // Determine if Fixed Price based on Catalog
  // We check for 'Fixed' (case insensitive) as per requirement context
  const isCatalogFixedPrice =
    catalogItem?.priceType?.toLowerCase() === "fixed";

  // Available Payment Methods for the assigned vendor
  const availablePaymentMethods =
    assignedVendorData?.paymentMethods || [];

  // Initialize state when item changes
  useEffect(() => {
    setSelectedPaymentMethod(item.paymentTerms || "");

    // If fixed price, ensure we use the catalog price
    if (isCatalogFixedPrice && catalogItem?.unitPrice) {
      setManualUnitPrice(catalogItem.unitPrice.toString());
    } else {
      setManualUnitPrice(item.unitPrice?.toString() || "");
    }
  }, [item, isCatalogFixedPrice, catalogItem]);

  const getItemStatusBadge = (itemStatus: string) => {
    const colors = {
      "Not Set": "bg-gray-100 text-gray-800",
      Cancelled: "bg-red-100 text-red-800",
      Ready: "bg-green-100 text-green-800",
    };
    return (
      colors[itemStatus as keyof typeof colors] ||
      "bg-gray-100 text-gray-800"
    );
  };

  // --- Handlers ---

  // Action: Confirm & Move to Waiting PO (For "Review by Procurement")
  const handleConfirmReview = () => {
    if (!assignedVendorData) return;

    const unitPrice = parseFloat(manualUnitPrice) || 0;

    // Requirement Update: Total is strictly Quantity * Unit Price
    // Tax is effectively 0 or included in the unit price input for this calculation
    const taxRate = 0;
    const taxAmount = 0;
    const totalPrice = item.quantity * unitPrice;

    onUpdate({
      paymentTerms: selectedPaymentMethod as PaymentTerms,
      unitPrice,
      taxPercentage: taxRate,
      taxAmount,
      totalPrice,
      status: "Waiting PO",
      itemStatus: "Ready",
      isFixedPrice: isCatalogFixedPrice,
    });
  };

  // Action: Simple Price Update (For other statuses)
  const handleManualPriceUpdate = () => {
    const unitPrice = parseFloat(manualUnitPrice) || 0;
    // Keeping logic consistent: If manual update, strict multiplication
    const taxPercentage = 0;
    const taxAmount = 0;
    const totalPrice = item.quantity * unitPrice;

    onUpdate({
      unitPrice,
      taxAmount,
      totalPrice,
    });
    setIsEditingPrice(false);
  };

  // Helper flags
  const isReviewByProcurement =
    requestStatus === "Review by Procurement";

  // Validation for Confirmation Button
  const canConfirm =
    selectedPaymentMethod !== "" &&
    manualUnitPrice !== "" &&
    parseFloat(manualUnitPrice) > 0;

  const shouldShowPO = [
    "Waiting PO Approval",
    "Process by Vendor",
    "Delivered",
  ].includes(item.status);

  return (
    <div className="space-y-6">
      {/* --- Section 1: General Item Details --- */}
      <div>
        <h4 className="text-gray-900 mb-3 border-b border-gray-300 pb-2">
          ITEM DETAILS
        </h4>
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div className="flex gap-6">
            <span className="text-gray-600 w-48">
              Item Name:
            </span>
            <span className="text-gray-900 font-medium text-lg">
              {item.itemName}
            </span>
          </div>

          {shouldShowPO && item.poNumber && (
            <div className="flex gap-6 items-center bg-blue-50 p-2 rounded-md -mx-2 px-4 border border-blue-100">
              <span className="text-blue-800 font-semibold w-48 flex items-center gap-2">
                <FileText className="w-4 h-4" /> Linked PO:
              </span>
              <span className="text-blue-900 font-bold font-mono">
                {item.poNumber}
              </span>
            </div>
          )}

          <div className="flex gap-6">
            <span className="text-gray-600 w-48">Region:</span>
            <span className="text-gray-900 font-medium">
              {item.region}
            </span>
          </div>

          <div className="flex gap-6 items-center">
            <span className="text-gray-600 w-48">
              Item Status:
            </span>
            <span
              className={`px-3 py-1 rounded-full text-sm ${getItemStatusBadge(item.itemStatus || "Not Set")}`}
            >
              {item.itemStatus || "Not Set"}
            </span>
          </div>

          <div className="flex gap-6">
            <span className="text-gray-600 w-48">
              Quantity:
            </span>
            <span className="text-gray-900">
              {item.quantity}
            </span>
          </div>
        </div>
      </div>

      {/* --- Section 2: Review & Confirmation (Only for Review by Procurement) --- */}
      {isReviewByProcurement ? (
        <div className="border-2 border-[#ec2224] rounded-lg p-6 bg-red-50/10">
          <h4 className="text-[#ec2224] font-bold mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            CONFIRM REQUEST DETAILS
          </h4>

          <div className="space-y-6">
            {/* 2.1 Vendor (Read Only) */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <label className="block text-gray-500 text-xs uppercase font-bold mb-2">
                Assigned Vendor (Pre-determined)
              </label>
              <div className="text-gray-900 font-medium text-lg">
                {item.vendorName || "No Vendor Assigned"}
              </div>
              <div className="text-gray-500 text-sm">
                {item.vendorCode}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 2.2 Payment Method (Editable) */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Select Payment Method{" "}
                  <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {availablePaymentMethods.length > 0 ? (
                    availablePaymentMethods.map(
                      (method: string) => (
                        <label
                          key={method}
                          className={`flex items-center gap-3 px-4 py-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedPaymentMethod === method
                              ? "border-[#ec2224] bg-red-50"
                              : "border-gray-300 bg-white hover:bg-gray-50"
                          }`}
                        >
                          <input
                            type="radio"
                            name={`paymentTerms-${item.id}`}
                            value={method}
                            checked={
                              selectedPaymentMethod === method
                            }
                            onChange={(e) =>
                              setSelectedPaymentMethod(
                                e.target.value,
                              )
                            }
                            className="w-4 h-4 text-[#ec2224] border-gray-300 focus:ring-[#ec2224]"
                          />
                          <span className="text-gray-900">
                            {method}
                          </span>
                        </label>
                      ),
                    )
                  ) : (
                    <div className="text-red-500 text-sm flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      No payment methods found for this vendor.
                    </div>
                  )}
                </div>
              </div>

              {/* 2.3 Unit Price (Conditional) */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Unit Price{" "}
                  <span className="text-red-500">*</span>
                </label>

                {isCatalogFixedPrice ? (
                  // FIXED PRICE MODE
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-blue-800 font-semibold">
                        Fixed Price
                      </span>
                      <span className="text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded">
                        Auto-Filled
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      Rp{" "}
                      {parseFloat(
                        manualUnitPrice || "0",
                      ).toLocaleString()}
                    </div>
                    <p className="text-xs text-blue-600 mt-2">
                      Price is determined by vendor agreement.
                    </p>
                  </div>
                ) : (
                  // MANUAL PRICE MODE
                  <div className="bg-white border border-gray-300 rounded-lg p-4 focus-within:ring-2 focus-within:ring-[#ec2224] focus-within:border-[#ec2224]">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-gray-500">Rp</span>
                      <input
                        type="number"
                        value={manualUnitPrice}
                        onChange={(e) =>
                          setManualUnitPrice(e.target.value)
                        }
                        className="w-full text-xl font-bold text-gray-900 focus:outline-none"
                        placeholder="0"
                        min="1"
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      Enter the agreed unit price manually.
                    </p>
                  </div>
                )}

                {/* Total Calculation Preview */}
                {manualUnitPrice && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Quantity:</span>
                      <span>{item.quantity}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Unit Price:</span>
                      <span>
                        Rp{" "}
                        {parseFloat(
                          manualUnitPrice,
                        ).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between font-bold text-gray-900 text-lg mt-2">
                      <span>Total (Est.):</span>
                      <span>
                        {/* Requirement Update: Only Count Qty * Inputted Price */}
                        Rp{" "}
                        {(
                          item.quantity *
                          parseFloat(manualUnitPrice)
                        ).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={handleConfirmReview}
                disabled={!canConfirm}
                className="px-6 py-3 bg-[#ec2224] text-white font-medium rounded-lg hover:bg-[#d11f21] transition-all disabled:bg-gray-300 disabled:cursor-not-allowed shadow-sm flex items-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                Confirm & Move to Waiting PO
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* --- Section 3: Read Only / Standard Edit View (For other statuses) --- */
        <>
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-gray-300 pb-2">
              <h4 className="text-gray-900">
                VENDOR INFORMATION
              </h4>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex gap-6">
                <span className="text-gray-600 w-48">
                  Vendor Name:
                </span>
                <span className="text-gray-900">
                  {item.vendorName}
                </span>
              </div>
              {item.vendorCode && (
                <div className="flex gap-6">
                  <span className="text-gray-600 w-48">
                    Vendor Code:
                  </span>
                  <span className="text-gray-900">
                    {item.vendorCode}
                  </span>
                </div>
              )}
              {item.paymentTerms && (
                <div className="flex gap-6">
                  <span className="text-gray-600 w-48">
                    Payment Terms:
                  </span>
                  <span className="text-gray-900">
                    {item.paymentTerms}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div>
            <h4 className="text-gray-900 mb-3 border-b border-gray-300 pb-2">
              PRICING INFORMATION
            </h4>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              {item.isFixedPrice ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                  <div className="text-sm text-blue-700 flex items-center gap-2">
                    <span>🔒</span>
                    <span>
                      Fixed Price (Auto-fetched from Vendor
                      Agreement)
                    </span>
                  </div>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                  <div className="text-sm text-green-700 flex items-center gap-2">
                    <span>✓</span>
                    <span>Manual Pricing Set</span>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="text-gray-600">
                  Unit Price:
                </span>
                {isEditingPrice ? (
                  <input
                    type="number"
                    value={manualUnitPrice}
                    onChange={(e) =>
                      setManualUnitPrice(e.target.value)
                    }
                    className="px-3 py-1 border border-gray-300 rounded-lg text-right w-48"
                    placeholder="0"
                  />
                ) : (
                  <span className="text-gray-900">
                    Rp {item.unitPrice?.toLocaleString()}
                  </span>
                )}
              </div>

              <div className="border-t border-gray-300 pt-3 flex justify-between">
                <span className="text-gray-900 font-medium">
                  Total Price:
                </span>
                <span className="text-gray-900 font-medium">
                  Rp {(item.totalPrice || 0).toLocaleString()}
                </span>
              </div>

              {/* Allow editing price if NOT fixed and NOT in 'Review by Procurement' (covered above) */}
              {!isEditingPrice &&
                !item.isFixedPrice &&
                requestStatus !== "Review by Procurement" && (
                  <button
                    onClick={() => {
                      setManualUnitPrice(
                        item.unitPrice?.toString() || "",
                      );
                      setIsEditingPrice(true);
                    }}
                    className="w-full mt-3 px-4 py-2 border border-[#ec2224] text-[#ec2224] rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Edit Pricing
                  </button>
                )}

              {isEditingPrice && (
                <div className="flex gap-3 mt-3">
                  <button
                    onClick={() => setIsEditingPrice(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleManualPriceUpdate}
                    className="flex-1 px-4 py-2 bg-[#ec2224] text-white rounded-lg hover:bg-[#d11f21] transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}