import { X } from 'lucide-react';
import { useState } from 'react';
import type { ProcurementRequest, ProcurementItem } from '../data/mockData';
import StatusStepper from './StatusStepper';
import StatusBadge from './StatusBadge';
import ItemDetailSection from './request-detail/ItemDetailSection';
import LogActivity from './request-detail/LogActivity';

interface RequestDetailModalProps {
  request: ProcurementRequest;
  onClose: () => void;
  onUpdate: (request: ProcurementRequest) => void;
}

export default function RequestDetailModal({ request, onClose, onUpdate }: RequestDetailModalProps) {
  const [currentRequest, setCurrentRequest] = useState<ProcurementRequest>(request);

  const handleItemUpdate = (itemId: string, updatedItem: Partial<ProcurementItem>) => {
    const updatedRequest: ProcurementRequest = {
      ...currentRequest,
      items: currentRequest.items.map(item =>
        item.id === itemId ? { ...item, ...updatedItem } : item
      )
    };
    setCurrentRequest(updatedRequest);
    onUpdate(updatedRequest);
  };

  const handleStatusChange = (newStatus: string) => {
    // Check if all items have vendor assigned
    const allItemsHaveVendor = currentRequest.items.every(item => item.vendorName);
    
    if (newStatus === 'Waiting PO' && allItemsHaveVendor) {
      const updatedRequest: ProcurementRequest = {
        ...currentRequest,
        status: 'Waiting PO'
      };
      setCurrentRequest(updatedRequest);
      onUpdate(updatedRequest);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 flex items-center justify-between z-10">
            <h2 className="text-gray-900">Request Detail - PR Number: {currentRequest.prNumber}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Status Stepper */}
          <div className="px-8 py-6 border-b border-gray-200 bg-gray-50">
            <StatusStepper currentStatus={currentRequest.status} />
          </div>

          {/* Content */}
          <div className="px-8 py-6 space-y-8">
            {/* Property Information - Shared for all items */}
            <div>
              <h3 className="text-gray-900 mb-4 border-b-2 border-[#ec2224] pb-2">
                PROPERTY INFORMATION
              </h3>
              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <span className="text-gray-600">Property Name:</span>
                    <div className="text-gray-900">{currentRequest.propertyName}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Property Code:</span>
                    <div className="text-gray-900">{currentRequest.propertyCode}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Property Type:</span>
                    <div className="text-gray-900">{currentRequest.propertyType}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Brand Name:</span>
                    <div className="text-gray-900">{currentRequest.brandName}</div>
                  </div>
                </div>
                
                <div className="text-gray-600 text-sm">Address:</div>
                <div className="text-gray-900">{currentRequest.propertyAddress}</div>
                
                <div className="grid grid-cols-2 gap-6 pt-3 border-t border-gray-200">
                  <div>
                    <span className="text-gray-600">PIC Name:</span>
                    <div className="text-gray-900">{currentRequest.picName}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">PIC Number:</span>
                    <div className="text-gray-900">{currentRequest.picNumber}</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-6 pt-3 border-t border-gray-200">
                  <div>
                    <span className="text-gray-600">Requestor Name:</span>
                    <div className="text-gray-900">{currentRequest.requestorName}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Requestor Email:</span>
                    <div className="text-gray-900">{currentRequest.requestorEmail}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Request Date:</span>
                    <div className="text-gray-900">{formatDate(currentRequest.prDate)}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Current Status:</span>
                    <div><StatusBadge status={currentRequest.status} /></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Items - Each item gets its own complete section */}
            {currentRequest.items.map((item, index) => (
              <div key={item.id} className="border-4 border-[#ec2224] rounded-lg p-6 bg-white">
                <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-[#ec2224]">
                  <h3 className="text-gray-900">
                    ITEM {index + 1} OF {currentRequest.items.length}
                  </h3>
                  <span className="text-sm text-gray-600">Item ID: {item.id}</span>
                </div>

                <ItemDetailSection
                  item={item}
                  requestStatus={currentRequest.status}
                  onUpdate={(updatedItem) => handleItemUpdate(item.id, updatedItem)}
                  onStatusChange={handleStatusChange}
                />
              </div>
            ))}

            {/* Document Links (conditional) - Shared for all items */}
            {currentRequest.poNumber && (
              <div>
                <h3 className="text-gray-900 mb-4 border-b-2 border-[#ec2224] pb-2">
                  DOCUMENT LINKS
                </h3>
                <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                  {currentRequest.poNumber && (
                    <div className="flex gap-6 items-center">
                      <span className="text-gray-600">PO Number:</span>
                      <span className="text-gray-900">{currentRequest.poNumber}</span>
                      <span className="text-gray-600">•</span>
                      <span className="text-gray-600">{currentRequest.poDate && formatDate(currentRequest.poDate)}</span>
                      <span className="text-gray-600">•</span>
                      <a href={currentRequest.poFileLink} className="text-[#ec2224] hover:underline">
                        View PO Document
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ETA Information (conditional) - Shared for all items */}
            {currentRequest.estimatedDeliveryStart && currentRequest.estimatedDeliveryEnd && (
              <div>
                <h3 className="text-gray-900 mb-4 border-b-2 border-[#ec2224] pb-2">
                  DELIVERY INFORMATION
                </h3>
                <div className="bg-gray-50 rounded-lg p-6 space-y-3">
                  <div className="flex gap-6">
                    <span className="text-gray-600">Estimated Delivery:</span>
                    <span className="text-gray-900">
                      {formatDate(currentRequest.estimatedDeliveryStart)} - {formatDate(currentRequest.estimatedDeliveryEnd)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Log Activity */}
            <div>
              <h3 className="text-gray-900 mb-4 border-b-2 border-[#ec2224] pb-2">
                LOG ACTIVITY
              </h3>
              <div className="bg-gray-50 rounded-lg p-6 space-y-3">
                <LogActivity request={currentRequest} />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-8 py-6 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}