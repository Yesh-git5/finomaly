import { randomUUID } from "node:crypto";

import {
  db,
  finomalyInvoicesTable,
  finomalyReviewLogsTable,
  finomalyVendorsTable,
  type FeatureContribution,
  type InvoiceReason,
} from "@workspace/db";
import { and, desc, eq } from "drizzle-orm";

type RiskLevel = "Low" | "Medium" | "High";
type ReviewStatus =
  | "Pending"
  | "Verified Genuine"
  | "Needs Correction"
  | "Escalated";

export type InvoiceDraft = {
  invoiceNumber: string;
  vendorName: string;
  vendorGstin: string;
  invoiceDate: string;
  buyerGstin: string;
  placeOfSupply: string;
  hsnCode: string;
  description: string;
  itemCount: number;
  taxableValue: number;
  gstRate: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalAmount: number;
};

type Vendor = typeof finomalyVendorsTable.$inferSelect;
type Invoice = typeof finomalyInvoicesTable.$inferSelect;
type FeatureVector = number[];
type ForestNode =
  | { leafSize: number }
  | {
      feature: number;
      split: number;
      left: ForestNode;
      right: ForestNode;
    };

const stateNames: Record<string, string> = {
  "01": "Jammu & Kashmir",
  "02": "Himachal Pradesh",
  "03": "Punjab",
  "04": "Chandigarh",
  "05": "Uttarakhand",
  "06": "Haryana",
  "07": "Delhi",
  "08": "Rajasthan",
  "09": "Uttar Pradesh",
  "10": "Bihar",
  "11": "Sikkim",
  "12": "Arunachal Pradesh",
  "13": "Nagaland",
  "14": "Manipur",
  "15": "Mizoram",
  "16": "Tripura",
  "17": "Meghalaya",
  "18": "Assam",
  "19": "West Bengal",
  "20": "Jharkhand",
  "21": "Odisha",
  "22": "Chhattisgarh",
  "23": "Madhya Pradesh",
  "24": "Gujarat",
  "25": "Daman & Diu",
  "26": "Dadra & Nagar Haveli",
  "27": "Maharashtra",
  "28": "Andhra Pradesh",
  "29": "Karnataka",
  "30": "Goa",
  "31": "Lakshadweep",
  "32": "Kerala",
  "33": "Tamil Nadu",
  "34": "Puducherry",
  "35": "Andaman & Nicobar Islands",
  "36": "Telangana",
  "37": "Andhra Pradesh",
  "38": "Ladakh",
};

const gstAlphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const allowedRates = [0, 5, 12, 18, 28];
const featureNames = [
  "Invoice value",
  "Taxable value",
  "Item count",
  "Effective tax ratio",
  "GST rate",
  "Amount vs vendor median",
  "Vendor amount z-score",
  "Round amount",
  "Weekend invoice",
];

const vendorSeeds = [
  ["Sri Lakshmi Traders", "33", "Groceries", 8000, 5, "1006", "Staple goods"],
  ["Rao Electronics", "36", "Electronics", 45000, 18, "8517", "Mobile devices"],
  ["Mehta Textiles", "24", "Textiles", 120000, 12, "6109", "Cotton garments"],
  ["Kumar Stationers", "29", "Stationery", 3000, 12, "4820", "Office supplies"],
  ["Patel Pharma Distributors", "24", "Pharma", 60000, 12, "3004", "Medicines"],
  ["Bharat IT Solutions", "27", "IT services", 250000, 18, "9983", "Cloud services"],
  ["Delhi Auto Parts", "07", "Auto parts", 35000, 28, "8703", "Vehicle parts"],
  ["Annapurna Foods", "09", "Food", 15000, 5, "1006", "Packaged food"],
  ["Singh Hardware", "07", "Hardware", 22000, 18, "8517", "Electrical fittings"],
  ["Chennai Packaging Co", "33", "Packaging", 18000, 12, "6109", "Packaging materials"],
  ["Eastern Chemicals", "19", "Chemicals", 90000, 18, "9983", "Industrial chemicals"],
  ["QuickServe Logistics", "29", "Logistics", 12000, 18, "9983", "Freight services"],
] as const;

let initialization: Promise<void> | undefined;
let forest: ForestNode[] = [];
let featureMeans: number[] = [];
let featureScales: number[] = [];
let trainingScores: number[] = [];

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function stateCodeFromGstin(gstin: string): string {
  return gstin.slice(0, 2);
}

function getStateName(gstin: string): string {
  return stateNames[stateCodeFromGstin(gstin)] ?? "Other";
}

function gstinCheckDigit(firstFourteen: string): string {
  let factor = 2;
  let sum = 0;
  for (let index = firstFourteen.length - 1; index >= 0; index -= 1) {
    const value = gstAlphabet.indexOf(firstFourteen[index] ?? "");
    const product = factor * value;
    sum += Math.floor(product / 36) + (product % 36);
    factor = factor === 2 ? 1 : 2;
  }
  return gstAlphabet[(36 - (sum % 36)) % 36] ?? "0";
}

export function makeGstin(stateCode: string, sequence: number): string {
  const pan = `ABCDE${String(sequence).padStart(4, "0")}F`;
  const body = `${stateCode}${pan}1Z`;
  return `${body}${gstinCheckDigit(body)}`;
}

export function isValidGstin(gstin: string): boolean {
  if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(gstin)) {
    return false;
  }
  return gstin.at(-1) === gstinCheckDigit(gstin.slice(0, 14));
}

function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function gaussian(random: () => number): number {
  const first = Math.max(random(), 0.000001);
  const second = random();
  return Math.sqrt(-2 * Math.log(first)) * Math.cos(2 * Math.PI * second);
}

function dateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function offsetDate(daysAgo: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - daysAgo);
  return dateString(date);
}

