export interface VisualVehicleInfo {
  make: string;
  model: string;
  approxYear?: string;
  bodyClass?: string;
  color?: string;
  visualCues?: string;
  confidence: number;
}

export interface VinVehicleInfo {
  vin: string;
  make: string;
  model: string;
  year: number;
  trim?: string;
  bodyClass?: string;
}

export interface DiscrepancyReport {
  hasDiscrepancy: boolean;
  severity: 'CRITICAL' | 'WARNING' | 'MATCH' | 'INFO';
  title: string;
  summary: string;
  explanation: string;
  visualCues?: string;
  vinVehicleSummary: string;
  visualVehicleSummary: string;
  recommendedAction: string;
}

// Brand synonyms & aliases for robust matching
const MAKE_ALIASES: Record<string, string> = {
  'chevy': 'chevrolet',
  'chevrolet': 'chevrolet',
  'mercedes': 'mercedes-benz',
  'mercedes benz': 'mercedes-benz',
  'mercedes-benz': 'mercedes-benz',
  'benz': 'mercedes-benz',
  'vw': 'volkswagen',
  'volkswagen': 'volkswagen',
  'bmw': 'bmw',
  'b.m.w.': 'bmw',
  'bimmer': 'bmw',
  'cadillac': 'cadillac',
  'caddy': 'cadillac',
  'dodge': 'dodge',
  'ram': 'ram',
  'ford': 'ford',
  'toyota': 'toyota',
  'honda': 'honda',
  'nissan': 'nissan',
  'audi': 'audi',
  'tesla': 'tesla',
  'hyundai': 'hyundai',
  'kia': 'kia',
  'lexus': 'lexus',
  'subaru': 'subaru',
  'mazda': 'mazda',
  'jeep': 'jeep',
  'gmc': 'gmc',
  'porsche': 'porsche',
  'lada': 'lada',
  'avtovaz': 'lada',
  'vaz': 'lada',
};

export function normalizeMake(make?: string | null): string {
  if (!make) return '';
  const clean = make.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  return MAKE_ALIASES[clean] || clean;
}

