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
  const [error, setError] = useState<string | null>(null);

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
        setError(null);

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
        setError(error instanceof Error ? error.message : "Failed to load data. Please check if the database is set up correctly.");
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

  if (error || configData.error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-gray-900 mb-2">Database Setup Required</h2>
            <p className="text-gray-600 mb-6">
              {error || configData.error}
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-medium text-gray-900 mb-2">📋 Database Setup Instructions:</h3>
              <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
                <li>Open your <strong>Supabase Dashboard</strong></li>
                <li>Navigate to <strong>SQL Editor</strong></li>
                <li>Copy the SQL from <code className="bg-white px-1 rounded">/supabase/migrations/001_initial_schema.sql</code></li>
                <li>Paste and run the SQL to create all tables</li>
                <li>Create a storage bucket named <strong>"Delivery Proof"</strong></li>
                <li>Refresh this page - the app will auto-seed data</li>
              </ol>
              <div className="mt-4 pt-4 border-t border-blue-200">
                <p className="text-xs text-gray-600">
                  📖 See <strong>DATABASE_SETUP.md</strong> for detailed instructions
                </p>
              </div>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-[#ec2224] text-white rounded-lg hover:bg-[#d11f21] transition-colors"
            >
              Retry Connection
            </button>
          </div>
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