import { useState } from 'react';
import { X, Upload } from 'lucide-react';
import type { ProcurementRequest } from '../../data/mockData';

interface CreateInvoiceFormProps {
  request: ProcurementRequest;
  onClose: () => void;
  onSubmit: (updatedRequest: ProcurementRequest) => void;
}

export default function CreateInvoiceForm({ request, onClose, onSubmit }: CreateInvoiceFormProps) {
  const [formData, setFormData] = useState({
    invoiceNumber: '',
    invoiceDate: '',
    invoiceFile: null as File | null
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData((prev) => ({ ...prev, invoiceFile: e.target.files![0] }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedRequest: ProcurementRequest = {
      ...request,
      status: 'Delivered',
      invoiceNumber: formData.invoiceNumber,
      invoiceDate: formData.invoiceDate,
      invoiceFileLink: '#'
    };
    onSubmit(updatedRequest);
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
            <h3 className="text-gray-900">Create Invoice</h3>
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
              <div>
                <label className="block text-gray-700 mb-2">
                  Invoice Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.invoiceNumber}
                  onChange={(e) => handleInputChange('invoiceNumber', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ec2224]"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">
                  Invoice Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.invoiceDate}
                  onChange={(e) => handleInputChange('invoiceDate', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ec2224]"
                />
              </div>

              {/* Upload Invoice */}
              <div>
                <label className="block text-gray-700 mb-2">
                  Upload Invoice File <span className="text-red-500">*</span>
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#ec2224] transition-colors">
                  <input
                    type="file"
                    id="invoice-upload"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    className="hidden"
                    required
                  />
                  <label htmlFor="invoice-upload" className="cursor-pointer">
                    <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                    {formData.invoiceFile ? (
                      <p className="text-gray-900">{formData.invoiceFile.name}</p>
                    ) : (
                      <>
                        <p className="text-gray-700">
                          Drag and drop your invoice file here
                        </p>
                        <p className="text-gray-500 text-sm mt-1">PDF, JPEG, PNG</p>
                      </>
                    )}
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
                className="px-6 py-2 bg-[#ec2224] text-white rounded-lg hover:bg-[#d11f21] transition-colors"
              >
                Submit Invoice
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}