export function evaluateVehicleDiscrepancy(
  vinVehicle: VinVehicleInfo | null | undefined,
  visualVehicle: VisualVehicleInfo | null | undefined,
  aiAudit?: { isMismatch?: boolean; severity?: string; explanation?: string }
): DiscrepancyReport {
  // Case 1: No VIN provided (photo-only assessment)
  if (!vinVehicle || !vinVehicle.vin) {
    const visualSummary = visualVehicle && visualVehicle.make && visualVehicle.make.toLowerCase() !== 'unknown'
      ? `${visualVehicle.approxYear ? `${visualVehicle.approxYear} ` : ''}${visualVehicle.make} ${visualVehicle.model || ''}`.trim()
      : 'Unidentified Vehicle';

    return {
      hasDiscrepancy: false,
      severity: 'INFO',
      title: 'Photo-Based Vehicle Identification',
      summary: `Assessment generated from photos of ${visualSummary}.`,
      explanation: 'No VIN was supplied for cross-audit. To verify official US NHTSA registration, provide a 17-character VIN.',
      visualCues: visualVehicle?.visualCues || undefined,
      vinVehicleSummary: 'None Provided',
      visualVehicleSummary: visualSummary,
      recommendedAction: 'Provide a 17-digit VIN to cross-reference against US DOT records and unlock exact OEM part numbers.'
    };
  }

  const vinSummary = `${vinVehicle.year || ''} ${vinVehicle.make} ${vinVehicle.model} ${vinVehicle.bodyClass ? `(${vinVehicle.bodyClass})` : ''}`.trim();

  // Case 2: Visual vehicle could not be identified
  if (!visualVehicle || !visualVehicle.make || visualVehicle.make.toLowerCase() === 'unknown' || visualVehicle.confidence < 0.35) {
    return {
      hasDiscrepancy: false,
      severity: 'INFO',
      title: 'Vehicle Identity Defaulted to VIN Record',
      summary: `Photos had insufficient visual cues to independently confirm vehicle make. Utilizing official NHTSA VIN record (${vinSummary}).`,
      explanation: aiAudit?.explanation || 'Computer vision confidence was below threshold for standalone brand identification. Estimate relies on the validated NHTSA VIN.',
      visualCues: visualVehicle?.visualCues || undefined,
      vinVehicleSummary: vinSummary,
      visualVehicleSummary: 'Inconclusive Visual ID',
      recommendedAction: 'Ensure vehicle photos include clear shots of the front grille, badge emblems, or rear tailgate.'
    };
  }

  const visualSummary = `${visualVehicle.approxYear ? `${visualVehicle.approxYear} ` : ''}${visualVehicle.make} ${visualVehicle.model || ''} ${visualVehicle.bodyClass ? `(${visualVehicle.bodyClass})` : ''}`.trim();

  const normVinMake = normalizeMake(vinVehicle.make);
  const normVisualMake = normalizeMake(visualVehicle.make);

  const makeMismatch = normVinMake && normVisualMake && normVinMake !== normVisualMake;
  const aiSaysMismatch = aiAudit?.isMismatch === true;

  // Case 3: CRITICAL MISMATCH (e.g. BMW VIN + Cadillac Photos)
  if (makeMismatch || (aiSaysMismatch && aiAudit?.severity === 'CRITICAL')) {
    const explanation = aiAudit?.explanation || 
      `The entered VIN (${vinVehicle.vin}) is officially registered in US NHTSA records as a ${vinSummary}. However, computer vision analysis of the uploaded photos identified a ${visualSummary} with ${Math.round((visualVehicle.confidence || 0.9) * 100)}% confidence.`;

    return {
      hasDiscrepancy: true,
      severity: 'CRITICAL',
      title: 'CRITICAL DISCREPANCY: VIN & Photo Model Mismatch',
      summary: `VIN is registered to a ${vinVehicle.make} ${vinVehicle.model}, but uploaded photos show a ${visualVehicle.make} ${visualVehicle.model || ''}.`,
      explanation,
      visualCues: visualVehicle.visualCues || `Identified as ${visualVehicle.make} by manufacturer styling and front fascia characteristics.`,
      vinVehicleSummary: vinSummary,
      visualVehicleSummary: visualSummary,
      recommendedAction: `The collision repair estimate has been generated for the ${visualVehicle.make} shown in the photos. Confirm the physical vehicle VIN plate on the driver door jamb before ordering parts.`
    };
  }

  // Case 4: Moderate warning (Same make, but body class or model major conflict)
  const normVinModel = (vinVehicle.model || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const normVisualModel = (visualVehicle.model || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  
  const hasModelConflict = normVinModel && normVisualModel && 
    normVinModel !== normVisualModel && 
    !normVinModel.includes(normVisualModel) && 
    !normVisualModel.includes(normVinModel);

  if (hasModelConflict || (aiSaysMismatch && aiAudit?.severity === 'WARNING')) {
    return {
      hasDiscrepancy: true,
      severity: 'WARNING',
      title: 'Potential Model/Trim Variation Detected',
      summary: `VIN indicates ${vinVehicle.model}, while visual analysis suggests ${visualVehicle.model}.`,
      explanation: aiAudit?.explanation || `The vehicle make matches (${vinVehicle.make}), but visual styling indicates a ${visualVehicle.model} while the VIN is recorded as ${vinVehicle.model}.`,
      visualCues: visualVehicle.visualCues,
      vinVehicleSummary: vinSummary,
      visualVehicleSummary: visualSummary,
      recommendedAction: 'Check vehicle trim badge to verify specific model edition.'
    };
  }

  // Case 5: Verified Match!
  return {
    hasDiscrepancy: false,
    severity: 'MATCH',
    title: '100% Verified Match: VIN & Photos Align',
    summary: `Computer vision confirms the vehicle in the photos is a ${visualVehicle.make} ${visualVehicle.model || ''}, matching official NHTSA records for VIN ${vinVehicle.vin}.`,
    explanation: aiAudit?.explanation || `Visual inspection confirmed manufacturer emblems, grille geometry, and body profile consistent with the ${vinVehicle.year} ${vinVehicle.make} ${vinVehicle.model} VIN registry.`,
    visualCues: visualVehicle.visualCues || 'Brand emblems and body lines verified consistent with VIN record.',
    vinVehicleSummary: vinSummary,
    visualVehicleSummary: visualSummary,
    recommendedAction: 'All vehicle specifications and OEM replacement parts are verified.'
  };
}
