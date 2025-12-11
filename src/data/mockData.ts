// src/data/mockData.ts

export interface ActivityLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details?: string;
}

export interface DeliveryProof {
  id: string;
  name: string;
  fileLink: string;
  uploadedAt: string;
}

// New Interface for Categories
export interface ItemCategory {
  id: string;
  name: string;
  itemCount?: number;
}

export type ProcurementStatus =
  | "Review by Procurement"
  | "Waiting PO"
  | "Waiting PO Approval"
  | "Process by Vendor"
  | "Delivered"
  | "Closed"
  | "Cancelled by Procurement"
  | "Pending Approval"
  | "Approved"
  | "Rejected";

export type RequestHeaderStatus =
  | "Open"
  | "Close"
  | "Pending Approval"
  | "Approved"
  | "Rejected";

export type POStatus = "Open" | "Close";
export type POApprovalStatus = "Pending" | "Approved";

export type ItemStatus = "Not Set" | "Cancelled" | "Ready";

export type PropertyType =
  | "Leasing"
  | "Franchise"
  | "Management";

export type PaymentTerms =
  | "Cash Before Delivery"
  | "Payment Terms"
  | string;

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

// Requirement 1: Predefined list of Regencies (Subset for Demo, expand as needed)
export const INDONESIA_REGENCIES = [
  "Jakarta Pusat",
  "Jakarta Selatan",
  "Jakarta Barat",
  "Jakarta Timur",
  "Jakarta Utara",
  "Kab. Bogor",
  "Kota Bogor",
  "Kota Depok",
  "Kab. Tangerang",
  "Kota Tangerang",
  "Kota Tangerang Selatan",
  "Kab. Bekasi",
  "Kota Bekasi",
  "Kota Bandung",
  "Kab. Bandung",
  "Kab. Bandung Barat",
  "Kota Cimahi",
  "Semarang",
  "Surabaya",
  "Yogyakarta",
  "Denpasar",
  "Badung",
  "Gianyar",
  "Medan",
  "Makassar",
  "Balikpapan",
  "Samarinda",
  "Pontianak",
  "Banjarmasin",
  "Manado",
  "Palembang",
  "Pekanbaru",
  "Batam",
].sort();

export interface ProcurementItem {
  id: string;
  prNumber: string;
  itemCode: string;
  itemName: string;
  itemCategory: string; // Display Name
  categoryId?: string; // Link ID
  description?: string; // New Field
  photos?: string[]; // New Field
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
  deliveryProofId?: string;
  deliveryDate?: string;
  rejectionReason?: string;
  rejectionProofLink?: string;
  propertyName?: string;
  propertyCode?: string;
  propertyAddress?: string;
  brandName?: string;
  picName?: string;
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
  status: RequestHeaderStatus;
  items: ProcurementItem[];
  note?: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  generatedDate: string;
  vendorName: string;
  vendorId: string;
  vendorEmail?: string;
  vendorAddress?: string;
  vendorPhone?: string;
  vendorContact?: string;
  status: POStatus;
  approvalStatus: POApprovalStatus;
  signedPoLink?: string;
  totalAmount: number;
  items: ProcurementItem[];
  prNumbers: string[];
  deliveryProofs?: DeliveryProof[];
}