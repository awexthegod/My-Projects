import React, { useState, useEffect } from 'react';
import { Search, ShieldCheck, Zap, Sparkles, CheckCircle2, Clock } from 'lucide-react';

interface AuditLoadingBarProps {
  companyName: string;
}

const AUDIT_STAGES = [
  {
    step: 1,
    title: 'SEC 10-K & Corporate Registry Scan',
    description: 'Retrieving balance sheet liquidity, revenue stability, and ownership hierarchy.',
  },
  {
    step: 2,
    title: 'ISO 9001 Registrar Validation (Hard Gate #1)',
    description: 'Cross-referencing IAF CertSearch and accredited registrar databases.',
  },
  {
    step: 3,
    title: 'NDAA 889 & China-Free Firmware Screen (Hard Gate #2)',
    description: 'Vetting microcontrollers, programming environments, and Trade Agreements Act origin.',
  },
  {
    step: 4,
    title: 'High-Power Technical Credentials Audit',
    description: 'Analyzing heavy copper (>=4oz), selective soldering, SiC/GaN reflow, and HV potting.',
  },
  {
    step: 5,
    title: 'Scorecard Synthesis & RFI Questionnaire',
    description: 'Normalizing 7-Pillar scoring matrix (1.0 to 5.0) and generating strategic RFI questions.',
  },
];

export const AuditLoadingBar: React.FC<AuditLoadingBarProps> = ({ companyName }) => {
  const [progress, setProgress] = useState(12);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);

  useEffect(() => {
    // Smooth staged progress timer
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev < 30) return prev + 6;
        if (prev < 60) return prev + 4;
        if (prev < 85) return prev + 2;
        if (prev < 96) return prev + 0.8;
        return 96;
      });
    }, 280);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress < 25) setCurrentStageIndex(0);
    else if (progress < 48) setCurrentStageIndex(1);
    else if (progress < 70) setCurrentStageIndex(2);
    else if (progress < 88) setCurrentStageIndex(3);
    else setCurrentStageIndex(4);
  }, [progress]);

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-6 sm:p-8 shadow-xs space-y-6">
      {/* Target company header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-3xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-900 text-white">
              LIVE PROCUREMENT AUDIT
            </span>
            <span className="text-2xs text-slate-500 font-mono">
              Unlisted Supplier Ingestion
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <span>Evaluating</span>
            <span className="text-slate-900 underline decoration-slate-300 underline-offset-4">
              "{companyName || 'Target Manufacturer'}"
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            Scanning public registries, technical proxies, and trade records across the 7 evaluation pillars.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-md border border-slate-200 text-xs font-mono text-slate-600 shrink-0">
          <Clock className="w-4 h-4 text-slate-400" />
          <span>Progress: <strong className="text-slate-900 font-bold">{Math.round(progress)}%</strong></span>
        </div>
      </div>

      {/* Main Animated Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-2xs text-slate-600 font-medium">
          <span className="flex items-center gap-1.5 font-bold text-slate-800">
            <Sparkles className="w-3.5 h-3.5 text-slate-700 animate-spin" style={{ animationDuration: '3s' }} />
            <span>{AUDIT_STAGES[currentStageIndex].title}</span>
          </span>
          <span className="font-mono text-slate-500">{Math.round(progress)}% Complete</span>
        </div>

        {/* Primary Track and Indicator */}
        <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/60 p-0.5">
          <div
            className="h-full bg-slate-900 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-2xs text-slate-500 italic">
          {AUDIT_STAGES[currentStageIndex].description}
        </p>
      </div>

      {/* Staged Checklist Grid */}
      <div className="pt-2 border-t border-slate-100 space-y-2.5">
        <div className="text-2xs font-bold uppercase tracking-wider text-slate-400">
          Verification Pipeline Stages:
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          {AUDIT_STAGES.map((stage, idx) => {
            const isCompleted = currentStageIndex > idx;
            const isCurrent = currentStageIndex === idx;

            return (
              <div
                key={stage.step}
                className={`p-3 rounded-md border transition-all ${
                  isCompleted
                    ? 'border-emerald-200 bg-emerald-50/40 text-emerald-950'
                    : isCurrent
                    ? 'border-slate-400 bg-slate-50 text-slate-900 ring-1 ring-slate-900/10'
                    : 'border-slate-100 bg-slate-50/30 text-slate-400 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-3xs font-bold text-slate-500">
                    0{stage.step}
                  </span>
                  {isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ) : isCurrent ? (
                    <div className="w-2 h-2 rounded-full bg-slate-900 animate-pulse" />
                  ) : null}
                </div>
                <div className="font-bold text-2xs leading-tight mb-1">
                  {stage.title.split('(')[0]}
                </div>
                <div className="text-3xs text-slate-500 line-clamp-2">
                  {stage.description}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
