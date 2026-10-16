import { useQuery, useMutation, type UseQueryOptions } from '@tanstack/react-query';

export type RiskLevel = 'Low' | 'Medium' | 'High';
export type InvoiceStatus = 'Pending' | 'Verified Genuine' | 'Needs Correction' | 'Escalated';
export type ReviewInputAction = 'Verified Genuine' | 'Needs Correction' | 'Escalated';

export interface Reason {
  code: string;
  message: string;
  severity: 'low' | 'med' | 'high';
  weight: number;
}

export interface ReviewLog {
  id: string;
  action: string;
  note: string;
  timestamp: string;
  reviewer: string;
}

export interface InvoiceSummary {
  id: string;
  invoiceNumber: string;
  invoice_number?: string;
  vendorName: string;
  vendor?: string;
  vendorGstin: string;
  gstin?: string;
  invoiceDate: string;
  totalAmount: number;
  amount?: number;
  riskLevel: RiskLevel;
  risk_level?: RiskLevel;
  riskScore: number;
  risk_score?: number;
  status: InvoiceStatus;
  documentName?: string | null;
  uploadedBy?: string;
  submissionMethod?: string;
}

export interface InvoiceDetail extends InvoiceSummary {
  buyerGstin?: string;
  placeOfSupply?: string;
  hsnCode?: string;
  description?: string;
  itemCount?: number;
  taxableValue?: number;
  gstRate?: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  source?: string;
  explanation?: string;
  reasons?: Reason[];
  vendorMedian?: number;
  vendorHistory?: number[];
  reviewLogs?: ReviewLog[];
  documentName?: string | null;
  documentPreview?: string | null;
  uploadedBy?: string;
  submissionMethod?: string;
  ocrConfidence?: number | null;
  submittedAt?: string;
}

export interface InvoiceInput {
  invoiceNumber: string;
  vendorName: string;
  vendorGstin: string;
  invoiceDate: string;
  buyerGstin?: string;
  placeOfSupply?: string;
  hsnCode?: string;
  description?: string;
  itemCount?: number;
  taxableValue?: number;
  gstRate?: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  totalAmount: number;
  documentName?: string | null;
  documentPreview?: string | null;
  uploadedBy?: string;
  submissionMethod?: string;
  ocrConfidence?: number | null;
}

export interface DashboardKpis {
  totalInvoices: number;
  flaggedInvoices: number;
  highRiskCount: number;
  amountAtRisk: number;
  averageRiskScore: number;
  pendingReviews: number;
}

export interface MonthlyTrend {
  month: string;
  invoices: number;
  flagged: number;
}

export interface RiskBucket {
  level: RiskLevel;
  count: number;
}

export interface AnomalyCount {
  type: string;
  count: number;
}

export interface VendorSummary {
  id: string;
  name: string;
  gstin: string;
  state: string;
  invoiceCount: number;
  averageAmount: number;
  medianAmount: number;
  riskScore: number;
  typicalGstRate?: number;
}

export interface VendorDetailTimelineItem {
  date: string;
  amount: number;
  anomaly?: boolean;
}

export interface VendorDetail extends VendorSummary {
  invoices?: InvoiceSummary[];
  timeline?: VendorDetailTimelineItem[];
}

export interface DashboardSummary {
  kpis: DashboardKpis;
  monthlyTrend: MonthlyTrend[];
  riskDistribution: RiskBucket[];
  anomalyTypes: AnomalyCount[];
  recentHighRisk: InvoiceSummary[];
  topVendors: VendorSummary[];
}

export interface ModelInfo {
  algorithm: string;
  contamination: number;
  trainedAt: string;
  dataNote: string;
  features: string[];
  scoreDistribution: number[];
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  invoiceId: string;
  timestamp: string;
}

export type SimulationInputScenario =
  | 'Spike Amount'
  | 'Duplicate Invoice'
  | 'Invalid GSTIN'
  | 'Tax Mismatch'
  | 'Just-Below-Threshold Splitting'
  | 'Round-Number Bills';

export interface SimulationInput {
  scenario: SimulationInputScenario;
}

export interface ReconcileRow {
  vendor: string;
  invoiceNumber: string;
  status: string;
  registerTax: number;
  gstr2bTax: number;
}

export interface ReconcileResult {
  matched: number;
  missingIn2b: number;
  mismatched: number;
  extraIn2b: number;
  itcAtRisk: number;
  rows: ReconcileRow[];
}

export interface ReconcileInput {
  useSample?: boolean;
}

export interface ReviewInput {
  action: ReviewInputAction;
  note?: string;
}

export interface InvoicePage {
  items: InvoiceSummary[];
  total: number;
  page: number;
  perPage: number;
}

export interface GetInvoicesParams {
  q?: string;
  risk?: RiskLevel;
  status?: string;
  page?: number;
  perPage?: number;
}

export const getGetDashboardSummaryQueryKey = () => ['/api/dashboard/summary'] as const;
export function useGetDashboardSummary(options?: { query?: UseQueryOptions<DashboardSummary> }) {
  return useQuery({
    queryKey: getGetDashboardSummaryQueryKey(),
    queryFn: async () => {
      const res = await fetch('/api/dashboard/summary');
      if (!res.ok) throw new Error('Failed to fetch dashboard summary');
      return res.json() as Promise<DashboardSummary>;
    },
    ...options?.query,
  });
}

