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
  | "On Process by Vendor"
  | "Delivered"
  | "Finished";

export type ItemStatus = "Not Set" | "Cancelled" | "Ready";

export type PaymentTerms =
  | "Cash Before Delivery"
  | "Payment Terms";

// Daftar Region Indonesia
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

// Individual procurement item
export interface ProcurementItem {
  id: string;
  prNumber: string;
  itemCode: string;
  itemName: string;
  itemCategory: string;
  selectedProperties: Record<string, string>;
  quantity: number;
  uom: string;

  // Region attached to item
  region: string;

  itemStatus: ItemStatus;
  status: ProcurementStatus;

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
  propertyType: string;
  brandName: string;
  propertyAddress: string;
  picName: string;
  picNumber: string;
  requestorName: string;
  requestorEmail: string;

  // Fallback/Legacy fields
  poFileLink?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  invoiceFileLink?: string;

  items: ProcurementItem[];
  activityLog?: ActivityLog[];
}

export const vendors = [
  {
    vendorCode: "VND001",
    vendorName: "PT Furnindo Makmur",
    vendorRegion: ["DKI Jakarta", "Jawa Barat", "Banten"],
    vendorAddress: "Jl. Industri No. 123, Jakarta Pusat",
    vendorEmail: "contact@furnindo.com",
    vendorPhone: "+62 21 1234 5678",
    vendorAgreementLink: "#",
    ppnPercentage: 11,
    serviceChargePercentage: 0,
    pb1Percentage: 0,
    paymentMethods: [
      "Cash Before Delivery",
      "Payment Terms - NET 30",
      "Bank Transfer",
    ],
    agreements: [
      {
        id: "agr-001",
        type: "Agreement" as const,
        number: "AGR-2025-001",
        startDate: "2025-01-01",
        endDate: "2025-12-31",
        documentLink: "https://drive.google.com/agreement-001",
      },
      {
        id: "agr-010",
        type: "Agreement" as const,
        number: "AGR-2025-10", // The specific agreement requested
        startDate: "2025-01-01",
        endDate: "2025-12-31",
        documentLink: "#",
      },
    ],
    items: [
      {
        itemCode: "ITM001",
        itemName: "Branded Towel",
        selectedProperties: { Color: "White", Size: "Large" },
        minQuantity: 10,
        multipleOf: 5,
        priceType: "Fixed" as const,
        unitPrice: 50000,
        agreementNumber: "AGR-2025-001",
        taxPercentage: 11,
      },
      // SPECIFIC REQUESTED ITEM: Blue Shirt XL
      {
        itemCode: "ITM004",
        itemName: "Blue Shirt",
        selectedProperties: { Size: "XL" },
        minQuantity: 5,
        multipleOf: 1,
        priceType: "Fixed" as const,
        unitPrice: 10000, // Requested Price
        agreementNumber: "AGR-2025-10", // Requested Agreement
        taxPercentage: 11,
      },
      // Additional Item
      {
        itemCode: "ITM005",
        itemName: "Red Pillow",
        selectedProperties: { Size: "King Size" },
        minQuantity: 10,
        multipleOf: 2,
        priceType: "Fixed" as const,
        unitPrice: 75000,
        agreementNumber: "AGR-2025-001",
        taxPercentage: 11,
      },
    ],
    isActive: true,
  },
  {
    vendorCode: "VND002",
    vendorName: "CV Branding Solutions",
    vendorRegion: ["Bali", "Nusa Tenggara Barat"],
    vendorAddress: "Jl. Sunset Road No. 45, Kuta",
    vendorEmail: "info@brandingsolutions.com",
    vendorPhone: "+62 361 987 654",
    vendorAgreementLink: "#",
    ppnPercentage: 11,
    serviceChargePercentage: 2,
    pb1Percentage: 0,
    paymentMethods: [
      "Cash Before Delivery",
      "Payment Terms - NET 45",
      "Credit Card",
    ],
    agreements: [
      {
        id: "off-001",
        type: "Offering" as const,
        number: "OFF-2025-005",
        startDate: "2025-01-15",
        endDate: "2025-06-15",
        documentLink: "https://drive.google.com/offering-005",
      },
    ],
    items: [
      {
        itemCode: "ITM002",
        itemName: "Room Signage",
        selectedProperties: {
          Material: "Acrylic",
          Size: "30x40cm",
        },
        minQuantity: 5,
        multipleOf: 1,
        priceType: "Fixed" as const,
        unitPrice: 150000,
        agreementNumber: "OFF-2025-005",
        taxPercentage: 11,
      },
    ],
    isActive: true,
  },
  {
    vendorCode: "VND003",
    vendorName: "Amenities Supplier Co.",
    vendorRegion: ["Jawa Barat", "DKI Jakarta"],
    vendorAddress: "Jl. Gatot Subroto 789, Bandung",
    vendorEmail: "sales@amenitiessupplier.co.id",
    vendorPhone: "+62 22 456 7890",
    vendorAgreementLink: "#",
    ppnPercentage: 11,
    serviceChargePercentage: 0,
    pb1Percentage: 1,
    paymentMethods: [
      "Cash Before Delivery",
      "Bank Transfer",
      "Cash on Delivery (COD)",
    ],
    agreements: [],
    items: [
      {
        itemCode: "ITM003",
        itemName: "Toiletries Set",
        selectedProperties: { Type: "Premium" },
        minQuantity: 20,
        multipleOf: 10,
        priceType: "Not Fixed" as const,
        unitPrice: 0,
        agreementNumber: "",
        taxPercentage: 11,
      },
    ],
    isActive: true,
  },
  // NEW VENDOR FOR MORE DATA
  {
    vendorCode: "VND004",
    vendorName: "CV Textile Sejahtera",
    vendorRegion: ["Jawa Tengah", "Daerah Istimewa Yogyakarta"],
    vendorAddress: "Jl. Solo No. 55, Yogyakarta",
    vendorEmail: "sales@textilesejahtera.com",
    vendorPhone: "+62 274 555 666",
    vendorAgreementLink: "#",
    ppnPercentage: 11,
    serviceChargePercentage: 0,
    pb1Percentage: 0,
    paymentMethods: ["Cash Before Delivery", "Bank Transfer"],
    agreements: [],
    items: [
      {
        itemCode: "ITM002",
        itemName: "Room Signage",
        selectedProperties: {
          Material: "Metal",
          Size: "20x30cm",
        },
        minQuantity: 10,
        multipleOf: 1,
        priceType: "Not Fixed" as const,
        unitPrice: 0,
        agreementNumber: "",
        taxPercentage: 11,
      },
    ],
    isActive: true,
  },
];

