import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { calculateCostEstimate, lookupOemPart } from '@/lib/pricingRules';
import { decodeVinWithNhtsa } from '@/lib/vinService';

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: Request) {
  try {
    const { images, vin, vehicle: clientVehicle } = await request.json();

    // Enforce REQUIRED VIN
    if (!vin || typeof vin !== 'string' || vin.trim().length !== 17) {
      return NextResponse.json(
        { error: 'A valid 17-character VIN is required for US collision estimation.' },
        { status: 400 }
      );
    }

    const cleanVin = vin.trim().toUpperCase();

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ error: 'At least one damage photo is required.' }, { status: 400 });
    }

    // Resolve vehicle specifications via NHTSA US Government API
    let vehicle = clientVehicle;
    if (!vehicle || !vehicle.make) {
      const decoded = await decodeVinWithNhtsa(cleanVin);
      if (decoded) {
        vehicle = decoded;
      } else {
        vehicle = {
          vin: cleanVin,
          make: 'Identified Vehicle',
          model: 'Model',
          year: new Date().getFullYear(),
        };
      }
    }

    if (!process.env.GEMINI_API_KEY) {
      console.warn('GEMINI_API_KEY is not set. Returning mock US collision data.');
      return NextResponse.json(getMockResponse(cleanVin, vehicle));
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

    // Convert base64 images to the format Gemini expects
    const imageParts = images.map((base64Image: string) => {
      const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
      return {
        inlineData: {
          data: base64Data,
          mimeType: 'image/jpeg',
        },
      };
    });

    const prompt = `
      You are an expert US auto body collision estimator. Analyze these photos of a damaged vehicle.
      The verified vehicle information from the US NHTSA VIN database is:
      - VIN: ${cleanVin}
      - Year: ${vehicle.year || 'Unknown'}
      - Make: ${vehicle.make || 'Unknown'}
      - Model: ${vehicle.model || 'Unknown'}
      - Trim/Series: ${vehicle.trim || 'Standard'}
      - Body: ${vehicle.bodyClass || 'Sedan/SUV'}

      Please respond ONLY with a valid JSON object. Do not include markdown formatting or backticks.

      Extract the following information:
      1. Confidence score for damage detection (0.0 to 1.0).
      2. A list of damaged parts detected in the photos. For each part, provide:
         - partName: strictly use one of: bumper_front, bumper_rear, fender, door, hood, grille, headlight, taillight, glass, wheel, other.
         - description: brief plain-English description of the damage observed.
         - severity: strictly use one of: LIGHT, MODERATE, SEVERE.
           (LIGHT = paint scuff/scratch/minor surface dent, MODERATE = crack/crease/medium dent, SEVERE = major structural deformation or puncture requiring full replacement).

      Example JSON output format:
      {
        "confidence": 0.95,
        "findings": [
          {
            "partName": "bumper_front",
            "description": "Deep gouge and crack on front passenger corner",
            "severity": "MODERATE"
          }
        ]
      }
    `;

    const result = await model.generateContent([prompt, ...imageParts]);
    const responseText = result.response.text();

    // Clean up markdown fences if present
    const jsonString = responseText.replace(/```json\n?|\n?```/g, '').trim();

    let parsedData;
    try {
      parsedData = JSON.parse(jsonString);
    } catch (e) {
      console.error('Failed to parse Gemini response:', jsonString);
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    // Calculate US-based pricing and lookup OEM numbers
    let totalLow = 0;
    let totalHigh = 0;
    let overallSeverity = 'LIGHT';

    const findings = Array.isArray(parsedData.findings) ? parsedData.findings : [];
    const processedFindings = findings.map((finding: any, index: number) => {
      const estimate = calculateCostEstimate(finding.partName, finding.severity);
      totalLow += estimate.low;
      totalHigh += estimate.high;

      if (finding.severity === 'SEVERE') overallSeverity = 'SEVERE';
      else if (finding.severity === 'MODERATE' && overallSeverity !== 'SEVERE') overallSeverity = 'MODERATE';

      const oemNumber = lookupOemPart(
        vehicle.make,
        vehicle.model,
        vehicle.year,
        finding.partName
      );

      return {
        id: `f_${Date.now()}_${index}`,
        name: formatPartName(finding.partName),
        rawPartName: finding.partName,
        description: finding.description,
        severity: finding.severity,
        costLow: estimate.low,
        costHigh: estimate.high,
        oemNumber: oemNumber,
        oemStatus: oemNumber ? "RESOLVED" : "PENDING"
      };
    });

    return NextResponse.json({
      id: `est_${Date.now()}`,
      vin: cleanVin,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      trim: vehicle.trim || null,
      bodyClass: vehicle.bodyClass || null,
      confidence: parsedData.confidence || 0.95,
      severityOverall: overallSeverity,
      costRangeLow: totalLow || 450,
      costRangeHigh: totalHigh || 850,
      findings: processedFindings,
      createdAt: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Error in analyze API:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

function formatPartName(name: string): string {
  return name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

function getMockResponse(vin: string, vehicle: any) {
  return {
    id: `est_mock_${Date.now()}`,
    vin: vin,
    make: vehicle?.make || "Audi",
    model: vehicle?.model || "A3",
    year: vehicle?.year || 2019,
    trim: vehicle?.trim || "Premium Plus",
    bodyClass: vehicle?.bodyClass || "Sedan",
    confidence: 0.96,
    severityOverall: "SEVERE",
    costRangeLow: 2400,
    costRangeHigh: 3100,
    findings: [
      {
        id: "f_1",
        name: "Front Bumper",
        rawPartName: "bumper_front",
        description: "Significant impact damage on the right side. Deformation and cracking visible.",
        severity: "SEVERE",
        costLow: 1400,
        costHigh: 1800,
        oemNumber: "8V5-807-065-GRU",
        oemStatus: "RESOLVED"
      },
      {
        id: "f_2",
        name: "Right Fender",
        rawPartName: "fender",
        description: "Dents and paint scratching extending from the bumper impact area.",
        severity: "MODERATE",
        costLow: 650,
        costHigh: 850,
        oemNumber: null,
        oemStatus: "PENDING"
      },
      {
        id: "f_3",
        name: "Right Headlight",
        rawPartName: "headlight",
        description: "Minor scuffing on the lens cover and mounting tab hairline fracture.",
        severity: "LIGHT",
        costLow: 350,
        costHigh: 450,
        oemNumber: "8V0-941-006-D",
        oemStatus: "RESOLVED"
      }
    ],
    createdAt: new Date().toISOString()
  };
}
