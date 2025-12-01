import { useState, useEffect } from 'react';
import ProcurementDashboard from './components/ProcurementDashboard';
import Configuration from './components/Configuration';
import ListPR from './components/ListPR';
import ListPO from './components/ListPO';
import { procurementRequests as initialRequests, vendors as initialVendors, items as initialItems, type ProcurementRequest } from './data/mockData';
import { procurementRequestsAPI, initializeDatabase } from './utils/api';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'configuration' | 'listPR' | 'listPO'>('dashboard');
  const [sharedRequests, setSharedRequests] = useState<ProcurementRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize database and load data on mount
  useEffect(() => {
    const initializeAndLoadData = async () => {
      try {
        setIsLoading(true);

        // Try to fetch existing data first
        let requests = await procurementRequestsAPI.getAll();

        // If no data exists, initialize with mock data
        if (!requests || requests.length === 0) {
          console.log('No data found. Initializing database with mock data...');
          
          // Payment methods data
          const paymentMethods = [
            {
              id: 'pm-1',
              name: 'Cash Before Delivery',
              category: 'Cash',
              isActive: true,
            },
            {
              id: 'pm-2',
              name: 'Payment Terms - NET 30',
              category: 'Payment Terms',
              netDays: 30,
              isActive: true,
            },
            {
              id: 'pm-3',
              name: 'Payment Terms - NET 45',
              category: 'Payment Terms',
              netDays: 45,
              isActive: true,
            },
            {
              id: 'pm-4',
              name: 'Bank Transfer',
              category: 'Bank Transfer',
              isActive: true,
            },
            {
              id: 'pm-5',
              name: 'Credit Card',
              category: 'Credit Card',
              isActive: true,
            },
            {
              id: 'pm-6',
              name: 'Cash on Delivery (COD)',
              category: 'Cash',
              isActive: true,
            },
          ];

          await initializeDatabase({
            requests: initialRequests,
            vendors: initialVendors,
            items: initialItems,
            paymentMethods,
          });

          // Fetch the newly initialized data
          requests = await procurementRequestsAPI.getAll();
          setIsInitialized(true);
          console.log('Database initialized successfully with', requests.length, 'requests');
        }

        setSharedRequests(requests);
      } catch (error) {
        console.error('Error loading data:', error);
        // Fallback to mock data if API fails
        setSharedRequests(initialRequests);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAndLoadData();
  }, []);

  const handleRequestsUpdate = async (updatedRequests: ProcurementRequest[]) => {
    try {
      // Update local state immediately for responsive UI
      setSharedRequests(updatedRequests);
      
      // Sync with backend
      await procurementRequestsAPI.bulkUpdate(updatedRequests);
      console.log('Requests synced to database successfully');
    } catch (error) {
      console.error('Error syncing requests to database:', error);
      // Still update local state even if sync fails
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#ec2224]"></div>
          <p className="mt-4 text-gray-600">Loading procurement data...</p>
          {isInitialized && (
            <p className="mt-2 text-sm text-gray-500">Initializing database...</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top-Level Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1600px] mx-auto px-6">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-4 px-6 relative transition-colors ${
                activeTab === 'dashboard'
                  ? 'text-[#ec2224]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="relative z-10">Procurement Dashboard</span>
              {activeTab === 'dashboard' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#ec2224]" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('configuration')}
              className={`py-4 px-6 relative transition-colors ${
                activeTab === 'configuration'
                  ? 'text-[#ec2224]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="relative z-10">Configuration</span>
              {activeTab === 'configuration' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#ec2224]" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('listPR')}
              className={`py-4 px-6 relative transition-colors ${
                activeTab === 'listPR'
                  ? 'text-[#ec2224]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="relative z-10">List PR</span>
              {activeTab === 'listPR' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#ec2224]" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('listPO')}
              className={`py-4 px-6 relative transition-colors ${
                activeTab === 'listPO'
                  ? 'text-[#ec2224]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="relative z-10">List PO</span>
              {activeTab === 'listPO' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#ec2224]" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-[1600px] mx-auto px-6 py-8">
        {activeTab === 'dashboard' && (
          <ProcurementDashboard 
            requests={sharedRequests} 
            onRequestsUpdate={handleRequestsUpdate} 
          />
        )}
        {activeTab === 'configuration' && <Configuration />}
        {activeTab === 'listPR' && <ListPR requests={sharedRequests} onRequestsUpdate={handleRequestsUpdate} />}
        {activeTab === 'listPO' && (
          <ListPO 
            requests={sharedRequests} 
            onRequestsUpdate={handleRequestsUpdate} 
          />
        )}
      </div>
    </div>
  );
}