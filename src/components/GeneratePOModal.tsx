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
  deliveryCompany: string;
  deliveryAddress: string;
  deliveryPIC: string;
  vendorName: string;
  vendorAddress: string;
  vendorPIC: string;
  items: Array<{
    prNumber: string;
    brand: string;
    itemName: string;
    quantity: number;
    uom: string;
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
    
    // Get islands from property addresses (simplified - you'd have actual island data)
    const islands = new Set<string>();
    filteredItems.forEach(({ request }) => {
      // Mock logic: extract island from address or use a mapping
      if (request.propertyAddress.includes('Jakarta') || request.propertyAddress.includes('Bandung')) {
        islands.add('Java');
      } else if (request.propertyAddress.includes('Bali')) {
        islands.add('Bali');
      } else {
        islands.add('Other');
      }
    });
    
    return Array.from(islands);
  };

  // Get payment terms for selected vendor + island
  const getAvailablePaymentTerms = () => {
    if (!selectedVendor || !selectedIsland) return [];
    
    const availableItems = getAvailableItems();
    const filteredItems = availableItems.filter(({ request, item }) => {
      const island = request.propertyAddress.includes('Jakarta') || request.propertyAddress.includes('Bandung') 
        ? 'Java' 
        : request.propertyAddress.includes('Bali') 
        ? 'Bali' 
        : 'Other';
      return item.vendorName === selectedVendor && island === selectedIsland;
    });
    
    const paymentTerms = new Set(filteredItems.map(({ item }) => item.paymentTerms));
    return Array.from(paymentTerms).filter(Boolean) as string[];
  };

  // Count items matching criteria
  const getMatchingItemsCount = (vendor?: string, island?: string, paymentTerms?: string) => {
    const availableItems = getAvailableItems();
    
    return availableItems.filter(({ request, item }) => {
      const itemIsland = request.propertyAddress.includes('Jakarta') || request.propertyAddress.includes('Bandung') 
        ? 'Java' 
        : request.propertyAddress.includes('Bali') 
        ? 'Bali' 
        : 'Other';
      
      if (vendor && item.vendorName !== vendor) return false;
      if (island && itemIsland !== island) return false;
      if (paymentTerms && item.paymentTerms !== paymentTerms) return false;
      
      return true;
    }).length;
  };

  const handleNext = () => {
    // Compile matching items
    const availableItems = getAvailableItems();
    const matchingItems = availableItems.filter(({ request, item }) => {
      const island = request.propertyAddress.includes('Jakarta') || request.propertyAddress.includes('Bandung') 
        ? 'Java' 
        : request.propertyAddress.includes('Bali') 
        ? 'Bali' 
        : 'Other';
      
      return item.vendorName === selectedVendor && 
             island === selectedIsland && 
             item.paymentTerms === selectedPaymentTerms;
    });

    if (matchingItems.length === 0) {
      alert('No items match the selected criteria');
      return;
    }

    // Generate PO Number
    const poNumber = `PO2025000${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}VIIDRMI`;
    const poDate = new Date().toISOString().split('T')[0];

    // Get vendor info
    const vendor = vendors.find(v => v.vendorName === selectedVendor);

    // Compile PO data
    const compiledPOData: POData = {
      poNumber,
      poDate,
      deliveryCompany: 'PT REDDOORZ MANAGEMENT INDONESIA',
      deliveryAddress: 'Wisma BNI 46, LT 25, Jl. Jenderal Sudirman No.Kav. 1, RT.1/RW.8, Karet Tengsin, Kecamatan Tanah Abang, Kota Jakarta Pusat, Daerah Khusus Ibukota Jakarta 10220',
      deliveryPIC: 'Arini Prima Setianingsih',
      vendorName: selectedVendor,
      vendorAddress: vendor?.vendorAddress || '',
      vendorPIC: 'Vendor PIC',
      items: matchingItems.map(({ request, item }) => ({
        prNumber: request.prNumber,
        brand: request.brandName,
        itemName: `${item.itemName} - ${Object.values(item.selectedProperties).join(', ')}`,
        quantity: item.quantity,
        uom: item.uom,
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
          status: 'Waiting Delivery' as const,
          poNumber: poData.poNumber,
          poDate: poData.poDate,
          poFileLink: '#',
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
    alert(`PO ${poData.poNumber} generated successfully!\n\n${poData.items.length} items included.`);
    onClose();
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

          {/* Content */}
          <div className="px-8 py-6">
            {step === 'selection' ? (
              <div className="space-y-6">
                <p className="text-gray-600 mb-6">Select criteria to compile PO:</p>

                {/* Vendor Selection */}
                <div>
                  <label className="block text-gray-900 mb-3">
                    1. Select Vendor <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedVendor}
                    onChange={(e) => {
                      setSelectedVendor(e.target.value);
                      setSelectedIsland('');
                      setSelectedPaymentTerms('');
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ec2224] text-lg"
                    disabled={availableVendors.length === 0}
                  >
                    <option value="">Choose Vendor</option>
                    {availableVendors.map((vendor) => (
                      <option key={vendor} value={vendor}>
                        {vendor} ({getMatchingItemsCount(vendor)} items ready)
                      </option>
                    ))}
                  </select>
                  {availableVendors.length === 0 && (
                    <p className="text-sm text-amber-600 mt-2">
                      ⚠️ No vendors with items ready for PO generation
                    </p>
                  )}
                </div>

                {selectedVendor && (
                  <div className="flex items-center text-gray-400">
                    <ChevronRight className="w-6 h-6" />
                  </div>
                )}

                {/* Island Selection */}
                {selectedVendor && (
                  <div>
                    <label className="block text-gray-900 mb-3">
                      2. Select Island <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedIsland}
                      onChange={(e) => {
                        setSelectedIsland(e.target.value);
                        setSelectedPaymentTerms('');
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ec2224] text-lg"
                    >
                      <option value="">Choose Island</option>
                      {availableIslands.map((island) => (
                        <option key={island} value={island}>
                          {island} ({getMatchingItemsCount(selectedVendor, island)} items)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {selectedIsland && (
                  <div className="flex items-center text-gray-400">
                    <ChevronRight className="w-6 h-6" />
                  </div>
                )}

                {/* Payment Terms Selection */}
                {selectedIsland && (
                  <div>
                    <label className="block text-gray-900 mb-3">
                      3. Select Payment Terms <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedPaymentTerms}
                      onChange={(e) => setSelectedPaymentTerms(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ec2224] text-lg"
                    >
                      <option value="">Choose Payment Terms</option>
                      {availablePaymentTerms.map((terms) => (
                        <option key={terms} value={terms}>
                          {terms} ({getMatchingItemsCount(selectedVendor, selectedIsland, terms)} items)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Next Button */}
                {selectedVendor && selectedIsland && selectedPaymentTerms && (
                  <div className="pt-6 border-t border-gray-200">
                    <button
                      onClick={handleNext}
                      className="w-full px-6 py-3 bg-[#ec2224] text-white rounded-lg hover:bg-[#d11f21] transition-colors text-lg"
                    >
                      Next: Preview Items ({getMatchingItemsCount(selectedVendor, selectedIsland, selectedPaymentTerms)} items)
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Preview Screen */
              <div className="space-y-6">
                {poData && (
                  <>
                    {/* PO Header */}
                    <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                      <h3 className="text-gray-900 border-b border-gray-300 pb-2">PO Header Information</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-gray-600 text-sm">PO Number</label>
                          <input
                            type="text"
                            value={poData.poNumber}
                            onChange={(e) => setPOData({ ...poData, poNumber: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-gray-600 text-sm">PO Date</label>
                          <input
                            type="date"
                            value={poData.poDate}
                            onChange={(e) => setPOData({ ...poData, poDate: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-gray-600 text-sm">Payment Terms</label>
                          <input
                            type="text"
                            value={selectedPaymentTerms}
                            disabled
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg mt-1 bg-gray-100"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Delivery Information */}
                    <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                      <h3 className="text-gray-900 border-b border-gray-300 pb-2">Delivery Information</h3>
                      <div>
                        <label className="text-gray-600 text-sm">Please deliver to</label>
                        <input
                          type="text"
                          value={poData.deliveryCompany}
                          onChange={(e) => setPOData({ ...poData, deliveryCompany: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-gray-600 text-sm">Address</label>
                        <textarea
                          value={poData.deliveryAddress}
                          onChange={(e) => setPOData({ ...poData, deliveryAddress: e.target.value })}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-gray-600 text-sm">PIC</label>
                        <input
                          type="text"
                          value={poData.deliveryPIC}
                          onChange={(e) => setPOData({ ...poData, deliveryPIC: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg mt-1"
                        />
                      </div>
                    </div>

                    {/* Vendor Information */}
                    <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                      <h3 className="text-gray-900 border-b border-gray-300 pb-2">Vendor Information</h3>
                      <div>
                        <label className="text-gray-600 text-sm">To (Vendor Name)</label>
                        <input
                          type="text"
                          value={poData.vendorName}
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg mt-1 bg-gray-100"
                        />
                      </div>
                      <div>
                        <label className="text-gray-600 text-sm">Vendor Address</label>
                        <input
                          type="text"
                          value={poData.vendorAddress}
                          onChange={(e) => setPOData({ ...poData, vendorAddress: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-gray-600 text-sm">Vendor PIC</label>
                        <input
                          type="text"
                          value={poData.vendorPIC}
                          onChange={(e) => setPOData({ ...poData, vendorPIC: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg mt-1"
                        />
                      </div>
                    </div>

                    {/* Delivery Detail Table */}
                    <div>
                      <h3 className="text-gray-900 mb-3 border-b border-gray-300 pb-2">Delivery Detail</h3>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                        <p className="text-sm text-blue-700">
                          💡 Set Item Status for each item before generating PO. Click any dropdown to change the status.
                        </p>
                      </div>
                      <div className="overflow-x-auto border border-gray-300 rounded-lg">
                        <table className="w-full">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="px-3 py-2 text-left text-sm text-gray-700">No</th>
                              <th className="px-3 py-2 text-left text-sm text-gray-700">Item Status</th>
                              <th className="px-3 py-2 text-left text-sm text-gray-700">Brand</th>
                              <th className="px-3 py-2 text-left text-sm text-gray-700">Item Name</th>
                              <th className="px-3 py-2 text-left text-sm text-gray-700">Qty</th>
                              <th className="px-3 py-2 text-left text-sm text-gray-700">UoM</th>
                              <th className="px-3 py-2 text-left text-sm text-gray-700">PIC</th>
                              <th className="px-3 py-2 text-left text-sm text-gray-700">Property Code</th>
                              <th className="px-3 py-2 text-left text-sm text-gray-700">Property Name</th>
                            </tr>
                          </thead>
                          <tbody>
                            {poData.items.map((item, index) => {
                              const statusColors = {
                                'Not Set': 'bg-gray-100 text-gray-800 border-gray-300',
                                'Ready': 'bg-green-50 text-green-800 border-green-300',
                                'Cancelled': 'bg-red-50 text-red-800 border-red-300'
                              };
                              const statusColor = statusColors[item.itemStatus as keyof typeof statusColors] || statusColors['Not Set'];
                              
                              return (
                                <tr key={index} className="border-t border-gray-200">
                                  <td className="px-3 py-2 text-sm">{index + 1}</td>
                                  <td className="px-3 py-2 text-sm">
                                    <select
                                      value={item.itemStatus}
                                      onChange={(e) => {
                                        const updatedItems = [...poData.items];
                                        updatedItems[index] = { ...item, itemStatus: e.target.value as 'Not Set' | 'Ready' | 'Cancelled' };
                                        setPOData({ ...poData, items: updatedItems });
                                      }}
                                      className={`px-2 py-1 border rounded text-xs ${statusColor}`}
                                    >
                                      <option value="Not Set">Not Set</option>
                                      <option value="Ready">Ready</option>
                                      <option value="Cancelled">Cancelled</option>
                                    </select>
                                  </td>
                                  <td className="px-3 py-2 text-sm">{item.brand}</td>
                                  <td className="px-3 py-2 text-sm">{item.itemName}</td>
                                  <td className="px-3 py-2 text-sm">{item.quantity}</td>
                                  <td className="px-3 py-2 text-sm">{item.uom}</td>
                                  <td className="px-3 py-2 text-sm">{item.pic}</td>
                                  <td className="px-3 py-2 text-sm">{item.propertyCode}</td>
                                  <td className="px-3 py-2 text-sm">{item.propertyName}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Summary */}
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <div className="text-gray-900 border-b border-gray-300 pb-2 mb-2">
                        <strong>Total Summary</strong>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-gray-600">Total Items:</div>
                          <div className="text-lg text-gray-900">{poData.items.length}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">From PRs:</div>
                          <div className="text-lg text-gray-900">{new Set(poData.items.map(i => i.prNumber)).size}</div>
                        </div>
                      </div>
                      <div className="border-t border-gray-300 pt-2 mt-2">
                        <div className="text-sm space-y-1">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Items Ready:</span>
                            <span className="text-green-700 font-medium">{poData.items.filter(i => i.itemStatus === 'Ready').length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Items Not Set:</span>
                            <span className="text-gray-700">{poData.items.filter(i => i.itemStatus === 'Not Set').length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Items Cancelled:</span>
                            <span className="text-red-700">{poData.items.filter(i => i.itemStatus === 'Cancelled').length}</span>
                          </div>
                        </div>
                      </div>
                      <div className="border-t border-gray-300 pt-2 mt-2">
                        <div className="flex justify-between text-lg">
                          <span className="text-gray-900 font-medium">Total Quantity:</span>
                          <span className="text-gray-900">{poData.items.reduce((sum, item) => sum + item.quantity, 0)} items</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-8 py-6 flex justify-end gap-3">
            {step === 'selection' ? (
              <button
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            ) : (
              <>
                <button
                  onClick={() => setStep('selection')}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  ← Back to Selection
                </button>
                <button
                  onClick={handleExportPO}
                  className="px-6 py-2 bg-[#ec2224] text-white rounded-lg hover:bg-[#d11f21] transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download/Export PO
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}