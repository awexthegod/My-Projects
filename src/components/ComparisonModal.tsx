import React from 'react';
import { EMSDossier } from '../types/ems';
import { CheckCircle2, XCircle, AlertTriangle, X } from 'lucide-react';

interface ComparisonModalProps {
  suppliers: EMSDossier[];
  onClose: () => void;
  onSelectSupplier: (s: EMSDossier) => void;
}

export const ComparisonModal: React.FC<ComparisonModalProps> = ({
  suppliers,
  onClose,
  onSelectSupplier,
}) => {
  if (suppliers.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col border border-slate-200">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Side-by-Side EMS Comparative Matrix
            </h2>
            <p className="text-xs text-slate-500">
              Benchmarking {suppliers.length} contract manufacturers across the 7 evaluation pillars and mandatory hard gates
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comparison Content Table */}
        <div className="p-6 overflow-x-auto flex-1 space-y-6">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/60">
                <th className="py-3 px-4 w-44 font-semibold text-slate-600">Metric / Pillar</th>
                {suppliers.map((s) => (
                  <th key={s.id} className="py-3 px-4 min-w-[220px]">
                    <div className="font-bold text-slate-900 text-sm">{s.name}</div>
                    <div className="text-2xs text-slate-500">{s.tier} · {s.headquarters}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {/* Composite Score */}
              <tr className="bg-slate-50/40">
                <td className="py-3 px-4 font-bold text-slate-900">Composite Score</td>
                {suppliers.map((s) => (
                  <td key={s.id} className="py-3 px-4">
                    <span className="font-mono text-base font-extrabold text-slate-900">
                      {s.compositeScore.toFixed(1)}
                    </span>
                    <span className="text-xs text-slate-500"> / 5.0</span>
                  </td>
                ))}
              </tr>

              {/* Hard Gate: ISO 9001 */}
              <tr>
                <td className="py-3 px-4 font-bold text-slate-900">
                  ISO 9001 Hard Gate
                </td>
                {suppliers.map((s) => (
                  <td key={s.id} className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded text-2xs ${
                        s.hardGates.iso9001 === 'PASS'
                          ? 'bg-emerald-100 text-emerald-800'
                          : s.hardGates.iso9001 === 'FAIL'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {s.hardGates.iso9001 === 'PASS' ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <XCircle className="w-3 h-3 text-rose-600" />}
                      {s.hardGates.iso9001}
                    </span>
                    <div className="text-2xs text-slate-500 mt-0.5">{s.hardGates.iso9001Registrar}</div>
                  </td>
                ))}
              </tr>

              {/* Hard Gate: China-Free / NDAA 889 */}
              <tr>
                <td className="py-3 px-4 font-bold text-slate-900">
                  China-Free / NDAA 889
                </td>
                {suppliers.map((s) => (
                  <td key={s.id} className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded text-2xs ${
                        s.hardGates.chinaFreeRisk === 'LOW RISK'
                          ? 'bg-emerald-100 text-emerald-800'
                          : s.hardGates.chinaFreeRisk === 'HIGH RISK'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {s.hardGates.chinaFreeRisk}
                    </span>
                    <div className="text-2xs text-slate-600 mt-1 line-clamp-2">
                      {s.hardGates.chinaFreeRationale}
                    </div>
                  </td>
                ))}
              </tr>

              {/* 7 Pillars Comparison */}
              {[
                { label: '1. Financial Performance', key: 'financial' },
                { label: '2. High-Power Experience', key: 'highPower' },
                { label: '3. Traceability & Origin', key: 'traceability' },
                { label: '4. Quality Management', key: 'quality' },
                { label: '5. Cost Per Product (Proxy)', key: 'costProxy' },
                { label: '6. Logistical Services', key: 'logistics' },
                { label: '7. Cybersecurity & Software', key: 'cybersecurity' },
              ].map((pillar) => (
                <tr key={pillar.key}>
                  <td className="py-2.5 px-4 font-semibold text-slate-700">
                    {pillar.label}
                  </td>
                  {suppliers.map((s) => {
                    const p = s.pillars.find((item) => item.categoryKey === pillar.key);
                    return (
                      <td key={s.id} className="py-2.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900">
                            {p ? p.score.toFixed(1) : '-'}
                          </span>
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-slate-900 rounded-full"
                              style={{ width: `${((p?.score || 0) / 5) * 100}%` }}
                            />
                          </div>
                        </div>
                        <div className="text-2xs text-slate-500 mt-0.5 line-clamp-2" title={p?.evidence}>
                          {p?.evidence}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}

              {/* High Power Technical Gates */}
              <tr>
                <td className="py-3 px-4 font-bold text-slate-900">Heavy Copper (&gt;=4oz)</td>
                {suppliers.map((s) => (
                  <td key={s.id} className="py-3 px-4">
                    {s.highPower.heavyCopper ? (
                      <span className="text-emerald-700 font-semibold">Yes — {s.highPower.heavyCopperDetail}</span>
                    ) : (
                      <span className="text-rose-600 font-semibold">No / Limited</span>
                    )}
                  </td>
                ))}
              </tr>

              <tr>
                <td className="py-3 px-4 font-bold text-slate-900">SiC / GaN Assembly</td>
                {suppliers.map((s) => (
                  <td key={s.id} className="py-3 px-4">
                    {s.highPower.sicGanAssembly ? (
                      <span className="text-emerald-700 font-semibold">Verified — {s.highPower.sicGanDetail}</span>
                    ) : (
                      <span className="text-slate-500">Not verified</span>
                    )}
                  </td>
                ))}
              </tr>

              <tr>
                <td className="py-3 px-4 font-bold text-slate-900">High-Voltage Potting</td>
                {suppliers.map((s) => (
                  <td key={s.id} className="py-3 px-4">
                    {s.highPower.highVoltagePotting ? (
                      <span className="text-emerald-700 font-semibold">Yes — {s.highPower.highVoltagePottingDetail}</span>
                    ) : (
                      <span className="text-slate-500">Standard / Manual</span>
                    )}
                  </td>
                ))}
              </tr>

              <tr>
                <td className="py-3 px-4 font-bold text-slate-900">ITAR &amp; TAA</td>
                {suppliers.map((s) => (
                  <td key={s.id} className="py-3 px-4 text-slate-700">
                    <div>ITAR: {s.itarRegistered ? 'Registered' : 'No'}</div>
                    <div>TAA: {s.taaCompliant ? 'Compliant' : 'Non-Compliant'}</div>
                  </td>
                ))}
              </tr>

              {/* Actions */}
              <tr>
                <td className="py-3 px-4 font-bold text-slate-900">Audit Action</td>
                {suppliers.map((s) => (
                  <td key={s.id} className="py-3 px-4">
                    <button
                      onClick={() => {
                        onClose();
                        onSelectSupplier(s);
                      }}
                      className="cursor-pointer px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors"
                    >
                      Open Full Dossier
                    </button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="cursor-pointer px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded"
          >
            Close Matrix
          </button>
        </div>
      </div>
    </div>
  );
};
