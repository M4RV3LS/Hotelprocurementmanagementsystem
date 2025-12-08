import { useState } from "react";
import ItemConfiguration from "./configuration/ItemConfiguration";
import VendorManagement from "./configuration/VendorManagement";
import PaymentMethodConfiguration from "./configuration/PaymentMethodConfiguration";
import ItemCategoryConfiguration from "./configuration/ItemCategoryConfiguration";
import { useConfigData } from "../hooks/useConfigData";

export default function Configuration() {
  const [activeSubTab, setActiveSubTab] = useState<
    "items" | "vendors" | "payment" | "categories"
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

  return (
    <div className="space-y-6">
      {/* Sub-Navigation */}
      <div className="bg-white border border-gray-200 rounded-lg p-1 inline-flex gap-1 overflow-x-auto">
        {[
          { id: "categories", label: "Item Category" },
          { id: "items", label: "Item Configuration" },
          { id: "vendors", label: "Vendor Management" },
          { id: "payment", label: "Payment Methods" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`px-4 py-2 rounded-md transition-colors whitespace-nowrap ${
              activeSubTab === tab.id
                ? "bg-[#ec2224] text-white"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeSubTab === "items" && (
        <ItemConfiguration
          items={configData.items}
          onSaveItem={configData.saveItem}
          onDeleteItem={configData.deleteItem}
        />
      )}
      {activeSubTab === "categories" && (
        <ItemCategoryConfiguration />
      )}
      {activeSubTab === "vendors" && (
        <VendorManagement
          vendors={configData.vendors}
          items={configData.items}
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