// src/components/ListPO.tsx

import { useState, useMemo, useEffect } from "react";
import {
  Search,
  Download,
  Eye,
  ExternalLink,
  Trash2,
  Upload,
  MessageCircle,
} from "lucide-react";
import { purchaseOrdersAPI } from "../utils/api";
import type { PurchaseOrder } from "../data/mockData";
import UploadSignedPOModal from "./modals/UploadSignedPOModal";
import POPreviewModal from "./modals/POPreviewModal";
import ConfirmationModal from "./configuration/ConfirmationModal";

interface ListPOProps {
  onRequestsUpdate?: () => void;
}

export default function ListPO({
  onRequestsUpdate,
}: ListPOProps = {}) {
  // Data State
  const [pos, setPos] = useState<PurchaseOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // UI State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<string>("all");
  const [vendorFilter, setVendorFilter] =
    useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");

  // Action State
  const [selectedPOForUpload, setSelectedPOForUpload] =
    useState<PurchaseOrder | null>(null);
  const [selectedPOForPreview, setSelectedPOForPreview] =
    useState<PurchaseOrder | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    poId: string;
    poNumber: string;
  } | null>(null);

  // 1. Fetch Data
  const loadPOs = async () => {
    try {
      setIsLoading(true);
      const data = await purchaseOrdersAPI.getAll();
      setPos(data);
    } catch (error) {
      console.error("Error loading POs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPOs();
  }, []);

  // 2. Get Unique Vendors
  const vendors = useMemo(() => {
    const uniqueVendors = new Set(
      pos.map((po) => po.vendorName).filter(Boolean),
    );
    return Array.from(uniqueVendors).sort();
  }, [pos]);

  // 3. Filter and Sort
  const filteredAndSortedPOs = useMemo(() => {
    let filtered = [...pos];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (po) =>
          po.poNumber.toLowerCase().includes(query) ||
          po.vendorName.toLowerCase().includes(query),
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (po) => po.status === statusFilter,
      );
    }

    if (vendorFilter !== "all") {
      filtered = filtered.filter(
        (po) => po.vendorName === vendorFilter,
      );
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (
            new Date(b.generatedDate).getTime() -
            new Date(a.generatedDate).getTime()
          );
        case "oldest":
          return (
            new Date(a.generatedDate).getTime() -
            new Date(b.generatedDate).getTime()
          );
        case "poNumber-asc":
          return a.poNumber.localeCompare(b.poNumber);
        case "poNumber-desc":
          return b.poNumber.localeCompare(a.poNumber);
        case "vendor-asc":
          return a.vendorName.localeCompare(b.vendorName);
        default:
          return 0;
      }
    });

    return filtered;
  }, [searchQuery, statusFilter, vendorFilter, sortBy, pos]);

  // 4. Action Handlers
  const handleContactVendor = async (po: PurchaseOrder) => {
    // A. Open WhatsApp
    const message = `Hello ${po.vendorName}, attached is the Signed PO ${po.poNumber}. Please process immediately.`;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(message)}`,
      "_blank",
    );

    // B. Trigger Status Update
    try {
      await purchaseOrdersAPI.markAsProcessByVendor(po.id);
      await loadPOs();
      if (onRequestsUpdate) onRequestsUpdate();
      alert(
        `Success: Items in PO ${po.poNumber} marked as "Process by Vendor".`,
      );
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status.");
    }
  };

  const handleDeletePO = async () => {
    if (!deleteConfirm) return;
    // Implement delete logic here if needed
    console.log(
      "Delete requested for:",
      deleteConfirm.poNumber,
    );
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

  const getApprovalBadge = (status: string) => {
    return status === "Approved"
      ? "bg-green-100 text-green-800 border-green-200"
      : "bg-yellow-100 text-yellow-800 border-yellow-200";
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ec2224]"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header & Filters */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Purchase Order List
            </h1>
            <p className="text-gray-600">
              Manage POs and Vendor interactions
            </p>
          </div>
          <button
            onClick={loadPOs}
            className="text-sm text-[#ec2224] hover:underline"
          >
            Refresh Data
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex gap-4 items-center flex-wrap">
          <div className="flex-1 min-w-[300px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by PO Number, Vendor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ec2224]"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white"
          >
            <option value="all">All Statuses</option>
            <option value="Open">Open</option>
            <option value="Close">Close</option>
          </select>
          <select
            value={vendorFilter}
            onChange={(e) => setVendorFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white"
          >
            <option value="all">All Vendors</option>
            {vendors.map((vendor) => (
              <option key={vendor} value={vendor}>
                {vendor}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* PO Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 font-medium">
            <tr>
              <th className="px-6 py-4">PO Number</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Vendor</th>
              <th className="px-6 py-4">Approval Status</th>
              <th className="px-6 py-4 text-right">Amount</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredAndSortedPOs.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  No Purchase Orders found.
                </td>
              </tr>
            ) : (
              filteredAndSortedPOs.map((po) => (
                <tr
                  key={po.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {po.poNumber}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {formatDate(po.generatedDate)}
                  </td>
                  <td className="px-6 py-4 text-gray-900">
                    {po.vendorName}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getApprovalBadge(po.approvalStatus)}`}
                    >
                      {po.approvalStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-gray-900">
                    {formatCurrency(po.totalAmount)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end items-center gap-2">
                      {/* 1. Upload Signed PO (Req 2) */}
                      {po.approvalStatus === "Pending" && (
                        <button
                          onClick={() =>
                            setSelectedPOForUpload(po)
                          }
                          className="px-3 py-1.5 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 flex items-center gap-1 text-xs font-medium transition-colors"
                          title="Upload Signed PO"
                        >
                          <Upload className="w-3 h-3" /> Sign
                        </button>
                      )}

                      {/* 2. Contact Vendor (Req 3) */}
                      {po.approvalStatus === "Approved" && (
                        <button
                          onClick={() =>
                            handleContactVendor(po)
                          }
                          className="px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-1 text-xs font-medium transition-colors"
                          title="Send to Vendor"
                        >
                          <MessageCircle className="w-3 h-3" />{" "}
                          Contact
                        </button>
                      )}

                      {/* 3. View PO (Req 4) */}
                      <button
                        onClick={() =>
                          setSelectedPOForPreview(po)
                        }
                        className="p-2 text-gray-600 hover:text-[#ec2224] hover:bg-gray-100 rounded-md transition-colors"
                        title="Preview PO"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {/* External Link if exists */}
                      {po.signedPoLink && (
                        <a
                          href={po.signedPoLink}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          title="Download Signed PO"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      )}

                      <button
                        onClick={() =>
                          setDeleteConfirm({
                            poId: po.id,
                            poNumber: po.poNumber,
                          })
                        }
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Delete"
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

      {/* Modals */}
      {selectedPOForUpload && (
        <UploadSignedPOModal
          po={selectedPOForUpload}
          onClose={() => setSelectedPOForUpload(null)}
          onSuccess={() => {
            setSelectedPOForUpload(null);
            loadPOs();
          }}
        />
      )}

      {selectedPOForPreview && (
        <POPreviewModal
          po={selectedPOForPreview}
          onClose={() => setSelectedPOForPreview(null)}
        />
      )}

      {deleteConfirm && (
        <ConfirmationModal
          title="Delete PO?"
          message={`Delete ${deleteConfirm.poNumber}? This cannot be undone.`}
          confirmLabel="Delete"
          confirmStyle="danger"
          onConfirm={handleDeletePO}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}