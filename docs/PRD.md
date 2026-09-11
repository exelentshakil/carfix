# CARFIX US — Product Requirements Document (PRD)

**Project:** CARFIX US — AI Collision Appraisal, Pre-Audit, Lead Capture & SaaS CRM  
**Market:** United States (US NHTSA vPIC, US currency USD, US Labor Rates, +1 Phone formatting)  
**Date:** September 11, 2026  
**Reference Benchmark:** carfix.am (Adapted for US collision repair economics & business objectives)  
**Primary Business Objective:** **Lead Generation & Conversion**. The AI vehicle damage assessment is the core customer-facing value magnet designed to capture high-intent collision leads (Full Name, Phone, Email, Verified Vehicle) before running the forensic appraisal report, empowering repair shop managers to immediately contact and win repair jobs.

---

## 1. Executive Summary & Core Value Proposition

CARFIX US transforms inbound collision traffic into high-converting repair shop leads. Rather than giving away expensive AI appraisals anonymously to web scrapers or uncommitted visitors, CARFIX US institutes a structured 2-step verification and lead-capture pipeline:
1. **Intake & Vehicle Discrepancy Auditing**: Customers upload collision photos (left column) and enter their 17-character VIN or select manual attributes (right column) with instant US DOT NHTSA vPIC decoding.
2. **Step 1 Modal — Vehicle Confirmation ("Is this your car?")**: Verifies the vehicle model and year, allowing one-click confirmation or editing.
3. **Step 2 Modal — Gated Lead Capture ("Your calculation is almost ready")**: Collects verified Name, Phone (+1), and Email before initiating token-heavy forensic vision analysis.
4. **Forensic Damage Report**: Delivers OEM part itemization, labor hours ($95/hr US benchmark), severity ratings, and VIN vs. photo discrepancy alerts.
5. **Executive SaaS Lead Management CRM (`/admin`)**: A centralized dashboard for collision shop estimators and managers to track inbound leads, update pipeline statuses (`NEW`, `CONTACTED`, `ESTIMATING`, `WON`, `LOST`), inspect damage reports, and export to CSV.

---

## 2. User Personas

1. **Vehicle Owner / Claimant**: Has experienced vehicle damage and wants an accurate, rapid repair estimate without paying for an initial adjuster visit.
2. **Auto Body Shop Estimator / Service Manager**: Needs qualified customer leads with pre-identified vehicle details, contact information, photos, and preliminary damage estimates to follow up by phone/email within minutes.
3. **Shop Owner / Executive**: Monitors lead conversion, pipeline dollar volume, average ticket value, and team follow-up velocity via the `/admin` CRM.

---

## 3. High-Level User Journey & Conversion Funnel

```
[ Inbound Customer on / ]
         │
         ▼
[ Intake Screen (Two-Column Layout) ]
   ├── Left: Photo Upload Dropzone, Preview Grid (Cover Badge, Remove, Add More)
   └── Right: VIN Lookup (US NHTSA API), Recommendation Alert, Attributes & Notes
         │
         ▼ (User clicks "Get Damage Estimate")
[ Modal 1: Vehicle Confirmation ("Is this your car?") ]
   ├── Displays: Photo / Thumbnail, Detected Make/Model/Year/Body, Specs
   ├── Options: "Edit" (focuses input fields) OR "Yes, that's right."
         │
         ▼ (User clicks "Yes, that's right.")
[ Modal 2: Lead Capture Gating ("Your calculation is almost ready") ]
   ├── Displays: Confirmed Car Tag, Progress Meter
   ├── Form: Full Name, US Phone Number (+1), Email Address, Consent Checkbox
   └── Action: "Show My Calculation & Free Estimate"
         │
         ▼ (Submits Lead to /api/leads & stores in Supabase)
[ Forensic AI Analysis Engine ]
   ├── Gemini 2.5 Flash Vision Inspection
   ├── OEM Part Matching & $95/hr Labor Calculation
   └── Discrepancy Detection (VIN vs. Visual Vehicle)
         │
         ▼
[ Damage Report Screen (/analyze/results or inline) ]
   ├── Interactive 360/Damage Part Cards
   ├── OEM Numbers (Resolved vs. Pending)
   ├── Discrepancy Alert Banner (if applicable)
   └── Shop Contact CTA ("Call Shop Estimator")
         │
         ▼
[ Shop Manager Dashboard (/admin) ]
   └── Instant Lead Alert, Pipeline Status, CRM Workflow, CSV Export
```

---

## 4. Functional Specifications

### 4.1 Intake Screen Two-Column Architecture (`src/app/page.tsx`)
Matching the carfix.am layout standard:
- **Left Column**:
  - Drag-and-drop file upload zone supporting JPG, PNG, WebP.
  - Client-side Canvas image optimization (resizing to max 1280px / 0.8 quality) preventing Vercel 4.5MB payload limits.
  - Image preview grid: First photo labeled with a prominent green "BASIC" cover badge; each tile contains a quick-remove button.
  - "+" Add Photo tile allowing incremental uploads up to 10 photos.
  - Prominent Call-To-Action button: "Get Damage Estimate" with photo counter and disabled state if 0 photos uploaded.
- **Right Column**:
  - 17-character VIN input with auto-uppercase formatting and instant "Decode VIN" action.
  - Direct integration with US DOT NHTSA vPIC API (`https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues/`).
  - VIN Recommendation Alert Card: Educates users on why VIN lookup produces higher OEM pricing accuracy.
  - Manual Vehicle Attribute Selectors / Inputs: Year, Make, Model, Trim, Body Class, Transmission (Automatic/Manual), Fuel Type (Gasoline/Hybrid/Electric/Diesel).
  - Damage Description Notes textarea.

