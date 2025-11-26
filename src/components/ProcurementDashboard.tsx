//ProcurementDashboard.tsx
import { useState, useMemo } from "react";
import {
  Plus,
  Filter,
  ChevronDown,
  Search,
} from "lucide-react";
import {
  procurementRequests as initialRequests,
  type ProcurementRequest,
  type ProcurementStatus,
  type ProcurementItem,
} from "../data/mockData";
import StatusBadge from "./StatusBadge";
import RequestDetailModal from "./RequestDetailModal";
import GeneratePOModal from "./GeneratePOModalUpdated";
import InputETAForm from "./forms/InputETAForm";
import ActionButtons from "./ActionButtons";
import Toast from "./Toast";

// Status options - REMOVED "Waiting PR"
const statuses: Array<ProcurementStatus | "All"> = [
  "All",
  "Review by Procurement",
  "Waiting PO",
  "On Process by Vendor",
  "Delivered",
];

// Table row type - represents one item row (multiple items per PR)
interface TableRow {
  prNumber: string;
  propertyName: string;
  propertyCode: string;
  status: string;
  itemName: string;
  itemProperties: string;
  quantity: number;
  uom: string;
  requestDate: string;
  request: ProcurementRequest;
  item: ProcurementItem;
  isFirstItemOfPR: boolean; // For visual grouping
}

interface ProcurementDashboardProps {
  requests?: ProcurementRequest[];
  onRequestsUpdate?: (requests: ProcurementRequest[]) => void;
}

