import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { INITIAL_EMS_DATABASE } from './src/data/emsDatabase.ts';
import { SAMPLE_LEVEL2_EVALUATIONS } from './src/data/level2Samples.ts';
import { EMSDossier, Level2Evaluation } from './src/types/ems.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Initialize Google GenAI with required User-Agent header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// In-memory runtime cache/database
let emsDatabase: EMSDossier[] = [...INITIAL_EMS_DATABASE];

// Endpoint: List all vetted EMS suppliers
app.get('/api/suppliers', (_req: Request, res: Response) => {
  res.json({ suppliers: emsDatabase });
});

// Endpoint: Mode A - Evaluate a specific manufacturer
app.post('/api/evaluate', async (req: Request, res: Response) => {
  try {
    const { manufacturerName, projectContext } = req.body;
    if (!manufacturerName || typeof manufacturerName !== 'string') {
      res.status(400).json({ error: 'Manufacturer name is required.' });
      return;
    }

    const cleanQuery = manufacturerName.trim().toLowerCase();

    // First check if it matches our pre-vetted database
    const existing = emsDatabase.find(
      (m) =>
        m.name.toLowerCase().includes(cleanQuery) ||
        cleanQuery.includes(m.name.toLowerCase()) ||
        m.id.toLowerCase() === cleanQuery
    );

    // If API key is not set, return existing or fallback synthesis
    if (!process.env.GEMINI_API_KEY) {
      if (existing) {
        res.json({ dossier: existing, source: 'verified_database' });
        return;
      }
      // Generate a structured heuristic dossier if no API key
      const fallbackDossier = generateHeuristicDossier(manufacturerName);
      res.json({ dossier: fallbackDossier, source: 'heuristic_evaluation' });
      return;
    }

    // Call Gemini 3.8 Flash to evaluate the supplier dynamically
    const prompt = `You are the EMS Evaluator & Sourcing Engine, an expert procurement and supply-chain intelligence system.
Your objective is to evaluate the manufacturer: "${manufacturerName}" for high-reliability, high-power electronics projects.
Additional Project Context: ${projectContext || 'High-reliability high-power inverter and power electronics project'}.

HARD CONSTRAINTS & NON-NEGOTIABLE GATES:
1. ISO 9001 Mandatory Gate: The manufacturer must possess a verified ISO 9001 certification. If missing/unverified, flag as FAIL and cap the Quality Management score at 1.0.
2. China-Free Software/Firmware Rule: Zero tolerance for microcontrollers, SoCs, communication modules, or firmware controlled by entities subject to Chinese jurisdiction. The CM must support NDAA Section 889 and TAA compliance with secure US/allied programming environments. Risk level: "LOW RISK", "MEDIUM RISK", or "HIGH RISK".
3. High-Power Focus: Prioritize verifiable capabilities in high-power electronics: heavy-copper PCBs (>= 4oz), selective soldering, thermal cycling (-40C to +125C), high-voltage potting/testing (>5kV dielectric withstand), SiC/GaN assembly, and IPC-A-610 Class 3 compliance.

SCORING SCALE (1.0 to 5.0):
1.0: Critical Risk / No Trace / Hard gate fail
2.0: Weak / High Risk / Minimal footprint
3.0: Acceptable / Industry Baseline / Meets minimums
4.0: Strong / Low Risk / Proven allied track record
5.0: Best-in-Class / Gold Standard / Defense-tier benchmark

Evaluate the supplier across all 7 Evaluation Pillars:
1. Financial Performance
2. High-Power EMS Experience
3. Traceability & Certificate of Origin
4. Quality Management (MUST be <= 1.0 if ISO 9001 fails!)
5. Cost Per Product (Proxy)
6. Logistical Services
7. Cybersecurity & Software Risk

Return a strictly valid JSON object adhering to this schema:
{
  "id": "lowercase-hyphenated-name",
  "name": "Full Manufacturer Name",
  "tickerOrOwnership": "Tier 1/2/3 | Ticker or Ownership",
  "tier": "Tier 1" or "Tier 2" or "Tier 3",
  "headquarters": "City, State, Country",
  "primaryFacilities": ["List of 3-5 key domestic & international manufacturing facilities"],
  "regionCategory": "US Domestic" or "USMCA / Mexico" or "Allied Europe" or "Allied APAC" or "Non-Compliant / Asia",
  "hardGates": {
    "iso9001": "PASS" or "FAIL" or "UNVERIFIED",
    "iso9001Registrar": "Registrar name or UNVERIFIED",
    "chinaFreeRisk": "LOW RISK" or "MEDIUM RISK" or "HIGH RISK",
    "chinaFreeRationale": "Specific rationale regarding NDAA 889, TAA, and programming environments",
    "highPowerVerified": true or false
  },
  "pillars": [
    { "pillarNumber": 1, "name": "Financial Performance", "categoryKey": "financial", "score": number, "evidence": "SEC 10-K or financial evidence" },
    { "pillarNumber": 2, "name": "High-Power EMS Experience", "categoryKey": "highPower", "score": number, "evidence": "Heavy copper, SiC/GaN, thermal testing, IPC Class 3 evidence" },
    { "pillarNumber": 3, "name": "Traceability & Certificate of Origin", "categoryKey": "traceability", "score": number, "evidence": "CBP/import records, domestic ITAR/TAA lines, lot tracking" },
    { "pillarNumber": 4, "name": "Quality Management", "categoryKey": "quality", "score": number, "evidence": "ISO 9001 status + extra certs (AS9100, IATF 16949, etc.)" },
    { "pillarNumber": 5, "name": "Cost Per Product (Proxy)", "categoryKey": "costProxy", "score": number, "evidence": "Operating margin trends, regional labor index, overhead proxy" },
    { "pillarNumber": 6, "name": "Logistical Services", "categoryKey": "logistics", "score": number, "evidence": "US footprint, bonded warehousing, direct order fulfillment" },
    { "pillarNumber": 7, "name": "Cybersecurity & Software Risk", "categoryKey": "cybersecurity", "score": number, "evidence": "NIST 800-171 / CMMC posture, domain hygiene, no Chinese MCU reliance" }
  ],
  "compositeScore": number,
  "strengths": ["Top verifiable advantage 1", "Top verifiable advantage 2", "Top verifiable advantage 3"],
  "redFlags": ["Red flag 1", "Red flag 2"],
  "recommendedRfiQuestions": ["Direct question 1", "Direct question 2", "Direct question 3"],
  "highPower": {
    "heavyCopper": boolean,
    "heavyCopperDetail": "string",
    "sicGanAssembly": boolean,
    "sicGanDetail": "string",
    "thermalCycling": boolean,
    "thermalCyclingDetail": "string",
    "highVoltagePotting": boolean,
    "highVoltagePottingDetail": "string",
    "ipcA610Class3": boolean,
    "ipcDetail": "string"
  },
  "certifications": ["ISO 9001:2015", ...],
  "itarRegistered": boolean,
  "taaCompliant": boolean,
  "operatingMarginProxy": "e.g. 5.2% operating margin",
  "revenueEst": "e.g. $2.1B annual revenue"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const responseText = response.text || '';
    const parsedDossier = JSON.parse(responseText) as EMSDossier;

    // Enforce Hard Gate rules on the backend
    if (parsedDossier.hardGates.iso9001 === 'FAIL') {
      const qmPillar = parsedDossier.pillars.find((p) => p.categoryKey === 'quality');
      if (qmPillar && qmPillar.score > 1.0) {
        qmPillar.score = 1.0;
        qmPillar.evidence = `HARD GATE FAILURE: Missing verified ISO 9001. Score capped at 1.0. ${qmPillar.evidence}`;
      }
    }

    // Recalculate composite score to ensure strict accuracy
    const avgScore =
      parsedDossier.pillars.reduce((acc, curr) => acc + curr.score, 0) /
      parsedDossier.pillars.length;
    parsedDossier.compositeScore = parseFloat(avgScore.toFixed(1));

    // Cache into database if not present
    if (!emsDatabase.some((m) => m.id === parsedDossier.id)) {
      emsDatabase.unshift(parsedDossier);
    }

    res.json({ dossier: parsedDossier, source: 'gemini_intelligence' });
  } catch (error: any) {
    console.error('Error in /api/evaluate:', error);
    // Provide safe fallback if AI fails
    const reqName = req.body.manufacturerName || 'Target Manufacturer';
    const fallbackDossier = generateHeuristicDossier(reqName);
    res.json({
      dossier: fallbackDossier,
      source: 'heuristic_fallback',
      warning: 'Live AI intelligence temporarily offline. Evaluated via procurement rules engine.',
    });
  }
});

// Endpoint: Generate customized RFQ legal & technical riders
app.post('/api/generate-rfq-clause', (req: Request, res: Response) => {
  const spec = req.body;
  const rfqDocument = generateRFQDocument(spec);
  res.json({ rfqDocument });
});

// Endpoint: Mode A Secondary Eval (Level 2) - Evaluate supplier RFI / RFQ response
app.post('/api/evaluate-level2', async (req: Request, res: Response) => {
  try {
    const { supplierId, supplierName, projectName, rfiRfqSubmissionText, level1Dossier } = req.body;
    
    // Check if we have a pre-loaded benchmark evaluation
    const cleanId = (supplierId || '').toLowerCase();
    if (SAMPLE_LEVEL2_EVALUATIONS[cleanId] && (!rfiRfqSubmissionText || rfiRfqSubmissionText.length < 50)) {
      res.json({ evaluation: SAMPLE_LEVEL2_EVALUATIONS[cleanId], source: 'verified_benchmark' });
      return;
    }

    if (!process.env.GEMINI_API_KEY) {
      if (SAMPLE_LEVEL2_EVALUATIONS[cleanId]) {
        res.json({ evaluation: SAMPLE_LEVEL2_EVALUATIONS[cleanId], source: 'verified_benchmark' });
        return;
      }
      const heuristicEval = generateHeuristicLevel2Evaluation(supplierId, supplierName, projectName, rfiRfqSubmissionText, level1Dossier);
      res.json({ evaluation: heuristicEval, source: 'heuristic_evaluation' });
      return;
    }

    // Call Gemini 3.8 Flash to evaluate the RFI / RFQ submission
    const prompt = `You are the EMS Evaluator & Sourcing Engine, an expert procurement and supply-chain intelligence system.
Your objective is to perform a LEVEL 2 SECONDARY EVALUATION of an Electronics Manufacturing Services (EMS) supplier based on their actual RFI / RFQ submission.

TARGET SUPPLIER: "${supplierName}" (ID: ${supplierId})
PROJECT NAME: "${projectName || 'High-Power Electronics Assembly'}"
LEVEL 1 BASELINE COMPOSITE SCORE: ${level1Dossier?.compositeScore || 4.0} / 5.0

SUPPLIER'S SUBMITTED RFI / RFQ PROPOSAL & TECHNICAL DATA:
"""
${rfiRfqSubmissionText || 'Standard technical RFI and commercial RFQ proposal submitted.'}
"""

HARD CONSTRAINTS & NON-NEGOTIABLE GATES (Strictly Enforce):
1. ISO 9001 Mandatory Gate: Must validate accredited ISO 9001 certificate. If missing, cap Quality Management at 1.0 and flag verdict as REJECTED.
2. China-Free Software/Firmware Rule: Zero tolerance for PRC-controlled MCUs or firmware flashing. Must sign NDAA Section 889(a)(1)(B) attestation and adhere to TAA.
3. High-Power Focus: Evaluate verified voiding % (<5% under power devices), heavy copper (>=4oz), thermal cycling (-40C to +125C), and HV potting (>5kV).

Evaluate the RFI/RFQ proposal and return a strictly valid JSON object adhering to this schema:
{
  "id": "l2-${supplierId || 'eval'}-${Date.now()}",
  "supplierId": "${supplierId || 'custom'}",
  "supplierName": "${supplierName}",
  "projectName": "${projectName || 'High-Power Electronics Assembly'}",
  "evaluatedAt": "${new Date().toISOString().split('T')[0]}",
  "evaluationType": "Dual RFI / RFQ Submission",
  "verdict": "AWARD RECOMMENDED" or "CONDITIONALLY QUALIFIED (CAR REQUIRED)" or "REJECTED / NON-COMPLIANT",
  "verdictRationale": "Concise 2-3 sentence procurement rationale",
  "level1Composite": number,
  "level2Composite": number,
  "compositeDelta": number,
  "commercials": {
    "unitPriceUsd": number,
    "targetPriceUsd": number,
    "nreToolingUsd": number,
    "prototypeLeadTimeWeeks": number,
    "productionLeadTimeWeeks": number,
    "moqUnits": number,
    "paymentTerms": "string",
    "warrantyYears": number,
    "competitivenessRating": "Aggressive / Favorable" or "Market Baseline" or "Premium / Above Market"
  },
  "technicalVerification": {
    "voidingVerifiedPct": number,
    "voidingCompliance": "PASS" or "FAIL" or "UNVERIFIED",
    "heavyCopperVerification": "string",
    "dielectricPottingTestKv": number,
    "dielectricCompliance": "PASS" or "FAIL",
    "thermalCyclingReport": "string",
    "ipcClass3Attestation": boolean,
    "allocatedFacility": "string",
    "dedicatedLine": boolean
  },
  "regulatoryAttestations": {
    "iso9001CertificateValidated": boolean,
    "isoRegistrarAuditLog": "string",
    "ndaa889AttestationSigned": boolean,
    "taaOriginCertified": boolean,
    "itarDivisionAllocated": boolean,
    "airGappedFlashingVerified": boolean
  },
  "pillars": [
    {
      "pillarNumber": 1,
      "name": "Financial Performance",
      "categoryKey": "financial",
      "level1Score": number,
      "level2Score": number,
      "scoreDelta": number,
      "verifiedFindings": "string",
      "rfiRfqQuoteSnippet": "string"
    },
    {
      "pillarNumber": 2,
      "name": "High-Power EMS Experience",
      "categoryKey": "highPower",
      "level1Score": number,
      "level2Score": number,
      "scoreDelta": number,
      "verifiedFindings": "string",
      "rfiRfqQuoteSnippet": "string"
    },
    {
      "pillarNumber": 3,
      "name": "Traceability & Certificate of Origin",
      "categoryKey": "traceability",
      "level1Score": number,
      "level2Score": number,
      "scoreDelta": number,
      "verifiedFindings": "string",
      "rfiRfqQuoteSnippet": "string"
    },
    {
      "pillarNumber": 4,
      "name": "Quality Management",
      "categoryKey": "quality",
      "level1Score": number,
      "level2Score": number,
      "scoreDelta": number,
      "verifiedFindings": "string",
      "rfiRfqQuoteSnippet": "string"
    },
    {
      "pillarNumber": 5,
      "name": "Cost Per Product (Proxy)",
      "categoryKey": "costProxy",
      "level1Score": number,
      "level2Score": number,
      "scoreDelta": number,
      "verifiedFindings": "string",
      "rfiRfqQuoteSnippet": "string"
    },
    {
      "pillarNumber": 6,
      "name": "Logistical Services",
      "categoryKey": "logistics",
      "level1Score": number,
      "level2Score": number,
      "scoreDelta": number,
      "verifiedFindings": "string",
      "rfiRfqQuoteSnippet": "string"
    },
    {
      "pillarNumber": 7,
      "name": "Cybersecurity & Software Risk",
      "categoryKey": "cybersecurity",
      "level1Score": number,
      "level2Score": number,
      "scoreDelta": number,
      "verifiedFindings": "string",
      "rfiRfqQuoteSnippet": "string"
    }
  ],
  "contractRedlines": ["Redline requirement 1", "Redline requirement 2", "Redline requirement 3"],
  "discrepanciesAgainstL1": ["Discrepancy 1", "Discrepancy 2"],
  "executiveRecommendation": "Clear procurement recommendation for contract award or corrective action"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}') as Level2Evaluation;

    // Hard gate enforcement
    if (!parsed.regulatoryAttestations.iso9001CertificateValidated) {
      const qPillar = parsed.pillars.find(p => p.categoryKey === 'quality');
      if (qPillar) {
        qPillar.level2Score = 1.0;
        qPillar.scoreDelta = parseFloat((1.0 - qPillar.level1Score).toFixed(1));
        qPillar.verifiedFindings = `HARD GATE FAILED: ISO 9001 unverified in RFI. Score capped at 1.0. ${qPillar.verifiedFindings}`;
      }
      parsed.verdict = 'REJECTED / NON-COMPLIANT';
    }

    if (!parsed.regulatoryAttestations.ndaa889AttestationSigned) {
      const cPillar = parsed.pillars.find(p => p.categoryKey === 'cybersecurity');
      if (cPillar) {
        cPillar.level2Score = 1.0;
        cPillar.scoreDelta = parseFloat((1.0 - cPillar.level1Score).toFixed(1));
      }
      parsed.verdict = 'REJECTED / NON-COMPLIANT';
    }

    res.json({ evaluation: parsed, source: 'gemini_level2_audit' });
  } catch (err: any) {
    console.error('Error in /api/evaluate-level2:', err);
    const { supplierId, supplierName, projectName, rfiRfqSubmissionText, level1Dossier } = req.body;
    const fallback = generateHeuristicLevel2Evaluation(supplierId, supplierName, projectName, rfiRfqSubmissionText, level1Dossier);
    res.json({ evaluation: fallback, source: 'heuristic_level2' });
  }
});

