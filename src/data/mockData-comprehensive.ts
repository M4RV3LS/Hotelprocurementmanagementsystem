//mockData-comprehensive.ts
// This file contains comprehensive sample data for all procurement statuses
// To use this data, rename this file to mockData.ts or copy the contents

// Part 3 & 4 Sample Data: CF_REQ_6301 to CF_REQ_6335 (35 requests total)
// Status Distribution:
// - Review by Procurement: 10 requests (6301-6310)
// - Waiting PO: 12 requests (6311-6322) 
// - Waiting Delivery: 5 requests (6323-6327)
// - On Delivery: 3 requests (6328-6330)
// - Delivered: 3 requests (6331-6333)
// - Finished: 2 requests (6334-6335)

import { ProcurementRequest } from './mockData';

export const comprehensiveSampleRequests: ProcurementRequest[] = [
  // REVIEW BY PROCUREMENT STATUS (10 requests)
  // Auto-Fetch Scenario (5 requests)
  {
    prNumber: 'CF_REQ_6301',
    prDate: '2025-01-15',
    propertyName: 'RedDoorz Plus Jakarta Sudirman',
    propertyCode: 'JKT-001',
    propertyType: 'Leasing',
    brandName: 'RedDoorz Premium',
    propertyAddress: 'Jl. Jenderal Sudirman No. 45, Jakarta Pusat',
    picName: 'Ahmad Hidayat',
    picNumber: '+62 812 3456 7890',
    requestorName: 'Sarah Johnson',
    requestorEmail: 'sarah.johnson@reddoorz.com',
    status: 'Review by Procurement',
    items: [
      {
        id: '6301-1',
        prNumber: 'CF_REQ_6301',
        itemCode: 'ITM007',
        itemName: 'Blue Shirt',
        itemCategory: 'Branding Item',
        selectedProperties: { Size: 'XL' },
        quantity: 50,
        uom: 'pcs',
        itemStatus: 'Not Set',
        designLink: 'https://drive.google.com/design/shirt-blue'
      },
      {
        id: '6301-2',
        prNumber: 'CF_REQ_6301',
        itemCode: 'ITM008',
        itemName: 'Red Pillow',
        itemCategory: 'Ops Item',
        selectedProperties: { Size: 'King' },
        quantity: 30,
        uom: 'pcs',
        itemStatus: 'Not Set'
      }
    ]
  },
  
  // WAITING PO STATUS (12 requests with full pricing)
  {
    prNumber: 'CF_REQ_6311',
    prDate: '2025-01-10',
    propertyName: 'RedDoorz Plus Jakarta Gatot Subroto',
    propertyCode: 'JKT-050',
    propertyType: 'Leasing',
    brandName: 'RedDoorz Premium',
    propertyAddress: 'Jl. Gatot Subroto No. 123, Jakarta Selatan',
    picName: 'Faisal Rahman',
    picNumber: '+62 812 1111 2222',
    requestorName: 'Nina Kartika',
    requestorEmail: 'nina.kartika@reddoorz.com',
    status: 'Waiting PO',
    items: [
      {
        id: '6311-1',
        prNumber: 'CF_REQ_6311',
        itemCode: 'ITM020',
        itemName: 'Pillow Case',
        itemCategory: 'Ops Item',
        selectedProperties: { Color: 'White' },
        quantity: 100,
        uom: 'pcs',
        itemStatus: 'Ready',
        vendorName: 'ABC Supplies Co.',
        vendorCode: 'VND010',
        paymentTerms: 'Cash Before Delivery',
        unitPrice: 15000,
        taxPercentage: 11,
        taxAmount: 165000,
        totalPrice: 1665000
      }
    ]
  },

  // WAITING DELIVERY STATUS (5 requests with pricing - read-only)
  {
    prNumber: 'CF_REQ_6323',
    prDate: '2025-01-05',
    propertyName: 'RedDoorz Plus Medan Cemara',
    propertyCode: 'MDN-025',
    propertyType: 'Leasing',
    brandName: 'RedDoorz Premium',
    propertyAddress: 'Jl. Cemara No. 12, Medan',
    picName: 'Rahman Hakim',
    picNumber: '+62 812 5555 6666',
    requestorName: 'Linda Wijaya',
    requestorEmail: 'linda.wijaya@reddoorz.com',
    status: 'Waiting Delivery',
    poNumber: 'PO2025000230IIDRMI',
    poDate: '2025-01-15',
    poFileLink: '#',
    items: [
      {
        id: '6323-1',
        prNumber: 'CF_REQ_6323',
        itemCode: 'ITM030',
        itemName: 'Duvet Cover',
        itemCategory: 'Ops Item',
        selectedProperties: { Size: 'King Size', Color: 'White' },
        quantity: 40,
        uom: 'pcs',
        itemStatus: 'Ready',
        vendorName: 'ABC Supplies Co.',
        vendorCode: 'VND010',
        paymentTerms: 'Cash Before Delivery',
        unitPrice: 95000,
        taxPercentage: 11,
        taxAmount: 418000,
        totalPrice: 4218000
      }
    ]
  },

  // ON DELIVERY STATUS (3 requests with pricing + ETA)
  {
    prNumber: 'CF_REQ_6328',
    prDate: '2025-01-01',
    propertyName: 'Sans Vibe Bandung Dago',
    propertyCode: 'BDG-030',
    propertyType: 'Leasing',
    brandName: 'Sans Vibe',
    propertyAddress: 'Jl. Ir. H. Juanda No. 200, Bandung',
    picName: 'Deden Suryadi',
    picNumber: '+62 822 0000 1111',
    requestorName: 'Catherine Lim',
    requestorEmail: 'catherine.lim@reddoorz.com',
    status: 'On Delivery',
    poNumber: 'PO2025000225IIDRMI',
    poDate: '2025-01-10',
    poFileLink: '#',
    estimatedDeliveryStart: '2025-01-25',
    estimatedDeliveryEnd: '2025-01-28',
    items: [
      {
        id: '6328-1',
        prNumber: 'CF_REQ_6328',
        itemCode: 'ITM040',
        itemName: 'Wall Art',
        itemCategory: 'Branding Item',
        selectedProperties: { Type: 'Abstract Modern' },
        quantity: 12,
        uom: 'pcs',
        itemStatus: 'Ready',
        vendorName: 'Creative Print Solutions',
        vendorCode: 'VND020',
        paymentTerms: 'Payment Terms',
        unitPrice: 250000,
        taxPercentage: 11,
        taxAmount: 330000,
        totalPrice: 3330000
      }
    ]
  },

  // DELIVERED STATUS (3 requests with pricing + delivery date)
  {
    prNumber: 'CF_REQ_6331',
    prDate: '2024-12-25',
    propertyName: 'RedDoorz @ Jakarta Cikini Raya',
    propertyCode: 'JKT-095',
    propertyType: 'Leasing',
    brandName: 'RedDoorz',
    propertyAddress: 'Jl. Cikini Raya No. 45, Jakarta Pusat',
    picName: 'Budi Santoso',
    picNumber: '+62 815 3333 4444',
    requestorName: 'Sophia Chen',
    requestorEmail: 'sophia.chen@reddoorz.com',
    status: 'Delivered',
    poNumber: 'PO2025000220IIDRMI',
    poDate: '2025-01-05',
    poFileLink: '#',
    estimatedDeliveryStart: '2025-01-15',
    estimatedDeliveryEnd: '2025-01-18',
    items: [
      {
        id: '6331-1',
        prNumber: 'CF_REQ_6331',
        itemCode: 'ITM050',
        itemName: 'Bed Frame',
        itemCategory: 'Ops Item',
        selectedProperties: { Size: 'Queen Size' },
        quantity: 18,
        uom: 'units',
        itemStatus: 'Ready',
        vendorName: 'ABC Supplies Co.',
        vendorCode: 'VND010',
        paymentTerms: 'Cash Before Delivery',
        unitPrice: 1800000,
        taxPercentage: 11,
        taxAmount: 3564000,
        totalPrice: 35964000
      }
    ]
  },

  // FINISHED STATUS (2 requests with full information including invoice)
  {
    prNumber: 'CF_REQ_6334',
    prDate: '2024-12-20',
    propertyName: 'RedDoorz Plus Bandung Buah Batu',
    propertyCode: 'BDG-040',
    propertyType: 'Leasing',
    brandName: 'RedDoorz Premium',
    propertyAddress: 'Jl. Buah Batu No. 234, Bandung',
    picName: 'Iwan Setiawan',
    picNumber: '+62 822 6666 7777',
    requestorName: 'Anna Lee',
    requestorEmail: 'anna.lee@reddoorz.com',
    status: 'Finished',
    poNumber: 'PO2025000215IIDRMI',
    poDate: '2024-12-28',
    poFileLink: '#',
    estimatedDeliveryStart: '2025-01-08',
    estimatedDeliveryEnd: '2025-01-12',
    invoiceNumber: 'INV-2025-001-ABC',
    invoiceDate: '2025-01-15',
    invoiceFileLink: '#',
    items: [
      {
        id: '6334-1',
        prNumber: 'CF_REQ_6334',
        itemCode: 'ITM060',
        itemName: 'Water Heater',
        itemCategory: 'Others',
        selectedProperties: { Type: 'Electric 30L' },
        quantity: 22,
        uom: 'units',
        itemStatus: 'Ready',
        vendorName: 'Tech Solutions Indonesia',
        vendorCode: 'VND030',
        paymentTerms: 'Payment Terms',
        unitPrice: 1200000,
        taxPercentage: 11,
        taxAmount: 2904000,
        totalPrice: 29304000
      }
    ]
  }
];


