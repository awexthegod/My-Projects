import React, { useState } from 'react';
import { EMSDossier } from '../types/ems';
import {
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Zap,
  ShieldCheck,
  Scale,
  Eye,
  FileText,
  Search,
  Sparkles,
} from 'lucide-react';

interface SourcingMatrixProps {
  suppliers: EMSDossier[];
  onSelectSupplier: (s: EMSDossier) => void;
  onOpenCompare: (selected: EMSDossier[]) => void;
  onGenerateRfq: (s: EMSDossier) => void;
  onAuditUnlisted?: (name: string) => void;
}

export const SourcingMatrix: React.FC<SourcingMatrixProps> = ({
  suppliers,
  onSelectSupplier,
  onOpenCompare,
  onGenerateRfq,
  onAuditUnlisted,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [requireIsoPass, setRequireIsoPass] = useState(false);
  const [requireChinaLowRisk, setRequireChinaLowRisk] = useState(false);
  const [requireHighPower, setRequireHighPower] = useState(false);
  const [requireHeavyCopper, setRequireHeavyCopper] = useState(false);
  const [requireSicGan, setRequireSicGan] = useState(false);
  const [requireItar, setRequireItar] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  const [compareIds, setCompareIds] = useState<string[]>([]);

  const toggleCompare = (id: string) => {
    if (compareIds.includes(id)) {
      setCompareIds(compareIds.filter((item) => item !== id));
    } else {
      if (compareIds.length >= 4) {
        alert('You can compare up to 4 suppliers simultaneously.');
        return;
      }
      setCompareIds([...compareIds, id]);
    }
  };

  const filtered = suppliers.filter((s) => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchName = s.name.toLowerCase().includes(q);
      const matchHq = s.headquarters.toLowerCase().includes(q);
      const matchFacilities = s.primaryFacilities.some((f) => f.toLowerCase().includes(q));
      if (!matchName && !matchHq && !matchFacilities) return false;
    }

    if (selectedTier !== 'all' && s.tier !== selectedTier) return false;
    if (selectedRegion !== 'all' && s.regionCategory !== selectedRegion) return false;
    if (requireIsoPass && s.hardGates.iso9001 !== 'PASS') return false;
    if (requireChinaLowRisk && s.hardGates.chinaFreeRisk !== 'LOW RISK') return false;
    if (requireHighPower && !s.hardGates.highPowerVerified) return false;
    if (requireHeavyCopper && !s.highPower.heavyCopper) return false;
    if (requireSicGan && !s.highPower.sicGanAssembly) return false;
    if (requireItar && !s.itarRegistered) return false;

    return true;
  });

  const selectedForCompare = suppliers.filter((s) => compareIds.includes(s.id));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header & Sourcing Summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span className="font-mono uppercase font-semibold text-slate-600">
              MODE B SOURCING ENGINE
            </span>
            <span aria-hidden="true">·</span>
            <span>Comparative Benchmarking &amp; Screening</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            High-Reliability EMS Sourcing Matrix
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Screen contract manufacturers by hard gates, power capabilities (heavy copper, SiC/GaN), certifications, and regional footprint.
          </p>
        </div>

        {/* View toggle & Compare button */}
        <div className="flex items-center gap-3">
          {compareIds.length > 0 && (
            <button
              onClick={() => onOpenCompare(selectedForCompare)}
              className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md shadow-xs transition-colors"
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Compare Selected ({compareIds.length})</span>
            </button>
          )}

          <div className="flex items-center bg-slate-100 p-0.5 rounded-md border border-slate-200">
            <button
              onClick={() => setViewMode('table')}
              className={`cursor-pointer px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Table View
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`cursor-pointer px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                viewMode === 'cards' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Card View
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Query Panel */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by supplier name, facility location, headquarters..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white"
            />
          </div>

          {/* Tier & Region Dropdowns */}
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Tier:</span>
              <select
                value={selectedTier}
                onChange={(e) => setSelectedTier(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value="all">All Tiers</option>
                <option value="Tier 1">Tier 1 (&gt;$5B)</option>
                <option value="Tier 2">Tier 2 ($500M-$5B)</option>
                <option value="Tier 3">Tier 3 (&lt;$500M)</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Region:</span>
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value="all">All Regions</option>
                <option value="US Domestic">US Domestic</option>
                <option value="USMCA / Mexico">USMCA / Mexico</option>
                <option value="Allied Europe">Allied Europe</option>
                <option value="Allied APAC">Allied APAC</option>
                <option value="Non-Compliant / Asia">Non-Compliant / Asia</option>
              </select>
            </div>
          </div>
        </div>

        {/* Checkbox Hard Gates & Capabilities Filters */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-700">
          <span className="font-semibold text-slate-900 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            Mandatory Filters:
          </span>

          <label className="inline-flex items-center gap-1.5 cursor-pointer hover:text-slate-900">
            <input
              type="checkbox"
              checked={requireIsoPass}
              onChange={(e) => setRequireIsoPass(e.target.checked)}
              className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
            />
            <span>ISO 9001 Gate (Pass Only)</span>
          </label>

          <label className="inline-flex items-center gap-1.5 cursor-pointer hover:text-slate-900">
            <input
              type="checkbox"
              checked={requireChinaLowRisk}
              onChange={(e) => setRequireChinaLowRisk(e.target.checked)}
              className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
            />
            <span>China-Free / NDAA 889 (Low Risk Only)</span>
          </label>

          <label className="inline-flex items-center gap-1.5 cursor-pointer hover:text-slate-900">
            <input
              type="checkbox"
              checked={requireHeavyCopper}
              onChange={(e) => setRequireHeavyCopper(e.target.checked)}
              className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
            />
            <span>Heavy Copper (&gt;=4oz)</span>
          </label>

          <label className="inline-flex items-center gap-1.5 cursor-pointer hover:text-slate-900">
            <input
              type="checkbox"
              checked={requireSicGan}
              onChange={(e) => setRequireSicGan(e.target.checked)}
              className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
            />
            <span>SiC / GaN Packaging</span>
          </label>

          <label className="inline-flex items-center gap-1.5 cursor-pointer hover:text-slate-900">
            <input
              type="checkbox"
              checked={requireItar}
              onChange={(e) => setRequireItar(e.target.checked)}
              className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
            />
            <span>ITAR Registered</span>
          </label>

          {(requireIsoPass || requireChinaLowRisk || requireHeavyCopper || requireSicGan || requireItar || selectedTier !== 'all' || selectedRegion !== 'all' || searchTerm) && (
            <button
              onClick={() => {
                setRequireIsoPass(false);
                setRequireChinaLowRisk(false);
                setRequireHeavyCopper(false);
                setRequireSicGan(false);
                setRequireItar(false);
                setSelectedTier('all');
                setSelectedRegion('all');
                setSearchTerm('');
              }}
              className="text-xs text-rose-600 hover:text-rose-800 font-medium ml-auto cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <div>
          Showing <span className="font-semibold text-slate-900">{filtered.length}</span> of{' '}
          <span className="font-semibold text-slate-900">{suppliers.length}</span> verified manufacturers
        </div>
        <div>
          Select checkboxes to run side-by-side technical comparison (max 4).
        </div>
      </div>

      {/* Empty State when no suppliers match */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-8 text-center space-y-4 shadow-xs">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-500">
            <Search className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">
              No matching suppliers found
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {searchTerm ? (
                <>No pre-vetted manufacturer matches <strong>"{searchTerm}"</strong> with your active filters.</>
              ) : (
                <>Try relaxing or resetting your active filter options.</>
              )}
            </p>
          </div>
          {searchTerm && onAuditUnlisted && (
            <button
              onClick={() => onAuditUnlisted(searchTerm.trim())}
              className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Audit "{searchTerm}" via Live Procurement Engine →</span>
            </button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <th className="py-3 px-3 w-10 text-center">Compare</th>
                <th className="py-3 px-4">Manufacturer</th>
                <th className="py-3 px-3">Tier</th>
                <th className="py-3 px-3">Headquarters</th>
                <th className="py-3 px-3 text-center">Composite Score</th>
                <th className="py-3 px-3 text-center">ISO 9001 Gate</th>
                <th className="py-3 px-3 text-center">China-Free / NDAA 889</th>
                <th className="py-3 px-3 text-center">High Power</th>
                <th className="py-3 px-3">Certifications</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filtered.map((s) => {
                const isSelected = compareIds.includes(s.id);
                return (
                  <tr
                    key={s.id}
                    className={`hover:bg-slate-50 transition-colors ${
                      isSelected ? 'bg-slate-50/80' : ''
                    }`}
                  >
                    <td className="py-3.5 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleCompare(s.id)}
                        className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                      />
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => onSelectSupplier(s)}
                        className="text-left font-bold text-slate-900 hover:text-slate-600 cursor-pointer block"
                      >
                        {s.name}
                      </button>
                      <div className="text-2xs text-slate-500">{s.tickerOrOwnership}</div>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="font-medium text-slate-700">{s.tier}</span>
                    </td>
                    <td className="py-3.5 px-3 text-slate-600 max-w-xs truncate" title={s.headquarters}>
                      {s.headquarters}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        {s.compositeScore.toFixed(1)}
                      </span>
                      <span className="text-2xs text-slate-400 block">/ 5.0</span>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded text-2xs ${
                          s.hardGates.iso9001 === 'PASS'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : s.hardGates.iso9001 === 'FAIL'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {s.hardGates.iso9001 === 'PASS' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                        {s.hardGates.iso9001 === 'FAIL' && <XCircle className="w-3 h-3 text-rose-600" />}
                        {s.hardGates.iso9001}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded text-2xs ${
                          s.hardGates.chinaFreeRisk === 'LOW RISK'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : s.hardGates.chinaFreeRisk === 'HIGH RISK'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {s.hardGates.chinaFreeRisk}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {s.highPower.heavyCopper && (
                          <span className="text-2xs font-semibold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded" title="Heavy Copper >= 4oz">
                            Cu
                          </span>
                        )}
                        {s.highPower.sicGanAssembly && (
                          <span className="text-2xs font-semibold bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded" title="SiC / GaN Packaging">
                            SiC
                          </span>
                        )}
                        {s.highPower.ipcA610Class3 && (
                          <span className="text-2xs font-semibold bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded" title="IPC Class 3">
                            Cl.3
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {s.certifications.slice(0, 3).map((c, i) => (
                          <span key={i} className="text-2xs bg-slate-50 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                            {c}
                          </span>
                        ))}
                        {s.certifications.length > 3 && (
                          <span className="text-2xs text-slate-400">+{s.certifications.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => onSelectSupplier(s)}
                        className="cursor-pointer text-xs font-semibold text-slate-900 hover:text-slate-600 inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Dossier</span>
                      </button>
                      <button
                        onClick={() => onGenerateRfq(s)}
                        className="cursor-pointer text-xs font-semibold text-slate-600 hover:text-slate-900"
                        title="Generate RFQ rider"
                      >
                        RFQ
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((s) => {
            const isSelected = compareIds.includes(s.id);
            return (
              <div
                key={s.id}
                className={`bg-white rounded-lg border p-5 shadow-xs flex flex-col justify-between space-y-4 transition-all ${
                  isSelected ? 'border-slate-900 ring-1 ring-slate-900' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-2xs font-semibold uppercase tracking-wider text-slate-500">
                        {s.tier} · {s.regionCategory}
                      </div>
                      <h3 className="text-base font-bold text-slate-900 mt-0.5">
                        {s.name}
                      </h3>
                      <div className="text-xs text-slate-500">{s.headquarters}</div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono text-xl font-bold text-slate-900">
                        {s.compositeScore.toFixed(1)}
                      </div>
                      <span className="text-2xs text-slate-400">Score / 5.0</span>
                    </div>
                  </div>

                  {/* Hard gates status */}
                  <div className="grid grid-cols-2 gap-2 text-2xs pt-1">
                    <div className="p-2 bg-slate-50 rounded border border-slate-100">
                      <div className="text-slate-500">ISO 9001:</div>
                      <div className={`font-bold ${s.hardGates.iso9001 === 'PASS' ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {s.hardGates.iso9001}
                      </div>
                    </div>

                    <div className="p-2 bg-slate-50 rounded border border-slate-100">
                      <div className="text-slate-500">China-Free Risk:</div>
                      <div className={`font-bold ${s.hardGates.chinaFreeRisk === 'LOW RISK' ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {s.hardGates.chinaFreeRisk}
                      </div>
                    </div>
                  </div>

                  {/* High power capabilities strip */}
                  <div className="space-y-1.5 pt-1 text-2xs">
                    <div className="font-semibold text-slate-800">High-Power Verification:</div>
                    <div className="flex flex-wrap gap-1.5 text-slate-600">
                      <span className={`px-2 py-0.5 rounded ${s.highPower.heavyCopper ? 'bg-slate-100 text-slate-900' : 'bg-slate-50 text-slate-400 line-through'}`}>
                        Heavy Cu (&gt;=4oz)
                      </span>
                      <span className={`px-2 py-0.5 rounded ${s.highPower.sicGanAssembly ? 'bg-blue-50 text-blue-900' : 'bg-slate-50 text-slate-400 line-through'}`}>
                        SiC/GaN
                      </span>
                      <span className={`px-2 py-0.5 rounded ${s.highPower.ipcA610Class3 ? 'bg-purple-50 text-purple-900' : 'bg-slate-50 text-slate-400 line-through'}`}>
                        IPC Class 3
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <label className="inline-flex items-center gap-1.5 text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleCompare(s.id)}
                      className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                    />
                    <span>Compare</span>
                  </label>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSelectSupplier(s)}
                      className="cursor-pointer font-semibold text-slate-900 hover:text-slate-600"
                    >
                      View Dossier →
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
