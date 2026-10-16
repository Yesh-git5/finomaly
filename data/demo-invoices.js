// 8 Rich GST Invoices embodying the core Problem Statement & Solution Architecture:
// 1. Circular Invoice Chains (Carousel Fraud Ring: Apex -> Rao -> Kuber -> Apex)
// 2. Context-Aware Profiling (Sri Lakshmi 52.5x spike vs Bharat Steel 1.07x normal)
// 3. Tax Rate & Formula Discrepancies (Surya Electronics HSN tax mismatch)
// 4. Identity & Suspended GSTIN (Zenith Logistics cancelled registration)
// 5. Artificial Splitting (Royal Chemicals sub-₹50k e-Way bill evasion)
// 6. Explainable 0-100 Risk Scoring for Auditor Prioritization
export const demoInvoices = [
  {
    id: "1",
    invoice_number: "INV-C01",
    invoiceNumber: "INV-C01",
    vendor: "Apex Industrial Tools",
    vendorName: "Apex Industrial Tools",
    gstin: "27XYZPA9876K1Z9",
    vendorGstin: "27XYZPA9876K1Z9",
    buyerGstin: "36ABCDE1234F1Z5",
    buyerName: "Rao Tech Solutions",
    invoiceDate: "2026-10-08",
    placeOfSupply: "Telangana",
    hsnCode: "8471",
    description: "Industrial Server Controller Units (Lot A)",
    itemCount: 4,
    taxableValue: 406779.66,
    gstRate: 18,
    cgst: 0,
    sgst: 0,
    igst: 73220.34,
    amount: 480000,
    totalAmount: 480000,
    risk_score: 89,
    riskScore: 89,
    risk_level: "High",
    riskLevel: "High",
    status: "Pending",
    source: "Network Ingestion",
    isCircularRing: true,
    cyclePath: "Apex Industrial Tools ➔ Rao Tech Solutions ➔ Kuber Enterprises ➔ Apex Industrial Tools",
    explanation: "🚨 CIRCULAR TRADING RING DETECTED: Part of a 3-entity closed invoicing loop with 98.3% value retention across 4 days. Isolated invoice checks miss this carousel chain.",
    reasons: [
      {
        code: "CIRCULAR_CAROUSEL_LOOP",
        message: "Closed circular trading loop detected between Apex ➔ Rao ➔ Kuber ➔ Apex",
        severity: "high",
        weight: 50
      },
      {
        code: "VALUE_RETENTION_ANOMALY",
        message: "98.3% value retention across loop with negligible physical value-add",
        severity: "high",
        weight: 25
      },
      {
        code: "RAPID_DWELL_TIME",
        message: "Subsequent pass-through invoice generated within 48 hours",
        severity: "med",
        weight: 14
      }
    ],
    vendorMedian: 65000,
    vendorHistory: [55000, 62000, 65000, 71000, 480000],
    reviewLogs: []
  },
  {
    id: "2",
    invoice_number: "INV-C02",
    invoiceNumber: "INV-C02",
    vendor: "Rao Tech Solutions",
    vendorName: "Rao Tech Solutions",
    gstin: "36ABCDE1234F1Z5",
    vendorGstin: "36ABCDE1234F1Z5",
    buyerGstin: "29AABCK9988M1Z3",
    buyerName: "Kuber Enterprises",
    invoiceDate: "2026-10-10",
    placeOfSupply: "Karnataka",
    hsnCode: "8471",
    description: "High-spec Telemetry Processor Units (Lot B)",
    itemCount: 4,
    taxableValue: 402542.37,
    gstRate: 18,
    cgst: 0,
    sgst: 0,
    igst: 72457.63,
    amount: 475000,
    totalAmount: 475000,
    risk_score: 91,
    riskScore: 91,
    risk_level: "High",
    riskLevel: "High",
    status: "Pending",
    source: "Network Ingestion",
    isCircularRing: true,
    cyclePath: "Rao Tech Solutions ➔ Kuber Enterprises ➔ Apex Industrial Tools ➔ Rao Tech Solutions",
    explanation: "🚨 CAROUSEL FRAUD RING STEP 2: Value passed from Rao to Kuber with less than 1% price differential. Typical artificial turnover inflation for bogus ITC.",
    reasons: [
      {
        code: "CIRCULAR_CAROUSEL_LOOP",
        message: "Step 2 of circular invoice chain passing ₹4,75,000 credit downstream",
        severity: "high",
        weight: 50
      },
      {
        code: "CONDUIT_ENTITY_SIGNAL",
        message: "Rao Tech acting as conduit: Inflow ₹4,80,000 ➔ Outflow ₹4,75,000",
        severity: "high",
        weight: 28
      },
      {
        code: "INTERSTATE_ITC_TRANSFER",
        message: "Large inter-state IGST credit accumulation without commercial warehousing",
        severity: "med",
        weight: 13
      }
    ],
    vendorMedian: 55000,
    vendorHistory: [45000, 52000, 55000, 58000, 475000],
    reviewLogs: []
  },
  {
    id: "3",
    invoice_number: "INV-C03",
    invoiceNumber: "INV-C03",
    vendor: "Kuber Enterprises",
    vendorName: "Kuber Enterprises",
    gstin: "29AABCK9988M1Z3",
    vendorGstin: "29AABCK9988M1Z3",
    buyerGstin: "27XYZPA9876K1Z9",
    buyerName: "Apex Industrial Tools",
    invoiceDate: "2026-10-12",
    placeOfSupply: "Maharashtra",
    hsnCode: "8471",
    description: "Re-consigned Telemetry System Nodes (Lot C)",
    itemCount: 4,
    taxableValue: 400000.0,
    gstRate: 18,
    cgst: 0,
    sgst: 0,
    igst: 72000.0,
    amount: 472000,
    totalAmount: 472000,
    risk_score: 95,
    riskScore: 95,
    risk_level: "High",
    riskLevel: "High",
    status: "Escalated",
    source: "Network Ingestion",
    isCircularRing: true,
    cyclePath: "Kuber Enterprises ➔ Apex Industrial Tools (Loop Closed!)",
    explanation: "🚨 CAROUSEL LOOP CLOSED: Re-invoicing back to original supplier Apex Industrial Tools. Complete circular trading ring proven by NetworkX directed graph analysis.",
    reasons: [
      {
        code: "LOOP_CLOSURE_PROVEN",
        message: "Invoice closes circular ring back to initial supplier (Apex Industrial Tools)",
        severity: "high",
        weight: 55
      },
      {
        code: "ITC_ROUND_TRIP",
        message: "Full circle ITC pass-through; artificial credit generation without goods movement",
        severity: "high",
        weight: 26
      },
      {
        code: "SECTION_132_FLAG",
        message: "High probability of circular trading offense under CGST Section 132(1)(b)",
        severity: "high",
        weight: 14
      }
    ],
    vendorMedian: 70000,
    vendorHistory: [60000, 68000, 70000, 74000, 472000],
    reviewLogs: [
      {
        id: "rev-c03",
        action: "Escalated",
        note: "Escalated to Special Anti-Evasion Unit for provisional attachment of ITC under Section 86A.",
        timestamp: "2026-10-13T11:00:00Z",
        reviewer: "Senior GST Auditor · DGGI"
      }
    ]
  },
  {
    id: "4",
    invoice_number: "INV-S01",
    invoiceNumber: "INV-S01",
    vendor: "Sri Lakshmi Traders",
    vendorName: "Sri Lakshmi Traders",
    gstin: "33ABCDE1234F1Z5",
    vendorGstin: "33ABCDE1234F1Z5",
    buyerGstin: "36ABCDE1234F1Z5",
    buyerName: "Rao Tech Solutions",
    invoiceDate: "2026-10-11",
    placeOfSupply: "Telangana",
    hsnCode: "4820",
    description: "Bulk Office Consumables & High-yield Cartridges",
    itemCount: 45,
    taxableValue: 355932.2,
    gstRate: 18,
    cgst: 0,
    sgst: 0,
    igst: 64067.8,
    amount: 420000,
    totalAmount: 420000,
    risk_score: 93,
    riskScore: 93,
    risk_level: "High",
    riskLevel: "High",
    status: "Pending",
    source: "Vendor Portal Upload",
    isCircularRing: false,
    cyclePath: null,
    explanation: "⚠️ CONTEXT-AWARE ANOMALY: Amount is 52.5x this vendor's historical normal baseline (median ₹8,000). What is normal for a steel plant is completely anomalous for Sri Lakshmi Traders.",
    reasons: [
      {
        code: "EXTREME_BASELINE_SPIKE",
        message: "Invoice amount (₹4,20,000) is 52.5x vendor's historical median (₹8,000)",
        severity: "high",
        weight: 55
      },
      {
        code: "IQR_DEVIATION_OUTLIER",
        message: "Z-score exceeds 15.2 standard deviations beyond vendor's typical IQR band",
        severity: "high",
        weight: 25
      },
      {
        code: "SUDDEN_CATEGORY_JUMP",
        message: "Micro-scale stationery vendor suddenly billing industrial-scale volume",
        severity: "med",
        weight: 13
      }
    ],
    vendorMedian: 8000,
    vendorHistory: [7500, 8000, 8200, 8500, 420000],
    reviewLogs: []
  },
  {
    id: "5",
    invoice_number: "INV-N01",
    invoiceNumber: "INV-N01",
    vendor: "Bharat Steel & Infrastructure",
    vendorName: "Bharat Steel & Infrastructure",
    gstin: "24AAACB5555C1Z1",
    vendorGstin: "24AAACB5555C1Z1",
    buyerGstin: "27BBBCB2222D1Z6",
    buyerName: "Maharani Silk Weavers",
    invoiceDate: "2026-10-14",
    placeOfSupply: "Maharashtra",
    hsnCode: "7208",
    description: "Heavy Structural Steel Beams & Alloy Angle Plates",
    itemCount: 16,
    taxableValue: 381355.93,
    gstRate: 18,
    cgst: 0,
    sgst: 0,
    igst: 68644.07,
    amount: 450000,
    totalAmount: 450000,
    risk_score: 14,
    riskScore: 14,
    risk_level: "Low",
    riskLevel: "Low",
    status: "Verified Genuine",
    source: "Direct ERP Sync",
    isCircularRing: false,
    cyclePath: null,
    explanation: "✅ CONTEXTUAL HEALTHY: High absolute value (₹4,50,000) is completely NORMAL for Bharat Steel (1.07x median ₹4,20,000). Proves fixed thresholds produce false alarms.",
    reasons: [],
    vendorMedian: 420000,
    vendorHistory: [390000, 410000, 420000, 435000, 450000],
    reviewLogs: [
      {
        id: "rev-n01",
        action: "Verified Genuine",
        note: "Verified against historical contract and physical weighbridge slips. Compliant large-scale order.",
        timestamp: "2026-10-14T15:30:00Z",
        reviewer: "Senior GST Auditor · DGGI"
      }
    ]
  },
  {
    id: "6",
    invoice_number: "INV-T01",
    invoiceNumber: "INV-T01",
    vendor: "Surya Electronics Ltd",
    vendorName: "Surya Electronics Ltd",
    gstin: "27AABCS9900K1Z2",
    vendorGstin: "27AABCS9900K1Z2",
    buyerGstin: "27XYZPA9876K1Z9",
    buyerName: "Apex Industrial Tools",
    invoiceDate: "2026-10-13",
    placeOfSupply: "Maharashtra",
    hsnCode: "8504",
    description: "High-frequency Industrial Static Converters (Lot D)",
    itemCount: 8,
    taxableValue: 200000.0,
    gstRate: 18,
    cgst: 18000,
    sgst: 18000,
    igst: 0,
    amount: 236000,
    totalAmount: 236000,
    risk_score: 78,
    riskScore: 78,
    risk_level: "High",
    riskLevel: "High",
    status: "Needs Correction",
    source: "Invoice Intake Scanner",
    isCircularRing: false,
    cyclePath: null,
    explanation: "⚠️ TAX RATE MATH MISMATCH: Invoice applied 18% GST (₹36,000) whereas HSN 8504 statutory tariff mandates 28% (₹56,000). Resulting in a ₹20,000 short payment discrepancy.",
    reasons: [
      {
        code: "TAX_RATE_MISCLASSIFICATION",
        message: "HSN 8504 statutory tariff is 28%; supplier improperly billed 18%",
        severity: "high",
        weight: 42
      },
      {
        code: "TAX_COLLECTION_SHORTFALL",
        message: "Potential GST revenue leakage of ₹20,000 under Section 73",
        severity: "high",
        weight: 36
      }
    ],
    vendorMedian: 180000,
    vendorHistory: [160000, 175000, 180000, 190000, 236000],
    reviewLogs: [
      {
        id: "rev-t01",
        action: "Needs Correction",
        note: "Notified vendor regarding incorrect HSN tax slab under GSTR-1 Amendment Table 9A.",
        timestamp: "2026-10-14T09:15:00Z",
        reviewer: "Senior GST Auditor · CA Firm"
      }
    ]
  },
  {
    id: "7",
    invoice_number: "INV-G01",
    invoiceNumber: "INV-G01",
    vendor: "Zenith Logistics & Freight",
    vendorName: "Zenith Logistics & Freight",
    gstin: "36AAACZ1122D1Z8",
    vendorGstin: "36AAACZ1122D1Z8",
    buyerGstin: "29AABCK9988M1Z3",
    buyerName: "Kuber Enterprises",
    invoiceDate: "2026-10-09",
    placeOfSupply: "Karnataka",
    hsnCode: "9965",
    description: "Multimodal Interstate Freight Transportation (Consignment Lot 4)",
    itemCount: 1,
    taxableValue: 185000.0,
    gstRate: 18,
    cgst: 0,
    sgst: 0,
    igst: 33300,
    amount: 218300,
    totalAmount: 218300,
    risk_score: 88,
    riskScore: 88,
    risk_level: "High",
    riskLevel: "High",
    status: "Pending",
    source: "Filing Summary Importer",
    isCircularRing: false,
    cyclePath: null,
    explanation: "🚨 SUSPENDED GSTIN UTILIZATION: Vendor GSTIN was flagged as Suspended/Cancelled ab-initio prior to invoice date. Ineligible ITC under Section 16(2)(c).",
    reasons: [
      {
        code: "CANCELLED_GSTIN_INVOICE",
        message: "Supplier registration cancelled by jurisdictional tax officer on 2026-08-30",
        severity: "high",
        weight: 55
      },
      {
        code: "ITC_INELIGIBILITY_SEC16",
        message: "Buyer cannot claim ₹33,300 ITC from non-compliant cancelled supplier",
        severity: "high",
        weight: 33
      }
    ],
    vendorMedian: 120000,
    vendorHistory: [90000, 110000, 120000, 140000, 218300],
    reviewLogs: []
  },
  {
    id: "8",
    invoice_number: "INV-D01",
    invoiceNumber: "INV-D01",
    vendor: "Royal Chemicals & Polymers",
    vendorName: "Royal Chemicals & Polymers",
    gstin: "24AABCR4433E1Z4",
    vendorGstin: "24AABCR4433E1Z4",
    buyerGstin: "36ABCDE1234F1Z5",
    buyerName: "Rao Tech Solutions",
    invoiceDate: "2026-10-15",
    placeOfSupply: "Telangana",
    hsnCode: "2905",
    description: "Specialty Organic Solvents - Consignment Batch A",
    itemCount: 20,
    taxableValue: 42364.4,
    gstRate: 18,
    cgst: 0,
    sgst: 0,
    igst: 7625.6,
    amount: 49990,
    totalAmount: 49990,
    risk_score: 74,
    riskScore: 74,
    risk_level: "High",
    riskLevel: "High",
    status: "Pending",
    source: "Document Scanner (Upload)",
    isCircularRing: false,
    cyclePath: null,
    explanation: "⚠️ ARTIFICIAL BILL SPLITTING: Invoice value of ₹49,990 sits precisely ₹10 below the statutory ₹50,000 threshold to evade mandatory e-Way Bill generation under Rule 138.",
    reasons: [
      {
        code: "EWAY_THRESHOLD_AVOIDANCE",
        message: "Invoice amount ₹49,990 sits just below mandatory ₹50,000 e-Way bill threshold",
        severity: "high",
        weight: 48
      },
      {
        code: "RAPID_CONSECUTIVE_SPLIT",
        message: "Same vendor issued 3 consecutive sub-₹50k bills to same buyer in 48 hours",
        severity: "med",
        weight: 26
      }
    ],
    vendorMedian: 48000,
    vendorHistory: [46000, 48000, 49200, 49500, 49990],
    reviewLogs: []
  },
  {
    id: "9",
    invoice_number: "GST-3525-26",
    invoiceNumber: "GST-3525-26",
    vendor: "Gujarat Freight Tools",
    vendorName: "Gujarat Freight Tools",
    gstin: "27CORPP3939N1ZQ",
    vendorGstin: "27CORPP3939N1ZQ",
    buyerGstin: "32AABBA7890B1ZB",
    buyerName: "Shiv Engineering Works",
    invoiceDate: "2025-07-23",
    placeOfSupply: "Kerala",
    hsnCode: "8302",
    description: "Bosch All-in-One Metal Hand Tool Kit & Taparia Universal Tool Kit",
    itemCount: 2,
    taxableValue: 3805,
    gstRate: 18,
    cgst: 0,
    sgst: 0,
    igst: 684.9,
    amount: 4490,
    totalAmount: 4490,
    risk_score: 12,
    riskScore: 12,
    risk_level: "Low",
    riskLevel: "Low",
    status: "Verified Genuine",
    source: "Upload Scanned GST Invoice (OCR)",
    isCircularRing: false,
    cyclePath: null,
    documentName: "A5-GST-Invoice-Format_page-0001.jpg",
    documentPreview: "/A5-GST-Invoice-Format_page-0001.jpg",
    uploadedBy: "Gujarat Freight Tools (Vendor)",
    submissionMethod: "Upload Scanned GST Invoice (OCR)",
    ocrConfidence: 99.4,
    submittedAt: "2025-07-23T11:45:00Z",
    explanation: "✅ VERIFIED GENUINE VENDOR INVOICE: High-resolution scanned document submitted by vendor with 99.4% OCR confidence. Taxable value, 18% IGST rate, and inter-state supply (Maharashtra ➔ Kerala) align with statutory rules.",
    reasons: [],
    vendorMedian: 4500,
    vendorHistory: [4100, 4350, 4490, 4600, 4750],
    reviewLogs: [
      {
        id: "rev-gf01",
        action: "Verified Genuine",
        note: "Auditor inspected scanned document A5-GST-Invoice-Format_page-0001.jpg. Verified 18% IGST calculation against GST Portal GSTR-2B. Cleared.",
        timestamp: "2025-07-23T14:20:00Z",
        reviewer: "Senior GST Auditor · DGGI"
      }
    ]
  }
];

export default function handler(req, res) {
  res.status(200).json(demoInvoices);
}

