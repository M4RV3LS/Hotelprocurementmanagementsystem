import { useState } from 'react';
import { X } from 'lucide-react';
import { vendors } from '../../data/mockData';
import type { ProcurementRequest, PaymentTerms } from '../../data/mockData';

interface VendorAssignmentFormProps {
  request: ProcurementRequest;
  onClose: () => void;
  onSubmit: (updatedRequest: ProcurementRequest) => void;
}

export default function VendorAssignmentForm({ request, onClose, onSubmit }: VendorAssignmentFormProps) {
  const [selectedVendor, setSelectedVendor] = useState('');
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerms | ''>('');

  // Filter to show only active vendors
  const activeVendors = vendors.filter(vendor => vendor.isActive);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedVendor && paymentTerms) {
      const vendor = vendors.find(v => v.vendorName === selectedVendor);
      
      // Update request with vendor and payment terms, change status to Waiting PO
      const updatedRequest: ProcurementRequest = {
        ...request,
        vendorName: selectedVendor,
        vendorCode: vendor?.vendorCode,
        paymentTerms: paymentTerms as PaymentTerms,
        status: 'Waiting PO',
        // Auto-populate pricing if vendor has configured prices
        items: request.items.map(item => {
          // Find matching vendor item configuration
          const vendorItem = vendor?.items.find(
            vi => vi.itemCode === item.itemCode && 
            JSON.stringify(vi.selectedProperties) === JSON.stringify(item.selectedProperties)
          );

          if (vendorItem && vendorItem.unitPrice > 0) {
            // Auto-fill pricing from vendor configuration
            const taxRate = parseInt(vendorItem.taxRate.match(/\d+/)?.[0] || '0');
            const unitPrice = vendorItem.unitPrice;
            const taxAmount = (item.quantity * unitPrice * taxRate) / 100;
            const totalPrice = item.quantity * unitPrice + taxAmount;

            return {
              ...item,
              unitPrice,
              taxPercentage: taxRate,
              taxAmount,
              totalPrice
            };
          }
          
          // No price configured - user must enter manually
          return item;
        })
      };

      onSubmit(updatedRequest);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
          {/* Header */}
          <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <h3 className="text-gray-900">Assign Vendor & Payment Terms</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit}>
            <div className="px-6 py-6 space-y-4">
              {/* PR Number Display */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600">PR Number</div>
                <div className="text-gray-900">{request.prNumber}</div>
              </div>

              {/* Vendor Selection */}
              <div>
                <label className="block text-gray-700 mb-2">
                  Vendor Name <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedVendor}
                  onChange={(e) => setSelectedVendor(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ec2224]"
                >
                  <option value="">Select Vendor</option>
                  {activeVendors.map((vendor) => (
                    <option key={vendor.vendorCode} value={vendor.vendorName}>
                      {vendor.vendorName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Payment Terms Selection */}
              <div>
                <label className="block text-gray-700 mb-2">
                  Payment Terms <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 px-4 py-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      name="paymentTerms"
                      value="Cash Before Delivery"
                      checked={paymentTerms === 'Cash Before Delivery'}
                      onChange={(e) => setPaymentTerms(e.target.value as PaymentTerms)}
                      className="w-4 h-4 text-[#ec2224] border-gray-300 focus:ring-[#ec2224]"
                    />
                    <span className="text-gray-900">Cash Before Delivery</span>
                  </label>
                  <label className="flex items-center gap-3 px-4 py-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      name="paymentTerms"
                      value="Payment Terms"
                      checked={paymentTerms === 'Payment Terms'}
                      onChange={(e) => setPaymentTerms(e.target.value as PaymentTerms)}
                      className="w-4 h-4 text-[#ec2224] border-gray-300 focus:ring-[#ec2224]"
                    />
                    <span className="text-gray-900">Payment Terms</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!selectedVendor || !paymentTerms}
                className="px-6 py-2 bg-[#ec2224] text-white rounded-lg hover:bg-[#d11f21] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Assign
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
