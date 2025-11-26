// ListPO.tsx

import { useState, useMemo, useEffect } from "react";
import {
  Search,
  Download,
  Eye,
  ExternalLink,
  Trash2,
} from "lucide-react";
import {
  procurementRequests,
  type ProcurementRequest,
  type ActivityLog,
} from "../data/mockData";
import ConfirmationModal from "./configuration/ConfirmationModal";

interface ListPOProps {
  requests?: ProcurementRequest[];
  onRequestsUpdate?: (requests: ProcurementRequest[]) => void;
}

export default function ListPO({
  requests: externalRequests,
  onRequestsUpdate,
}: ListPOProps = {}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<string>("all");
  const [vendorFilter, setVendorFilter] =
    useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [deleteConfirm, setDeleteConfirm] = useState<{
    poNumber: string;
    prNumbers: string[];
    affectedRequests: ProcurementRequest[];
  } | null>(null);
  const [localRequests, setLocalRequests] = useState(
    externalRequests || procurementRequests,
  );

  // Sync with external requests when they change
  useEffect(() => {
    if (externalRequests) {
      setLocalRequests(externalRequests);
    }
  }, [externalRequests]);

  // Get only requests with PO numbers (grouped by PO)
  const purchaseOrders = useMemo(() => {
    // Group requests by PO number
    const poMap = new Map<string, ProcurementRequest[]>();

    localRequests.forEach((req) => {
      if (req.poNumber) {
        if (!poMap.has(req.poNumber)) {
          poMap.set(req.poNumber, []);
        }
        poMap.get(req.poNumber)!.push(req);
      }
    });

    // Convert to array of unique POs with their requests
    return Array.from(poMap.entries()).map(
      ([poNumber, requests]) => ({
        poNumber,
        requests,
        // Use first request for common PO data
        poDate: requests[0].poDate,
        vendorName: requests[0].vendorName,
        paymentTerms: requests[0].paymentTerms,
        status: requests[0].status,
      }),
    );
  }, [localRequests]);

  // Get unique vendor list
  const vendors = useMemo(() => {
    const uniqueVendors = new Set(
      purchaseOrders.map((po) => po.vendorName).filter(Boolean),
    );
    return Array.from(uniqueVendors).sort();
  }, [purchaseOrders]);

  // Filter and sort PO list
  const filteredAndSortedPOs = useMemo(() => {
    let filtered = [...purchaseOrders];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (po) =>
          po.poNumber?.toLowerCase().includes(query) ||
          po.requests.some((r) =>
            r.prNumber.toLowerCase().includes(query),
          ) ||
          po.vendorName?.toLowerCase().includes(query),
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (po) => po.status === statusFilter,
      );
    }

    // Vendor filter
    if (vendorFilter !== "all") {
      filtered = filtered.filter(
        (po) => po.vendorName === vendorFilter,
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (
            new Date(b.poDate || "").getTime() -
            new Date(a.poDate || "").getTime()
          );
        case "oldest":
          return (
            new Date(a.poDate || "").getTime() -
            new Date(b.poDate || "").getTime()
          );
        case "poNumber-asc":
          return (a.poNumber || "").localeCompare(
            b.poNumber || "",
          );
        case "poNumber-desc":
          return (b.poNumber || "").localeCompare(
            a.poNumber || "",
          );
        case "vendor-asc":
          return (a.vendorName || "").localeCompare(
            b.vendorName || "",
          );
        default:
          return 0;
      }
    });

    return filtered;
  }, [
    searchQuery,
    statusFilter,
    vendorFilter,
    sortBy,
    purchaseOrders,
  ]);

  const handleViewPO = (po: any) => {
    console.log("View PO:", po.poNumber);
  };

  const handleViewRelatedPR = (prNumber: string) => {
    console.log("View related PR:", prNumber);
  };

  const handleDownloadPO = (po: any) => {
    console.log("Download PO:", po.poNumber);
  };

  const handleDeletePO = (po: any) => {
    const prNumbers = po.requests.map(
      (r: ProcurementRequest) => r.prNumber,
    );
    setDeleteConfirm({
      poNumber: po.poNumber || "",
      prNumbers,
      affectedRequests: po.requests,
    });
  };

  const confirmDeletePO = () => {
    if (!deleteConfirm) return;

    const { poNumber, affectedRequests } = deleteConfirm;
    const currentTimestamp = new Date().toISOString();

    // Create activity log entry for deletion
    const generateActivityLog = (
      prNumber: string,
    ): ActivityLog => ({
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: currentTimestamp,
      user: "System",
      action: "PO Deleted",
      details: `PO ${poNumber} was deleted. Status reverted from "On Process by Vendor" to "Waiting PO". All items reset to "Not Set" status.`,
    });

    // Update all requests that were part of this PO
    const updatedRequests = localRequests.map((req) => {
      // Check if this request was part of the deleted PO
      const wasInDeletedPO = affectedRequests.some(
        (ar) => ar.prNumber === req.prNumber,
      );

      if (wasInDeletedPO && req.poNumber === poNumber) {
        // Revert all items' itemStatus to "Not Set"
        const revertedItems = req.items.map((item) => ({
          ...item,
          itemStatus: "Not Set" as const,
        }));

        // Get existing activity log or initialize empty array
        const existingLog = req.activityLog || [];

        // Add new activity log entry
        const newActivityLog = generateActivityLog(
          req.prNumber,
        );

        // Return updated request
        return {
          ...req,
          status: "Waiting PO" as const,
          poNumber: undefined,
          poDate: undefined,
          poFileLink: undefined,
          estimatedDeliveryStart: undefined,
          estimatedDeliveryEnd: undefined,
          items: revertedItems,
          activityLog: [...existingLog, newActivityLog],
        };
      }
      return req;
    });

    // Update local state
    setLocalRequests(updatedRequests);

    // Notify parent component
    if (onRequestsUpdate) {
      onRequestsUpdate(updatedRequests);
    }

    // Get list of affected PR numbers for user feedback
    const affectedPRs = affectedRequests
      .map((r) => r.prNumber)
      .join(", ");

    // Show success message
    alert(
      `PO ${poNumber} has been deleted successfully.\n\n` +
        `Affected PRs: ${affectedPRs}\n\n` +
        `All items have been reverted to "Waiting PO" status with "Not Set" item status.\n` +
        `Activity has been logged for all affected requests.`,
    );

    // Close confirmation modal
    setDeleteConfirm(null);
  };

  const formatDate = (date?: string) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const calculateTotalAmount = (po: any) => {
    return po.requests.reduce(
      (sum: number, req: ProcurementRequest) => {
        return (
          sum +
          req.items.reduce(
            (itemSum, item) => itemSum + (item.totalPrice || 0),
            0,
          )
        );
      },
      0,
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getPOStatus = (po: any) => {
    const allItems = po.requests.flatMap(
      (r: ProcurementRequest) => r.items,
    );
    const allCancelled = allItems.every(
      (item) => item.itemStatus === "Cancelled",
    );
    const allReady = allItems.every(
      (item) => item.itemStatus === "Ready",
    );

    if (allCancelled) return "Cancelled";
    if (allReady && po.status === "Delivered") return "Closed";
    return "Outstanding";
  };

  const getPOStatusBadge = (status: string) => {
    const colors = {
      Outstanding: "bg-amber-100 text-amber-800",
      Closed: "bg-green-100 text-green-800",
      Cancelled: "bg-red-100 text-red-800",
    };
    return (
      colors[status as keyof typeof colors] ||
      "bg-gray-100 text-gray-800"
    );
  };

  const getPRNumbersDisplay = (
    requests: ProcurementRequest[],
  ) => {
    const prNumbers = requests.map((r) => r.prNumber);
    if (prNumbers.length === 1) {
      return prNumbers[0];
    }
    return `${prNumbers[0]} +${prNumbers.length - 1} more`;
  };

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Purchase Order List
        </h1>
        <p className="text-gray-600">
          View and manage all purchase orders
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex gap-4 items-center flex-wrap">
          {/* Search Bar */}
          <div className="flex-1 min-w-[300px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by PO Number, PR Number, or Vendor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ec2224]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            )}
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#ec2224]"
          >
            <option value="all">All Statuses</option>
            <option value="On Process by Vendor">
              On Process by Vendor
            </option>
            <option value="Delivered">Delivered</option>
          </select>

          {/* Vendor Filter */}
          <select
            value={vendorFilter}
            onChange={(e) => setVendorFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#ec2224]"
          >
            <option value="all">All Vendors</option>
            {vendors.map((vendor) => (
              <option key={vendor} value={vendor}>
                {vendor}
              </option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#ec2224]"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="poNumber-asc">
              PO Number (A-Z)
            </option>
            <option value="poNumber-desc">
              PO Number (Z-A)
            </option>
            <option value="vendor-asc">
              Vendor Name (A-Z)
            </option>
          </select>
        </div>
      </div>

      {/* PO Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
                PO Number
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
                PR Number(s)
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
                PO Date Created
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
                Vendor Name
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
                Payment Terms
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
                PO Status
              </th>
              <th className="px-6 py-4 text-right text-sm font-medium text-gray-700">
                Total Amount
              </th>
              <th className="px-6 py-4 text-right text-sm font-medium text-gray-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredAndSortedPOs.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-6 py-12 text-center"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="text-4xl text-gray-400">
                      📄
                    </div>
                    <div className="text-lg font-medium text-gray-700">
                      No Purchase Orders Found
                    </div>
                    <div className="text-gray-500 text-sm">
                      There are no POs matching your search or
                      filter criteria.
                    </div>
                    {(searchQuery ||
                      statusFilter !== "all" ||
                      vendorFilter !== "all") && (
                      <button
                        onClick={() => {
                          setSearchQuery("");
                          setStatusFilter("all");
                          setVendorFilter("all");
                        }}
                        className="px-4 py-2 text-[#ec2224] hover:bg-red-50 rounded-lg transition-colors"
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredAndSortedPOs.map((po) => (
                <tr
                  key={po.poNumber}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <span className="font-medium text-gray-900">
                      {po.poNumber}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      {po.requests.map(
                        (
                          req: ProcurementRequest,
                          idx: number,
                        ) => (
                          <button
                            key={req.prNumber}
                            onClick={() =>
                              handleViewRelatedPR(req.prNumber)
                            }
                            className="text-[#ec2224] hover:underline flex items-center gap-1 text-sm"
                          >
                            {req.prNumber}
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        ),
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    {formatDate(po.poDate)}
                  </td>
                  <td className="px-6 py-4 text-gray-900">
                    {po.vendorName}
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    {po.paymentTerms || "-"}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getPOStatusBadge(getPOStatus(po))}`}
                    >
                      {getPOStatus(po)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-gray-900">
                    {formatCurrency(calculateTotalAmount(po))}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end items-center gap-2">
                      <button
                        onClick={() => handleViewPO(po)}
                        className="px-3 py-2 text-[#ec2224] hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2 text-sm"
                        title="View PO"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                      <button
                        onClick={() => handleDownloadPO(po)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Download PO"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePO(po)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete PO"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Results Count */}
      {filteredAndSortedPOs.length > 0 && (
        <div className="mt-4 text-sm text-gray-600">
          Showing {filteredAndSortedPOs.length} of{" "}
          {purchaseOrders.length} purchase orders
        </div>
      )}

      {/* Confirmation Modal */}
      {deleteConfirm && (
        <ConfirmationModal
          title="Delete Purchase Order?"
          message={
            `Are you sure you want to delete PO ${deleteConfirm.poNumber}?\n\n` +
            `This will affect the following PR(s):\n${deleteConfirm.prNumbers.join(", ")}\n\n` +
            `All affected items will be:\n` +
            `• Reverted from "On Process by Vendor" to "Waiting PO" status\n` +
            `• Item status reset to "Not Set"\n` +
            `• Activity logged in each request\n\n` +
            `This action cannot be undone.`
          }
          confirmLabel="Delete PO"
          confirmStyle="danger"
          onConfirm={confirmDeletePO}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}