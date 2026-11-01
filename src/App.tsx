import React, { useState, useEffect } from 'react';
import { EMSDossier } from './types/ems';
import { INITIAL_EMS_DATABASE } from './data/emsDatabase';
import { Header } from './components/Header';
import { DossierView } from './components/DossierView';
import { SourcingMatrix } from './components/SourcingMatrix';
import { TechnicalAudit } from './components/TechnicalAudit';
import { RfqGenerator } from './components/RfqGenerator';
import { Level2EvaluationView } from './components/Level2EvaluationView';
import { ComparisonModal } from './components/ComparisonModal';
import { ShieldAlert, Zap, AlertCircle } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dossier' | 'level2' | 'matrix' | 'audit' | 'rfq'>('dossier');
  const [suppliers, setSuppliers] = useState<EMSDossier[]>(INITIAL_EMS_DATABASE);
  const [currentDossier, setCurrentDossier] = useState<EMSDossier>(INITIAL_EMS_DATABASE[0]); // Sanmina default
  const [compareList, setCompareList] = useState<EMSDossier[]>([]);
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [rfqTarget, setRfqTarget] = useState<EMSDossier | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync with backend API on mount
  useEffect(() => {
    fetch('/api/suppliers')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.suppliers && Array.isArray(data.suppliers)) {
          setSuppliers(data.suppliers);
        }
      })
      .catch((err) => {
        console.warn('Backend suppliers fetch returned:', err);
      });
  }, []);

  // Mode A: Evaluate any manufacturer via backend Gemini intelligence or rule engine
  const handleEvaluateNew = async (manufacturerName: string, projectContext?: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manufacturerName, projectContext }),
      });

      if (!res.ok) {
        throw new Error(`Evaluation failed with status ${res.status}`);
      }

      const data = await res.json();
      if (data && data.dossier) {
        const newDossier: EMSDossier = data.dossier;

        // Check if supplier exists, else append
        setSuppliers((prev) => {
          const idx = prev.findIndex((s) => s.id === newDossier.id || s.name.toLowerCase() === newDossier.name.toLowerCase());
          if (idx >= 0) {
            const updated = [...prev];
            updated[idx] = newDossier;
            return updated;
          }
          return [newDossier, ...prev];
        });

        setCurrentDossier(newDossier);
        setActiveTab('dossier');
      }
    } catch (err: any) {
      console.error('Error running supplier evaluation:', err);
      setErrorMessage(err.message || 'Unable to complete live audit. Using cached verified registry data.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSupplier = (s: EMSDossier) => {
    setCurrentDossier(s);
    setActiveTab('dossier');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddToCompare = (s: EMSDossier) => {
    if (!compareList.some((item) => item.id === s.id)) {
      if (compareList.length >= 4) {
        alert('You can compare a maximum of 4 suppliers simultaneously.');
        return;
      }
      setCompareList([...compareList, s]);
    }
    setCompareModalOpen(true);
  };

  const handleOpenCompareFromMatrix = (selected: EMSDossier[]) => {
    setCompareList(selected);
    setCompareModalOpen(true);
  };

  const handleGenerateRfqForSupplier = (s: EMSDossier) => {
    setRfqTarget(s);
    setActiveTab('rfq');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased">
      {/* Top Bar Header strictly adhering to Top Bar Contract */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isLoading={isLoading}
        onNewEvaluation={() => {
          setActiveTab('dossier');
          // Trigger evaluation modal or scroll to search
          const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
          if (searchInput) {
            searchInput.focus();
          }
        }}
      />

      {/* Global Intelligence Context Strip */}
      <div className="bg-slate-900 text-slate-300 border-b border-slate-800 py-2.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs gap-2">
          <div className="flex items-center gap-3">
            <span className="font-mono font-bold text-white tracking-wider">
              HARD GATES ENFORCED:
            </span>
            <span className="text-slate-300">
              1. ISO 9001 Mandatory Gate (FAIL caps Quality at 1.0)
            </span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="text-slate-300">
              2. China-Free Firmware / NDAA 889
            </span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="text-slate-300">
              3. High-Power Focus (Heavy Cu, SiC/GaN, Potting, IPC Class 3)
            </span>
          </div>

          <div className="flex items-center gap-2 font-mono text-2xs text-slate-400">
            <span>VERIFIED CMs: {suppliers.length}</span>
            <span>·</span>
            <span>SCALE: 1.0 TO 5.0</span>
          </div>
        </div>
      </div>

      {/* Error alert if any */}
      {errorMessage && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-md text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-amber-900 hover:text-black font-semibold text-xs ml-4"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main View Area */}
      <main className="flex-1 pb-16">
        {activeTab === 'dossier' && (
          <DossierView
            dossier={currentDossier}
            allDossiers={suppliers}
            onSelectSupplier={handleSelectSupplier}
            onEvaluateNew={handleEvaluateNew}
            isLoading={isLoading}
            onAddToCompare={handleAddToCompare}
            onGenerateRfqForSupplier={handleGenerateRfqForSupplier}
            onNavigateToLevel2={(supplier) => {
              setCurrentDossier(supplier);
              setActiveTab('level2');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {activeTab === 'level2' && (
          <Level2EvaluationView
            currentDossier={currentDossier}
            allDossiers={suppliers}
            onSelectSupplier={handleSelectSupplier}
            onGenerateRfq={handleGenerateRfqForSupplier}
          />
        )}

        {activeTab === 'matrix' && (
          <SourcingMatrix
            suppliers={suppliers}
            onSelectSupplier={handleSelectSupplier}
            onOpenCompare={handleOpenCompareFromMatrix}
            onGenerateRfq={handleGenerateRfqForSupplier}
            onAuditUnlisted={(name) => {
              setActiveTab('dossier');
              handleEvaluateNew(name);
            }}
          />
        )}

        {activeTab === 'audit' && (
          <TechnicalAudit
            suppliers={suppliers}
            onSelectSupplierToInspect={handleSelectSupplier}
          />
        )}

        {activeTab === 'rfq' && (
          <RfqGenerator
            initialSupplier={rfqTarget}
            allSuppliers={suppliers}
          />
        )}
      </main>

      {/* Side-by-Side Comparison Modal */}
      {compareModalOpen && (
        <ComparisonModal
          suppliers={compareList}
          onClose={() => setCompareModalOpen(false)}
          onSelectSupplier={handleSelectSupplier}
        />
      )}

      {/* Clean quiet footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">EMS Evaluator &amp; Sourcing Engine</span>
            <span>·</span>
            <span>High-Reliability Electronics Procurement System</span>
          </div>

          <div className="flex items-center gap-6 text-slate-500">
            <span>SEC 10-K &amp; Trade Proxies Grounded</span>
            <span>·</span>
            <span>NDAA Section 889 Compliant</span>
            <span>·</span>
            <span>IPC-A-610 Class 3</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