### 4.2 Modal 1: Vehicle Confirmation ("Is this your car?")
- Triggered when the user clicks "Get Damage Estimate".
- If VIN was entered: Uses NHTSA-decoded vehicle specs.
- If photos only: Triggers a fast pre-identification API (`/api/vehicle/pre-identify`) to determine Make/Model/Year from grille, badging, and body lines.
- UI elements:
  - Header: "Is this your car?" with clear subtext.
  - Hero card with primary vehicle photo or car silhouette icon.
  - Vehicle details summary: Year, Make, Model, Body Style, Trim.
  - Secondary Action button: "Edit" — closes modal and highlights the vehicle attribute fields in the right column.
  - Primary Action button: "Yes, that's right." — advances immediately to Modal 2.

### 4.3 Modal 2: Lead Capture Gating ("Your calculation is almost ready")
- Appears immediately upon vehicle confirmation.
- Subtitle: "We are finalizing your damage assessment and OEM part cost range. Please confirm where to send your official report copy."
- Tag: Displays confirmed vehicle chip (e.g., `2022 Toyota Camry SE`).
- Form Fields:
  - **Full Name** (Required, text)
  - **Phone Number** (Required, validated for US format `(XXX) XXX-XXXX` or `+1`)
  - **Email Address** (Required, email format validation)
  - **Terms & Privacy Consent** (Pre-checked)
- Submission:
  - Dispatches `POST /api/leads` to persist lead record in Supabase.
  - Stores lead ID in local session storage.
  - Seamlessly transitions the page state to `processing` / forensic damage calculation.

### 4.4 Forensic AI Damage Appraisal Engine (`/api/analyze`)
- Powered by Google Gemini 2.5 Flash Vision.
- Multi-photo damage localization and severity scoring (LIGHT, MODERATE, SEVERE).
- Part mapping: `bumper_front`, `bumper_rear`, `fender`, `door`, `hood`, `grille`, `headlight`, `taillight`, `wheel`, `mirror`, `glass`, `frame`, `other`.
- US Collision Repair Economics:
  - Benchmark US labor rate: $95.00 / hour.
  - Material and refinish allowances.
  - Authoritative OEM part matching.
- Vehicle Discrepancy Auditing:
  - Compares claimed VIN against visual photo identification.
  - Flags mismatches (e.g. BMW VIN submitted with Cadillac photos) with CRITICAL discrepancy banners and calculates estimate for the actual physical vehicle.
- Backfills the completed calculation and cost ranges into the corresponding lead record in Supabase.

### 4.5 Executive SaaS Lead Management CRM (`/admin`)
A portal for shop estimators and executives:
- **KPI Metric Strip**:
  - Total Inbound Leads
  - Total Pipeline Estimated Value ($)
  - Average Ticket Size ($)
  - Pending / Uncontacted Leads Counter
- **Interactive Lead Table & Filter Controls**:
  - Search bar: Real-time search across Customer Name, Phone, Email, VIN, and Vehicle Make/Model.
  - Status Filter: All, `NEW`, `CONTACTED`, `ESTIMATING`, `WON`, `LOST`.
  - Date sorting: Newest first.
- **Lead Detail Drawer / Modal**:
  - Full contact information with one-click `tel:` and `mailto:` links.
  - Vehicle specs and submitted notes.
  - Uploaded damage photo gallery.
  - AI Damage Findings breakdown with OEM part numbers and labor hours.
  - One-click Status Update dropdown (`NEW` → `CONTACTED` → `ESTIMATING` → `WON` / `LOST`).
  - Internal Shop Notes field.
- **Data Portability**:
  - "Export Leads to CSV" button for export into shop management systems (CCC ONE, Mitchell, Mitchell 1, Shopmonkey).

---

## 5. Technical Architecture & Database Schema

### 5.1 Tech Stack
- **Framework**: Next.js 15 (App Router, Server Actions, Route Handlers)
- **Language**: TypeScript (Strict mode)
- **Styling**: Tailwind CSS + Framer Motion
- **Database & Storage**: Supabase (PostgreSQL with `supabaseAdmin` service role)
- **AI Vision**: `@google/generative-ai` (Gemini 2.5 Flash)
- **VIN Decoding**: US DOT NHTSA vPIC REST API

### 5.2 Database Schema (`leads` table)
```sql
create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null,
  email text not null,
  vehicle_year int,
  vehicle_make text,
  vehicle_model text,
  vehicle_trim text,
  vehicle_body text,
  transmission text,
  fuel_type text,
  vin text,
  notes text,
  image_urls text[],
  estimated_cost_low numeric,
  estimated_cost_high numeric,
  damage_summary text,
  status text not null default 'NEW',
  analysis_id text,
  internal_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes for lightning CRM queries
create index if not exists idx_leads_status on leads(status);
create index if not exists idx_leads_created_at on leads(created_at desc);
create index if not exists idx_leads_email on leads(email);
create index if not exists idx_leads_phone on leads(phone);
```

---

## 6. Security, Compliance & Spam Prevention
- **Payload Protection**: Client-side canvas compression prevents serverless function timeouts and payload rejections.
- **Cost Protection**: Free NHTSA vPIC API handles vehicle validation. Heavy Gemini 2.5 Flash tokens are only consumed after the user proves human intent by entering valid contact details.
- **Data Privacy**: US TCPA compliance notice on lead capture modal informing user that an estimator may follow up regarding their repair estimate.