function amountTaxes(
  taxableValue: number,
  rate: number,
  intraState: boolean,
): Pick<InvoiceDraft, "cgst" | "sgst" | "igst" | "totalAmount"> {
  const totalTax = round2((taxableValue * rate) / 100);
  const cgst = intraState ? round2(totalTax / 2) : 0;
  const sgst = intraState ? round2(totalTax / 2) : 0;
  const igst = intraState ? 0 : totalTax;
  return {
    cgst,
    sgst,
    igst,
    totalAmount: round2(taxableValue + totalTax),
  };
}

function buildSeedDrafts(vendors: Vendor[]): Array<{
  draft: InvoiceDraft;
  vendorId: string;
  scenario: string | null;
}> {
  const rows: Array<{
    draft: InvoiceDraft;
    vendorId: string;
    scenario: string | null;
  }> = [];
  let scenarioIndex = 0;
  for (let vendorIndex = 0; vendorIndex < vendors.length; vendorIndex += 1) {
    const vendor = vendors[vendorIndex];
    if (!vendor) continue;
    const seed = vendorSeeds[vendorIndex];
    if (!seed) continue;
    const random = seededRandom(91_337 + vendorIndex * 1_007);
    const vendorState = stateCodeFromGstin(vendor.gstin);
    for (let index = 0; index < 50; index += 1) {
      const multiplier = Math.exp(gaussian(random) * 0.26 - 0.035);
      let totalAmount = Math.max(250, round2(vendor.averageAmount * multiplier));
      let invoiceNumber = `${seed[0].replace(/[^A-Z]/gi, "").slice(0, 3).toUpperCase()}/2026/${String(index + 1).padStart(5, "0")}`;
      let vendorGstin = vendor.gstin;
      let scenario: string | null = null;
      const invoiceDate = offsetDate(Math.floor(random() * 365));
      const buyerState =
        random() > 0.73
          ? ["07", "24", "27", "29", "33", "36"][
              Math.floor(random() * 6)
            ] ?? vendorState
          : vendorState;
      let taxableValue = round2(totalAmount / (1 + seed[4] / 100));
      let taxParts = amountTaxes(taxableValue, seed[4], buyerState === vendorState);

      if (index % 13 === 0) {
        scenario = ["spike", "duplicate", "invalid", "tax", "wrongType", "round"][
          scenarioIndex % 6
        ] ?? "spike";
        scenarioIndex += 1;
        if (scenario === "spike") {
          totalAmount = round2(vendor.averageAmount * 8);
          taxableValue = round2(totalAmount / (1 + seed[4] / 100));
          taxParts = amountTaxes(
            taxableValue,
            seed[4],
            buyerState === vendorState,
          );
        } else if (scenario === "duplicate" && index > 1) {
          invoiceNumber = `${seed[0].replace(/[^A-Z]/gi, "").slice(0, 3).toUpperCase()}/2026/${String(index).padStart(5, "0")}`;
        } else if (scenario === "invalid") {
          const last = vendorGstin.at(-1) === "0" ? "1" : "0";
          vendorGstin = `${vendorGstin.slice(0, -1)}${last}`;
        } else if (scenario === "tax") {
          taxParts = {
            ...taxParts,
            cgst: round2(taxParts.cgst * 0.55),
            sgst: round2(taxParts.sgst * 0.55),
            igst: round2(taxParts.igst * 0.55),
          };
        } else if (scenario === "wrongType") {
          if (buyerState === vendorState) {
            taxParts = { ...taxParts, igst: round2(taxParts.cgst + taxParts.sgst), cgst: 0, sgst: 0 };
          } else {
            taxParts = { ...taxParts, cgst: round2(taxParts.igst / 2), sgst: round2(taxParts.igst / 2), igst: 0 };
          }
        } else if (scenario === "round") {
          totalAmount = vendor.averageAmount > 50_000 ? 100_000 : 50_000;
          taxableValue = round2(totalAmount / (1 + seed[4] / 100));
          taxParts = amountTaxes(
            taxableValue,
            seed[4],
            buyerState === vendorState,
          );
        }
      }

      const draft: InvoiceDraft = {
        invoiceNumber,
        vendorName: vendor.name,
        vendorGstin,
        invoiceDate,
        buyerGstin: makeGstin(buyerState, 70 + vendorIndex),
        placeOfSupply: buyerState,
        hsnCode: seed[5],
        description: seed[6],
        itemCount: 1 + Math.floor(random() * 8),
        taxableValue,
        gstRate: seed[4],
        ...taxParts,
        totalAmount,
      };
      rows.push({ draft, vendorId: vendor.id, scenario });
    }
  }
  return rows;
}

function featureVector(
  draft: InvoiceDraft,
  median: number,
  stdAmount: number,
): FeatureVector {
  const tax = draft.cgst + draft.sgst + draft.igst;
  const date = new Date(`${draft.invoiceDate}T00:00:00Z`);
  const amountZscore =
    stdAmount > 0 ? (draft.totalAmount - median) / stdAmount : 0;
  return [
    Math.log1p(Math.max(0, draft.totalAmount)),
    Math.log1p(Math.max(0, draft.taxableValue)),
    draft.itemCount,
    draft.taxableValue > 0 ? tax / draft.taxableValue : 0,
    draft.gstRate,
    median > 0 ? draft.totalAmount / median : 1,
    amountZscore,
    draft.totalAmount > 0 && draft.totalAmount % 10_000 === 0 ? 1 : 0,
    date.getUTCDay() === 0 || date.getUTCDay() === 6 ? 1 : 0,
  ];
}

function correctedPathLength(size: number): number {
  if (size <= 1) return 0;
  if (size === 2) return 1;
  const harmonicApproximation = Math.log(size - 1) + 0.5772156649;
  return 2 * harmonicApproximation - (2 * (size - 1)) / size;
}

