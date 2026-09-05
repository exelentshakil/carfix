import { NextResponse } from "next/server";
import { decodeVinWithNhtsa } from "@/lib/vinService";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const vin = searchParams.get("vin");

  if (!vin || vin.trim().length !== 17) {
    return NextResponse.json(
      { error: "A valid 17-character VIN is required" },
      { status: 400 }
    );
  }

  const cleanVin = vin.trim().toUpperCase();
  const vehicle = await decodeVinWithNhtsa(cleanVin);

  if (!vehicle) {
    return NextResponse.json(
      { error: "Could not decode vehicle specifications for this VIN" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    vehicle,
  });
}
