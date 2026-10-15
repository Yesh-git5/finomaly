import { useEffect, useState } from "react";

function Invoices() {
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    fetch("/api/invoices")
      .then((res) => res.json())
      .then((data) => setInvoices(data));
  }, []);

  return (
    <div>
      {invoices.map((inv) => (
        <div key={inv.id}>
          <h3>
            {inv.invoice_number} - {inv.vendor}
          </h3>
          <p>Amount: ₹{inv.amount}</p>
          <p>
            Risk: {inv.risk_level} ({inv.risk_score})
          </p>
        </div>
      ))}
    </div>
  );
}
export default Invoices;
