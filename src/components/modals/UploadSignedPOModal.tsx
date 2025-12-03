import { useState } from "react";
import { X, Upload, FileText } from "lucide-react";
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
  const [selectedFile, setSelectedFile] = useState<File | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== "application/pdf") {
        alert("Only PDF files are allowed.");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsSubmitting(true);
    try {
      // In a real app, you would upload 'selectedFile' to Supabase Storage here
      // const { data, error } = await supabase.storage.from('pos').upload(...)
      // const fileLink = data.path;

      // For this template, we simulate the upload and generate a fake URL
      console.log("Uploading file:", selectedFile.name);
      const mockFileLink = `https://storage.supabase.co/pos/${po.poNumber}/${selectedFile.name}`;

      await purchaseOrdersAPI.uploadSignedPO(
        po.id,
        mockFileLink,
      );
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
              Please upload the signed PDF document to approve
              this PO.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Signed Document (PDF){" "}
              <span className="text-red-500">*</span>
            </label>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#ec2224] transition-colors relative">
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                required
              />
              <div className="flex flex-col items-center justify-center pointer-events-none">
                {selectedFile ? (
                  <>
                    <FileText className="w-8 h-8 text-[#ec2224] mb-2" />
                    <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(
                        selectedFile.size /
                        1024 /
                        1024
                      ).toFixed(2)}{" "}
                      MB
                    </p>
                  </>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PDF only (Max 10MB)
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
              <Upload className="w-4 h-4" />
              {isSubmitting ? "Uploading..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}