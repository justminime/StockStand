# Compliance Guide
## StockStand — COPPA 2025, Privacy & Legal

> ⚠️ This document is an internal guide, not legal advice. Have a qualified attorney review before launch.

---

## 1. Current MVP status

**The MVP is fully COPPA-safe by design:**

- ✅ Zero personal data collected
- ✅ No user accounts
- ✅ No cookies (only localStorage — not a cookie)
- ✅ No analytics SDKs
- ✅ No third-party tracking
- ✅ No email collection
- ✅ No advertising
- ✅ localStorage data never leaves the user's device

**Result:** COPPA does not apply to the MVP because no "personal information" is collected or transmitted, from any age group.

---

## 2. COPPA 2025 — what changed

The FTC finalized major COPPA Rule amendments effective **April 22, 2026** (compliance deadline).

### Key changes relevant to StockStand:

| Change | Impact on StockStand |
|---|---|
| Expanded definition of "personal information" now includes device IDs, IP addresses, and persistent identifiers | Any analytics SDK (Google Analytics, Mixpanel) becomes COPPA-regulated data if kids use the product |
| "Mixed audience" sites must age-screen before collecting any data | When we add accounts/auth, an age gate is required before Google OAuth fires |
| Separate parental consent required before sharing children's data with third parties | No third-party SDKs may fire for under-13 users — not even analytics |
| Stronger data retention limits | Auto-purge inactive under-13-adjacent data after 90 days |
| Stricter requirements for parental notice and consent | Full parental consent flow required if we ever collect under-13 data |

**FTC enforcement fines:** Up to $51,744 per violation per day. YouTube/Google paid $170M in 2019. Epic Games paid $520M in 2022.

---

## 3. Age gate requirement (v1.1+)

When Google login is added, an age gate **must** appear before OAuth is initialized.

### Required flow:
```
User visits site
      ↓
Age gate modal (blocking — cannot dismiss)
      ↓
   ┌──────────────────────────────┐
   │ How old are you?             │
   │ [ Under 13 ] [ 13–17 ] [18+] │
   └──────────────────────────────┘
      ↓              ↓             ↓
  Guest mode    Limited auth   Full auth
  localStorage  Google OAuth   Google OAuth
  only          (hashed ID,    (email + profile
  No DB         no email)      stored in DB)
```

**Implementation rules:**
- Age selection stored in localStorage immediately
- Google OAuth script must NOT load until age ≥ 13 is confirmed
- Under-13 users must never see a Google login button
- Age gate must reappear if localStorage is cleared

### What this is NOT:
This is a "neutral age gate" — a self-declared age. It does NOT constitute verifiable parental consent (VPC). If you ever want to actively collect data from under-13 users (not just let them play), you need VPC via an approved method (credit card verification, government ID, etc.). For StockStand MVP, the answer is: we simply don't collect under-13 data, making VPC unnecessary.

---

## 4. Data stored per user tier (v1.1+)

### Under 13 (guest)
```
localStorage only:
{
  "stockstand_v1": { ...game_state }
}
DB: NOTHING stored
Analytics: NONE fired
```

### Teen (13–17)
```
DB record:
{
  id: uuid (generated),
  google_sub: sha256(google_sub_id),  ← hashed, not raw
  age_tier: "teen",
  game_state: { ...json },
  created_at: timestamp,
  last_seen: timestamp
}
NOT stored: email, name, profile picture, IP address
Analytics: NONE (suppressed for teen tier)
Auto-purge: after 90 days inactive
```

### Adult (18+)
```
DB record:
{
  id: uuid,
  google_sub: sha256(google_sub_id),
  email: "user@example.com",
  display_name: "Alex",
  age_tier: "adult",
  game_state: { ...json },
  created_at: timestamp,
  last_seen: timestamp
}
Analytics: Plausible (privacy-safe, no PII, no cookies)
```

---

## 5. Analytics (v1.1+)

**Do NOT use:** Google Analytics, Mixpanel, Amplitude, Segment, or any SDK that collects device IDs or IP addresses.

