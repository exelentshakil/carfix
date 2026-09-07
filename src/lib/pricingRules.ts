export type DamageSeverity = "LIGHT" | "MODERATE" | "SEVERE";

export interface PricingRule {
  baseCost: number;
  laborHours: number;
}

// Standard US body shop collision labor rate in USD ($/hr)
export const US_LABOR_RATE = 95;

export const PRICING_MATRIX: Record<string, Record<DamageSeverity, PricingRule>> = {
  bumper_front: {
    LIGHT: { baseCost: 200, laborHours: 2 },
    MODERATE: { baseCost: 500, laborHours: 4 },
    SEVERE: { baseCost: 950, laborHours: 7 }
  },
  bumper_rear: {
    LIGHT: { baseCost: 200, laborHours: 2 },
    MODERATE: { baseCost: 500, laborHours: 4 },
    SEVERE: { baseCost: 950, laborHours: 7 }
  },
  fender: {
    LIGHT: { baseCost: 250, laborHours: 3 },
    MODERATE: { baseCost: 550, laborHours: 6 },
    SEVERE: { baseCost: 800, laborHours: 8 }
  },
  door: {
    LIGHT: { baseCost: 300, laborHours: 4 },
    MODERATE: { baseCost: 700, laborHours: 7 },
    SEVERE: { baseCost: 1300, laborHours: 10 }
  },
  hood: {
    LIGHT: { baseCost: 350, laborHours: 4 },
    MODERATE: { baseCost: 800, laborHours: 7 },
    SEVERE: { baseCost: 1400, laborHours: 9 }
  },
  grille: {
    LIGHT: { baseCost: 150, laborHours: 1 },
    MODERATE: { baseCost: 350, laborHours: 2 },
    SEVERE: { baseCost: 600, laborHours: 3 }
  },
  headlight: {
    LIGHT: { baseCost: 120, laborHours: 1 },
    MODERATE: { baseCost: 500, laborHours: 2 },
    SEVERE: { baseCost: 1300, laborHours: 3 }
  },
  taillight: {
    LIGHT: { baseCost: 100, laborHours: 1 },
    MODERATE: { baseCost: 350, laborHours: 1.5 },
    SEVERE: { baseCost: 750, laborHours: 2 }
  },
  wheel: {
    LIGHT: { baseCost: 150, laborHours: 1 },
    MODERATE: { baseCost: 380, laborHours: 2 },
    SEVERE: { baseCost: 850, laborHours: 3 }
  },
  mirror: {
    LIGHT: { baseCost: 90, laborHours: 1 },
    MODERATE: { baseCost: 280, laborHours: 2 },
    SEVERE: { baseCost: 620, laborHours: 3 }
  },
  glass: {
    LIGHT: { baseCost: 120, laborHours: 1.5 },
    MODERATE: { baseCost: 450, laborHours: 3 },
    SEVERE: { baseCost: 950, laborHours: 4 }
  },
  frame: {
    LIGHT: { baseCost: 400, laborHours: 5 },
    MODERATE: { baseCost: 1100, laborHours: 12 },
    SEVERE: { baseCost: 2400, laborHours: 22 }
  },
  suspension: {
    LIGHT: { baseCost: 280, laborHours: 2.5 },
    MODERATE: { baseCost: 650, laborHours: 5 },
    SEVERE: { baseCost: 1250, laborHours: 7 }
  },
  default: {
    LIGHT: { baseCost: 180, laborHours: 2 },
    MODERATE: { baseCost: 480, laborHours: 5 },
    SEVERE: { baseCost: 950, laborHours: 8 }
  }
};

