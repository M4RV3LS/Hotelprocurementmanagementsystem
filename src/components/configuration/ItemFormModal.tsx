import { useState, useEffect } from "react";
import { X, Image as ImageIcon, Loader2 } from "lucide-react";
import { itemCategoriesAPI, itemsAPI } from "../../utils/api";
import type { Item } from "../../data/mockData";

interface ItemFormModalProps {
  item: Item | null;
  onClose: () => void;
  onSave: (item: Item) => void;
}

export default function ItemFormModal({
  item,
  onClose,
  onSave,
}: ItemFormModalProps) {
  const [formData, setFormData] = useState<any>(
    item || {
      itemCode: "",
      itemName: "",
      brandName: "",
      itemCategory: "",
      categoryId: "",
      uom: "",
      description: "",
      photos: [],
      isActive: true,
    },
  );

  const [categories, setCategories] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false); // Track upload state

  useEffect(() => {
    itemCategoriesAPI.getAll().then(setCategories);
  }, []);

  const handlePhotoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Validation
      if (file.size > 2 * 1024 * 1024) {
        alert("File size must be less than 2MB");
        return;
      }

      setIsUploading(true);
      try {
        // Requirement 2 Fix: Upload to Supabase instead of local blob
        const publicUrl = await itemsAPI.uploadPhoto(file);

        setFormData((prev: any) => ({
          ...prev,
          photos: [...(prev.photos || []), publicUrl],
        }));
      } catch (error) {
        console.error("Failed to upload photo", error);
        alert("Failed to upload photo. Please try again.");
      } finally {
        setIsUploading(false);
      }
    }
  };

  const removePhoto = (index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      photos: prev.photos.filter(
        (_: any, i: number) => i !== index,
      ),
    }));
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <h3 className="text-gray-900">
              {item ? "Edit Item" : "Add New Item"}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="p-6 space-y-6"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-2">
                  Item Code{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.itemCode}
                  onChange={(e) =>
                    handleInputChange(
                      "itemCode",
                      e.target.value,
                    )
                  }
                  disabled={!!item}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ec2224] disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">
                  Item Name{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.itemName}
                  onChange={(e) =>
                    handleInputChange(
                      "itemName",
                      e.target.value,
                    )
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ec2224]"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">
                  Brand Name
                </label>
                <input
                  type="text"
                  value={formData.brandName}
                  onChange={(e) =>
                    handleInputChange(
                      "brandName",
                      e.target.value,
                    )
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ec2224]"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">
                  Item Category
                </label>
                <select
                  value={formData.categoryId || ""}
                  onChange={(e) => {
                    const cat = categories.find(
                      (c) => c.id === e.target.value,
                    );
                    setFormData({
                      ...formData,
                      categoryId: e.target.value,
                      itemCategory: cat
                        ? cat.name
                        : "Uncategorized",
                    });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ec2224]"
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-700 mb-2">
                  UoM <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.uom}
                  onChange={(e) =>
                    handleInputChange("uom", e.target.value)
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ec2224]"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description || ""}
                onChange={(e) =>
                  handleInputChange(
                    "description",
                    e.target.value,
                  )
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg h-24 focus:outline-none focus:ring-2 focus:ring-[#ec2224]"
                placeholder="Enter item description..."
              />
            </div>

            {/* Requirement 2 Fix: Photo Upload Section */}
            <div>
              <label className="block text-gray-700 mb-2">
                Item Photos
              </label>
              <div className="flex flex-wrap gap-4">
                {(formData.photos || []).map(
                  (src: string, idx: number) => (
                    <div
                      key={idx}
                      className="relative w-24 h-24 border rounded-lg overflow-hidden group shadow-sm"
                    >
                      <img
                        src={src}
                        alt="Item"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(idx)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ),
                )}

                {/* Upload Button with Loading State */}
                <label
                  className={`w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[#ec2224] transition-colors ${isUploading ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {isUploading ? (
                    <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                  ) : (
                    <>
                      <ImageIcon className="w-6 h-6 text-gray-400" />
                      <span className="text-xs text-gray-500 mt-1">
                        Add Photo
                      </span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    disabled={isUploading}
                  />
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Uploaded photos will be available for selection
                in Vendor Configuration.
              </p>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-200 pt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUploading}
                className="px-6 py-2 bg-[#ec2224] text-white rounded-lg hover:bg-[#d11f21] transition-colors disabled:bg-gray-300"
              >
                {isUploading ? "Uploading..." : "Save Item"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}