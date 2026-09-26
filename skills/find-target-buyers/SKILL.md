---
name: find-target-buyers
description: Find and verify overseas sales channels in a target city from a product description, optional HS code, and preferred customer profile. Use for retail chains, local stores, import distributors, online stores, designers, contractors, project firms, and other specified buyer types with public contacts and evidence.
---

# Find Target Buyers

Require `country`, `city`, `product_description`, `target_customer_prompt`, and a `targets` object containing requested counts for any of: `large_chain`, `small_store`, `import_distributor`, `online_store`, `custom_target`. `hs_code` is optional: use it as supporting classification and customs evidence when supplied, but do not require or invent it. Accept `product_description_en` when provided and preserve it for outreach copy. Proceed without clarification when the required fields are valid.

Treat `city` as the primary geographic scope. Include businesses located in or demonstrably serving that city. Do not silently expand to the whole country merely to fill counts; mark nearby or country-wide candidates as overflow with their actual location.

`target_customer_prompt` is a business preference, not just a search keyword. Translate it into suitable local-language role, service, project, and industry terms, then use those signals to rank candidates. For example, a request favoring whole-home designers or renovation companies should search interior design studios, fit-out contractors, turnkey renovation firms, hospitality design practices, project portfolios, local directories, awards, and trade-fair listings—not only companies that already list the exact product.

## Coverage-first discovery

Do not search only until the requested count is reached. Build a broad candidate pool first, normally `candidate_pool_multiplier` times the requested count (default 4, minimum 2), then qualify and rank it. When `continue_until_exhausted` is true, keep searching distinct channels until two consecutive channels produce no new qualified root domains or the accessible public sources are exhausted.

For every requested category, combine several applicable channels instead of relying on ordinary web search alone:

- target-language and English product/category searches;
- official store locators, shopping-centre tenant lists, marketplace/category pages, and brand stockist lists;
- company registries and industry/member directories;
- trade-fair exhibitor/buyer lists and trade-association directories;
- product aggregators, competitor stockists, catalogues, public PDFs, and procurement/job postings;
- current customs/import data when accessible and attributable to the company.

Record the channels actually used in `discovery_channels`. A brand and its local legal entity count as one buyer when they resolve to the same commercial operation. Keep qualified candidates beyond the requested count in `overflow_candidates`; do not discard them, because later batches must continue without repeating earlier companies.

## Independent channel searches

Search and report each requested category separately. Do not fill one category with a company belonging to another.

- `large_chain`: multi-store retailers and major supermarkets. Seek Buyer, Category Manager, Procurement Manager, or Product Manager.
- `small_store`: independent retailers with roughly one or two locations. Seek Owner, Founder, Director, or General Manager; a public store email or WhatsApp Business is acceptable when no named owner is published.
- `import_distributor`: importers, wholesalers, and regional distributors. Seek Buyer, Import Manager, Procurement Manager, or Product Manager. Prioritize current customs/import evidence when accessible.
- `online_store`: independent ecommerce sites, brands, and marketplace sellers. Seek Owner, Founder, E-commerce Manager, or Product Manager.
- `custom_target`: businesses matching `target_customer_prompt`, such as interior designers, whole-home design studios, renovation companies, fit-out contractors, architects, hospitality project firms, property furnishing companies, or other user-specified channels. Seek Owner, Founder, Managing Director, Design Director, Project Director, Specification Manager, or the most relevant public decision maker.

For `custom_target`, product need may be project-driven rather than visible as a stocked SKU. Accept portfolio, service, specification, completed-project, material-library, supplier-partnership, or tender evidence as demand evidence. Clearly distinguish this probable project need from confirmed purchasing or import activity.

Use English and target-market-language search terms. Verify company type, product fit, and contact evidence from current public sources. Return fewer results rather than padding a category.

## China-sourcing and buyer-role signals

Use only public business evidence. Never inspect, infer, or claim access to private email traffic. Assess the likelihood that a company sources from China using the following evidence, with a capped `china_sourcing_score` from 0 to 100:

