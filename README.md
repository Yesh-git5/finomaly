# ⚡ Finomaly | GSTGuard — AI Anomaly Detection & Risk Intelligence

<div align="center">

[![Live Demo](https://img.shields.io/badge/🚀%20Live%20Demo-finomaly--dashboard.vercel.app-00DC82?style=for-the-badge&logo=vercel&logoColor=white)](https://finomaly-dashboard.vercel.app)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-Express%20API-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![OCR Engine](https://img.shields.io/badge/OCR-Tesseract.js-4F46E5?style=for-the-badge)](https://tesseract.projectnaptha.com/)

**"See Beyond the Invoice. Detect Anomalies. Prioritize Risk. Support Smarter Audits."**

*A Next-Generation Decision Support System for Indian GST Authorities (DGGI) and Tax Auditors.*

[🌐 Live Web Application](https://finomaly-dashboard.vercel.app) • [📖 Core Capabilities](#-core-capabilities) • [🏗️ Architecture](#-system-architecture) • [💻 Local Setup](#-getting-started-locally) • [👥 Team INNOQUAD](#-team-innoquad)

</div>

---

## 🎯 The Core Problem: Why Traditional GST Audits Fail

Traditional GST audit systems rely on static threshold alerts (e.g. *"flag any invoice > ₹1,00,000"*). In practice, this creates critical failure points:

| Traditional Audit Bottleneck | How Finomaly Solves It |
| :--- | :--- |
| **❌ The Context Blind Spot:** A ₹4.2 Lakh invoice is flagged identically for a steel mill and a local corner stationery shop. | **✅ Contextual Behavioral Profiling:** Evaluates each invoice against the vendor’s *historical baseline* (median, IQR, category). ₹4.2L is recognized as a **52x anomaly** for a stationery vendor, but completely normal for an enterprise steel supplier. |
| **❌ Invisible Carousel Fraud Rings:** Auditors check invoices one by one, missing coordinated multi-entity rings passing fake ITC. | **✅ Graph Network Topology Engine:** Evaluates directed supplier-buyer flows using graph cycle detection (`A ➔ B ➔ C ➔ A`), instantly exposing round-tripping rings passing bogus Input Tax Credit with zero physical goods transfer. |
| **❌ Disconnected Document Inspection:** Uploaded invoices exist in silos away from statutory filing databases. | **✅ Integrated Document Verification Pipeline:** Vendors submit scanned invoices; the system performs real-time optical OCR and displays side-by-side cross-checks with GSTR-2B statutory records in an interactive lightbox modal. |
| **❌ Auditor Cognitive Overload:** Hundreds of unprioritized alerts with zero explanation or legal grounding. | **✅ Transparent 0–100 Risk Score & Forensic AI:** Prioritizes high-risk filings with plain-English rationales and statutory citations (CGST Act Section 132, Rule 86A). |

---

## 👥 Dual-Role System Design

Finomaly features a **strict profile-based login experience** designed for both taxpayer vendors and senior GST officers without password friction:

```
                          ┌────────────────────────┐
                          │   Finomaly Gateway     │
                          │   Profile Selection    │
                          └───────────┬────────────┘
                                      │
            ┌─────────────────────────┴─────────────────────────┐
            ▼                                                   ▼
┌───────────────────────────────┐               ┌───────────────────────────────┐
│     🏢 GST VENDOR PROFILE     │               │   🛡️ SENIOR AUDITOR PROFILE   │
│  Strictly Scoped Intake View  │               │ Full Forensic Investigation   │
├───────────────────────────────┤               ├───────────────────────────────┤
│ • 📸 Upload Scanned Invoice   │               │ • 📊 Executive KPI Dashboard   │
│   (Live Tesseract.js OCR)     │ ────────────► │ • 📎 Scanned Document Viewer   │
│ • 📝 Manual GST Form Entry    │ (Live Sync)   │ • 🔬 Optical vs GSTR-2B Match │
│ • Auto Tax & HSN Calculations │               │ • 🕸️ Circular Fraud Ring Graph│
│ • Real-time Sync to DGGI Queue│               │ • 🤖 AI Multi-Invoice Triage  │
└───────────────────────────────┘               └───────────────────────────────┘
```

---

## ✨ Key Features & Walkthrough

### 1. 🏢 Vendor Portal (Focused Intake)
* **Isolated Access:** Vendors are locked to a clean, single-purpose intake interface without access to auditor dashboards or sensitive risk intelligence.
* **📸 Upload Scanned GST Invoice or Document:** Upload real invoice images (`.jpg`, `.png`, `.pdf`). An in-browser OCR engine automatically extracts:
  * Invoice Number & Invoice Date
  * Supplier GSTIN & Buyer GSTIN
  * HSN Code, Item Description & Taxable Value
  * Applicable GST Rate (CGST, SGST, IGST)
* **📝 Manual Form Entry:** A statutory entry form with real-time tax math validation, e-Way bill threshold flags, and sample pre-fillers for immediate testing.
* **⚡ Live Synchronization:** Submitted invoices immediately populate the Senior Auditor review queue.

### 2. 🛡️ Senior Auditor Workspace
* **🎯 Risk-Prioritized Invoice Queue:** Invoices ranked by a unified **0–100 Explainable Risk Score** (High / Medium / Low).
* **📎 Attached Document Viewer & Lightbox Modal:** 
  * High-resolution visual preview of the physical scanned invoice.
  * Hover-to-zoom and full-screen document lightbox with download capability.
  * **Optical OCR vs Statutory Register Cross-Check:** Side-by-side comparison table validating extracted OCR data directly against GSTR-2B records.
* **🕸️ Circular Fraud Ring Detector (Topology Graph):**
  * Interactive directed network graph mapping supplier-to-buyer transactions.
  * Identifies 3-entity carousel loops: **Apex Industrial Tools ➔ Rao Tech Solutions ➔ Kuber Enterprises ➔ Apex Industrial Tools** passing ~₹3.76M in circular ITC.
* **📊 Context-Aware Anomaly Engine:**
  * Displays vendor baseline comparisons (e.g. *Sri Lakshmi Traders: Current ₹4,20,000 vs Median ₹8,000*).
  * Exposes artificial bill-splitting schemes designed to stay ₹10 under the ₹50,000 e-Way bill limit (Rule 138).
* **🤖 Autonomous AI Forensic Agent:**
  * Runs statutory rule triage on selected batches.
  * Generates structured investigation dossiers with specific recommendations (*Issue SCN under Section 73/74*, *Block ITC under Rule 86A*, *Summons under Section 70*).

---

## 🔍 The 3 Golden Demo Scenarios

Finomaly includes real, problem-statement driven test scenarios pre-loaded and verifiable in one click:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 1. THE CONTEXT TRAP                                                                    │
│ Sri Lakshmi Traders (INV-A01): ₹4,20,000 ➔ Risk Score: 93 (HIGH RISK)                 │
│ ↳ Stationery vendor billing 52.5x above historical median (₹8,000).                    │
│ Bharat Steel & Infra (INV-N01): ₹4,50,000 ➔ Risk Score: 14 (VERIFIED GENUINE)          │
│ ↳ Enterprise steel plant billing normally (1.07x median ₹4,20,000).                    │
│ Demonstrates: Fixed thresholds fail. Contextual profiling succeeds.                   │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 2. THE CIRCULAR CAROUSEL RING                                                          │
│ Apex Industrial ➔ Rao Tech (₹12.5L) ➔ Kuber Ent (₹12.7L) ➔ Apex Industrial (₹12.4L)    │
│ ↳ 98.4% value retention across closed loop. Zero physical goods movement.               │
│ ↳ Flags ₹3,76,200 bogus ITC claims under CGST Act Section 132(1)(b).                   │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 3. VENDOR DOCUMENT OCR & DISCREPANCY AUDIT                                            │
│ Gujarat Freight Tools (GST-3525-26): Scanned Invoice Image Attached                   │
│ ↳ High-res scanned document embedded with 99.4% OCR extraction confidence.             │
│ ↳ Auditor verifies optical data against GSTR-2B return before clearing refund.         │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🏗️ System Architecture

```
                    ┌──────────────────────────────┐
                    │      React 18 + Vite SPA     │
                    │   TailwindCSS + Lucide Icons │
                    └──────────────┬───────────────┘
                                   │ HTTP / JSON
                                   ▼
                    ┌──────────────────────────────┐
                    │      Express.js REST API     │
                    │    Mounted as Vercel Func    │
                    └──────────────┬───────────────┘
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         ▼                         ▼                         ▼
┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│   OCR Pipeline   │      │ Anomaly & Rules  │      │ Topology Engine  │
│  (Tesseract.js)  │      │ (IQR & Baseline) │      │ (Directed Graph) │
└──────────────────┘      └──────────────────┘      └──────────────────┘
```

### 📡 API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/invoices` | Retrieve paginated invoices with risk scores, filters, and document metadata |
| `GET` | `/api/invoices/:id` | Retrieve single invoice details including scanned document attachment & OCR data |
| `POST` | `/api/invoices` | Ingest new vendor invoice (via OCR scan or manual entry) into the audit store |
| `PUT` | `/api/invoices/:id/status` | Update invoice audit status (`Verified Genuine`, `Flagged for Audit`, `Needs Correction`) |
| `GET` | `/api/vendors` | Retrieve vendor registry with compliance scores, risk levels, and filing histories |
| `GET` | `/api/network` | Graph data (nodes and directed edges) powering the Circular Ring visualizer |
| `GET` | `/api/stats` | Aggregated metrics (total volume, flagged ITC, anomaly breakdown, audit counts) |
| `POST` | `/api/triage` | Trigger autonomous AI audit agent evaluation and statutory action dossier |

---

## 💻 Getting Started Locally

### Prerequisites
* **Node.js** (v18.0.0 or higher)
* **npm** (v9.0.0 or higher)

### Installation & Launch

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Yesh-git5/finomaly.git
   cd finomaly
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development servers:**
   ```bash
   npm run dev
   ```
   *Frontend starts at:* `http://localhost:5173`  
   *Backend API starts at:* `http://localhost:5001`

4. **Production Build:**
   ```bash
   npm run build
   ```

---

## ☁️ Deployment on Vercel

Finomaly is configured for zero-configuration, seamless deployment on Vercel:

1. Push your repository to GitHub.
2. Import the project into your [Vercel Dashboard](https://vercel.com).
3. The build command `npm run build` outputs to `dist`, and serverless functions in `api/index.js` handle all `/api/*` traffic automatically according to `vercel.json`.

---

## 👥 Team INNOQUAD

| Name | Role / Focus |
| :--- | :--- |
| **Yeshwanth Gowda** | Full-Stack Architecture, Anomaly Engines, Network Graph |
| **Varshini Shekar** | GST Statutory Rules, Regulatory Logic & Risk Metrics |
| **Keerthana Suresh** | Optical OCR Pipeline, UI/UX Design & Auditor Workflows |
| **Ashmitha Shekar** | Dataset Engineering, Reconciliation Models & Verification |

* **Track:** Fintech - 4: GST Filing Anomaly Detector
* **Institution:** AMC Engineering College, Bengaluru

---

<div align="center">

**[⚡ Open Live App on Vercel](https://finomaly-dashboard.vercel.app)** • **[⭐ Star on GitHub](https://github.com/Yesh-git5/finomaly)**

*Finomaly — Built with precision for fair, transparent, and intelligent tax administration.*

</div>
