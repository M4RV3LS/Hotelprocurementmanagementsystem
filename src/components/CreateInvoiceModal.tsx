import { useState } from 'react';
import { X, Upload, FileText } from 'lucide-react';
import type { ProcurementRequest } from '../data/mockData';

interface CreateInvoiceModalProps {
  request: ProcurementRequest;
  onClose: () => void;
  onSubmit: (invoiceNumber: string, invoiceDate: string, file: string) => void;
}

export default function CreateInvoiceModal({ request, onClose, onSubmit }: CreateInvoiceModalProps) {
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file type
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        setError('Invalid file type. Please upload PDF, JPG, or PNG');
        return;
      }

      // Check file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }

      setFileName(file.name);
      setError('');
    }
  };

  const handleSubmit = () => {
    // Validation
    if (!invoiceNumber || !invoiceDate || !fileName) {
      setError('All fields are required');
      return;
    }

    const date = new Date(invoiceDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    if (date > today) {
      setError('Invoice date cannot be in the future');
      return;
    }

    setError('');
    onSubmit(invoiceNumber, invoiceDate, fileName);
  };

  // Calculate total amount from items
  const totalAmount = request.items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
          {/* Header */}
          <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <h2 className="text-gray-900">Submit Invoice Information</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-6 space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">PR Number:</span>
                <span className="text-gray-900">{request.prNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Property:</span>
                <span className="text-gray-900">{request.propertyName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">PO Number:</span>
                <span className="text-gray-900">{request.poNumber}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-2 mt-2">
                <span className="text-gray-900">Total Amount:</span>
                <span className="text-gray-900">Rp {totalAmount.toLocaleString()}</span>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4 space-y-4">
              <div>
                <label className="block text-gray-700 mb-2">
                  Invoice Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="INV-2025-001-ABC"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ec2224]"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">
                  Invoice Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ec2224]"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">
                  Upload Invoice File <span className="text-red-500">*</span>
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#ec2224] transition-colors">
                  <input
                    type="file"
                    id="invoice-file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="invoice-file"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <Upload className="w-8 h-8 text-gray-400" />
                    <div className="text-sm text-gray-600">
                      {fileName ? (
                        <div className="flex items-center gap-2 text-[#ec2224]">
                          <FileText className="w-4 h-4" />
                          <span>{fileName}</span>
                        </div>
                      ) : (
                        <>
                          <span className="text-[#ec2224]">Click to browse</span> or drag and drop
                        </>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      PDF, JPG, PNG (max 10MB)
                    </div>
                  </label>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!invoiceNumber || !invoiceDate || !fileName}
              className="px-4 py-2 bg-[#ec2224] text-white rounded-lg hover:bg-[#d11f21] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Submit Invoice
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
