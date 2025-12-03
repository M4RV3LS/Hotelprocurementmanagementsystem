import { X } from "lucide-react";
import { useState } from "react";
import type {
  ProcurementRequest,
  ProcurementItem,
  ActivityLog,
} from "../data/mockData";
// StatusStepper is removed as requested
import ItemDetailSection from "./request-detail/ItemDetailSection";
import LogActivity from "./request-detail/LogActivity";

interface RequestDetailModalProps {
  request: ProcurementRequest;
  vendors: any[];
  onClose: () => void;
  onUpdate: (request: ProcurementRequest) => void;
}

export default function RequestDetailModal({
  request,
  vendors,
  onClose,
  onUpdate,
}: RequestDetailModalProps) {
  const [currentRequest, setCurrentRequest] =
    useState<ProcurementRequest>(request);

  const addLog = (
    req: ProcurementRequest,
    action: string,
    details: string,
  ): ProcurementRequest => {
    const newLog: ActivityLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      user: "System",
      action: action,
      details: details,
    };

    return {
      ...req,
      activityLog: [...(req.activityLog || []), newLog],
    };
  };

  const handleItemUpdate = (
    itemId: string,
    updatedItem: Partial<ProcurementItem>,
  ) => {
    // 1. Update the specific item
    let nextRequest: ProcurementRequest = {
      ...currentRequest,
      items: currentRequest.items.map((item) =>
        item.id === itemId ? { ...item, ...updatedItem } : item,
      ),
    };

    // 2. Log updates and Handle Auto-Transition
    const oldItem = currentRequest.items.find(
      (i) => i.id === itemId,
    );
    const newItem = nextRequest.items.find(
      (i) => i.id === itemId,
    );

    if (newItem) {
      // Vendor Assignment Log
      if (
        updatedItem.vendorName &&
        updatedItem.vendorName !== oldItem?.vendorName
      ) {
        nextRequest = addLog(
          nextRequest,
          "Item Update",
          `Vendor "${updatedItem.vendorName}" assigned to item: ${newItem.itemName}`,
        );
      }

      // Auto-Transition Item Status to "Waiting PO"
      // Condition: Currently "Review by Procurement" AND has Vendor AND has Price > 0
      if (
        newItem.status === "Review by Procurement" &&
        newItem.vendorName &&
        (newItem.totalPrice || 0) > 0
      ) {
        // Update JUST this item's status
        nextRequest.items = nextRequest.items.map((i) =>
          i.id === itemId ? { ...i, status: "Waiting PO" } : i,
        );

        nextRequest = addLog(
          nextRequest,
          "Status Change",
          `Item "${newItem.itemName}" status updated to "Waiting PO" (Vendor & Price configured)`,
        );
      }
    }

    setCurrentRequest(nextRequest);
    onUpdate(nextRequest);
  };

  // handleStatusChange removed as manual status overrides should be rare or handled per item inside ItemDetailSection if needed.
  // The requirement was "auto transition", which is handled above.

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 flex items-center justify-between z-10">
            <h2 className="text-gray-900">
              Request Detail - PR Number:{" "}
              {currentRequest.prNumber}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Removed Top-Level Status Stepper */}

          <div className="px-8 py-6 space-y-8">
            {/* Property Information */}
            <div>
              <h3 className="text-gray-900 mb-4 border-b-2 border-[#ec2224] pb-2">
                PROPERTY INFORMATION
              </h3>
              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <span className="text-gray-600">
                      Property Name:
                    </span>{" "}
                    <div className="text-gray-900">
                      {currentRequest.propertyName}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">
                      Property Code:
                    </span>{" "}
                    <div className="text-gray-900">
                      {currentRequest.propertyCode}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">
                      Property Type:
                    </span>
                    {/* REQUIREMENT 1.3: Displaying Value from Table procurement_requests */}
                    <div className="text-gray-900 font-medium">
                      {currentRequest.propertyType}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">
                      Property Type:
                    </span>{" "}
                    <div className="text-gray-900">
                      {currentRequest.propertyType}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">
                      Brand Name:
                    </span>{" "}
                    <div className="text-gray-900">
                      {currentRequest.brandName}
                    </div>
                  </div>
                </div>
                <div className="text-gray-600 text-sm">
                  Address:
                </div>
                <div className="text-gray-900">
                  {currentRequest.propertyAddress}
                </div>
                <div className="grid grid-cols-2 gap-6 pt-3 border-t border-gray-200">
                  <div>
                    <span className="text-gray-600">
                      Requestor Name:
                    </span>{" "}
                    <div className="text-gray-900">
                      {currentRequest.requestorName}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">
                      Request Date:
                    </span>{" "}
                    <div className="text-gray-900">
                      {formatDate(currentRequest.prDate)}
                    </div>
                  </div>
                </div>
                {/* Removed Request Level Status Badge */}
              </div>
            </div>

            {/* Items */}
            {currentRequest.items.map((item, index) => (
              <div
                key={item.id}
                className="border-4 border-[#ec2224] rounded-lg p-6 bg-white"
              >
                <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-[#ec2224]">
                  <h3 className="text-gray-900">
                    ITEM {index + 1} OF{" "}
                    {currentRequest.items.length}
                  </h3>
                  <div className="flex items-center gap-4">
                    {/* Display Item Status Here */}
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium border ${
                        item.status === "Waiting PO"
                          ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                          : item.status ===
                              "On Process by Vendor"
                            ? "bg-purple-100 text-purple-800 border-purple-200"
                            : item.status === "Delivered"
                              ? "bg-green-100 text-green-800 border-green-200"
                              : "bg-amber-100 text-amber-800 border-amber-200"
                      }`}
                    >
                      {item.status}
                    </span>
                    <span className="text-sm text-gray-600">
                      Item ID: {item.id}
                    </span>
                  </div>
                </div>

                <ItemDetailSection
                  item={item}
                  vendors={vendors} // PASS IT HERE
                  requestStatus={item.status}
                  onUpdate={(updatedItem) =>
                    handleItemUpdate(item.id, updatedItem)
                  }
                />
              </div>
            ))}

            {/* Document Links (if any items have POs) */}
            {currentRequest.items.some((i) => i.poNumber) && (
              <div>
                <h3 className="text-gray-900 mb-4 border-b-2 border-[#ec2224] pb-2">
                  DOCUMENT LINKS
                </h3>
                <div className="bg-gray-50 rounded-lg p-6 space-y-2">
                  {/* Unique POs for this request */}
                  {Array.from(
                    new Set(
                      currentRequest.items
                        .map((i) => i.poNumber)
                        .filter(Boolean),
                    ),
                  ).map((poNum) => (
                    <div
                      key={poNum}
                      className="flex gap-6 items-center"
                    >
                      <span className="text-gray-600">
                        PO Number:
                      </span>
                      <span className="text-gray-900 font-medium">
                        {poNum}
                      </span>
                      <a
                        href="#"
                        className="text-[#ec2224] hover:underline"
                      >
                        View Document
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Log Activity */}
            <div>
              <h3 className="text-gray-900 mb-4 border-b-2 border-[#ec2224] pb-2">
                LOG ACTIVITY
              </h3>
              <div className="bg-gray-50 rounded-lg p-6 space-y-3">
                <LogActivity request={currentRequest} />
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-8 py-6 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}