export type HardGateStatus = 'PASS' | 'FAIL' | 'UNVERIFIED';
export type ChinaRiskStatus = 'LOW RISK' | 'MEDIUM RISK' | 'HIGH RISK';

export interface EvaluationPillar {
  pillarNumber: number;
  name: string;
  categoryKey: 'financial' | 'highPower' | 'traceability' | 'quality' | 'costProxy' | 'logistics' | 'cybersecurity';
  score: number; // 1.0 to 5.0
  evidence: string;
}

export interface HighPowerCapabilities {
  heavyCopper: boolean; // >= 4oz
  heavyCopperDetail: string;
  sicGanAssembly: boolean; // SiC/GaN wide-bandgap reflow & voiding control
  sicGanDetail: string;
  thermalCycling: boolean; // -40C to +125C
  thermalCyclingDetail: string;
  highVoltagePotting: boolean; // Dielectric potting & test >5kV
  highVoltagePottingDetail: string;
  ipcA610Class3: boolean; // High reliability class 3 inspection
  ipcDetail: string;
}

export interface HardGates {
  iso9001: HardGateStatus;
  iso9001Registrar?: string;
  chinaFreeRisk: ChinaRiskStatus;
  chinaFreeRationale: string;
  highPowerVerified: boolean;
}

export interface EMSDossier {
  id: string;
  name: string;
  tickerOrOwnership: string;
  tier: 'Tier 1' | 'Tier 2' | 'Tier 3';
  headquarters: string;
  primaryFacilities: string[];
  regionCategory: 'US Domestic' | 'USMCA / Mexico' | 'Allied Europe' | 'Allied APAC' | 'Non-Compliant / Asia';
  hardGates: HardGates;
  pillars: EvaluationPillar[];
  compositeScore: number;
  strengths: string[];
  redFlags: string[];
  recommendedRfiQuestions: string[];
  highPower: HighPowerCapabilities;
  certifications: string[];
  itarRegistered: boolean;
  taaCompliant: boolean;
  operatingMarginProxy: string;
  revenueEst: string;
}

export interface TechnicalAuditItem {
  id: string;
  category: 'hardGates' | 'highPower' | 'traceability' | 'quality' | 'cybersecurity';
  title: string;
  description: string;
  isHardGate?: boolean;
  weight: number;
  score: number; // 1 to 5
  notes: string;
  status: 'pass' | 'fail' | 'partial' | 'pending';
}

export interface RFQSpecification {
  projectName: string;
  operatingVoltage: string;
  continuousCurrent: string;
  copperWeightOz: number;
  powerSemiconductors: string[];
  thermalShockMinMax: string;
  pottingMaterial: string;
  dielectricWithstandKv: number;
  ipcClass: 'IPC-A-610 Class 3' | 'IPC-A-610 Class 2';
  requireItar: boolean;
  requireTaa: boolean;
  ndaa889Mandate: boolean;
  requireIso9001: boolean;
  requireAs9100: boolean;
  requireIatf16949: boolean;
  programmingStationAirGapped: boolean;
}

export interface Level2PillarComparison {
  pillarNumber: number;
  name: string;
  categoryKey: 'financial' | 'highPower' | 'traceability' | 'quality' | 'costProxy' | 'logistics' | 'cybersecurity';
  level1Score: number;
  level2Score: number;
  scoreDelta: number;
  verifiedFindings: string;
  rfiRfqQuoteSnippet: string;
}

export interface Level2Commercials {
  unitPriceUsd: number;
  targetPriceUsd: number;
  nreToolingUsd: number;
  prototypeLeadTimeWeeks: number;
  productionLeadTimeWeeks: number;
  moqUnits: number;
  paymentTerms: string;
  warrantyYears: number;
  competitivenessRating: 'Aggressive / Favorable' | 'Market Baseline' | 'Premium / Above Market';
}

export interface Level2TechnicalVerification {
  voidingVerifiedPct: number;
  voidingCompliance: 'PASS' | 'FAIL' | 'UNVERIFIED';
  heavyCopperVerification: string;
  dielectricPottingTestKv: number;
  dielectricCompliance: 'PASS' | 'FAIL';
  thermalCyclingReport: string;
  ipcClass3Attestation: boolean;
  allocatedFacility: string;
  dedicatedLine: boolean;
}

export interface Level2RegulatoryAttestations {
  iso9001CertificateValidated: boolean;
  isoRegistrarAuditLog: string;
  ndaa889AttestationSigned: boolean;
  taaOriginCertified: boolean;
  itarDivisionAllocated: boolean;
  airGappedFlashingVerified: boolean;
}

export interface Level2Evaluation {
  id: string;
  supplierId: string;
  supplierName: string;
  projectName: string;
  evaluatedAt: string;
  evaluationType: 'RFI Technical Response' | 'RFQ Commercial Bid' | 'Dual RFI / RFQ Submission';
  verdict: 'AWARD RECOMMENDED' | 'CONDITIONALLY QUALIFIED (CAR REQUIRED)' | 'REJECTED / NON-COMPLIANT';
  verdictRationale: string;
  level1Composite: number;
  level2Composite: number;
  compositeDelta: number;
  commercials: Level2Commercials;
  technicalVerification: Level2TechnicalVerification;
  regulatoryAttestations: Level2RegulatoryAttestations;
  pillars: Level2PillarComparison[];
  contractRedlines: string[];
  discrepanciesAgainstL1: string[];
  executiveRecommendation: string;
  rawSubmissionText?: string;
}

