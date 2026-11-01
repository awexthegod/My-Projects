import React from 'react';
import { Search } from 'lucide-react';

interface HeaderProps {
  activeTab: 'dossier' | 'level2' | 'matrix' | 'audit' | 'rfq';
  setActiveTab: (tab: 'dossier' | 'level2' | 'matrix' | 'audit' | 'rfq') => void;
  onNewEvaluation: () => void;
  isLoading?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onNewEvaluation,
  isLoading,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 relative">
      {isLoading && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-slate-100 overflow-hidden z-50">
          <div className="h-full bg-slate-900 w-full animate-progress-indeterminate origin-left" />
        </div>
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
            EMS
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap">
            EMS Sourcing Engine
          </span>
        </div>

        {/* Zone 2: 4-5 concise single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
          <button
            onClick={() => setActiveTab('dossier')}
            className={`cursor-pointer whitespace-nowrap transition-colors py-1 border-b-2 ${
              activeTab === 'dossier'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Due Diligence (L1)
          </button>
          <button
            onClick={() => setActiveTab('level2')}
            className={`cursor-pointer whitespace-nowrap transition-colors py-1 border-b-2 ${
              activeTab === 'level2'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            RFI/RFQ Eval (L2)
          </button>
          <button
            onClick={() => setActiveTab('matrix')}
            className={`cursor-pointer whitespace-nowrap transition-colors py-1 border-b-2 ${
              activeTab === 'matrix'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Sourcing Matrix
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`cursor-pointer whitespace-nowrap transition-colors py-1 border-b-2 ${
              activeTab === 'audit'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Technical Audit
          </button>
          <button
            onClick={() => setActiveTab('rfq')}
            className={`cursor-pointer whitespace-nowrap transition-colors py-1 border-b-2 ${
              activeTab === 'rfq'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            RFQ Generator
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onNewEvaluation}
            className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors whitespace-nowrap shadow-xs"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Evaluate Supplier</span>
          </button>
        </div>
      </div>
    </header>
  );
};
