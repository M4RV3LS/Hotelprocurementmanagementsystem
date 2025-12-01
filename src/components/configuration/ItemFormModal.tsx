import { useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import type { Item } from "./ItemConfiguration";

interface ItemFormModalProps {
  item: Item | null;
  onClose: () => void;
  onSave: (item: Item) => void;
}

const brandNames = [
  "Reddoorz",
  "Reddoorz Premium",
  "RedLiving",
  "Sans",
  "Sans Vibe",
  "Sans Stay",
  "Sans Elite",
  "Urban View",
  "The Lavana",
  "No Branding",
  "Vibes by SANS",
];

const categories = ["Branding Item", "Ops Item", "Others"];
const commonUoM = [
  "pcs",
  "units",
  "meters",
  "liters",
  "kg",
  "sets",
  "custom",
];

export default function ItemFormModal({
  item,
  onClose,
  onSave,
}: ItemFormModalProps) {
  const [formData, setFormData] = useState<Item>(
    item || {
      itemCode: "",
      itemName: "",
      brandName: "",
      itemCategory: "",
      uom: "",
      isActive: true,
    },
  );

  const [customUoM, setCustomUoM] = useState("");

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalData = {
      ...formData,
      uom: formData.uom === "custom" ? customUoM : formData.uom,
    };
    onSave(finalData);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <h3 className="text-gray-900">
              {item
                ? `Edit Item - ${item.itemName}`
                : "Add New Item"}
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

              {/* Item Name */}
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

              {/* Brand Name */}
              <div>
                <label className="block text-gray-700 mb-2">
                  Brand Name{" "}
                  <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.brandName}
                  onChange={(e) =>
                    handleInputChange(
                      "brandName",
                      e.target.value,
                    )
                  }
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
                  Item Category{" "}
                  <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.itemCategory}
                  onChange={(e) =>
                    handleInputChange(
                      "itemCategory",
                      e.target.value,
                    )
                  }
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
                  Unit of Measurement{" "}
                  <span className="text-red-500">*</span>
                </label>
                <select
                  required={formData.uom !== "custom"}
                  value={formData.uom}
                  onChange={(e) =>
                    handleInputChange("uom", e.target.value)
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ec2224]"
                >
                  <option value="">Select UoM</option>
                  {commonUoM.map((uom) => (
                    <option key={uom} value={uom}>
                      {uom === "custom"
                        ? "Custom (enter below)"
                        : uom}
                    </option>
                  ))}
                </select>
                {formData.uom === "custom" && (
                  <input
                    type="text"
                    required
                    value={customUoM}
                    onChange={(e) =>
                      setCustomUoM(e.target.value)
                    }
                    placeholder="Enter custom UoM"
                    className="w-full mt-2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ec2224]"
                  />
                )}
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