export const getGetInvoicesQueryKey = (params?: GetInvoicesParams) => ['/api/invoices', params] as const;
export function useGetInvoices(params?: GetInvoicesParams, options?: { query?: UseQueryOptions<InvoicePage> }) {
  return useQuery({
    queryKey: getGetInvoicesQueryKey(params),
    queryFn: async () => {
      const sp = new URLSearchParams();
      if (params?.q) sp.set('q', params.q);
      if (params?.risk) sp.set('risk', params.risk);
      if (params?.status) sp.set('status', params.status);
      if (params?.page) sp.set('page', String(params.page));
      if (params?.perPage) sp.set('perPage', String(params.perPage));
      const url = `/api/invoices${sp.toString() ? '?' + sp.toString() : ''}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch invoices');
      return res.json() as Promise<InvoicePage>;
    },
    ...options?.query,
  });
}

export const getGetInvoiceQueryKey = (id: string) => ['/api/invoices', id] as const;
export function useGetInvoice(id: string, options?: { query?: UseQueryOptions<InvoiceDetail> }) {
  return useQuery({
    queryKey: getGetInvoiceQueryKey(id),
    queryFn: async () => {
      const res = await fetch(`/api/invoices/${id}`);
      if (!res.ok) throw new Error('Failed to fetch invoice');
      return res.json() as Promise<InvoiceDetail>;
    },
    ...options?.query,
  });
}

export function useReviewInvoice() {
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ReviewInput }) => {
      const res = await fetch(`/api/invoices/${id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to record review');
      return res.json() as Promise<InvoiceDetail>;
    },
  });
}

export function useAnalyzeInvoice() {
  return useMutation({
    mutationFn: async ({ data }: { data: InvoiceInput }) => {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to analyze invoice');
      return res.json() as Promise<InvoiceDetail>;
    },
  });
}

export const getGetVendorsQueryKey = () => ['/api/vendors'] as const;
export function useGetVendors(options?: { query?: UseQueryOptions<VendorSummary[]> }) {
  return useQuery({
    queryKey: getGetVendorsQueryKey(),
    queryFn: async () => {
      const res = await fetch('/api/vendors');
      if (!res.ok) throw new Error('Failed to fetch vendors');
      return res.json() as Promise<VendorSummary[]>;
    },
    ...options?.query,
  });
}

export const getGetVendorQueryKey = (id: string) => ['/api/vendors', id] as const;
export function useGetVendor(id: string, options?: { query?: UseQueryOptions<VendorDetail> }) {
  return useQuery({
    queryKey: getGetVendorQueryKey(id),
    queryFn: async () => {
      const res = await fetch(`/api/vendors/${id}`);
      if (!res.ok) throw new Error('Failed to fetch vendor');
      return res.json() as Promise<VendorDetail>;
    },
    ...options?.query,
  });
}

export const getGetNotificationsQueryKey = () => ['/api/notifications'] as const;
export function useGetNotifications(options?: { query?: UseQueryOptions<NotificationItem[]> }) {
  return useQuery({
    queryKey: getGetNotificationsQueryKey(),
    queryFn: async () => {
      const res = await fetch('/api/notifications');
      if (!res.ok) throw new Error('Failed to fetch notifications');
      return res.json() as Promise<NotificationItem[]>;
    },
    ...options?.query,
  });
}

export function useReconcileItc() {
  return useMutation({
    mutationFn: async ({ data }: { data: ReconcileInput }) => {
      const res = await fetch('/api/reconcile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to reconcile');
      return res.json() as Promise<ReconcileResult>;
    },
  });
}

export function useSimulateScenario() {
  return useMutation({
    mutationFn: async ({ data }: { data: SimulationInput }) => {
      const res = await fetch('/api/simulator/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to run simulation');
      return res.json() as Promise<InvoiceDetail>;
    },
  });
}

export const getGetModelInfoQueryKey = () => ['/api/model/info'] as const;
export function useGetModelInfo(options?: { query?: UseQueryOptions<ModelInfo> }) {
  return useQuery({
    queryKey: getGetModelInfoQueryKey(),
    queryFn: async () => {
      const res = await fetch('/api/model/info');
      if (!res.ok) throw new Error('Failed to fetch model info');
      return res.json() as Promise<ModelInfo>;
    },
    ...options?.query,
  });
}

export interface CircularRing {
  id: string;
  cycleLength: number;
  path: string[];
  namePath: string;
  totalCirculatedAmount: number;
  retentionRatio: number;
  implicatedInvoices: string[];
  riskTier: string;
  statutoryOffense: string;
  recommendedAction: string;
}

export interface CircularRingsResult {
  ringsCount: number;
  detectedRings: CircularRing[];
}

export const getGetCircularRingsQueryKey = () => ['/api/network/circular-rings'] as const;
export function useGetCircularRings(options?: { query?: UseQueryOptions<CircularRingsResult> }) {
  return useQuery({
    queryKey: getGetCircularRingsQueryKey(),
    queryFn: async () => {
      const res = await fetch('/api/network/circular-rings');
      if (!res.ok) throw new Error('Failed to fetch circular rings');
      return res.json() as Promise<CircularRingsResult>;
    },
    ...options?.query,
  });
}

export interface ContextProfilingCase {
  vendor: string;
  scale: string;
  historicalMedian: number;
  currentInvoice: number;
  ratioToBaseline: string;
  diagnosis: string;
  riskScore: number;
  riskLevel: RiskLevel;
}

export interface ContextProfilingResult {
  problem: string;
  cases: ContextProfilingCase[];
}

export const getGetContextProfilingQueryKey = () => ['/api/context-profiling'] as const;
export function useGetContextProfiling(options?: { query?: UseQueryOptions<ContextProfilingResult> }) {
  return useQuery({
    queryKey: getGetContextProfilingQueryKey(),
    queryFn: async () => {
      const res = await fetch('/api/context-profiling');
      if (!res.ok) throw new Error('Failed to fetch context profiling');
      return res.json() as Promise<ContextProfilingResult>;
    },
    ...options?.query,
  });
}
