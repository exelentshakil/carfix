import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { supabaseAdmin } from "@/lib/supabase";
import { inngest } from "@/inngest/client";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const files = formData.getAll("images") as File[];
  const vin = (formData.get("vin") as string) || null;
  const notes = (formData.get("notes") as string) || null;

  if (!files.length) {
    return NextResponse.json({ error: "At least one photo is required" }, { status: 400 });
  }

  const analysisId = randomUUID();
  const imageUrls: string[] = [];

  for (const [i, file] of files.slice(0, 10).entries()) {
    const buf = Buffer.from(await file.arrayBuffer());
    const path = `${analysisId}/${i}-${file.name}`;

    const { error } = await supabaseAdmin.storage.from("car-photos").upload(path, buf, {
      contentType: file.type,
    });
    if (error) {
      return NextResponse.json({ error: `Upload failed: ${error.message}` }, { status: 500 });
    }

    const { data } = supabaseAdmin.storage.from("car-photos").getPublicUrl(path);
    imageUrls.push(data.publicUrl);
  }

  const { error: insertError } = await supabaseAdmin.from("analyses").insert({
    id: analysisId,
    status: "PROCESSING",
    vin,
    image_urls: imageUrls,
  });
  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // Returns immediately — the actual Gemini calls run in the Inngest
  // background function, not in this request, so this never hits Vercel's
  // function timeout no matter how many photos are uploaded.
  await inngest.send({
    name: "car/analysis.requested",
    data: { analysisId, imageUrls, vin, notes },
  });

  return NextResponse.json({ id: analysisId, status: "PROCESSING" });
}
