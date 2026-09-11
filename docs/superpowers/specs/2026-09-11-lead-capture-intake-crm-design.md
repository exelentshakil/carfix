# Lead Capture, Two-Column Intake & Executive Admin CRM Specification

**Date:** 2026-09-11  
**Project:** CARFIX Pro (US Auto Collision Appraisal & Forensic Estimating Platform)  
**Author:** AI Engineering & Shakil

---

## 1. Problem Statement & Objectives

### Problem
Previously, users could directly trigger AI collision estimation without providing their contact details. The client needs every AI estimate request to act as a high-converting customer acquisition funnel ("the point of this AI estimate - get new lead") so shop managers can promptly follow up with customers, explain the appraisal, and book the repair job. Furthermore, the intake UI needed to match the structured two-column layout (Image 3) with full vehicle attribute validation, an instant confirmation prompt ("Is this your car?", Image 2), and a lead capture gate (Image 1).

### Objectives
1. **Two-Column Intake Layout (Image 3)**:
   - Left Column: Damage photo uploader with preview gallery, primary "BASIC" photo badge, remove action, "+" add more tile, and primary CTA.
   - Right Column: VIN input with US NHTSA vPIC lookup, VIN guidance notice card, manual vehicle details form (Year, Make, Model, Trim, Body, Transmission, Fuel), and damage notes textarea.
2. **Fast Vehicle Pre-Identification**:
   - Free instant decode when 17-char VIN is present via NHTSA API.
   - Lightweight AI vision badge & silhouette recognition when photos are uploaded without VIN.
   - Auto-fills and highlights the right-hand vehicle attributes.
3. **Modal 1: "Is this your car?" (Image 2)**:
   - Visual confirmation card showing the identified Year, Make, and Model.
   - "Edit" action smoothly scrolls to and focuses the right-hand vehicle form.
   - "Yes, that's right." proceeds directly to the Lead Capture modal.
4. **Modal 2: Lead Capture Modal (Image 1 - US Market)**:
   - Collects Name, US Phone (+1 format), Email, and displays confirmed Vehicle info.
   - Gating mechanism: Full expensive forensic damage report only runs *after* valid lead submission.
5. **Executive SaaS `/admin` Lead CRM Portal**:
   - Real-time pipeline KPI metrics (Total Leads, Pipeline $ Value, Average Estimate, Uncontacted Leads).
   - Search & filter by customer name, phone, email, VIN, vehicle, status, and severity.
   - Inline lead status management (`NEW`, `CONTACTED`, `ESTIMATING`, `WON`, `LOST`).
   - Click-to-call, customer damage photos lightbox, full AI report viewer, and CSV export.
6. **Supabase Persistence**:
   - `leads` table linked to appraisal records with full contact details, vehicle info, damage summaries, and cost ranges.

---

## 2. Intake Flow & State Machine

```
State 1: 'upload' (Two-column layout)
  ├── User uploads 1-10 photos (compressed client-side to prevent 413)
  ├── User enters VIN (triggers instant NHTSA decode) OR enters manual Year/Make/Model
  └── User clicks "Check Vehicle & Analyze Damage"

State 2: Vehicle Pre-Identification & Confirmation
  ├── If no VIN: Call POST /api/vehicle/pre-identify with photo thumbnail
  ├── Auto-fill right-hand fields with detected vehicle specs
  └── Open Modal 1 ("Is this your car?")
        ├── Click [Edit] ➔ Close modal, focus right-hand fields
        └── Click [Yes, that's right.] ➔ Open Modal 2 ("Lead Capture")

State 3: Lead Capture Modal
  ├── User enters: Full Name, US Phone (+1), Email
  ├── Displays verified Vehicle tag (e.g., "2015 Chevrolet Malibu")
  └── User clicks [Unlock Free Estimate & Report →]
        ├── POST /api/leads ➔ Inserts record in Supabase 'leads' table
        ├── Transitions to State 4: 'processing' (Animated radar scanner)
        └── POST /api/analyze ➔ Executes forensic Gemini vision appraisal

State 4: 'results' (Full Interactive Report)
  ├── Renders full OEM parts breakdown, labor rates, and discrepancy audit
  └── Updates lead in Supabase with final cost range and report findings
```

---

## 3. Database Schema (`supabase/schema.sql`)

A dedicated `leads` table in Supabase stores complete contact and appraisal information:

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
  status text not null default 'NEW', -- NEW, CONTACTED, ESTIMATING, WON, LOST
  analysis_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_leads_created_at on leads(created_at desc);
create index if not exists idx_leads_status on leads(status);

