// src/data/seedData.ts
import type { ProcurementRequest } from "./mockData";
import { comprehensiveSampleRequests } from "./mockData-comprehensive";

export const initialVendors = [
  {
    vendorCode: "VND001",
    vendorName: "PT Furnindo Makmur",
    vendorRegion: ["DKI Jakarta", "Jawa Barat", "Banten"],
    vendorAddress: "Jl. Industri No. 123, Jakarta Pusat",
    vendorEmail: "contact@furnindo.com",
    vendorPhone: "+62 21 1234 5678",
    contact_person: "Budi Santoso",
    vendorAgreementLink: "https://drive.google.com/agreement",
    vendorType: "Corporation",
    ppnPercentage: 11,
    serviceChargePercentage: 0,
    pb1Percentage: 0,
    paymentMethods: [
      "Cash Before Delivery",
      "Payment Terms - NET 30",
      "Bank Transfer",
    ],
    nibNumber: "9120101822192",
    nibFileLink:
      "https://storage.supabase.co/legal/nib-vnd001.pdf",
    npwpNumber: "82.112.334.5-678.000",
    npwpFileLink:
      "https://storage.supabase.co/legal/npwp-vnd001.pdf",
    sppkpNumber: "S-123/PKP/2023",
    sppkpFileLink:
      "https://storage.supabase.co/legal/sppkp-vnd001.pdf",
    deedNumber: "Akta No. 50 (2010)",
    deedFileLink:
      "https://storage.supabase.co/legal/deed-vnd001.pdf",
    sbuNumber: "0-3171-06-003-1-09-002345",
    sbuFileLink:
      "https://storage.supabase.co/legal/sbu-vnd001.pdf",

    bankName: "BCA",
    bankAccountName: "PT Furnindo Makmur",
    bankAccountNumber: "1234567890",
    bankAccountDocLink:
      "https://storage.supabase.co/legal/bank-vnd001.pdf",

    agreements: [
      {
        id: "agr-001",
        type: "Agreement" as const,
        documentNumber: "AGR-2025-001",
        startDate: "2025-01-01",
        endDate: "2025-12-31",
        documentLink: "https://drive.google.com/agreement-001",
      },
    ],
    items: [
      {
        itemCode: "ITM001",
        itemName: "Branded Towel",
        minQuantity: 10,
        multipleOf: 5,
        priceType: "Fixed" as const,
        unitPrice: 50000,
        agreementNumber: "AGR-2025-001",
        taxPercentage: 11,
        propertyTypes: ["Franchise", "Leasing"],
      },
      {
        itemCode: "ITM004",
        itemName: "Blue Shirt",
        minQuantity: 5,
        multipleOf: 1,
        priceType: "Fixed" as const,
        unitPrice: 10000,
        agreementNumber: "AGR-2025-001",
        taxPercentage: 11,
        propertyTypes: ["Management"],
      },
    ],
    isActive: true,
  },
];

export const initialItems = [
  {
    itemCode: "ITM001",
    itemName: "Branded Towel",
    brandName: "Reddoorz",
    itemCategory: "Branding Item",
    isActive: true,
    itemType: "Product",
  },
  {
    itemCode: "ITM002",
    itemName: "Room Signage",
    brandName: "Sans",
    itemCategory: "Branding Item",
    isActive: true,
    itemType: "Product",
  },
  {
    itemCode: "ITM003",
    itemName: "Toiletries Set",
    brandName: "No Branding",
    itemCategory: "Ops Item",
    isActive: true,
    itemType: "Product",
  },
  {
    itemCode: "ITM004",
    itemName: "Blue Shirt",
    brandName: "Reddoorz",
    itemCategory: "Branding Item",
    isActive: true,
    itemType: "Product",
  },
  {
    itemCode: "ITM005",
    itemName: "Red Pillow",
    brandName: "Reddoorz",
    itemCategory: "Ops Item",
    isActive: true,
    itemType: "Product",
  },
  {
    itemCode: "ITM006",
    itemName: "White Towel",
    brandName: "No Branding",
    itemCategory: "Ops Item",
    isActive: true,
    itemType: "Product",
  },
];

export const initialRequests: ProcurementRequest[] = [
  {
    prNumber: "CF_REQ_6304",
    prDate: "2024-11-20",
    propertyName: "RedDoorz Plus Jakarta",
    propertyCode: "JKT-KMG-001",
    propertyType: "Leasing",
    brandName: "Reddoorz Premium",
    propertyAddress: "Jl. Kemang Raya No. 12, Jakarta Selatan",
    picName: "John Doe",
    picNumber: "+62 812 3456 7890",
    requestorName: "Jane Smith",
    requestorEmail: "jane.smith@reddoorz.com",
    status: "Review by Procurement",
    activityLog: [],
    items: [
      {
        id: "1-1",
        prNumber: "CF_REQ_6304",
        itemCode: "ITM004",
        itemName: "Blue Shirt",
        itemCategory: "Branding Item",
        selectedProperties: {},
        quantity: 50,
        region: "DKI Jakarta",
        itemStatus: "Not Set",
        status: "Review by Procurement",
      },
    ],
  },
  ...comprehensiveSampleRequests,
];