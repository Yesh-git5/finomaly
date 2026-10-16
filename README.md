# Finomaly | GSTGuard — AI Anomaly Detection & Risk Intelligence

> **"See Beyond the Invoice. Detect Anomalies. Prioritize Risk. Support Smarter Audits."**
> 
> **Hackathon Track:** Fintech - 4: GST Filing Anomaly Detector  
> **Team:** INNOQUAD *(Yeshwanth Gowda, Varshini Shekar, Keerthana Suresh, Ashmitha Shekar)*  
> **Institution:** AMC Engineering College, Bengaluru  

---

## 📌 Problem Statement

1. **Massive Volume Bottleneck:** Spotting unusual GST transactions across massive invoice volumes is slow and manually infeasible.
2. **Contextual Relativity:** What is normal for one business may be unusual for another (e.g. ₹4.2 Lakhs is routine for a heavy steel mill, but a 52x anomaly for a small stationery shop). Fixed thresholds cause widespread false alarms and missed frauds.
3. **Circular Carousel Trading:** Isolated invoice checks miss circular invoice chains (Company A ➔ Company B ➔ Company C ➔ Company A) passing fake Input Tax Credit (ITC) with zero physical goods transfer.
4. **Lack of Auditor Prioritization:** Auditors cannot easily prioritize what to inspect without transparent evidence.

---

## 💡 Solution Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        1. DUAL-PROFILE INTAKE                          │
│  • Vendor Portal: Isolated intake (Scanned JPG/PNG/PDF OCR & Manual)   │
│  • Real-time Document Transmission directly to DGGI Auditor Queue      │
│  • Automatic Field Extraction & Optical Confidence Scoring             │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌───────────────────────────────────┴────────────────────────────────────┐
│                    2. MULTI-LAYER FRAUD ENGINES                        │
│  • Contextual Baseline Profiling: Compares against historical median   │
│  • Deterministic GST Rulebook: Tariff rates, GSTIN state math, e-Way   │
│  • Machine Learning Anomaly Detection: Micro vs. Enterprise Outliers   │
│  • Filing Reconciliation: GSTR-1 vs GSTR-3B vs GSTR-2B ITC Matching    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌───────────────────────────────────┴────────────────────────────────────┐
│                   3. TOPOLOGY & CIRCULAR FRAUD RING                    │
│  • Directed Supplier ➔ Buyer Graph Engine (`NetworkX DiGraph`)         │
│  • Cycle Detection (`simple_cycles`) revealing Carousel Rings          │
│  • Value Retention Scoring (~98% round-tripping flag)                  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌───────────────────────────────────┴────────────────────────────────────┐
│                 4. SENIOR AUDITOR FORENSIC WORKSPACE                   │
│  • Explainable 0–100 Risk Score for Prioritized Inspection             │
│  • Vendor Scanned Document Attachment Viewer & Optical Cross-Check     │
│  • Full-Screen Lightbox Document Inspector                             │
│  • Autonomous AI Forensic Agent & Statutory Dossier Export             │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Technology Stack

- **Frontend:** React 18, Vite, TailwindCSS, Lucide Icons, TanStack Query, Wouter
- **Backend & Full-Stack Server:** Node.js, Express.js
- **OCR Engine:** Tesseract.js (Offline / real-time optical text & field extraction)
- **Data & Intelligence:** JSON, CSV Datasets (`data/invoices.csv`, `data/vendors.csv`)
- **Algorithms:** NetworkX Graph Topology, Contextual IQR / Median Profiling, Isolation Forest
- **Build & Package Tooling:** Vite, npm, PostCSS, Autoprefixer

---

## 🚀 How to Run Locally

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Launch Full Application (Frontend + Backend concurrently):**
   ```bash
   npm run dev
   ```

3. **Open in Browser:**
   - **Frontend Dashboard:** [http://localhost:5173](http://localhost:5173)
   - **Backend API Server:** [http://localhost:5001](http://localhost:5001)

---

## 🔑 Key Features Showcase

| Feature | Description |
| :--- | :--- |
| **🛡️ Auditor Profile** | Senior DGGI Auditor workspace with full investigative authority, circular ring analysis, and review queue. |
| **🏢 Vendor Document Portal** | Strict isolated intake interface with only two allowed options: *Upload Scanned GST Invoice or Document* (live OCR) and *Manual Form Entry*. |
| **📎 Attached Document Viewer** | Auditors inspect high-resolution scanned vendor invoices directly in the audit view with an interactive full-screen lightbox modal. |
| **🔬 Optical Cross-Verification** | Automatic side-by-side verification table comparing OCR-extracted text against statutory GSTR-2B records. |
| **🕸️ Circular Fraud Ring Detector** | Exposes 3-node carousel invoice loops (Apex ➔ Rao ➔ Kuber ➔ Apex) passing bogus ITC. |
| **📊 Context-Aware Profiler** | Demonstrates why ₹4.2L is an extreme 52x anomaly for a micro vendor, but ₹4.5L is normal for a steel producer. |
| **🤖 AI Forensic Agent** | Autonomous multi-invoice statutory triage citing CGST Section 132 and Rule 86A. |
| **📄 Audit Dossier Export** | Exports formal statutory investigation JSON/CSV dossiers for regulatory proceedings. |

---
*Finomaly — Decision support system for smarter, risk-based GST tax audits.*

