import { useEffect, useState } from "react";

function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/invoices")
      .then((res) => res.json())
      .then((data) => {
        setInvoices(Array.isArray(data) ? data : (data.items || []));
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch invoices:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="p-4 text-slate-400">Loading invoices...</div>;
  }

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Invoices Demo (5 Connected Invoices)</h2>
      <div className="grid gap-3">
        {invoices.map((inv) => (
          <div key={inv.id} className="p-4 rounded-lg border border-slate-700 bg-slate-800 text-slate-100">
            <h3 className="font-semibold text-lg">
              {inv.invoice_number || inv.invoiceNumber} - {inv.vendor || inv.vendorName}
            </h3>
            <p className="text-slate-300">GSTIN: {inv.gstin || inv.vendorGstin}</p>
            <p className="text-slate-200">Amount: ₹{(inv.amount || inv.totalAmount)?.toLocaleString('en-IN')}</p>
            <p className="font-medium">
              Risk: <span className={(inv.risk_level || inv.riskLevel) === 'High' ? 'text-red-400' : (inv.risk_level || inv.riskLevel) === 'Medium' ? 'text-amber-400' : 'text-emerald-400'}>
                {inv.risk_level || inv.riskLevel} ({inv.risk_score ?? inv.riskScore})
              </span>
            </p>
            {inv.reasons && inv.reasons.length > 0 && (
              <div className="mt-2 text-xs text-slate-400">
                Reasons: {inv.reasons.map((r, i) => <div key={i}>• {typeof r === 'string' ? r : r.message}</div>)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Invoices;