export const items = [
  {
    itemCode: "ITM001",
    itemName: "Branded Towel",
    brandName: "Reddoorz",
    itemCategory: "Branding Item",
    uom: "pcs",
    properties: [
      {
        name: "Color",
        values: ["White", "Red", "Gray", "Blue"],
      },
      { name: "Size", values: ["Small", "Medium", "Large"] },
    ],
    isActive: true,
  },
  {
    itemCode: "ITM002",
    itemName: "Room Signage",
    brandName: "Sans",
    itemCategory: "Branding Item",
    uom: "pcs",
    properties: [
      {
        name: "Material",
        values: ["Acrylic", "Metal", "Wood"],
      },
      { name: "Size", values: ["20x30cm", "30x40cm"] },
    ],
    isActive: true,
  },
  {
    itemCode: "ITM003",
    itemName: "Toiletries Set",
    brandName: "No Branding",
    itemCategory: "Ops Item",
    uom: "sets",
    properties: [
      { name: "Type", values: ["Basic", "Premium"] },
    ],
    isActive: true,
  },
  {
    itemCode: "ITM004",
    itemName: "Blue Shirt",
    brandName: "Reddoorz",
    itemCategory: "Branding Item",
    uom: "pcs",
    properties: [
      { name: "Size", values: ["S", "M", "L", "XL", "XXL"] },
    ],
    isActive: true,
  },
  {
    itemCode: "ITM005",
    itemName: "Red Pillow",
    brandName: "Reddoorz",
    itemCategory: "Ops Item",
    uom: "pcs",
    properties: [
      {
        name: "Size",
        values: ["Standard", "King Size", "Queen Size"],
      },
    ],
    isActive: true,
  },
  {
    itemCode: "ITM006",
    itemName: "White Towel",
    brandName: "No Branding",
    itemCategory: "Ops Item",
    uom: "pcs",
    properties: [
      { name: "Size", values: ["70x140cm", "80x160cm"] },
    ],
    isActive: true,
  },
];

