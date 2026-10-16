# Finomaly -- AI-Powered GST Filing Anomaly Detection

> **Find the unusual. Understand the risk. Make GST audits smarter.**

Finomaly is a prototype concept for an AI-powered GST filing anomaly
detection and risk-review platform. It is designed to help auditors examine
invoice records, identify unusual patterns, prioritize cases for review,
and understand why a record was flagged.

The goal is to support auditors and accounting teams, not to
automatically declare a business fraudulent.

------------------------------------------------------------------------

## Table of Contents

-   [The Problem](#the-problem)
-   [Our Solution](#our-solution)
-   [Project Goals](#project-goals)
-   [Core Features](#core-features)
-   [Five Standout Features](#five-standout-features)
-   [How GSTGuard Works](#how-gstguard-works)
-   [Dashboard Modules](#dashboard-modules)
-   [Minimum Viable Product (MVP)](#minimum-viable-product-mvp)
-   [Suggested Technology Stack](#suggested-technology-stack)
-   [Risk Scoring and Explainability](#risk-scoring-and-explainability)
-   [Data and Evaluation](#data-and-evaluation)
-   [Limitations and Responsible Use](#limitations-and-responsible-use)
-   [Future Scope and Scaling](#future-scope-and-scaling)
-   [Disclaimer](#disclaimer)

------------------------------------------------------------------------

## The Problem

Businesses create and process large numbers of invoices while managing
GST compliance. Manually checking every invoice can take time and
effort. Duplicate invoice numbers, tax mismatches, unusual Input Tax
Credit (ITC) claims, and sudden changes in business activity may require
closer examination.

Checking invoices one by one may also fail to reveal patterns that
appear across multiple suppliers and buyers.

A better workflow can help users identify unusual records, understand
why they were flagged, and prioritize which cases need further review.

## Our Solution

**Finomaly** is an AI-powered GST Filing Anomaly Detection and Risk
Intelligence System.

It combines invoice checks, anomaly detection, vendor context, risk
prioritization, and a structured review workflow. The system is intended
to help users answer three questions:

1.  **What looks unusual?**
2.  **Why was it flagged?**
3.  **What should be checked next?**

Finomaly is a decision-support tool. An anomaly is a signal for further
verification, not proof of fraud.

## Project Goals

-   Reduce the effort required to screen large volumes of invoice data.
-   Identify possible invoice duplication and tax-value mismatches.
-   Highlight unusual filing patterns that may need investigation.
-   Make risk signals easier to understand through explanations and
    evidence.
-   Help reviewers prioritize cases through a traceable review queue.
-   Provide a prototype that can later be evaluated using authorized,
    verified data.

------------------------------------------------------------------------

## Core Features

### 1. Manual Invoice Entry and Document Upload

Users can enter invoice details manually, including fields such as:

-   Invoice number and date
-   Vendor name and GSTIN
-   Taxable value
-   GST rate and tax amount

Where supported by the implementation, users can also upload an invoice
document for field extraction and confirmation.

### 2. Invoice Analysis

The system checks available invoice details against configured
validation rules and available vendor history. It can be designed to
flag issues such as:

-   Duplicate invoice numbers
-   Inconsistent taxable values or tax amounts
-   Missing or invalid required fields
-   Unusual invoice values or patterns
-   Differences between matched purchase and supplier records, where
    both are available

### 3. Overview Dashboard

The dashboard summarizes the current dataset, with indicators such as:

-   Number of invoices analyzed
-   Number of invoices flagged for review
-   Potential tax exposure associated with flagged invoices
-   Average or aggregate risk signals
-   Number of vendors monitored
-   Number of open reviews
-   Risk distribution and invoice activity over time

Dashboard figures should be interpreted in the context of the dataset
being analyzed.

### 4. Invoice Search and Filtering

Users can search by invoice, vendor, or GSTIN and filter records by
signal level or review status. The invoice list provides a starting
point for opening a record and inspecting its supporting information.

### 5. Review Queue

The review queue organizes cases that need human attention and records
their operational status.

  -----------------------------------------------------------------------
  Status                              Meaning
  ----------------------------------- -----------------------------------
  **Pending**                         The invoice is waiting for review.

  **Needs Correction**                A possible error needs to be
                                      corrected or clarified.

  **Escalated**                       The case needs further attention
                                      from a senior reviewer or the
                                      appropriate team.

  **Verified Genuine**                A reviewer has examined the
                                      available evidence and marked the
                                      invoice as genuine.
  -----------------------------------------------------------------------

These statuses describe the review workflow. They are not automatic
factual findings of fraud.

### 6. Vendor Profiles

Vendor profiles help users understand a supplier's billing history.
Depending on the available data, a profile can summarize invoice count,
average and median bill values, signal levels, and the number of flagged
invoices.

Historical context matters: a single unusual invoice should not be
interpreted without considering the wider circumstances.

### 7. ITC Reconciliation

ITC Reconciliation compares purchase records with corresponding supplier
invoice or filing records, where available. It can highlight differences
in invoice numbers, taxable values, or tax amounts that may affect an
Input Tax Credit claim.

This module requires suitable source records. A mismatch should be
treated as a reason to verify the records, not as automatic proof of an
incorrect claim.

### 8. Scenario Lab

The Scenario Lab is intended to let users explore hypothetical
situations, such as changing a risk threshold or increasing the number
of mismatched records, and observe how the review results may change.

The exact scenarios and outputs should match what the implemented
prototype actually supports. If a setting only changes a threshold, it
should not be described as retraining the model or generating a new
prediction unless that functionality exists.

### 9. Model Insights

Model Insights is intended to help users understand the model's
behaviour, the kinds of patterns it flags, and the limitations of its
outputs. Useful information may include the features used, anomaly-score
distribution, evaluation metrics, and false-positive results where
measured.

Model scores should not be presented as the probability that a business
committed fraud unless a suitable, validated probabilistic model
supports that interpretation.

------------------------------------------------------------------------

## Five Standout Features

These are proposed differentiators. Clearly distinguish features that
are already implemented from those still planned.

### 1. GST Business Relationship Graph

Represent suppliers and buyers as connected nodes, with invoice
transactions shown as directed edges. Graph analysis can help identify
unusual transaction chains, including possible circular patterns such
as:

`Business A → Business B → Business C → Business A`

Such a cycle is a signal to investigate, not proof of wrongdoing.

**Possible tools:** NetworkX and Plotly.

### 2. Explainable AI Risk Score

Combine signals such as duplicate invoice indicators, tax mismatches,
unusual changes in filing behaviour, and network patterns into a
review-priority score.

Show the reasons behind each score---for example, "duplicate invoice
number detected" or "reported value differs from the matched record."

The score should be calibrated and tested. It represents review
priority, not automatically the probability of fraud.

### 3. Business Behaviour Change Detection

Compare a business's current records with its own historical activity. A
sudden change in turnover, tax paid, or ITC claimed may warrant review.

For example, a sharp increase in reported sales could be flagged for
verification if it differs substantially from the business's usual
pattern. A change may still have a legitimate explanation.

### 4. Smart Invoice Matching and Duplicate Detection

Compare relevant invoice fields across available records, including
invoice number, date, GSTIN, taxable value, and tax amount. Flag
possible duplicates or mismatches for verification.

### 5. Investigation Copilot

Generate a concise, evidence-based summary for each alert, including the
reason for the alert and suggested verification steps.

For example:

> **Review suggested:** The invoice value differs from the matched
> purchase record. Check the source invoice and related records before
> deciding on the next action.

Summaries should be generated from actual system evidence and must not
invent findings.

------------------------------------------------------------------------

## How GSTGuard Works

``` text
Upload data or enter invoice details
                |
                v
Validate and preprocess the records
                |
                v
Run invoice rules and matching checks
                |
                v
Detect unusual patterns with anomaly analysis
                |
                v
Use vendor context and, where implemented, network analysis
                |
                v
Combine signals into an explainable review-priority score
                |
                v
Display alerts, evidence, and review statuses
                |
                v
Human reviewer checks the evidence and decides next steps
```

### Example

Imagine a test dataset contains invoice records with a deliberately
duplicated invoice number and a mismatch between two corresponding tax
values. GSTGuard can flag these records and show the reasons for review.

Any counts or results shown during a demonstration should come from the
actual test dataset. Demonstration examples must not be presented as
real-world fraud statistics.

------------------------------------------------------------------------

## Minimum Viable Product (MVP)

The MVP is the smallest working version that demonstrates the main idea
end to end.

### Essential MVP scope

1.  Upload a sample CSV file and/or enter invoice details manually.
2.  Validate required fields and calculate basic tax checks.
3.  Flag duplicate invoice numbers and selected tax mismatches.
4.  Use an anomaly detector, such as Isolation Forest, if included in
    the implementation.
5.  Display a risk signal with an explanation.
6.  Show flagged records in a searchable invoice table and review queue.
7.  Export the results for further review, if implemented.

### Suggested demo flow

1.  Open **Analyze Invoice** and enter a sample invoice.
2.  Run the analysis and show the resulting signals.
3.  Open **Overview** to explain the summary figures and risk
    distribution.
4.  Open **Invoices** to search and inspect a flagged record.
5.  Open **Review Queue** and explain the operational statuses.
6.  Show **ITC Reconciliation**, **Scenario Lab**, and **Model
    Insights** according to their actual implemented behaviour.

A reliable end-to-end demo is more convincing than a long list of
unfinished features.

------------------------------------------------------------------------

## Suggested Technology Stack

The following stack is suitable for a Python-based prototype. Adjust it
to match the code actually used in the repository.

  -----------------------------------------------------------------------
  Component               Suggested technology    Purpose
  ----------------------- ----------------------- -----------------------
  Dashboard               Streamlit               Interactive pages and
                                                  controls

  Data processing         Python, Pandas, NumPy   Clean, transform, and
                                                  validate invoice
                                                  records

  Anomaly detection       Scikit-learn, Isolation Identify statistically
                          Forest                  unusual patterns

  Rule-based checks       Python                  Detect configured
                                                  errors and mismatches

  Network analysis        NetworkX                Analyze supplier--buyer
                                                  relationships

  Visualization           Plotly                  Charts, risk
                                                  distribution, and
                                                  network graphs

  Data storage            CSV for an initial      Store and retrieve
                          demo; a database for    records
                          later stages            

  Document extraction     An appropriate OCR/PDF  Extract candidate
                          library, if implemented fields from documents
  -----------------------------------------------------------------------

### Possible data fields

A sample invoice dataset could contain:

-   `invoice_number`
-   `invoice_date`
-   `vendor_name`
-   `vendor_gstin`
-   `buyer_gstin`
-   `taxable_value`
-   `gst_rate`
-   `tax_amount`
-   `itc_claimed`, where relevant
-   `reported_period`, where relevant

Use synthetic or appropriately authorized data for development and
demonstrations.

------------------------------------------------------------------------

## Risk Scoring and Explainability

A risk score can combine several signals, such as:

-   Duplicate invoice indicators
-   Differences in matched invoice values
-   Unusual changes from historical business activity
-   Unusual model-detected patterns
-   Suspicious network structures, if network analysis is implemented

A simple prototype may use documented rules and weights to produce a
score from 0 to 100. Those weights should be tested and refined; they
should not be presented as statistically validated unless they have been
evaluated.

For each flagged record, aim to show:

-   The signal that triggered review
-   The relevant invoice fields or records
-   The risk score and how it should be interpreted
-   Suggested verification steps
-   The current review status

**Important:** A score of 80/100 does not automatically mean an 80%
probability of fraud. Unless validated otherwise, it is a prioritization
score.

------------------------------------------------------------------------

## Data and Evaluation

For a hackathon prototype, synthetic records can be used to test known
scenarios without exposing confidential taxpayer data.

A useful test dataset can include deliberately introduced examples of:

-   Duplicate invoice numbers
-   Taxable-value mismatches
-   Unusual ITC values
-   Sudden changes in invoice values
-   Repeated or unusual supplier--buyer relationships

Evaluate the system against known test cases. Where appropriate, report:

-   **Precision:** Of the records flagged, how many were known test
    anomalies?
-   **Recall:** Of the known test anomalies, how many did the system
    identify?
-   **False-positive rate:** How often did the system flag records that
    were not anomalies under the test labels?
-   **Processing time:** How long did analysis take for a stated dataset
    size?

Be clear that synthetic-data results do not establish real-world
fraud-detection accuracy. Real-world evaluation requires suitable
authorized records and verified outcomes.

------------------------------------------------------------------------

### 5. ITC Reconciliation, Scenario Lab and Model Insights

Finomaly also includes additional tools to make the analysis more
useful.

**ITC Reconciliation** helps compare purchase records with corresponding
supplier invoice or filing records, where available. It can highlight
differences in invoice values or tax amounts that may affect Input Tax
Credit claims.

**Scenario Lab** allows users to test different situations, such as what
happens if the number of mismatched invoices increases or the risk
threshold changes. This helps demonstrate how different settings may
affect the cases flagged for review.

**Model Insights** helps users understand how the anomaly detection
model behaves, what patterns it identifies, and how its results should
be interpreted. It supports better understanding of the model instead of
treating its output as a final decision.

### 6. Our Innovation and Future Scope

What makes Finomaly useful is that it combines invoice checking,
AI-based anomaly detection, vendor history, risk scoring, and a
structured review process in one platform.

In the future, we plan to add network analysis to identify unusual
transaction chains between connected businesses and improve the system
using verified data.

Our goal is to help auditors save time, focus on important cases, and
make better-informed decisions.

To conclude, Finomaly does not replace auditors. It helps them find
unusual patterns and understand where further investigation may be
needed.

**Finomaly --- Find the unusual. Understand the risk. Make GST audits
smarter.**

------------------------------------------------------------------------

## Limitations and Responsible Use

-   An anomaly is not proof of fraud or intentional wrongdoing.
-   Synthetic data is useful for demonstration but cannot establish
    real-world accuracy.
-   ITC reconciliation depends on the availability and quality of
    matching records.
-   Model results may contain false positives and false negatives.
-   Risk scores should be explainable and evaluated before operational
    use.
-   Real deployments require suitable authorization, access controls,
    data protection, and compliance with applicable laws.
-   Human reviewers should make decisions after checking the supporting
    evidence.

## Future Scope and Scaling

### Phase 1 --- Hackathon MVP

Demonstrate manual invoice entry or CSV upload, basic validation,
anomaly flags, explanations, a dashboard, and a review queue.

### Phase 2 --- Realistic Pilot

Evaluate against realistic, authorized records and verified outcomes.
Work with accounting or tax professionals to refine the rules and
scoring approach.

### Phase 3 --- Secure Platform

Add a database, backend API, authentication, role-based permissions,
audit logs, monitoring, and suitable deployment infrastructure.

### Phase 4 --- Advanced Intelligence

Explore business transaction-network analysis, temporal patterns, a
carefully grounded investigation assistant, and feedback from verified
reviews.

Potential users include authorized tax-audit teams, accounting firms,
and businesses checking their own records. The suitability of the
platform for each use case would need to be validated.

## Disclaimer

Finomaly is a decision-support prototype concept. It is not an official
GST system and does not replace professional tax advice, statutory
verification, or an auditor's judgment. Do not use sample dashboard
values as evidence of real-world fraud or detection accuracy.

------------------------------------------------------------------------

**Finomaly --- Find the unusual. Understand the risk. Make GST audits
smarter.**
