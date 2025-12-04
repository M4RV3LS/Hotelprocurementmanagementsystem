import { X } from "lucide-react";
import { useState } from "react";
import type {
  ProcurementRequest,
  ProcurementItem,
  ActivityLog,
} from "../data/mockData";
import ItemDetailSection from "./request-detail/ItemDetailSection";
import LogActivity from "./request-detail/LogActivity";
import { procurementRequestsAPI } from "../utils/api"; // Import API

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

  // Requirement 2: Function to sync log to Database
  const saveLogToDB = async (
    action: string,
    details: string,
  ) => {
    // In a real app, you would define user info from context
    const userEmail = "system@reddoorz.com";
    await procurementRequestsAPI.logActivity(
      currentRequest.prNumber,
      userEmail,
      action,
      details,
    );
  };

  const addLog = (
    req: ProcurementRequest,
    action: string,
    details: string,
  ): ProcurementRequest => {
    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
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

    if (newItem && oldItem) {
      // Requirement 2.2: Log Vendor Assignment
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

      // Requirement 2.2: Log Payment Method
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

      // Requirement 2.1: Log Status Changes
      // Only log specific statuses requested
      const loggableStatuses = [
        "Review by Procurement",
        "Waiting PO",
        "Waiting PO Approval",
        "Process by Vendor",
        "Delivered",
        "Closed",
        "Cancelled by Procurement",
      ];

      // Check if status changed or if it was auto-transitioned
      let statusChanged =
        updatedItem.status &&
        updatedItem.status !== oldItem.status;

      // Auto-Transition Logic (Existing)
      if (
        newItem.status === "Review by Procurement" &&
        newItem.vendorName &&
        (newItem.totalPrice || 0) > 0
      ) {
        // Force update for auto-transition
        nextRequest.items = nextRequest.items.map((i) =>
          i.id === itemId ? { ...i, status: "Waiting PO" } : i,
        );
        statusChanged = true;
      }

      // Final status check after potential auto-transition
      const finalItem = nextRequest.items.find(
        (i) => i.id === itemId,
      )!;
      if (
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
                <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-[#ec2224]">
                  <h3 className="text-gray-900">
                    ITEM {index + 1} OF{" "}
                    {currentRequest.items.length}
                  </h3>
                  <div className="flex items-center gap-4">
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
                  vendors={vendors}
                  requestStatus={item.status}
                  // FIXED: Passed requestPropertyType
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