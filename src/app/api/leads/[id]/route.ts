export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getMockLeads, updateMockLead } from '@/lib/leadStore';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken } from '@/lib/adminAuth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (process.env.ADMIN_PASSWORD) {
      const cookieStore = await cookies();
      const sessionToken = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
      if (!verifyAdminSessionToken(sessionToken)) {
        return NextResponse.json({ error: 'Unauthorized. Admin password required.' }, { status: 401 });
      }
    }
    const { id } = await params;

    const hasSupabase = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
    if (hasSupabase) {
      try {
        const { data, error } = await supabaseAdmin
          .from('carfix_leads')
          .select('*')
          .eq('id', id)
          .single();

        if (!error && data) {
          return NextResponse.json({
            success: true,
            lead: {
              id: data.id,
              fullName: data.full_name,
              phone: data.phone,
              email: data.email,
              vehicleYear: data.vehicle_year,
              vehicleMake: data.vehicle_make,
              vehicleModel: data.vehicle_model,
              vehicleTrim: data.vehicle_trim,
              vehicleBody: data.vehicle_body,
              transmission: data.transmission,
              fuelType: data.fuel_type,
              vin: data.vin,
              notes: data.notes,
              imageUrls: data.image_urls || [],
              estimatedCostLow: data.estimated_cost_low ? Number(data.estimated_cost_low) : null,
              estimatedCostHigh: data.estimated_cost_high ? Number(data.estimated_cost_high) : null,
              damageSummary: data.damage_summary,
              status: data.status,
              analysisId: data.analysis_id,
              internalNotes: data.internal_notes,
              createdAt: data.created_at,
              updatedAt: data.updated_at,
            },
            source: 'SUPABASE',
          });
        }
      } catch (dbErr) {
        console.warn('Supabase find failed:', dbErr);
      }
    }

    const lead = getMockLeads().find((l) => l.id === id);
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, lead, source: 'MOCK_STORE' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (process.env.ADMIN_PASSWORD) {
      const cookieStore = await cookies();
      const patchSessionToken = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
      if (!verifyAdminSessionToken(patchSessionToken)) {
        return NextResponse.json({ error: 'Unauthorized. Admin password required.' }, { status: 401 });
      }
    }
    const { id } = await params;
    const updates = await request.json();

    const hasSupabase = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
    if (hasSupabase) {
      try {
        const dbUpdates: any = { updated_at: new Date().toISOString() };
        if (updates.status !== undefined) dbUpdates.status = updates.status;
        if (updates.internalNotes !== undefined) dbUpdates.internal_notes = updates.internalNotes;
        if (updates.estimatedCostLow !== undefined) dbUpdates.estimated_cost_low = updates.estimatedCostLow;
        if (updates.estimatedCostHigh !== undefined) dbUpdates.estimated_cost_high = updates.estimatedCostHigh;
        if (updates.damageSummary !== undefined) dbUpdates.damage_summary = updates.damageSummary;
        if (updates.analysisId !== undefined) dbUpdates.analysis_id = updates.analysisId;

        const { data, error } = await supabaseAdmin
          .from('carfix_leads')
          .update(dbUpdates)
          .eq('id', id)
          .select()
          .single();

        if (!error && data) {
          updateMockLead(id, updates);
          return NextResponse.json({
            success: true,
            lead: {
              id: data.id,
              fullName: data.full_name,
              phone: data.phone,
              email: data.email,
              vehicleYear: data.vehicle_year,
              vehicleMake: data.vehicle_make,
              vehicleModel: data.vehicle_model,
              vehicleTrim: data.vehicle_trim,
              vehicleBody: data.vehicle_body,
              transmission: data.transmission,
              fuelType: data.fuel_type,
              vin: data.vin,
              notes: data.notes,
              imageUrls: data.image_urls || [],
              estimatedCostLow: data.estimated_cost_low ? Number(data.estimated_cost_low) : null,
              estimatedCostHigh: data.estimated_cost_high ? Number(data.estimated_cost_high) : null,
              damageSummary: data.damage_summary,
              status: data.status,
              analysisId: data.analysis_id,
              internalNotes: data.internal_notes,
              createdAt: data.created_at,
              updatedAt: data.updated_at,
            },
            source: 'SUPABASE',
          });
        }
      } catch (dbErr) {
        console.warn('Supabase lead update failed, updating local store:', dbErr);
      }
    }

    const updated = updateMockLead(id, updates);
    if (!updated) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, lead: updated, source: 'MOCK_STORE' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
