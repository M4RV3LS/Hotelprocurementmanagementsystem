import { Eye, Calendar, Receipt } from 'lucide-react';
import type { ProcurementRequest } from '../data/mockData';

interface ActionButtonsProps {
  request: ProcurementRequest;
  onViewRequest: () => void;
  onInputETA?: () => void;
}

export default function ActionButtons({ request, onViewRequest, onInputETA }: ActionButtonsProps) {
  const renderActionButtons = () => {
    switch (request.status) {
      case 'Waiting PO':
        // Show view button only - PO generation happens from dashboard
        return (
          <button
            onClick={onViewRequest}
            className="px-4 py-2 text-[#ec2224] hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2 border border-gray-300"
            title="View Request Details"
          >
            <Eye className="w-4 h-4" />
            View
          </button>
        );

      case 'On Process by Vendor':
      case 'Delivered':
        // Just view button for both statuses (Create Invoice removed)
        return (
          <button
            onClick={onViewRequest}
            className="px-4 py-2 text-[#ec2224] hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2 border border-gray-300"
            title="View Request Details"
          >
            <Eye className="w-4 h-4" />
            View
          </button>
        );

      default:
        return (
          <button
            onClick={onViewRequest}
            className="px-4 py-2 text-[#ec2224] hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2 border border-gray-300"
            title="View Request Details"
          >
            <Eye className="w-4 h-4" />
            View
          </button>
        );
    }
  };

  return <div className="flex justify-end">{renderActionButtons()}</div>;
}