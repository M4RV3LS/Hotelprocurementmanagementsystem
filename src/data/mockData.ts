//mockData.ts
export interface ActivityLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details?: string;
}

export const vendors = [
  {
    vendorCode: "VND001",
    vendorName: "PT Furnindo Makmur",
    vendorIsland: "Java",
    vendorAddress: "Jl. Industri No. 123, Jakarta Pusat",
    vendorEmail: "contact@furnindo.com",
    vendorPhone: "+62 21 1234 5678",
    vendorAgreementLink: "#",
    // Tax Configuration
    ppnPercentage: 11,
    serviceChargePercentage: 0,
    pb1Percentage: 0,
    // Payment Methods
    paymentMethods: [
      "Cash Before Delivery",
      "Payment Terms - NET 30",
      "Bank Transfer",
    ],
    // Agreements/Offerings
    agreements: [
      {
        id: "agr-001",
        type: "Agreement" as const,
        number: "AGR-2025-001",
        startDate: "2025-01-01",
        endDate: "2025-12-31",
        documentLink: "https://drive.google.com/agreement-001",
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
    ],
    isActive: true,
  },
  {
    vendorCode: "VND002",
    vendorName: "CV Branding Solutions",
    vendorIsland: "Bali",
    vendorAddress: "Jl. Sunset Road No. 45, Kuta",
    vendorEmail: "info@brandingsolutions.com",
    vendorPhone: "+62 361 987 654",
    vendorAgreementLink: "#",
    // Tax Configuration
    ppnPercentage: 11,
    serviceChargePercentage: 2,
    pb1Percentage: 0,
    // Payment Methods
    paymentMethods: [
      "Cash Before Delivery",
      "Payment Terms - NET 45",
      "Credit Card",
    ],
    // Agreements/Offerings
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
    vendorIsland: "Java",
    vendorAddress: "Jl. Gatot Subroto 789, Bandung",
    vendorEmail: "sales@amenitiessupplier.co.id",
    vendorPhone: "+62 22 456 7890",
    vendorAgreementLink: "#",
    // Tax Configuration
    ppnPercentage: 11,
    serviceChargePercentage: 0,
    pb1Percentage: 1,
    // Payment Methods
    paymentMethods: [
      "Cash Before Delivery",
      "Bank Transfer",
      "Cash on Delivery (COD)",
    ],
    // Agreements/Offerings
    agreements: [],
    items: [
      {
        itemCode: "ITM003",
        itemName: "Toiletries Set",
        selectedProperties: { Type: "Premium" },
        minQuantity: 20,
        multipleOf: 10,
        priceType: "Not Fixed" as const,
        unitPrice: 0, // No price configured - manual input required
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

// Status type - updated to 4 statuses
export type ProcurementStatus =
  | "Review by Procurement"
  | "Waiting PO"
  | "On Process by Vendor"
  | "Delivered";

export type ItemStatus = "Not Set" | "Cancelled" | "Ready";

export type PaymentTerms =
  | "Cash Before Delivery"
  | "Payment Terms";

// Individual procurement item
export interface ProcurementItem {
  id: string;
  prNumber: string; // CF_REQ_XXXX format
  itemCode: string;
  itemName: string;
  itemCategory: string;
  selectedProperties: Record<string, string>;
  quantity: number;
  uom: string;
  itemStatus: ItemStatus;
  designLink?: string;
  // Item-level vendor and payment info
  vendorName?: string;
  vendorCode?: string;
  paymentTerms?: PaymentTerms;
  // Pricing
  unitPrice?: number;
  taxPercentage?: number;
  taxAmount?: number;
  totalPrice?: number;
}

// Purchase request (can have multiple items)
export interface ProcurementRequest {
  prNumber: string; // CF_REQ_XXXX format
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
  status: ProcurementStatus;
  vendorName?: string;
  vendorCode?: string;
  paymentTerms?: PaymentTerms;
  poNumber?: string; // PO2025XXXXXXVIIDRMI format
  poDate?: string;
  poFileLink?: string;
  estimatedDeliveryStart?: string;
  estimatedDeliveryEnd?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  invoiceFileLink?: string;
  items: ProcurementItem[];
  activityLog?: ActivityLog[];
}

// Mock procurement requests with new structure
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
    status: "Review by Procurement",
    activityLog: [
      {
        id: "log-" + Date.now(),
        timestamp: "2024-11-20T09:15:00",
        user: "jane.smith@reddoorz.com",
        action: "Request Created",
        details: "PR CF_REQ_6304 created by Property Team",
      },
    ],
    items: [
      {
        id: "1-1",
        prNumber: "CF_REQ_6304",
        itemCode: "ITM004",
        itemName: "Blue Shirt",
        itemCategory: "Branding Item",
        selectedProperties: { Size: "XL" },
        quantity: 50,
        uom: "pcs",
        itemStatus: "Not Set",
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
        itemStatus: "Not Set",
        designLink: "",
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
        itemStatus: "Not Set",
        designLink: "",
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
    status: "Waiting PO",
    vendorName: "Amenities Supplier Co.",
    vendorCode: "VND003",
    paymentTerms: "Payment Terms",
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
        itemStatus: "Ready",
        designLink: "",
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
    status: "Waiting PO",
    vendorName: "CV Branding Solutions",
    vendorCode: "VND002",
    paymentTerms: "Cash Before Delivery",
    poNumber: "PO2025000240VIIDRMI",
    poDate: "2024-11-19",
    poFileLink: "#",
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
        itemStatus: "Ready",
        designLink: "https://figma.com/design/example2",
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
    status: "On Process by Vendor",
    vendorName: "PT Furnindo Makmur",
    vendorCode: "VND001",
    paymentTerms: "Payment Terms",
    poNumber: "PO2025000241VIIDRMI",
    poDate: "2024-11-16",
    poFileLink: "#",
    estimatedDeliveryStart: "2024-11-25",
    estimatedDeliveryEnd: "2024-11-28",
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
        itemStatus: "Ready",
        designLink: "",
        unitPrice: 45000,
        taxPercentage: 11,
        taxAmount: 371250,
        totalPrice: 3746250,
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
    status: "On Process by Vendor",
    vendorName: "CV Branding Solutions",
    vendorCode: "VND002",
    paymentTerms: "Cash Before Delivery",
    poNumber: "PO2025000242VIIDRMI",
    poDate: "2024-11-12",
    poFileLink: "#",
    estimatedDeliveryStart: "2024-11-20",
    estimatedDeliveryEnd: "2024-11-22",
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
        itemStatus: "Ready",
        designLink: "https://figma.com/design/example3",
        unitPrice: 180000,
        taxPercentage: 11,
        taxAmount: 594000,
        totalPrice: 5994000,
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
    status: "Delivered",
    vendorName: "PT Furnindo Makmur",
    vendorCode: "VND001",
    paymentTerms: "Payment Terms",
    poNumber: "PO2025000243VIIDRMI",
    poDate: "2024-11-09",
    poFileLink: "#",
    estimatedDeliveryStart: "2024-11-18",
    estimatedDeliveryEnd: "2024-11-20",
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
        itemStatus: "Ready",
        designLink: "",
        unitPrice: 55000,
        taxPercentage: 11,
        taxAmount: 363000,
        totalPrice: 3663000,
      },
    ],
  },
  // Additional Waiting PO requests for Generate PO testing
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
    status: "Waiting PO",
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
        itemStatus: "Not Set",
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
    status: "Waiting PO",
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
        itemStatus: "Not Set",
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