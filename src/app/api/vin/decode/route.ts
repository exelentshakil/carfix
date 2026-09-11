export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { decodeVinWithNhtsa, decodeVinFallback } from "@/lib/vinService";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawVin = searchParams.get("vin");

  if (!rawVin) {
    return NextResponse.json(
      { error: "A valid 17-character VIN is required" },
      { status: 400 }
    );
  }

  // Clean VIN: remove whitespace, hyphens, non-alphanumeric characters
  const cleanVin = rawVin.trim().toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, '');

  if (cleanVin.length !== 17) {
    return NextResponse.json(
      { error: `VIN must be exactly 17 characters (received ${cleanVin.length}/17)` },
      { status: 400 }
    );
  }

  let vehicle = await decodeVinWithNhtsa(cleanVin);

  if (!vehicle) {
    vehicle = decodeVinFallback(cleanVin);
  }

  return NextResponse.json({
    success: true,
    vehicle,
  });
}
