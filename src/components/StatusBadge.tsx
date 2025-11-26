type Status =
  | 'Review by Procurement'
  | 'Waiting PO'
  | 'On Process by Vendor'
  | 'Delivered';

interface StatusBadgeProps {
  status: Status;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const getStatusStyles = () => {
    switch (status) {
      case 'Review by Procurement':
        return 'bg-amber-100 text-amber-800 border-amber-200'; // Amber
      case 'Waiting PO':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'; // Yellow
      case 'On Process by Vendor':
        return 'bg-purple-100 text-purple-800 border-purple-200'; // Purple
      case 'Delivered':
        return 'bg-green-100 text-green-800 border-green-200'; // Green
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <span className={`px-3 py-1 rounded-full text-sm border ${getStatusStyles()}`}>
      {status}
    </span>
  );
}