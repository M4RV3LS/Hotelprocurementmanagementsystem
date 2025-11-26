import { useState } from 'react';
import { X, ChevronRight, Download } from 'lucide-react';
import { vendors, procurementRequests, type ProcurementRequest, type ProcurementItem } from '../data/mockData';

interface GeneratePOModalProps {
  onClose: () => void;
  onGenerate: (poRequests: ProcurementRequest[]) => void;
}

interface POData {
  poNumber: string;
  poDate: string;
  etaStart: string;
  etaEnd: string;
  paymentTerms: string;
  vendorName: string;
  vendorAddress: string;
  vendorPIC: string;
  // Tax config from vendor
  ppnPercentage: number;
  serviceChargePercentage: number;
  pb1Percentage: number;
  whtPercentage: number;
  items: Array<{
    prNumber: string;
    brand: string;
    itemName: string;
    quantity: number;
    uom: string;
    unitPrice: number;
    whtPercentage: number;
    pic: string;
    propertyCode: string;
    propertyName: string;
    propertyAddress: string;
    itemStatus: 'Not Set' | 'Ready' | 'Cancelled';
  }>;
}

type StepType = 'selection' | 'preview';

export default function GeneratePOModal({ onClose, onGenerate }: GeneratePOModalProps) {
  const [step, setStep] = useState<StepType>('selection');
  
  // Selection state
  const [selectedVendor, setSelectedVendor] = useState('');
  const [selectedIsland, setSelectedIsland] = useState('');
  const [selectedPaymentTerms, setSelectedPaymentTerms] = useState('');
  
  // Preview state
  const [poData, setPOData] = useState<POData | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Get items ready for PO (Waiting PO status + has vendor + has pricing)
  const getAvailableItems = () => {
    const items: Array<{ request: ProcurementRequest; item: ProcurementItem }> = [];
    
    procurementRequests.forEach(request => {
      if (request.status === 'Waiting PO') {
        request.items.forEach(item => {
          if (item.vendorName && item.unitPrice && item.unitPrice > 0) {
            items.push({ request, item });
          }
        });
      }
    });
    
    return items;
  };

  // Get unique vendors from available items
  const getAvailableVendors = () => {
    const availableItems = getAvailableItems();
    const uniqueVendors = new Set(availableItems.map(({ item }) => item.vendorName));
    return Array.from(uniqueVendors).filter(Boolean) as string[];
  };

  // Get islands for selected vendor
  const getAvailableIslands = () => {
    if (!selectedVendor) return [];
    
    const availableItems = getAvailableItems();
    const filteredItems = availableItems.filter(({ item }) => item.vendorName === selectedVendor);
    
    // Get unique islands from properties (simplified)
    const islands = new Set<string>();
    filteredItems.forEach(({ request }) => {
      // In real app, you'd have island data - for now, use placeholder
      islands.add('Java');
      islands.add('Bali');
    });
    
    return Array.from(islands);
  };

  // Get payment terms for selected vendor
  const getAvailablePaymentTerms = () => {
    if (!selectedVendor) return [];
    
    const availableItems = getAvailableItems();
    const filteredItems = availableItems.filter(({ item }) => item.vendorName === selectedVendor);
    
    const uniquePaymentTerms = new Set(filteredItems.map(({ item }) => item.paymentTerms));
    return Array.from(uniquePaymentTerms).filter(Boolean) as string[];
  };

  const handleGeneratePO = () => {
    if (!selectedVendor) {
      alert('Please select a vendor');
      return;
    }

    // Get matching items
    const availableItems = getAvailableItems();
    let matchingItems = availableItems.filter(({ item }) => item.vendorName === selectedVendor);
    
    if (selectedIsland) {
      // Filter by island if specified
      matchingItems = matchingItems.filter(({ request }) => {
        // Simplified island matching - in real app, you'd have proper island data
        return true;
      });
    }
    
    if (selectedPaymentTerms) {
      matchingItems = matchingItems.filter(({ item }) => item.paymentTerms === selectedPaymentTerms);
    }

    if (matchingItems.length === 0) {
      alert('No items found matching the criteria');
      return;
    }

    // Generate PO Number
    const poNumber = `PO2025000${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}VIIDRMI`;
    const poDate = new Date().toISOString().split('T')[0];

    // Get vendor info with tax config
    const vendor = vendors.find(v => v.vendorName === selectedVendor);

    // Compile PO data
    const compiledPOData: POData = {
      poNumber,
      poDate,
      etaStart: '',
      etaEnd: '',
      paymentTerms: selectedPaymentTerms,
      vendorName: selectedVendor,
      vendorAddress: vendor?.vendorAddress || '',
      vendorPIC: 'Vendor PIC',
      ppnPercentage: vendor?.ppnPercentage || 11,
      serviceChargePercentage: vendor?.serviceChargePercentage || 0,
      pb1Percentage: vendor?.pb1Percentage || 0,
      whtPercentage: vendor?.whtPercentage || 0,
      items: matchingItems.map(({ request, item }) => ({
        prNumber: request.prNumber,
        brand: request.brandName,
        itemName: `${item.itemName} - ${Object.values(item.selectedProperties).join(', ')}`,
        quantity: item.quantity,
        uom: item.uom,
        unitPrice: item.unitPrice || 0,
        whtPercentage: item.whtPercentage || 0,
        pic: request.picName,
        propertyCode: request.propertyCode,
        propertyName: request.propertyName,
        propertyAddress: request.propertyAddress,
        itemStatus: 'Not Set'
      }))
    };

    setPOData(compiledPOData);
    setStep('preview');
  };

  const handleExportPO = () => {
    if (!poData) return;

    // Update all matching requests and items with Item Status
    const updatedRequests = procurementRequests.map(request => {
      const matchingPOItems = poData.items.filter(poItem => poItem.prNumber === request.prNumber);
      
      if (matchingPOItems.length > 0) {
        // Update items with their Item Status from PO
        const updatedItems = request.items.map(item => {
          const poItem = matchingPOItems.find(poi => 
            poi.itemName.includes(item.itemName)
          );
          
          if (poItem) {
            return {
              ...item,
              itemStatus: poItem.itemStatus
            };
          }
          return item;
        });

        return {
          ...request,
          status: 'On Process by Vendor' as const,
          poNumber: poData.poNumber,
          poDate: poData.poDate,
          poFileLink: '#',
          estimatedDeliveryStart: poData.etaStart,
          estimatedDeliveryEnd: poData.etaEnd,
          items: updatedItems
        };
      }

      return request;
    });

    // Call onGenerate with updated requests
    const matchingRequests = updatedRequests.filter(req => 
      poData.items.some(poItem => poItem.prNumber === req.prNumber)
    );

    onGenerate(matchingRequests);
    alert(`PO ${poData.poNumber} generated successfully!\n\n${poData.items.length} items included.\nETA: ${poData.etaStart} to ${poData.etaEnd}`);
    onClose();
  };

  const handleItemStatusChange = (index: number, newStatus: 'Not Set' | 'Ready' | 'Cancelled') => {
    if (!poData) return;
    
    const updatedItems = [...poData.items];
    updatedItems[index] = { ...updatedItems[index], itemStatus: newStatus };
    setPOData({ ...poData, items: updatedItems });
  };

  const handleWHTChange = (index: number, newWHT: number) => {
    if (!poData) return;
    
    const updatedItems = [...poData.items];
    updatedItems[index] = { ...updatedItems[index], whtPercentage: newWHT };
    setPOData({ ...poData, items: updatedItems });
  };

  // Calculate tax breakdown
  const calculateTaxBreakdown = () => {
    if (!poData) return { subtotal: 0, ppn: 0, serviceCharge: 0, pb1: 0, total: 0 };

    const subtotal = poData.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    const ppn = (subtotal * poData.ppnPercentage) / 100;
    const serviceCharge = (subtotal * poData.serviceChargePercentage) / 100;
    const pb1 = (subtotal * poData.pb1Percentage) / 100;
    const total = subtotal + ppn + serviceCharge + pb1;

    return { subtotal, ppn, serviceCharge, pb1, total };
  };

  const availableVendors = getAvailableVendors();
  const availableIslands = getAvailableIslands();
  const availablePaymentTerms = getAvailablePaymentTerms();

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 flex items-center justify-between z-10">
            <h2 className="text-gray-900">Generate Purchase Order</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Body */}
          <div className="px-8 py-6">
            {step === 'selection' ? (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-900">
                    Select vendor, island (optional), and payment terms (optional) to generate a Purchase Order.
                    Only items with "Waiting PO" status that have vendor and pricing will be included.
                  </p>
                </div>

                {/* Selection Form */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-700 mb-2">
                      Vendor <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedVendor}
                      onChange={(e) => {
                        setSelectedVendor(e.target.value);
                        setSelectedIsland('');
                        setSelectedPaymentTerms('');
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ec2224]"
                    >
                      <option value="">Select Vendor</option>
                      {availableVendors.map((vendor) => (
                        <option key={vendor} value={vendor}>
                          {vendor}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 mb-2">Island (Optional)</label>
                      <select
                        value={selectedIsland}
                        onChange={(e) => setSelectedIsland(e.target.value)}
                        disabled={!selectedVendor}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ec2224] disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        <option value="">All Islands</option>
                        {availableIslands.map((island) => (
                          <option key={island} value={island}>
                            {island}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-gray-700 mb-2">Payment Terms (Optional)</label>
                      <select
                        value={selectedPaymentTerms}
                        onChange={(e) => setSelectedPaymentTerms(e.target.value)}
                        disabled={!selectedVendor}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ec2224] disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        <option value="">All Payment Terms</option>
                        {availablePaymentTerms.map((term) => (
                          <option key={term} value={term}>
                            {term}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {availableVendors.length === 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <p className="text-amber-900">
                        ⚠️ No vendors available. Please ensure there are items with "Waiting PO" status that have vendor assignments and pricing configured.
                      </p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={onClose}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleGeneratePO}
                    disabled={!selectedVendor}
                    className="px-6 py-2 bg-[#ec2224] text-white rounded-lg hover:bg-[#d11f21] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    Next: Preview PO
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : (
              /* Preview Step */
              <div className="space-y-6">
                {/* PO Header Info - Now with Editable Payment Terms and ETA */}
                <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-gray-900 mb-3">PO Information</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">PO Number:</span>
                          <span className="text-gray-900">{poData?.poNumber}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">PO Date:</span>
                          <span className="text-gray-900">
                            {poData?.poDate && new Date(poData.poDate).toLocaleDateString('en-GB')}
                          </span>
                        </div>
                        <div>
                          <label className="block text-gray-600 mb-1">Payment Terms:</label>
                          <select
                            value={poData?.paymentTerms || ''}
                            onChange={(e) => {
                              if (poData) {
                                setPOData({ ...poData, paymentTerms: e.target.value });
                              }
                            }}
                            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ec2224]"
                          >
                            <option value="">Select Payment Terms</option>
                            {availablePaymentTerms.map((term) => (
                              <option key={term} value={term}>
                                {term}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-gray-900 mb-3">Vendor & Delivery Information</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Vendor Name:</span>
                          <span className="text-gray-900">{poData?.vendorName}</span>
                        </div>
                        <div>
                          <span className="text-gray-600 block mb-1">Address:</span>
                          <span className="text-gray-900 text-sm">{poData?.vendorAddress}</span>
                        </div>
                        <div>
                          <label className="block text-gray-600 mb-1">ETA (Estimated Time of Arrival):</label>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="date"
                              value={poData?.etaStart || ''}
                              onChange={(e) => {
                                if (poData) {
                                  setPOData({ ...poData, etaStart: e.target.value });
                                }
                              }}
                              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ec2224]"
                            />
                            <input
                              type="date"
                              value={poData?.etaEnd || ''}
                              onChange={(e) => {
                                if (poData) {
                                  setPOData({ ...poData, etaEnd: e.target.value });
                                }
                              }}
                              min={poData?.etaStart}
                              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ec2224]"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-gray-900">Items ({poData?.items.length})</h3>
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className="text-[#ec2224] hover:text-[#d11f21] text-sm"
                    >
                      {isEditing ? 'Done Editing' : 'Edit Item Status'}
                    </button>
                  </div>

                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-gray-700">PR Number</th>
                          <th className="px-4 py-3 text-left text-gray-700">Property</th>
                          <th className="px-4 py-3 text-left text-gray-700">Item</th>
                          <th className="px-4 py-3 text-left text-gray-700">Qty</th>
                          <th className="px-4 py-3 text-right text-gray-700">Unit Price</th>
                          <th className="px-4 py-3 text-center text-gray-700">WHT (%)</th>
                          <th className="px-4 py-3 text-right text-gray-700">Total</th>
                          <th className="px-4 py-3 text-left text-gray-700">Item Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {poData?.items.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-gray-900">{item.prNumber}</td>
                            <td className="px-4 py-3">
                              <div className="text-gray-900">{item.propertyName}</div>
                              <div className="text-gray-600 text-sm">{item.propertyCode}</div>
                              <div className="text-gray-500 text-xs mt-1">{item.propertyAddress}</div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-gray-900">{item.itemName}</div>
                              <div className="text-gray-600 text-sm">{item.brand}</div>
                            </td>
                            <td className="px-4 py-3 text-gray-900">{item.quantity} {item.uom}</td>
                            <td className="px-4 py-3 text-right text-gray-900">
                              Rp {item.unitPrice.toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {isEditing ? (
                                <input
                                  type="number"
                                  value={item.whtPercentage}
                                  onChange={(e) => handleWHTChange(index, parseFloat(e.target.value) || 0)}
                                  className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm focus:outline-none focus:ring-2 focus:ring-[#ec2224]"
                                  min="0"
                                  max="100"
                                  step="0.1"
                                />
                              ) : (
                                <span className="text-gray-900">{item.whtPercentage}%</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right text-gray-900">
                              Rp {(item.unitPrice * item.quantity).toLocaleString()}
                            </td>
                            <td className="px-4 py-3">
                              {isEditing ? (
                                <select
                                  value={item.itemStatus}
                                  onChange={(e) => handleItemStatusChange(index, e.target.value as any)}
                                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ec2224]"
                                >
                                  <option value="Not Set">Not Set</option>
                                  <option value="Ready">Ready</option>
                                  <option value="Cancelled">Cancelled</option>
                                </select>
                              ) : (
                                <span className={`inline-flex px-3 py-1 rounded-full text-sm ${
                                  item.itemStatus === 'Ready' ? 'bg-green-100 text-green-800' :
                                  item.itemStatus === 'Cancelled' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {item.itemStatus}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Tax Breakdown */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-gray-900 mb-4">Tax Breakdown</h3>
                  {(() => {
                    const { subtotal, ppn, serviceCharge, pb1, total } = calculateTaxBreakdown();
                    return (
                      <div className="space-y-2">
                        <div className="flex justify-between text-gray-700">
                          <span>Subtotal:</span>
                          <span>Rp {subtotal.toLocaleString()}</span>
                        </div>
                        {poData && poData.ppnPercentage > 0 && (
                          <div className="flex justify-between text-gray-700">
                            <span>PPN ({poData.ppnPercentage}%):</span>
                            <span>Rp {ppn.toLocaleString()}</span>
                          </div>
                        )}
                        {poData && (
                          <div className="flex justify-between text-gray-700">
                            <span>Service Charge ({poData.serviceChargePercentage}%):</span>
                            <span>Rp {serviceCharge.toLocaleString()}</span>
                          </div>
                        )}
                        {poData && poData.pb1Percentage > 0 && (
                          <div className="flex justify-between text-gray-700">
                            <span>PB1 ({poData.pb1Percentage}%):</span>
                            <span>Rp {pb1.toLocaleString()}</span>
                          </div>
                        )}
                        <div className="border-t-2 border-gray-300 pt-2 flex justify-between text-gray-900">
                          <span>Total Amount:</span>
                          <span className="text-xl">Rp {total.toLocaleString()}</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setStep('selection')}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleExportPO}
                    className="px-6 py-2 bg-[#ec2224] text-white rounded-lg hover:bg-[#d11f21] transition-colors flex items-center gap-2"
                  >
                    <Download className="w-5 h-5" />
                    Generate & Export PO
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}