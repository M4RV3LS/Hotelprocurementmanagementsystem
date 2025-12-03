import { useState } from "react";
import {
  X,
  FileText,
  Upload,
  Building,
  Phone,
  Mail,
  User,
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
        alert(
          "Failed to upload BAST. Check bucket permissions.",
        );
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

  const handleConfirmLink = async (proofId: string) => {
    if (!linkProofItem) return;
    try {
      await purchaseOrdersAPI.updateItemDeliveryStatus(
        linkProofItem.itemId,
        linkProofItem.reqId,
        po.id,
        true,
        proofId,
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
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[95vh] flex flex-col">
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
          {/* Vendor Details Only (Ship To Removed) */}
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* 1. Upload BAST */}
            <div className="md:col-span-1 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold text-gray-900">
                  Delivery Proofs (BAST)
                </h4>
                <label className="cursor-pointer text-[#ec2224] text-sm hover:underline flex items-center gap-1 font-medium">
                  <Upload className="w-3 h-3" /> Upload New
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileUpload}
                    accept=".pdf,.jpg,.png"
                    disabled={isUploading}
                  />
                </label>
              </div>

              <div className="border rounded-lg bg-gray-50 p-4 min-h-[200px] space-y-3">
                {po.deliveryProofs &&
                po.deliveryProofs.length > 0 ? (
                  po.deliveryProofs.map((proof) => (
                    <div
                      key={proof.id}
                      className="flex items-center gap-3 bg-white p-3 rounded border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="bg-red-50 p-2 rounded text-[#ec2224]">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <a
                          href={proof.fileLink}
                          target="_blank"
                          className="text-sm font-medium text-gray-900 hover:text-[#ec2224] truncate block"
                        >
                          {proof.name}
                        </a>
                        <p className="text-xs text-gray-500">
                          {new Date(
                            proof.uploadedAt,
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center py-8">
                    <Upload className="w-8 h-8 text-gray-300 mb-2" />
                    <p className="text-gray-500 text-sm">
                      No proofs uploaded yet.
                    </p>
                    <p className="text-gray-400 text-xs mt-1">
                      Upload BAST files here.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 2. Item List */}
            <div className="md:col-span-2 space-y-4">
              <h4 className="font-semibold text-gray-900">
                Item Fulfillment Checklist
              </h4>
              <div className="border rounded-lg overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 border-b">
                    <tr>
                      <th className="px-4 py-3 text-center w-16">
                        Mark
                      </th>
                      <th className="px-4 py-3 text-left">
                        Item Details
                      </th>
                      <th className="px-4 py-3 text-right">
                        Qty
                      </th>
                      <th className="px-4 py-3 text-left pl-6">
                        Proof Attached
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {po.items.map((item) => {
                      const isDelivered =
                        item.status === "Delivered";
                      const linkedProof =
                        po.deliveryProofs?.find(
                          (p) => p.id === item.deliveryProofId,
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
                          <td className="px-4 py-4 text-center align-top pt-5">
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
                          <td className="px-4 py-4 align-top">
                            <div className="font-medium text-gray-900 text-base">
                              {item.itemName}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Cat: {item.itemCategory} | Code:{" "}
                              {item.itemCode}
                            </div>
                            <div className="text-xs text-gray-400 mt-0.5">
                              PR: {item.prNumber}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-right align-top pt-5 font-medium text-gray-700">
                            {item.quantity} {item.uom}
                          </td>
                          <td className="px-4 py-4 align-top pl-6 pt-5">
                            {linkedProof ? (
                              <a
                                href={linkedProof.fileLink}
                                target="_blank"
                                className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-100 px-3 py-1.5 rounded-full hover:bg-green-200 transition-colors"
                              >
                                <FileText className="w-3 h-3" />{" "}
                                {linkedProof.name.length > 15
                                  ? linkedProof.name.substring(
                                      0,
                                      15,
                                    ) + "..."
                                  : linkedProof.name}
                              </a>
                            ) : (
                              <span className="text-xs text-gray-400 italic px-2">
                                -- Pending --
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