export default function ProcurementDashboard({
  requests: externalRequests,
  onRequestsUpdate,
}: ProcurementDashboardProps = {}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<
    string[]
  >([]);
  const [sortOrder, setSortOrder] = useState<
    "newest" | "oldest"
  >("newest");
  const [selectedRequest, setSelectedRequest] =
    useState<ProcurementRequest | null>(null);
  const [showStatusFilter, setShowStatusFilter] =
    useState(false);
  const [requests, setRequests] = useState(
    externalRequests || initialRequests,
  );
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [highlightedPRNumber, setHighlightedPRNumber] =
    useState<string | null>(null);
  const [showGeneratePOModal, setShowGeneratePOModal] =
    useState(false);
  const [selectedPRNumberForPO, setSelectedPRNumberForPO] =
    useState<string | null>(null);
  const [showInputETAModal, setShowInputETAModal] =
    useState(false);
  const [selectedPRNumberForETA, setSelectedPRNumberForETA] =
    useState<string | null>(null);

  // Sync with external requests when they change
  useState(() => {
    if (externalRequests) {
      setRequests(externalRequests);
    }
  });

  // Update internal state when external requests change
  if (
    externalRequests &&
    JSON.stringify(externalRequests) !==
      JSON.stringify(requests)
  ) {
    setRequests(externalRequests);
  }

  // Convert requests to table rows (one row per item)
  const tableRows = useMemo(() => {
    const rows: TableRow[] = [];

    requests.forEach((request) => {
      request.items.forEach((item, index) => {
        const properties = Object.entries(
          item.selectedProperties,
        )
          .map(([key, value]) => value)
          .join(", ");

        const itemDisplay = properties
          ? `${item.itemName} - ${properties}`
          : item.itemName;

        rows.push({
          prNumber: request.prNumber,
          propertyName: request.propertyName,
          propertyCode: request.propertyCode,
          status: request.status,
          itemName: itemDisplay,
          itemProperties: properties,
          quantity: item.quantity,
          uom: item.uom,
          requestDate: request.prDate,
          request: request,
          item: item,
          isFirstItemOfPR: index === 0,
        });
      });
    });

    return rows;
  }, [requests]);

  // Filter and sort data
  const filteredData = useMemo(() => {
    let filtered = [...tableRows];

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (row) =>
          row.prNumber.toLowerCase().includes(query) ||
          row.propertyName.toLowerCase().includes(query) ||
          row.request.requestorName
            .toLowerCase()
            .includes(query),
      );
    }

    // Apply status filter
    if (selectedStatuses.length > 0) {
      filtered = filtered.filter((row) =>
        selectedStatuses.includes(row.status),
      );
    }

    // Apply sort
    filtered.sort((a, b) => {
      const dateA = new Date(a.requestDate).getTime();
      const dateB = new Date(b.requestDate).getTime();
      return sortOrder === "newest"
        ? dateB - dateA
        : dateA - dateB;
    });

    return filtered;
  }, [searchQuery, selectedStatuses, sortOrder, tableRows]);

  const toggleStatus = (status: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status],
    );
  };

  const handleUpdateRequest = (
    updatedRequest: ProcurementRequest,
  ) => {
    const updatedRequests = requests.map((req) =>
      req.prNumber === updatedRequest.prNumber
        ? updatedRequest
        : req,
    );

    setRequests(updatedRequests);
    setSelectedRequest(updatedRequest);

    // Notify parent component if callback provided
    if (onRequestsUpdate) {
      onRequestsUpdate(updatedRequests);
    }

    // Show toast notification
    setToast({
      message: `Status updated to ${updatedRequest.status}`,
      type: "success",
    });

    // Highlight the updated rows
    setHighlightedPRNumber(updatedRequest.prNumber);
    setTimeout(() => setHighlightedPRNumber(null), 2000);

    // Auto-dismiss toast after 5 seconds
    setTimeout(() => setToast(null), 5000);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Group consecutive rows by PR number for visual styling
  const getRowGroupClass = (row: TableRow, index: number) => {
    const prevRow = index > 0 ? filteredData[index - 1] : null;
    const nextRow =
      index < filteredData.length - 1
        ? filteredData[index + 1]
        : null;

    const samePRAsPrev =
      prevRow && prevRow.prNumber === row.prNumber;
    const samePRAsNext =
      nextRow && nextRow.prNumber === row.prNumber;

    // Highlight state
    const isHighlighted = highlightedPRNumber === row.prNumber;

    let baseClass = "transition-all duration-500";

    if (isHighlighted) {
      baseClass += " bg-yellow-50";
    } else {
      baseClass += " hover:bg-gray-50";
    }

    // Add subtle background and left border for grouped rows
    if (samePRAsPrev || samePRAsNext) {
      baseClass +=
        " bg-red-50/20 border-l-4 border-l-[#ec2224]";
    }

    return baseClass;
  };

  const handleGeneratePO = (prNumber: string) => {
    setSelectedPRNumberForPO(prNumber);
    setShowGeneratePOModal(true);
  };

  const handleInputETA = (prNumber: string) => {
    setSelectedPRNumberForETA(prNumber);
    setShowInputETAModal(true);
  };

  const handleRequestsUpdate = (
    updatedRequests: ProcurementRequest[],
  ) => {
    setRequests(updatedRequests);

    // Notify parent component if callback provided
    if (onRequestsUpdate) {
      onRequestsUpdate(updatedRequests);
    }

    // Show notification
    setToast({
      message: "Requests updated successfully",
      type: "success",
    });

    setTimeout(() => setToast(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-gray-900 mb-6">
          Procurement Dashboard
        </h1>

        {/* Filter Controls */}
        <div className="flex gap-4 items-center flex-wrap justify-between">
          <div className="flex gap-4 items-center flex-wrap">
            {/* Status Filter */}
            <div className="relative">
              <button
                onClick={() =>
                  setShowStatusFilter(!showStatusFilter)
                }
                className="px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 flex items-center gap-2"
              >
                <span className="text-gray-700">Status</span>
                {selectedStatuses.length > 0 && (
                  <span className="bg-[#ec2224] text-white px-2 py-0.5 rounded-full text-sm">
                    {selectedStatuses.length}
                  </span>
                )}
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>

              {showStatusFilter && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowStatusFilter(false)}
                  />
                  <div className="absolute top-full mt-2 left-0 bg-white border border-gray-200 rounded-lg shadow-lg z-20 w-64 p-2">
                    {statuses
                      .filter((s) => s !== "All")
                      .map((status) => (
                        <label
                          key={status}
                          className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedStatuses.includes(
                              status,
                            )}
                            onChange={() =>
                              toggleStatus(status)
                            }
                            className="w-4 h-4 text-[#ec2224] border-gray-300 rounded focus:ring-[#ec2224]"
                          />
                          <span className="text-gray-700">
                            {status}
                          </span>
                        </label>
                      ))}
                  </div>
                </>
              )}
            </div>

            {/* Search Bar */}
            <div className="flex-1 min-w-[300px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by PR Number, Property Name, or Requestor"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ec2224]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortOrder}
              onChange={(e) =>
                setSortOrder(
                  e.target.value as "newest" | "oldest",
                )
              }
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#ec2224]"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>

          {/* Generate PO Button */}
          <button
            onClick={() => setShowGeneratePOModal(true)}
            className="px-6 py-2 bg-[#ec2224] text-white rounded-lg hover:bg-[#d11f21] transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Generate PO
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-gray-700">
                  PR Number
                </th>
                <th className="px-6 py-3 text-left text-gray-700">
                  Property Name
                </th>
                <th className="px-6 py-3 text-left text-gray-700">
                  Property Code
                </th>
                <th className="px-6 py-3 text-left text-gray-700">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-gray-700">
                  Item Name
                </th>
                <th className="px-6 py-3 text-left text-gray-700">
                  Quantity + UoM
                </th>
                <th className="px-6 py-3 text-left text-gray-700">
                  Request Date
                </th>
                <th className="px-6 py-3 text-right text-gray-700">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredData.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    No requests found
                  </td>
                </tr>
              ) : (
                filteredData.map((row, index) => {
                  return (
                    <tr
                      key={`${row.prNumber}-${row.item.id}`}
                      className={getRowGroupClass(row, index)}
                    >
                      <td className="px-6 py-4">
                        <span className="text-gray-900">
                          {row.prNumber}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-900">
                          {row.propertyName}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-600">
                          {row.propertyCode}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {row.itemName}
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {row.quantity} {row.uom}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-700">
                          {formatDate(row.requestDate)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <ActionButtons
                          request={row.request}
                          onViewRequest={() =>
                            setSelectedRequest(row.request)
                          }
                          onGeneratePO={() =>
                            handleGeneratePO(row.prNumber)
                          }
                          onInputETA={() =>
                            handleInputETA(row.prNumber)
                          }
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Request Detail Modal */}
      {selectedRequest && (
        <RequestDetailModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onUpdate={handleUpdateRequest}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Generate PO Modal */}
      {showGeneratePOModal && (
        <GeneratePOModal
          onClose={() => {
            setShowGeneratePOModal(false);
            setSelectedPRNumberForPO(null);
          }}
          onGenerate={(updatedRequests) => {
            // Update the requests state
            setRequests((prev) => {
              const updatedMap = new Map(
                updatedRequests.map((r) => [r.prNumber, r]),
              );
              return prev.map(
                (req) => updatedMap.get(req.prNumber) || req,
              );
            });
            setShowGeneratePOModal(false);
            setToast({
              message: "PO generated successfully!",
              type: "success",
            });
            setTimeout(() => setToast(null), 5000);
          }}
        />
      )}

      {/* Input ETA Modal */}
      {showInputETAModal && selectedPRNumberForETA && (
        <InputETAForm
          request={
            requests.find(
              (r) => r.prNumber === selectedPRNumberForETA,
            )!
          }
          onClose={() => {
            setShowInputETAModal(false);
            setSelectedPRNumberForETA(null);
          }}
          onSubmit={(startDate, endDate) => {
            // Update the request with ETA
            setRequests((prev) =>
              prev.map((req) =>
                req.prNumber === selectedPRNumberForETA
                  ? {
                      ...req,
                      status: "On Process by Vendor" as const,
                      estimatedDeliveryStart: startDate,
                      estimatedDeliveryEnd: endDate,
                    }
                  : req,
              ),
            );
            setShowInputETAModal(false);
            setSelectedPRNumberForETA(null);
            setToast({
              message: "Delivery time set successfully!",
              type: "success",
            });
            setTimeout(() => setToast(null), 5000);
          }}
        />
      )}
    </div>
  );
}