import { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import type { Item } from './ItemConfiguration';

interface ItemFormModalProps {
  item: Item | null;
  onClose: () => void;
  onSave: (item: Item) => void;
}

const brandNames = [
  'Reddoorz',
  'Reddoorz Premium',
  'RedLiving',
  'Sans',
  'Sans Vibe',
  'Sans Stay',
  'Sans Elite',
  'Urban View',
  'The Lavana',
  'No Branding',
  'Vibes by SANS'
];

const categories = ['Branding Item', 'Ops Item', 'Others'];
const commonUoM = ['pcs', 'units', 'meters', 'liters', 'kg', 'sets', 'custom'];

export default function ItemFormModal({ item, onClose, onSave }: ItemFormModalProps) {
  const [formData, setFormData] = useState<Item>(
    item || {
      itemCode: '',
      itemName: '',
      brandName: '',
      itemCategory: '',
      uom: '',
      properties: [],
      isActive: true
    }
  );

  const [customUoM, setCustomUoM] = useState('');

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddProperty = () => {
    setFormData((prev) => ({
      ...prev,
      properties: [...prev.properties, { name: '', values: [] }]
    }));
  };

  const handleRemoveProperty = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      properties: prev.properties.filter((_, i) => i !== index)
    }));
  };

  const handlePropertyNameChange = (index: number, name: string) => {
    setFormData((prev) => ({
      ...prev,
      properties: prev.properties.map((prop, i) =>
        i === index ? { ...prop, name } : prop
      )
    }));
  };

  const handleAddPropertyValue = (index: number, value: string) => {
    if (!value.trim()) return;
    setFormData((prev) => ({
      ...prev,
      properties: prev.properties.map((prop, i) =>
        i === index ? { ...prop, values: [...prop.values, value] } : prop
      )
    }));
  };

  const handleRemovePropertyValue = (propIndex: number, valueIndex: number) => {
    setFormData((prev) => ({
      ...prev,
      properties: prev.properties.map((prop, i) =>
        i === propIndex
          ? { ...prop, values: prop.values.filter((_, vi) => vi !== valueIndex) }
          : prop
      )
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalData = {
      ...formData,
      uom: formData.uom === 'custom' ? customUoM : formData.uom
    };
    onSave(finalData);
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <h3 className="text-gray-900">
              {item ? `Edit Item - ${item.itemName}` : 'Add New Item'}
            </h3>
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
              {/* Item Code */}
              <div>
                <label className="block text-gray-700 mb-2">
                  Item Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.itemCode}
                  onChange={(e) => handleInputChange('itemCode', e.target.value)}
                  disabled={!!item}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ec2224] disabled:bg-gray-100"
                />
              </div>

              {/* Item Name */}
              <div>
                <label className="block text-gray-700 mb-2">
                  Item Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.itemName}
                  onChange={(e) => handleInputChange('itemName', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ec2224]"
                />
              </div>

              {/* Brand Name */}
              <div>
                <label className="block text-gray-700 mb-2">
                  Brand Name <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.brandName}
                  onChange={(e) => handleInputChange('brandName', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ec2224]"
                >
                  <option value="">Select brand</option>
                  {brandNames.map((brand) => (
                    <option key={brand} value={brand}>
                      {brand}
                    </option>
                  ))}
                </select>
              </div>

              {/* Item Category */}
              <div>
                <label className="block text-gray-700 mb-2">
                  Item Category <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.itemCategory}
                  onChange={(e) => handleInputChange('itemCategory', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ec2224]"
                >
                  <option value="">Select category</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Unit of Measurement */}
              <div>
                <label className="block text-gray-700 mb-2">
                  Unit of Measurement <span className="text-red-500">*</span>
                </label>
                <select
                  required={formData.uom !== 'custom'}
                  value={formData.uom}
                  onChange={(e) => handleInputChange('uom', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ec2224]"
                >
                  <option value="">Select UoM</option>
                  {commonUoM.map((uom) => (
                    <option key={uom} value={uom}>
                      {uom === 'custom' ? 'Custom (enter below)' : uom}
                    </option>
                  ))}
                </select>
                {formData.uom === 'custom' && (
                  <input
                    type="text"
                    required
                    value={customUoM}
                    onChange={(e) => setCustomUoM(e.target.value)}
                    placeholder="Enter custom UoM"
                    className="w-full mt-2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ec2224]"
                  />
                )}
              </div>

              {/* Item Specification */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-gray-700">Item Specification (Optional)</label>
                  <button
                    type="button"
                    onClick={handleAddProperty}
                    className="text-[#ec2224] hover:text-[#d11f21] text-sm flex items-center gap-1"
                  >
                    + Add Specification
                  </button>
                </div>

                <div className="space-y-4">
                  {formData.properties.map((property, propIndex) => (
                    <div key={propIndex} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex gap-3 mb-3">
                        <input
                          type="text"
                          value={property.name}
                          onChange={(e) =>
                            handlePropertyNameChange(propIndex, e.target.value)
                          }
                          placeholder="Specification Name (e.g., color, size)"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ec2224]"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveProperty(propIndex)}
                          className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-2">
                        <label className="text-gray-600 text-sm">Specification Values:</label>
                        <div className="flex flex-wrap gap-2">
                          {property.values.map((value, valueIndex) => (
                            <span
                              key={valueIndex}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                            >
                              {value}
                              <button
                                type="button"
                                onClick={() =>
                                  handleRemovePropertyValue(propIndex, valueIndex)
                                }
                                className="hover:text-blue-900"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                          <input
                            type="text"
                            placeholder="Add value..."
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddPropertyValue(
                                  propIndex,
                                  e.currentTarget.value
                                );
                                e.currentTarget.value = '';
                              }
                            }}
                            className="px-3 py-1 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#ec2224]"
                          />
                        </div>
                        <p className="text-gray-500 text-xs">
                          Press Enter to add a value
                        </p>
                      </div>
                    </div>
                  ))}
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
                Save Item
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}