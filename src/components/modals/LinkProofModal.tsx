// src/components/modals/LinkProofModal.tsx
import { useState } from "react";
import { X, CheckSquare, Square } from "lucide-react";
import type { DeliveryProof } from "../../data/mockData";

interface Props {
  proofs: DeliveryProof[];
  onClose: () => void;
  onConfirm: (proofIds: string[]) => void; // Requirement 4: Allow array
}

export default function LinkProofModal({
  proofs,
  onClose,
  onConfirm,
}: Props) {
  const [selectedProofs, setSelectedProofs] = useState<
    string[]
  >([]);

  const toggleProof = (id: string) => {
    setSelectedProofs((prev) =>
      prev.includes(id)
        ? prev.filter((p) => p !== id)
        : [...prev, id],
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-md p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold">
            Link Delivery Proofs
          </h3>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {proofs.length === 0 ? (
          <p className="text-red-500 text-sm">
            No proofs uploaded yet. Please upload BAST first.
          </p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            <p className="text-sm text-gray-600 mb-2">
              Select one or more proofs to link to this item:
            </p>
            {proofs.map((p) => (
              <div
                key={p.id}
                onClick={() => toggleProof(p.id)}
                className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
              >
                {selectedProofs.includes(p.id) ? (
                  <CheckSquare className="w-5 h-5 text-[#ec2224]" />
                ) : (
                  <Square className="w-5 h-5 text-gray-300" />
                )}
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-medium truncate">
                    {p.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(
                      p.uploadedAt,
                    ).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(selectedProofs)}
            disabled={selectedProofs.length === 0}
            className="px-4 py-2 bg-[#ec2224] text-white rounded disabled:bg-gray-300"
          >
            Confirm Links ({selectedProofs.length})
          </button>
        </div>
      </div>
    </div>
  );
}