export interface EstimateRequest {
  vin?: string;
  images: string[]; // Base64 encoded or URLs
}

export interface DamageFinding {
  id: string;
  name: string;
  description: string;
  damageType: string;
  severity: "LIGHT" | "MODERATE" | "SEVERE";
  oemNumber: string | null;
  oemStatus: "RESOLVED" | "PENDING";
  position: string;
}

export interface EstimateResponse {
  id: string;
  status: "PROCESSING" | "COMPLETED" | "FAILED";
  vin?: string;
  detectedMake?: string;
  detectedModel?: string;
  detectedYear?: number;
  vehicleConfidence: number;
  severityOverall: "LIGHT" | "MODERATE" | "SEVERE";
  costRangeLow: number;
  costRangeHigh: number;
  imageUrls: string[];
  findings: DamageFinding[];
  createdAt: string;
}

// Mock API for CCC integration
export const mockCCCAPI = {
  createEstimate: async (request: EstimateRequest): Promise<EstimateResponse> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    const id = `est_${Math.random().toString(36).substring(2, 9)}`;
    const now = new Date().toISOString();

    return {
      id,
      status: "COMPLETED",
      vin: request.vin,
      detectedMake: "Honda",
      detectedModel: "Civic",
      detectedYear: 2022,
      vehicleConfidence: 0.95,
      severityOverall: "MODERATE",
      costRangeLow: 1200,
      costRangeHigh: 2500,
      imageUrls: request.images.slice(0, 5), // Keep it reasonable for mock
      findings: [
        {
          id: `f_${Math.random().toString(36).substring(2, 9)}`,
          name: "Front Bumper Cover",
          description: "Significant scratching and minor deformation on the left side.",
          damageType: "Scratch/Dent",
          severity: "MODERATE",
          oemNumber: "04711-T2F-A90ZZ",
          oemStatus: "RESOLVED",
          position: "Front Left"
        },
        {
          id: `f_${Math.random().toString(36).substring(2, 9)}`,
          name: "Left Fender",
          description: "Deep scratch, paint missing.",
          damageType: "Scratch",
          severity: "LIGHT",
          oemNumber: null,
          oemStatus: "PENDING",
          position: "Left Front"
        }
      ],
      createdAt: now
    };
  }
};
