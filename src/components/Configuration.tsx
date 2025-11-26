import { useState } from 'react';
import ItemConfiguration from './configuration/ItemConfiguration';
import VendorManagement from './configuration/VendorManagement';
import PaymentMethodConfiguration from './configuration/PaymentMethodConfiguration';

export default function Configuration() {
  const [activeSubTab, setActiveSubTab] = useState<'items' | 'vendors' | 'payment'>('items');

  return (
    <div className="space-y-6">
      {/* Sub-Navigation */}
      <div className="bg-white border border-gray-200 rounded-lg p-1 inline-flex gap-1">
        <button
          onClick={() => setActiveSubTab('items')}
          className={`px-6 py-2 rounded-md transition-colors ${
            activeSubTab === 'items'
              ? 'bg-[#ec2224] text-white'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Item Configuration
        </button>
        <button
          onClick={() => setActiveSubTab('vendors')}
          className={`px-6 py-2 rounded-md transition-colors ${
            activeSubTab === 'vendors'
              ? 'bg-[#ec2224] text-white'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Vendor Management
        </button>
        <button
          onClick={() => setActiveSubTab('payment')}
          className={`px-6 py-2 rounded-md transition-colors ${
            activeSubTab === 'payment'
              ? 'bg-[#ec2224] text-white'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Payment Method Configuration
        </button>
      </div>

      {/* Content */}
      {activeSubTab === 'items' && <ItemConfiguration />}
      {activeSubTab === 'vendors' && <VendorManagement />}
      {activeSubTab === 'payment' && <PaymentMethodConfiguration />}
    </div>
  );
}