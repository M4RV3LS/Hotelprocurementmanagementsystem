// src/components/ListPO.tsx

import { useState, useMemo, useEffect } from "react";
import {
  Search,
  Download,
  Eye,
  ExternalLink,
  Trash2,
} from "lucide-react";
import {
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
  const [localRequests, setLocalRequests] =
    useState(externalRequests);

  useEffect(() => {
    if (externalRequests) {
      setLocalRequests(externalRequests);
    }
  }, [externalRequests]);

  // GROUP BY PO NUMBER (Scanning Items)
  const purchaseOrders = useMemo(() => {
    const poMap = new Map<
      string,
      {
        poNumber: string;
        poDate?: string;
        vendorName?: string;
        paymentTerms?: string;
        status: string; // Derived status for the PO group
        items: any[]; // Flattened list of items in this PO
        prNumbers: Set<string>;
        totalAmount: number;
      }
    >();

    localRequests.forEach((req) => {
      req.items.forEach((item) => {
        // STRICT FILTER: Only include items that have a PO Number AND are NOT in "Waiting PO" status
        if (
          item.poNumber &&
          item.status !== "Waiting PO" &&
          item.status !== "Review by Procurement"
        ) {
          if (!poMap.has(item.poNumber)) {
            poMap.set(item.poNumber, {
              poNumber: item.poNumber,
              poDate: item.poDate,
              vendorName: item.vendorName,
              paymentTerms: item.paymentTerms,
              status: item.status, // Initial status from first item found
              items: [],
              prNumbers: new Set(),
              totalAmount: 0,
            });
          }

          const poGroup = poMap.get(item.poNumber)!;
          poGroup.items.push(item);
          poGroup.prNumbers.add(req.prNumber);
          poGroup.totalAmount += item.totalPrice || 0;

          // Logic to determine "Overall PO Status"
          // If any item is 'Delivered', and others are 'On Process', what is the PO status?
          // Usually PO status reflects the lowest common denominator or specific logic.
          // Here we simply take the status of the items (assuming they move together or using the last one).
          poGroup.status = item.status;
        }
      });
    });

    return Array.from(poMap.values());
  }, [localRequests]);

  // Get unique vendor list from the generated POs
  const vendors = useMemo(() => {
    const uniqueVendors = new Set(
      purchaseOrders.map((po) => po.vendorName).filter(Boolean),
    );
    return Array.from(uniqueVendors).sort() as string[];
  }, [purchaseOrders]);

  // Filter and sort PO list
  const filteredAndSortedPOs = useMemo(() => {
    let filtered = [...purchaseOrders];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (po) =>
          po.poNumber.toLowerCase().includes(query) ||
          Array.from(po.prNumbers).some((pr) =>
            pr.toLowerCase().includes(query),
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
          return a.poNumber.localeCompare(b.poNumber);
        case "poNumber-desc":
          return b.poNumber.localeCompare(a.poNumber);
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

  const handleDownloadPO = (po: any) => {
    console.log("Download PO:", po.poNumber);
  };

  const handleDeletePO = (po: any) => {
    const prNumbersArray = Array.from(po.prNumbers) as string[];
    // Find requests involved to pass to confirmation
    const affectedRequests = localRequests.filter((r) =>
      prNumbersArray.includes(r.prNumber),
    );

    setDeleteConfirm({
      poNumber: po.poNumber,
      prNumbers: prNumbersArray,
      affectedRequests: affectedRequests,
    });
  };

  const confirmDeletePO = () => {
    if (!deleteConfirm) return;

    const { poNumber, affectedRequests } = deleteConfirm;
    const currentTimestamp = new Date().toISOString();

    const generateActivityLog = (
      prNumber: string,
    ): ActivityLog => ({
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: currentTimestamp,
      user: "System",
      action: "PO Deleted",
      details: `PO ${poNumber} was deleted. Affected items reverted to "Waiting PO" status.`,
    });

    // Update requests: Find items with this PO Number and revert them
    const updatedRequests = localRequests.map((req) => {
      const hasAffectedItems = req.items.some(
        (item) => item.poNumber === poNumber,
      );

      if (hasAffectedItems) {
        const revertedItems = req.items.map((item) => {
          if (item.poNumber === poNumber) {
            return {
              ...item,
              itemStatus: "Not Set" as const, // Reset readiness
              status: "Waiting PO" as const, // Revert workflow status
              poNumber: undefined,
              poDate: undefined,
            };
          }
          return item;
        });

        // Also check if we need to revert the Request-level status summary
        // If all items are now waiting PO, the request is Waiting PO
        // Simplification: Set to Waiting PO if it was On Process
        const newReqStatus =
          req.status === "On Process by Vendor"
            ? "Waiting PO"
            : req.status;

        const existingLog = req.activityLog || [];
        const newActivityLog = generateActivityLog(
          req.prNumber,
        );

        return {
          ...req,
          status: newReqStatus,
          items: revertedItems,
          activityLog: [...existingLog, newActivityLog],
        };
      }
      return req;
    });

    setLocalRequests(updatedRequests);

    if (onRequestsUpdate) {
      onRequestsUpdate(updatedRequests);
    }

    alert(`PO ${poNumber} has been deleted successfully.`);
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Logic to show badge based on item statuses in the PO group
  const getPOStatusBadge = (status: string) => {
    const colors = {
      "On Process by Vendor": "bg-purple-100 text-purple-800",
      Delivered: "bg-green-100 text-green-800",
      Cancelled: "bg-red-100 text-red-800",
    };
    return (
      colors[status as keyof typeof colors] ||
      "bg-gray-100 text-gray-800"
    );
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Purchase Order List
        </h1>
        <p className="text-gray-600">
          View and manage all purchase orders
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex gap-4 items-center flex-wrap">
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
                PO Date
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
                Vendor Name
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
                Payment Terms
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
                Status
              </th>
              <th className="px-6 py-4 text-right text-sm font-medium text-gray-700">
                Amount
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
                      There are no POs matching your criteria.
                    </div>
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
                      {Array.from(po.prNumbers).map(
                        (pr: any) => (
                          <span
                            key={pr}
                            className="text-[#ec2224] text-sm"
                          >
                            {pr}
                          </span>
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
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getPOStatusBadge(po.status)}`}
                    >
                      {po.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-gray-900">
                    {formatCurrency(po.totalAmount)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end items-center gap-2">
                      <button
                        onClick={() => handleViewPO(po)}
                        className="px-3 py-2 text-[#ec2224] hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2 text-sm"
                      >
                        <Eye className="w-4 h-4" /> View
                      </button>
                      <button
                        onClick={() => handleDownloadPO(po)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePO(po)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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

      {deleteConfirm && (
        <ConfirmationModal
          title="Delete Purchase Order?"
          message={`Are you sure you want to delete PO ${deleteConfirm.poNumber}? This will revert affected items to "Waiting PO" status.`}
          confirmLabel="Delete PO"
          confirmStyle="danger"
          onConfirm={confirmDeletePO}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}