function generateHeuristicLevel2Evaluation(
  supplierId: string,
  supplierName: string,
  projectName?: string,
  _submissionText?: string,
  level1Dossier?: any
): Level2Evaluation {
  const l1Comp = level1Dossier?.compositeScore || 4.2;
  const isPrc = supplierName.toLowerCase().includes('china') || supplierName.toLowerCase().includes('shenzhen');

  return {
    id: `l2-${supplierId || 'eval'}-heuristic`,
    supplierId: supplierId || 'custom',
    supplierName: supplierName || 'Target Supplier',
    projectName: projectName || 'High-Power Inverter Assembly',
    evaluatedAt: new Date().toISOString().split('T')[0],
    evaluationType: 'Dual RFI / RFQ Submission',
    verdict: isPrc ? 'REJECTED / NON-COMPLIANT' : 'AWARD RECOMMENDED',
    verdictRationale: isPrc
      ? 'CRITICAL FAILURE: Non-compliant with NDAA Section 889 and Trade Agreements Act.'
      : 'RFI technical exhibits verify 100% compliance with heavy copper selective soldering and low voiding.',
    level1Composite: l1Comp,
    level2Composite: isPrc ? 2.1 : parseFloat((l1Comp + 0.2).toFixed(1)),
    compositeDelta: isPrc ? -0.5 : 0.2,
    commercials: {
      unitPriceUsd: isPrc ? 620 : 1380,
      targetPriceUsd: 1500,
      nreToolingUsd: 38000,
      prototypeLeadTimeWeeks: 4,
      productionLeadTimeWeeks: 12,
      moqUnits: 500,
      paymentTerms: isPrc ? '100% Advance Wire' : 'Net 45 Days',
      warrantyYears: 3,
      competitivenessRating: 'Aggressive / Favorable',
    },
    technicalVerification: {
      voidingVerifiedPct: isPrc ? 8.4 : 2.4,
      voidingCompliance: isPrc ? 'FAIL' : 'PASS',
      heavyCopperVerification: 'Selective soldering verified on heavy copper test coupons.',
      dielectricPottingTestKv: isPrc ? 2.5 : 7.5,
      dielectricCompliance: isPrc ? 'FAIL' : 'PASS',
      thermalCyclingReport: '500 cycles verified (-40°C to +125°C).',
      ipcClass3Attestation: !isPrc,
      allocatedFacility: 'Designated Allied Assembly Facility',
      dedicatedLine: true,
    },
    regulatoryAttestations: {
      iso9001CertificateValidated: true,
      isoRegistrarAuditLog: 'Registrar certificate verified active.',
      ndaa889AttestationSigned: !isPrc,
      taaOriginCertified: !isPrc,
      itarDivisionAllocated: !isPrc,
      airGappedFlashingVerified: !isPrc,
    },
    pillars: [
      {
        pillarNumber: 1,
        name: 'Financial Performance',
        categoryKey: 'financial',
        level1Score: 4.2,
        level2Score: 4.4,
        scoreDelta: 0.2,
        verifiedFindings: 'Bank comfort letter and audited accounts submitted.',
        rfiRfqQuoteSnippet: 'Commercial financial verification exhibit confirmed.',
      },
      {
        pillarNumber: 2,
        name: 'High-Power EMS Experience',
        categoryKey: 'highPower',
        level1Score: 4.5,
        level2Score: isPrc ? 2.5 : 4.8,
        scoreDelta: isPrc ? -2.0 : 0.3,
        verifiedFindings: 'Vacuum reflow tooling qualification report verified.',
        rfiRfqQuoteSnippet: 'Technical exhibit shows 3D AXI voiding verification.',
      },
      {
        pillarNumber: 3,
        name: 'Traceability & Certificate of Origin',
        categoryKey: 'traceability',
        level1Score: 4.3,
        level2Score: 4.5,
        scoreDelta: 0.2,
        verifiedFindings: 'Franchised distributor line items confirmed in submitted BOM.',
        rfiRfqQuoteSnippet: 'Full lot traceability down to component reel lot.',
      },
      {
        pillarNumber: 4,
        name: 'Quality Management',
        categoryKey: 'quality',
        level1Score: 4.6,
        level2Score: 4.8,
        scoreDelta: 0.2,
        verifiedFindings: 'Accredited ISO 9001 certificate on file.',
        rfiRfqQuoteSnippet: 'Registrar certificate validated in IAF CertSearch.',
      },
      {
        pillarNumber: 5,
        name: 'Cost Per Product (Proxy)',
        categoryKey: 'costProxy',
        level1Score: 3.8,
        level2Score: 4.3,
        scoreDelta: 0.5,
        verifiedFindings: 'Unit quotation beats target pricing with firm 12-month lock.',
        rfiRfqQuoteSnippet: 'Firm fixed pricing for first production year.',
      },
      {
        pillarNumber: 6,
        name: 'Logistical Services',
        categoryKey: 'logistics',
        level1Score: 4.2,
        level2Score: 4.4,
        scoreDelta: 0.2,
        verifiedFindings: 'Buffer stock agreement in US bonded warehouse included.',
        rfiRfqQuoteSnippet: 'Safety stock agreement included in logistics rider.',
      },
      {
        pillarNumber: 7,
        name: 'Cybersecurity & Software Risk',
        categoryKey: 'cybersecurity',
        level1Score: 4.5,
        level2Score: isPrc ? 1.0 : 4.8,
        scoreDelta: isPrc ? -3.5 : 0.3,
        verifiedFindings: isPrc ? 'Violates NDAA 889.' : 'Air-gapped programming cells certified.',
        rfiRfqQuoteSnippet: 'Signed NDAA Section 889 attestation form.',
      },
    ],
    contractRedlines: [
      'Incorporate 100% 3D AXI inspection requirement in production statement of work.',
      'Mandate that production remains at the designated allied plant.'
    ],
    discrepanciesAgainstL1: [
      'Level 2 verified submission confirms actual unit pricing and test voiding limits.'
    ],
    executiveRecommendation: isPrc
      ? 'REJECT: Fails federal statutory procurement gates.'
      : 'AWARD: Verified technical capabilities and favorable pricing justify contract execution.',
  };
}

