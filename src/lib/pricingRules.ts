export type DamageSeverity = "LIGHT" | "MODERATE" | "SEVERE";

interface PricingRule {
  baseCost: number;
  laborHours: number;
}

// Standard US body shop collision labor rate in USD ($/hr)
const US_LABOR_RATE = 95;

const PRICING_MATRIX: Record<string, Record<DamageSeverity, PricingRule>> = {
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
    LIGHT: { baseCost: 0, laborHours: 0 },
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
  default: {
    LIGHT: { baseCost: 180, laborHours: 2 },
    MODERATE: { baseCost: 480, laborHours: 5 },
    SEVERE: { baseCost: 950, laborHours: 8 }
  }
};

const OEM_CATALOG_REGISTRY: Record<string, Record<string, string>> = {
  "cadillac_escalade": {
    bumper_front: "84869550",
    bumper_rear: "84869552",
    fender: "84869554",
    hood: "84869556",
    headlight: "84869558",
    grille: "84869560",
    taillight: "84869562",
    mirror: "84869564",
    wheel: "84869566"
  },
  "cadillac_ct5": {
    bumper_front: "84651201",
    bumper_rear: "84651203",
    fender: "84651205",
    hood: "84651207",
    headlight: "84651209",
    grille: "84651211",
    taillight: "84651213"
  },
  "cadillac_general": {
    bumper_front: "84869550",
    fender: "84869554",
    hood: "84869556",
    headlight: "84869558",
    grille: "84869560"
  },
  "bmw_3-series": {
    bumper_front: "51-11-8-092-159",
    bumper_rear: "51-12-8-092-161",
    fender: "41-00-7-438-441",
    hood: "41-00-7-443-487",
    headlight: "63-11-8-496-159",
    grille: "51-13-8-072-085",
    taillight: "63-21-7-443-131"
  },
  "bmw_330i": {
    bumper_front: "51-11-8-092-159",
    bumper_rear: "51-12-8-092-161",
    fender: "41-00-7-438-441",
    hood: "41-00-7-443-487",
    headlight: "63-11-8-496-159",
    grille: "51-13-8-072-085"
  },
  "bmw_x5": {
    bumper_front: "51-11-7-440-101",
    bumper_rear: "51-12-7-440-103",
    fender: "41-00-7-440-105",
    hood: "41-00-7-440-107",
    headlight: "63-11-7-440-109",
    grille: "51-13-7-440-111"
  },
  "bmw_general": {
    bumper_front: "51-11-8-092-159",
    fender: "41-00-7-438-441",
    hood: "41-00-7-443-487",
    headlight: "63-11-8-496-159",
    grille: "51-13-8-072-085"
  },
  "honda_civic": {
    bumper_front: "04711-T20-A00ZZ",
    bumper_rear: "04715-T20-A00ZZ",
    fender: "60211-T20-A00ZZ",
    hood: "60100-T20-A00ZZ",
    headlight: "33100-T20-A01",
    taillight: "33500-T20-A01",
  },
  "toyota_camry": {
    bumper_front: "52119-0X938",
    bumper_rear: "52159-0X948",
    fender: "53802-0X130",
    hood: "53301-06300",
    headlight: "81110-06D50",
    taillight: "81550-06730",
  },
  "audi_a3": {
    bumper_front: "8V5-807-065-GRU",
    bumper_rear: "8V5-807-511-GRU",
    fender: "8V0-821-106-A",
    hood: "8V0-823-029-C",
    headlight: "8V0-941-006-D",
    taillight: "8V5-945-096",
  },
  "ford_f-150": {
    bumper_front: "ML3Z-17757-BAPTM",
    bumper_rear: "ML3Z-17906-BAPTM",
    fender: "ML3Z-16005-A",
    hood: "ML3Z-16612-A",
    headlight: "ML3Z-13008-B",
    grille: "ML3Z-8200-A"
  },
  "chevrolet_silverado": {
    bumper_front: "84918231",
    bumper_rear: "84918233",
    fender: "84918235",
    hood: "84918237",
    headlight: "84918239",
    grille: "84918241"
  },
  "lada_vesta": {
    bumper_front: "8450006666",
    fender: "8450006670",
    hood: "8450006668",
    headlight: "8450006672",
    grille: "8450006674"
  }
};

function normalizePartName(name: string): string {
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
  if (lower.includes("frame") || lower.includes("pillar") || lower.includes("radiator_support") || lower.includes("suspension")) return "frame";
  return "default";
}

export function calculateCostEstimate(partName: string, severity: DamageSeverity) {
  const normalizedKey = normalizePartName(partName);
  const rule = PRICING_MATRIX[normalizedKey]?.[severity] || PRICING_MATRIX.default[severity];

  const total = rule.baseCost + (rule.laborHours * US_LABOR_RATE);

  return {
    low: Math.round((total * 0.88) / 10) * 10,
    high: Math.round((total * 1.15) / 10) * 10
  };
}

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

  // Exact or partial make_model match
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

  // Fallback to any matching make in registry
  for (const [key, parts] of Object.entries(OEM_CATALOG_REGISTRY)) {
    const [catMake] = key.split("_");
    if (normalizedMake.includes(catMake) && parts[normalizedKey]) {
      return parts[normalizedKey];
    }
  }

  return null;
}
