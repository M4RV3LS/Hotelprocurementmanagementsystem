import { useState } from 'react';
import { Plus } from 'lucide-react';

export interface PaymentMethod {
  id: string;
  name: string;
  isActive: boolean;
}

// Default payment methods
const defaultPaymentMethods: PaymentMethod[] = [
  { id: 'pm-001', name: 'Cash Before Delivery', isActive: true },
  { id: 'pm-002', name: 'Payment Terms - NET 30', isActive: true },
  { id: 'pm-003', name: 'Payment Terms - NET 45', isActive: true },
  { id: 'pm-004', name: 'Payment Terms - NET 60', isActive: false },
  { id: 'pm-005', name: 'Bank Transfer', isActive: true },
  { id: 'pm-006', name: 'Credit Card', isActive: true },
  { id: 'pm-007', name: 'Cash on Delivery (COD)', isActive: true }
];

export default function PaymentMethodConfiguration() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(defaultPaymentMethods);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMethodName, setNewMethodName] = useState('');
  const [showToggleConfirm, setShowToggleConfirm] = useState<{
    method: PaymentMethod;
    action: 'activate' | 'deactivate';
  } | null>(null);

  const handleAddPaymentMethod = () => {
    if (newMethodName.trim().length < 3) {
      alert('Payment method name must be at least 3 characters');
      return;
    }

    // Check for duplicates
    if (paymentMethods.some(pm => pm.name.toLowerCase() === newMethodName.trim().toLowerCase())) {
      alert('This payment method already exists');
      return;
    }

    const newMethod: PaymentMethod = {
      id: `pm-${Date.now()}`,
      name: newMethodName.trim(),
      isActive: true
    };

    setPaymentMethods([...paymentMethods, newMethod]);
    setNewMethodName('');
    setShowAddModal(false);
  };

  const handleToggleConfirm = (method: PaymentMethod) => {
    const action = method.isActive ? 'deactivate' : 'activate';
    setShowToggleConfirm({ method, action });
  };

  const handleToggle = () => {
    if (!showToggleConfirm) return;

    setPaymentMethods(paymentMethods.map(pm =>
      pm.id === showToggleConfirm.method.id
        ? { ...pm, isActive: !pm.isActive }
        : pm
    ));
    setShowToggleConfirm(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900 mb-2">Payment Method Configuration</h2>
          <p className="text-gray-600">Manage payment methods used by vendors</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-[#ec2224] text-white rounded-lg hover:bg-[#d11f21] transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Payment Method
        </button>
      </div>

      {/* Payment Methods List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-gray-700">Payment Method Name</th>
              <th className="px-6 py-3 text-left text-gray-700">Status</th>
              <th className="px-6 py-3 text-right text-gray-700">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paymentMethods.map((method) => (
              <tr key={method.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-gray-900">{method.name}</td>
                <td className="px-6 py-4">
                  {method.isActive ? (
                    <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                      <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                      <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                      Inactive
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleToggleConfirm(method)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      method.isActive
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {method.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Payment Method Modal */}
      {showAddModal && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setShowAddModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
              <div className="border-b border-gray-200 px-6 py-4">
                <h3 className="text-gray-900">Add Payment Method</h3>
              </div>

              <div className="px-6 py-6 space-y-4">
                <div>
                  <label className="block text-gray-700 mb-2">
                    Payment Method Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newMethodName}
                    onChange={(e) => setNewMethodName(e.target.value)}
                    placeholder="e.g., Cash Before Delivery, Payment Terms - NET 30"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ec2224]"
                  />
                  <p className="text-gray-500 text-sm mt-2">
                    Examples: Cash Before Delivery, Payment Terms - NET 30, Bank Transfer, Credit Card, Cash on Delivery
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setNewMethodName('');
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddPaymentMethod}
                  disabled={newMethodName.trim().length < 3}
                  className="px-6 py-2 bg-[#ec2224] text-white rounded-lg hover:bg-[#d11f21] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Add Payment Method
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Toggle Confirmation Modal */}
      {showToggleConfirm && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setShowToggleConfirm(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
              <div className="border-b border-gray-200 px-6 py-4">
                <h3 className="text-gray-900">
                  {showToggleConfirm.action === 'activate' ? 'Activate' : 'Deactivate'} Payment Method?
                </h3>
              </div>

              <div className="px-6 py-6">
                <p className="text-gray-700 mb-4">
                  Are you sure you want to {showToggleConfirm.action} "{showToggleConfirm.method.name}"?
                </p>
                <p className="text-gray-600 text-sm">
                  {showToggleConfirm.action === 'deactivate' ? (
                    <>
                      This payment method will no longer appear in vendor configuration options,
                      but existing assignments will not be affected.
                    </>
                  ) : (
                    <>
                      This payment method will become available in vendor configuration options.
                    </>
                  )}
                </p>
              </div>

              <div className="border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
                <button
                  onClick={() => setShowToggleConfirm(null)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleToggle}
                  className={`px-6 py-2 rounded-lg transition-colors ${
                    showToggleConfirm.action === 'activate'
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  {showToggleConfirm.action === 'activate' ? 'Activate' : 'Deactivate'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
