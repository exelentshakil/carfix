# CARFIX US - Customization & Testing Guide

This guide explains how to edit the **Logo**, **Text/Copy**, **Pricing & Labor Rates**, and **Settings**, along with testing tips for your team.

---

## 1. Fast Configuration in One File (`src/config/site.ts`)

All main branding, labor rates, and copy are centralized in:
👉 [`src/config/site.ts`](../src/config/site.ts)

```typescript
export const siteConfig = {
  name: "CARFIX US",
  shortName: "CARFIX",
  badge: "US",

  // Custom Logo: Place image in /public folder (e.g. /public/logo.png)
  // Set to null to use the default modern SVG icon
  logoUrl: null, // e.g. "/logo.png"

  // Labor rate ($/hr) - Drives all appraisal calculations
  laborRatePerHour: 150, // Updated to $150/hr
  laborRateBenchmark: "$150/hr",

  hero: {
    categoryBadge: "US Collision Intelligence Platform",
    title: "Enterprise Auto Collision Appraisal",
    subtitle: "Upload collision photos and vehicle details...",
    ctaButton: "Get Damage Estimate",
  },
  ...
};
```

---

## 2. How to Change the Logo

### Option A: Use Your Own Image (PNG, SVG, JPG, WebP)
1. Drop your logo file into the `public/` directory:
   ```bash
   public/logo.png
   # or
   public/logo.svg
   ```
2. Open [`src/config/site.ts`](../src/config/site.ts) and set:
   ```typescript
   logoUrl: "/logo.png",
   ```
3. Save the file. Your logo will immediately appear in the header.

### Option B: Change the Text / Badge
If you do not have an image logo, simply edit:
```typescript
name: "CARFIX US",
shortName: "MYSHOP",
badge: "ESTIMATES",
```

---

## 3. How to Change Text, Headlines & Copy

| What to change | Where to edit |
|---|---|
| **Hero Title & Subtitle** | [`src/config/site.ts`](../src/config/site.ts) -> `hero.title` & `hero.subtitle` |
| **Call-to-Action Button** | [`src/config/site.ts`](../src/config/site.ts) -> `hero.ctaButton` |
| **Shop Phone & Email** | [`src/config/site.ts`](../src/config/site.ts) -> `contact.phone` & `contact.email` |
| **Damage Questions / Notes** | [`src/app/page.tsx`](../src/app/page.tsx) -> "Damage Description" section |
| **Modal 1 ("Is this your car?")** | [`src/components/ConfirmCarModal.tsx`](../src/components/ConfirmCarModal.tsx) |
| **Modal 2 (Lead Capture Form)** | [`src/components/LeadCaptureModal.tsx`](../src/components/LeadCaptureModal.tsx) |

---

## 4. How to Change the Labor Rate ($/hr) & Pricing

The collision damage pricing engine calculates:
$$\text{Total Estimate} = \text{Base OEM Part Cost} + (\text{Labor Hours} \times \text{Labor Rate})$$

- **To adjust the labor rate**: Open [`src/config/site.ts`](../src/config/site.ts) and change `laborRatePerHour: 150` to any rate (e.g. `125`, `175`, etc.).
- **To customize individual part costs or labor hour matrices**:
  Open [`src/lib/pricingRules.ts`](../src/lib/pricingRules.ts) to adjust specific bumpers, fenders, hoods, headlights, etc.

---

## 5. Team Testing Guide (For You and Your Coworkers)

### Step 1: Testing the Intake Flow
1. **Upload Photos**: Drag & drop 1 or more damage photos (or click "+ Add photo").
   - Notice the green **"BASIC"** badge on the primary cover photo.
2. **VIN Lookup**:
   - Paste any 17-character US VIN (e.g. `4T1B11HK5NU109823`, `1FTFW1ED4MFB33819`, `WBA5R1C08PA778219`, `5YJ3E1EB8NF123456`).
   - The system automatically strips spaces/hyphens and queries the US DOT NHTSA database.
   - If NHTSA is slow or the car is imported, our authoritative ISO-3779 WMI fallback instantly identifies the Make and Year, guaranteeing it will **never** reject a real VIN.
   - You will see the green **"✓ US DOT NHTSA Registry Verified"** badge and vehicle specs auto-populated.
   - *Optional*: You can also leave the VIN blank and manually select Year, Make, Model!
3. **Appraisal Trigger**:
   - Click **"Get Damage Estimate"**.
   - **Modal 1 ("Is this your car?")** appears showing the vehicle specs. Click *"Yes, that's right"*.
   - **Modal 2 ("Your calculation is almost ready")** opens. Enter Name, US Phone `(XXX) XXX-XXXX`, and Email.
   - Click **"Continue to Forensic Analysis"**.
4. **Appraisal Report**:
   - High/Low repair cost ranges calculated with the **$150/hr labor rate**.
   - Itemized forensic parts list with OEM status and labor hour breakdowns.

### Step 2: Testing the Shop Admin CRM
1. Navigate directly to:
   `http://localhost:3000/admin`
2. Features to test:
   - **Real-Time KPIs**: Total Leads, Pipeline Value, Average Ticket (based on $150/hr benchmark), Action Required.
   - **Status Workflow**: Click on any lead to change its status (`NEW` -> `CONTACTED` -> `ESTIMATING` -> `WON` -> `LOST`).
   - **Full-Text Search**: Search by customer name, phone, VIN, or vehicle make.
   - **Lead Drawer**: Click "View Details" to open the slide-over drawer with one-click `tel:` and `mailto:` links, damage summaries, and photo thumbnails.
   - **Internal Shop Notes**: Add private notes for estimators and click "Save Notes".
   - **Export CSV**: Click "Export CSV" to download the leads spreadsheet for Excel or Google Sheets.
