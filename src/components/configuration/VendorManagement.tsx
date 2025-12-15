import { useState, useEffect } from "react";
import { Plus, Edit2, Package } from "lucide-react";
import { vendors } from "../../data/mockData";
import VendorFormModal from "./VendorFormModalUpdated";
import Toast from "../Toast";

export type Vendor = (typeof vendors)[0];

interface VendorManagementProps {
  vendors: any[];
  items: any[];
  onSaveVendor: (vendor: any) => Promise<any>;
  onDeleteVendor: (vendorCode: string) => Promise<void>;
}

// Mock active payment methods
const mockActivePaymentMethods = [
  "Cash Before Delivery",
  "Payment Terms - NET 30",
  "Payment Terms - NET 45",
  "Bank Transfer",
  "Credit Card",
  "Cash on Delivery (COD)",
];

export default function VendorManagement({
  vendors,
  items,
  onSaveVendor,
}: VendorManagementProps) {
  const [vendorsList, setVendorsList] = useState(vendors);
  const [showModal, setShowModal] = useState(false);
  const [editingVendor, setEditingVendor] =
    useState<Vendor | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  useEffect(() => {
    setVendorsList(vendors);
  }, [vendors]);

  const handleAddVendor = () => {
    setEditingVendor(null);
    setShowModal(true);
  };

  const handleEditVendor = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setShowModal(true);
  };

  const handleSaveVendor = async (vendor: any) => {
    try {
      // Ensure vendor is active by default since we removed the toggle
      await onSaveVendor({ ...vendor, isActive: true });
      setShowModal(false);
      setToast({
        message: "Vendor saved successfully",
        type: "success",
      });
      setTimeout(() => setToast(null), 5000);
    } catch (error) {
      console.error(error);
      setToast({
        message: "Failed to save vendor",
        type: "error",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        {/* Requirement #2: Renamed Title */}
        <h2 className="text-gray-900 font-medium text-lg">
          Vendor Item Configuration
        </h2>
        <div className="flex items-center gap-4">
          <button
            onClick={handleAddVendor}
            className="px-4 py-2 bg-[#ec2224] text-white rounded-lg hover:bg-[#d11f21] transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add New Vendor
          </button>
        </div>
      </div>

      {/* Vendor Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vendorsList.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            No vendors found
          </div>
        ) : (
          vendorsList.map((vendor) => (
            <div
              key={vendor.vendorCode}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              {/* Requirement #1 & #5: Removed Status Badge */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-gray-900 mb-1 font-semibold text-lg">
                    {vendor.vendorName}
                  </h3>
                  <p className="text-gray-500 text-sm font-mono">
                    {vendor.vendorCode}
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-sm mb-4">
                <div className="flex items-start gap-2">
                  <span className="text-gray-500 w-16">
                    Region:
                  </span>
                  <span className="text-gray-900 flex-1">
                    {Array.isArray(vendor.vendorRegion)
                      ? vendor.vendorRegion.join(", ")
                      : vendor.vendorRegion}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-gray-500 w-16">
                    Email:
                  </span>
                  <span
                    className="text-gray-900 flex-1 truncate"
                    title={vendor.vendorEmail}
                  >
                    {vendor.vendorEmail}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-gray-500 w-16">
                    Phone:
                  </span>
                  <span className="text-gray-900 flex-1">
                    {vendor.vendorPhone}
                  </span>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-gray-200 mt-2">
                  <Package className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700 font-medium">
                    {vendor.items.length} items configured
                  </span>
                </div>
              </div>

              {vendor.vendorAgreementLink && (
                <a
                  href={vendor.vendorAgreementLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-[#ec2224] hover:underline text-sm mb-4 font-medium"
                >
                  View Agreement
                </a>
              )}

              <div className="flex items-center justify-end pt-4 border-t border-gray-200">
                {/* Requirement #5: Removed Toggle, Edit Only */}
                <button
                  onClick={() => handleEditVendor(vendor)}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm font-medium"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Configuration
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Vendor Form Modal */}
      {showModal && (
        <VendorFormModal
          vendor={editingVendor}
          onClose={() => setShowModal(false)}
          onSave={handleSaveVendor}
          activePaymentMethods={mockActivePaymentMethods}
          items={items}
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