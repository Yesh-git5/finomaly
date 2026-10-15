import { Router, type IRouter } from "express";
import {
  AnalyzeInvoiceBody,
  AnalyzeInvoiceResponse,
  GetDashboardSummaryResponse,
  GetInvoiceParams,
  GetInvoiceResponse,
  GetInvoicesQueryParams,
  GetInvoicesResponse,
  GetModelInfoResponse,
  GetNotificationsResponse,
  GetVendorParams,
  GetVendorResponse,
  GetVendorsResponse,
  ReconcileItcBody,
  ReconcileItcResponse,
  ReviewInvoiceBody,
  ReviewInvoiceParams,
  ReviewInvoiceResponse,
  SimulateScenarioBody,
  SimulateScenarioResponse,
} from "@workspace/api-zod";
import {
  analyzeAndSave,
  ensureDemoData,
  getDashboardSummary,
  getInvoiceDetail,
  getInvoicePage,
  getModelInfo,
  getNotifications,
  getVendor,
  getVendors,
  reconcileSample,
  reviewInvoice,
  simulateScenario,
} from "../lib/finomaly-engine";

const router: IRouter = Router();

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  await ensureDemoData();
  const response = GetDashboardSummaryResponse.parse(await getDashboardSummary());
  res.json(response);
});

router.get("/invoices", async (req, res): Promise<void> => {
  const params = GetInvoicesQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const response = GetInvoicesResponse.parse(await getInvoicePage(params.data));
  res.json(response);
});

router.post("/invoices", async (req, res): Promise<void> => {
  const parsed = AnalyzeInvoiceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const detail = await analyzeAndSave(parsed.data);
  if (!detail) {
    res.status(500).json({ error: "Invoice analysis did not return a result." });
    return;
  }
  res.status(201).json(AnalyzeInvoiceResponse.parse(detail));
});

router.post("/simulate", async (req, res): Promise<void> => {
  const parsed = SimulateScenarioBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const detail = await simulateScenario(parsed.data.scenario);
  if (!detail) {
    res.status(500).json({ error: "Could not create the simulated invoice." });
    return;
  }
  res.status(201).json(SimulateScenarioResponse.parse(detail));
});

router.post("/invoices/:id/review", async (req, res): Promise<void> => {
  const params = ReviewInvoiceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = ReviewInvoiceBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const detail = await reviewInvoice(
    params.data.id,
    body.data.action,
    body.data.note,
  );
  if (!detail) {
    res.status(404).json({ error: "Invoice not found." });
    return;
  }
  res.json(ReviewInvoiceResponse.parse(detail));
});

router.get("/invoices/:id", async (req, res): Promise<void> => {
  const params = GetInvoiceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const detail = await getInvoiceDetail(params.data.id);
  if (!detail) {
    res.status(404).json({ error: "Invoice not found." });
    return;
  }
  res.json(GetInvoiceResponse.parse(detail));
});

router.get("/vendors", async (_req, res): Promise<void> => {
  res.json(GetVendorsResponse.parse(await getVendors()));
});

router.get("/vendors/:id", async (req, res): Promise<void> => {
  const params = GetVendorParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const vendor = await getVendor(params.data.id);
  if (!vendor) {
    res.status(404).json({ error: "Vendor not found." });
    return;
  }
  res.json(GetVendorResponse.parse(vendor));
});

router.get("/model/info", async (_req, res): Promise<void> => {
  res.json(GetModelInfoResponse.parse(await getModelInfo()));
});

router.get("/notifications", async (_req, res): Promise<void> => {
  res.json(GetNotificationsResponse.parse(await getNotifications()));
});

router.post("/reconcile", async (req, res): Promise<void> => {
  const parsed = ReconcileItcBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  res.json(ReconcileItcResponse.parse(await reconcileSample()));
});

export default router;