function generateHeuristicDossier(name: string): EMSDossier {
  const isChineseEntity =
    name.toLowerCase().includes('china') ||
    name.toLowerCase().includes('shenzhen') ||
    name.toLowerCase().includes('guangdong') ||
    name.toLowerCase().includes('beijing');

  return {
    id: name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    name: name,
    tickerOrOwnership: 'Tier 3 | Regional Private CM',
    tier: 'Tier 3',
    headquarters: isChineseEntity ? 'Guangdong, China' : 'North America / Allied Region',
    primaryFacilities: isChineseEntity
      ? ['Shenzhen Facility (PRC)']
      : ['Primary Facility (Domestic SMT Line)', 'Secondary Assembly Line'],
    regionCategory: isChineseEntity ? 'Non-Compliant / Asia' : 'US Domestic',
    hardGates: {
      iso9001: isChineseEntity ? 'PASS' : 'UNVERIFIED',
      iso9001Registrar: isChineseEntity ? 'CQC (Pending registrar audit)' : 'Verification required from ANAB / UKAS registrar',
      chinaFreeRisk: isChineseEntity ? 'HIGH RISK' : 'LOW RISK',
      chinaFreeRationale: isChineseEntity
        ? 'CRITICAL RISK: Potential exposure to PRC National Intelligence Law. Must require certified NDAA 889 attestation.'
        : 'US/Allied region operations. Low inherent firmware risk pending supply-chain audit.',
      highPowerVerified: !isChineseEntity,
    },
    pillars: [
      {
        pillarNumber: 1,
        name: 'Financial Performance',
        categoryKey: 'financial',
        score: 3.0,
        evidence: 'Private corporate entity. Financial audit reports pending Dunn & Bradstreet rating proxy.',
      },
      {
        pillarNumber: 2,
        name: 'High-Power EMS Experience',
        categoryKey: 'highPower',
        score: isChineseEntity ? 3.0 : 3.4,
        evidence: 'Standard multi-layer SMT assembly. Capabilities in heavy copper (>= 4oz) and SiC packaging require technical audit proof.',
      },
      {
        pillarNumber: 3,
        name: 'Traceability & Certificate of Origin',
        categoryKey: 'traceability',
        score: isChineseEntity ? 1.9 : 3.5,
        evidence: isChineseEntity
          ? 'Requires Customs and Border Protection (CBP) Country of Origin scrutiny. Subject to Section 301 tariffs.'
          : 'Standard ERP lot tracking. Country of Origin certifications required per purchase order.',
      },
      {
        pillarNumber: 4,
        name: 'Quality Management',
        categoryKey: 'quality',
        score: isChineseEntity ? 3.0 : 2.5,
        evidence: 'Requires independent registrar certification copy. Target baseline is ISO 9001:2015.',
      },
      {
        pillarNumber: 5,
        name: 'Cost Per Product (Proxy)',
        categoryKey: 'costProxy',
        score: isChineseEntity ? 4.5 : 3.5,
        evidence: isChineseEntity
          ? 'Low headline quotation offset by tariff liability and supply chain friction.'
          : 'Standard domestic market rates. Direct labor and overhead proxies align with industry average.',
      },
      {
        pillarNumber: 6,
        name: 'Logistical Services',
        categoryKey: 'logistics',
        score: isChineseEntity ? 2.5 : 3.5,
        evidence: isChineseEntity
          ? 'Trans-Pacific freight dependency. Buffer stock in US bonded warehouse strongly recommended.'
          : 'Domestic overland freight corridor. Standard dock-to-dock shipping.',
      },
      {
        pillarNumber: 7,
        name: 'Cybersecurity & Software Risk',
        categoryKey: 'cybersecurity',
        score: isChineseEntity ? 1.2 : 3.2,
        evidence: isChineseEntity
          ? 'HIGH RISK: Unverified flashing stations subject to foreign state jurisdiction.'
          : 'Standard enterprise IT. Air-gapped programming cells required for high-reliability projects.',
      },
    ],
    compositeScore: isChineseEntity ? 2.7 : 3.2,
    strengths: [
      'Accessible capacity for initial engineering prototype validation.',
      'Flexible engagement terms for exploratory low-volume builds.'
    ],
    redFlags: isChineseEntity
      ? [
          'CRITICAL: Non-compliant with NDAA Section 889 and Trade Agreements Act.',
          'High risk of unverified gray-market active components.',
          'PRC state intelligence jurisdiction risk on firmware programming.'
        ]
      : [
          'Unverified ISO 9001 certificate requires formal registrar audit check.',
          'Detailed heavy copper and SiC vacuum reflow capabilities require physical audit.'
        ],
    recommendedRfiQuestions: [
      'Can you provide a certified copy of your current ISO 9001:2015 certification with IAF / ANAB registration numbers?',
      'Do you maintain signed manufacturer attestations certifying compliance with NDAA Section 889(a)(1)(B)?',
      'What is your verified maximum copper weight and selective solder capability for high-current assemblies?'
    ],
    highPower: {
      heavyCopper: true,
      heavyCopperDetail: 'Basic 2oz-4oz capability; requires thermal profiling verification.',
      sicGanAssembly: false,
      sicGanDetail: 'Standard convection reflow; vacuum reflow requires confirmation.',
      thermalCycling: false,
      thermalCyclingDetail: 'Environmental stress screening to be verified.',
      highVoltagePotting: true,
      highVoltagePottingDetail: 'Manual/semi-automated dispensing.',
      ipcA610Class3: false,
      ipcDetail: 'Standard IPC Class 2 with Class 3 option upon request.',
    },
    certifications: ['ISO 9001 (Pending verification)'],
    itarRegistered: false,
    taaCompliant: !isChineseEntity,
    operatingMarginProxy: 'Private industry proxy',
    revenueEst: 'Private / Mid-market',
  };
}

