export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { addMockLead, getMockLeads, LeadRecord } from '@/lib/leadStore';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken } from '@/lib/adminAuth';

export async function GET(request: Request) {
  try {
    if (process.env.ADMIN_PASSWORD) {
      const cookieStore = await cookies();
      const sessionToken = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
      if (!verifyAdminSessionToken(sessionToken)) {
        return NextResponse.json({ error: 'Unauthorized. Admin password required.' }, { status: 401 });
      }
    }
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search')?.toLowerCase();
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    // Try Supabase first if configured
    const hasSupabase = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
    if (hasSupabase) {
      try {
        let query = supabaseAdmin
          .from('carfix_leads')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit);

        if (status && status !== 'ALL') {
          query = query.eq('status', status);
        }

        const { data, error } = await query;

        if (!error && data && data.length > 0) {
          let results: LeadRecord[] = data.map((d: any) => ({
            id: d.id,
            fullName: d.full_name,
            phone: d.phone,
            email: d.email,
            vehicleYear: d.vehicle_year,
            vehicleMake: d.vehicle_make,
            vehicleModel: d.vehicle_model,
            vehicleTrim: d.vehicle_trim,
            vehicleBody: d.vehicle_body,
            transmission: d.transmission,
            fuelType: d.fuel_type,
            vin: d.vin,
            notes: d.notes,
            imageUrls: d.image_urls || [],
            estimatedCostLow: d.estimated_cost_low ? Number(d.estimated_cost_low) : null,
            estimatedCostHigh: d.estimated_cost_high ? Number(d.estimated_cost_high) : null,
            damageSummary: d.damage_summary,
            status: d.status || 'NEW',
            analysisId: d.analysis_id,
            internalNotes: d.internal_notes,
            createdAt: d.created_at,
            updatedAt: d.updated_at,
          }));

          if (search) {
            results = results.filter(
              (lead) =>
                lead.fullName.toLowerCase().includes(search) ||
                lead.phone.toLowerCase().includes(search) ||
                lead.email.toLowerCase().includes(search) ||
                (lead.vin && lead.vin.toLowerCase().includes(search)) ||
                (lead.vehicleMake && lead.vehicleMake.toLowerCase().includes(search)) ||
                (lead.vehicleModel && lead.vehicleModel.toLowerCase().includes(search))
            );
          }

          return NextResponse.json({
            success: true,
            leads: results,
            count: results.length,
            source: 'SUPABASE',
          });
        }
      } catch (dbErr) {
        console.warn('Supabase query failed, falling back to mock leads store:', dbErr);
      }
    }

    // Fallback store
    let leads = getMockLeads();

    if (status && status !== 'ALL') {
      leads = leads.filter((lead) => lead.status === status);
    }

    if (search) {
      leads = leads.filter(
        (lead) =>
          lead.fullName.toLowerCase().includes(search) ||
          lead.phone.toLowerCase().includes(search) ||
          lead.email.toLowerCase().includes(search) ||
          (lead.vin && lead.vin.toLowerCase().includes(search)) ||
          (lead.vehicleMake && lead.vehicleMake.toLowerCase().includes(search)) ||
          (lead.vehicleModel && lead.vehicleModel.toLowerCase().includes(search))
      );
    }

    return NextResponse.json({
      success: true,
      leads: leads.slice(0, limit),
      count: leads.length,
      source: 'MOCK_STORE',
    });
  } catch (error: any) {
    console.error('Error fetching leads:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch leads' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      fullName,
      phone,
      email,
      vehicleYear,
      vehicleMake,
      vehicleModel,
      vehicleTrim,
      vehicleBody,
      transmission,
      fuelType,
      vin,
      notes,
      imageUrls,
      estimatedCostLow,
      estimatedCostHigh,
      damageSummary,
      analysisId,
    } = body;

    if (!fullName || !phone || !email) {
      return NextResponse.json(
        { error: 'Name, phone number, and email are required for lead capture.' },
        { status: 400 }
      );
    }

    const leadRecord: LeadRecord = {
      id: `lead_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
      vehicleYear: vehicleYear ? parseInt(String(vehicleYear), 10) : null,
      vehicleMake: vehicleMake || null,
      vehicleModel: vehicleModel || null,
      vehicleTrim: vehicleTrim || null,
      vehicleBody: vehicleBody || null,
      transmission: transmission || null,
      fuelType: fuelType || null,
      vin: vin ? vin.trim().toUpperCase() : null,
      notes: notes || null,
      imageUrls: Array.isArray(imageUrls) ? imageUrls : [],
      estimatedCostLow: estimatedCostLow ? Number(estimatedCostLow) : null,
      estimatedCostHigh: estimatedCostHigh ? Number(estimatedCostHigh) : null,
      damageSummary: damageSummary || null,
      status: 'NEW',
      analysisId: analysisId || null,
      internalNotes: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Attempt Supabase insert
    const hasSupabase = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
    if (hasSupabase) {
      try {
        const { data, error } = await supabaseAdmin
          .from('carfix_leads')
          .insert([
            {
              id: leadRecord.id,
              full_name: leadRecord.fullName,
              phone: leadRecord.phone,
              email: leadRecord.email,
              vehicle_year: leadRecord.vehicleYear,
              vehicle_make: leadRecord.vehicleMake,
              vehicle_model: leadRecord.vehicleModel,
              vehicle_trim: leadRecord.vehicleTrim,
              vehicle_body: leadRecord.vehicleBody,
              transmission: leadRecord.transmission,
              fuel_type: leadRecord.fuelType,
              vin: leadRecord.vin,
              notes: leadRecord.notes,
              image_urls: leadRecord.imageUrls,
              estimated_cost_low: leadRecord.estimatedCostLow,
              estimated_cost_high: leadRecord.estimatedCostHigh,
              damage_summary: leadRecord.damageSummary,
              status: leadRecord.status,
              analysis_id: leadRecord.analysisId,
              internal_notes: leadRecord.internalNotes,
            },
          ])
          .select()
          .single();

        if (!error && data) {
          // Also track in fallback memory
          addMockLead(leadRecord);
          return NextResponse.json({
            success: true,
            lead: leadRecord,
            source: 'SUPABASE',
          });
        }
      } catch (dbErr) {
        console.warn('Supabase lead insertion failed, recording in local store:', dbErr);
      }
    }

    // Persist in mock store
    addMockLead(leadRecord);

    return NextResponse.json({
      success: true,
      lead: leadRecord,
      source: 'MOCK_STORE',
    });
  } catch (error: any) {
    console.error('Error saving lead:', error);
    return NextResponse.json({ error: error.message || 'Failed to save lead' }, { status: 500 });
  }
}
