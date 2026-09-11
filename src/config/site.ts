/**
 * CARFIX US - Centralized Site Branding, Text Copy & Shop Settings
 * 
 * Edit this file to easily customize:
 * 1. Logo & Brand Names
 * 2. Labor Rate ($/hour) & Pricing Benchmarks
 * 3. Text Headlines, Subtitles & Descriptions
 * 4. Shop Contact Details
 */

export const siteConfig = {
  // Brand identity
  name: "CARFIX US",
  shortName: "CARFIX",
  badge: "US",

  // Custom Logo Configuration:
  // To use your own logo image:
  // 1. Put your image in the `public/` directory (e.g. `public/logo.png` or `public/logo.svg`)
  // 2. Set `logoUrl: "/logo.png"` below. If set to null, it renders the modern SVG car crest.
  logoUrl: null as string | null,

  // Labor Pricing Matrix:
  // Updated standard US collision body shop labor rate ($/hr)
  laborRatePerHour: 150,
  laborRateBenchmark: "$150/hr",

  // Landing Page Copy & Hero
  hero: {
    categoryBadge: "US Collision Intelligence Platform",
    title: "Enterprise Auto Collision Appraisal",
    subtitle:
      "Upload collision photos and vehicle details for automated forensic part identification, OEM catalog matching, and standardized collision repair estimates.",
    ctaButton: "Get Damage Estimate",
    addPhotoTile: "Add photo",
  },

  // Trust & Feature Indicators
  features: {
    laborBenchmarkLabel: "Labor Benchmark:",
    complianceBadge: "ISO 3779",
    guaranteeText: "NHTSA Verified Database",
  },

  // Contact Information for Estimates & Support
  contact: {
    phone: "(800) 555-0199",
    email: "estimates@carfix.us",
    address: "US Certified Auto Body & Collision Network",
  },

  // Admin CRM Settings
  admin: {
    title: "Executive Shop CRM",
    subtitle: "Real-time inbound repair leads, insurance pipelines, and estimator follow-up.",
    passwordProtected: false, // Set to true if you enable password protection
  }
};
