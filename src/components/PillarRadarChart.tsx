import React, { useState } from 'react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
  Legend,
} from 'recharts';
import { EMSDossier, EvaluationPillar } from '../types/ems';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

interface PillarRadarChartProps {
  dossier: EMSDossier;
}

const SHORT_NAMES: Record<string, string> = {
  'Financial Performance': 'Financial',
  'High-Power EMS Experience': 'High-Power',
  'Traceability & Certificate of Origin': 'Traceability',
  'Quality Management': 'Quality Mgmt',
  'Cost Per Product (Proxy)': 'Cost Proxy',
  'Logistical Services': 'Logistics',
  'Cybersecurity & Software Risk': 'Cyber & Firmware',
};

export const PillarRadarChart: React.FC<PillarRadarChartProps> = ({ dossier }) => {
  const [activePillarKey, setActivePillarKey] = useState<string | null>(null);

  const composite = dossier.compositeScore;

  // Prepare data for radar chart with gap calculation
  const chartData = dossier.pillars.map((p) => {
    const gap = parseFloat((p.score - composite).toFixed(1));
    const isHardGateCapped = p.categoryKey === 'quality' && dossier.hardGates.iso9001 === 'FAIL';

    return {
      pillarKey: p.categoryKey,
      pillarNumber: p.pillarNumber,
      pillarName: p.name,
      shortName: SHORT_NAMES[p.name] || p.name,
      score: p.score,
      compositeBenchmark: composite,
      gap: gap,
      isHardGateCapped: isHardGateCapped,
      evidence: p.evidence,
    };
  });

  // Calculate lagging pillars (negative gap relative to composite)
  const laggingPillars = chartData.filter((d) => d.gap < 0);
  const leadingPillars = chartData.filter((d) => d.gap >= 0);

  // Custom Tooltip for Recharts
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isNegative = data.gap < 0;

      return (
        <div className="bg-slate-900 text-white p-3 rounded-md shadow-lg border border-slate-700 text-xs max-w-xs space-y-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 gap-2">
            <span className="font-bold text-slate-100">
              {data.pillarNumber}. {data.pillarName}
            </span>
            <span
              className={`font-mono text-2xs px-1.5 py-0.5 rounded font-semibold ${
                isNegative ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
              }`}
            >
              {data.gap > 0 ? `+${data.gap}` : data.gap} vs Composite
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-2xs pt-0.5">
            <div>
              <div className="text-slate-400">Pillar Score</div>
              <div className="font-mono text-sm font-bold text-slate-100">
                {data.score.toFixed(1)} <span className="text-2xs text-slate-400">/ 5.0</span>
              </div>
            </div>
            <div>
              <div className="text-slate-400">Composite Avg</div>
              <div className="font-mono text-sm font-bold text-slate-300">
                {data.compositeBenchmark.toFixed(1)} <span className="text-2xs text-slate-400">/ 5.0</span>
              </div>
            </div>
          </div>

          {data.isHardGateCapped && (
            <div className="text-2xs text-rose-300 font-semibold bg-rose-900/50 p-1.5 rounded border border-rose-700/60">
              Capped at 1.0 due to ISO 9001 Gate Failure.
            </div>
          )}

          <div className="text-2xs text-slate-300 pt-1 border-t border-slate-800 leading-relaxed">
            {data.evidence}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2 text-2xs text-slate-500 uppercase tracking-wider font-semibold font-mono">
            <span>7-Pillar Performance Geometry</span>
            <span>·</span>
            <span>Relative Gap Analysis</span>
          </div>
          <h3 className="text-base font-bold text-slate-900">
            Evaluation Pillar Radar &amp; Composite Gap Matrix
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Visualizes supplier capabilities against their {composite.toFixed(1)} composite baseline to uncover latent procurement gaps and operational strengths.
          </p>
        </div>

        {/* Legend pills */}
        <div className="flex items-center gap-4 text-xs shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-slate-900" />
            <span className="font-medium text-slate-700">Pillar Score</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full border-2 border-dashed border-amber-600 bg-amber-50" />
            <span className="font-medium text-slate-700">Composite Baseline ({composite.toFixed(1)})</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Radar Chart Visual */}
        <div className="lg:col-span-7 h-[360px] w-full relative flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
              <PolarGrid stroke="#e2e8f0" strokeDasharray="3 3" />
              <PolarAngleAxis
                dataKey="shortName"
                tick={{ fill: '#334155', fontSize: 11, fontWeight: 600 }}
              />
              <PolarRadiusAxis
                angle={30}
                domain={[0, 5]}
                tickCount={6}
                stroke="#94a3b8"
                tick={{ fill: '#64748b', fontSize: 10 }}
              />

              {/* Baseline Composite Score Ring */}
              <Radar
                name={`Composite Average (${composite.toFixed(1)})`}
                dataKey="compositeBenchmark"
                stroke="#d97706"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                fill="#f59e0b"
                fillOpacity={0.08}
              />

              {/* Actual Pillar Score */}
              <Radar
                name="Pillar Score"
                dataKey="score"
                stroke="#0f172a"
                strokeWidth={2}
                fill="#0f172a"
                fillOpacity={0.25}
              />

              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Gap Breakdown Panel */}
        <div className="lg:col-span-5 space-y-4 text-xs">
          {/* Negative Gaps / Vulnerabilities */}
          <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold uppercase tracking-wider text-2xs text-rose-800 flex items-center gap-1.5">
                <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
                <span>Pillars Below Composite ({laggingPillars.length})</span>
              </span>
              <span className="text-2xs text-slate-500">Procurement Gaps</span>
            </div>

            {laggingPillars.length === 0 ? (
              <p className="text-slate-500 text-2xs italic">
                All pillars match or exceed the composite score baseline.
              </p>
            ) : (
              <div className="space-y-2">
                {laggingPillars.map((p) => (
                  <div
                    key={p.pillarKey}
                    onMouseEnter={() => setActivePillarKey(p.pillarKey)}
                    onMouseLeave={() => setActivePillarKey(null)}
                    className="flex items-center justify-between p-2 rounded bg-white border border-slate-200 transition-colors"
                  >
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span>{p.pillarName}</span>
                        {p.isHardGateCapped && (
                          <span className="text-3xs bg-rose-100 text-rose-800 px-1 py-0.5 rounded font-mono">
                            GATE CAPPED
                          </span>
                        )}
                      </div>
                      <div className="text-2xs text-slate-500">
                        Score: <span className="font-mono font-bold text-slate-700">{p.score.toFixed(1)}</span> · Baseline: <span className="font-mono text-slate-500">{composite.toFixed(1)}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-mono font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded text-xs">
                        {p.gap.toFixed(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Leading Pillars / Strengths */}
          <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold uppercase tracking-wider text-2xs text-emerald-800 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                <span>Pillars Exceeding Baseline ({leadingPillars.length})</span>
              </span>
              <span className="text-2xs text-slate-500">Core Advantages</span>
            </div>

            <div className="space-y-2">
              {leadingPillars.map((p) => (
                <div
                  key={p.pillarKey}
                  onMouseEnter={() => setActivePillarKey(p.pillarKey)}
                  onMouseLeave={() => setActivePillarKey(null)}
                  className="flex items-center justify-between p-2 rounded bg-white border border-slate-200 transition-colors"
                >
                  <div>
                    <div className="font-bold text-slate-900">{p.pillarName}</div>
                    <div className="text-2xs text-slate-500">
                      Score: <span className="font-mono font-bold text-slate-700">{p.score.toFixed(1)}</span> · Baseline: <span className="font-mono text-slate-500">{composite.toFixed(1)}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-xs">
                      {p.gap >= 0 ? `+${p.gap.toFixed(1)}` : p.gap.toFixed(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick guidance footnote */}
          <div className="flex items-start gap-2 p-3 bg-slate-100 rounded text-2xs text-slate-600">
            <Info className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
            <span>
              Hover over any vertex on the radar chart or gap row to inspect specific SEC 10-K, ITAR, or quality audit evidence.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
