// src/components/StatusBadge.tsx
import React from "react";

type Status =
  | "Review by Procurement"
  | "Waiting PO"
  | "Waiting PO Approval"
  | "On Process by Vendor"
  | "Process by Vendor"
  | "Delivered"
  | "Cancelled by Procurement"
  | "Closed"
  | "Pending Approval"
  | "Approved"
  | "Rejected";

interface StatusBadgeProps {
  status: Status | string;
}

export default function StatusBadge({
  status,
}: StatusBadgeProps) {
  const getStatusStyles = () => {
    switch (status) {
      case "Review by Procurement":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "Waiting PO":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Waiting PO Approval":
        return "bg-blue-100 text-blue-800 border-blue-200"; // Requirement 3: Blue
      case "On Process by Vendor":
      case "Process by Vendor":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "Delivered":
        return "bg-green-100 text-green-800 border-green-200";
      case "Cancelled by Procurement":
      case "Rejected":
        return "bg-red-100 text-red-800 border-red-200"; // Requirement 3: Red
      case "Approved":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "Pending Approval":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "Closed":
        return "bg-gray-200 text-gray-600 border-gray-300";
      default:
        return "bg-gray-50 text-gray-600 border-gray-200";
    }
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${getStatusStyles()}`}
    >
      {status}
    </span>
  );
}