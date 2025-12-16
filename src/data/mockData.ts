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

export interface ItemCategory {
  id: string;
  name: string;
  isActive: boolean;
  itemCount?: number;
}

export const COMMODITIES_LIST = [
  { code: "1001", name: "Textiles & Fabrics" },
  { code: "1002", name: "Furniture & Fixtures" },
  { code: "1003", name: "Electronics & Appliances" },
  { code: "1004", name: "Cleaning Supplies" },
  { code: "1005", name: "Food & Beverage" },
  { code: "1006", name: "Office Supplies" },
  { code: "1007", name: "Construction Materials" },
  { code: "1008", name: "IT Equipment" },
];

export const BRAND_NAMES = [
  "Reddoorz",
  "Reddoorz Premium",
  "RedLiving",
  "Sans",
  "Sans Vibe",
  "Sans Stay",
  "Sans Elite",
  "Urban View",
  "The Lavana",
  "No Branding",
  "Vibes by SANS",
];

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

export type ItemType = "Product" | "Service";

export interface ProcurementItem {
  id: string;
  prNumber: string;
  itemCode: string;
  itemName: string;
  itemCategory: string;
  categoryId?: string;
  description?: string;
  photos?: string[];
  commodityCode?: string;
  commodityName?: string;
  selectedProperties: Record<string, string>;
  quantity: number;
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

export interface Item {
  itemCode: string;
  itemName: string;
  brandName: string;
  itemCategory: string;
  categoryId?: string;
  isActive: boolean;
  description?: string;
  photos?: string[];
  commodityCode?: string;
  commodityName?: string;
  itemType: ItemType;
  weightage?: number;
  length?: number;
  width?: number;
  height?: number;
  weight?: number;
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