# Finomaly

Finomaly is a GST invoice risk and review prototype for Indian MSMEs and accounting teams. It combines GST rule checks, vendor-history comparisons, anomaly scores, and a human review workflow.

> An anomaly is not proof of fraud. Finomaly supports review; a human makes the final decision.

All seeded invoices and vendor activity are synthetic demo data. This prototype does not connect to GST government portals and its risk scores must not be treated as legal, tax, or fraud determinations.

## Architecture

```text
React + Vite dashboard
        │ typed hooks generated from OpenAPI
        ▼
Shared Express API server
        │ Drizzle ORM
        ▼
PostgreSQL development database
```

The development API seeds the database on first use when it contains no Finomaly invoices. The API contract is maintained in `lib/api-spec/openapi.yaml`; regenerate hooks and validators after contract changes.
