import { useState } from "react";
import { X } from "lucide-react";
import type { DeliveryProof } from "../../data/mockData";

interface Props {
  proofs: DeliveryProof[];
  onClose: () => void;
  onConfirm: (proofId: string) => void;
}

export default function LinkProofModal({ proofs, onClose, onConfirm }: Props) {
  const [selectedProof, setSelectedProof] = useState("");

  return (
    <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-sm p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold">Link Delivery Proof</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        
        {proofs.length === 0 ? (
          <p className="text-red-500 text-sm">No proofs uploaded yet. Please upload BAST first.</p>
        ) : (
          <div>
            <label className="block text-sm text-gray-700 mb-2">Select BAST/Proof</label>
            <select 
              className="w-full border rounded px-3 py-2"
              value={selectedProof} 
              onChange={(e) => setSelectedProof(e.target.value)}
            >
              <option value="">Select Proof...</option>
              {proofs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 border rounded">Cancel</button>
          <button 
            onClick={() => onConfirm(selectedProof)} 
            disabled={!selectedProof}
            className="px-4 py-2 bg-[#ec2224] text-white rounded disabled:bg-gray-300"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}