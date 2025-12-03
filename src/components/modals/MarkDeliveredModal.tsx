import { useState } from "react";
import { X, Upload, FileText, CheckCircle } from "lucide-react";
import type { PurchaseOrder } from "../../data/mockData";

interface Props {
  po: PurchaseOrder;
  onClose: () => void;
  onConfirm: (file: File) => void;
}

export default function MarkDeliveredModal({ po, onClose, onConfirm }: Props) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        alert("Only JPG, PNG, or PDF files are allowed.");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsSubmitting(true);
    // Simulate API delay
    setTimeout(() => {
        onConfirm(selectedFile);
        setIsSubmitting(false);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center bg-gray-50">
          <h3 className="font-semibold text-gray-900">Mark PO as Delivered</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-green-50 border border-green-100 rounded-md p-3 text-sm text-green-800 flex gap-2">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <div>
                <p className="font-medium">Complete Delivery for {po.poNumber}</p>
                <p className="mt-1">This will close the PO and mark all items as Delivered.</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Upload Delivery Proof (DO/Receipt) <span className="text-red-500">*</span>
            </label>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#ec2224] transition-colors relative group cursor-pointer">
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                required
              />
              <div className="flex flex-col items-center justify-center pointer-events-none">
                {selectedFile ? (
                  <>
                    <FileText className="w-8 h-8 text-[#ec2224] mb-2" />
                    <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-gray-400 mb-2 group-hover:text-[#ec2224] transition-colors" />
                    <p className="text-sm text-gray-600">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      JPG, PNG, PDF (Max 10MB)
                    </p>
                  </>
                )}
              </div>
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
              disabled={isSubmitting || !selectedFile}
              className="px-4 py-2 bg-[#ec2224] text-white rounded-lg hover:bg-[#d11f21] transition-colors flex items-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Processing..." : "Confirm Delivery"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}