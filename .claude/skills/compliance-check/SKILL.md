---
name: compliance-check
description: Run a COPPA 2025 and privacy compliance check before adding any feature that touches authentication, analytics, personal data, or third-party SDKs. Returns a go/no-go with required mitigations.
disable-model-invocation: true
---

You are reviewing a StockStand feature for COPPA 2025 and privacy compliance. Read `docs/DESIGN_SYSTEM.md` in full before proceeding (despite the name, this file contains the COPPA/compliance guide — see CLAUDE.md for the file-name mapping).

The feature being reviewed is: $ARGUMENTS

## Step 1 — Classify the feature

Answer these questions:

1. Does it collect or transmit any personal information? (name, email, IP address, device ID, persistent identifier, location)
2. Does it load any third-party SDK? (analytics, auth, ads, social, error tracking)
3. Does it create or modify a database record?
4. Does it involve authentication or user accounts?
5. Is it intended for or likely to be used by children under 13?

If all answers are NO → Feature is **COPPA-safe**. State that clearly and stop.

If any answer is YES → Continue to Step 2.

## Step 2 — Age gate check

Confirm the age gate is in place before this feature can activate:

- ✅ Age gate must appear on first visit (hard modal, cannot be dismissed)
- ✅ Age selection stored in localStorage immediately on selection
- ✅ Google OAuth / any auth SDK must NOT load until age ≥ 13 is confirmed
- ✅ Under-13 users must never see a Google login button
- ✅ Age gate must reappear if localStorage is cleared

If any of these are missing → **BLOCK** — list what needs to be added before proceeding.

## Step 3 — Data tier check

Verify the feature respects the three-tier data model:

**Under 13 (guest):**
- localStorage only — no DB row, ever
- Zero analytics events fired
- No third-party SDKs loaded

**Teen (13–17):**
- DB: `{ id (uuid), google_sub: sha256(sub), age_tier: "teen", game_state, created_at, last_seen }`
- NOT stored: email, name, profile photo, IP address
- Zero analytics events fired
- Auto-purge: 90 days inactive

**Adult (18+):**
- DB: full record including email, display_name
- Plausible analytics only (no Google Analytics, Mixpanel, Amplitude, Segment)
- Never store raw `google_sub` — always `sha256(google_sub)`

Flag any deviation from this model.

## Step 4 — SDK audit

For each third-party SDK the feature loads:

1. Does it collect device IDs, IP addresses, or persistent identifiers? (If yes, it's regulated for under-13 users)
2. Is it gated behind `age_tier === 'adult'` check?
3. Does the Plausible analytics script load conditionally?
   ```javascript
   if (localStorage.getItem('age_tier') === 'adult') { /* load Plausible */ }
   ```

Flag any SDK that loads unconditionally.

## Step 5 — Stock data / disclaimer check

If the feature displays stock prices or financial data:

- ✅ "For entertainment only" disclaimer is visible on the screen
- ✅ Full disclaimer text: *"StockStand is a game for educational purposes only. Stock prices shown are approximate and may be delayed. This is not financial advice and should not be used to make investment decisions."*
- ✅ Stock API terms of service reviewed for this use case

## Step 6 — Compliance verdict

Output one of:

**✅ COMPLIANT** — list what was verified

**⚠️ COMPLIANT WITH CHANGES** — list required changes, each as a checkbox the developer must tick before shipping

**🚫 BLOCKED** — list the violations and what must be resolved; do not let this feature ship until resolved

## Reference

Full compliance guide: `docs/DESIGN_SYSTEM.md` (see CLAUDE.md file-name mapping)
FTC COPPA 2025 amendments effective April 22, 2026.
COPPA 2.0 (pending) would extend protections to under-17.
