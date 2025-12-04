// src/components/RequestApproval.tsx
import { useState, useMemo } from "react";
import { Search, Filter, Eye, CheckCircle, XCircle } from "lucide-react";
import type { ProcurementRequest } from "../data/mockData";
import { procurementRequestsAPI } from "../utils/api";
import RequestDetailModal from "./RequestDetailModal";
import StatusBadge from "./StatusBadge";
import ConfirmationModal from "./configuration/ConfirmationModal";
import RejectRequestModal from "./modals/RejectRequestModal";

interface RequestApprovalProps {
  requests: ProcurementRequest[];
  onUpdate: () => void;
  vendors: any[];
}

export default function RequestApproval({ requests, onUpdate, vendors }: RequestApprovalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Pending Approval" | "Approved" | "Rejected">("Pending Approval");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [selectedRequest, setSelectedRequest] = useState<ProcurementRequest | null>(null);
  
  // Action States
  const [confirmApprove, setConfirmApprove] = useState<ProcurementRequest | null>(null);
  const [rejectTarget, setRejectTarget] = useState<ProcurementRequest | null>(null);

  // Filter Data
  const filteredData = useMemo(() => {
    // Only show relevant statuses for this tab
    let data = requests.filter(r => 
        ["Pending Approval", "Approved", "Rejected"].includes(r.status)
    );

    if (statusFilter !== "All") {
      data = data.filter(r => r.status === statusFilter);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      data = data.filter(r => 
        r.prNumber.toLowerCase().includes(q) || 
        r.propertyCode.toLowerCase().includes(q) || 
        r.propertyName.toLowerCase().includes(q)
      );
    }

    return data.sort((a, b) => {
        const dateA = new Date(a.prDate).getTime();
        const dateB = new Date(b.prDate).getTime();
        return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });
  }, [requests, statusFilter, searchQuery, sortOrder]);

  const handleApprove = async () => {
    if (!confirmApprove) return;
    try {
        await procurementRequestsAPI.updateStatus(confirmApprove.prNumber, "Approved");
        // Also update item statuses to 'Review by Procurement' so they show on dashboard
        await procurementRequestsAPI.updateAllItemsStatus(confirmApprove.prNumber, "Review by Procurement");
        onUpdate();
        setConfirmApprove(null);
    } catch (e) {
        console.error(e);
        alert("Failed to approve request");
    }
  };

  const handleReject = async (reason: string) => {
    if (!rejectTarget) return;
    try {
        await procurementRequestsAPI.updateStatus(rejectTarget.prNumber, "Rejected", reason);
        // Set items to Cancelled
        await procurementRequestsAPI.updateAllItemsStatus(rejectTarget.prNumber, "Cancelled");
        onUpdate();
        setRejectTarget(null);
    } catch (e) {
        console.error(e);
        alert("Failed to reject request");
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
                type="text" 
                placeholder="Search PR-ID, Property Code, Property Name..." 
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#ec2224]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
        </div>
        
        <select 
            className="px-4 py-2 border rounded-lg bg-white"
            value={statusFilter}
            onChange={(e: any) => setStatusFilter(e.target.value)}
        >
            <option value="All">All Statuses</option>
            <option value="Pending Approval">Pending Approval</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
        </select>

        <select 
            className="px-4 py-2 border rounded-lg bg-white"
            value={sortOrder}
            onChange={(e: any) => setSortOrder(e.target.value)}
        >
            <option value="newest">Newest Date</option>
            <option value="oldest">Oldest Date</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b text-gray-700 font-medium">
                <tr>
                    <th className="px-6 py-4">PR-ID</th>
                    <th className="px-6 py-4">Request Date</th>
                    <th className="px-6 py-4">Property Code</th>
                    <th className="px-6 py-4">Property Name</th>
                    <th className="px-6 py-4">Total Payment</th>
                    <th className="px-6 py-4">Proof File</th>
                    <th className="px-6 py-4">View Detail</th>
                    <th className="px-6 py-4">Status / Actions</th>
                    <th className="px-6 py-4">Note</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
                {filteredData.length === 0 ? (
                    <tr><td colSpan={9} className="text-center py-8 text-gray-500">No requests found.</td></tr>
                ) : (
                    filteredData.map(req => {
                        const total = req.items.reduce((sum, i) => sum + (i.totalPrice || 0), 0);
                        return (
                            <tr key={req.prNumber} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium">{req.prNumber}</td>
                                <td className="px-6 py-4">{new Date(req.prDate).toLocaleDateString()}</td>
                                <td className="px-6 py-4">{req.propertyCode}</td>
                                <td className="px-6 py-4 max-w-[200px] truncate" title={req.propertyName}>{req.propertyName}</td>
                                <td className="px-6 py-4">Rp {total.toLocaleString()}</td>
                                <td className="px-6 py-4">
                                    {req.poFileLink ? ( // Assuming poFileLink is repurposed or prFileLink added
                                        <a href={req.poFileLink} target="_blank" className="text-blue-600 hover:underline">View Proof</a>
                                    ) : "-"}
                                </td>
                                <td className="px-6 py-4">
                                    <button onClick={() => setSelectedRequest(req)} className="text-[#ec2224] hover:bg-red-50 p-2 rounded-lg">
                                        <Eye className="w-5 h-5" />
                                    </button>
                                </td>
                                <td className="px-6 py-4">
                                    {req.status === "Pending Approval" ? (
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => setRejectTarget(req)}
                                                className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-xs font-medium"
                                            >
                                                Reject
                                            </button>
                                            <button 
                                                onClick={() => setConfirmApprove(req)}
                                                className="px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-xs font-medium"
                                            >
                                                Approve
                                            </button>
                                        </div>
                                    ) : (
                                        <StatusBadge status={req.status} />
                                    )}
                                </td>
                                <td className="px-6 py-4 text-gray-500 italic max-w-[200px] truncate">
                                    {(req as any).note || "-"}
                                </td>
                            </tr>
                        )
                    })
                )}
            </tbody>
        </table>
      </div>

      {/* Modals */}
      {selectedRequest && (
        <RequestDetailModal 
            request={selectedRequest} 
            vendors={vendors} 
            onClose={() => setSelectedRequest(null)}
            onUpdate={onUpdate}
        />
      )}

      {confirmApprove && (
        <ConfirmationModal 
            title="Approve Request"
            message={`Are you sure you want to approve ${confirmApprove.prNumber}? This will move it to the Procurement Dashboard.`}
            confirmLabel="Approve"
            onConfirm={handleApprove}
            onCancel={() => setConfirmApprove(null)}
        />
      )}

      {rejectTarget && (
        <RejectRequestModal 
            onClose={() => setRejectTarget(null)}
            onConfirm={(reason) => handleReject(reason)}
        />
      )}
    </div>
  );
}