import React, { useState } from 'react';
import { EMSDossier } from '../types/ems';
import {
  ShieldAlert,
  ShieldCheck,
  Zap,
  Copy,
  Printer,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  Search,
  Sparkles,
  ExternalLink,
  Info,
} from 'lucide-react';
import { PillarRadarChart } from './PillarRadarChart';
import { AuditLoadingBar } from './AuditLoadingBar';

interface DossierViewProps {
  dossier: EMSDossier;
  allDossiers: EMSDossier[];
  onSelectSupplier: (dossier: EMSDossier) => void;
  onEvaluateNew: (name: string, context?: string) => Promise<void>;
  isLoading: boolean;
  onAddToCompare: (dossier: EMSDossier) => void;
  onGenerateRfqForSupplier: (dossier: EMSDossier) => void;
  onNavigateToLevel2?: (dossier: EMSDossier) => void;
}

export const DossierView: React.FC<DossierViewProps> = ({
  dossier,
  allDossiers,
  onSelectSupplier,
  onEvaluateNew,
  isLoading,
  onAddToCompare,
  onGenerateRfqForSupplier,
  onNavigateToLevel2,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [projectContext, setProjectContext] = useState('');
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [evaluatingName, setEvaluatingName] = useState('');

  const handleTriggerAudit = async (targetName: string, context?: string) => {
    if (!targetName.trim() || isLoading) return;
    setEvaluatingName(targetName.trim());
    await onEvaluateNew(targetName.trim(), context);
  };

  // Generate markdown matching the exact required format
  const generateMarkdownDossier = (d: EMSDossier): string => {
    return `## ${d.name} — Level 1 Supplier Evaluation Dossier
**Headquarters:** ${d.headquarters}  
**EMS Tier / Ownership:** ${d.tickerOrOwnership}  
**Primary Facilities:** ${d.primaryFacilities.join(', ')}  
**Hard Gate Compliance:** 
- ISO 9001: ${d.hardGates.iso9001} ${d.hardGates.iso9001Registrar ? `(${d.hardGates.iso9001Registrar})` : ''}
- China-Free Firmware/NDAA 889: ${d.hardGates.chinaFreeRisk} — ${d.hardGates.chinaFreeRationale}

### Level 1 Scorecard (Public Verifiable Data)
| # | Evaluation Pillar | Score (1-5) | Public Evidence & Proxy Rationale |
|---|---|:---:|---|
${d.pillars
  .map(
    (p) =>
      `| ${p.pillarNumber} | **${p.name}** | ${p.score.toFixed(1)} / 5 | ${p.evidence} |`
  )
  .join('\n')}

**Overall Level 1 Composite Score: ${d.compositeScore.toFixed(1)} / 5.0**

### Strategic Summary & Key Risks:
- **Strengths:** 
${d.strengths.map((s) => `  - ${s}`).join('\n')}
- **Red Flags / Risks:** 
${d.redFlags.map((r) => `  - ${r}`).join('\n')}
- **Recommended Questions for RFI/RFQ:** 
${d.recommendedRfiQuestions.map((q, idx) => `  ${idx + 1}. ${q}`).join('\n')}
`;
  };

  const handleCopyMarkdown = () => {
    const md = generateMarkdownDossier(dossier);
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const getScoreColor = (score: number) => {
    if (score >= 4.5) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (score >= 4.0) return 'text-blue-700 bg-blue-50 border-blue-200';
    if (score >= 3.0) return 'text-slate-700 bg-slate-50 border-slate-200';
    if (score >= 2.0) return 'text-amber-700 bg-amber-50 border-amber-200';
    return 'text-rose-700 bg-rose-50 border-rose-200';
  };

  const getScoreTierLabel = (score: number) => {
    if (score >= 4.7) return '5.0 Best-in-Class / Gold Standard';
    if (score >= 4.0) return '4.0 Strong / Low Risk';
    if (score >= 3.0) return '3.0 Acceptable / Industry Baseline';
    if (score >= 2.0) return '2.0 Weak / High Risk';
    return '1.0 Critical Risk / Non-Compliant';
  };

  const filteredPresets = allDossiers.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Supplier Switcher & Live Lookup Bar */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Supplier Due-Diligence Dossier
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Level 1 public intelligence vetting across 7 core pillars and 3 non-negotiable gates
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search manufacturer (or press Enter to audit)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    handleTriggerAudit(searchQuery.trim());
                  }
                }}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white"
              />
            </div>

            <button
              onClick={() => setShowCustomModal(true)}
              className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5 text-slate-700" />
              <span>Audit Any Supplier</span>
            </button>
          </div>
        </div>

        {/* Unlisted Search Result Banner */}
        {searchQuery.trim() && filteredPresets.length === 0 && (
          <div className="p-3 bg-slate-900 text-white rounded-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>"{searchQuery}"</strong> is unlisted in the pre-vetted database. Press Enter or click to audit across public registries and technical gates.
              </span>
            </div>
            <button
              onClick={() => handleTriggerAudit(searchQuery.trim())}
              disabled={isLoading}
              className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-900 bg-white hover:bg-slate-100 rounded shrink-0 transition-colors shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-slate-900" />
              <span>{isLoading ? 'Auditing...' : `Audit "${searchQuery}" →`}</span>
            </button>
          </div>
        )}

        {/* Quick select chip list */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs text-slate-600">
          <span className="font-semibold text-slate-400 whitespace-nowrap">Vetted:</span>
          {filteredPresets.map((s) => (
            <button
              key={s.id}
              onClick={() => onSelectSupplier(s)}
              className={`cursor-pointer px-2.5 py-1 rounded text-xs transition-colors whitespace-nowrap ${
                s.id === dossier.id
                  ? 'bg-slate-900 text-white font-medium'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {s.name.split(' ')[0]}
              {s.hardGates.iso9001 === 'FAIL' && ' (Gate Fail)'}
            </button>
          ))}
        </div>
      </div>

      {/* Real-time Audit Loading Bar when searching an unlisted company */}
      {isLoading && (
        <AuditLoadingBar companyName={evaluatingName || searchQuery || 'Target Supplier'} />
      )}

      {/* Main Dossier Document Container */}
      <div className={`bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden print:border-none print:shadow-none transition-opacity ${isLoading ? 'opacity-40 pointer-events-none' : ''}`}>
        {/* Document Header Bar */}
        <div className="p-6 sm:p-8 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-mono uppercase tracking-wider text-slate-600 font-semibold">
                MODE A DUE-DILIGENCE
              </span>
              <span aria-hidden="true">·</span>
              <span>{dossier.tier}</span>
              <span aria-hidden="true">·</span>
              <span>{dossier.regionCategory}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              {dossier.name} — Level 1 Supplier Evaluation Dossier
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2 text-xs text-slate-600 pt-1">
              <div>
                <span className="font-semibold text-slate-900">Headquarters:</span> {dossier.headquarters}
              </div>
              <div>
                <span className="font-semibold text-slate-900">EMS Tier / Ownership:</span> {dossier.tickerOrOwnership}
              </div>
              <div>
                <span className="font-semibold text-slate-900">Primary Facilities:</span> {dossier.primaryFacilities.join(', ')}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0 print:hidden">
            <button
              onClick={handleCopyMarkdown}
              className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors shadow-xs"
              title="Copy exact markdown format"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copied ? 'Copied MD!' : 'Copy Markdown'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors shadow-xs"
              title="Print or export to PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
            <button
              onClick={() => onAddToCompare(dossier)}
              className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors shadow-xs"
            >
              <span>+ Compare</span>
            </button>
            <button
              onClick={() => onGenerateRfqForSupplier(dossier)}
              className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors shadow-xs"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>RFQ Spec</span>
            </button>
            {onNavigateToLevel2 && (
              <button
                onClick={() => onNavigateToLevel2(dossier)}
                className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Level 2 Eval (RFI/RFQ)</span>
              </button>
            )}
          </div>
        </div>

        {/* Hard Gates Section */}
        <div className="p-6 sm:p-8 border-b border-slate-200 bg-slate-50/20">
          <div className="mb-4">
            <h3 className="text-sm font-bold tracking-tight text-slate-900 uppercase">
              Hard Gate Compliance &amp; Non-Negotiable Screening
            </h3>
            <p className="text-xs text-slate-500">
              Immediate disqualification or quality cap applied if mandatory standards fail
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Gate 1: ISO 9001 */}
            <div
              className={`p-4 rounded-lg border ${
                dossier.hardGates.iso9001 === 'PASS'
                  ? 'border-emerald-200 bg-emerald-50/40'
                  : dossier.hardGates.iso9001 === 'FAIL'
                  ? 'border-rose-300 bg-rose-50/70'
                  : 'border-amber-200 bg-amber-50/40'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {dossier.hardGates.iso9001 === 'PASS' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : dossier.hardGates.iso9001 === 'FAIL' ? (
                      <XCircle className="w-4 h-4 text-rose-600" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                    )}
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      ISO 9001 Mandatory Gate
                    </span>
                  </div>
                  <div className="text-xs text-slate-700">
                    Registrar: <span className="font-semibold">{dossier.hardGates.iso9001Registrar || 'Not on file'}</span>
                  </div>
                  {dossier.hardGates.iso9001 === 'FAIL' && (
                    <div className="text-xs font-semibold text-rose-700">
                      GATE VIOLATION: Missing accredited ISO 9001. Quality Management pillar capped at 1.0.
                    </div>
                  )}
                </div>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded ${
                    dossier.hardGates.iso9001 === 'PASS'
                      ? 'bg-emerald-100 text-emerald-800'
                      : dossier.hardGates.iso9001 === 'FAIL'
                      ? 'bg-rose-200 text-rose-900'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {dossier.hardGates.iso9001}
                </span>
              </div>
            </div>

            {/* Gate 2: China-Free Firmware / NDAA 889 */}
            <div
              className={`p-4 rounded-lg border ${
                dossier.hardGates.chinaFreeRisk === 'LOW RISK'
                  ? 'border-emerald-200 bg-emerald-50/40'
                  : dossier.hardGates.chinaFreeRisk === 'HIGH RISK'
                  ? 'border-rose-300 bg-rose-50/70'
                  : 'border-amber-200 bg-amber-50/40'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {dossier.hardGates.chinaFreeRisk === 'LOW RISK' ? (
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <ShieldAlert className="w-4 h-4 text-rose-600" />
                    )}
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      China-Free Firmware / NDAA 889 Rule
                    </span>
                  </div>
                  <div className="text-xs text-slate-700 line-clamp-2">
                    {dossier.hardGates.chinaFreeRationale}
                  </div>
                  <div className="text-xs text-slate-500">
                    ITAR: {dossier.itarRegistered ? 'Registered' : 'No'} · TAA Compliant: {dossier.taaCompliant ? 'Yes' : 'No'}
                  </div>
                </div>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded shrink-0 ${
                    dossier.hardGates.chinaFreeRisk === 'LOW RISK'
                      ? 'bg-emerald-100 text-emerald-800'
                      : dossier.hardGates.chinaFreeRisk === 'HIGH RISK'
                      ? 'bg-rose-200 text-rose-900'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {dossier.hardGates.chinaFreeRisk}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* High-Power Focus Audit Bar */}
        <div className="p-6 sm:p-8 border-b border-slate-200 bg-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold tracking-tight text-slate-900 uppercase">
                High-Power Electronics Technical Capabilities
              </h3>
              <p className="text-xs text-slate-500">
                Heavy copper, wide-bandgap SiC/GaN, thermal cycling, and high-voltage dielectric isolation
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Status: {dossier.hardGates.highPowerVerified ? 'Verified Capable' : 'Unverified / Inadequate'}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
            <div className={`p-3 rounded border ${dossier.highPower.heavyCopper ? 'border-slate-300 bg-slate-50' : 'border-slate-200 opacity-60'}`}>
              <div className="font-bold text-slate-900 mb-1">Heavy Copper (&gt;=4oz)</div>
              <p className="text-slate-600 text-2xs leading-relaxed">{dossier.highPower.heavyCopperDetail}</p>
            </div>

            <div className={`p-3 rounded border ${dossier.highPower.sicGanAssembly ? 'border-slate-300 bg-slate-50' : 'border-slate-200 opacity-60'}`}>
              <div className="font-bold text-slate-900 mb-1">SiC / GaN Assembly</div>
              <p className="text-slate-600 text-2xs leading-relaxed">{dossier.highPower.sicGanDetail}</p>
            </div>

            <div className={`p-3 rounded border ${dossier.highPower.thermalCycling ? 'border-slate-300 bg-slate-50' : 'border-slate-200 opacity-60'}`}>
              <div className="font-bold text-slate-900 mb-1">Thermal Shock (-40°C/+125°C)</div>
              <p className="text-slate-600 text-2xs leading-relaxed">{dossier.highPower.thermalCyclingDetail}</p>
            </div>

            <div className={`p-3 rounded border ${dossier.highPower.highVoltagePotting ? 'border-slate-300 bg-slate-50' : 'border-slate-200 opacity-60'}`}>
              <div className="font-bold text-slate-900 mb-1">HV Potting &amp; Testing</div>
              <p className="text-slate-600 text-2xs leading-relaxed">{dossier.highPower.highVoltagePottingDetail}</p>
            </div>

            <div className={`p-3 rounded border ${dossier.highPower.ipcA610Class3 ? 'border-slate-300 bg-slate-50' : 'border-slate-200 opacity-60'}`}>
              <div className="font-bold text-slate-900 mb-1">IPC-A-610 Class 3</div>
              <p className="text-slate-600 text-2xs leading-relaxed">{dossier.highPower.ipcDetail}</p>
            </div>
          </div>
        </div>

        {/* 7 Pillars Radar Chart & Relative Gap Matrix */}
        <div className="p-6 sm:p-8 border-b border-slate-200 bg-slate-50/30">
          <PillarRadarChart dossier={dossier} />
        </div>

        {/* Level 1 Scorecard Table across 7 Evaluation Pillars */}
        <div className="p-6 sm:p-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-lg font-bold tracking-tight text-slate-900">
                Level 1 Scorecard (Public Verifiable Data)
              </h3>
              <p className="text-xs text-slate-500">
                Standardized 1.0 to 5.0 scale grounded in SEC 10-K, trade registries, and technical audits
              </p>
            </div>

            <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <span className="text-xs text-slate-600 font-medium">Overall Composite Score:</span>
              <span className="font-mono text-xl font-extrabold text-slate-900">
                {dossier.compositeScore.toFixed(1)} / 5.0
              </span>
              <span className="text-xs text-slate-500">
                ({getScoreTierLabel(dossier.compositeScore)})
              </span>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4 w-56">Evaluation Pillar</th>
                  <th className="py-3 px-4 w-28 text-center">Score (1-5)</th>
                  <th className="py-3 px-4">Public Evidence &amp; Proxy Rationale</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {dossier.pillars.map((pillar) => (
                  <tr key={pillar.pillarNumber} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-400 text-center">
                      {pillar.pillarNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{pillar.name}</div>
                      {pillar.categoryKey === 'quality' && dossier.hardGates.iso9001 === 'FAIL' && (
                        <div className="text-2xs text-rose-600 font-semibold mt-0.5">
                          Capped at 1.0 (ISO 9001 Gate Failure)
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center justify-center font-mono font-bold text-xs px-2.5 py-1 rounded border tabular-nums">
                        {pillar.score.toFixed(1)} / 5
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 leading-relaxed">
                      {pillar.evidence}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Strategic Summary & Key Risks */}
        <div className="p-6 sm:p-8 bg-slate-50/50 border-t border-slate-200 space-y-6">
          <h3 className="text-base font-bold tracking-tight text-slate-900">
            Strategic Summary &amp; Key Risks
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Strengths */}
            <div className="p-5 bg-white rounded-lg border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Top Verifiable Strengths</span>
              </h4>
              <ul className="space-y-2 text-xs text-slate-700">
                {dossier.strengths.map((str, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold mt-0.5">•</span>
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Red Flags / Risks */}
            <div className="p-5 bg-white rounded-lg border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Red Flags &amp; Vulnerabilities</span>
              </h4>
              <ul className="space-y-2 text-xs text-slate-700">
                {dossier.redFlags.map((flag, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-rose-500 font-bold mt-0.5">•</span>
                    <span>{flag}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Recommended Questions for RFI/RFQ */}
          <div className="p-5 bg-white rounded-lg border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-slate-600" />
              <span>Recommended Direct Questions for RFI/RFQ</span>
            </h4>
            <div className="space-y-2.5 text-xs text-slate-800">
              {dossier.recommendedRfiQuestions.map((q, i) => (
                <div key={i} className="flex items-start gap-2.5 p-2 bg-slate-50 rounded">
                  <span className="font-mono font-bold text-slate-500">{i + 1}.</span>
                  <span className="font-medium">{q}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Level 2 Secondary Evaluation Callout Card */}
          {onNavigateToLevel2 && (
            <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-3xs uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-400 text-slate-900">
                    STAGE 2 SOURCING
                  </span>
                  <span className="text-xs text-slate-300">
                    Level 2 Secondary Evaluation
                  </span>
                </div>
                <h4 className="text-base font-bold text-white">
                  Audit {dossier.name}'s RFI / RFQ Submission &amp; Test Logs
                </h4>
                <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                  Transition from public Level 1 proxy screening to verified Level 2 technical test verification (3D AXI voiding &lt;5%, heavy copper microsections, dielectric test reports) and binding unit quotation analysis.
                </p>
              </div>

              <button
                onClick={() => onNavigateToLevel2(dossier)}
                className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-900 bg-white hover:bg-slate-100 rounded-md shrink-0 shadow-sm transition-colors"
              >
                <Sparkles className="w-4 h-4 text-slate-900" />
                <span>Launch Level 2 Eval →</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Audit Any Supplier Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-slate-900" />
                <h3 className="text-base font-bold text-slate-900">
                  Live Due-Diligence Audit
                </h3>
              </div>
              <button
                onClick={() => setShowCustomModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Enter any Electronics Manufacturing Services (EMS) company or Contract Manufacturer.
              The AI sourcing engine will audit public registries, SEC filings, and technical gates to produce a Level 1 Dossier.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Manufacturer Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sanmina, Keytronic, Foxconn, Vexos, SigmaTron..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Specific Project Requirements (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g., 800V 200A solar inverter with 6oz heavy copper and SiC MOSFETs, requiring ITAR and strict NDAA Section 889 compliance..."
                  value={projectContext}
                  onChange={(e) => setProjectContext(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                className="cursor-pointer px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!searchQuery.trim() || isLoading}
                onClick={async () => {
                  const targetName = searchQuery.trim();
                  setShowCustomModal(false);
                  await handleTriggerAudit(targetName, projectContext);
                }}
                className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded"
              >
                {isLoading ? 'Auditing Registries...' : 'Generate Level 1 Dossier'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
