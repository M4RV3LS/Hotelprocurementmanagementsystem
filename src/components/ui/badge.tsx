type Status =
  | "Review by Procurement"
  | "Waiting PO"
  | "Waiting PO Approval"
  | "On Process by Vendor"
  | "Process by Vendor"
  | "Delivered"
  | "Cancelled by Procurement"
  | "Closed";

interface StatusBadgeProps {
  status: Status;
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
        return "bg-blue-50 text-blue-700 border-blue-200"; // Light Blue
      case "On Process by Vendor":
      case "Process by Vendor":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "Delivered":
        return "bg-green-100 text-green-800 border-green-200";
      case "Cancelled by Procurement":
        return "bg-red-50 text-red-700 border-red-200"; // Light Red
      case "Closed":
        return "bg-gray-100 text-gray-600 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
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