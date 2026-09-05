export interface DecodedVehicle {
  vin: string;
  make: string;
  model: string;
  year: number;
  trim?: string;
  bodyClass?: string;
  engine?: string;
  plantCountry?: string;
}

/**
 * Standard ISO 3779 VIN checksum calculation (check digit at position 9)
 */
export function vinChecksumValid(vin?: string | null): boolean {
  if (!vin || vin.length !== 17) return false;
  const cleanVin = vin.toUpperCase();

  // Standard VIN characters exclude I, O, Q to avoid confusion with 1 and 0
  if (/[IOQ]/.test(cleanVin)) return false;

  const letterValues: Record<string, number> = {
    A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, J: 1, K: 2, L: 3, M: 4,
    N: 5, P: 7, R: 9, S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9,
  };
  const weights = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];
  let total = 0;
  for (let i = 0; i < 17; i++) {
    const c = cleanVin[i];
    const val = /[0-9]/.test(c) ? parseInt(c, 10) : letterValues[c];
    if (val === undefined) return false;
    total += val * weights[i];
  }
  const check = total % 11;
  const checkChar = check === 10 ? "X" : String(check);
  return checkChar === cleanVin[8];
}

/**
 * Decode 17-digit VIN using official US Department of Transportation (NHTSA vPIC)
 * 100% Free, no API key required, authoritative for US market.
 */
export async function decodeVinWithNhtsa(vin: string): Promise<DecodedVehicle | null> {
  const cleanVin = vin.trim().toUpperCase();
  if (cleanVin.length !== 17) return null;

  try {
    const res = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues/${encodeURIComponent(cleanVin)}?format=json`,
      { next: { revalidate: 86400 } }
    );

    if (!res.ok) {
      console.error(`NHTSA API error: HTTP ${res.status}`);
      return null;
    }

    const data = await res.json();
    const result = data.Results?.[0];

    if (!result || !result.Make || result.ErrorCode !== "0") {
      // If error code is not 0, still check if Make & Model are populated
      if (!result?.Make || !result?.Model) {
        return null;
      }
    }

    const year = parseInt(result.ModelYear, 10);

    return {
      vin: cleanVin,
      make: result.Make,
      model: result.Model,
      year: isNaN(year) ? new Date().getFullYear() : year,
      trim: result.Series || result.Trim || undefined,
      bodyClass: result.BodyClass || undefined,
      engine: result.DisplacementL ? `${result.DisplacementL}L ${result.EngineConfiguration || ""}`.trim() : undefined,
      plantCountry: result.PlantCountry || undefined,
    };
  } catch (error) {
    console.error("Failed to decode VIN with NHTSA:", error);
    return null;
  }
}
