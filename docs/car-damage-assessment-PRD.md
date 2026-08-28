# AI Car Damage Assessment — MVP PRD

**Client:** David K (Upwork)
**Built by:** Shakil Ahmed / BarakahSoft
**Date:** Aug 28, 2026
**Budget:** $300 fixed
**Timeline:** 5–7 days from kickoff
**Status:** Scope confirmed by client via chat (Aug 28, 2026) — "I don't care for their marketplace etc. Whatever I need to get damage detection via API, how much is the repair cost, and what OEM parts you need." Build started ahead of formal kickoff.

---

## 1. Overview

A web tool where a customer uploads photos of a damaged vehicle (plus optional VIN),
and an AI pipeline identifies the vehicle, detects damaged parts with severity, and
returns an estimated repair cost range and best-effort OEM part numbers. Reference
implementation: carfix.am (assessment engine only — no marketplace, no accounts).

## 2. Goals

- Customer uploads up to 10 photos in under a minute, no login required.
- AI returns vehicle ID + damage report within a few minutes.
- Output is a clean, shareable report page.
- Zero scope creep: matches this PRD only, not the full carfix.am platform.

## 3. Non-Goals (explicitly out of scope)

- Dealer/parts marketplace, listings, or pricing offers
- Accounts, login, saved history
- Repair shop quote requests / partner network
- Public "publish analysis" sharing
- Mitchell/CCC integration (separate track, priced only after API access is confirmed)

## 4. User Flow

1. Landing page: upload zone (up to 10 photos) + optional "individual part" photos + VIN field + free-text notes field.
2. VIN can be typed manually or auto-read from a photo of the VIN plate.
3. Submit → processing state (status: `PROCESSING`).
4. On completion → report page: vehicle summary, numbered list of damaged parts (name, description, severity), total cost range, OEM part number per part where reliable (else flagged, not faked).

## 5. Functional Requirements

### 5.1 Photo Upload
- Accept JPG/PNG/WebP, resize client-side before upload.
- Up to 10 whole-vehicle photos + optional per-part photos.
- Multi-image request sent to vision model in one batch call.

### 5.2 VIN Handling
- Manual entry field, optional.
- Optional: OCR the VIN from an uploaded photo of the plate (vision call, checksum validated).
- Missing/invalid VIN does not block analysis — degrades gracefully to photo-only detection.

### 5.3 Vehicle Identification
- Vision call returns: make, model, year (nullable individually — do not force a guess when confidence is low).
- Confidence score stored per detection.

### 5.4 Damage Detection
- Per photo set, detect: bumpers, doors, fenders, hood, trunk, lights, glass, wheels, other visible panels.
- Per part: damage type (scratch/dent/crack/shatter/etc.), severity (LIGHT / MODERATE / SEVERE), plain-language description.
- Findings are stored as structured records, not free text only.

### 5.5 Repair Cost Estimate
- Rule-based range (not live shop pricing): severity + part type → estimated cost band.
- Displayed as a range, same pattern as reference site (e.g. "$X – $Y").
- No live marketplace pricing — that's out of scope.

### 5.6 OEM Part Numbers
- Best-effort lookup only where reliable data exists.
- If no reliable match: field returns `null` / status `PENDING` — never fabricate a number.
- This matches the reference site's own behavior (its OEM field is also `PENDING` on every part in the reference sample).

### 5.7 Report Output
- Vehicle summary header + photo.
- Numbered part cards: name, description, severity badge, OEM status.
- Total estimated cost range.
- No login required to view/download the report.

## 6. Technical Architecture

**Pipeline (staged, matches proposal already sent to client):**

1. Image quality check (basic — reject unreadable/corrupt uploads).
2. Vision inference — vehicle ID (make/model/year) + VIN OCR if photo provided.
3. Vision inference — damage detection per part, batched across uploaded images.
4. Cost estimation — rules engine (severity × part type → range).
5. OEM lookup — best-effort; mark pending when unresolved.
6. Report assembly + persistence.

**Stack:**
- AI: Gemini (primary — cost + multi-image handling), OpenAI as fallback/cross-check on low-confidence findings.
- Backend: Node.js or Python (queued processing for the analysis job).
- Frontend: responsive web form + report view.
- Storage: uploaded images + structured findings (DB, not just files).

## 7. Data Model (core entities)

**Analysis**
- id, status (PROCESSING/COMPLETED/FAILED), vin, detectedMake, detectedModel, detectedYear, vehicleConfidence, severityOverall, costRangeLow, costRangeHigh, imageUrls[], createdAt

**Part Finding**
- id, analysisId, name, description, damageType, severity, oemNumber (nullable), oemStatus (RESOLVED/PENDING), position

## 8. Confidence & Fallback Handling

- Every AI-derived field carries a confidence score.
- Low-confidence vehicle ID or part detection is flagged in the report, not hidden.
- If primary model (Gemini) fails or returns low confidence, fallback call to secondary model before surfacing a result.

## 9. Dependencies on Client

- **Production API key:** client provides their own OpenAI/Gemini API key for live usage; usage costs are billed to the client directly by the provider, not included in the $300.
- Build/test phase uses developer's own API key (dev-side cost, not billed separately).
- Reference workflow: carfix.am (provided by client).
- Confirmation on Mitchell/CCC feasibility, if pursued later — separate scoped phase.

## 10. Timeline

5–7 days from kickoff to delivered MVP, given fixed scope above. Any scope addition (marketplace, accounts, live OEM catalog integration, Mitchell/CCC) is a new phase with its own quote, not a change to this one.

## 11. Acceptance Criteria

- Customer can upload photos + VIN and receive a completed report without registering.
- Report shows vehicle ID, per-part damage + severity, and a cost range.
- OEM field never shows a fabricated number — `PENDING` when unresolved.
- No marketplace, account, or quote-request functionality present.
