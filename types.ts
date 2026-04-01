
export interface Appliance {
  id: string;
  name: string;
  watts: number;
  icon: string;
}

export interface UserInput {
  location: string;
  monthlyBill: number;
  appliances: Record<string, number>;
  houseType: string;
}

export interface SubsidyScheme {
  name: string;
  details: string;
  eligibility: string;
  applicationProcess: string;
  link: string;
}

export interface SolarAnalysis {
  id: string;
  timestamp: number;
  input: UserInput;
  recommendedCapacityKw: number;
  estimatedPanels: number;
  monthlySavings: number;
  paybackYears: number;
  co2Reduction: number;
  investmentCost: number;
  potentialScore: number;
  graphData: {
    year: number;
    cumulativeSavings: number;
    initialCost: number;
  }[];
  subsidies: SubsidyScheme[];
  localProviders: {
    name: string;
    description: string;
    url: string;
  }[];
  detailedAnalysis: string;
}