function buildTree(
  points: FeatureVector[],
  depth: number,
  maxDepth: number,
  random: () => number,
): ForestNode {
  if (points.length <= 1 || depth >= maxDepth) {
    return { leafSize: points.length };
  }
  const dimensions = points[0]?.length ?? 0;
  const candidates = Array.from({ length: dimensions }, (_, index) => index);
  for (let attempt = 0; attempt < dimensions && candidates.length > 0; attempt += 1) {
    const candidateIndex = Math.floor(random() * candidates.length);
    const feature = candidates.splice(candidateIndex, 1)[0];
    if (feature === undefined) continue;
    const values = points.map((point) => point[feature] ?? 0);
    const min = Math.min(...values);
    const max = Math.max(...values);
    if (max - min < 0.00001) continue;
    const split = min + random() * (max - min);
    const left = points.filter((point) => (point[feature] ?? 0) < split);
    const right = points.filter((point) => (point[feature] ?? 0) >= split);
    if (left.length === 0 || right.length === 0) continue;
    return {
      feature,
      split,
      left: buildTree(left, depth + 1, maxDepth, random),
      right: buildTree(right, depth + 1, maxDepth, random),
    };
  }
  return { leafSize: points.length };
}

function pathLength(point: FeatureVector, node: ForestNode, depth = 0): number {
  if ("leafSize" in node) {
    return depth + correctedPathLength(node.leafSize);
  }
  return pathLength(
    point,
    (point[node.feature] ?? 0) < node.split ? node.left : node.right,
    depth + 1,
  );
}

function trainForest(drafts: Array<{ draft: InvoiceDraft; vendor: Vendor }>): void {
  if (drafts.length < 2) return;
  const rawVectors = drafts.map(({ draft, vendor }) =>
    featureVector(draft, vendor.medianAmount, vendor.stdAmount),
  );
  featureMeans = rawVectors[0]?.map(
    (_, column) =>
      rawVectors.reduce((sum, row) => sum + (row[column] ?? 0), 0) /
      rawVectors.length,
  ) ?? [];
  featureScales = rawVectors[0]?.map((_, column) => {
    const mean = featureMeans[column] ?? 0;
    const variance =
      rawVectors.reduce(
        (sum, row) => sum + ((row[column] ?? 0) - mean) ** 2,
        0,
      ) / rawVectors.length;
    return Math.sqrt(variance) || 1;
  }) ?? [];
  const vectors = rawVectors.map((row) =>
    row.map((value, index) => (value - (featureMeans[index] ?? 0)) / (featureScales[index] ?? 1)),
  );
  const random = seededRandom(42);
  const sampleSize = Math.min(128, vectors.length);
  const maxDepth = Math.ceil(Math.log2(sampleSize));
  forest = Array.from({ length: 200 }, () => {
    const bag = [...vectors];
    const sample: FeatureVector[] = [];
    for (let index = 0; index < sampleSize; index += 1) {
      const selected = Math.floor(random() * bag.length);
      const point = bag.splice(selected, 1)[0];
      if (point) sample.push(point);
    }
    return buildTree(sample, 0, maxDepth, random);
  });
  trainingScores = vectors.map((vector) => rawIsolationScore(vector));
}

function rawIsolationScore(vector: FeatureVector): number {
  if (forest.length === 0) return 0;
  const averagePath =
    forest.reduce((sum, tree) => sum + pathLength(vector, tree), 0) /
    forest.length;
  const normalization = correctedPathLength(Math.min(128, 600));
  return 2 ** (-averagePath / (normalization || 1));
}

function isolationScore(draft: InvoiceDraft, vendor: Vendor): number {
  if (forest.length === 0) return 20;
  const raw = featureVector(draft, vendor.medianAmount, vendor.stdAmount).map(
    (value, index) => (value - (featureMeans[index] ?? 0)) / (featureScales[index] ?? 1),
  );
  const value = rawIsolationScore(raw);
  const min = Math.min(...trainingScores);
  const max = Math.max(...trainingScores);
  return Math.max(0, Math.min(100, max > min ? ((value - min) / (max - min)) * 100 : 25));
}

function addReason(
  reasons: InvoiceReason[],
  code: string,
  severity: InvoiceReason["severity"],
  message: string,
  weight: number,
): void {
  reasons.push({ code, severity, message, weight });
}

