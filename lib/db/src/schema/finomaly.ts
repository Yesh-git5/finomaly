import {
  date,
  doublePrecision,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export type InvoiceReason = {
  code: string;
  severity: "low" | "med" | "high";
  message: string;
  weight: number;
};

export type FeatureContribution = {
  feature: string;
  contribution: number;
};

export const finomalyVendorsTable = pgTable("finomaly_vendors", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  gstin: text("gstin").notNull().unique(),
  state: text("state").notNull(),
  businessType: text("business_type").notNull(),
  averageAmount: doublePrecision("average_amount").notNull().default(0),
  medianAmount: doublePrecision("median_amount").notNull().default(0),
  stdAmount: doublePrecision("std_amount").notNull().default(0),
  typicalGstRate: doublePrecision("typical_gst_rate").notNull().default(18),
  invoiceCount: integer("invoice_count").notNull().default(0),
  riskScore: integer("risk_score").notNull().default(0),
});

export const finomalyInvoicesTable = pgTable("finomaly_invoices", {
  id: text("id").primaryKey(),
  invoiceNumber: text("invoice_number").notNull(),
  vendorId: text("vendor_id")
    .notNull()
    .references(() => finomalyVendorsTable.id),
  vendorGstin: text("vendor_gstin").notNull(),
  invoiceDate: date("invoice_date", { mode: "string" }).notNull(),
  buyerGstin: text("buyer_gstin").notNull(),
  placeOfSupply: text("place_of_supply").notNull(),
  hsnCode: text("hsn_code").notNull(),
  description: text("description").notNull(),
  itemCount: integer("item_count").notNull(),
  taxableValue: doublePrecision("taxable_value").notNull(),
  gstRate: doublePrecision("gst_rate").notNull(),
  cgst: doublePrecision("cgst").notNull(),
  sgst: doublePrecision("sgst").notNull(),
  igst: doublePrecision("igst").notNull(),
  totalAmount: doublePrecision("total_amount").notNull(),
  source: text("source").notNull().default("seed"),
  riskScore: integer("risk_score").notNull().default(0),
  riskLevel: text("risk_level").notNull().default("Low"),
  status: text("status").notNull().default("Pending"),
  reasons: jsonb("reasons").$type<InvoiceReason[]>().notNull().default([]),
  featureContributions: jsonb("feature_contributions")
    .$type<FeatureContribution[]>()
    .notNull()
    .default([]),
  explanation: text("explanation").notNull().default(""),
  vendorMedian: doublePrecision("vendor_median").notNull().default(0),
  vendorHistory: jsonb("vendor_history").$type<number[]>().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const finomalyReviewLogsTable = pgTable("finomaly_review_logs", {
  id: text("id").primaryKey(),
  invoiceId: text("invoice_id")
    .notNull()
    .references(() => finomalyInvoicesTable.id),
  action: text("action").notNull(),
  note: text("note").notNull().default(""),
  reviewer: text("reviewer").notNull().default("Demo User · CA Firm"),
  timestamp: timestamp("timestamp", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
