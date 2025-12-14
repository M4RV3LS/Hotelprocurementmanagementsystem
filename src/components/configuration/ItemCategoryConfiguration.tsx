import { useState, useEffect } from "react";
import { Plus, Trash2, Upload } from "lucide-react";
import { itemCategoriesAPI } from "../../utils/api";
import Toast from "../Toast";
import type { ItemCategory } from "../../data/mockData";

export default function ItemCategoryConfiguration() {
  const [categories, setCategories] = useState<ItemCategory[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  
  // Bulk Upload State
  const [selectedBulkCategory, setSelectedBulkCategory] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [bulkFile, setBulkFile] = useState<File | null>(null);

  const loadData = async () => {
    try {
      const data = await itemCategoriesAPI.getAll();
      setCategories(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSave = async () => {
    if(!categoryName) return;
    try {
      await itemCategoriesAPI.save(categoryName);
      setToast({ message: "Category saved", type: "success" });
      setShowModal(false);
      setCategoryName("");
      loadData();
    } catch (e) {
      setToast({ message: "Failed to save category", type: "error" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? Items in this category will become uncategorized.")) return;
    try {
      await itemCategoriesAPI.delete(id);
      loadData();
    } catch (e) {
      alert("Failed to delete");
    }
  };

  const handleBulkUpload = async () => {
    if (!selectedBulkCategory || !bulkFile) {
        alert("Please select category and file");
        return;
    }
    // Simulation for Figma environment
    setToast({ message: "Items bulk assigned successfully (Simulated)", type: "success" });
    setShowBulkModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-gray-900 font-medium">Item Categories</h2>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowBulkModal(true)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <Upload className="w-4 h-4" /> Bulk Assign
          </button>
          <button 
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-[#ec2224] text-white rounded-lg hover:bg-[#d11f21] flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Category
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 font-medium text-gray-700">Category Name</th>
              <th className="px-6 py-3 font-medium text-gray-700">Total Items</th>
              <th className="px-6 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {categories.map((cat) => (
              <tr key={cat.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-gray-900 font-medium">{cat.name}</td>
                <td className="px-6 py-4 text-gray-600">{cat.itemCount} items</td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => handleDelete(cat.id)} className="text-red-600 hover:text-red-800">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 shadow-xl">
            <h3 className="font-bold mb-4">Add Category</h3>
            <input 
              className="w-full border p-2 rounded mb-4 focus:ring-[#ec2224] focus:outline-none" 
              placeholder="Category Name"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border rounded">Cancel</button>
              <button onClick={handleSave} className="px-4 py-2 bg-[#ec2224] text-white rounded">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-[500px] shadow-xl">
            <h3 className="font-bold mb-4">Bulk Assign Items</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Target Category</label>
                <select 
                  className="w-full border p-2 rounded focus:ring-[#ec2224] focus:outline-none"
                  value={selectedBulkCategory}
                  onChange={(e) => setSelectedBulkCategory(e.target.value)}
                >
                  <option value="">Select Category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="border-2 border-dashed p-6 text-center rounded">
                <input type="file" onChange={(e) => setBulkFile(e.target.files?.[0] || null)} />
                <p className="text-xs text-gray-500 mt-2">Upload CSV/Excel (Item Code list)</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowBulkModal(false)} className="px-4 py-2 border rounded">Cancel</button>
              <button onClick={handleBulkUpload} className="px-4 py-2 bg-[#ec2224] text-white rounded">Upload & Assign</button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}