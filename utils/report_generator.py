import pandas as pd
import io
from datetime import datetime

class AuditReportGenerator:
    """
    Generates formal GST Tax Investigation Dossiers and Audit Summary Reports.
    """
    @staticmethod
    def generate_audit_csv(scored_invoices_df):
        """
        Generate exportable CSV report prioritizing flagged cases for tax auditors.
        """
        export_cols = [
            'invoice_number', 'invoice_date', 'supplier_name', 'supplier_gstin',
            'buyer_name', 'buyer_gstin', 'total_amount', 'risk_score', 'risk_tier',
            'is_circular_ring', 'primary_anomaly_reason', 'status'
        ]
        available_cols = [c for c in export_cols if c in scored_invoices_df.columns]
        sorted_df = scored_invoices_df.sort_values(by='risk_score', ascending=False)
        return sorted_df[available_cols].to_csv(index=False).encode('utf-8')

    @staticmethod
    def generate_dossier_text(scored_invoices_df, circular_rings, total_itc_at_risk):
        """
        Generate plain-text formal audit brief for CA & GST Inspection Officers.
        """
        now_str = datetime.now().strftime("%d-%b-%Y %H:%M IST")
        total_invoices = len(scored_invoices_df)
        critical_cases = len(scored_invoices_df[scored_invoices_df['risk_score'] >= 70])
        ring_cases = len(scored_invoices_df[scored_invoices_df['is_circular_ring'] == True])
        
        report = []
        report.append("=" * 80)
        report.append("FINOMALY / GSTGUARD — TAX AUDIT & ANOMALY INVESTIGATION DOSSIER")
        report.append("Generated for: Directorate General of GST Intelligence (DGGI) / CA Audit Cell")
        report.append(f"Timestamp: {now_str} | Inspection Status: ACTION REQUIRED")
        report.append("=" * 80)
        report.append("")
        report.append("1. EXECUTIVE SUMMARY & ITC EXPOSURE")
        report.append(f"   • Total Invoices Inspected: {total_invoices}")
        report.append(f"   • Critical & High Risk Cases Flagged: {critical_cases}")
        report.append(f"   • Circular Invoicing (Carousel Fraud) Rings Detected: {len(circular_rings)}")
        report.append(f"   • Invoices Implicated in Carousel Rings: {ring_cases}")
        report.append(f"   • Total Estimated ITC at Risk: ₹{total_itc_at_risk:,.2f}")
        report.append("")
        report.append("2. CIRCULAR TRADING (CAROUSEL FRAUD) CHAINS DETECTED")
        if not circular_rings:
            report.append("   No closed circular trading rings detected in current dataset.")
        else:
            for idx, ring in enumerate(circular_rings, 1):
                report.append(f"   [RING #{idx}] Length: {ring['cycle_length']} Nodes | Retention: {ring['retention_ratio']}%")
                report.append(f"   Path: {' -> '.join(ring['name_path'])}")
                report.append(f"   Total Value Circulated: ₹{ring['total_circulated_amt']:,.2f}")
                report.append("   Recommendation: Immediate provisional freeze of ITC under Section 86A.")
                report.append("")
                
        report.append("3. TOP 5 PRIORITY AUDIT CASES")
        top_cases = scored_invoices_df.sort_values(by='risk_score', ascending=False).head(5)
        for _, row in top_cases.iterrows():
            report.append(f"   • Invoice {row.get('invoice_number')} | ₹{float(row.get('total_amount',0)):,.2f} | Score: {row.get('risk_score',0):.1f}/100 [{row.get('risk_tier')}]")
            report.append(f"     Supplier: {row.get('supplier_name')} ({row.get('supplier_gstin')})")
            report.append(f"     Buyer:    {row.get('buyer_name')} ({row.get('buyer_gstin')})")
            report.append(f"     Signal:   {row.get('primary_anomaly_reason')}")
            report.append("")
            
        report.append("=" * 80)
        report.append("End of Investigation Brief — Finomaly AI Compliance Engine")
        report.append("=" * 80)
        return "\n".join(report)