alter table leads enable row level security;
```

---

## 4. API Endpoints

### 1. `POST /api/vehicle/pre-identify`
- **Purpose**: Fast, low-latency visual vehicle badge, silhouette, and model detector.
- **Request**: `{ image: string (base64) }`
- **Response**:
  ```json
  {
    "make": "Chevrolet",
    "model": "Malibu",
    "year": 2015,
    "bodyClass": "Sedan",
    "confidence": 0.94
  }
  ```

### 2. `POST /api/leads`
- **Purpose**: Save customer lead data prior to heavy analysis.
- **Request**: `{ fullName, phone, email, vehicle: { year, make, model, trim, bodyClass, transmission, fuelType }, vin, notes, images }`
- **Response**: `{ success: true, leadId: string }`

### 3. `GET /api/leads`
- **Purpose**: Power the `/admin` portal with search, filtering, and summary statistics.
- **Query Params**: `status`, `search`, `page`, `limit`
- **Response**:
  ```json
  {
    "leads": [...],
    "stats": {
      "totalLeads": 42,
      "newLeads": 18,
      "pipelineValue": 128450,
      "averageEstimate": 3058
    }
  }
  ```

### 4. `PATCH /api/leads/[id]`
- **Purpose**: Update lead status (`CONTACTED`, `ESTIMATING`, `WON`, `LOST`) or manager notes from the admin dashboard.
- **Request**: `{ status?: string, notes?: string, costLow?: number, costHigh?: number, analysisId?: string }`

---

## 5. User Interface Specifications

### 5.1 Intake Screen Two-Column Layout (Matching Image 3)
- **Left Column**:
  - Drag-and-drop / click file upload dropzone with camera icon.
  - Image thumbnail grid with badges (`BASIC` for cover photo, delete `✕` button).
  - Dashed `+` card for adding subsequent photos up to 10.
  - Primary button: *"Add at least one photo"* / *"Check Vehicle & Analyze Damage"* with vibrant yellow styling (`bg-amber-500` / `from-amber-500 to-amber-600`).
- **Right Column**:
  - **VIN Card**: 17-char input with NHTSA vPIC verification badge and sample VIN pills.
  - **VIN Recommendation Box**: Alert box explaining OEM precision benefits.
  - **Vehicle Data Card**: Manual filling dropdowns for Year (1995-2026), Make, Model, Equipment/Trim, Body Class, Transmission, and Fuel Type.
  - **Notes Card**: Additional context textarea (*"Scratched in parking lot? Highway collision? Hail damage?"*).

### 5.2 Modal 1: "Is this your car?" (Matching Image 2)
- Centered modal dialog with backdrop blur.
- Warning/info circle icon with amber outline.
- Headline: *"Is this your car?"*
- Body: *"We identified the car from the photo. Please confirm that it is correct or edit the information below before running the analysis."*
- Rounded highlight input displaying e.g. **Chevrolet Malibu 2015**.
- Two action buttons:
  - `[Edit]` (neutral outlined button): Closes modal, highlights and smoothly scrolls to the right-side form.
  - `[Yes, that's right.]` (solid amber/yellow button): Confirms car details and opens the Lead Capture modal.

### 5.3 Modal 2: Lead Capture Gate (Matching Image 1 - US Market)
- Title: *"Create a free account and get AI analysis results"*
- Feature list:
  - ✓ *AI analysis is free*
  - ✓ *Detection of damaged parts*
  - ✓ *Experts in renovation*
- Fields:
  - **First Name & Last Name** (placeholder: "Hayk Sargsyan" or "John Smith")
  - **US Phone** (US flag icon, `+1` prefix, formatted `(XXX) XXX-XXXX`)
  - **Email** (placeholder: `you@example.com`)
  - Pre-selected vehicle badge showing confirmed Year, Make, and Model.
  - Cloudflare Turnstile / Security verification badge.
- Main Action Button: *"Sign up for free and start analyzing →"*

### 5.4 Million-Dollar Executive `/admin` Lead Management CRM Portal
- Path: `/admin`
- Clean, executive dark/light dashboard theme with responsive design.
- **Top Metrics Grid**:
  - Total Leads (with week-over-week indicator)
  - Estimated Repair Pipeline ($)
  - Average Collision Ticket ($)
  - Pending Follow-ups (New Leads count)
- **Search & Filters**:
  - Real-time text search across Name, Phone, Email, VIN, Vehicle.
  - Status filter pill tabs (`All`, `New`, `Contacted`, `Estimating`, `Won`, `Lost`).
  - One-click CSV Export for sales CRM integration.
- **Interactive Leads Table**:
  - Lead contact card with click-to-call `tel:` link and email link.
  - Vehicle details with VIN badge.
  - Photo gallery popover.
  - Repair cost range badge.
  - Real-time status selector.
  - Quick action to view the client's generated collision appraisal.

---

## 6. Verification & Testing Plan

1. **Intake UI Validation**: Verify two-column layout matches Image 3 across desktop and mobile breakpoints.
2. **VIN & Pre-Identification**: Test with 17-char VIN (instant NHTSA decode) and test photo-only upload (triggers pre-identify).
3. **Confirmation Modal**: Test "Edit" (focuses form) and "Yes, that's right." (opens lead modal).
4. **Lead Capture**: Verify form validation (valid email, 10-digit US phone, required name), verify Supabase insertion, and confirm full report triggers.
5. **Admin Portal**: Verify `/admin` displays newly created leads, filters work, status updates persist to Supabase, and CSV export downloads clean data.
