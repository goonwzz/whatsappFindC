# Output schema

Return one JSON object with `summary`, `categories`, `overflow_candidates`, and `duplicates`. `categories` and `overflow_candidates` must always contain `large_chain`, `small_store`, `import_distributor`, `online_store`, and `custom_target` arrays.

The root object also includes `generated_at` as an ISO timestamp and `task` with `country`, `city`, `product_description`, `target_customer_prompt`, optional `hs_code`, and optional `product_description_en`. Use an empty string for an omitted HS code. The HTML page uses these fields to identify the latest result, preserve city-level deduplication, and build outreach copy.

`summary` contains `candidates_reviewed`, `requested`, `qualified`, `overflow_count`, `with_named_contact`, `with_public_email`, `china_sourcing_strong`, `china_sourcing_moderate`, `discovery_channels_used`, and `coverage_note`.

When a hard qualification gate is supplied, preserve it under `task.search_policy`. `qualified` counts only leads that pass the gate. State any shortfall from `requested` in `coverage_note`; never pad the category with leads that fail the gate.

Each lead contains these fields: `company`, `customer_type`, `country`, `website`, `product_fit_score`, `demand_status`, `contact_person`, `contact_title`, `person_email`, `company_email`, `phone`, `whatsapp`, `whatsapp_greeting_en`, `whatsapp_greeting_basis`, `linkedin_url`, `contact_confidence`, `product_fit_evidence`, `demand_evidence`, `contact_evidence`, `discovery_channels`, `china_sourcing_score`, `china_sourcing_status`, `china_sourcing_evidence`, `source_urls`, and `dedupe_key`.

`whatsapp_greeting_en` must be empty unless `whatsapp` is publicly verified. When present, it is a concise personalized English first-touch message based on cited company evidence. `whatsapp_greeting_basis` states which evidence drove that personalization.

Use `confirmed`, `probable`, or `unverified` for `demand_status`; use `verified`, `probable`, or `not_found` for `contact_confidence`. Use empty strings for unknown scalar values. Every material claim needs a supporting URL. Never put guessed values in empty fields.

Use `strong`, `moderate`, `weak`, or `not_found` for `china_sourcing_status`. `china_sourcing_evidence` is an array of objects with `signal`, `score`, and `url`. `discovery_channels` and `source_urls` are arrays of strings. A zero score is valid and must not be converted into a claim.

The input may include `candidate_pool_multiplier`, `continue_until_exhausted`, `discovery_channels`, and `china_sourcing_signals`. Preserve the task settings under `task.search_policy` so the page can show how the result was produced. Use `customer_type: "custom_target"` for leads returned from the user-defined channel search.
