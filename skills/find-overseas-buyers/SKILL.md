---
name: find-overseas-buyers
description: Find and verify overseas B2B buyers from a required target country and product description. Use when the user asks to discover importers, manufacturers, distributors, brands, procurement prospects, or potential buyers in a foreign market and needs public contact details plus evidence of likely purchasing demand.
---

# Find Overseas Buyers

Find potential B2B buyers using current public web evidence. Require only:

- `country`: target country or market
- `product`: product name, specifications, applications, and selling points

Accept optional `count` (default 10), excluded buyer types, and preferred contact channels. If the two required inputs are present, proceed without asking questions.

## Workflow

1. Translate the product, applications, and buyer-category terms into the target market's primary business language plus English.
2. Identify plausible buyer categories before searching: downstream manufacturers, importers, distributors, private-label producers, brands, and industrial users. Do not assume that a company is a buyer merely because its industry is adjacent.
3. Search the live web using focused queries. Prioritize official company sites, product catalogs, trade-show exhibitor pages, public procurement notices, import records, industry associations, and reputable business directories.
4. Open and verify the strongest candidates. Capture direct evidence that the company makes, imports, distributes, or sells a product that consumes or matches the user's product.
5. Collect only public business contact data: company email, switchboard, contact form, WhatsApp business number, address, and named procurement contact when explicitly published. Never infer or invent an email address or employee.
6. Score each lead using [evidence-scoring.md](references/evidence-scoring.md). Remove duplicates, obvious retailers when B2B procurement is unlikely, irrelevant companies, and any excluded categories.
7. Return the requested number when enough qualified results exist. If not, return fewer strong leads and state the coverage limit instead of padding the list.

## Output contract

Lead with a short market summary, then provide a table with:

| Company | Buyer type | Product-fit evidence | Demand status | Public contact | Website/source | Score |
|---|---|---|---|---|---|---|

Use `Confirmed`, `Probable`, or `Unverified` for demand status. Cite the exact page supporting every material claim. Separate evidence of product fit from evidence of an active purchase requirement.

After the table, include:

- best 3 leads and why they rank highest;
- missing or uncertain information;
- recommended next action for verification.

## Guardrails

- Browse the internet because buyer and contact information changes.
- Prefer primary sources and state when a conclusion is an inference.
- Do not claim confirmed demand without a current procurement notice, buyer request, explicit sourcing statement, import evidence, or direct company confirmation.
- Do not expose private personal information or scrape gated personal profiles.
- Do not send email, submit a form, or message WhatsApp as part of this skill. If outreach is later requested, prepare a separate outreach step and follow confirmation requirements before sending.