function analyzeDraft(
  draft: InvoiceDraft,
  vendor: Vendor,
  history: Invoice[],
  simulatorScenario?: string,
): {
  riskScore: number;
  riskLevel: RiskLevel;
  reasons: InvoiceReason[];
  featureContributions: FeatureContribution[];
  explanation: string;
} {
  const reasons: InvoiceReason[] = [];
  const vendorInvoices = history.filter((invoice) => invoice.vendorId === vendor.id);
  const validGstin = isValidGstin(draft.vendorGstin);
  if (!validGstin) {
    addReason(
      reasons,
      "INVALID_GSTIN",
      "high",
      "The vendor GSTIN format or checksum is invalid.",
      35,
    );
  }

  const computedTax = round2((draft.taxableValue * draft.gstRate) / 100);
  const statedTax = round2(draft.cgst + draft.sgst + draft.igst);
  if (Math.abs(computedTax - statedTax) > 1) {
    addReason(
      reasons,
      "TAX_MATH_MISMATCH",
      "high",
      `Stated tax differs from the expected ₹${computedTax.toLocaleString("en-IN")}.`,
      30,
    );
  }

  const vendorState = stateCodeFromGstin(draft.vendorGstin);
  const isIntraState = vendorState === draft.placeOfSupply;
  if (
    (isIntraState && draft.igst > 1 && (draft.cgst < 1 || draft.sgst < 1)) ||
    (!isIntraState && (draft.cgst > 1 || draft.sgst > 1))
  ) {
    addReason(
      reasons,
      "WRONG_TAX_TYPE",
      "high",
      "The charged tax type does not match the vendor and place-of-supply states.",
      30,
    );
  }

  if (!allowedRates.includes(draft.gstRate)) {
    addReason(
      reasons,
      "INVALID_GST_RATE",
      "high",
      `GST rate ${draft.gstRate}% is not one of the configured GST slabs.`,
      30,
    );
  }

  if (
    vendorInvoices.some(
      (invoice) =>
        invoice.invoiceNumber === draft.invoiceNumber ||
        (invoice.invoiceDate === draft.invoiceDate &&
          Math.abs(invoice.totalAmount - draft.totalAmount) < 0.01),
    )
  ) {
    addReason(
      reasons,
      "DUPLICATE_INVOICE",
      "high",
      "This invoice number or same-day amount already appears for this vendor.",
      40,
    );
  }

  const ratio = vendor.medianAmount > 0 ? draft.totalAmount / vendor.medianAmount : 1;
  const zscore =
    vendor.stdAmount > 0
      ? (draft.totalAmount - vendor.medianAmount) / vendor.stdAmount
      : 0;
  if (zscore > 3 || ratio > 3) {
    addReason(
      reasons,
      "AMOUNT_SPIKE",
      "med",
      `Invoice value is ${ratio.toFixed(1)}× this vendor's median.`,
      30,
    );
  }

  const thresholdInvoices = vendorInvoices.filter(
    (invoice) =>
      invoice.invoiceDate === draft.invoiceDate &&
      invoice.totalAmount >= 47_500 &&
      invoice.totalAmount <= 49_999,
  );
  if (
    draft.totalAmount >= 47_500 &&
    draft.totalAmount <= 49_999 &&
    thresholdInvoices.length >= 1
  ) {
    addReason(
      reasons,
      "JUST_BELOW_THRESHOLD",
      "med",
      "Multiple same-day bills sit just below the ₹50,000 e-way bill threshold.",
      20,
    );
  }

  if (draft.totalAmount > 0 && draft.totalAmount % 10_000 === 0) {
    addReason(
      reasons,
      "ROUND_AMOUNT",
      "low",
      "The invoice is an exact ₹10,000 multiple.",
      10,
    );
  }

  if (vendor.invoiceCount < 3 && draft.totalAmount > 100_000) {
    addReason(
      reasons,
      "NEW_VENDOR_HIGH_VALUE",
      "med",
      "A new vendor has issued a high-value invoice.",
      20,
    );
  }

  const invoiceDate = new Date(`${draft.invoiceDate}T00:00:00Z`);
  const ageDays = (Date.now() - invoiceDate.getTime()) / 86_400_000;
  if (ageDays < -1 || ageDays > 365) {
    addReason(
      reasons,
      "FUTURE_OR_STALE_DATE",
      "med",
      "Invoice date is in the future or more than one year old.",
      15,
    );
  }

  const hsnRates: Record<string, number[]> = {
    "1006": [5],
    "8517": [18],
    "6109": [5, 12],
    "9983": [18],
    "3004": [12],
    "8703": [28],
  };
  if (hsnRates[draft.hsnCode] && !hsnRates[draft.hsnCode]?.includes(draft.gstRate)) {
    addReason(
      reasons,
      "HSN_RATE_MISMATCH",
      "med",
      `GST rate does not match the configured rate for HSN ${draft.hsnCode}.`,
      20,
    );
  }

  const sameDayCount =
    vendorInvoices.filter((invoice) => invoice.invoiceDate === draft.invoiceDate)
      .length + 1;
  if (sameDayCount >= 4) {
    addReason(
      reasons,
      "WEEKEND_BURST",
      "low",
      "Four or more invoices from this vendor share the same date.",
      10,
    );
  }

  if (simulatorScenario) {
    addReason(
      reasons,
      "DEMO_SCENARIO",
      "high",
      `A ${simulatorScenario.toLowerCase()} scenario was deliberately injected for review.`,
      35,
    );
  }

  const ruleScore = Math.min(
    100,
    reasons.reduce((sum, reason) => sum + reason.weight, 0),
  );
  const ifScore = isolationScore(draft, vendor);
  let riskScore = Math.min(100, Math.round(0.45 * ifScore + 0.55 * ruleScore));
  if (reasons.some((reason) => reason.severity === "high")) {
    riskScore = Math.max(70, riskScore);
  }
  const riskLevel: RiskLevel =
    riskScore >= 70 ? "High" : riskScore >= 40 ? "Medium" : "Low";

  const rawFeatures = featureVector(draft, vendor.medianAmount, vendor.stdAmount);
  const weighted = rawFeatures
    .map((value, index) => ({
      feature: featureNames[index] ?? `Feature ${index + 1}`,
      value: Math.abs((value - (featureMeans[index] ?? 0)) / (featureScales[index] ?? 1)),
    }))
    .sort((first, second) => second.value - first.value)
    .slice(0, 6);
  const totalContribution = weighted.reduce((sum, item) => sum + item.value, 0) || 1;
  const featureContributions = weighted.map((item) => ({
    feature: item.feature,
    contribution: round2((item.value / totalContribution) * 100),
  }));

  const medianText = `₹${vendor.medianAmount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
  const ratioText = (vendor.medianAmount > 0
    ? draft.totalAmount / vendor.medianAmount
    : 1
  ).toFixed(1);
  const topReasons = reasons.slice(0, 2).map((reason) => reason.message);
  const explanation =
    reasons.length > 0
      ? `This invoice from ${vendor.name} was flagged ${riskLevel.toLowerCase()} risk (${riskScore}/100) mainly because ${topReasons.join(" and ")}. Compared with this vendor's usual invoice median (${medianText}), this one is ${ratioText}× higher. Recommended action: ${riskLevel === "High" ? "escalate for human review" : "verify the source documents"}.`
      : `This invoice from ${vendor.name} has a low risk score (${riskScore}/100) with no GST rule conflicts detected. Its value is ${ratioText}× this vendor's usual median (${medianText}). Recommended action: continue normal review.`;

  return { riskScore, riskLevel, reasons, featureContributions, explanation };
}

function seedDraftsFromRows(
  invoices: Invoice[],
  vendors: Vendor[],
): Array<{ draft: InvoiceDraft; vendor: Vendor }> {
  const vendorById = new Map(vendors.map((vendor) => [vendor.id, vendor]));
  return invoices.flatMap((invoice) => {
    const vendor = vendorById.get(invoice.vendorId);
    if (!vendor) return [];
    return [{ draft: rowToDraft(invoice, vendor.name), vendor }];
  });
}

