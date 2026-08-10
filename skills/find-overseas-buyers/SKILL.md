---
name: find-overseas-buyers
description: Find and verify overseas B2B importers using a required target country and HS code, with optional product specifications. Use when the user asks to discover customs-backed importers, procurement prospects, distributors, or brands in a foreign market and needs public contact details plus evidence of likely purchasing demand.
---

# Find Overseas Buyers

Find potential B2B importers using current customs and public web evidence. Require:

- `country`: target country or market
- `hs_code`: 6-10 digit HS code; separators are accepted and normalized

Accept optional `product_description` for material, composition, dimensions, applications, and selling points. Also accept `count` (default 10), excluded buyer types, and preferred contact channels. If `country` and `hs_code` are present, proceed without asking questions.

## Workflow

1. Normalize the code, verify its description in the target country's tariff schedule, and record whether the available trade source exposes 6, 8, or 10 digits. Never claim an exact national tariff line from a six-digit-only record.
2. Use the verified HS description as the primary product definition. Use `product_description` only to narrow material, composition, dimensions, application, or commercial fit; do not let free text override the official classification.
3. Search current customs/trade records for target-country consignees under the HS code. Capture shipment date, supplier, origin country, product description, quantity/value, and source when publicly available.
4. Exclude factories with captive/related overseas plants, companies exporting the same HS category, and entities acting as both buyer and supplier when the user requests independent purchasers. Treat matching parent/subsidiary names as related until disproved.
5. Verify remaining companies through official sites and registries. Distinguish import evidence from product fit, and do not assume that an adjacent company is a buyer.
6. Collect only public business contact data: company email, switchboard, contact form, WhatsApp business number, address, and named procurement contact when explicitly published. Never infer or invent an email address or employee.
7. Score each lead using [evidence-scoring.md](references/evidence-scoring.md). Remove duplicates, irrelevant companies, and excluded buyer types.
8. Return the requested number when enough qualified results exist. If not, return fewer strong leads and state the coverage limit instead of padding the list.

## Output contract

Lead with a short market summary, then provide a table with:

| Company | Buyer type | Customs evidence | Product fit | Demand status | Public contact | Website/source | Score |
|---|---|---|---|---|---|---|---|

Use `Confirmed`, `Probable`, or `Unverified` for demand status. Cite the exact page supporting every material claim. Separate evidence of product fit from evidence of an active purchase requirement.

After the table, include:

- best 3 leads and why they rank highest;
- missing or uncertain information;
- recommended next action for verification.

## Guardrails

- Browse the internet because buyer and contact information changes.
- Prefer primary sources and state when a conclusion is an inference.
- Treat paywalled trade-data snippets as secondary evidence and cite their visible fields exactly.
- An HS match alone does not prove the requested composition. Mark material as unknown unless the shipment description or another reliable source states it.
- Do not claim confirmed demand without a current procurement notice, buyer request, explicit sourcing statement, import evidence, or direct company confirmation.
- Do not expose private personal information or scrape gated personal profiles.
- Do not send email, submit a form, or message WhatsApp as part of this skill. If outreach is later requested, prepare a separate outreach step and follow confirmation requirements before sending.
