import { useState } from "react";
import { X, Upload, Link as LinkIcon } from "lucide-react";
import { purchaseOrdersAPI } from "../../utils/api";
import type { PurchaseOrder } from "../../data/mockData";

interface Props {
  po: PurchaseOrder;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UploadSignedPOModal({
  po,
  onClose,
  onSuccess,
}: Props) {
  const [fileLink, setFileLink] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileLink) return;

    setIsSubmitting(true);
    try {
      // API call to update DB
      await purchaseOrdersAPI.uploadSignedPO(po.id, fileLink);
      onSuccess();
    } catch (error) {
      console.error(error);
      alert("Failed to upload signed PO.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center bg-gray-50">
          <h3 className="font-semibold text-gray-900">
            Upload Signed PO
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-blue-50 border border-blue-100 rounded-md p-3 text-sm text-blue-800">
            <p className="font-medium">
              PO Number: {po.poNumber}
            </p>
            <p className="mt-1">
              Please provide the link to the signed document to
              approve this PO.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Document URL{" "}
              <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="url"
                required
                value={fileLink}
                onChange={(e) => setFileLink(e.target.value)}
                placeholder="[https://drive.google.com/](https://drive.google.com/)..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ec2224] focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !fileLink}
              className="px-4 py-2 bg-[#ec2224] text-white rounded-lg hover:bg-[#d11f21] transition-colors flex items-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <Upload className="w-4 h-4" />
              {isSubmitting ? "Uploading..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}