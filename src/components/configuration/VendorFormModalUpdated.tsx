import { useState } from 'react';
import { X, Plus, Trash2, Upload, ChevronDown, Check } from 'lucide-react';
import { items } from '../../data/mockData';
import type { Vendor } from './VendorManagement';
import MultiSelectDropdown from './MultiSelectDropdown';

interface VendorFormModalProps {
  vendor: Vendor | null;
  onClose: () => void;
  onSave: (vendor: Vendor) => void;
  activePaymentMethods: string[];
}

interface VendorItem {
  itemCode: string;
  itemName: string;
  selectedProperties: Record<string, string>;
  minQuantity: number;
  multipleOf: number;
  priceType: 'Fixed' | 'Not Fixed';
  unitPrice: number;
  agreementNumber: string;
  taxPercentage: number;
}

interface Agreement {
  id: string;
  type: 'Agreement' | 'Offering';
  number: string;
  startDate: string;
  endDate: string;
  documentLink?: string;
}

export default function VendorFormModal({ vendor, onClose, onSave, activePaymentMethods }: VendorFormModalProps) {
  const [formData, setFormData] = useState<Vendor>(
    vendor || {
      vendorCode: '',
      vendorName: '',
      vendorIsland: '',
      vendorAddress: '',
      vendorEmail: '',
      vendorPhone: '',
      vendorAgreementLink: '',
      ppnPercentage: 11,
      serviceChargePercentage: 0,
      pb1Percentage: 0,
      paymentMethods: [],
      agreements: [],
      items: [],
      isActive: true
    }
  );

  const [vendorItems, setVendorItems] = useState<VendorItem[]>(vendor?.items || []);
  const [agreements, setAgreements] = useState<Agreement[]>(vendor?.agreements || []);
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<string[]>(vendor?.paymentMethods || []);
  
  const [showAddItem, setShowAddItem] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [newItem, setNewItem] = useState<VendorItem>({
    itemCode: '',
    itemName: '',
    selectedProperties: {},
    minQuantity: 1,
    multipleOf: 1,
    priceType: 'Fixed',
    unitPrice: 0,
    agreementNumber: '',
    taxPercentage: 11
  });

  const [showBulkUpload, setShowBulkUpload] = useState(false);

  const activeItems = items.filter(item => item.isActive);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleItemSelect = (itemCode: string) => {
    const selectedItem = items.find((i) => i.itemCode === itemCode);
    if (selectedItem) {
      setNewItem({
        itemCode: selectedItem.itemCode,
        itemName: selectedItem.itemName,
        selectedProperties: {},
        minQuantity: 1,
        multipleOf: 1,
        priceType: 'Fixed',
        unitPrice: 0,
        agreementNumber: '',
        taxPercentage: formData.ppnPercentage
      });
    }
  };

  const handlePropertySelect = (propertyName: string, value: string) => {
    setNewItem((prev) => ({
      ...prev,
      selectedProperties: {
        ...prev.selectedProperties,
        [propertyName]: value
      }
    }));
  };

  const handleAddItemToVendor = () => {
    if (!newItem.itemCode || newItem.minQuantity <= 0 || newItem.taxPercentage < 0) {
      alert('Please fill in all required fields');
      return;
    }

    if (newItem.priceType === 'Fixed') {
      if (newItem.unitPrice <= 0) {
        alert('Unit price is required for fixed price items');
        return;
      }
      if (!newItem.agreementNumber) {
        alert('Agreement/Offering number is required for fixed price items');
        return;
      }
    }

    if (editingItemIndex !== null) {
      setVendorItems((prev) => prev.map((item, idx) => idx === editingItemIndex ? newItem : item));
      setEditingItemIndex(null);
    } else {
      setVendorItems((prev) => [...prev, newItem]);
    }

    setNewItem({
      itemCode: '',
      itemName: '',
      selectedProperties: {},
      minQuantity: 1,
      multipleOf: 1,
      priceType: 'Fixed',
      unitPrice: 0,
      agreementNumber: '',
      taxPercentage: formData.ppnPercentage
    });
    setShowAddItem(false);
  };

  const handleEditItem = (index: number) => {
    setNewItem(vendorItems[index]);
    setEditingItemIndex(index);
    setShowAddItem(true);
  };

  const handleDeleteItem = (index: number) => {
    setVendorItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddAgreement = () => {
    const newAgreement: Agreement = {
      id: `agr-${Date.now()}`,
      type: 'Agreement',
      number: '',
      startDate: '',
      endDate: '',
      documentLink: ''
    };
    setAgreements([...agreements, newAgreement]);
  };

  const handleAgreementChange = (index: number, field: string, value: string) => {
    setAgreements(prev => prev.map((agr, idx) => 
      idx === index ? { ...agr, [field]: value } : agr
    ));
  };

  const handleRemoveAgreement = (index: number) => {
    setAgreements(prev => prev.filter((_, idx) => idx !== index));
  };

  const handlePaymentMethodToggle = (method: string) => {
    setSelectedPaymentMethods(prev => 
      prev.includes(method) 
        ? prev.filter(m => m !== method)
        : [...prev, method]
    );
  };

  const handleSave = () => {
    if (!formData.vendorCode || !formData.vendorName) {
      alert('Please fill in vendor code and name');
      return;
    }

    if (selectedPaymentMethods.length === 0) {
      alert('Please select at least one payment method');
      return;
    }

    const updatedVendor = {
      ...formData,
      items: vendorItems,
      agreements: agreements,
      paymentMethods: selectedPaymentMethods
    };

    onSave(updatedVendor);
  };

  const handleDownloadTemplate = () => {
    alert('Excel template download would be implemented here');
  };

  const handleBulkUpload = () => {
    alert('Bulk upload functionality would be implemented here');
  };

  const selectedItemData = newItem.itemCode ? items.find(i => i.itemCode === newItem.itemCode) : null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
            <h2 className="text-gray-900">
              {vendor ? 'Edit Vendor' : 'Add New Vendor'}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-6 space-y-6">
            {/* Vendor Information */}
            <div>
              <h3 className="text-gray-900 mb-4">Vendor Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 mb-2">
                    Vendor Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.vendorCode}
                    onChange={(e) => handleInputChange('vendorCode', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ec2224]"
                    placeholder="VND001"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">
                    Vendor Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.vendorName}
                    onChange={(e) => handleInputChange('vendorName', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ec2224]"
                    placeholder="PT Example Company"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">Vendor Island</label>
                  <select
                    value={formData.vendorIsland}
                    onChange={(e) => handleInputChange('vendorIsland', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ec2224]"
                  >
                    <option value="">Select Island</option>
                    <option value="Java">Java</option>
                    <option value="Bali">Bali</option>
                    <option value="Sumatra">Sumatra</option>
                    <option value="Kalimantan">Kalimantan</option>
                    <option value="Sulawesi">Sulawesi</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">Vendor Email</label>
                  <input
                    type="email"
                    value={formData.vendorEmail}
                    onChange={(e) => handleInputChange('vendorEmail', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ec2224]"
                    placeholder="contact@vendor.com"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-gray-700 mb-2">Vendor Address</label>
                  <textarea
                    value={formData.vendorAddress}
                    onChange={(e) => handleInputChange('vendorAddress', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ec2224]"
                    rows={2}
                    placeholder="Full address"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">Vendor Phone</label>
                  <input
                    type="text"
                    value={formData.vendorPhone}
                    onChange={(e) => handleInputChange('vendorPhone', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ec2224]"
                    placeholder="+62 21 1234 5678"
                  />
                </div>
              </div>
            </div>

            {/* Tax Configuration */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-gray-900 mb-4">Tax Configuration</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-gray-700 mb-2">
                    PPN (%) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.ppnPercentage}
                    onChange={(e) => handleInputChange('ppnPercentage', parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ec2224]"
                    placeholder="11"
                  />
                  <p className="text-gray-500 text-sm mt-1">(VAT - Value Added Tax)</p>
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">Service Charge (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.serviceChargePercentage}
                    onChange={(e) => handleInputChange('serviceChargePercentage', parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ec2224]"
                    placeholder="0"
                  />
                  <p className="text-gray-500 text-sm mt-1">(Optional, default: 0)</p>
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">PB1 (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.pb1Percentage}
                    onChange={(e) => handleInputChange('pb1Percentage', parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ec2224]"
                    placeholder="0"
                  />
                  <p className="text-gray-500 text-sm mt-1">(Optional, default: 0)</p>
                </div>
              </div>
            </div>

            {/* Agreement/Offering Information */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-900">Agreement / Offering Information</h3>
                <button
                  onClick={handleAddAgreement}
                  className="text-[#ec2224] hover:text-[#d11f21] text-sm flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Add Agreement/Offering
                </button>
              </div>

              {agreements.length === 0 ? (
                <p className="text-gray-500 text-sm">No agreements/offerings added yet</p>
              ) : (
                <div className="space-y-4">
                  {agreements.map((agreement, index) => (
                    <div key={agreement.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-gray-700">Agreement/Offering {index + 1}</h4>
                        <button
                          onClick={() => handleRemoveAgreement(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-gray-700 mb-2">Type</label>
                          <div className="flex gap-4">
                            <label className="flex items-center gap-2">
                              <input
                                type="radio"
                                checked={agreement.type === 'Agreement'}
                                onChange={() => handleAgreementChange(index, 'type', 'Agreement')}
                                className="text-[#ec2224] focus:ring-[#ec2224]"
                              />
                              <span className="text-gray-700">Agreement</span>
                            </label>
                            <label className="flex items-center gap-2">
                              <input
                                type="radio"
                                checked={agreement.type === 'Offering'}
                                onChange={() => handleAgreementChange(index, 'type', 'Offering')}
                                className="text-[#ec2224] focus:ring-[#ec2224]"
                              />
                              <span className="text-gray-700">Offering</span>
                            </label>
                          </div>
                        </div>

                        <div>
                          <label className="block text-gray-700 mb-2">
                            Number <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={agreement.number}
                            onChange={(e) => handleAgreementChange(index, 'number', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ec2224]"
                            placeholder="AGR-2025-001"
                          />
                        </div>

                        <div>
                          <label className="block text-gray-700 mb-2">
                            Start Date <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="date"
                            value={agreement.startDate}
                            onChange={(e) => handleAgreementChange(index, 'startDate', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ec2224]"
                          />
                        </div>

                        <div>
                          <label className="block text-gray-700 mb-2">
                            End Date <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="date"
                            value={agreement.endDate}
                            onChange={(e) => handleAgreementChange(index, 'endDate', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ec2224]"
                          />
                        </div>

                        <div className="col-span-2">
                          <label className="block text-gray-700 mb-2">Document Link (Optional)</label>
                          <input
                            type="url"
                            value={agreement.documentLink || ''}
                            onChange={(e) => handleAgreementChange(index, 'documentLink', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ec2224]"
                            placeholder="https://drive.google.com/..."
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Payment Methods */}
            <div className="border-t border-gray-200 pt-6">
              <MultiSelectDropdown
                options={activePaymentMethods}
                selectedValues={selectedPaymentMethods}
                onChange={setSelectedPaymentMethods}
                label="Payment Methods"
                placeholder="Select payment methods"
                error={selectedPaymentMethods.length === 0 ? '' : undefined}
              />
              {activePaymentMethods.length === 0 && (
                <p className="text-gray-500 text-sm mt-2">No active payment methods. Please add them in Payment Method Configuration.</p>
              )}
            </div>

            {/* Vendor Item/SKU Configuration */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-900">Vendor Item/SKU Configuration</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowBulkUpload(true)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Bulk Update
                  </button>
                  <button
                    onClick={() => {
                      setShowAddItem(true);
                      setEditingItemIndex(null);
                    }}
                    className="px-4 py-2 bg-[#ec2224] text-white rounded-lg hover:bg-[#d11f21] transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Item
                  </button>
                </div>
              </div>

              {/* Items Table */}
              {vendorItems.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No items configured yet</p>
              ) : (
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-gray-700">Item Name</th>
                        <th className="px-4 py-3 text-left text-gray-700">Min Qty</th>
                        <th className="px-4 py-3 text-left text-gray-700">Multiple Of</th>
                        <th className="px-4 py-3 text-left text-gray-700">Unit Price</th>
                        <th className="px-4 py-3 text-left text-gray-700">WHT (%)</th>
                        <th className="px-4 py-3 text-left text-gray-700">Price Type</th>
                        <th className="px-4 py-3 text-right text-gray-700">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {vendorItems.map((item, index) => {
                        const properties = Object.entries(item.selectedProperties)
                          .map(([key, value]) => value)
                          .join(', ');
                        const itemDisplay = properties ? `${item.itemName} - ${properties}` : item.itemName;

                        return (
                          <tr key={index}>
                            <td className="px-4 py-3 text-gray-900">{itemDisplay}</td>
                            <td className="px-4 py-3 text-gray-700">{item.minQuantity}</td>
                            <td className="px-4 py-3 text-gray-700">{item.multipleOf}</td>
                            <td className="px-4 py-3 text-gray-700">
                              {item.priceType === 'Fixed' ? item.unitPrice.toLocaleString('id-ID') : '-'}
                            </td>
                            <td className="px-4 py-3 text-gray-700">{item.taxPercentage}%</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-sm ${
                                item.priceType === 'Fixed' 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {item.priceType}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => handleEditItem(index)}
                                className="text-[#ec2224] hover:text-[#d11f21] mr-3"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteItem(index)}
                                className="text-red-600 hover:text-red-700"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-[#ec2224] text-white rounded-lg hover:bg-[#d11f21] transition-colors"
            >
              {vendor ? 'Update Vendor' : 'Add Vendor'}
            </button>
          </div>
        </div>
      </div>

      {/* Add/Edit Item Modal */}
      {showAddItem && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-[60]" onClick={() => setShowAddItem(false)} />
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="border-b border-gray-200 px-6 py-4">
                <h3 className="text-gray-900">{editingItemIndex !== null ? 'Edit Item' : 'Add Item'}</h3>
              </div>

              <div className="px-6 py-6 space-y-4">
                {/* Item Selection */}
                <div>
                  <label className="block text-gray-700 mb-2">
                    Choose Item <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newItem.itemCode}
                    onChange={(e) => handleItemSelect(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ec2224]"
                    disabled={editingItemIndex !== null}
                  >
                    <option value="">Select Item</option>
                    {activeItems.map((item) => (
                      <option key={item.itemCode} value={item.itemCode}>
                        {item.itemName} ({item.itemCategory})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Item Specification */}
                {selectedItemData && selectedItemData.properties.length > 0 && (
                  <div className="grid grid-cols-2 gap-4">
                    {selectedItemData.properties.map((prop) => (
                      <div key={prop.name}>
                        <label className="block text-gray-700 mb-2">{prop.name}</label>
                        <select
                          value={newItem.selectedProperties[prop.name] || ''}
                          onChange={(e) => handlePropertySelect(prop.name, e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ec2224]"
                        >
                          <option value="">Select {prop.name}</option>
                          {prop.values.map((value) => (
                            <option key={value} value={value}>
                              {value}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                )}

                {/* Minimum Quantity */}
                <div>
                  <label className="block text-gray-700 mb-2">
                    Minimum Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={newItem.minQuantity}
                    onChange={(e) => setNewItem({ ...newItem, minQuantity: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ec2224]"
                    min="1"
                  />
                </div>

                {/* Multiple Of */}
                <div>
                  <label className="block text-gray-700 mb-2">
                    Multiple Of <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={newItem.multipleOf}
                    onChange={(e) => setNewItem({ ...newItem, multipleOf: parseInt(e.target.value) || 1 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ec2224]"
                    min="1"
                  />
                  <p className="text-gray-500 text-sm mt-1">Items must be ordered in multiples of this number</p>
                </div>

                {/* Price Type */}
                <div>
                  <label className="block text-gray-700 mb-2">
                    Price Type <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={newItem.priceType === 'Fixed'}
                        onChange={() => setNewItem({ ...newItem, priceType: 'Fixed' })}
                        className="text-[#ec2224] focus:ring-[#ec2224]"
                      />
                      <span className="text-gray-700">Fixed Price</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={newItem.priceType === 'Not Fixed'}
                        onChange={() => setNewItem({ ...newItem, priceType: 'Not Fixed', unitPrice: 0, agreementNumber: '' })}
                        className="text-[#ec2224] focus:ring-[#ec2224]"
                      />
                      <span className="text-gray-700">Not Fixed Price</span>
                    </label>
                  </div>
                </div>

                {/* Fixed Price Fields */}
                {newItem.priceType === 'Fixed' && (
                  <>
                    <div>
                      <label className="block text-gray-700 mb-2">
                        Unit Price (IDR) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={newItem.unitPrice}
                        onChange={(e) => setNewItem({ ...newItem, unitPrice: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ec2224]"
                        min="0"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 mb-2">
                        Agreement/Offering Number <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={newItem.agreementNumber}
                        onChange={(e) => setNewItem({ ...newItem, agreementNumber: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ec2224]"
                      >
                        <option value="">Select Agreement/Offering</option>
                        {agreements.map((agr) => (
                          <option key={agr.id} value={agr.number}>
                            {agr.number} ({agr.type})
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {/* Not Fixed Price Info */}
                {newItem.priceType === 'Not Fixed' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-blue-800 text-sm">
                      💡 Price will be negotiated per order. Unit price and agreement number are not required.
                    </p>
                  </div>
                )}

                {/* Tax Percentage */}
                <div>
                  <label className="block text-gray-700 mb-2">
                    WHT (%) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newItem.taxPercentage}
                    onChange={(e) => setNewItem({ ...newItem, taxPercentage: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ec2224]"
                    min="0"
                    max="100"
                  />
                  <p className="text-gray-500 text-sm mt-1">(Withholding Tax) Enter percentage value (e.g., 11, 0, 9, 18, 12)</p>
                </div>
              </div>

              <div className="border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowAddItem(false);
                    setEditingItemIndex(null);
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddItemToVendor}
                  className="px-6 py-2 bg-[#ec2224] text-white rounded-lg hover:bg-[#d11f21] transition-colors"
                >
                  {editingItemIndex !== null ? 'Update Item' : 'Add Item'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Bulk Upload Modal */}
      {showBulkUpload && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-[60]" onClick={() => setShowBulkUpload(false)} />
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
              <div className="border-b border-gray-200 px-6 py-4">
                <h3 className="text-gray-900">Bulk Update Vendor Items</h3>
              </div>

              <div className="px-6 py-6 space-y-4">
                <p className="text-gray-700">Upload Excel file to bulk update vendor item configuration</p>

                <div>
                  <h4 className="text-gray-700 mb-2">Step 1: Download Template</h4>
                  <button
                    onClick={handleDownloadTemplate}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Download Excel Template
                  </button>
                </div>

                <div>
                  <h4 className="text-gray-700 mb-2">Step 2: Fill in the template with your data</h4>
                </div>

                <div>
                  <h4 className="text-gray-700 mb-2">Step 3: Upload completed file</h4>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 mb-2">Drag & drop Excel file here or click to browse</p>
                    <p className="text-gray-500 text-sm">Accepted formats: .xlsx, .xls (Max size: 5MB)</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
                <button
                  onClick={() => setShowBulkUpload(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkUpload}
                  className="px-6 py-2 bg-[#ec2224] text-white rounded-lg hover:bg-[#d11f21] transition-colors"
                >
                  Upload & Update
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}