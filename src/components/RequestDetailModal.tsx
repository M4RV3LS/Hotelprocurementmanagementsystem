import { X } from "lucide-react";
import { useState } from "react";
import type {
  ProcurementRequest,
  ProcurementItem,
  ActivityLog,
} from "../data/mockData";
import ItemDetailSection from "./request-detail/ItemDetailSection";
import LogActivity from "./request-detail/LogActivity";
import { procurementRequestsAPI } from "../utils/api";

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

  // Requirement: Function to sync log to Database
  const saveLogToDB = async (
    action: string,
    details: string,
  ) => {
    // In a real app, you would define user info from context
    const userEmail = "system@reddoorz.com";
    try {
      await procurementRequestsAPI.logActivity(
        currentRequest.prNumber,
        userEmail,
        action,
        details,
      );
    } catch (error) {
      console.error("Failed to save log to DB:", error);
      // Suppress error to prevent UI blocking
    }
  };

  // FIX: Added random suffix to ensure uniqueness even if called multiple times in same millisecond
  const addLog = (
    req: ProcurementRequest,
    action: string,
    details: string,
  ): ProcurementRequest => {
    const uniqueId = `log-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

    const newLog: ActivityLog = {
      id: uniqueId,
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
    // 1. Create the next state object based on current state
    let nextRequest: ProcurementRequest = {
      ...currentRequest,
      items: currentRequest.items.map((item) =>
        item.id === itemId ? { ...item, ...updatedItem } : item,
      ),
    };

    // 2. Identify Changes for Logging
    const oldItem = currentRequest.items.find(
      (i) => i.id === itemId,
    );
    const newItem = nextRequest.items.find(
      (i) => i.id === itemId,
    );

    if (newItem && oldItem) {
      // Check 1: Vendor Assignment
      if (
        updatedItem.vendorName &&
        updatedItem.vendorName !== oldItem.vendorName
      ) {
        const details = `Assigned Vendor: ${updatedItem.vendorName}`;
        nextRequest = addLog(
          nextRequest,
          "Vendor Assignment",
          details,
        );
        saveLogToDB("Vendor Assignment", details);
      }

      // Check 2: Payment Method
      if (
        updatedItem.paymentTerms &&
        updatedItem.paymentTerms !== oldItem.paymentTerms
      ) {
        const details = `Payment Terms set to: ${updatedItem.paymentTerms}`;
        nextRequest = addLog(
          nextRequest,
          "Payment Method Update",
          details,
        );
        saveLogToDB("Payment Method Update", details);
      }

      // Check 3: Status Changes (Explicit)
      const loggableStatuses = [
        "Review by Procurement",
        "Waiting PO",
        "Waiting PO Approval",
        "Process by Vendor",
        "Delivered",
        "Closed",
        "Cancelled by Procurement",
      ];

      // Check if status explicitly changed in the update payload
      let statusChanged =
        updatedItem.status &&
        updatedItem.status !== oldItem.status;

      // Check 4: Auto-Transition Logic (Review -> Waiting PO)
      // If all conditions are met, force the status change here
      if (
        newItem.status === "Review by Procurement" &&
        newItem.vendorName &&
        (newItem.totalPrice || 0) > 0
      ) {
        // Apply auto-transition to the items in nextRequest
        nextRequest.items = nextRequest.items.map((i) =>
          i.id === itemId ? { ...i, status: "Waiting PO" } : i,
        );
        // Mark status as changed for logging purposes
        statusChanged = true;
      }

      // Final status check after potential auto-transition
      const finalItem = nextRequest.items.find(
        (i) => i.id === itemId,
      )!;

      if (
        statusChanged &&
        finalItem.status !== oldItem.status &&
        loggableStatuses.includes(finalItem.status)
      ) {
        const details = `Status changed from "${oldItem.status}" to "${finalItem.status}"`;
        nextRequest = addLog(
          nextRequest,
          "Status Change",
          details,
        );
        saveLogToDB("Status Change", details);
      }
    }

    // 3. Update State and Propagate to Parent
    setCurrentRequest(nextRequest);
    onUpdate(nextRequest);
  };

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
                    </span>{" "}
                    <div className="text-gray-900 font-medium">
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
              </div>
            </div>

            {/* Items */}
            {currentRequest.items.map((item, index) => (
              <div
                key={item.id}
                className="border-4 border-[#ec2224] rounded-lg p-6 bg-white"
              >
                {/* Header with Request Item Id */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-[#ec2224]">
                  <h3 className="text-gray-900">
                    ITEM {index + 1} OF{" "}
                    {currentRequest.items.length}
                  </h3>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600 font-medium">
                      Request Item Id:{" "}
                      <span className="font-mono text-gray-800">
                        {item.id}
                      </span>
                    </span>
                  </div>
                </div>

                <ItemDetailSection
                  item={item}
                  vendors={vendors}
                  requestStatus={item.status}
                  requestPropertyType={
                    currentRequest.propertyType
                  }
                  onUpdate={(updatedItem) =>
                    handleItemUpdate(item.id, updatedItem)
                  }
                />
              </div>
            ))}

            {/* Document Links */}
            {currentRequest.items.some((i) => i.poNumber) && (
              <div>
                <h3 className="text-gray-900 mb-4 border-b-2 border-[#ec2224] pb-2">
                  DOCUMENT LINKS
                </h3>
                <div className="bg-gray-50 rounded-lg p-6 space-y-2">
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
          {/* Footer */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-8 py-6 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}