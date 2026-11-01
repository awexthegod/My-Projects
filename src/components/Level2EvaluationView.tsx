import React, { useState } from 'react';
import { EMSDossier, Level2Evaluation } from '../types/ems';
import { SAMPLE_LEVEL2_EVALUATIONS } from '../data/level2Samples';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Zap,
  DollarSign,
  FileText,
  Copy,
  Printer,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Info,
  Scale,
  Award,
} from 'lucide-react';

interface Level2EvaluationViewProps {
  currentDossier: EMSDossier;
  allDossiers: EMSDossier[];
  onSelectSupplier: (dossier: EMSDossier) => void;
  onGenerateRfq: (dossier: EMSDossier) => void;
}

export const Level2EvaluationView: React.FC<Level2EvaluationViewProps> = ({
  currentDossier,
  allDossiers,
  onSelectSupplier,
  onGenerateRfq,
}) => {
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(
    SAMPLE_LEVEL2_EVALUATIONS[currentDossier.id] ? currentDossier.id : 'sanmina'
  );
  const [projectName, setProjectName] = useState('800V 200A Traction Inverter & Power Stage');
  const [submissionText, setSubmissionText] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Active evaluation state
  const [activeEvaluation, setActiveEvaluation] = useState<Level2Evaluation>(
    SAMPLE_LEVEL2_EVALUATIONS[selectedSupplierId] || SAMPLE_LEVEL2_EVALUATIONS['sanmina']
  );

  const handleSupplierChange = (id: string) => {
    setSelectedSupplierId(id);
    const found = allDossiers.find((d) => d.id === id);
    if (found) {
      onSelectSupplier(found);
    }
    if (SAMPLE_LEVEL2_EVALUATIONS[id]) {
      setActiveEvaluation(SAMPLE_LEVEL2_EVALUATIONS[id]);
      setSubmissionText('');
    }
  };

  const handleLoadSample = (sampleKey: string) => {
    const sample = SAMPLE_LEVEL2_EVALUATIONS[sampleKey];
    if (sample) {
      setSelectedSupplierId(sampleKey);
      setActiveEvaluation(sample);
      const matchedDossier = allDossiers.find((d) => d.id === sampleKey);
      if (matchedDossier) {
        onSelectSupplier(matchedDossier);
      }
    }
  };

  const handleRunEvaluation = async () => {
    setIsEvaluating(true);
    try {
      const targetDossier = allDossiers.find((d) => d.id === selectedSupplierId) || currentDossier;
      const res = await fetch('/api/evaluate-level2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId: selectedSupplierId,
          supplierName: targetDossier.name,
          projectName: projectName,
          rfiRfqSubmissionText: submissionText,
          level1Dossier: targetDossier,
        }),
      });

      if (!res.ok) {
        throw new Error(`Evaluation failed with status ${res.status}`);
      }

      const data = await res.json();
      if (data && data.evaluation) {
        setActiveEvaluation(data.evaluation);
      }
    } catch (err: any) {
      console.error('Level 2 evaluation error:', err);
      // Fallback to sample if available
      if (SAMPLE_LEVEL2_EVALUATIONS[selectedSupplierId]) {
        setActiveEvaluation(SAMPLE_LEVEL2_EVALUATIONS[selectedSupplierId]);
      }
    } finally {
      setIsEvaluating(false);
    }
  };

  const generateMarkdownReport = (evalData: Level2Evaluation): string => {
    return `## ${evalData.supplierName} — Level 2 Secondary RFI/RFQ Evaluation Report
**Project Name:** ${evalData.projectName}  
**Evaluation Date:** ${evalData.evaluatedAt}  
**Evaluation Type:** ${evalData.evaluationType}  
**Procurement Verdict:** ${evalData.verdict}  
**Verdict Rationale:** ${evalData.verdictRationale}  

### Composite Scoring Delta
- **Level 1 Public Composite:** ${evalData.level1Composite.toFixed(1)} / 5.0
- **Level 2 Verified Composite:** ${evalData.level2Composite.toFixed(1)} / 5.0
- **Composite Delta:** ${evalData.compositeDelta >= 0 ? `+${evalData.compositeDelta.toFixed(1)}` : evalData.compositeDelta.toFixed(1)}

### Commercial Bid Terms
- **Unit Price:** $${evalData.commercials.unitPriceUsd.toLocaleString()} (Target: $${evalData.commercials.targetPriceUsd.toLocaleString()})
- **NRE Tooling:** $${evalData.commercials.nreToolingUsd.toLocaleString()}
- **Prototype Lead Time:** ${evalData.commercials.prototypeLeadTimeWeeks} weeks
- **Production Lead Time:** ${evalData.commercials.productionLeadTimeWeeks} weeks
- **MOQ:** ${evalData.commercials.moqUnits.toLocaleString()} units
- **Payment Terms:** ${evalData.commercials.paymentTerms}

### Technical Verification & Hard Gates
- **Solder Voiding under SiC/GaN:** ${evalData.technicalVerification.voidingVerifiedPct}% (Compliance: ${evalData.technicalVerification.voidingCompliance})
- **Heavy Copper Microsection:** ${evalData.technicalVerification.heavyCopperVerification}
- **Dielectric Potting Hipot:** ${evalData.technicalVerification.dielectricPottingTestKv} kV (Compliance: ${evalData.technicalVerification.dielectricCompliance})
- **Thermal Cycling:** ${evalData.technicalVerification.thermalCyclingReport}
- **NDAA 889 Attestation:** ${evalData.regulatoryAttestations.ndaa889AttestationSigned ? 'SIGNED & COMPLIANT' : 'FAIL / NOT SIGNED'}
- **ISO 9001 Validation:** ${evalData.regulatoryAttestations.iso9001CertificateValidated ? 'VALIDATED' : 'FAIL'} (${evalData.regulatoryAttestations.isoRegistrarAuditLog})
- **Allocated Facility:** ${evalData.technicalVerification.allocatedFacility}

### Level 2 Verified Scorecard vs Level 1 Baseline
| # | Evaluation Pillar | L1 Score | L2 Verified | Delta | Verified Findings & Evidence |
|---|---|:---:|:---:|:---:|---|
${evalData.pillars
  .map(
    (p) =>
      `| ${p.pillarNumber} | **${p.name}** | ${p.level1Score.toFixed(1)} | ${p.level2Score.toFixed(1)} | ${p.scoreDelta >= 0 ? `+${p.scoreDelta.toFixed(1)}` : p.scoreDelta.toFixed(1)} | ${p.verifiedFindings} |`
  )
  .join('\n')}

### Recommended Master Services Agreement (MSA) Redlines:
${evalData.contractRedlines.map((r) => `- ${r}`).join('\n')}

### Executive Recommendation:
${evalData.executiveRecommendation}
`;
  };

  const handleCopyMarkdown = () => {
    const md = generateMarkdownReport(activeEvaluation);
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getVerdictStyles = (verdict: string) => {
    if (verdict === 'AWARD RECOMMENDED') {
      return {
        border: 'border-emerald-300',
        bg: 'bg-emerald-50/50',
        badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
        text: 'text-emerald-900',
      };
    }
    if (verdict.includes('CONDITIONALLY')) {
      return {
        border: 'border-amber-300',
        bg: 'bg-amber-50/50',
        badge: 'bg-amber-100 text-amber-800 border-amber-300',
        icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
        text: 'text-amber-900',
      };
    }
    return {
      border: 'border-rose-300',
      bg: 'bg-rose-50/60',
      badge: 'bg-rose-100 text-rose-800 border-rose-300',
      icon: <XCircle className="w-5 h-5 text-rose-600" />,
      text: 'text-rose-900',
    };
  };

  const styles = getVerdictStyles(activeEvaluation.verdict);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span className="font-mono uppercase font-semibold text-slate-600">
              LEVEL 2 SECONDARY EVALUATION
            </span>
            <span aria-hidden="true">·</span>
            <span>RFI Technical Vetting &amp; RFQ Commercial Audit</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Level 2 Evaluation (RFI &amp; RFQ Submissions)
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Secondary technical and commercial evaluation comparing actual supplier proposal submissions, 3D AXI test reports, and signed NDAA/ISO attestations against the Level 1 baseline.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleCopyMarkdown}
            className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 shadow-xs"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{copied ? 'Copied Level 2 MD!' : 'Copy Evaluation'}</span>
          </button>
          <button
            onClick={() => window.print()}
            className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
          <button
            onClick={() => onGenerateRfq(currentDossier)}
            className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-slate-900 rounded-md hover:bg-slate-800 shadow-xs"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Rider Template</span>
          </button>
        </div>
      </div>

      {/* Control Strip & Sample Bid Loader */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-700">Target Supplier:</span>
              <select
                value={selectedSupplierId}
                onChange={(e) => handleSupplierChange(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                {allDossiers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.tier})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-700">Target Program:</span>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 w-64 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>

          {/* Quick presets */}
          <div className="flex items-center gap-1.5 text-2xs overflow-x-auto">
            <span className="text-slate-400 font-semibold uppercase whitespace-nowrap">Load Verified Bids:</span>
            <button
              onClick={() => handleLoadSample('sanmina')}
              className={`cursor-pointer px-2.5 py-1 rounded border transition-colors whitespace-nowrap ${
                selectedSupplierId === 'sanmina' ? 'bg-slate-900 text-white font-medium border-slate-900' : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
              }`}
            >
              Sanmina 800V Bid (Award)
            </button>
            <button
              onClick={() => handleLoadSample('keytronic')}
              className={`cursor-pointer px-2.5 py-1 rounded border transition-colors whitespace-nowrap ${
                selectedSupplierId === 'keytronic' ? 'bg-slate-900 text-white font-medium border-slate-900' : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
              }`}
            >
              Keytronic Juarez Bid (CAR)
            </button>
            <button
              onClick={() => handleLoadSample('shenzhen-fasttech')}
              className={`cursor-pointer px-2.5 py-1 rounded border transition-colors whitespace-nowrap ${
                selectedSupplierId === 'shenzhen-fasttech' ? 'bg-slate-900 text-white font-medium border-slate-900' : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
              }`}
            >
              PRC Benchmark Bid (Fail)
            </button>
          </div>
        </div>

        {/* Custom RFI/RFQ Text Expandable Input */}
        <div className="pt-3 border-t border-slate-100 space-y-2">
          <div className="flex items-center justify-between text-2xs">
            <label className="font-semibold text-slate-700">
              Paste or Edit Supplier Proposal Text / Test Data for AI Audit:
            </label>
            <button
              onClick={handleRunEvaluation}
              disabled={isEvaluating}
              className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isEvaluating ? 'Auditing Proposal...' : 'Run Secondary Audit'}</span>
            </button>
          </div>
          <textarea
            rows={2}
            value={submissionText}
            onChange={(e) => setSubmissionText(e.target.value)}
            placeholder="Paste supplier RFI answers, commercial unit price breakdown ($/unit), AXI voiding test report, ISO 9001 registrar details, or NDAA 889 attestation..."
            className="w-full text-xs font-mono p-2.5 bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
        </div>
      </div>

      {/* Level 2 Executive Verdict Banner */}
      <div className={`p-6 rounded-lg border shadow-xs ${styles.bg} ${styles.border} transition-all`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded border inline-flex items-center gap-1.5 ${styles.badge}`}>
                {styles.icon}
                <span>{activeEvaluation.verdict}</span>
              </span>
              <span className="text-2xs text-slate-500 font-mono">
                {activeEvaluation.evaluationType} · Evaluated {activeEvaluation.evaluatedAt}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              {activeEvaluation.supplierName} — Level 2 Secondary Vetting Report
            </h2>

            <p className="text-xs text-slate-700 max-w-3xl leading-relaxed">
              {activeEvaluation.verdictRationale}
            </p>
          </div>

          {/* Level 1 vs Level 2 Score Delta Cluster */}
          <div className="flex items-center gap-4 shrink-0 bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
            <div>
              <div className="text-3xs uppercase font-semibold text-slate-400">Level 1 Baseline</div>
              <div className="font-mono text-xl font-bold text-slate-500">
                {activeEvaluation.level1Composite.toFixed(1)}
              </div>
            </div>

            <div className="text-slate-300 font-mono text-lg">→</div>

            <div>
              <div className="text-3xs uppercase font-semibold text-slate-900">Level 2 Verified</div>
              <div className="font-mono text-2xl font-extrabold text-slate-900">
                {activeEvaluation.level2Composite.toFixed(1)}
                <span className="text-2xs font-normal text-slate-400"> / 5.0</span>
              </div>
            </div>

            <div className="w-px h-10 bg-slate-200" />

            <div className="text-center">
              <div className="text-3xs uppercase font-semibold text-slate-400">Score Delta</div>
              <span
                className={`inline-flex items-center gap-0.5 font-mono text-xs font-bold px-2 py-0.5 rounded ${
                  activeEvaluation.compositeDelta > 0
                    ? 'bg-emerald-100 text-emerald-800'
                    : activeEvaluation.compositeDelta < 0
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {activeEvaluation.compositeDelta > 0 ? (
                  <TrendingUp className="w-3 h-3 text-emerald-600" />
                ) : activeEvaluation.compositeDelta < 0 ? (
                  <TrendingDown className="w-3 h-3 text-rose-600" />
                ) : null}
                <span>
                  {activeEvaluation.compositeDelta >= 0
                    ? `+${activeEvaluation.compositeDelta.toFixed(1)}`
                    : activeEvaluation.compositeDelta.toFixed(1)}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Commercial Bid & Lead Time Strip */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              RFQ Commercial Proposal &amp; Terms
            </h3>
          </div>
          <span className="text-2xs font-mono font-semibold text-slate-600">
            Rating: {activeEvaluation.commercials.competitivenessRating}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded border border-slate-100">
            <div className="text-2xs text-slate-500 font-medium">Unit Bid Price</div>
            <div className="font-mono text-base font-bold text-slate-900 mt-0.5">
              ${activeEvaluation.commercials.unitPriceUsd.toLocaleString()}
            </div>
            <div className="text-3xs text-slate-400">
              Budget: ${activeEvaluation.commercials.targetPriceUsd.toLocaleString()}
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded border border-slate-100">
            <div className="text-2xs text-slate-500 font-medium">NRE &amp; Tooling</div>
            <div className="font-mono text-base font-bold text-slate-900 mt-0.5">
              ${activeEvaluation.commercials.nreToolingUsd.toLocaleString()}
            </div>
            <div className="text-3xs text-slate-400">Fixtures &amp; Stencils</div>
          </div>

          <div className="p-3 bg-slate-50 rounded border border-slate-100">
            <div className="text-2xs text-slate-500 font-medium">Prototype Turnaround</div>
            <div className="font-mono text-base font-bold text-slate-900 mt-0.5">
              {activeEvaluation.commercials.prototypeLeadTimeWeeks} wks
            </div>
            <div className="text-3xs text-slate-400">First Article (FAIR)</div>
          </div>

          <div className="p-3 bg-slate-50 rounded border border-slate-100">
            <div className="text-2xs text-slate-500 font-medium">Production Lead Time</div>
            <div className="font-mono text-base font-bold text-slate-900 mt-0.5">
              {activeEvaluation.commercials.productionLeadTimeWeeks} wks
            </div>
            <div className="text-3xs text-slate-400">Standard SMT Run</div>
          </div>

          <div className="p-3 bg-slate-50 rounded border border-slate-100">
            <div className="text-2xs text-slate-500 font-medium">MOQ &amp; Payment</div>
            <div className="font-bold text-slate-900 mt-0.5">
              {activeEvaluation.commercials.moqUnits.toLocaleString()} units
            </div>
            <div className="text-3xs text-slate-500">{activeEvaluation.commercials.paymentTerms}</div>
          </div>

          <div className="p-3 bg-slate-50 rounded border border-slate-100">
            <div className="text-2xs text-slate-500 font-medium">Warranty SLA</div>
            <div className="font-bold text-slate-900 mt-0.5">
              {activeEvaluation.commercials.warrantyYears} Years
            </div>
            <div className="text-3xs text-slate-500">Workmanship / Repair</div>
          </div>
        </div>
      </div>

      {/* Technical Verification & Regulatory Hard Gate Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Technical Physical Verification */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Technical Data Verification (RFI Exhibits)
              </h3>
            </div>
            <span className="text-2xs font-mono text-slate-400">Test Logs</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-start justify-between p-2.5 bg-slate-50 rounded border border-slate-100">
              <div>
                <span className="font-bold text-slate-900 block">Solder Voiding (3D AXI Scan)</span>
                <span className="text-2xs text-slate-600">
                  Measured voiding: <span className="font-mono font-bold text-slate-900">{activeEvaluation.technicalVerification.voidingVerifiedPct}%</span> (Max allowed: 5.0%)
                </span>
              </div>
              <span
                className={`text-2xs font-bold px-2 py-0.5 rounded ${
                  activeEvaluation.technicalVerification.voidingCompliance === 'PASS'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {activeEvaluation.technicalVerification.voidingCompliance}
              </span>
            </div>

            <div className="flex items-start justify-between p-2.5 bg-slate-50 rounded border border-slate-100">
              <div>
                <span className="font-bold text-slate-900 block">Dielectric Potting &amp; Hipot</span>
                <span className="text-2xs text-slate-600">
                  Verified withstand: <span className="font-mono font-bold text-slate-900">{activeEvaluation.technicalVerification.dielectricPottingTestKv} kV DC</span>
                </span>
              </div>
              <span
                className={`text-2xs font-bold px-2 py-0.5 rounded ${
                  activeEvaluation.technicalVerification.dielectricCompliance === 'PASS'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {activeEvaluation.technicalVerification.dielectricCompliance}
              </span>
            </div>

            <div className="p-2.5 bg-slate-50 rounded border border-slate-100 text-2xs space-y-1">
              <span className="font-bold text-slate-900 block">Heavy Copper &amp; Selective Solder:</span>
              <p className="text-slate-600">{activeEvaluation.technicalVerification.heavyCopperVerification}</p>
            </div>

            <div className="p-2.5 bg-slate-50 rounded border border-slate-100 text-2xs space-y-1">
              <span className="font-bold text-slate-900 block">Designated Manufacturing Facility:</span>
              <p className="text-slate-600 font-medium">{activeEvaluation.technicalVerification.allocatedFacility}</p>
            </div>
          </div>
        </div>

        {/* Regulatory Attestation Status */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Regulatory Attestations &amp; Gates
              </h3>
            </div>
            <span className="text-2xs font-mono text-slate-400">Legal Audit</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded border border-slate-100">
              <div>
                <span className="font-bold text-slate-900 block">ISO 9001 Certificate Validated</span>
                <span className="text-2xs text-slate-500">{activeEvaluation.regulatoryAttestations.isoRegistrarAuditLog}</span>
              </div>
              <span className={`text-2xs font-bold px-2 py-0.5 rounded ${activeEvaluation.regulatoryAttestations.iso9001CertificateValidated ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                {activeEvaluation.regulatoryAttestations.iso9001CertificateValidated ? 'VALIDATED' : 'FAIL'}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded border border-slate-100">
              <div>
                <span className="font-bold text-slate-900 block">Signed NDAA 889(a)(1)(B) Certificate</span>
                <span className="text-2xs text-slate-500">Zero PRC-controlled silicon or firmware</span>
              </div>
              <span className={`text-2xs font-bold px-2 py-0.5 rounded ${activeEvaluation.regulatoryAttestations.ndaa889AttestationSigned ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                {activeEvaluation.regulatoryAttestations.ndaa889AttestationSigned ? 'SIGNED' : 'REFUSED / FAIL'}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded border border-slate-100">
              <div>
                <span className="font-bold text-slate-900 block">Trade Agreements Act (TAA) Compliance</span>
                <span className="text-2xs text-slate-500">US, USMCA, or designated allied origin</span>
              </div>
              <span className={`text-2xs font-bold px-2 py-0.5 rounded ${activeEvaluation.regulatoryAttestations.taaOriginCertified ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                {activeEvaluation.regulatoryAttestations.taaOriginCertified ? 'COMPLIANT' : 'NON-TAA'}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded border border-slate-100">
              <div>
                <span className="font-bold text-slate-900 block">Air-Gapped Programming Cell</span>
                <span className="text-2xs text-slate-500">Biometric/restricted MCU key injection</span>
              </div>
              <span className={`text-2xs font-bold px-2 py-0.5 rounded ${activeEvaluation.regulatoryAttestations.airGappedFlashingVerified ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                {activeEvaluation.regulatoryAttestations.airGappedFlashingVerified ? 'VERIFIED' : 'UNVERIFIED'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Level 1 vs Level 2 7-Pillar Comparative Scorecard */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Level 1 Baseline vs. Level 2 Verified Scorecard
            </h3>
            <p className="text-xs text-slate-500">
              Detailed tracking of how supplier RFI test evidence and binding RFQ pricing modified the baseline scores
            </p>
          </div>

          <div className="flex items-center gap-2 text-2xs text-slate-500">
            <span>Scale: 1.0 to 5.0</span>
            <span>·</span>
            <span>Delta: (Level 2 - Level 1)</span>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <th className="py-3 px-3 w-10 text-center">#</th>
                <th className="py-3 px-4 w-52">Evaluation Pillar</th>
                <th className="py-3 px-3 w-24 text-center">L1 Baseline</th>
                <th className="py-3 px-3 w-24 text-center">L2 Verified</th>
                <th className="py-3 px-3 w-20 text-center">Delta</th>
                <th className="py-3 px-4">Verified Findings &amp; RFI/RFQ Quotation Snippets</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {activeEvaluation.pillars.map((pillar) => (
                <tr key={pillar.pillarNumber} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-3 font-mono text-center text-slate-400">
                    {pillar.pillarNumber}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900">
                    {pillar.name}
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-slate-500">
                    {pillar.level1Score.toFixed(1)}
                  </td>
                  <td className="py-3 px-3 text-center font-mono font-bold text-slate-900">
                    {pillar.level2Score.toFixed(1)}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`inline-block font-mono font-bold px-1.5 py-0.5 rounded text-2xs ${
                        pillar.scoreDelta > 0
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : pillar.scoreDelta < 0
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-slate-50 text-slate-600'
                      }`}
                    >
                      {pillar.scoreDelta > 0 ? `+${pillar.scoreDelta.toFixed(1)}` : pillar.scoreDelta.toFixed(1)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-700 space-y-1">
                    <div>{pillar.verifiedFindings}</div>
                    <div className="text-2xs font-mono text-slate-500 bg-slate-50 p-1.5 rounded border border-slate-100">
                      "{pillar.rfiRfqQuoteSnippet}"
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Contract Redlines & Executive Recommendation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recommended Contract Redlines */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-3 shadow-xs">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
            <Scale className="w-4 h-4 text-slate-700" />
            <span>Master Services Agreement (MSA) Required Redlines</span>
          </h4>
          <ul className="space-y-2 text-xs text-slate-700">
            {activeEvaluation.contractRedlines.map((redline, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="font-mono font-bold text-slate-400">{i + 1}.</span>
                <span>{redline}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Executive Recommendation */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-3 shadow-xs">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-slate-700" />
            <span>Executive Procurement Recommendation</span>
          </h4>
          <div className="p-3 bg-slate-50 rounded border border-slate-100 text-xs text-slate-800 leading-relaxed font-medium">
            {activeEvaluation.executiveRecommendation}
          </div>
          <div className="text-2xs text-slate-500">
            Authorized by Procurement &amp; Supplier Quality Engineering Committee.
          </div>
        </div>
      </div>
    </div>
  );
};
