import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  
  const { data: analysis, error } = await supabaseAdmin
    .from("analyses")
    .select("*")
    .eq("id", resolvedParams.id)
    .single();

  if (error || !analysis) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: parts } = await supabaseAdmin
    .from("parts")
    .select("*")
    .eq("analysis_id", resolvedParams.id)
    .order("position");

  return NextResponse.json({ ...analysis, parts: parts || [] });
}
