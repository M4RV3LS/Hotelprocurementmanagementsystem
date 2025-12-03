// src/data/mockData.ts

export interface ActivityLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details?: string;
}

// Status type
export type ProcurementStatus =
  | "Review by Procurement"
  | "Waiting PO"
  | "Waiting PO Approval"
  | "Process by Vendor"
  | "Delivered"
  | "Closed"
  | "Cancelled by Procurement";

// 2. Revamped Request Status
export type RequestHeaderStatus = "Open" | "Close";

// 3. PO Statuses
export type POStatus = "Open" | "Close";
export type POApprovalStatus = "Pending" | "Approved";

export type ItemStatus = "Not Set" | "Cancelled" | "Ready";

export type PropertyType = "Leasing" | "Franchise";

export type PaymentTerms =
  | "Cash Before Delivery"
  | "Payment Terms";

// Daftar Region Indonesia (KEPT AS REQUESTED)
export const INDONESIA_REGIONS = [
  "Nanggroe Aceh Darussalam",
  "Sumatera Utara",
  "Sumatera Selatan",
  "Sumatera Barat",
  "Bengkulu",
  "Riau",
  "Kepulauan Riau",
  "Jambi",
  "Lampung",
  "Bangka Belitung",
  "Kalimantan Barat",
  "Kalimantan Timur",
  "Kalimantan Selatan",
  "Kalimantan Tengah",
  "Kalimantan Utara",
  "Banten",
  "DKI Jakarta",
  "Jawa Barat",
  "Jawa Tengah",
  "Daerah Istimewa Yogyakarta",
  "Jawa Timur",
  "Bali",
  "Nusa Tenggara Timur",
  "Nusa Tenggara Barat",
  "Gorontalo",
  "Sulawesi Barat",
  "Sulawesi Tengah",
  "Sulawesi Utara",
  "Sulawesi Tenggara",
  "Sulawesi Selatan",
  "Maluku Utara",
  "Maluku",
  "Papua Barat",
  "Papua",
  "Papua Tengah",
  "Papua Pegunungan",
  "Papua Selatan",
  "Papua Barat Daya",
];

export interface ProcurementItem {
  id: string;
  prNumber: string;
  itemCode: string;
  itemName: string;
  itemCategory: string;
  selectedProperties: Record<string, string>;
  quantity: number;
  uom: string;
  region: string;
  itemStatus: ItemStatus;
  status: ProcurementStatus;
  purchaseOrderId?: string;
  poNumber?: string;
  poDate?: string;
  designLink?: string;
  vendorName?: string;
  vendorCode?: string;
  paymentTerms?: PaymentTerms;
  unitPrice?: number;
  taxPercentage?: number;
  taxAmount?: number;
  totalPrice?: number;
  isFixedPrice?: boolean;
  estimatedDeliveryStart?: string;
  estimatedDeliveryEnd?: string;
}

export interface ProcurementRequest {
  prNumber: string;
  prDate: string;
  propertyName: string;
  propertyCode: string;
  propertyType: PropertyType;
  brandName: string;
  propertyAddress: string;
  picName: string;
  picNumber: string;
  requestorName: string;
  requestorEmail: string;
  poFileLink?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  invoiceFileLink?: string;
  activityLog?: ActivityLog[];
  status: RequestHeaderStatus; // Changed type
  items: ProcurementItem[];
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  generatedDate: string;
  vendorName: string; // Joined from vendor
  vendorId: string;
  status: POStatus;
  approvalStatus: POApprovalStatus;
  signedPoLink?: string;
  totalAmount: number;
  items: ProcurementItem[]; // Hydrated items
  prNumbers: string[]; // Derived list of PRs
}