import { useState, useMemo, useEffect } from "react";
import {
  Plus,
  ChevronDown,
  Search,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
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
import RejectRequestModal from "./modals/RejectRequestModal";
import { purchaseOrdersAPI } from "../utils/api";

const ITEMS_PER_PAGE = 10;

// Requirement 1: Added "Cancelled by Procurement" to filters
const statuses: Array<ProcurementStatus | "All"> = [
  "All",
  "Review by Procurement",
  "Waiting PO",
  "Waiting PO Approval",
  "Process by Vendor",
  "Delivered",
  "Cancelled by Procurement",
];

const propertyTypes = [
  "All",
  "Leasing",
  "Franchise",
  "Management",
];

// ... [Rest of the file remains unchanged] ...
// (Include the rest of the interfaces and component logic exactly as they were,
// just ensure the 'statuses' array above is updated)

interface TableRow {
  prNumber: string;
  propertyName: string;
  propertyCode: string;
  propertyType: string;
  status: string;
  itemName: string;
  quantity: number;
  uom: string;
  requestDate: string;
  request: ProcurementRequest;
  item: ProcurementItem;
  isFirstItemOfPR: boolean;
}

interface ProcurementDashboardProps {
  requests?: ProcurementRequest[];
  vendors?: any[];
  onRequestsUpdate?: (requests: ProcurementRequest[]) => void;
}

export default function ProcurementDashboard({
  requests: externalRequests,
  vendors: externalVendors = [],
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
    externalRequests || [],
  );

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [highlightedPRNumber, setHighlightedPRNumber] =
    useState<string | null>(null);

  // Modals
  const [showGeneratePOModal, setShowGeneratePOModal] =
    useState(false);
  const [selectedPRNumberForPO, setSelectedPRNumberForPO] =
    useState<string | null>(null);
  const [showInputETAModal, setShowInputETAModal] =
    useState(false);
  const [selectedPRNumberForETA, setSelectedPRNumberForETA] =
    useState<string | null>(null);
  const [selectedPropertyType, setSelectedPropertyType] =
    useState("All");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Reject Modal State
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectItemTarget, setRejectItemTarget] = useState<{
    itemId: string;
    prNumber: string;
  } | null>(null);
  const [isRejecting, setIsRejecting] = useState(false);

  useEffect(() => {
    if (externalRequests) {
      setRequests(externalRequests);
    }
  }, [externalRequests]);

  // Convert requests to table rows based on ITEMS
  const tableRows = useMemo(() => {
    const rows: TableRow[] = [];
    requests.forEach((request) => {
      request.items.forEach((item, index) => {
        const itemDisplay = item.itemName;
        rows.push({
          prNumber: request.prNumber,
          propertyName: request.propertyName,
          propertyCode: request.propertyCode,
          propertyType: request.propertyType,
          status: item.status,
          itemName: itemDisplay,
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

  const filteredData = useMemo(() => {
    // Start by filtering out "Pending Approval" items (Requirement 1)
    let filtered = tableRows.filter(
      (row) => row.status !== "Pending Approval",
    );

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

    if (selectedStatuses.length > 0) {
      filtered = filtered.filter((row) =>
        selectedStatuses.includes(row.status),
      );
    }

    if (selectedPropertyType !== "All") {
      filtered = filtered.filter(
        (row) => row.propertyType === selectedPropertyType,
      );
    }

    filtered.sort((a, b) => {
      const dateA = new Date(a.requestDate).getTime();
      const dateB = new Date(b.requestDate).getTime();
      return sortOrder === "newest"
        ? dateB - dateA
        : dateA - dateB;
    });

    return filtered;
  }, [
    searchQuery,
    selectedStatuses,
    selectedPropertyType,
    sortOrder,
    tableRows,
  ]);

  // Pagination Logic
  const totalPages = Math.ceil(
    filteredData.length / ITEMS_PER_PAGE,
  );
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredData.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredData, currentPage]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const toggleStatus = (status: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status],
    );
  };

  // Reject Logic
  const initiateReject = (item: ProcurementItem) => {
    setRejectItemTarget({
      itemId: item.id,
      prNumber: item.prNumber,
    });
    setShowRejectModal(true);
  };

  const confirmReject = async (
    reason: string,
    file: File | null,
  ) => {
    if (!rejectItemTarget) return;
    setIsRejecting(true);
    try {
      await purchaseOrdersAPI.rejectItem(
        rejectItemTarget.itemId,
        "",
        rejectItemTarget.prNumber,
        reason,
        file,
      );

      // Local Update
      const updatedRequests = requests.map((req) => ({
        ...req,
        items: req.items.map((item) =>
          item.id === rejectItemTarget.itemId
            ? {
                ...item,
                status: "Cancelled by Procurement" as const,
              }
            : item,
        ),
      }));

      if (onRequestsUpdate) onRequestsUpdate(updatedRequests);
      setRequests(updatedRequests);

      setShowRejectModal(false);
      setToast({
        message: "Item rejected successfully",
        type: "success",
      });
    } catch (error) {
      console.error(error);
      alert("Failed to reject item");
    } finally {
      setIsRejecting(false);
      setRejectItemTarget(null);
    }
  };

  const propagateUpdates = (
    updatedRequests: ProcurementRequest[],
  ) => {
    setRequests(updatedRequests);
    if (onRequestsUpdate) {
      onRequestsUpdate(updatedRequests);
    }
  };

  const handleUpdateRequest = (
    updatedRequest: ProcurementRequest,
  ) => {
    const updatedRequests = requests.map((req) =>
      req.prNumber === updatedRequest.prNumber
        ? updatedRequest
        : req,
    );

    propagateUpdates(updatedRequests);
    setSelectedRequest(updatedRequest);

    setToast({
      message: `Request updated successfully`,
      type: "success",
    });
    setHighlightedPRNumber(updatedRequest.prNumber);
    setTimeout(() => setHighlightedPRNumber(null), 2000);
    setTimeout(() => setToast(null), 5000);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getRowGroupClass = (row: TableRow, index: number) => {
    const prevRow = index > 0 ? paginatedData[index - 1] : null;
    const nextRow =
      index < paginatedData.length - 1
        ? paginatedData[index + 1]
        : null;

    const samePRAsPrev =
      prevRow && prevRow.prNumber === row.prNumber;
    const samePRAsNext =
      nextRow && nextRow.prNumber === row.prNumber;
    const isHighlighted = highlightedPRNumber === row.prNumber;

    let baseClass = "transition-all duration-500";
    if (isHighlighted) {
      baseClass += " bg-yellow-50";
    } else {
      baseClass += " hover:bg-gray-50";
    }
    if (samePRAsPrev || samePRAsNext) {
      baseClass +=
        " bg-red-50/20 border-l-4 border-l-[#ec2224]";
    }
    return baseClass;
  };

  const handleInputETA = (prNumber: string) => {
    setSelectedPRNumberForETA(prNumber);
    setShowInputETAModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Filters Section */}
      <div>
        <h1 className="text-gray-900 mb-6">
          Procurement Dashboard
        </h1>
        <div className="flex gap-4 items-center flex-wrap justify-between">
          <div className="flex gap-4 items-center flex-wrap">
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

            <select
              value={selectedPropertyType}
              onChange={(e) =>
                setSelectedPropertyType(e.target.value)
              }
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#ec2224]"
            >
              {propertyTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>

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

          <button
            onClick={() => setShowGeneratePOModal(true)}
            className="px-6 py-2 bg-[#ec2224] text-white rounded-lg hover:bg-[#d11f21] transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Generate PO
          </button>
        </div>
      </div>

      {/* Data Table and other components remain unchanged */}
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
              {paginatedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    No requests found
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, index) => {
                  const canReject = [
                    "Review by Procurement",
                    "Waiting PO",
                    "Waiting PO Approval",
                  ].includes(row.status);

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
                        <StatusBadge
                          status={row.status as any}
                        />
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
                        <div className="flex justify-end items-center gap-2">
                          <ActionButtons
                            request={row.request}
                            onViewRequest={() =>
                              setSelectedRequest(row.request)
                            }
                            onInputETA={() =>
                              handleInputETA(row.prNumber)
                            }
                          />
                          {canReject && (
                            <button
                              onClick={() =>
                                initiateReject(row.item)
                              }
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200"
                              title="Reject Request"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Logic... */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing{" "}
            {paginatedData.length === 0
              ? 0
              : (currentPage - 1) * ITEMS_PER_PAGE + 1}{" "}
            to{" "}
            {Math.min(
              currentPage * ITEMS_PER_PAGE,
              filteredData.length,
            )}{" "}
            of {filteredData.length} entries
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-md border border-gray-300 bg-white text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from(
              { length: Math.min(5, totalPages) },
              (_, i) => {
                let pageNum = i + 1;
                if (totalPages > 5 && currentPage > 3) {
                  pageNum = currentPage - 2 + i;
                  if (pageNum > totalPages)
                    pageNum = totalPages - (4 - i);
                }
                if (pageNum > 0) {
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-1 text-sm rounded-md border ${
                        currentPage === pageNum
                          ? "bg-[#ec2224] text-white border-[#ec2224]"
                          : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                }
                return null;
              },
            )}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-md border border-gray-300 bg-white text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {selectedRequest && (
        <RequestDetailModal
          request={selectedRequest}
          vendors={externalVendors}
          onClose={() => setSelectedRequest(null)}
          onUpdate={handleUpdateRequest}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {showGeneratePOModal && (
        <GeneratePOModal
          onClose={() => {
            setShowGeneratePOModal(false);
            setSelectedPRNumberForPO(null);
          }}
          vendors={externalVendors}
          requests={requests}
          onGenerate={(updatedRequests) => {
            const updatedMap = new Map(
              updatedRequests.map((r) => [r.prNumber, r]),
            );
            const newRequests = requests.map(
              (req) => updatedMap.get(req.prNumber) || req,
            );
            propagateUpdates(newRequests);
            setShowGeneratePOModal(false);
            setToast({
              message: "PO generated successfully!",
              type: "success",
            });
            setTimeout(() => setToast(null), 5000);
          }}
        />
      )}

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
          onSubmit={(updatedRequest) => {
            const processedItems = updatedRequest.items.map(
              (item) => {
                if (
                  item.status === "Waiting PO" ||
                  item.poNumber
                ) {
                  return {
                    ...item,
                    status: "On Process by Vendor" as const,
                  };
                }
                return item;
              },
            );
            const finalRequest = {
              ...updatedRequest,
              items: processedItems,
            };
            const newRequests = requests.map((req) =>
              req.prNumber === selectedPRNumberForETA
                ? finalRequest
                : req,
            );
            propagateUpdates(newRequests);
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

      {showRejectModal && (
        <RejectRequestModal
          onClose={() => setShowRejectModal(false)}
          onConfirm={confirmReject}
          isLoading={isRejecting}
        />
      )}
    </div>
  );
}