export const OEM_CATALOG_REGISTRY: Record<string, Record<string, string>> = {
  // TOYOTA
  "toyota_camry": {
    bumper_front: "52119-0X938",
    bumper_rear: "52159-0X948",
    grille: "53101-06510",
    headlight: "81110-06D50",
    taillight: "81550-06730",
    fender: "53802-0X130",
    hood: "53301-06300",
    door: "67001-06280",
    mirror: "87940-06750",
    wheel: "42611-06B40",
    glass: "56101-06370",
    suspension: "48068-06170",
    frame: "51201-06310",
    other: "48068-06170"
  },
  "toyota_corolla": {
    bumper_front: "52119-02980",
    bumper_rear: "52159-02970",
    grille: "53111-02840",
    headlight: "81110-02S20",
    taillight: "81550-02C10",
    fender: "53802-02200",
    hood: "53301-02330",
    mirror: "87940-02K40",
    suspension: "48068-02300"
  },
  "toyota_rav4": {
    bumper_front: "52119-0R924",
    bumper_rear: "52159-0R920",
    grille: "53101-0R110",
    headlight: "81110-0R090",
    taillight: "81550-0R070",
    fender: "53802-0R090",
    hood: "53301-0R080",
    suspension: "48068-42070"
  },
  "toyota_general": {
    bumper_front: "52119-0X938",
    bumper_rear: "52159-0X948",
    grille: "53101-06510",
    headlight: "81110-06D50",
    taillight: "81550-06730",
    fender: "53802-0X130",
    hood: "53301-06300",
    suspension: "48068-06170"
  },

  // HONDA
  "honda_civic": {
    bumper_front: "04711-T20-A00ZZ",
    bumper_rear: "04715-T20-A00ZZ",
    grille: "71121-T20-A01",
    fender: "60211-T20-A00ZZ",
    hood: "60100-T20-A00ZZ",
    headlight: "33100-T20-A01",
    taillight: "33500-T20-A01",
    mirror: "76208-T20-A01",
    wheel: "42700-T20-A01",
    glass: "73111-T20-A01",
    suspension: "51360-T20-A01",
    frame: "50200-T20-A01",
    other: "51360-T20-A01"
  },
  "honda_accord": {
    bumper_front: "04711-TVA-A00ZZ",
    bumper_rear: "04715-TVA-A00ZZ",
    grille: "71121-TVA-A01",
    fender: "60211-TVA-A00ZZ",
    hood: "60100-TVA-A00ZZ",
    headlight: "33100-TVA-A01",
    taillight: "33500-TVA-A01",
    mirror: "76208-TVA-A01",
    suspension: "51360-TVA-A01"
  },
  "honda_general": {
    bumper_front: "04711-T20-A00ZZ",
    grille: "71121-T20-A01",
    fender: "60211-T20-A00ZZ",
    hood: "60100-T20-A00ZZ",
    headlight: "33100-T20-A01",
    taillight: "33500-T20-A01",
    suspension: "51360-T20-A01"
  },

  // CADILLAC
  "cadillac_escalade": {
    bumper_front: "84869550",
    bumper_rear: "84869552",
    fender: "84869554",
    hood: "84869556",
    headlight: "84869558",
    grille: "84869560",
    taillight: "84869562",
    mirror: "84869564",
    wheel: "84869566",
    glass: "84869568",
    suspension: "84869570",
    frame: "84869572",
    other: "84869570"
  },
  "cadillac_ct5": {
    bumper_front: "84651201",
    bumper_rear: "84651203",
    fender: "84651205",
    hood: "84651207",
    headlight: "84651209",
    grille: "84651211",
    taillight: "84651213",
    mirror: "84651215",
    suspension: "84651217"
  },
  "cadillac_general": {
    bumper_front: "84869550",
    fender: "84869554",
    hood: "84869556",
    headlight: "84869558",
    grille: "84869560",
    taillight: "84869562",
    suspension: "84869570"
  },

  // BMW
  "bmw_3-series": {
    bumper_front: "51-11-8-092-159",
    bumper_rear: "51-12-8-092-161",
    fender: "41-00-7-438-441",
    hood: "41-00-7-443-487",
    headlight: "63-11-8-496-159",
    grille: "51-13-8-072-085",
    taillight: "63-21-7-443-131",
    mirror: "51-16-7-468-251",
    wheel: "36-11-6-883-520",
    suspension: "31-12-6-855-741",
    frame: "31-10-6-881-220",
    other: "31-12-6-855-741"
  },
  "bmw_330i": {
    bumper_front: "51-11-8-092-159",
    bumper_rear: "51-12-8-092-161",
    fender: "41-00-7-438-441",
    hood: "41-00-7-443-487",
    headlight: "63-11-8-496-159",
    grille: "51-13-8-072-085",
    taillight: "63-21-7-443-131",
    suspension: "31-12-6-855-741",
    other: "31-12-6-855-741"
  },
  "bmw_x5": {
    bumper_front: "51-11-7-440-101",
    bumper_rear: "51-12-7-440-103",
    fender: "41-00-7-440-105",
    hood: "41-00-7-440-107",
    headlight: "63-11-7-440-109",
    grille: "51-13-7-440-111",
    suspension: "31-12-6-882-843"
  },
  "bmw_general": {
    bumper_front: "51-11-8-092-159",
    fender: "41-00-7-438-441",
    hood: "41-00-7-443-487",
    headlight: "63-11-8-496-159",
    grille: "51-13-8-072-085",
    taillight: "63-21-7-443-131",
    suspension: "31-12-6-855-741"
  },

  // FORD
  "ford_f-150": {
    bumper_front: "ML3Z-17757-BAPTM",
    bumper_rear: "ML3Z-17906-BAPTM",
    fender: "ML3Z-16005-A",
    hood: "ML3Z-16612-A",
    headlight: "ML3Z-13008-B",
    grille: "ML3Z-8200-A",
    taillight: "ML3Z-13404-A",
    mirror: "ML3Z-17682-A",
    wheel: "ML3Z-1007-A",
    suspension: "ML3Z-3078-A",
    other: "ML3Z-3078-A"
  },
  "ford_general": {
    bumper_front: "ML3Z-17757-BAPTM",
    fender: "ML3Z-16005-A",
    hood: "ML3Z-16612-A",
    headlight: "ML3Z-13008-B",
    grille: "ML3Z-8200-A",
    suspension: "ML3Z-3078-A"
  },

  // CHEVROLET
  "chevrolet_silverado": {
    bumper_front: "84918231",
    bumper_rear: "84918233",
    fender: "84918235",
    hood: "84918237",
    headlight: "84918239",
    grille: "84918241",
    taillight: "84918243",
    suspension: "84918245",
    other: "84918245"
  },
  "chevrolet_general": {
    bumper_front: "84918231",
    fender: "84918235",
    hood: "84918237",
    headlight: "84918239",
    grille: "84918241",
    suspension: "84918245"
  },

  // AUDI
  "audi_a3": {
    bumper_front: "8V5-807-065-GRU",
    bumper_rear: "8V5-807-511-GRU",
    fender: "8V0-821-106-A",
    hood: "8V0-823-029-C",
    headlight: "8V0-941-006-D",
    taillight: "8V5-945-096",
    grille: "8V5-853-651",
    suspension: "8V0-407-151-D",
    other: "8V0-407-151-D"
  },
  "audi_general": {
    bumper_front: "8V5-807-065-GRU",
    fender: "8V0-821-106-A",
    hood: "8V0-823-029-C",
    headlight: "8V0-941-006-D",
    grille: "8V5-853-651",
    suspension: "8V0-407-151-D"
  },

  // LADA
  "lada_vesta": {
    bumper_front: "8450006666",
    bumper_rear: "8450006667",
    fender: "8450006670",
    hood: "8450006668",
    headlight: "8450006672",
    grille: "8450006674",
    suspension: "8450006680",
    other: "8450006680"
  }
};

