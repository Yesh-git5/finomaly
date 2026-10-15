const invoices = [
  {
    id: 1,
    invoice_number: "INV-1001",
    vendor: "Sri Lakshmi Traders",
    gstin: "33ABCDE1234F1Z5",
    amount: 8200,
    risk_score: 12,
    risk_level: "Low",
    reasons: [],
  },
  {
    id: 2,
    invoice_number: "INV-1002",
    vendor: "Rao Electronics",
    gstin: "36ABCDE1234F1Z5",
    amount: 480000,
    risk_score: 88,
    risk_level: "High",
    reasons: ["Amount is 8x this vendor's usual invoice", "Tax mismatch"],
  },
];

export default function handler(req, res) {
  res.status(200).json(invoices);
}
