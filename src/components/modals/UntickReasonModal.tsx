import { useState } from "react";
import { X } from "lucide-react";

interface Props {
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

export default function UntickReasonModal({
  onClose,
  onConfirm,
}: Props) {
  const [reason, setReason] = useState("");

  return (
    <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-sm p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold">
            Cancel Delivery Status
          </h3>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div>
          <label className="block text-sm text-gray-700 mb-2">
            Reason for Unmarking{" "}
            <span className="text-red-500">*</span>
          </label>
          <textarea
            className="w-full border rounded px-3 py-2 h-24 resize-none"
            placeholder="e.g., Wrong item delivered, Damage found..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={!reason.trim()}
            className="px-4 py-2 bg-[#ec2224] text-white rounded disabled:bg-gray-300"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}