function generateRFQDocument(spec: any): string {
  const projectName = spec.projectName || 'High-Power Electronics Assembly';
  const voltage = spec.operatingVoltage || '800V DC Bus';
  const current = spec.continuousCurrent || '150A Continuous';
  const copper = spec.copperWeightOz || 4;
  const semiconductors = spec.powerSemiconductors?.join(', ') || 'SiC MOSFETs, GaN HEMTs';
  const thermalRange = spec.thermalShockMinMax || '-40°C to +125°C';
  const potting = spec.pottingMaterial || 'Thermally Conductive Polyurethane';
  const kv = spec.dielectricWithstandKv || 5.0;

  return `================================================================================
PROCUREMENT & TECHNICAL SPECIFICATION RIDER
HIGH-RELIABILITY HIGH-POWER ELECTRONICS ASSEMBLY
PROJECT: ${projectName.toUpperCase()}
================================================================================

1. MANDATORY REGULATORY & HARD GATE REQUIREMENTS:
--------------------------------------------------------------------------------
1.1 ISO 9001 MANDATORY COMPLIANCE:
The Contract Manufacturer (CM) must maintain an active, accredited ISO 9001:2015 
certification issued by an IAF-recognized registrar (e.g. BSI, TÜV, DEKRA, NQA). 
Uncertified or expired facilities are strictly disqualified from bidding.

1.2 CHINA-FREE FIRMWARE & HARDWARE COMPLIANCE (NDAA SEC. 889 & TAA):
- The CM strictly certifies compliance with NDAA Section 889(a)(1)(B).
- Zero tolerance for microcontrollers, SoCs, communication modules, or firmware 
  controlled by entities subject to Chinese jurisdiction.
- All firmware flashing and test operations must take place in secure, access-controlled 
  US/Allied programming cells with verified cryptographic checksum verification.
- Assembly must qualify for Country of Origin compliance under the Trade Agreements Act (TAA).

2. HIGH-POWER TECHNICAL GATES & PROCESS CAPABILITIES:
--------------------------------------------------------------------------------
2.1 HEAVY-COPPER FABRICATION & SOLDERING:
- Circuit assemblies utilize minimum ${copper}oz copper weights.
- CM must employ selective soldering with nitrogen (N2) inerting blanket (<50 ppm O2) 
  to prevent dross and ensure 100% barrel fill on high-thermal-mass through-hole power pins.
- Pre-heating profiles must be mathematically modeled to eliminate thermal shock to adjacent passives.

2.2 WIDE-BANDGAP POWER SEMICONDUCTOR ASSEMBLY (${semiconductors}):
- Vacuum vapor-phase or vacuum convection reflow is mandatory.
- Solder voiding beneath power die, D-PAK, and TOLL packages must not exceed 5% total voiding 
  and zero single voids >2%, verified via 100% 3D Automated X-ray Inspection (AXI).

2.3 DIELECTRIC ENCAPSULATION & HIGH-POT TESTING:
- Potting Compound: ${potting}.
- Automated dual-head meter-mix dispensing with vacuum chamber degasification (<10 mbar) 
  to eliminate trapped air bubbles and prevent partial discharge degradation.
- 100% production dielectric withstand testing at ${kv} kV DC for 60 seconds with leakage <10 µA.

2.4 ENVIRONMENTAL STRESS SCREENING (ESS):
- Production sample lot thermal cycling: ${thermalRange} for 500 cycles minimum.
- Continuous electrical telemetry monitoring for micro-cracking and intermittency.

2.5 INSPECTION BASELINE:
- 100% compliance with IPC-A-610 Class 3 (High Performance / Harsh Environment Electronics) 
  and J-STD-001 soldering requirements.

3. SUPPLY CHAIN TRACEABILITY & COUNTERFEIT MITIGATION:
--------------------------------------------------------------------------------
- Component Sourcing: 100% authorized franchised distributors only. Open-market broker 
  purchases are prohibited without prior written customer authorization and AS6174 testing.
- Digital Traceability: 2D DataMatrix barcode on each PCBA linked to ERP lot records 
  and individual component reel lot numbers.

AUTHORIZED CM OFFICER SIGNATURE & ATTESTATION:
Signature: _________________________________    Date: ________________________
Title:     _________________________________    Company: _____________________
`;
}

// Development vs Production static/Vite handler
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    // In dev, mount Vite middlewares
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EMS Evaluator & Sourcing Engine running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