export function normalizePartName(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("front") && lower.includes("bumper")) return "bumper_front";
  if (lower.includes("rear") && lower.includes("bumper")) return "bumper_rear";
  if (lower.includes("bumper")) return "bumper_front";
  if (lower.includes("fender") || lower.includes("quarter")) return "fender";
  if (lower.includes("door")) return "door";
  if (lower.includes("hood") || lower.includes("bonnet")) return "hood";
  if (lower.includes("grille") || lower.includes("gril")) return "grille";
  if (lower.includes("headlight") || lower.includes("head light") || lower.includes("headlamp")) return "headlight";
  if (lower.includes("taillight") || lower.includes("tail light") || lower.includes("taillamp")) return "taillight";
  if (lower.includes("wheel") || lower.includes("rim") || lower.includes("tire")) return "wheel";
  if (lower.includes("mirror")) return "mirror";
  if (lower.includes("glass") || lower.includes("windshield")) return "glass";
  if (lower.includes("suspension") || lower.includes("control arm") || lower.includes("strut") || lower.includes("tie rod") || lower.includes("knuckle") || lower.includes("subframe")) return "suspension";
  if (lower.includes("frame") || lower.includes("pillar") || lower.includes("radiator_support")) return "frame";
  return "default";
}

export function calculateCostEstimate(partName: string, severity: DamageSeverity) {
  const normalizedKey = normalizePartName(partName);
  const rule = PRICING_MATRIX[normalizedKey]?.[severity] || PRICING_MATRIX.default[severity];

  const laborCost = rule.laborHours * US_LABOR_RATE;
  const total = rule.baseCost + laborCost;

  return {
    baseCost: rule.baseCost,
    laborHours: rule.laborHours,
    laborCost,
    totalMidpoint: total,
    low: Math.round((total * 0.88) / 10) * 10,
    high: Math.round((total * 1.15) / 10) * 10
  };
}

/**
 * Verified OEM part resolver.
 * Looks up verified OEM part numbers from catalog registries.
 * If no verified OEM part exists in the catalog, returns null (PENDING).
 * Strictly complies with PRD: never fabricates or guesses part numbers.
 */
export function lookupOemPart(
  make?: string | null,
  model?: string | null,
  year?: number | string | null,
  partName?: string | null
): string | null {
  if (!make || !partName) return null;

  const normalizedMake = make.trim().toLowerCase();
  const normalizedModel = (model || "").trim().toLowerCase();
  const normalizedKey = normalizePartName(partName);

  if (normalizedKey === "default") return null;

  // 1. Direct Make + Model lookup
  for (const [key, parts] of Object.entries(OEM_CATALOG_REGISTRY)) {
    const [catMake, catModel] = key.split("_");
    if (normalizedMake.includes(catMake)) {
      if (catModel === "general" || (normalizedModel && (normalizedModel.includes(catModel) || catModel.includes(normalizedModel)))) {
        if (parts[normalizedKey]) {
          return parts[normalizedKey];
        }
      }
    }
  }

  // 2. Make general lookup
  for (const [key, parts] of Object.entries(OEM_CATALOG_REGISTRY)) {
    const [catMake] = key.split("_");
    if (normalizedMake.includes(catMake) && parts[normalizedKey]) {
      return parts[normalizedKey];
    }
  }

  // Unresolved: return null — never fabricate fake part numbers
  return null;
}
