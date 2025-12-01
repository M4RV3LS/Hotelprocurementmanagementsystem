import { useState, useMemo, useEffect } from "react";
import { Plus, Edit2, Package } from "lucide-react";
import { vendors } from "../../data/mockData";
import VendorFormModal from "./VendorFormModalUpdated";
import ConfirmationModal from "./ConfirmationModal";
import Toast from "../Toast";
import Toggle from "../Toggle";
import type { PaymentMethod } from "./PaymentMethodConfiguration";

export type Vendor = (typeof vendors)[0];

interface VendorManagementProps {
  vendors: any[];
  items: any[];
  onSaveVendor: (vendor: any) => Promise<any>;
  onDeleteVendor: (vendorCode: string) => Promise<void>;
}
// Mock active payment methods - in real app, this would come from context or props
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
  onDeleteVendor,
}: VendorManagementProps) {
  const [vendorsList, setVendorsList] = useState(vendors);
  const [showModal, setShowModal] = useState(false);
  const [editingVendor, setEditingVendor] =
    useState<Vendor | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    type: "activate" | "deactivate";
    vendor: Vendor;
  } | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "inactive"
  >("all");

  useEffect(() => {
    setVendorsList(vendors);
  }, [vendors]);

  // Filter vendors based on status
  const filteredVendors = useMemo(() => {
    if (filterStatus === "all") return vendorsList;
    if (filterStatus === "active")
      return vendorsList.filter((vendor) => vendor.isActive);
    return vendorsList.filter((vendor) => !vendor.isActive);
  }, [vendorsList, filterStatus]);

  const handleAddVendor = () => {
    setEditingVendor(null);
    setShowModal(true);
  };

  const handleEditVendor = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setShowModal(true);
  };

  const handleToggleActive = (vendor: Vendor) => {
    setConfirmAction({
      type: vendor.isActive ? "deactivate" : "activate",
      vendor,
    });
  };

  const handleConfirmToggle = () => {
    if (!confirmAction) return;

    const { type, vendor } = confirmAction;
    setVendorsList((prev) =>
      prev.map((v) =>
        v.vendorCode === vendor.vendorCode
          ? { ...v, isActive: !v.isActive }
          : v,
      ),
    );

    setToast({
      message: `Vendor ${type === "activate" ? "activated" : "deactivated"} successfully`,
      type: "success",
    });

    setTimeout(() => setToast(null), 5000);
    setConfirmAction(null);
  };

  const handleSaveVendor = async (vendor: any) => {
    try {
      await onSaveVendor(vendor); // Call API
      // Local state update is handled by the useEffect above when parent refreshes,
      // but we can optimistically update here if needed, or just close modal.
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
        <h2 className="text-gray-900">Vendor Management</h2>
        <div className="flex items-center gap-4">
          {/* Filter Dropdown */}
          <select
            value={filterStatus}
            onChange={(e) =>
              setFilterStatus(
                e.target.value as "all" | "active" | "inactive",
              )
            }
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#ec2224]"
          >
            <option value="all">All</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>

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
        {filteredVendors.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            No vendors found
          </div>
        ) : (
          filteredVendors.map((vendor) => (
            <div
              key={vendor.vendorCode}
              className={`bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow ${
                !vendor.isActive ? "opacity-75" : ""
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-gray-900 mb-1">
                    {vendor.vendorName}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {vendor.vendorCode}
                  </p>
                </div>
                {vendor.isActive ? (
                  <span className="inline-flex px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                    Active
                  </span>
                ) : (
                  <span className="inline-flex px-2 py-1 rounded-full text-xs bg-gray-200 text-gray-700">
                    Inactive
                  </span>
                )}
              </div>

              <div className="space-y-2 text-sm mb-4">
                <div className="flex items-start gap-2">
                  <span className="text-gray-500">Region:</span>
                  <span className="text-gray-900">
                    {Array.isArray(vendor.vendorRegion)
                      ? vendor.vendorRegion.join(", ")
                      : vendor.vendorRegion}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-gray-500">Email:</span>
                  <span className="text-gray-900">
                    {vendor.vendorEmail}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-gray-500">Phone:</span>
                  <span className="text-gray-900">
                    {vendor.vendorPhone}
                  </span>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-gray-200 mt-2">
                  <Package className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">
                    {vendor.items.length} items configured
                  </span>
                </div>
              </div>

              {vendor.vendorAgreementLink && (
                <a
                  href={vendor.vendorAgreementLink}
                  className="inline-block text-[#ec2224] hover:underline text-sm mb-4"
                >
                  View Agreement
                </a>
              )}

              <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleEditVendor(vendor)}
                  className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
                <div className="flex items-center gap-2 ml-auto">
                  <Toggle
                    enabled={vendor.isActive}
                    onChange={() => handleToggleActive(vendor)}
                  />
                  <span className="text-sm text-gray-600">
                    {vendor.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
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
          items={items} // PASS THE ITEMS HERE
        />
      )}

      {/* Confirmation Modal */}
      {confirmAction && (
        <ConfirmationModal
          title={
            confirmAction.type === "activate"
              ? "Activate Vendor?"
              : "Deactivate Vendor?"
          }
          message={
            confirmAction.type === "activate"
              ? `Are you sure you want to activate "${confirmAction.vendor.vendorName}"?\n\nThis vendor will become available in vendor assignment dropdowns.`
              : `Are you sure you want to deactivate "${confirmAction.vendor.vendorName}"?\n\nThis vendor will no longer appear in vendor assignment dropdowns but can be reactivated anytime.\n\n⚠️ Note: Existing requests assigned to this vendor will not be affected.`
          }
          confirmLabel={
            confirmAction.type === "activate"
              ? "Activate Vendor"
              : "Deactivate Vendor"
          }
          confirmStyle={
            confirmAction.type === "activate"
              ? "primary"
              : "secondary"
          }
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