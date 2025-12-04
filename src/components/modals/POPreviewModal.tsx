import { useState } from "react";
import {
  X,
  FileText,
  Upload,
  Building,
  Phone,
  Mail,
  User,
  Eye,
} from "lucide-react";
import type { PurchaseOrder } from "../../data/mockData";
import { purchaseOrdersAPI } from "../../utils/api";
import LinkProofModal from "./LinkProofModal";
import UntickReasonModal from "./UntickReasonModal";

interface Props {
  po: PurchaseOrder;
  onClose: () => void;
}

export default function POPreviewModal({
  po: initialPO,
  onClose,
}: Props) {
  const [po, setPO] = useState<PurchaseOrder>(initialPO);
  const [isUploading, setIsUploading] = useState(false);

  const [linkProofItem, setLinkProofItem] = useState<{
    itemId: string;
    reqId: string;
  } | null>(null);
  const [untickItem, setUntickItem] = useState<{
    itemId: string;
    reqId: string;
  } | null>(null);

  // Calculate stats for progress bar
  const totalItems = po.items.length;
  const deliveredItems = po.items.filter(
    (i) => i.status === "Delivered",
  ).length;
  const progressPercentage =
    totalItems > 0 ? (deliveredItems / totalItems) * 100 : 0;

  const refreshPO = async () => {
    const allPOs = await purchaseOrdersAPI.getAll();
    const freshPO = allPOs.find((p) => p.id === po.id);
    if (freshPO) setPO(freshPO);
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsUploading(true);
      try {
        await purchaseOrdersAPI.addDeliveryProof(po.id, {
          name: file.name,
          file: file,
        });
        await refreshPO();
      } catch (error) {
        console.error("Upload failed", error);
        alert("Failed to upload BAST. Check console.");
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleCheckboxChange = (
    item: any,
    isChecked: boolean,
  ) => {
    if (isChecked) {
      setLinkProofItem({
        itemId: item.id,
        reqId: item.request_id,
      });
    } else {
      setUntickItem({
        itemId: item.id,
        reqId: item.request_id,
      });
    }
  };

  const handleConfirmLink = async (proofIds: string[]) => {
    if (!linkProofItem) return;
    try {
      // Pass the array of IDs (Requirement 4)
      await purchaseOrdersAPI.updateItemDeliveryStatus(
        linkProofItem.itemId,
        linkProofItem.reqId,
        po.id,
        true,
        proofIds, // Changed from single ID to string[]
      );
      await refreshPO();
      setLinkProofItem(null);
    } catch (err) {
      alert("Failed to update status");
    }
  };

  const handleConfirmUntick = async (reason: string) => {
    if (!untickItem) return;
    try {
      await purchaseOrdersAPI.updateItemDeliveryStatus(
        untickItem.itemId,
        untickItem.reqId,
        po.id,
        false,
        undefined,
        reason,
      );
      await refreshPO();
      setUntickItem(null);
    } catch (err) {
      alert("Failed to update status");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-[95vw] max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 px-8 py-5 flex justify-between items-center bg-gray-50 rounded-t-lg">
          <div className="flex items-center gap-4">
            <div>
              <h3 className="font-bold text-gray-900 text-xl">
                Purchase Order Details
              </h3>
              <p className="text-sm text-gray-500">
                {po.poNumber} • {po.generatedDate}
              </p>
            </div>
            <div
              className={`px-3 py-1 rounded-full text-xs font-bold border ${po.status === "Close" ? "bg-green-100 text-green-800 border-green-200" : "bg-blue-100 text-blue-800 border-blue-200"}`}
            >
              {po.status === "Close"
                ? "COMPLETED"
                : "IN PROGRESS"}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto bg-white space-y-8">
          {/* Vendor Information */}
          <div className="border-b border-gray-100 pb-8">
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                Vendor Information
              </h4>
              <div className="bg-gray-50 rounded-lg p-5 border border-gray-100">
                <div className="flex items-start gap-3 mb-3">
                  <Building className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900 text-lg">
                      {po.vendorName}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {(po as any).vendorAddress ||
                        "Address not available"}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User className="w-4 h-4 text-gray-400" />
                    <span>
                      {(po as any).vendorContact || "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>
                      {(po as any).vendorPhone || "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 md:col-span-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span>{po.vendorEmail || "N/A"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Section */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-6">
            <div className="flex justify-between text-sm font-medium mb-2 text-blue-900">
              <span>Fulfillment Progress</span>
              <span>
                {Math.round(progressPercentage)}% (
                {deliveredItems}/{totalItems} Items)
              </span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2.5">
              <div
                className="bg-[#ec2224] h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>

          {/* REQ 1: Requested Item List (Moved above BAST) */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 text-lg border-l-4 border-[#ec2224] pl-3">
              Requested Item List
            </h4>
            <div className="border rounded-lg overflow-hidden shadow-sm overflow-x-auto">
              <table className="w-full text-sm min-w-[1200px]">
                <thead className="bg-gray-100 border-b text-gray-700">
                  <tr>
                    {/* 2. No */}
                    <th className="px-4 py-3 text-center w-12">
                      #
                    </th>
                    {/* 1. Ticked Box */}
                    <th className="px-4 py-3 text-center w-12">
                      Tick
                    </th>
                    {/* 3. Brand */}
                    <th className="px-4 py-3 text-left">
                      Brand
                    </th>
                    {/* 4. Item */}
                    <th className="px-4 py-3 text-left">
                      Item Name
                    </th>
                    {/* 5. Qty */}
                    <th className="px-4 py-3 text-right">
                      Qty
                    </th>
                    {/* 6. PIC */}
                    <th className="px-4 py-3 text-left">PIC</th>
                    {/* 7. Property Code */}
                    <th className="px-4 py-3 text-left">
                      Property Code
                    </th>
                    {/* 8. Property Name */}
                    <th className="px-4 py-3 text-left">
                      Property Name
                    </th>
                    {/* 9. Address */}
                    <th className="px-4 py-3 text-left">
                      Address
                    </th>
                    {/* 10. Proof Attached */}
                    <th className="px-4 py-3 text-left">
                      Proof Attached
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {po.items.map((item, index) => {
                    const isDelivered =
                      item.status === "Delivered";
                    const linkedProofs =
                      po.deliveryProofs?.filter((p) =>
                        item.deliveryProofId?.includes(p.id),
                      );

                    return (
                      <tr
                        key={item.id}
                        className={
                          isDelivered
                            ? "bg-green-50/50"
                            : "hover:bg-gray-50"
                        }
                      >
                        {/* No */}
                        <td className="px-4 py-3 text-center text-gray-500">
                          {index + 1}
                        </td>
                        {/* Tick Box */}
                        <td className="px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={isDelivered}
                            onChange={(e) =>
                              handleCheckboxChange(
                                item,
                                e.target.checked,
                              )
                            }
                            className="w-5 h-5 text-[#ec2224] rounded border-gray-300 focus:ring-[#ec2224] cursor-pointer"
                          />
                        </td>
                        {/* Brand */}
                        <td className="px-4 py-3">
                          {item.brandName || "N/A"}
                        </td>
                        {/* Item */}
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {item.itemName}
                        </td>
                        {/* Qty */}
                        <td className="px-4 py-3 text-right">
                          {item.quantity} {item.uom}
                        </td>
                        {/* PIC */}
                        <td className="px-4 py-3">
                          {item.picName || "N/A"}
                        </td>
                        {/* Property Code */}
                        <td className="px-4 py-3 font-mono text-xs">
                          {item.propertyCode || "N/A"}
                        </td>
                        {/* Property Name */}
                        <td
                          className="px-4 py-3 max-w-[200px] truncate"
                          title={item.propertyName}
                        >
                          {item.propertyName || "N/A"}
                        </td>
                        {/* Address */}
                        <td
                          className="px-4 py-3 max-w-[250px] truncate text-gray-500"
                          title={item.propertyAddress}
                        >
                          {item.propertyAddress || "N/A"}
                        </td>
                        {/* Proof Attached */}
                        <td className="px-4 py-3">
                          {linkedProof ? (
                            <a
                              href={linkedProof.fileLink}
                              target="_blank"
                              className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-100 px-3 py-1.5 rounded-full hover:bg-green-200 transition-colors"
                            >
                              <FileText className="w-3 h-3" />{" "}
                              Proof Link
                            </a>
                          ) : (
                            <span className="text-xs text-gray-400 italic">
                              --
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* REQ 1 & 2: BAST / Delivery Proofs (Moved Below & Added Preview) */}
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <h4 className="font-semibold text-gray-900 text-lg border-l-4 border-blue-500 pl-3">
                BAST / Delivery Proofs
              </h4>
              <label className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm font-medium shadow-sm">
                <Upload className="w-4 h-4" /> Upload New File
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                  accept=".pdf,.jpg,.png"
                  disabled={isUploading}
                />
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {po.deliveryProofs &&
              po.deliveryProofs.length > 0 ? (
                po.deliveryProofs.map((proof) => (
                  <div
                    key={proof.id}
                    className="group relative bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="bg-red-50 p-2 rounded text-[#ec2224]">
                        <FileText className="w-6 h-6" />
                      </div>
                      {/* Requirement 2: Preview Capability */}
                      <a
                        href={proof.fileLink}
                        target="_blank"
                        rel="noreferrer"
                        className="text-gray-400 hover:text-[#ec2224] p-1"
                        title="Preview File"
                      >
                        <Eye className="w-4 h-4" />
                      </a>
                    </div>
                    <div className="mt-2">
                      <p
                        className="font-medium text-gray-900 text-sm truncate"
                        title={proof.name}
                      >
                        {proof.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(
                          proof.uploadedAt,
                        ).toLocaleDateString()}
                      </p>
                    </div>
                    {/* Make whole card clickable for preview */}
                    <a
                      href={proof.fileLink}
                      target="_blank"
                      className="absolute inset-0 z-0"
                      aria-label="View Proof"
                    />
                  </div>
                ))
              ) : (
                <div className="col-span-full py-8 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  <p className="text-gray-500">
                    No delivery proofs uploaded yet.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {linkProofItem && (
          <LinkProofModal
            proofs={po.deliveryProofs || []}
            onClose={() => setLinkProofItem(null)}
            onConfirm={handleConfirmLink}
          />
        )}
        {untickItem && (
          <UntickReasonModal
            onClose={() => setUntickItem(null)}
            onConfirm={handleConfirmUntick}
          />
        )}
      </div>
    </div>
  );
}