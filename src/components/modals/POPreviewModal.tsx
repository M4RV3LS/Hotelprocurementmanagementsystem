import { X, Download, FileText } from 'lucide-react';
import type { PurchaseOrder } from '../../data/mockData';

interface Props {
  po: PurchaseOrder;
  onClose: () => void;
}

export default function POPreviewModal({ po, onClose }: Props) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center bg-gray-50 rounded-t-lg">
          <div className="flex items-center gap-2">
            <div className="bg-white p-2 rounded-md border border-gray-200">
                <FileText className="w-5 h-5 text-[#ec2224]" />
            </div>
            <div>
                <h3 className="font-bold text-gray-900 text-lg">Purchase Order Preview</h3>
                <p className="text-sm text-gray-500">{po.poNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto bg-white">
            {/* PO Header Info */}
            <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Vendor Details</h4>
                    <div className="text-gray-900 font-medium text-lg">{po.vendorName}</div>
                    <div className="text-gray-600 mt-1">ID: {po.vendorId || '-'}</div>
                </div>
                <div className="text-right">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">PO Summary</h4>
                    <div className="flex justify-end gap-2 mb-1">
                        <span className="text-gray-600">Date:</span>
                        <span className="font-medium text-gray-900">{po.generatedDate}</span>
                    </div>
                    <div className="flex justify-end gap-2">
                        <span className="text-gray-600">Total Amount:</span>
                        <span className="font-bold text-[#ec2224]">
                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(po.totalAmount)}
                        </span>
                    </div>
                    <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {po.status} / {po.approvalStatus}
                    </div>
                </div>
            </div>

            {/* Line Items */}
            <div className="border rounded-lg overflow-hidden mb-6">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 text-left font-medium text-gray-700">Item Name</th>
                            <th className="px-6 py-3 text-right font-medium text-gray-700">Quantity</th>
                            <th className="px-6 py-3 text-right font-medium text-gray-700">Unit Price</th>
                            <th className="px-6 py-3 text-right font-medium text-gray-700">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {po.items.map((item, idx) => (
                            <tr key={idx}>
                                <td className="px-6 py-4 text-gray-900">
                                    <div className="font-medium">{item.itemName}</div>
                                    <div className="text-xs text-gray-500 mt-0.5">Category: {item.itemCategory}</div>
                                </td>
                                <td className="px-6 py-4 text-right text-gray-600">
                                    {item.quantity} {item.uom}
                                </td>
                                <td className="px-6 py-4 text-right text-gray-600">
                                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(item.unitPrice || 0)}
                                </td>
                                <td className="px-6 py-4 text-right font-medium text-gray-900">
                                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format((item.unitPrice || 0) * item.quantity)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                        <tr>
                            <td colSpan={3} className="px-6 py-4 text-right font-medium text-gray-900">Total Amount</td>
                            <td className="px-6 py-4 text-right font-bold text-[#ec2224] text-lg">
                                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(po.totalAmount)}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex justify-end gap-3 bg-gray-50 rounded-b-lg">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-white transition-colors">
            Close
          </button>
          <button className="px-4 py-2 bg-[#ec2224] text-white rounded-lg hover:bg-[#d11f21] flex items-center gap-2">
            <Download className="w-4 h-4" /> Download PDF
          </button>
        </div>
      </div>
    </div>
  );
}