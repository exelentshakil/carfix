export interface LeadRecord {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  vehicleYear?: number | null;
  vehicleMake?: string | null;
  vehicleModel?: string | null;
  vehicleTrim?: string | null;
  vehicleBody?: string | null;
  transmission?: string | null;
  fuelType?: string | null;
  vin?: string | null;
  notes?: string | null;
  imageUrls?: string[];
  estimatedCostLow?: number | null;
  estimatedCostHigh?: number | null;
  damageSummary?: string | null;
  status: 'NEW' | 'CONTACTED' | 'ESTIMATING' | 'WON' | 'LOST';
  analysisId?: string | null;
  internalNotes?: string | null;
  createdAt: string;
  updatedAt: string;
}

// In-memory store for fallback/local development when Supabase is unconfigured or offline
declare global {
  // eslint-disable-next-line no-var
  var __mockLeadsStore: LeadRecord[] | undefined;
}

const INITIAL_MOCK_LEADS: LeadRecord[] = [
  {
    id: 'lead_us_101',
    fullName: 'Michael Vance',
    phone: '(555) 234-8910',
    email: 'mvance.autocare@gmail.com',
    vehicleYear: 2022,
    vehicleMake: 'Toyota',
    vehicleModel: 'Camry',
    vehicleTrim: 'SE Nightshade',
    vehicleBody: 'Sedan',
    transmission: 'Automatic',
    fuelType: 'Gasoline',
    vin: '4T1B11HK5NU109823',
    notes: 'Backed into parking bollard. Scraped right bumper and rear quarter panel.',
    imageUrls: ['https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&q=80'],
    estimatedCostLow: 1850,
    estimatedCostHigh: 2450,
    damageSummary: 'Front & Rear Bumper Fascia fracture, right fender dent, lens scuff.',
    status: 'NEW',
    analysisId: 'est_sample_1',
    internalNotes: 'Called once, left voicemail. Very hot lead, needs car back before Monday.',
    createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
  },
  {
    id: 'lead_us_102',
    fullName: 'Sarah Jenkins',
    phone: '(310) 849-2219',
    email: 'sarah.j.design@outlook.com',
    vehicleYear: 2023,
    vehicleMake: 'BMW',
    vehicleModel: '330i',
    vehicleTrim: 'xDrive M Sport',
    vehicleBody: 'Sedan',
    transmission: 'Automatic',
    fuelType: 'Gasoline',
    vin: 'WBA5R1C08PA778219',
    notes: 'Sideswiped on freeway exit ramp. Driver door crease and mirror torn off.',
    imageUrls: ['https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&q=80'],
    estimatedCostLow: 3200,
    estimatedCostHigh: 4600,
    damageSummary: 'Severe door skin deformation, side mirror assembly replacement required, A-pillar scuff.',
    status: 'CONTACTED',
    analysisId: 'est_sample_2',
    internalNotes: 'Customer sent insurance claim info (State Farm). Estimator booked for Thursday 10am.',
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
  {
    id: 'lead_us_103',
    fullName: 'Robert Chen',
    phone: '(415) 609-4412',
    email: 'rchen.tech@gmail.com',
    vehicleYear: 2021,
    vehicleMake: 'Ford',
    vehicleModel: 'F-150',
    vehicleTrim: 'Lariat SuperCrew',
    vehicleBody: 'Pickup Truck',
    transmission: 'Automatic',
    fuelType: 'Hybrid',
    vin: '1FTFW1ED4MFB33819',
    notes: 'Front collision during heavy rain. Grille pushed in, hood bent upward.',
    imageUrls: ['https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&q=80'],
    estimatedCostLow: 4500,
    estimatedCostHigh: 6800,
    damageSummary: 'Front bumper, lower valance, radiator support, and aluminum hood replacement.',
    status: 'ESTIMATING',
    analysisId: 'est_sample_3',
    internalNotes: 'Parts sourced from local Ford OEM dealer. Waiting on customer deductible confirmation.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: 'lead_us_104',
    fullName: 'Elena Rostova',
    phone: '(206) 555-0144',
    email: 'elena.rostova@icloud.com',
    vehicleYear: 2024,
    vehicleMake: 'Tesla',
    vehicleModel: 'Model Y',
    vehicleTrim: 'Long Range AWD',
    vehicleBody: 'SUV',
    transmission: 'Automatic',
    fuelType: 'Electric',
    vin: '7SAYGDEE8PF192831',
    notes: 'Low-speed rear end accident at traffic stop.',
    imageUrls: ['https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&q=80'],
    estimatedCostLow: 2100,
    estimatedCostHigh: 2950,
    damageSummary: 'Rear bumper cover cracked, ultrasonic parking sensor dislodged, tailgate scuffed.',
    status: 'WON',
    analysisId: 'est_sample_4',
    internalNotes: 'Deposit collected ($500). Vehicle dropped off in bay 3.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  }
];

if (!global.__mockLeadsStore) {
  global.__mockLeadsStore = [...INITIAL_MOCK_LEADS];
}

export function getMockLeads(): LeadRecord[] {
  return global.__mockLeadsStore || INITIAL_MOCK_LEADS;
}

export function addMockLead(lead: LeadRecord): void {
  if (!global.__mockLeadsStore) {
    global.__mockLeadsStore = [...INITIAL_MOCK_LEADS];
  }
  global.__mockLeadsStore.unshift(lead);
}

export function updateMockLead(id: string, updates: Partial<LeadRecord>): LeadRecord | null {
  if (!global.__mockLeadsStore) {
    global.__mockLeadsStore = [...INITIAL_MOCK_LEADS];
  }
  const index = global.__mockLeadsStore.findIndex(l => l.id === id);
  if (index === -1) return null;
  const updated = {
    ...global.__mockLeadsStore[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  global.__mockLeadsStore[index] = updated;
  return updated;
}
