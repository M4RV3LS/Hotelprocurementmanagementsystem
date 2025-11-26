import { useState, useMemo } from 'react';
import { Plus, Edit2 } from 'lucide-react';
import { items } from '../../data/mockData';
import ItemFormModal from './ItemFormModal';
import ConfirmationModal from './ConfirmationModal';
import Toast from '../Toast';
import Toggle from '../Toggle';

export type Item = typeof items[0];

export default function ItemConfiguration() {
  const [itemsList, setItemsList] = useState(items);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'activate' | 'deactivate';
    item: Item;
  } | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  // Filter items based on status
  const filteredItems = useMemo(() => {
    if (filterStatus === 'all') return itemsList;
    if (filterStatus === 'active') return itemsList.filter(item => item.isActive);
    return itemsList.filter(item => !item.isActive);
  }, [itemsList, filterStatus]);

  const handleAddItem = () => {
    setEditingItem(null);
    setShowModal(true);
  };

  const handleEditItem = (item: Item) => {
    setEditingItem(item);
    setShowModal(true);
  };

  const handleToggleActive = (item: Item) => {
    setConfirmAction({
      type: item.isActive ? 'deactivate' : 'activate',
      item
    });
  };

  const handleConfirmToggle = () => {
    if (!confirmAction) return;

    const { type, item } = confirmAction;
    setItemsList((prev) =>
      prev.map((i) =>
        i.itemCode === item.itemCode ? { ...i, isActive: !i.isActive } : i
      )
    );

    setToast({
      message: `Item ${type === 'activate' ? 'activated' : 'deactivated'} successfully`,
      type: 'success'
    });

    setTimeout(() => setToast(null), 5000);
    setConfirmAction(null);
  };

  const handleSaveItem = (item: Item) => {
    if (editingItem) {
      // Update existing
      setItemsList((prev) =>
        prev.map((i) => (i.itemCode === editingItem.itemCode ? item : i))
      );
    } else {
      // Add new
      setItemsList((prev) => [...prev, item]);
    }
    setShowModal(false);
    
    setToast({
      message: `Item ${editingItem ? 'updated' : 'created'} successfully`,
      type: 'success'
    });
    setTimeout(() => setToast(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-gray-900">Item Configuration</h2>
        <div className="flex items-center gap-4">
          {/* Filter Dropdown */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#ec2224]"
          >
            <option value="all">All</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>

          <button
            onClick={handleAddItem}
            className="px-4 py-2 bg-[#ec2224] text-white rounded-lg hover:bg-[#d11f21] transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add New Item
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-gray-700">Item Code</th>
                <th className="px-6 py-3 text-left text-gray-700">Item Name</th>
                <th className="px-6 py-3 text-left text-gray-700">Brand Name</th>
                <th className="px-6 py-3 text-left text-gray-700">Category</th>
                <th className="px-6 py-3 text-left text-gray-700">UoM</th>
                <th className="px-6 py-3 text-left text-gray-700">Properties</th>
                <th className="px-6 py-3 text-left text-gray-700">Status</th>
                <th className="px-6 py-3 text-right text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    No items found
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr 
                    key={item.itemCode} 
                    className={`transition-colors ${
                      item.isActive ? 'hover:bg-gray-50' : 'bg-gray-50 opacity-75'
                    }`}
                  >
                    <td className="px-6 py-4 text-gray-900">{item.itemCode}</td>
                    <td className="px-6 py-4 text-gray-900">{item.itemName}</td>
                    <td className="px-6 py-4 text-gray-700">{item.brandName}</td>
                    <td className="px-6 py-4 text-gray-700">{item.itemCategory}</td>
                    <td className="px-6 py-4 text-gray-700">{item.uom}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {item.properties.map((prop, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm"
                          >
                            {prop.name}: {prop.values.length}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {item.isActive ? (
                        <span className="inline-flex px-3 py-1 rounded-full text-sm bg-green-100 text-green-700">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex px-3 py-1 rounded-full text-sm bg-gray-200 text-gray-700">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end items-center gap-3">
                        <button
                          onClick={() => handleEditItem(item)}
                          className="p-2 text-gray-600 hover:text-[#ec2224] transition-colors"
                          title="Edit item"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <div className="flex items-center gap-2">
                          <Toggle
                            enabled={item.isActive}
                            onChange={() => handleToggleActive(item)}
                          />
                          <span className="text-sm text-gray-600">
                            {item.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Item Form Modal */}
      {showModal && (
        <ItemFormModal
          item={editingItem}
          onClose={() => setShowModal(false)}
          onSave={handleSaveItem}
        />
      )}

      {/* Confirmation Modal */}
      {confirmAction && (
        <ConfirmationModal
          title={confirmAction.type === 'activate' ? 'Activate Item?' : 'Deactivate Item?'}
          message={
            confirmAction.type === 'activate'
              ? `Are you sure you want to activate "${confirmAction.item.itemName}"?\n\nThis item will become available in vendor item selection dropdowns.`
              : `Are you sure you want to deactivate "${confirmAction.item.itemName}"?\n\nThis item will no longer appear in vendor item selection dropdowns but can be reactivated anytime.`
          }
          confirmLabel={confirmAction.type === 'activate' ? 'Activate Item' : 'Deactivate Item'}
          confirmStyle={confirmAction.type === 'activate' ? 'primary' : 'secondary'}
          onConfirm={handleConfirmToggle}
          onCancel={() => setConfirmAction(null)}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}