import { inngest } from "./client";
import { supabaseAdmin } from "@/lib/supabase";
import { analyzeVehicleDamage, estimateCost } from "@/lib/gemini";

export const analyzeCarDamage = inngest.createFunction(
  { id: "analyze-car-damage", retries: 2 },
  { event: "car/analysis.requested" },
  async ({ event, step }) => {
    const { analysisId, imageUrls, vin, notes } = event.data as {
      analysisId: string;
      imageUrls: string[];
      vin: string | null;
      notes: string | null;
    };

    try {
      const aiResult = await step.run("call-gemini", () =>
        analyzeVehicleDamage(imageUrls, vin, notes)
      );

      const costRange = await step.run("estimate-cost", () =>
        estimateCost(aiResult.parts || [])
      );

      await step.run("save-results", async () => {
        const vehicle = aiResult.vehicle || {};

        await supabaseAdmin
          .from("analyses")
          .update({
            status: "COMPLETED",
            detected_make: vehicle.make ?? null,
            detected_model: vehicle.model ?? null,
            detected_year: vehicle.year ?? null,
            vehicle_confidence: vehicle.confidence ?? null,
            cost_low: costRange.low,
            cost_high: costRange.high,
            completed_at: new Date().toISOString(),
          })
          .eq("id", analysisId);

        const parts = (aiResult.parts || []).map((p: any, i: number) => ({
          analysis_id: analysisId,
          position: i + 1,
          name: p.name,
          part_type: p.partType,
          damage_type: p.damageType,
          severity: p.severity,
          description: p.description,
          confidence: p.confidence,
          // No parts catalog connected yet — never fabricate a number.
          oem: null,
          oem_status: "PENDING",
        }));

        if (parts.length) {
          await supabaseAdmin.from("parts").insert(parts);
        }
      });

      return { analysisId, status: "COMPLETED" };
    } catch (err) {
      // All retries exhausted — mark the row FAILED so the UI stops polling
      // instead of spinning forever.
      await supabaseAdmin
        .from("analyses")
        .update({
          status: "FAILED",
          error_message: err instanceof Error ? err.message : "Unknown error",
        })
        .eq("id", analysisId);
      throw err;
    }
  }
);