export function rowToDraft(
  invoice: Pick<
    Invoice,
    | "invoiceNumber"
    | "vendorGstin"
    | "invoiceDate"
    | "buyerGstin"
    | "placeOfSupply"
    | "hsnCode"
    | "description"
    | "itemCount"
    | "taxableValue"
    | "gstRate"
    | "cgst"
    | "sgst"
    | "igst"
    | "totalAmount"
  >,
  vendorName: string,
): InvoiceDraft {
  return {
    invoiceNumber: invoice.invoiceNumber,
    vendorName,
    vendorGstin: invoice.vendorGstin,
    invoiceDate: invoice.invoiceDate,
    buyerGstin: invoice.buyerGstin,
    placeOfSupply: invoice.placeOfSupply,
    hsnCode: invoice.hsnCode,
    description: invoice.description,
    itemCount: invoice.itemCount,
    taxableValue: invoice.taxableValue,
    gstRate: invoice.gstRate,
    cgst: invoice.cgst,
    sgst: invoice.sgst,
    igst: invoice.igst,
    totalAmount: invoice.totalAmount,
  };
}

async function initialize(): Promise<void> {
  let vendors = await db.select().from(finomalyVendorsTable);
  let invoices = await db.select().from(finomalyInvoicesTable);
  if (invoices.length === 0) {
    const seedVendorRows = vendorSeeds.map((seed, index) => {
      const gstin = makeGstin(seed[1], index + 1);
      return {
        id: `vendor-${index + 1}`,
        name: seed[0],
        gstin,
        state: stateNames[seed[1]] ?? "Other",
        businessType: seed[2],
        averageAmount: seed[3],
        medianAmount: seed[3],
        stdAmount: Math.max(seed[3] * 0.34, 1),
        typicalGstRate: seed[4],
        invoiceCount: 50,
        riskScore: 0,
      };
    });
    await db.insert(finomalyVendorsTable).values(seedVendorRows);
    vendors = await db.select().from(finomalyVendorsTable);
    const generated = buildSeedDrafts(vendors);
    const byId = new Map(vendors.map((vendor) => [vendor.id, vendor]));
    const trainingRows = generated.flatMap(({ draft, vendorId }) => {
      const vendor = byId.get(vendorId);
      return vendor ? [{ draft, vendor }] : [];
    });
    trainForest(trainingRows);
    const previousByVendor = new Map<string, Invoice[]>();
    let flaggedIndex = 0;
    const values = generated.map(({ draft, vendorId }) => {
      const vendor = byId.get(vendorId);
      if (!vendor) throw new Error("Seed invoice references an unknown vendor");
      const history = previousByVendor.get(vendorId) ?? [];
      const analysis = analyzeDraft(draft, vendor, history);
      const id = randomUUID();
      const invoice = {
        id,
        invoiceNumber: draft.invoiceNumber,
        vendorId,
        vendorGstin: draft.vendorGstin,
        invoiceDate: draft.invoiceDate,
        buyerGstin: draft.buyerGstin,
        placeOfSupply: draft.placeOfSupply,
        hsnCode: draft.hsnCode,
        description: draft.description,
        itemCount: draft.itemCount,
        taxableValue: draft.taxableValue,
        gstRate: draft.gstRate,
        cgst: draft.cgst,
        sgst: draft.sgst,
        igst: draft.igst,
        totalAmount: draft.totalAmount,
        source: "seed",
        riskScore: analysis.riskScore,
        riskLevel: analysis.riskLevel,
        status:
          analysis.riskLevel === "High" || analysis.riskLevel === "Medium"
            ? flaggedIndex < 15
              ? "Pending"
              : flaggedIndex < 20
                ? "Escalated"
                : flaggedIndex < 25
                  ? "Needs Correction"
                  : "Verified Genuine"
            : "Verified Genuine",
        reasons: analysis.reasons,
        featureContributions: analysis.featureContributions,
        explanation: analysis.explanation,
        vendorMedian: vendor.medianAmount,
        vendorHistory: history.slice(-12).map((entry) => entry.totalAmount),
      };
      if (analysis.riskLevel !== "Low") flaggedIndex += 1;
      const saved = {
        ...invoice,
        status: invoice.status as ReviewStatus,
      } as Invoice;
      previousByVendor.set(vendorId, [...history, saved]);
      return invoice;
    });
    await db.insert(finomalyInvoicesTable).values(values);
    invoices = await db.select().from(finomalyInvoicesTable);

    for (const vendor of vendors) {
      const vendorInvoices = invoices.filter(
        (invoice) => invoice.vendorId === vendor.id,
      );
      const highScores = vendorInvoices.map((invoice) => invoice.riskScore);
      await db
        .update(finomalyVendorsTable)
        .set({
          invoiceCount: vendorInvoices.length,
          riskScore: Math.round(
            highScores.reduce((sum, value) => sum + value, 0) /
              (highScores.length || 1),
          ),
        })
        .where(eq(finomalyVendorsTable.id, vendor.id));
    }
  } else {
    trainForest(seedDraftsFromRows(invoices, vendors));
  }
}

export async function ensureDemoData(): Promise<void> {
  initialization ??= initialize();
  await initialization;
}

async function loadTables(): Promise<{ vendors: Vendor[]; invoices: Invoice[] }> {
  await ensureDemoData();
  const [vendors, invoices] = await Promise.all([
    db.select().from(finomalyVendorsTable),
    db.select().from(finomalyInvoicesTable).orderBy(desc(finomalyInvoicesTable.invoiceDate)),
  ]);
  return { vendors, invoices };
}

function summaryOf(invoice: Invoice, vendor?: Vendor) {
  return {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    vendorId: invoice.vendorId,
    vendorName: vendor?.name ?? "Unknown vendor",
    vendorGstin: invoice.vendorGstin,
    invoiceDate: invoice.invoiceDate,
    totalAmount: invoice.totalAmount,
    riskScore: invoice.riskScore,
    riskLevel: invoice.riskLevel as RiskLevel,
    status: invoice.status as ReviewStatus,
  };
}

