import { useState, useEffect } from "react";
import { X, Image as ImageIcon, Check, ChevronsUpDown } from "lucide-react";
import { itemCategoriesAPI } from "../../utils/api";
import type { Item } from "../../data/mockData";
import { BRAND_NAMES, COMMODITIES_LIST } from "../../data/mockData";
import { cn } from "../ui/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover";

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
      // Removed uom
      description: "",
      photos: [],
      isActive: true,
      commodityCode: "",
      commodityName: "",
      weightage: "", 
      physicalSpec: "",
    },
  );

  const [categories, setCategories] = useState<any[]>([]);
  const [openBrand, setOpenBrand] = useState(false);
  const [openCommodity, setOpenCommodity] = useState(false);

  useEffect(() => {
    itemCategoriesAPI.getAll().then(setCategories);
  }, []);

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
    
    if (!formData.itemCode) return alert("Item Code is required");
    if (!formData.itemName) return alert("Item Name is required");
    if (!formData.brandName) return alert("Brand Name is required");
    if (!formData.commodityName) return alert("Commodity is required");
    if (!formData.categoryId) return alert("Item Category is required");
    // Removed UoM check
    if (!formData.weightage) return alert("Weightage is required");
    if (!formData.physicalSpec) return alert("Physical Specification is required");
    if (!formData.photos || formData.photos.length === 0) return alert("Item Photos are required");

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
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
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

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-2">
                  Item Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.itemCode}
                  onChange={(e) =>
                    handleInputChange("itemCode", e.target.value)
                  }
                  disabled={!!item}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ec2224] disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">
                  Item Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.itemName}
                  onChange={(e) =>
                    handleInputChange("itemName", e.target.value)
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ec2224]"
                />
              </div>

              {/* Brand Name Input */}
              <div className="flex flex-col">
                <label className="block text-gray-700 mb-2">
                  Brand Name <span className="text-red-500">*</span>
                </label>
                <Popover open={openBrand} onOpenChange={setOpenBrand}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      role="combobox"
                      aria-expanded={openBrand}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg flex justify-between items-center bg-white"
                    >
                      {formData.brandName
                        ? formData.brandName
                        : "Select Brand..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0">
                    <Command>
                      <CommandInput placeholder="Search brand..." />
                      <CommandList>
                        <CommandEmpty>No brand found.</CommandEmpty>
                        <CommandGroup>
                          {BRAND_NAMES.map((brand) => (
                            <CommandItem
                              key={brand}
                              value={brand}
                              onSelect={(currentValue) => {
                                handleInputChange("brandName", currentValue === formData.brandName ? "" : currentValue);
                                setOpenBrand(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.brandName === brand ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {brand}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Commodities Name Input */}
              <div className="flex flex-col">
                <label className="block text-gray-700 mb-2">
                  Commodities Name <span className="text-red-500">*</span>
                </label>
                <Popover open={openCommodity} onOpenChange={setOpenCommodity}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      role="combobox"
                      aria-expanded={openCommodity}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg flex justify-between items-center bg-white"
                    >
                      {formData.commodityName
                        ? formData.commodityName
                        : "Select Commodity..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0">
                    <Command>
                      <CommandInput placeholder="Search commodity..." />
                      <CommandList>
                        <CommandEmpty>No commodity found.</CommandEmpty>
                        <CommandGroup>
                          {COMMODITIES_LIST.map((c) => (
                            <CommandItem
                              key={c.code}
                              value={c.name}
                              onSelect={(currentValue) => {
                                const selected = COMMODITIES_LIST.find(
                                  item => item.name.toLowerCase() === currentValue.toLowerCase()
                                );
                                if (selected) {
                                    setFormData((prev: any) => ({
                                        ...prev,
                                        commodityCode: selected.code,
                                        commodityName: selected.name
                                    }));
                                }
                                setOpenCommodity(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.commodityName === c.name ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {c.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <label className="block text-gray-700 mb-2">
                  Item Category <span className="text-red-500">*</span>
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
                      itemCategory: cat ? cat.name : "Uncategorized",
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

              {/* Removed UoM Input Field */}

              <div>
                <label className="block text-gray-700 mb-2">
                  Weightage (kg) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.weightage}
                  onChange={(e) =>
                    handleInputChange("weightage", e.target.value)
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ec2224]"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 mb-2">
                Physical Specification <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                value={formData.physicalSpec || ""}
                onChange={(e) =>
                  handleInputChange("physicalSpec", e.target.value)
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg h-24 focus:outline-none focus:ring-2 focus:ring-[#ec2224]"
                placeholder="Dimensions, Material, etc."
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">
                Description <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <textarea
                value={formData.description || ""}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg h-24 focus:outline-none focus:ring-2 focus:ring-[#ec2224]"
                placeholder="Enter item description..."
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">
                Item Photos <span className="text-red-500">*</span>
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