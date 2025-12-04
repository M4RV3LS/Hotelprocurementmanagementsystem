import { useState, useEffect, useCallback } from "react";
import ProcurementDashboard from "./components/ProcurementDashboard";
import Configuration from "./components/Configuration";
import ListPR from "./components/ListPR";
import ListPO from "./components/ListPO";
import RequestApproval from "./components/RequestApproval"; // Requirement 5: New Import
import {
  initialRequests,
  initialVendors,
  initialItems,
} from "./data/seedData";
import type { ProcurementRequest } from "./data/mockData";
import {
  procurementRequestsAPI,
  initializeDatabase,
} from "./utils/api";
import { useConfigData } from "./hooks/useConfigData";

export default function App() {
  const [activeTab, setActiveTab] = useState<
    | "dashboard"
    | "configuration"
    | "listPR"
    | "listPO"
    | "requestApproval"
  >("dashboard");

  const [sharedRequests, setSharedRequests] = useState<
    ProcurementRequest[]
  >([]);

  // Fetch Config Data at Top Level
  const configData = useConfigData();

  const [isLoading, setIsLoading] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isInitialized, setIsInitialized] = useState(false);

  // Helper to refresh data from DB (Used by RequestApproval)
  const refreshRequests = useCallback(async () => {
    try {
      setIsLoading(true);
      const requests = await procurementRequestsAPI.getAll();
      setSharedRequests(requests);
    } catch (error) {
      console.error("Error refreshing requests:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const initializeAndLoadData = async () => {
      try {
        setIsLoading(true);

        let requests = await procurementRequestsAPI.getAll();

        if (!requests || requests.length === 0) {
          console.log(
            "No data found. Initializing database with seed data...",
          );

          const paymentMethods = [
            {
              id: "pm-1",
              name: "Cash Before Delivery",
              category: "Cash",
              isActive: true,
            },
            {
              id: "pm-2",
              name: "Payment Terms - NET 30",
              category: "Payment Terms",
              netDays: 30,
              isActive: true,
            },
            {
              id: "pm-3",
              name: "Payment Terms - NET 45",
              category: "Payment Terms",
              netDays: 45,
              isActive: true,
            },
            {
              id: "pm-4",
              name: "Bank Transfer",
              category: "Bank Transfer",
              isActive: true,
            },
            {
              id: "pm-5",
              name: "Credit Card",
              category: "Credit Card",
              isActive: true,
            },
            {
              id: "pm-6",
              name: "Cash on Delivery (COD)",
              category: "Cash",
              isActive: true,
            },
          ];

          await initializeDatabase({
            requests: initialRequests,
            vendors: initialVendors,
            items: initialItems,
            paymentMethods,
          });

          requests = await procurementRequestsAPI.getAll();
          // Also refresh config data after seed
          configData.refreshData();
          setIsInitialized(true);
        }

        setSharedRequests(requests);
      } catch (error) {
        console.error("Error loading data:", error);
        setSharedRequests([]);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAndLoadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle updates from Dashboard/ListPR (Optimistic + DB Sync)
  const handleRequestsUpdate = async (
    updatedRequests: ProcurementRequest[],
  ) => {
    try {
      setSharedRequests(updatedRequests);
      await procurementRequestsAPI.bulkUpdate(updatedRequests);
    } catch (error) {
      console.error(
        "Error syncing requests to database:",
        error,
      );
    }
  };

  if (isLoading || configData.isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#ec2224]"></div>
          <p className="mt-4 text-gray-600">
            Loading system data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1600px] mx-auto px-6">
          <div className="flex gap-8 overflow-x-auto">
            {[
              {
                id: "dashboard",
                label: "Procurement Dashboard",
              },
              { id: "configuration", label: "Configuration" },
              { id: "listPR", label: "List PR" },
              { id: "listPO", label: "List PO" },
              {
                id: "requestApproval",
                label: "Request Approval",
              }, // Requirement 5: New Tab
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-6 relative transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "text-[#ec2224]"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <span className="relative z-10 font-medium">
                  {tab.label}
                </span>
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#ec2224]" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 py-8">
        {activeTab === "dashboard" && (
          <ProcurementDashboard
            requests={sharedRequests}
            vendors={configData.vendors}
            onRequestsUpdate={handleRequestsUpdate}
          />
        )}

        {activeTab === "configuration" && <Configuration />}

        {activeTab === "listPR" && (
          <ListPR
            requests={sharedRequests}
            onRequestsUpdate={handleRequestsUpdate}
            vendors={configData.vendors}
          />
        )}

        {activeTab === "listPO" && (
          <ListPO
            onRequestsUpdate={async () => {
              // When PO actions happen, refresh global request state
              await refreshRequests();
            }}
          />
        )}

        {/* Requirement 5: Request Approval Component */}
        {activeTab === "requestApproval" && (
          <RequestApproval
            requests={sharedRequests}
            vendors={configData.vendors}
            onUpdate={refreshRequests} // Triggers re-fetch after Approve/Reject
          />
        )}
      </div>
    </div>
  );
}