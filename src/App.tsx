import { useState } from 'react';
import ProcurementDashboard from './components/ProcurementDashboard';
import Configuration from './components/Configuration';
import ListPR from './components/ListPR';
import ListPO from './components/ListPO';
import { procurementRequests as initialRequests, type ProcurementRequest } from './data/mockData';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'configuration' | 'listPR' | 'listPO'>('dashboard');
  const [sharedRequests, setSharedRequests] = useState<ProcurementRequest[]>(initialRequests);

  const handleRequestsUpdate = (updatedRequests: ProcurementRequest[]) => {
    setSharedRequests(updatedRequests);
  };

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
        {activeTab === 'listPR' && <ListPR />}
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