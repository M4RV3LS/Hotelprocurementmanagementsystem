import { useState } from "react";
import ItemConfiguration from "./configuration/ItemConfiguration";
import VendorManagement from "./configuration/VendorManagement";
import PaymentMethodConfiguration from "./configuration/PaymentMethodConfiguration";
import { useConfigData } from "../hooks/useConfigData";

export default function Configuration() {
  const [activeSubTab, setActiveSubTab] = useState<
    "items" | "vendors" | "payment"
  >("items");
  const configData = useConfigData();

  if (configData.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#ec2224]"></div>
          <p className="mt-4 text-gray-600">
            Loading configuration data...
          </p>
        </div>
      </div>
    );
  }

  if (configData.error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-800">
          Error loading configuration: {configData.error}
        </p>
        <button
          onClick={configData.refreshData}
          className="mt-4 px-4 py-2 bg-[#ec2224] text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sub-Navigation */}
      <div className="bg-white border border-gray-200 rounded-lg p-1 inline-flex gap-1">
        <button
          onClick={() => setActiveSubTab("items")}
          className={`px-6 py-2 rounded-md transition-colors ${
            activeSubTab === "items"
              ? "bg-[#ec2224] text-white"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Item Configuration
        </button>
        <button
          onClick={() => setActiveSubTab("vendors")}
          className={`px-6 py-2 rounded-md transition-colors ${
            activeSubTab === "vendors"
              ? "bg-[#ec2224] text-white"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Vendor Management
        </button>
        <button
          onClick={() => setActiveSubTab("payment")}
          className={`px-6 py-2 rounded-md transition-colors ${
            activeSubTab === "payment"
              ? "bg-[#ec2224] text-white"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Payment Method Configuration
        </button>
      </div>

      {/* Content */}
      {activeSubTab === "items" && (
        <ItemConfiguration
          items={configData.items}
          onSaveItem={configData.saveItem}
          onDeleteItem={configData.deleteItem}
        />
      )}
      {activeSubTab === "vendors" && (
        <VendorManagement
          vendors={configData.vendors}
          items={configData.items} // It passes items here
          onSaveVendor={configData.saveVendor}
          onDeleteVendor={configData.deleteVendor}
        />
      )}
      {activeSubTab === "payment" && (
        <PaymentMethodConfiguration
          paymentMethods={configData.paymentMethods}
          onSavePaymentMethods={configData.savePaymentMethods}
        />
      )}
    </div>
  );
}