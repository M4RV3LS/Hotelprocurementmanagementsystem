import { useState, useMemo, useEffect } from "react";
import { Search, Download, Eye } from "lucide-react";
import { type ProcurementRequest } from "../data/mockData";
import RequestDetailModal from "./RequestDetailModal";

// Interface for props to receive DB data and update functions
interface ListPRProps {
  requests?: ProcurementRequest[];
  onRequestsUpdate?: (requests: ProcurementRequest[]) => void;
}

export default function ListPR({
  requests: externalRequests = [],
  onRequestsUpdate,
}: ListPRProps = {}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [selectedRequest, setSelectedRequest] =
    useState<ProcurementRequest | null>(null);

  // Initialize with props (DB data) or fallback to mock
  const [requests, setRequests] = useState(externalRequests);

  // 1. SYNC: Update local state when parent data (DB) changes
  useEffect(() => {
    if (externalRequests) {
      setRequests(externalRequests);
    }
  }, [externalRequests]);

  // Filter and sort PR list
  const filteredAndSortedPRs = useMemo(() => {
    let filtered = [...requests];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (pr) =>
          pr.prNumber.toLowerCase().includes(query) ||
          pr.propertyName.toLowerCase().includes(query),
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (pr) => pr.status === statusFilter,
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (
            new Date(b.prDate).getTime() -
            new Date(a.prDate).getTime()
          );
        case "oldest":
          return (
            new Date(a.prDate).getTime() -
            new Date(b.prDate).getTime()
          );
        case "prNumber-asc":
          return a.prNumber.localeCompare(b.prNumber);
        case "prNumber-desc":
          return b.prNumber.localeCompare(a.prNumber);
        case "property-asc":
          return a.propertyName.localeCompare(b.propertyName);
        case "property-desc":
          return b.propertyName.localeCompare(a.propertyName);
        default:
          return 0;
      }
    });

    return filtered;
  }, [searchQuery, statusFilter, sortBy, requests]);

  const handleViewPR = (pr: ProcurementRequest) => {
    setSelectedRequest(pr);
  };

  const handleDownloadPR = (pr: ProcurementRequest) => {
    console.log("Download PR:", pr.prNumber);
  };

  // 2. SYNC: Handle updates from the Modal and propagate to DB
  const handleUpdateRequest = (
    updatedRequest: ProcurementRequest,
  ) => {
    const updatedList = requests.map((req) =>
      req.prNumber === updatedRequest.prNumber
        ? updatedRequest
        : req,
    );

    // Update local view immediately
    setRequests(updatedList);
    setSelectedRequest(updatedRequest);

    // Propagate to Parent (App.tsx) -> Database
    if (onRequestsUpdate) {
      onRequestsUpdate(updatedList);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-gray-900 mb-2">
          Purchase Request List
        </h1>
        <p className="text-gray-600">
          View and manage all purchase requests
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex gap-4 items-center">
          {/* Search Bar */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by PR Number, Property Name..."
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
            <option value="Review by Procurement">
              Review by Procurement
            </option>
            <option value="Waiting PO">Waiting PO</option>
            <option value="On Process by Vendor">
              On Process by Vendor
            </option>
            <option value="Delivered">Delivered</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#ec2224]"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="prNumber-asc">
              PR Number (A-Z)
            </option>
            <option value="prNumber-desc">
              PR Number (Z-A)
            </option>
            <option value="property-asc">
              Property Name (A-Z)
            </option>
            <option value="property-desc">
              Property Name (Z-A)
            </option>
          </select>
        </div>
      </div>

      {/* PR Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-gray-700">
                PR Number
              </th>
              <th className="px-6 py-4 text-left text-gray-700">
                PR Date Created
              </th>
              <th className="px-6 py-4 text-left text-gray-700">
                Property Name
              </th>
              <th className="px-6 py-4 text-left text-gray-700">
                Property Code
              </th>
              <th className="px-6 py-4 text-left text-gray-700">
                Total Items
              </th>

              <th className="px-6 py-4 text-right text-gray-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredAndSortedPRs.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-12 text-center"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="text-gray-400">📋</div>
                    <div className="text-gray-700">
                      No Purchase Requests Found
                    </div>
                    <div className="text-gray-500 text-sm">
                      There are no PRs matching your search or
                      filter criteria.
                    </div>
                    {(searchQuery ||
                      statusFilter !== "all") && (
                      <button
                        onClick={() => {
                          setSearchQuery("");
                          setStatusFilter("all");
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
              filteredAndSortedPRs.map((pr) => (
                <tr
                  key={pr.prNumber}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <span className="text-gray-900">
                      {pr.prNumber}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    {formatDate(pr.prDate)}
                  </td>
                  <td className="px-6 py-4 text-gray-900">
                    {pr.propertyName}
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    {pr.propertyCode}
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    {pr.items.length}
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex justify-end items-center gap-2">
                      <button
                        onClick={() => handleViewPR(pr)}
                        className="px-3 py-2 text-[#ec2224] hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View PR
                      </button>
                      <button
                        onClick={() => handleDownloadPR(pr)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Download PR"
                      >
                        <Download className="w-4 h-4" />
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
      {filteredAndSortedPRs.length > 0 && (
        <div className="mt-4 text-gray-600 text-sm">
          Showing {filteredAndSortedPRs.length} of{" "}
          {requests.length} purchase requests
        </div>
      )}

      {/* Request Detail Modal */}
      {selectedRequest && (
        <RequestDetailModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onUpdate={handleUpdateRequest}
        />
      )}
    </div>
  );
}