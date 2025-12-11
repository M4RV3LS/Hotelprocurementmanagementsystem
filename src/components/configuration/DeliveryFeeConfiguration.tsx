import { useState, useEffect } from "react";
import { Upload, Save, AlertCircle, FileText, CheckCircle } from "lucide-react";
import { deliveryAPI } from "../../utils/api";
import { INDONESIA_REGIONS } from "../../data/mockData";
import Toast from "../Toast";

// Requirement 1: Delivery Fee Configuration Component

interface GlobalConfig {
  volumetricDivisor: number;
  minChargeableWeight: number;
  insuranceRate: number;
  woodPackingFee: number;
  vatRate: number;
}

interface RateCardItem {
  originCity: string;
  destinationCity: string;
  serviceType: string;
  slaEstimates: string;
  baseRatePerKg: number;
  surchargeFixed: number;
  surchargePerKg: number;
}

export default function DeliveryFeeConfiguration() {
  const [activeTab, setActiveTab] = useState<"master" | "rateCard">("master");
  
  // Master Logic State
  const [globalConfig, setGlobalConfig] = useState<GlobalConfig>({
    volumetricDivisor: 6000,
    minChargeableWeight: 1,
    insuranceRate: 0,
    woodPackingFee: 0,
    vatRate: 11
  });

  // Rate Card State
  const [selectedProvince, setSelectedProvince] = useState("");
  const [configuredProvinces, setConfiguredProvinces] = useState<string[]>([]);
  const [rateCards, setRateCards] = useState<RateCardItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      const data = await deliveryAPI.getGlobalConfig();
      if (data) setGlobalConfig(data);
      
      const provinces = await deliveryAPI.getConfiguredProvinces();
      setConfiguredProvinces(provinces);
    } catch (error) {
      console.error(error);
      setToast({ message: "Failed to load configuration", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveGlobal = async () => {
    try {
      await deliveryAPI.saveGlobalConfig(globalConfig);
      setToast({ message: "Master Logic Configuration Saved", type: "success" });
    } catch (error) {
      setToast({ message: "Failed to save configuration", type: "error" });
    }
  };

  const handleProvinceChange = async (province: string) => {
    setSelectedProvince(province);
    setRateCards([]); // Clear current view
    if (configuredProvinces.includes(province)) {
      try {
        const rates = await deliveryAPI.getRateCards(province);
        setRateCards(rates);
      } catch (error) {
        setToast({ message: "Failed to fetch rate cards", type: "error" });
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedProvince) return;

    if (configuredProvinces.includes(selectedProvince)) {
      if (!confirm(`Province "${selectedProvince}" already has rate cards. Uploading will REPLACE all existing rates for this province. Continue?`)) {
        e.target.value = ''; // Reset input
        return;
      }
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      // Simple CSV Parse
      const lines = text.split('\n');
      const parsedRates: RateCardItem[] = [];
      
      // Skip header (index 0), process rest
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const cols = line.split(',').map(c => c.trim()); // Basic split, assumes no commas in fields for MVP
        
        if (cols.length >= 7) {
          parsedRates.push({
            originCity: cols[0],
            destinationCity: cols[1],
            serviceType: cols[2],
            slaEstimates: cols[3],
            baseRatePerKg: parseFloat(cols[4]) || 0,
            surchargeFixed: parseFloat(cols[5]) || 0,
            surchargePerKg: parseFloat(cols[6]) || 0,
          });
        }
      }

      try {
        await deliveryAPI.uploadRateCards(selectedProvince, parsedRates);
        setRateCards(parsedRates);
        if (!configuredProvinces.includes(selectedProvince)) {
          setConfiguredProvinces([...configuredProvinces, selectedProvince]);
        }
        setToast({ message: `Successfully uploaded ${parsedRates.length} routes`, type: "success" });
      } catch (error) {
        console.error(error);
        setToast({ message: "Failed to upload rate cards", type: "error" });
      } finally {
        setIsUploading(false);
        e.target.value = ''; // Reset input
      }
    };
    reader.readAsText(file);
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading Configuration...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Delivery Fee Configuration</h2>
        <div className="bg-gray-100 p-1 rounded-lg flex text-sm">
          <button
            onClick={() => setActiveTab("master")}
            className={`px-4 py-2 rounded-md transition-all ${
              activeTab === "master" ? "bg-white shadow text-[#ec2224] font-medium" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Master Logic
          </button>
          <button
            onClick={() => setActiveTab("rateCard")}
            className={`px-4 py-2 rounded-md transition-all ${
              activeTab === "rateCard" ? "bg-white shadow text-[#ec2224] font-medium" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Rate Card Configuration
          </button>
        </div>
      </div>

      {activeTab === "master" && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 max-w-4xl">
          <div className="flex items-center gap-2 mb-6 border-b pb-4">
            <div className="bg-blue-50 p-2 rounded-full text-blue-600"><AlertCircle className="w-5 h-5"/></div>
            <div>
              <h3 className="text-gray-900 font-medium">General Rules</h3>
              <p className="text-sm text-gray-500">Global logic applied to all shipments</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Volumetric Divisor</label>
              <input 
                type="number" 
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#ec2224] outline-none"
                value={globalConfig.volumetricDivisor}
                onChange={e => setGlobalConfig({...globalConfig, volumetricDivisor: parseFloat(e.target.value)})}
              />
              <p className="text-xs text-gray-500 mt-1">Standard: 6000 (cm³/kg)</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min. Chargeable Weight (KG)</label>
              <input 
                type="number" 
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#ec2224] outline-none"
                value={globalConfig.minChargeableWeight}
                onChange={e => setGlobalConfig({...globalConfig, minChargeableWeight: parseFloat(e.target.value)})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Insurance Rate (%)</label>
              <input 
                type="number" 
                step="0.01"
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#ec2224] outline-none"
                value={globalConfig.insuranceRate}
                onChange={e => setGlobalConfig({...globalConfig, insuranceRate: parseFloat(e.target.value)})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Wood Packing Fee</label>
              <input 
                type="number" 
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#ec2224] outline-none"
                value={globalConfig.woodPackingFee}
                onChange={e => setGlobalConfig({...globalConfig, woodPackingFee: parseFloat(e.target.value)})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">VAT / PPN Rate (%)</label>
              <input 
                type="number" 
                step="0.01"
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#ec2224] outline-none"
                value={globalConfig.vatRate}
                onChange={e => setGlobalConfig({...globalConfig, vatRate: parseFloat(e.target.value)})}
              />
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button 
              onClick={handleSaveGlobal}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#ec2224] text-white rounded-lg hover:bg-[#d11f21] transition-colors font-medium"
            >
              <Save className="w-4 h-4" /> Save Configuration
            </button>
          </div>
        </div>
      )}

      {activeTab === "rateCard" && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-gray-900 font-medium text-lg">Pricing Matrix (Rate Cards)</h3>
              <p className="text-sm text-gray-500">Upload CSV to map pricing logic per Province</p>
            </div>
            
            <div className="flex items-end gap-4">
              <div className="w-64">
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Select Province Scope</label>
                <select 
                  value={selectedProvince}
                  onChange={(e) => handleProvinceChange(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#ec2224] outline-none text-sm"
                >
                  <option value="">-- Select Province --</option>
                  {INDONESIA_REGIONS.map(province => (
                    <option key={province} value={province}>
                      {province} {configuredProvinces.includes(province) ? "✓" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <input
                  type="file"
                  id="csvUpload"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={!selectedProvince || isUploading}
                />
                <label 
                  htmlFor="csvUpload"
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-300 font-medium transition-colors ${
                    !selectedProvince ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50 cursor-pointer shadow-sm'
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  {isUploading ? "Uploading..." : "Upload CSV"}
                </label>
              </div>
            </div>
          </div>

          {!selectedProvince ? (
            <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-200 mb-3">
                <FileText className="w-6 h-6 text-gray-400" />
              </div>
              <h4 className="text-gray-600 font-medium">No Province Selected</h4>
              <p className="text-sm text-gray-500 mt-1">Please select a province to view or configure its rate card</p>
            </div>
          ) : (
            <div>
              {rateCards.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 text-green-700 text-sm font-medium">
                      <CheckCircle className="w-4 h-4" />
                      Configuration Active: {rateCards.length} Routes Mapped
                    </div>
                    <span className="text-xs text-green-600">Last updated recently</span>
                  </div>

                  <div className="overflow-x-auto border border-gray-200 rounded-lg max-h-[500px]">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 sticky top-0">
                        <tr>
                          <th className="px-4 py-3 font-medium">Origin</th>
                          <th className="px-4 py-3 font-medium">Destination</th>
                          <th className="px-4 py-3 font-medium">Service</th>
                          <th className="px-4 py-3 font-medium">SLA</th>
                          <th className="px-4 py-3 font-medium text-right">Base Rate/KG</th>
                          <th className="px-4 py-3 font-medium text-right">Surcharge Fixed</th>
                          <th className="px-4 py-3 font-medium text-right">Surcharge/KG</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {rateCards.slice(0, 100).map((row, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-4 py-2">{row.originCity}</td>
                            <td className="px-4 py-2">{row.destinationCity}</td>
                            <td className="px-4 py-2"><span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">{row.serviceType}</span></td>
                            <td className="px-4 py-2 text-gray-500">{row.slaEstimates}</td>
                            <td className="px-4 py-2 text-right font-mono">Rp {row.baseRatePerKg.toLocaleString()}</td>
                            <td className="px-4 py-2 text-right font-mono">Rp {row.surchargeFixed.toLocaleString()}</td>
                            <td className="px-4 py-2 text-right font-mono">Rp {row.surchargePerKg.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {rateCards.length > 100 && (
                      <div className="p-2 text-center text-xs text-gray-500 bg-gray-50 border-t">
                        Showing first 100 of {rateCards.length} routes
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                  <p className="text-gray-500">No configuration found for <span className="font-semibold text-gray-900">{selectedProvince}</span>.</p>
                  <p className="text-sm text-gray-400 mt-1">Upload a CSV file to initialize pricing.</p>
                  <div className="mt-4 text-xs text-gray-400 bg-gray-50 inline-block p-3 rounded text-left">
                    <strong>CSV Format Required:</strong><br/>
                    Origin City, Destination City, Service Type, SLA, Base Rate, Surcharge Fixed, Surcharge Per KG
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

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