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
  default: {
    LIGHT: { baseCost: 180, laborHours: 2 },
    MODERATE: { baseCost: 480, laborHours: 5 },
    SEVERE: { baseCost: 950, laborHours: 8 }
  }
};

const OEM_CATALOG_REGISTRY: Record<string, Record<string, string>> = {
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
  }
};

function normalizePartName(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("front") && lower.includes("bumper")) return "bumper_front";
  if (lower.includes("rear") && lower.includes("bumper")) return "bumper_rear";
  if (lower.includes("fender")) return "fender";
  if (lower.includes("door")) return "door";
  if (lower.includes("hood")) return "hood";
  if (lower.includes("grille")) return "grille";
  if (lower.includes("headlight")) return "headlight";
  if (lower.includes("taillight") || lower.includes("tail light")) return "taillight";
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
  year?: number | null,
  partName?: string | null
): string | null {
  if (!make || !model || !partName) return null;

  const normalizedMake = make.trim().toLowerCase();
  const normalizedModel = model.trim().toLowerCase();
  const normalizedKey = normalizePartName(partName);

  // Find matching catalog entry
  for (const [key, parts] of Object.entries(OEM_CATALOG_REGISTRY)) {
    const [catMake, catModel] = key.split("_");
    if (normalizedMake.includes(catMake) && normalizedModel.includes(catModel)) {
      return parts[normalizedKey] || null;
    }
  }

  return null;
}