**Use instead:** [Plausible Analytics](https://plausible.io)
- No cookies
- No personal data
- No cross-site tracking
- GDPR, CCPA, and COPPA compatible
- $9/month
- Still tracks: page views, session count, referrer, browser, country (aggregated)

**Implementation rule:** Plausible script must only load for `age_tier === 'adult'`. For guest and teen sessions, fire nothing.

```javascript
// Only load analytics for adults
if (localStorage.getItem('age_tier') === 'adult') {
  const script = document.createElement('script');
  script.src = 'https://plausible.io/js/script.js';
  script.setAttribute('data-domain', 'yourdomain.com');
  document.head.appendChild(script);
}
```

---

## 6. Stock data legal considerations

### Key rules:
- StockStand is **not a financial product** — it is a game for entertainment and education
- Real stock prices are used as inspiration for game mechanics, not as investment advice
- A "for entertainment only" disclaimer must be visible on every screen

### Required disclaimer (footer text):
> StockStand is a game for educational purposes only. Stock prices shown are approximate and may be delayed. This is not financial advice and should not be used to make investment decisions.

### API terms of service:
| Provider | Commercial use | Kids apps | Notes |
|---|---|---|---|
| Alpha Vantage | Allowed on paid plans | No specific restriction | Review ToS before launch |
| Polygon.io | Allowed | No specific restriction | Review attribution requirements |
| Marketstack | Allowed | No specific restriction | Attribution required on free plan |

**Recommended:** Get written confirmation from your chosen API provider that game/educational use is permitted under your plan before public launch.

---

## 7. COPPA compliance checklist

Use this before each major release:

### Data collection
- [ ] No PII collected from under-13 users
- [ ] Age gate fires before any OAuth or data collection
- [ ] Analytics suppressed for guest and teen sessions
- [ ] No third-party SDKs load for under-13 users
- [ ] localStorage data stays on device — never transmitted

### Privacy policy
- [ ] Privacy policy published at `/privacy`
- [ ] Policy includes a COPPA section explaining children's data handling
- [ ] Policy lists all third parties (Google OAuth, analytics provider, stock API)
- [ ] "Last updated" date shown on policy
- [ ] Policy linked from footer on every page

### Parental rights (v1.1+)
- [ ] Contact email published for parental data requests
- [ ] Process documented for parents to request data deletion
- [ ] Deletion pipeline tested (removes DB row + any associated data)
- [ ] Response time SLA: 30 days (FTC requirement)

### Security
- [ ] Google OAuth `sub` IDs hashed before storage (sha256)
- [ ] HTTPS enforced on all pages
- [ ] No raw PII in server logs
- [ ] DB access restricted to application service account only
- [ ] Auto-purge job runs for inactive accounts > 90 days

### Legal
- [ ] "For entertainment only" disclaimer on all screens
- [ ] Stock API ToS reviewed and compliant
- [ ] Attorney reviewed privacy policy before launch
- [ ] COPPA compliance documented and dated

---

## 8. COPPA 2.0 (pending)

As of May 2026, COPPA 2.0 has passed the Senate and is pending in Congress. Key proposed changes:

- Extends protections to teenagers **under 17** (not just under 13)
- Bans targeted advertising to anyone under 17 entirely
- Requires age verification at account creation

**Impact on StockStand:** If COPPA 2.0 passes as written, the "teen" tier (13–17) would require the same data protections as the current under-13 tier. Our architecture already handles this — the teen tier stores minimal data and suppresses all analytics.

**Action:** Monitor legislative progress. The current architecture is forward-compatible.

---

## 9. GDPR (EU users)

If StockStand is accessible to EU users:

- Lawful basis for processing adult data: Legitimate interest (game functionality) or Contract (account creation)
- Under-16 in most EU countries requires parental consent (varies by member state: 13–16)
- Cookie banner NOT required for localStorage (not a cookie)
- Cookie banner required if Plausible analytics is active (they claim GDPR-exempt but confirm with legal)
- Privacy policy must include GDPR-specific rights (access, deletion, portability)

**Recommendation:** Geo-detect EU visitors and apply the more restrictive age gate (under 16 = guest only) until legal review is complete.
