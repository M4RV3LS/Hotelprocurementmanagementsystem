import { useState, useEffect } from 'react';
import { X, Upload, Lock } from 'lucide-react';
import type { ProcurementRequest } from '../ProcurementDashboard';

interface CreatePRFormProps {
  request: ProcurementRequest;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

const legalEntities = ['RD-ID [RMI]', 'RD-ID [CSI]', 'RD-PH', 'RD-SG', 'RD-IN'];

const expenseTypeMapping: Record<string, string> = {
  'Branding Item': '622101',
  'Ops Item': '618119',
  'Others': '115010'
};

export default function CreatePRForm({ request, onClose, onSubmit }: CreatePRFormProps) {
  const [formData, setFormData] = useState({
    requestorName: '',
    department: '',
    position: '',
    legalEntity: '',
    companyId: '',
    submissionDate: '',
    prTitle: '',
    uploadedPO: null as File | null
  });

  const [isLoadingItems, setIsLoadingItems] = useState(true);

  // Auto-load items on mount
  useEffect(() => {
    // Simulate loading delay
    const timer = setTimeout(() => {
      setIsLoadingItems(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData((prev) => ({ ...prev, uploadedPO: e.target.files![0] }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      prNumber: `PR-${Date.now()}`,
      prDate: formData.submissionDate,
      prFileLink: '#'
    });
  };

  // Calculate totals
  const expenseAmount = request.totalPrice - request.taxAmount;
  const taxAmount = request.taxAmount;
  const grandTotal = request.totalPrice;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <h3 className="text-gray-900">Create Purchase Request (PR)</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit}>
            <div className="px-6 py-6 space-y-6">
              {/* Two Column Layout */}
              <div className="grid grid-cols-2 gap-6">
                {/* Column 1 */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-700 mb-2">
                      Name of Requestor <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.requestorName}
                      onChange={(e) => handleInputChange('requestorName', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ec2224]"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">
                      Department <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.department}
                      onChange={(e) => handleInputChange('department', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ec2224]"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">
                      Position Name of Requestor <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.position}
                      onChange={(e) => handleInputChange('position', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ec2224]"
                    />
                  </div>
                </div>

                {/* Column 2 */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-700 mb-2">
                      RedDoorz Legal Entity Name <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.legalEntity}
                      onChange={(e) => handleInputChange('legalEntity', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ec2224]"
                    >
                      <option value="">Select legal entity</option>
                      {legalEntities.map((entity) => (
                        <option key={entity} value={entity}>
                          {entity}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">
                      Company ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.companyId}
                      onChange={(e) => handleInputChange('companyId', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ec2224]"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">
                      Date of Submission <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.submissionDate}
                      onChange={(e) => handleInputChange('submissionDate', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ec2224]"
                    />
                  </div>
                </div>
              </div>

              {/* Vendor Info */}
              <div>
                <label className="block text-gray-700 mb-2">Vendor ID & Vendor Name</label>
                <div className="px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-lg text-gray-700">
                  {request.vendorName || 'No vendor assigned'}
                </div>
              </div>

              {/* PR Title */}
              <div>
                <label className="block text-gray-700 mb-2">
                  Purchase Request Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.prTitle}
                  onChange={(e) => handleInputChange('prTitle', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ec2224]"
                />
              </div>

              {/* Request ID - Auto-filled and locked */}
              <div>
                <label className="block text-gray-700 mb-2">Request ID</label>
                <div className="relative">
                  <input
                    type="text"
                    value={request.requestId}
                    disabled
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
                  />
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
                <p className="text-gray-500 text-sm mt-1">Item details auto-loaded from this request</p>
              </div>

              {/* Dynamic Item Table */}
              {isLoadingItems ? (
                <div className="border border-gray-200 rounded-lg p-12 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-[#ec2224] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-gray-600">Loading item details...</p>
                  </div>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-gray-700">Item Description</th>
                        <th className="px-4 py-3 text-left text-gray-700">Expense Type</th>
                        <th className="px-4 py-3 text-left text-gray-700">Currency</th>
                        <th className="px-4 py-3 text-right text-gray-700">Expense Amount</th>
                        <th className="px-4 py-3 text-right text-gray-700">Tax</th>
                        <th className="px-4 py-3 text-right text-gray-700">Amount (w/o tax)</th>
                        <th className="px-4 py-3 text-right text-gray-700">Tax Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t border-gray-200">
                        <td className="px-4 py-3 text-gray-700">{request.itemProperty}</td>
                        <td className="px-4 py-3 text-gray-700">
                          {expenseTypeMapping[request.itemCategory]}
                        </td>
                        <td className="px-4 py-3 text-gray-700">IDR</td>
                        <td className="px-4 py-3 text-right text-gray-700">
                          Rp {grandTotal.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-700">{request.taxPercentage}%</td>
                        <td className="px-4 py-3 text-right text-gray-700">
                          Rp {expenseAmount.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-700">
                          Rp {taxAmount.toLocaleString()}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* Total Amount Summary */}
              {isLoadingItems ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-700">Subtotal:</span>
                      <span className="text-gray-900">Rp {expenseAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Total Tax Amount:</span>
                      <span className="text-gray-900">Rp {taxAmount.toLocaleString()}</span>
                    </div>
                    <div className="border-t border-blue-300 pt-2 flex justify-between">
                      <span className="text-gray-900">Grand Total (with tax):</span>
                      <span className="text-gray-900">Rp {grandTotal.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-700">Subtotal:</span>
                      <span className="text-gray-900">Rp {expenseAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Total Tax Amount:</span>
                      <span className="text-gray-900">Rp {taxAmount.toLocaleString()}</span>
                    </div>
                    <div className="border-t border-blue-300 pt-2 flex justify-between">
                      <span className="text-gray-900">Grand Total (with tax):</span>
                      <span className="text-gray-900">Rp {grandTotal.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Upload PO */}
              <div>
                <label className="block text-gray-700 mb-2">
                  Upload PO <span className="text-red-500">*</span>
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-[#ec2224] transition-colors">
                  <input
                    type="file"
                    id="po-upload"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                    required
                  />
                  <label htmlFor="po-upload" className="cursor-pointer">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    {formData.uploadedPO ? (
                      <p className="text-gray-900">{formData.uploadedPO.name}</p>
                    ) : (
                      <>
                        <p className="text-gray-700">
                          Drag and drop your PO file here, or click to browse
                        </p>
                        <p className="text-gray-500 text-sm mt-1">PDF, DOC, DOCX</p>
                      </>
                    )}
                  </label>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
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
                Submit PR
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}