export async function getDashboardSummary() {
  const { vendors, invoices } = await loadTables();
  const vendorById = new Map(vendors.map((vendor) => [vendor.id, vendor]));
  const flagged = invoices.filter((invoice) => invoice.riskScore >= 40);
  const riskDistribution = (["Low", "Medium", "High"] as const).map(
    (level) => ({
      level,
      count: invoices.filter((invoice) => invoice.riskLevel === level).length,
    }),
  );
  const monthlyTrend = Array.from({ length: 12 }, (_, index) => {
    const month = new Date();
    month.setDate(1);
    month.setMonth(month.getMonth() - (11 - index));
    const key = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`;
    const monthInvoices = invoices.filter((invoice) =>
      invoice.invoiceDate.startsWith(key),
    );
    return {
      month: month.toLocaleDateString("en-IN", { month: "short" }),
      invoices: monthInvoices.length,
      flagged: monthInvoices.filter((invoice) => invoice.riskScore >= 40).length,
    };
  });
  const vendorInvoiceCounts = vendors.map((vendor) => {
    const vendorInvoices = invoices.filter(
      (invoice) => invoice.vendorId === vendor.id,
    );
    return {
      id: vendor.id,
      name: vendor.name,
      gstin: vendor.gstin,
      state: vendor.state,
      invoiceCount: vendorInvoices.length,
      averageAmount:
        vendorInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0) /
        (vendorInvoices.length || 1),
      medianAmount: vendor.medianAmount,
      riskScore: vendor.riskScore,
    };
  });
  const anomalyCounts = new Map<string, number>();
  for (const invoice of invoices) {
    for (const reason of invoice.reasons) {
      anomalyCounts.set(reason.code, (anomalyCounts.get(reason.code) ?? 0) + 1);
    }
  }
  const recentHighRisk = invoices
    .filter((invoice) => invoice.riskLevel === "High")
    .sort((first, second) => second.riskScore - first.riskScore)
    .slice(0, 6)
    .map((invoice) => summaryOf(invoice, vendorById.get(invoice.vendorId)));
  return {
    kpis: {
      totalInvoices: invoices.length,
      flaggedInvoices: flagged.length,
      highRiskCount: invoices.filter((invoice) => invoice.riskLevel === "High")
        .length,
      amountAtRisk: flagged.reduce((sum, invoice) => sum + invoice.totalAmount, 0),
      averageRiskScore: Math.round(
        invoices.reduce((sum, invoice) => sum + invoice.riskScore, 0) /
          (invoices.length || 1),
      ),
      pendingReviews: invoices.filter((invoice) => invoice.status === "Pending")
        .length,
    },
    riskDistribution,
    monthlyTrend,
    topVendors: vendorInvoiceCounts
      .sort((first, second) => second.riskScore - first.riskScore)
      .slice(0, 5),
    anomalyTypes: [...anomalyCounts.entries()]
      .map(([type, count]) => ({ type, count }))
      .sort((first, second) => second.count - first.count)
      .slice(0, 8),
    recentHighRisk,
  };
}

export async function getInvoicePage(params: {
  q?: string;
  risk?: RiskLevel;
  vendorId?: string;
  status?: string;
  page: number;
  perPage: number;
}) {
  const { vendors, invoices } = await loadTables();
  const vendorById = new Map(vendors.map((vendor) => [vendor.id, vendor]));
  const search = params.q?.trim().toLowerCase();
  const matched = invoices.filter((invoice) => {
    const vendor = vendorById.get(invoice.vendorId);
    if (params.risk && invoice.riskLevel !== params.risk) return false;
    if (params.vendorId && invoice.vendorId !== params.vendorId) return false;
    if (params.status && invoice.status !== params.status) return false;
    if (
      search &&
      ![
        invoice.invoiceNumber,
        invoice.vendorGstin,
        vendor?.name ?? "",
      ].some((value) => value.toLowerCase().includes(search))
    ) {
      return false;
    }
    return true;
  });
  const start = (params.page - 1) * params.perPage;
  return {
    items: matched
      .slice(start, start + params.perPage)
      .map((invoice) => summaryOf(invoice, vendorById.get(invoice.vendorId))),
    total: matched.length,
    page: params.page,
    perPage: params.perPage,
  };
}

export async function getInvoiceDetail(id: string) {
  const { vendors, invoices } = await loadTables();
  const invoice = invoices.find((entry) => entry.id === id);
  if (!invoice) return null;
  const vendor = vendors.find((entry) => entry.id === invoice.vendorId);
  if (!vendor) return null;
  const logs = await db
    .select()
    .from(finomalyReviewLogsTable)
    .where(eq(finomalyReviewLogsTable.invoiceId, id))
    .orderBy(desc(finomalyReviewLogsTable.timestamp));
  return {
    ...summaryOf(invoice, vendor),
    buyerGstin: invoice.buyerGstin,
    placeOfSupply: invoice.placeOfSupply,
    hsnCode: invoice.hsnCode,
    description: invoice.description,
    itemCount: invoice.itemCount,
    taxableValue: invoice.taxableValue,
    gstRate: invoice.gstRate,
    cgst: invoice.cgst,
    sgst: invoice.sgst,
    igst: invoice.igst,
    source: invoice.source,
    reasons: invoice.reasons,
    featureContributions: invoice.featureContributions,
    explanation: invoice.explanation,
    vendorMedian: invoice.vendorMedian,
    vendorHistory: invoice.vendorHistory,
    reviewLogs: logs.map((log) => ({
      action: log.action,
      note: log.note,
      reviewer: log.reviewer,
      timestamp: log.timestamp.toISOString(),
    })),
  };
}

export async function analyzeAndSave(
  draft: InvoiceDraft,
  source = "manual",
  simulatorScenario?: string,
) {
  const { vendors, invoices } = await loadTables();
  let vendor = vendors.find((entry) => entry.gstin === draft.vendorGstin);
  if (!vendor) {
    const existingByName = vendors.find(
      (entry) => entry.name.toLowerCase() === draft.vendorName.toLowerCase(),
    );
    if (existingByName && isValidGstin(draft.vendorGstin)) {
      vendor = existingByName;
    } else {
      const created = {
        id: randomUUID(),
        name: draft.vendorName,
        gstin: draft.vendorGstin,
        state: getStateName(draft.vendorGstin),
        businessType: "New vendor",
        averageAmount: draft.totalAmount,
        medianAmount: draft.totalAmount,
        stdAmount: Math.max(draft.totalAmount * 0.34, 1),
        typicalGstRate: draft.gstRate,
        invoiceCount: 0,
        riskScore: 0,
      };
      const [inserted] = await db
        .insert(finomalyVendorsTable)
        .values(created)
        .onConflictDoNothing()
        .returning();
      vendor =
        inserted ??
        (await db
          .select()
          .from(finomalyVendorsTable)
          .where(eq(finomalyVendorsTable.gstin, draft.vendorGstin))
          .then((rows) => rows[0]));
      if (!vendor) throw new Error("Could not create or find invoice vendor");
    }
  }
  const history = invoices.filter((invoice) => invoice.vendorId === vendor?.id);
  const analysis = analyzeDraft(draft, vendor, history, simulatorScenario);
  const id = randomUUID();
  await db.insert(finomalyInvoicesTable).values({
    id,
    invoiceNumber: draft.invoiceNumber,
    vendorId: vendor.id,
    vendorGstin: draft.vendorGstin,
    invoiceDate: draft.invoiceDate,
    buyerGstin: draft.buyerGstin,
    placeOfSupply: draft.placeOfSupply,
    hsnCode: draft.hsnCode,
    description: draft.description,
    itemCount: draft.itemCount,
    taxableValue: draft.taxableValue,
    gstRate: draft.gstRate,
    cgst: draft.cgst,
    sgst: draft.sgst,
    igst: draft.igst,
    totalAmount: draft.totalAmount,
    source,
    riskScore: analysis.riskScore,
    riskLevel: analysis.riskLevel,
    status: "Pending",
    reasons: analysis.reasons,
    featureContributions: analysis.featureContributions,
    explanation: analysis.explanation,
    vendorMedian: vendor.medianAmount,
    vendorHistory: history.slice(-12).map((entry) => entry.totalAmount),
  });
  const freshValues = [...history.map((entry) => entry.totalAmount), draft.totalAmount];
  const average =
    freshValues.reduce((sum, amount) => sum + amount, 0) / freshValues.length;
  const sorted = [...freshValues].sort((first, second) => first - second);
  const median = sorted[Math.floor(sorted.length / 2)] ?? draft.totalAmount;
  await db
    .update(finomalyVendorsTable)
    .set({
      invoiceCount: freshValues.length,
      averageAmount: average,
      medianAmount: median,
      riskScore: Math.max(vendor.riskScore, analysis.riskScore),
    })
    .where(eq(finomalyVendorsTable.id, vendor.id));
  return getInvoiceDetail(id);
}

export async function reviewInvoice(
  id: string,
  action: ReviewStatus,
  note: string,
) {
  await ensureDemoData();
  const updated = await db
    .update(finomalyInvoicesTable)
    .set({ status: action })
    .where(eq(finomalyInvoicesTable.id, id))
    .returning({ id: finomalyInvoicesTable.id });
  if (updated.length === 0) return null;
  await db.insert(finomalyReviewLogsTable).values({
    id: randomUUID(),
    invoiceId: id,
    action,
    note,
    reviewer: "Demo User · CA Firm",
  });
  return getInvoiceDetail(id);
}

export async function simulateScenario(scenario: string) {
  const { vendors, invoices } = await loadTables();
  if (vendors.length === 0) return null;
  const vendor = vendors[Math.floor(Math.random() * vendors.length)];
  if (!vendor) return null;
  const related = invoices.filter((invoice) => invoice.vendorId === vendor.id);
  const baseline =
    related.at(-1) ??
    invoices.find((invoice) => invoice.vendorId === vendor.id);
  if (!baseline) return null;
  const today = dateString(new Date());
  let amount = Math.max(vendor.medianAmount * 1.2, 1_000);
  let vendorGstin = vendor.gstin;
  let invoiceNumber = `DEMO/${new Date().getFullYear()}/${String(Date.now()).slice(-6)}`;
  let invoiceDate = today;
  let placeOfSupply = stateCodeFromGstin(vendor.gstin);
  let taxableValue = round2(amount / (1 + vendor.typicalGstRate / 100));
  let taxes = amountTaxes(taxableValue, vendor.typicalGstRate, true);
  if (scenario === "Spike Amount") {
    amount = Math.max(vendor.medianAmount * 8, 100_000);
  } else if (scenario === "Duplicate Invoice") {
    invoiceNumber = baseline.invoiceNumber;
    amount = baseline.totalAmount;
    invoiceDate = baseline.invoiceDate;
  } else if (scenario === "Invalid GSTIN") {
    vendorGstin = `${vendor.gstin.slice(0, -1)}${vendor.gstin.at(-1) === "0" ? "1" : "0"}`;
  } else if (scenario === "Tax Mismatch") {
    amount = Math.max(vendor.medianAmount, 20_000);
  } else if (scenario === "Just-Below-Threshold Splitting") {
    amount = 48_500;
  } else if (scenario === "Round-Number Bills") {
    amount = vendor.medianAmount > 50_000 ? 100_000 : 50_000;
  }
  taxableValue = round2(amount / (1 + vendor.typicalGstRate / 100));
  taxes = amountTaxes(taxableValue, vendor.typicalGstRate, true);
  const draft: InvoiceDraft = {
    invoiceNumber,
    vendorName: vendor.name,
    vendorGstin,
    invoiceDate,
    buyerGstin: makeGstin(placeOfSupply, 900 + vendors.indexOf(vendor)),
    placeOfSupply,
    hsnCode: "9983",
    description: `Demo ${scenario.toLowerCase()} scenario`,
    itemCount: 2,
    taxableValue,
    gstRate: vendor.typicalGstRate,
    ...taxes,
    totalAmount: amount,
  };
  if (scenario === "Tax Mismatch") {
    draft.cgst = round2(taxes.cgst * 0.4);
    draft.sgst = round2(taxes.sgst * 0.4);
    draft.igst = round2(taxes.igst * 0.4);
  }
  if (scenario === "Just-Below-Threshold Splitting") {
    const result = await analyzeAndSave(draft, "simulator", scenario);
    if (!result) return null;
    const secondDraft = {
      ...draft,
      invoiceNumber: `${invoiceNumber}-B`,
      totalAmount: 49_200,
      taxableValue: round2(49_200 / (1 + vendor.typicalGstRate / 100)),
    };
    const secondTaxes = amountTaxes(
      secondDraft.taxableValue,
      vendor.typicalGstRate,
      true,
    );
    Object.assign(secondDraft, secondTaxes);
    await analyzeAndSave(secondDraft, "simulator", scenario);
    const thirdDraft = {
      ...draft,
      invoiceNumber: `${invoiceNumber}-C`,
      totalAmount: 49_600,
      taxableValue: round2(49_600 / (1 + vendor.typicalGstRate / 100)),
    };
    const thirdTaxes = amountTaxes(
      thirdDraft.taxableValue,
      vendor.typicalGstRate,
      true,
    );
    Object.assign(thirdDraft, thirdTaxes);
    return analyzeAndSave(thirdDraft, "simulator", scenario);
  }
  return analyzeAndSave(draft, "simulator", scenario);
}

export async function getVendors() {
  const { vendors, invoices } = await loadTables();
  return vendors.map((vendor) => {
    const related = invoices.filter((invoice) => invoice.vendorId === vendor.id);
    return {
      id: vendor.id,
      name: vendor.name,
      gstin: vendor.gstin,
      state: vendor.state,
      invoiceCount: related.length,
      averageAmount:
        related.reduce((sum, invoice) => sum + invoice.totalAmount, 0) /
        (related.length || 1),
      medianAmount: vendor.medianAmount,
      riskScore: vendor.riskScore,
    };
  });
}

export async function getVendor(id: string) {
  const { vendors, invoices } = await loadTables();
  const vendor = vendors.find((entry) => entry.id === id);
  if (!vendor) return null;
  const related = invoices
    .filter((invoice) => invoice.vendorId === id)
    .sort((first, second) => first.invoiceDate.localeCompare(second.invoiceDate));
  return {
    id: vendor.id,
    name: vendor.name,
    gstin: vendor.gstin,
    state: vendor.state,
    invoiceCount: related.length,
    averageAmount:
      related.reduce((sum, invoice) => sum + invoice.totalAmount, 0) /
      (related.length || 1),
    medianAmount: vendor.medianAmount,
    riskScore: vendor.riskScore,
    typicalGstRate: vendor.typicalGstRate,
    invoices: related.slice(-30).reverse().map((invoice) => summaryOf(invoice, vendor)),
    timeline: related.slice(-30).map((invoice) => ({
      date: invoice.invoiceDate,
      amount: invoice.totalAmount,
      anomaly: invoice.riskLevel !== "Low",
    })),
  };
}

export async function getModelInfo() {
  const { invoices } = await loadTables();
  return {
    algorithm: "Isolation Forest + GST rule engine + vendor history",
    contamination: 0.08,
    features: featureNames,
    scoreDistribution: invoices
      .map((invoice) => invoice.riskScore)
      .sort((first, second) => first - second),
    trainedAt: new Date().toISOString(),
    dataNote:
      "Trained on synthetic demo invoices. Risk scores support human review and are not proof of fraud.",
  };
}

export async function getNotifications() {
  const { vendors, invoices } = await loadTables();
  const vendorById = new Map(vendors.map((vendor) => [vendor.id, vendor]));
  return invoices
    .filter((invoice) => invoice.riskLevel === "High")
    .sort((first, second) => second.createdAt.getTime() - first.createdAt.getTime())
    .slice(0, 10)
    .map((invoice) => summaryOf(invoice, vendorById.get(invoice.vendorId)));
}

export async function reconcileSample() {
  const rows: Array<{
    vendor: string;
    invoiceNumber: string;
    status: string;
    registerTax: number;
    gstr2bTax: number;
  }> = [];
  const vendors = await db.select().from(finomalyVendorsTable);
  for (let index = 0; index < 40; index += 1) {
    const vendor = vendors[index % Math.max(1, vendors.length)];
    const name = vendor?.name ?? "Sample Vendor";
    const invoiceNumber = `REG/2026/${String(index + 1).padStart(4, "0")}`;
    const registerTax = 1_250 + index * 73;
    if (index < 6) {
      rows.push({
        vendor: name,
        invoiceNumber,
        status: "Missing in GSTR-2B",
        registerTax,
        gstr2bTax: 0,
      });
    } else if (index < 11) {
      rows.push({
        vendor: name,
        invoiceNumber,
        status: "Amount Mismatch",
        registerTax,
        gstr2bTax: registerTax - 215,
      });
    } else {
      rows.push({
        vendor: name,
        invoiceNumber,
        status: "Matched",
        registerTax,
        gstr2bTax: registerTax,
      });
    }
  }
  rows.push({
    vendor: vendors[0]?.name ?? "Extra Vendor",
    invoiceNumber: "2B/EXTRA/2026/0091",
    status: "Extra in GSTR-2B",
    registerTax: 0,
    gstr2bTax: 2_400,
  });
  return {
    matched: rows.filter((row) => row.status === "Matched").length,
    missingIn2b: rows.filter((row) => row.status === "Missing in GSTR-2B").length,
    mismatched: rows.filter((row) => row.status === "Amount Mismatch").length,
    extraIn2b: rows.filter((row) => row.status === "Extra in GSTR-2B").length,
    itcAtRisk: rows
      .filter((row) => row.status !== "Matched")
      .reduce(
        (sum, row) =>
          sum + (row.status === "Extra in GSTR-2B" ? 0 : row.registerTax),
        0,
      ),
    rows,
  };
}