export const procurementRequests: ProcurementRequest[] = [
  {
    prNumber: "CF_REQ_6304",
    prDate: "2024-11-20",
    propertyName: "RedDoorz Plus Jakarta",
    propertyCode: "JKT-KMG-001",
    propertyType: "Hotel",
    brandName: "Reddoorz Premium",
    propertyAddress: "Jl. Kemang Raya No. 12, Jakarta Selatan",
    picName: "John Doe",
    picNumber: "+62 812 3456 7890",
    requestorName: "Jane Smith",
    requestorEmail: "jane.smith@reddoorz.com",
    activityLog: [
      {
        id: "log-1",
        timestamp: "2024-11-20T09:15:00",
        user: "jane.smith@reddoorz.com",
        action: "Request Created",
        details: "PR CF_REQ_6304 created by Property Team",
      },
    ],
    items: [
      // TEST CASE 1: Blue Shirt XL in DKI Jakarta (Should match VND001)
      {
        id: "1-1",
        prNumber: "CF_REQ_6304",
        itemCode: "ITM004",
        itemName: "Blue Shirt",
        itemCategory: "Branding Item",
        selectedProperties: { Size: "XL" },
        quantity: 50,
        uom: "pcs",
        region: "DKI Jakarta",
        itemStatus: "Not Set",
        status: "Review by Procurement",
        designLink: "https://figma.com/design/example",
      },
      {
        id: "1-2",
        prNumber: "CF_REQ_6304",
        itemCode: "ITM005",
        itemName: "Red Pillow",
        itemCategory: "Ops Item",
        selectedProperties: { Size: "King Size" },
        quantity: 30,
        uom: "pcs",
        region: "DKI Jakarta",
        itemStatus: "Not Set",
        status: "Review by Procurement",
      },
      {
        id: "1-3",
        prNumber: "CF_REQ_6304",
        itemCode: "ITM006",
        itemName: "White Towel",
        itemCategory: "Ops Item",
        selectedProperties: { Size: "70x140cm" },
        quantity: 20,
        uom: "pcs",
        region: "DKI Jakarta",
        itemStatus: "Not Set",
        status: "Review by Procurement",
      },
    ],
  },
  {
    prNumber: "CF_REQ_6305",
    prDate: "2024-11-18",
    propertyName: "Sans Hotel Bali",
    propertyCode: "DPS-BCH-002",
    propertyType: "Hotel",
    brandName: "Sans Stay",
    propertyAddress: "Jl. Pantai Kuta No. 88, Bali",
    picName: "Sarah Johnson",
    picNumber: "+62 821 9876 5432",
    requestorName: "Mike Brown",
    requestorEmail: "mike.brown@reddoorz.com",
    items: [
      {
        id: "2-1",
        prNumber: "CF_REQ_6305",
        itemCode: "ITM003",
        itemName: "Toiletries Set",
        itemCategory: "Ops Item",
        selectedProperties: { Type: "Premium" },
        quantity: 100,
        uom: "sets",
        region: "Bali",
        itemStatus: "Ready",
        status: "Waiting PO",
        vendorName: "Amenities Supplier Co.",
        vendorCode: "VND003",
        paymentTerms: "Payment Terms",
        unitPrice: 35000,
        taxPercentage: 11,
        taxAmount: 385000,
        totalPrice: 3885000,
      },
    ],
  },
  {
    prNumber: "CF_REQ_6306",
    prDate: "2024-11-15",
    propertyName: "RedLiving @ Sudirman",
    propertyCode: "JKT-SDR-003",
    propertyType: "Apartment",
    brandName: "RedLiving",
    propertyAddress: "Jl. Jend. Sudirman Kav. 52-53, Jakarta",
    picName: "David Lee",
    picNumber: "+62 813 2468 1357",
    requestorName: "Emily Chen",
    requestorEmail: "emily.chen@reddoorz.com",
    items: [
      {
        id: "3-1",
        prNumber: "CF_REQ_6306",
        itemCode: "ITM002",
        itemName: "Room Signage",
        itemCategory: "Branding Item",
        selectedProperties: {
          Material: "Acrylic",
          Size: "30x40cm",
        },
        quantity: 25,
        uom: "pcs",
        region: "DKI Jakarta",
        itemStatus: "Ready",
        status: "Waiting PO",
        designLink: "https://figma.com/design/example2",
        vendorName: "CV Branding Solutions",
        vendorCode: "VND002",
        paymentTerms: "Cash Before Delivery",
        unitPrice: 150000,
        taxPercentage: 11,
        taxAmount: 412500,
        totalPrice: 4162500,
      },
    ],
  },
  {
    prNumber: "CF_REQ_6307",
    prDate: "2024-11-12",
    propertyName: "The Lavana @ Seminyak",
    propertyCode: "DPS-SMY-004",
    propertyType: "Resort",
    brandName: "The Lavana",
    propertyAddress: "Jl. Kayu Aya No. 123, Seminyak, Bali",
    picName: "Lisa Anderson",
    picNumber: "+62 822 1122 3344",
    requestorName: "Robert Taylor",
    requestorEmail: "robert.taylor@reddoorz.com",
    items: [
      {
        id: "4-1",
        prNumber: "CF_REQ_6307",
        itemCode: "ITM001",
        itemName: "Branded Towel",
        itemCategory: "Branding Item",
        selectedProperties: { Color: "Gray", Size: "Medium" },
        quantity: 75,
        uom: "pcs",
        region: "Bali",
        itemStatus: "Ready",
        status: "On Process by Vendor",
        poNumber: "PO2025000241VIIDRMI",
        poDate: "2024-11-16",
        vendorName: "PT Furnindo Makmur",
        vendorCode: "VND001",
        paymentTerms: "Payment Terms",
        unitPrice: 45000,
        taxPercentage: 11,
        taxAmount: 371250,
        totalPrice: 3746250,
        estimatedDeliveryStart: "2024-11-25",
        estimatedDeliveryEnd: "2024-11-28",
      },
    ],
  },
  {
    prNumber: "CF_REQ_6308",
    prDate: "2024-11-08",
    propertyName: "Sans Vibe @ Yogyakarta",
    propertyCode: "YGY-CTR-006",
    propertyType: "Hotel",
    brandName: "Sans Vibe",
    propertyAddress: "Jl. Malioboro No. 99, Yogyakarta",
    picName: "Rachel Green",
    picNumber: "+62 274 123 456",
    requestorName: "Chris Martin",
    requestorEmail: "chris.martin@reddoorz.com",
    items: [
      {
        id: "5-1",
        prNumber: "CF_REQ_6308",
        itemCode: "ITM002",
        itemName: "Room Signage",
        itemCategory: "Branding Item",
        selectedProperties: {
          Material: "Metal",
          Size: "20x30cm",
        },
        quantity: 30,
        uom: "pcs",
        region: "Daerah Istimewa Yogyakarta",
        itemStatus: "Ready",
        status: "On Process by Vendor",
        poNumber: "PO2025000242VIIDRMI",
        poDate: "2024-11-12",
        designLink: "https://figma.com/design/example3",
        vendorName: "CV Branding Solutions",
        vendorCode: "VND002",
        paymentTerms: "Cash Before Delivery",
        unitPrice: 180000,
        taxPercentage: 11,
        taxAmount: 594000,
        totalPrice: 5994000,
        estimatedDeliveryStart: "2024-11-20",
        estimatedDeliveryEnd: "2024-11-22",
      },
    ],
  },
  {
    prNumber: "CF_REQ_6309",
    prDate: "2024-11-05",
    propertyName: "Sans Elite @ Surabaya",
    propertyCode: "SUB-CTR-007",
    propertyType: "Hotel",
    brandName: "Sans Elite",
    propertyAddress: "Jl. Tunjungan No. 77, Surabaya",
    picName: "Monica Geller",
    picNumber: "+62 31 987 654",
    requestorName: "Alex Turner",
    requestorEmail: "alex.turner@reddoorz.com",
    invoiceNumber: "INV-2024-001",
    invoiceDate: "2024-11-21",
    invoiceFileLink: "#",
    items: [
      {
        id: "6-1",
        prNumber: "CF_REQ_6309",
        itemCode: "ITM001",
        itemName: "Branded Towel",
        itemCategory: "Branding Item",
        selectedProperties: { Color: "Red", Size: "Large" },
        quantity: 60,
        uom: "pcs",
        region: "Jawa Timur",
        itemStatus: "Ready",
        status: "Delivered",
        poNumber: "PO2025000243VIIDRMI",
        poDate: "2024-11-09",
        vendorName: "PT Furnindo Makmur",
        vendorCode: "VND001",
        paymentTerms: "Payment Terms",
        unitPrice: 55000,
        taxPercentage: 11,
        taxAmount: 363000,
        totalPrice: 3663000,
        estimatedDeliveryStart: "2024-11-18",
        estimatedDeliveryEnd: "2024-11-20",
      },
    ],
  },
  {
    prNumber: "CF_REQ_6310",
    prDate: "2024-11-17",
    propertyName: "RedDoorz @ Tanah Abang",
    propertyCode: "JKT-TAB-008",
    propertyType: "Hotel",
    brandName: "RedDoorz",
    propertyAddress: "Jl. Tanah Abang No. 55, Jakarta Pusat",
    picName: "Maria Santos",
    picNumber: "+62 812 9999 8888",
    requestorName: "Kevin Tan",
    requestorEmail: "kevin.tan@reddoorz.com",
    items: [
      {
        id: "7-1",
        prNumber: "CF_REQ_6310",
        itemCode: "ITM003",
        itemName: "Toiletries Set",
        itemCategory: "Ops Item",
        selectedProperties: { Type: "Premium" },
        quantity: 50,
        uom: "sets",
        region: "DKI Jakarta",
        itemStatus: "Not Set",
        status: "Waiting PO",
        vendorName: "Amenities Supplier Co.",
        vendorCode: "VND003",
        paymentTerms: "Payment Terms",
        unitPrice: 35000,
        taxPercentage: 11,
        taxAmount: 192500,
        totalPrice: 1942500,
      },
    ],
  },
  {
    prNumber: "CF_REQ_6311",
    prDate: "2024-11-16",
    propertyName: "Sans Hotel Bandung",
    propertyCode: "BDG-001",
    propertyType: "Hotel",
    brandName: "Sans",
    propertyAddress: "Jl. Dago No. 100, Bandung",
    picName: "Tommy Lee",
    picNumber: "+62 822 7777 6666",
    requestorName: "Diana Chen",
    requestorEmail: "diana.chen@reddoorz.com",
    items: [
      {
        id: "8-1",
        prNumber: "CF_REQ_6311",
        itemCode: "ITM001",
        itemName: "Branded Towel",
        itemCategory: "Branding Item",
        selectedProperties: { Color: "White", Size: "Large" },
        quantity: 100,
        uom: "pcs",
        region: "Jawa Barat",
        itemStatus: "Not Set",
        status: "Waiting PO",
        vendorName: "PT Furnindo Makmur",
        vendorCode: "VND001",
        paymentTerms: "Cash Before Delivery",
        unitPrice: 50000,
        taxPercentage: 11,
        taxAmount: 550000,
        totalPrice: 5550000,
      },
    ],
  },
];