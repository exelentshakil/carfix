import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
// Update this if the model is retired — check current model names at ai.google.dev
const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-2.5-flash";

export const PART_BASE_COST: Record<string, number> = {
  bumper: 300, door: 500, fender: 250, hood: 400, trunk: 350,
  headlight: 200, taillight: 150, glass: 300, wheel: 200, mirror: 80, other: 150,
};

export const SEVERITY_MULTIPLIER: Record<string, number> = {
  LIGHT: 0.4, MODERATE: 1.0, SEVERE: 1.8,
};

export const ANALYSIS_PROMPT = `You are an expert vehicle damage assessor. Analyze the attached photo(s) of a vehicle.

Return ONLY valid JSON, no markdown fences, no commentary, matching exactly this shape:

{
  "vehicle": {
    "make": string or null,
    "model": string or null,
    "year": number or null,
    "confidence": number (0-1)
  },
  "parts": [
    {
      "name": string,
      "partType": string,
      "damageType": string,
      "severity": "LIGHT" | "MODERATE" | "SEVERE",
      "description": string,
      "confidence": number (0-1)
    }
  ]
}

partType must be one of: bumper, door, fender, hood, trunk, headlight, taillight, glass, wheel, mirror, other.
If no vehicle is identifiable, set vehicle fields to null. If no damage is visible, return an empty parts array.
Do not invent OEM part numbers or exact prices, that is handled separately. Be conservative:
only report damage you can actually see in the photos.`;

export function parseJsonResponse(text: string) {
  const cleaned = text.trim().replace(/^```(json)?/, "").replace(/```$/, "").trim();
  return JSON.parse(cleaned);
}

export function estimateCost(parts: Array<{ partType?: string; severity?: string }>) {
  let low = 0;
  let high = 0;
  for (const p of parts) {
    const base = PART_BASE_COST[p.partType ?? "other"] ?? PART_BASE_COST.other;
    const mult = SEVERITY_MULTIPLIER[p.severity ?? "MODERATE"] ?? 1.0;
    low += base * mult * 0.8;
    high += base * mult * 1.3;
  }
  return { low: Math.round(low), high: Math.round(high) };
}

/** Standard VIN check-digit algorithm (position 9). */
export function vinChecksumValid(vin?: string | null): boolean {
  if (!vin || vin.length !== 17) return false;
  const letterValues: Record<string, number> = {
    A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, J: 1, K: 2, L: 3, M: 4,
    N: 5, P: 7, R: 9, S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9,
  };
  const weights = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];
  let total = 0;
  for (let i = 0; i < 17; i++) {
    const c = vin[i].toUpperCase();
    const val = /[0-9]/.test(c) ? parseInt(c, 10) : letterValues[c];
    if (val === undefined) return false;
    total += val * weights[i];
  }
  const check = total % 11;
  const checkChar = check === 10 ? "X" : String(check);
  return checkChar === vin[8].toUpperCase();
}

export async function analyzeVehicleDamage(
  imageUrls: string[],
  vin?: string | null,
  notes?: string | null
) {
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  const imageParts = await Promise.all(
    imageUrls.map(async (url) => {
      const res = await fetch(url);
      const buf = Buffer.from(await res.arrayBuffer());
      return {
        inlineData: {
          data: buf.toString("base64"),
          mimeType: res.headers.get("content-type") || "image/jpeg",
        },
      };
    })
  );

  let prompt = ANALYSIS_PROMPT;
  if (vin) prompt += `\n\nCustomer-provided VIN: ${vin}. Use only as context.`;
  if (notes) prompt += `\n\nCustomer notes: ${notes}`;

  const result = await model.generateContent([prompt, ...imageParts]);
  return parseJsonResponse(result.response.text());
}
