import React, { useState } from 'react';
import { EMSDossier } from '../types/ems';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Copy,
  Printer,
  RotateCcw,
  Sparkles,
  Info,
} from 'lucide-react';

interface TechnicalAuditProps {
  suppliers: EMSDossier[];
  onSelectSupplierToInspect: (s: EMSDossier) => void;
}

interface AuditQuestion {
  id: string;
  category: 'gate' | 'power' | 'traceability' | 'quality' | 'cyber';
  pillarNumber: number;
  question: string;
  explanation: string;
  score: number; // 1 to 5
}

export const TechnicalAudit: React.FC<TechnicalAuditProps> = ({
  suppliers,
  onSelectSupplierToInspect,
}) => {
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('custom');
  const [supplierName, setSupplierName] = useState('Candidate Electronics CM');

  // Hard Gate States
  const [hasIso9001, setHasIso9001] = useState(true);
  const [isoRegistrar, setIsoRegistrar] = useState('BSI / TÜV / ANAB Accredited');
  const [isChinaFree, setIsChinaFree] = useState(true);
  const [chinaFreeNote, setChinaFreeNote] = useState(
    'Full NDAA 889 and TAA compliance. Air-gapped US/Allied programming station.'
  );

  // High-Power Technical Gates
  const [heavyCopperCapable, setHeavyCopperCapable] = useState(true);
  const [sicGanCapable, setSicGanCapable] = useState(true);
  const [thermalCyclingCapable, setThermalCyclingCapable] = useState(true);
  const [hvPottingCapable, setHvPottingCapable] = useState(true);
  const [ipcClass3Mandatory, setIpcClass3Mandatory] = useState(true);

  // Scores across the 7 pillars (1 to 5)
  const [pillarScores, setPillarScores] = useState({
    financial: 4.2,
    highPower: 4.5,
    traceability: 4.4,
    quality: 4.6,
    costProxy: 3.8,
    logistics: 4.3,
    cybersecurity: 4.5,
  });

  const [copied, setCopied] = useState(false);

  // Load a supplier's data into the audit worksheet
  const loadSupplierData = (s: EMSDossier) => {
    setSelectedSupplierId(s.id);
    setSupplierName(s.name);
    setHasIso9001(s.hardGates.iso9001 === 'PASS');
    setIsoRegistrar(s.hardGates.iso9001Registrar || 'Not verified');
    setIsChinaFree(s.hardGates.chinaFreeRisk === 'LOW RISK');
    setChinaFreeNote(s.hardGates.chinaFreeRationale);

    setHeavyCopperCapable(s.highPower.heavyCopper);
    setSicGanCapable(s.highPower.sicGanAssembly);
    setThermalCyclingCapable(s.highPower.thermalCycling);
    setHvPottingCapable(s.highPower.highVoltagePotting);
    setIpcClass3Mandatory(s.highPower.ipcA610Class3);

    const scoresObj = { ...pillarScores };
    s.pillars.forEach((p) => {
      scoresObj[p.categoryKey] = p.score;
    });
    setPillarScores(scoresObj);
  };

  // Enforce Hard Gate 1: If ISO 9001 fails, quality management score is capped at 1.0!
  const effectiveQualityScore = !hasIso9001 ? 1.0 : pillarScores.quality;

  // Enforce Hard Gate 2: If China Free is violated, cyber risk score is capped at 1.0!
  const effectiveCyberScore = !isChinaFree ? 1.0 : pillarScores.cybersecurity;

  // Compute composite score
  const compositeScore = parseFloat(
    (
      (pillarScores.financial +
        pillarScores.highPower +
        pillarScores.traceability +
        effectiveQualityScore +
        pillarScores.costProxy +
        pillarScores.logistics +
        effectiveCyberScore) /
      7
    ).toFixed(1)
  );

  const isGateFailure = !hasIso9001 || !isChinaFree;

  const handleCopyAudit = () => {
    const text = `================================================================================
EMS TECHNICAL AUDIT & HARD GATE VERIFICATION REPORT
SUPPLIER: ${supplierName.toUpperCase()}
AUDIT DATE: ${new Date().toISOString().split('T')[0]}
================================================================================

1. MANDATORY HARD GATE COMPLIANCE:
- ISO 9001 Certification: ${hasIso9001 ? 'PASS' : 'FAIL (DISQUALIFIED / CAPPED)'} (Registrar: ${isoRegistrar})
- China-Free Firmware / NDAA 889: ${isChinaFree ? 'LOW RISK' : 'CRITICAL RISK / FAIL'}
  Rationale: ${chinaFreeNote}

2. HIGH-POWER PROCESS GATES:
- Heavy Copper (>= 4oz): ${heavyCopperCapable ? 'VERIFIED' : 'FAILED / UNVERIFIED'}
- SiC / GaN Assembly (<5% voiding): ${sicGanCapable ? 'VERIFIED' : 'FAILED / UNVERIFIED'}
- Thermal Cycling (-40C to +125C): ${thermalCyclingCapable ? 'VERIFIED' : 'FAILED / UNVERIFIED'}
- High-Voltage Potting (>5kV test): ${hvPottingCapable ? 'VERIFIED' : 'FAILED / UNVERIFIED'}
- IPC-A-610 Class 3: ${ipcClass3Mandatory ? 'VERIFIED' : 'FAILED (Class 2 only)'}

3. LEVEL 1 SCORECARD EVALUATION:
- Financial Performance: ${pillarScores.financial.toFixed(1)} / 5.0
- High-Power EMS Experience: ${pillarScores.highPower.toFixed(1)} / 5.0
- Traceability & Certificate of Origin: ${pillarScores.traceability.toFixed(1)} / 5.0
- Quality Management: ${effectiveQualityScore.toFixed(1)} / 5.0 ${!hasIso9001 ? '[CAPPED AT 1.0 DUE TO ISO 9001 FAIL]' : ''}
- Cost Per Product (Proxy): ${pillarScores.costProxy.toFixed(1)} / 5.0
- Logistical Services: ${pillarScores.logistics.toFixed(1)} / 5.0
- Cybersecurity & Software Risk: ${effectiveCyberScore.toFixed(1)} / 5.0 ${!isChinaFree ? '[CRITICAL RISK APPLIED]' : ''}

OVERALL COMPOSITE SCORE: ${compositeScore.toFixed(1)} / 5.0
PROCUREMENT VERDICT: ${isGateFailure ? 'REJECTED / HARD GATE NON-COMPLIANT' : compositeScore >= 4.0 ? 'APPROVED FOR RFQ TIER-1 / TIER-2' : 'PROVISIONAL / REQUIRES AUDIT MITIGATION'}
`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span className="font-mono uppercase font-semibold text-slate-600">
              MODE C TECHNICAL AUDIT
            </span>
            <span aria-hidden="true">·</span>
            <span>Supplier Verification &amp; Hard Gate Audit</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Interactive EMS Technical Audit Worksheet
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Audit any supplier candidate against strict ISO 9001 gates, China-free firmware rules, and high-power technical requirements.
          </p>
        </div>

        {/* Load Preset or Actions */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">Pre-fill data:</span>
            <select
              value={selectedSupplierId}
              onChange={(e) => {
                const s = suppliers.find((item) => item.id === e.target.value);
                if (s) {
                  loadSupplierData(s);
                } else {
                  setSelectedSupplierId('custom');
                  setSupplierName('Candidate Electronics CM');
                }
              }}
              className="bg-white border border-slate-300 rounded px-2.5 py-1.5 font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
            >
              <option value="custom">Blank / Custom Audit</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleCopyAudit}
            className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 shadow-xs"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{copied ? 'Copied Report!' : 'Copy Report'}</span>
          </button>
        </div>
      </div>

      {/* Audit Banner with Live Composite Calculation */}
      <div
        className={`p-6 rounded-lg border transition-colors shadow-xs ${
          isGateFailure
            ? 'border-rose-300 bg-rose-50/50'
            : compositeScore >= 4.0
            ? 'border-emerald-300 bg-emerald-50/40'
            : 'border-slate-200 bg-white'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-500">
              AUDIT TARGET: {supplierName}
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              {isGateFailure
                ? 'CRITICAL HARD GATE FAILURE — SUPPLIER REJECTED'
                : compositeScore >= 4.5
                ? 'BEST-IN-CLASS VERIFIED HIGH-POWER CM'
                : compositeScore >= 4.0
                ? 'STRONG LOW-RISK ALLIED SUPPLIER'
                : 'PROVISIONAL SUPPLIER — CONDITIONAL GATES'}
            </h2>
            <p className="text-xs text-slate-600">
              {!hasIso9001 && '• ISO 9001 Gate Failed: Quality Management capped at 1.0\n'}
              {!isChinaFree && '• China-Free Rule Failed: Cybersecurity score capped at 1.0\n'}
              {!isGateFailure && 'All non-negotiable hard gates verified compliant.'}
            </p>
          </div>

          <div className="flex items-center gap-6 shrink-0 bg-white p-4 rounded-lg border border-slate-200">
            <div>
              <div className="text-2xs font-semibold text-slate-500 uppercase tracking-wider">
                Audit Composite
              </div>
              <div className="font-mono text-3xl font-extrabold text-slate-900">
                {compositeScore.toFixed(1)}
                <span className="text-sm font-normal text-slate-400"> / 5.0</span>
              </div>
            </div>
            <div className="w-px h-12 bg-slate-200" />
            <div className="text-xs text-slate-600">
              <div>Gates: <span className={`font-bold ${isGateFailure ? 'text-rose-600' : 'text-emerald-600'}`}>{isGateFailure ? 'FAIL' : 'PASS'}</span></div>
              <div>IPC Class: <span className="font-bold">{ipcClass3Mandatory ? 'Class 3' : 'Class 2'}</span></div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Hard Gates & High Power Checklist */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Non-Negotiable Hard Gates */}
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  1. Non-Negotiable Hard Gates (Mandatory)
                </h3>
                <p className="text-xs text-slate-500">
                  Any failure here triggers instant score capping or proposal rejection
                </p>
              </div>
              <span className="text-2xs font-mono font-bold px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded">
                HARD GATES
              </span>
            </div>

            {/* Gate 1: ISO 9001 */}
            <div className={`p-4 rounded-md border ${hasIso9001 ? 'border-slate-200 bg-slate-50/50' : 'border-rose-300 bg-rose-50/60'}`}>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                    {hasIso9001 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-600" />
                    )}
                    <span>ISO 9001 Mandatory Certification</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    The manufacturer must possess a verified ISO 9001 certification. If missing, flag as FAIL and cap the Quality Management score at 1.0.
                  </p>
                  <div className="pt-2 flex items-center gap-3">
                    <label className="text-xs text-slate-700 flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="isoGate"
                        checked={hasIso9001}
                        onChange={() => setHasIso9001(true)}
                        className="text-slate-900 focus:ring-slate-900"
                      />
                      <span className="font-semibold text-emerald-700">PASS (Verified Certificate)</span>
                    </label>
                    <label className="text-xs text-slate-700 flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="isoGate"
                        checked={!hasIso9001}
                        onChange={() => setHasIso9001(false)}
                        className="text-slate-900 focus:ring-slate-900"
                      />
                      <span className="font-semibold text-rose-700">FAIL (Uncertified / Expired)</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Gate 2: China-Free Rule */}
            <div className={`p-4 rounded-md border ${isChinaFree ? 'border-slate-200 bg-slate-50/50' : 'border-rose-300 bg-rose-50/60'}`}>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                    {isChinaFree ? (
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <ShieldAlert className="w-4 h-4 text-rose-600" />
                    )}
                    <span>China-Free Software/Firmware Rule (NDAA 889 &amp; TAA)</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Zero tolerance for microcontrollers, SoCs, communication modules, or firmware controlled by entities subject to Chinese jurisdiction. The CM must support NDAA Section 889 and TAA compliance with secure US/allied programming environments.
                  </p>
                  <div className="pt-2 flex items-center gap-3">
                    <label className="text-xs text-slate-700 flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="chinaGate"
                        checked={isChinaFree}
                        onChange={() => setIsChinaFree(true)}
                        className="text-slate-900 focus:ring-slate-900"
                      />
                      <span className="font-semibold text-emerald-700">LOW RISK (NDAA 889 &amp; TAA Compliant)</span>
                    </label>
                    <label className="text-xs text-slate-700 flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="chinaGate"
                        checked={!isChinaFree}
                        onChange={() => setIsChinaFree(false)}
                        className="text-slate-900 focus:ring-slate-900"
                      />
                      <span className="font-semibold text-rose-700">HIGH RISK (PRC Linked / Non-Compliant)</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: High-Power Focus Technical Capabilities */}
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                2. High-Power Focus Technical Audits
              </h3>
              <p className="text-xs text-slate-500">
                Heavy copper, selective soldering, thermal cycling, potting, SiC/GaN, and IPC Class 3
              </p>
            </div>

            <div className="space-y-3 text-xs">
              {/* Check 1: Heavy Copper */}
              <label className="flex items-start gap-3 p-3 rounded border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={heavyCopperCapable}
                  onChange={(e) => setHeavyCopperCapable(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                />
                <div>
                  <div className="font-bold text-slate-900">Heavy-Copper PCB Fabrication &amp; Soldering (&gt;= 4oz)</div>
                  <div className="text-slate-600">
                    Selective wave soldering with inert nitrogen blanket (&lt;50 ppm O2) and pre-heating to prevent barrel cracking on thick copper planes.
                  </div>
                </div>
              </label>

              {/* Check 2: SiC / GaN */}
              <label className="flex items-start gap-3 p-3 rounded border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sicGanCapable}
                  onChange={(e) => setSicGanCapable(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                />
                <div>
                  <div className="font-bold text-slate-900">Wide-Bandgap SiC / GaN Assembly &amp; Vacuum Reflow</div>
                  <div className="text-slate-600">
                    Vacuum vapor phase or vacuum reflow oven to guarantee &lt;5% solder voiding under thermal pads of power MOSFETs, verified by automated 3D X-ray (AXI).
                  </div>
                </div>
              </label>

              {/* Check 3: Thermal Cycling */}
              <label className="flex items-start gap-3 p-3 rounded border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={thermalCyclingCapable}
                  onChange={(e) => setThermalCyclingCapable(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                />
                <div>
                  <div className="font-bold text-slate-900">Thermal Shock &amp; Stress Screening (-40°C to +125°C)</div>
                  <div className="text-slate-600">
                    In-house environmental dual-zone chambers running MIL-STD-883 or automotive thermal shock profiles for 500+ cycles with live electrical monitoring.
                  </div>
                </div>
              </label>

              {/* Check 4: High Voltage Potting */}
              <label className="flex items-start gap-3 p-3 rounded border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hvPottingCapable}
                  onChange={(e) => setHvPottingCapable(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                />
                <div>
                  <div className="font-bold text-slate-900">High-Voltage Potting &amp; Dielectric Testing (&gt;5kV)</div>
                  <div className="text-slate-600">
                    Vacuum degasification dispensing to eliminate micro-voids, followed by production hipo partial discharge verification at 5000V DC.
                  </div>
                </div>
              </label>

              {/* Check 5: IPC-A-610 Class 3 */}
              <label className="flex items-start gap-3 p-3 rounded border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={ipcClass3Mandatory}
                  onChange={(e) => setIpcClass3Mandatory(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                />
                <div>
                  <div className="font-bold text-slate-900">IPC-A-610 Class 3 High-Reliability Inspection Baseline</div>
                  <div className="text-slate-600">
                    Certified on-site IPC Trainers (CIT) and Certified IPC Specialists (CIS) dedicated to Class 3 harsh environment criteria.
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: 7 Pillar Score Adjusters */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                3. The 7 Evaluation Pillars (1.0 - 5.0)
              </h3>
              <p className="text-xs text-slate-500">
                Adjust scores based on verifiable public records and supplier RFI submissions
              </p>
            </div>

            <div className="space-y-4 text-xs">
              {/* Pillar 1 */}
              <div>
                <div className="flex justify-between font-semibold text-slate-800 mb-1">
                  <span>1. Financial Performance</span>
                  <span className="font-mono">{pillarScores.financial.toFixed(1)} / 5</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="0.1"
                  value={pillarScores.financial}
                  onChange={(e) =>
                    setPillarScores({ ...pillarScores, financial: parseFloat(e.target.value) })
                  }
                  className="w-full accent-slate-900"
                />
              </div>

              {/* Pillar 2 */}
              <div>
                <div className="flex justify-between font-semibold text-slate-800 mb-1">
                  <span>2. High-Power Experience</span>
                  <span className="font-mono">{pillarScores.highPower.toFixed(1)} / 5</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="0.1"
                  value={pillarScores.highPower}
                  onChange={(e) =>
                    setPillarScores({ ...pillarScores, highPower: parseFloat(e.target.value) })
                  }
                  className="w-full accent-slate-900"
                />
              </div>

              {/* Pillar 3 */}
              <div>
                <div className="flex justify-between font-semibold text-slate-800 mb-1">
                  <span>3. Traceability &amp; Origin</span>
                  <span className="font-mono">{pillarScores.traceability.toFixed(1)} / 5</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="0.1"
                  value={pillarScores.traceability}
                  onChange={(e) =>
                    setPillarScores({ ...pillarScores, traceability: parseFloat(e.target.value) })
                  }
                  className="w-full accent-slate-900"
                />
              </div>

              {/* Pillar 4 (Quality Management) */}
              <div className={!hasIso9001 ? 'opacity-70 bg-rose-50 p-2 rounded border border-rose-200' : ''}>
                <div className="flex justify-between font-semibold text-slate-800 mb-1">
                  <span>4. Quality Management</span>
                  <span className="font-mono font-bold text-slate-900">
                    {effectiveQualityScore.toFixed(1)} / 5
                  </span>
                </div>
                {!hasIso9001 ? (
                  <div className="text-2xs text-rose-700 font-semibold">
                    CAPPED AT 1.0 (ISO 9001 Gate Failure)
                  </div>
                ) : (
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="0.1"
                    value={pillarScores.quality}
                    onChange={(e) =>
                      setPillarScores({ ...pillarScores, quality: parseFloat(e.target.value) })
                    }
                    className="w-full accent-slate-900"
                  />
                )}
              </div>

              {/* Pillar 5 */}
              <div>
                <div className="flex justify-between font-semibold text-slate-800 mb-1">
                  <span>5. Cost Per Product (Proxy)</span>
                  <span className="font-mono">{pillarScores.costProxy.toFixed(1)} / 5</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="0.1"
                  value={pillarScores.costProxy}
                  onChange={(e) =>
                    setPillarScores({ ...pillarScores, costProxy: parseFloat(e.target.value) })
                  }
                  className="w-full accent-slate-900"
                />
              </div>

              {/* Pillar 6 */}
              <div>
                <div className="flex justify-between font-semibold text-slate-800 mb-1">
                  <span>6. Logistical Services</span>
                  <span className="font-mono">{pillarScores.logistics.toFixed(1)} / 5</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="0.1"
                  value={pillarScores.logistics}
                  onChange={(e) =>
                    setPillarScores({ ...pillarScores, logistics: parseFloat(e.target.value) })
                  }
                  className="w-full accent-slate-900"
                />
              </div>

              {/* Pillar 7 (Cybersecurity) */}
              <div className={!isChinaFree ? 'opacity-70 bg-rose-50 p-2 rounded border border-rose-200' : ''}>
                <div className="flex justify-between font-semibold text-slate-800 mb-1">
                  <span>7. Cybersecurity &amp; Software</span>
                  <span className="font-mono font-bold text-slate-900">
                    {effectiveCyberScore.toFixed(1)} / 5
                  </span>
                </div>
                {!isChinaFree ? (
                  <div className="text-2xs text-rose-700 font-semibold">
                    CAPPED AT 1.0 (China-Free Rule Violation)
                  </div>
                ) : (
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="0.1"
                    value={pillarScores.cybersecurity}
                    onChange={(e) =>
                      setPillarScores({
                        ...pillarScores,
                        cybersecurity: parseFloat(e.target.value),
                      })
                    }
                    className="w-full accent-slate-900"
                  />
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-900">Overall Composite:</span>
              <span className="font-mono font-extrabold text-base text-slate-900">
                {compositeScore.toFixed(1)} / 5.0
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
