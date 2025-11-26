import { useState } from 'react';
import type { ProcurementItem, PaymentTerms } from '../../data/mockData';
import { vendors } from '../../data/mockData';

interface ItemDetailSectionProps {
  item: ProcurementItem;
  requestStatus: string;
  onUpdate: (updatedItem: Partial<ProcurementItem>) => void;
  onStatusChange?: (newStatus: string) => void;
}

export default function ItemDetailSection({ item, requestStatus, onUpdate, onStatusChange }: ItemDetailSectionProps) {
  const [selectedVendor, setSelectedVendor] = useState(item.vendorName || '');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(item.paymentTerms || '');
  const [showVendorForm, setShowVendorForm] = useState(false);
  const [showReassignForm, setShowReassignForm] = useState(false);

  // For manual pricing input (when vendor has no configured price)
  const [manualUnitPrice, setManualUnitPrice] = useState(item.unitPrice?.toString() || '');
  const [isEditingPrice, setIsEditingPrice] = useState(false);

  // Get payment methods for selected vendor
  const selectedVendorData = vendors.find(v => v.vendorName === selectedVendor);
  const availablePaymentMethods = selectedVendorData?.paymentMethods || [];

  const getItemDisplayName = () => {
    const properties = Object.entries(item.selectedProperties)
      .map(([key, value]) => value)
      .join(', ');
    return properties ? `${item.itemName} - ${properties}` : item.itemName;
  };

  const getItemStatusBadge = (itemStatus: string) => {
    const colors = {
      'Not Set': 'bg-gray-100 text-gray-800',
      'Cancelled': 'bg-red-100 text-red-800',
      'Ready': 'bg-green-100 text-green-800'
    };
    return colors[itemStatus as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const handleVendorAssignment = () => {
    if (!selectedVendor || !selectedPaymentMethod) return;

    const vendor = vendors.find(v => v.vendorName === selectedVendor);
    
    // Try to find matching vendor item configuration
    const vendorItem = vendor?.items.find(
      vi => vi.itemCode === item.itemCode && 
      JSON.stringify(vi.selectedProperties) === JSON.stringify(item.selectedProperties)
    );

    let updatedItem: Partial<ProcurementItem> = {
      vendorName: selectedVendor,
      vendorCode: vendor?.vendorCode,
      paymentTerms: selectedPaymentMethod as PaymentTerms,
    };

    // Check if vendor has configured price
    if (vendorItem && vendorItem.unitPrice > 0) {
      // Scenario 1: Auto-fill pricing from vendor configuration
      const taxRate = parseInt(vendorItem.taxRate.match(/\d+/)?.[0] || '0');
      const unitPrice = vendorItem.unitPrice;
      const taxAmount = (item.quantity * unitPrice * taxRate) / 100;
      const totalPrice = item.quantity * unitPrice + taxAmount;

      updatedItem = {
        ...updatedItem,
        unitPrice,
        taxPercentage: taxRate,
        taxAmount,
        totalPrice
      };
    } else {
      // Scenario 2: No price configured - leave blank for manual input
      // Get tax rate but leave prices at 0
      const taxRate = vendorItem ? parseInt(vendorItem.taxRate.match(/\d+/)?.[0] || '11') : 11;
      updatedItem = {
        ...updatedItem,
        unitPrice: undefined,
        taxPercentage: taxRate,
        taxAmount: 0,
        totalPrice: 0
      };
    }

    onUpdate(updatedItem);
    
    // Change request status to "Waiting PO"
    if (onStatusChange && requestStatus === 'Review by Procurement') {
      onStatusChange('Waiting PO');
    }
    
    setShowVendorForm(false);
  };

  const handleItemStatusChange = (newStatus: 'Not Set' | 'Cancelled' | 'Ready') => {
    onUpdate({ itemStatus: newStatus });
  };

  const handleManualPriceUpdate = () => {
    const unitPrice = parseFloat(manualUnitPrice) || 0;
    const taxPercentage = item.taxPercentage || 11;
    const taxAmount = (item.quantity * unitPrice * taxPercentage) / 100;
    const totalPrice = item.quantity * unitPrice + taxAmount;

    onUpdate({
      unitPrice,
      taxAmount,
      totalPrice
    });
    setIsEditingPrice(false);
  };

  const hasVendorAssigned = Boolean(item.vendorName);
  const hasPrice = item.unitPrice !== undefined && item.unitPrice > 0;
  const activeVendors = vendors.filter(v => v.isActive);

  // Determine if pricing should be shown based on status
  const shouldShowPricing = requestStatus !== 'Review by Procurement';
  const isPricingEditable = requestStatus === 'Waiting PO';

  return (
    <div className="space-y-6">
      {/* Item Details */}
      <div>
        <h4 className="text-gray-900 mb-3 border-b border-gray-300 pb-2">
          ITEM DETAILS
        </h4>
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div className="flex gap-6">
            <span className="text-gray-600 w-48">Item Name:</span>
            <span className="text-gray-900">{getItemDisplayName()}</span>
          </div>
          
          {/* Show Item Status as read-only badge for ALL statuses */}
          <div className="flex gap-6 items-center">
            <span className="text-gray-600 w-48">Item Status:</span>
            <span className={`px-3 py-1 rounded-full text-sm ${getItemStatusBadge(item.itemStatus || 'Not Set')}`}>
              {item.itemStatus || 'Not Set'}
            </span>
          </div>

          <div className="flex gap-6">
            <span className="text-gray-600 w-48">Item Category:</span>
            <span className="text-gray-900">{item.itemCategory}</span>
          </div>

          <div className="flex gap-6">
            <span className="text-gray-600 w-48">Quantity:</span>
            <span className="text-gray-900">{item.quantity} {item.uom}</span>
          </div>

          {Object.keys(item.selectedProperties).length > 0 && (
            <div className="flex gap-6">
              <span className="text-gray-600 w-48">Item Specification:</span>
              <div className="space-y-1">
                {Object.entries(item.selectedProperties).map(([key, value]) => (
                  <div key={key} className="text-gray-900">
                    • {key}: {value}
                  </div>
                ))}
              </div>
            </div>
          )}

          {item.designLink && (
            <div className="flex gap-6">
              <span className="text-gray-600 w-48">Design Link:</span>
              <a href={item.designLink} className="text-[#ec2224] hover:underline">
                View Design
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Vendor Information */}
      <div>
        <h4 className="text-gray-900 mb-3 border-b border-gray-300 pb-2">
          VENDOR INFORMATION
        </h4>
        
        {requestStatus === 'Review by Procurement' && !hasVendorAssigned ? (
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            {!showVendorForm ? (
              <div className="text-center py-4">
                <p className="text-gray-500 italic mb-4">
                  No vendor assigned yet for this item
                </p>
                <button
                  onClick={() => setShowVendorForm(true)}
                  className="px-6 py-2 bg-[#ec2224] text-white rounded-lg hover:bg-[#d11f21] transition-colors"
                >
                  Assign Vendor & Payment Terms
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 mb-2">
                    Vendor <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedVendor}
                    onChange={(e) => setSelectedVendor(e.target.value)}
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

                <div>
                  <label className="block text-gray-700 mb-2">
                    Payment Terms <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2">
                    {availablePaymentMethods.map(method => (
                      <label key={method} className="flex items-center gap-3 px-4 py-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                        <input
                          type="radio"
                          name={`paymentTerms-${item.id}`}
                          value={method}
                          checked={selectedPaymentMethod === method}
                          onChange={(e) => setSelectedPaymentMethod(e.target.value as PaymentTerms)}
                          className="w-4 h-4 text-[#ec2224] border-gray-300 focus:ring-[#ec2224]"
                        />
                        <span className="text-gray-900">{method}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowVendorForm(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleVendorAssignment}
                    disabled={!selectedVendor || !selectedPaymentMethod}
                    className="px-4 py-2 bg-[#ec2224] text-white rounded-lg hover:bg-[#d11f21] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Assign
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            {hasVendorAssigned ? (
              <>
                <div className="flex gap-6">
                  <span className="text-gray-600 w-48">Vendor Name:</span>
                  <span className="text-gray-900">{item.vendorName}</span>
                </div>
                {item.vendorCode && (
                  <div className="flex gap-6">
                    <span className="text-gray-600 w-48">Vendor Code:</span>
                    <span className="text-gray-900">{item.vendorCode}</span>
                  </div>
                )}
                {item.paymentTerms && (
                  <div className="flex gap-6">
                    <span className="text-gray-600 w-48">Payment Terms:</span>
                    <span className="text-gray-900">{item.paymentTerms}</span>
                  </div>
                )}
              </>
            ) : (
              <div className="text-gray-500 italic">
                No vendor assigned yet
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pricing Information */}
      <div>
        <h4 className="text-gray-900 mb-3 border-b border-gray-300 pb-2">
          PRICING INFORMATION
        </h4>
        
        {requestStatus === 'Review by Procurement' && !hasVendorAssigned ? (
          <div className="bg-gray-50 rounded-lg p-6 text-center py-8">
            <div className="text-gray-500 italic">
              ⚠️ Pricing will be calculated after vendor assignment
            </div>
          </div>
        ) : hasVendorAssigned ? (
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            {hasPrice ? (
              <>
                {/* Scenario 1: Price auto-filled from vendor config */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                  <div className="text-sm text-green-700 flex items-center gap-2">
                    <span>✓</span>
                    <span>Prices are pre-filled from vendor configuration (editable)</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Unit Price:</span>
                  {isEditingPrice ? (
                    <input
                      type="number"
                      value={manualUnitPrice}
                      onChange={(e) => setManualUnitPrice(e.target.value)}
                      className="px-3 py-1 border border-gray-300 rounded-lg text-right w-48"
                      placeholder="0"
                    />
                  ) : (
                    <span className="text-gray-900">Rp {item.unitPrice.toLocaleString()}</span>
                  )}
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax ({item.taxPercentage}%):</span>
                  <span className="text-gray-900">Rp {(item.taxAmount || 0).toLocaleString()}</span>
                </div>
                <div className="border-t border-gray-300 pt-3 flex justify-between">
                  <span className="text-gray-900">Total Price:</span>
                  <span className="text-gray-900">Rp {(item.totalPrice || 0).toLocaleString()}</span>
                </div>
                
                {!isEditingPrice && (requestStatus === 'Waiting PO' || requestStatus === 'Review by Procurement') && (
                  <button
                    onClick={() => setIsEditingPrice(true)}
                    className="w-full mt-3 px-4 py-2 border border-[#ec2224] text-[#ec2224] rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Edit Pricing
                  </button>
                )}
                {isEditingPrice && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setManualUnitPrice(item.unitPrice?.toString() || '');
                        setIsEditingPrice(false);
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleManualPriceUpdate}
                      className="flex-1 px-4 py-2 bg-[#ec2224] text-white rounded-lg hover:bg-[#d11f21] transition-colors"
                    >
                      Save Changes
                    </button>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Scenario 2: No price configured - manual input required */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
                  <div className="text-sm text-amber-700">
                    ⚠️ This item does not have a pre-configured price from the selected vendor
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Unit Price: <span className="text-red-500">*</span></span>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">Rp</span>
                      <input
                        type="number"
                        value={manualUnitPrice}
                        onChange={(e) => setManualUnitPrice(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-right w-48"
                        placeholder="Enter unit price"
                      />
                    </div>
                  </div>
                  
                  {manualUnitPrice && parseFloat(manualUnitPrice) > 0 && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tax ({item.taxPercentage || 11}%):</span>
                        <span className="text-gray-900">
                          Rp {((item.quantity * parseFloat(manualUnitPrice) * (item.taxPercentage || 11)) / 100).toLocaleString()}
                        </span>
                      </div>
                      <div className="border-t border-gray-300 pt-3 flex justify-between">
                        <span className="text-gray-900">Total Price:</span>
                        <span className="text-gray-900">
                          Rp {(item.quantity * parseFloat(manualUnitPrice) + ((item.quantity * parseFloat(manualUnitPrice) * (item.taxPercentage || 11)) / 100)).toLocaleString()}
                        </span>
                      </div>
                    </>
                  )}
                  
                  <button
                    onClick={handleManualPriceUpdate}
                    disabled={!manualUnitPrice || parseFloat(manualUnitPrice) <= 0}
                    className="w-full px-4 py-2 bg-[#ec2224] text-white rounded-lg hover:bg-[#d11f21] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Save Pricing
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-6 text-center py-8">
            <div className="text-gray-500 italic">
              Pricing information not available
            </div>
          </div>
        )}
      </div>
    </div>
  );
}