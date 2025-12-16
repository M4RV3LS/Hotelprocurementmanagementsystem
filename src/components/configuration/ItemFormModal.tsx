import { useState, useEffect } from "react";
import { X, Image as ImageIcon } from "lucide-react";
import { itemCategoriesAPI } from "../../utils/api";
import type { Item } from "./ItemConfiguration";
import {
  BRAND_NAMES,
  COMMODITIES_LIST,
} from "../../data/mockData";

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
      itemCode: "", // Auto-generated
      itemName: "",
      brandName: "",
      itemCategory: "",
      categoryId: "",
      uom: "Unit", // Requirement 1: Default to "Unit" to satisfy DB constraint since field is hidden
      description: "",
      photos: [],
      isActive: true,
      commodityCode: "",
      commodityName: "",
      itemType: "Product",
      weightage: 0,
      length: 0,
      width: 0,
      height: 0,
      weight: 0,
    },
  );

  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    itemCategoriesAPI.getAll().then(setCategories);

    // Auto-generate code if new
    if (!item) {
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, "0");
      const autoCode = `ITM-${timestamp}${random}`;
      setFormData((prev: any) => ({
        ...prev,
        itemCode: autoCode,
      }));
    }
  }, [item]);

  const handlePhotoUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      setFormData((prev: any) => ({
        ...prev,
        photos: [...(prev.photos || []), url],
      }));
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
            {/* Item Type Selection */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <label className="block text-gray-700 font-medium mb-3">
                Item Type{" "}
                <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="itemType"
                    value="Product"
                    checked={formData.itemType === "Product"}
                    onChange={(e) =>
                      handleInputChange(
                        "itemType",
                        e.target.value,
                      )
                    }
                    className="w-4 h-4 text-[#ec2224] focus:ring-[#ec2224]"
                  />
                  <span className="text-gray-900">
                    Physical Product
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="itemType"
                    value="Service"
                    checked={formData.itemType === "Service"}
                    onChange={(e) =>
                      handleInputChange(
                        "itemType",
                        e.target.value,
                      )
                    }
                    className="w-4 h-4 text-[#ec2224] focus:ring-[#ec2224]"
                  />
                  <span className="text-gray-900">Service</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-2">
                  Item Code{" "}
                  <span className="text-gray-400 text-xs">
                    (Auto-generated)
                  </span>
                </label>
                <input
                  type="text"
                  value={formData.itemCode}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
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

              {/* Weightage Field */}
              <div>
                <label className="block text-gray-700 mb-2">
                  Weightage
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.weightage || ""}
                  onChange={(e) =>
                    handleInputChange(
                      "weightage",
                      parseFloat(e.target.value),
                    )
                  }
                  placeholder="e.g. 1.0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ec2224]"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">
                  Brand Name
                </label>
                <select
                  value={formData.brandName}
                  onChange={(e) =>
                    handleInputChange(
                      "brandName",
                      e.target.value,
                    )
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ec2224]"
                >
                  <option value="">Select Brand</option>
                  {BRAND_NAMES.map((brand) => (
                    <option key={brand} value={brand}>
                      {brand}
                    </option>
                  ))}
                </select>
              </div>

              {/* Commodities wrapped in conditional check */}
              {formData.itemType === "Product" && (
                <div>
                  <label className="block text-gray-700 mb-2">
                    Commodities Name
                  </label>
                  <select
                    value={formData.commodityCode}
                    onChange={(e) => {
                      const selected = COMMODITIES_LIST.find(
                        (c) => c.code === e.target.value,
                      );
                      setFormData({
                        ...formData,
                        commodityCode: selected?.code || "",
                        commodityName: selected?.name || "",
                      });
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ec2224]"
                  >
                    <option value="">Select Commodity</option>
                    {COMMODITIES_LIST.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} - {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

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

              {/* Requirement 1: UoM Field Removed */}
            </div>

            {/* Dimensions & Weight (Only for Physical Products) */}
            {formData.itemType === "Product" && (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-3 text-sm">
                  Physical Specifications
                </h4>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Length (cm)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.length}
                      onChange={(e) =>
                        handleInputChange(
                          "length",
                          parseFloat(e.target.value),
                        )
                      }
                      className="w-full px-3 py-2 border rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Width (cm)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.width}
                      onChange={(e) =>
                        handleInputChange(
                          "width",
                          parseFloat(e.target.value),
                        )
                      }
                      className="w-full px-3 py-2 border rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Height (cm)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.height}
                      onChange={(e) =>
                        handleInputChange(
                          "height",
                          parseFloat(e.target.value),
                        )
                      }
                      className="w-full px-3 py-2 border rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.weight}
                      onChange={(e) =>
                        handleInputChange(
                          "weight",
                          parseFloat(e.target.value),
                        )
                      }
                      className="w-full px-3 py-2 border rounded-md text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

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

            <div>
              <label className="block text-gray-700 mb-2">
                Item Photos
              </label>
              <div className="flex flex-wrap gap-4">
                {(formData.photos || []).map(
                  (src: string, idx: number) => (
                    <div
                      key={idx}
                      className="relative w-24 h-24 border rounded overflow-hidden group"
                    >
                      <img
                        src={src}
                        alt="Item"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(idx)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ),
                )}
                <label className="w-24 h-24 border-2 border-dashed border-gray-300 rounded flex flex-col items-center justify-center cursor-pointer hover:border-[#ec2224] transition-colors">
                  <ImageIcon className="w-6 h-6 text-gray-400" />
                  <span className="text-xs text-gray-500 mt-1">
                    Add Photo
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              </div>
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