- 40: attributable customs/shipment evidence showing imports from China for the relevant or closely related HS/product;
- 25: a public employee profile or job posting explicitly mentioning China/Asia sourcing, procurement, buying, or supplier management;
- 20: official annual report, supplier policy, press release, catalogue, or company page naming China/Asia sourcing or a China office;
- 15: Chinese trade-fair participation, a Chinese supplier case study, or an attributable public supplier/customer relationship;
- 10: multiple product-origin indications showing Made in China on the buyer's own assortment (supporting signal only).

Do not award points twice for the same underlying fact. Label 60–100 `strong`, 30–59 `moderate`, 1–29 `weak`, and 0 `not_found`. Every awarded signal needs a URL and a short explanation in `china_sourcing_evidence`. This score ranks follow-up priority; it does not prove that a named person is the buyer.

After company qualification, make a separate decision-maker pass. Prioritize public Buyer, Category Manager, Procurement/Sourcing Manager, Product Manager, Import Manager, Owner, or Founder evidence appropriate to the category. A generic mailbox remains useful but must not be presented as a named buyer.

## WhatsApp-first outreach preparation

When contact enrichment is enabled, prioritize a publicly verified business WhatsApp number over an unverified phone number. Never label an ordinary telephone number as WhatsApp unless the company publishes it as WhatsApp or the source link is an official WhatsApp action.

When `qualification_gate.require_verified_public_whatsapp` is true, this becomes a hard acceptance rule: count a lead only when its WhatsApp number is verified from an official company page or official WhatsApp action. Businesses with only email, telephone, a form, or a social profile must not be placed in the requested category or counted as qualified. Return fewer than requested and state the shortfall instead of padding the result.

For every lead with a verified WhatsApp number, write `whatsapp_greeting_en`: a short, natural English first message ready for a salesperson to review and send. It must:

- identify the supplier by company name; mention its location only when the user explicitly provides a current, relevant supplier location;
- mention one company-specific reason for contacting that buyer, grounded in `product_fit_evidence` or `demand_evidence`;
- describe the supplied product using `product_description_en` when provided, otherwise a concise English rendering of the submitted product;
- ask permission to send a relevant catalogue, sample selection, or pricing rather than attaching or pushing a full offer immediately;
- avoid unsupported claims, generic flattery, urgency, discounts, and bulk-message wording;
- ask for referral to the correct buyer when no decision maker is known;
- normally remain under 550 characters.

Also return `whatsapp_greeting_basis`, briefly naming the evidence used to personalize the message. Leave both fields empty when no verified WhatsApp exists. The skill prepares copy only; it does not send messages or open WhatsApp.

## Contacts and evidence

Collect only public business data. Never infer an employee or construct an email from a name and domain. A named contact requires a source proving the person, role, and company. Distinguish confirmed import demand from probable product fit.

Deduplicate using website root domain first, then normalized legal name, public WhatsApp, public email, phone, and address. Respect `exclude_existing` and `excluded_types`. Treat every supplied domain, company name, email, and WhatsApp value as a historical exclusion token. An existing company may be updated with a newly verified contact, but it must never count as a new qualified company. When the task provides an HS code, historical exclusions apply across the same country and HS code even when the new task names a different or broader city.

## Output for business users

Always present the result in Chinese unless the user requests another language:

1. Start with a short summary: candidates reviewed, requested, qualified, overflow candidates, named contacts, public emails, strong/moderate China-sourcing signals, channels used, and important coverage limits.
2. Show a separate Markdown table for every requested non-empty category, including `custom_target`. Each table uses: company, why it fits, decision maker, public contact, demand confidence, and source. Translate status codes into plain Chinese.
3. Highlight the best next contact in each non-empty category, prioritizing product fit, verified role/contact, and China-sourcing evidence. Do not expose raw JSON in the conversation unless file writing is unavailable.

Also produce the machine-readable object defined in [output-schema.md](references/output-schema.md). When `return_path` is provided, write valid JSON to that exact workspace-relative path, creating parent folders when needed. Overwrite only that designated result file. When no `return_path` is provided, save to `public/data/latest-buyers.json` if the current project is the 贝贝家外贸复制系统; otherwise attach or return a JSON artifact alongside the readable report.

After saving, tell the user: “结果已回传到系统，请在页面点击‘读取最新结果’。” Include all five category keys even when a category is empty.

This skill discovers and verifies leads only. It does not send email, submit forms, or message contacts.
