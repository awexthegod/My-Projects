import React, { useState } from 'react';
import { EMSDossier } from '../types/ems';
import {
  FileText,
  Copy,
  Printer,
  Download,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Building2,
} from 'lucide-react';

interface RfqGeneratorProps {
  initialSupplier?: EMSDossier | null;
  allSuppliers: EMSDossier[];
}

export const RfqGenerator: React.FC<RfqGeneratorProps> = ({
  initialSupplier,
  allSuppliers,
}) => {
  const [targetSupplierName, setTargetSupplierName] = useState(
    initialSupplier ? initialSupplier.name : 'All Bidding Contract Manufacturers'
  );
  const [projectName, setProjectName] = useState('High-Power 800V Inverter & Converter Assembly');
  const [operatingVoltage, setOperatingVoltage] = useState('800V DC Bus (1200V Peak)');
  const [continuousCurrent, setContinuousCurrent] = useState('180A Continuous (250A Peak)');
  const [copperWeightOz, setCopperWeightOz] = useState<number>(6);
  const [semiconductorType, setSemiconductorType] = useState('SiC MOSFETs (TOLL / Direct Die)');
  const [thermalCyclingRange, setThermalCyclingRange] = useState('-40°C to +125°C (500 Cycles)');
  const [pottingCompound, setPottingCompound] = useState('High-Dielectric Thermally Conductive Polyurethane');
  const [dielectricWithstandKv, setDielectricWithstandKv] = useState<number>(5.0);
  const [ipcClass, setIpcClass] = useState<'IPC-A-610 Class 3' | 'IPC-A-610 Class 2'>('IPC-A-610 Class 3');

  const [requireIso9001, setRequireIso9001] = useState(true);
  const [requireNdaa889, setRequireNdaa889] = useState(true);
  const [requireTaa, setRequireTaa] = useState(true);
  const [requireItar, setRequireItar] = useState(true);
  const [requireAirGappedFlashing, setRequireAirGappedFlashing] = useState(true);

  const [copied, setCopied] = useState(false);

  const generatedRfqText = `================================================================================
FORMAL PROCUREMENT & TECHNICAL SPECIFICATION RIDER
HIGH-RELIABILITY HIGH-POWER ELECTRONICS ASSEMBLY
TARGET SUPPLIER: ${targetSupplierName.toUpperCase()}
PROJECT: ${projectName.toUpperCase()}
ISSUED DATE: ${new Date().toISOString().split('T')[0]}
================================================================================

1. NON-NEGOTIABLE REGULATORY & MANDATORY HARD GATES
--------------------------------------------------------------------------------
1.1 MANDATORY ISO 9001:2015 CERTIFICATION (HARD GATE):
The Contract Manufacturer (CM) must hold an active, accredited ISO 9001:2015 
certification issued by an IAF-recognized registrar (e.g., BSI, TÜV SÜD, DEKRA, NQA). 
Failure to provide an active registrar certificate will result in immediate bid rejection.

1.2 CHINA-FREE FIRMWARE, SILICON, AND NDAA SECTION 889 COMPLIANCE:
- The CM certifies 100% compliance with NDAA Section 889(a)(1)(B).
- Zero tolerance for microcontrollers, SoCs, communication modules, or firmware 
  controlled by entities subject to Chinese jurisdiction.
- All firmware flashing, cryptographic key provisioning, and automated testing 
  must occur in an access-controlled, air-gapped facility located strictly within 
  the United States or designated Trade Agreements Act (TAA) allied nations.
- The CM must maintain an audit trail verifying that no Chinese-owned cloud services 
  or test rigs interface with product hardware or customer firmware binaries.

${requireTaa ? '1.3 TRADE AGREEMENTS ACT (TAA) COUNTRY OF ORIGIN:\nAll manufacturing, surface-mount assembly, through-hole soldering, and testing must be performed within TAA-compliant countries (United States, USMCA Mexico, or designated WTO GPA allied nations). PRC origin is strictly prohibited.\n' : ''}
${requireItar ? '1.4 ITAR & DEFENSE COMPLIANCE:\nThe designated manufacturing facility must maintain active DDTC ITAR Part 122 registration with strict access controls restricted to verified U.S. Persons.\n' : ''}

2. HIGH-POWER TECHNICAL GATES & PROCESS REQUIREMENTS
--------------------------------------------------------------------------------
2.1 HEAVY-COPPER FABRICATION & SELECTIVE SOLDERING:
- Substrates: Multi-layer heavy-copper PCB with minimum ${copperWeightOz}oz finished copper weight.
- Soldering: Selective wave soldering under an inert nitrogen (N2) blanket with oxygen 
  content <50 ppm. Direct hand-soldering of primary power paths is prohibited.
- Thermal Profile: Solder pot temperature, pre-heat ramp rate (<2.0°C/sec), and contact 
  dwell time must be mathematically modeled to guarantee 100% barrel fill without delaminating 
  inner copper planes.

2.2 WIDE-BANDGAP POWER SEMICONDUCTOR PACKAGING (${semiconductorType}):
- Reflow: Vacuum vapor-phase or vacuum convection reflow is mandatory.
- Solder Voiding Specification: Maximum total solder voiding under thermal pads 
  and bottom-terminated components (BTC) shall not exceed 5.0% total area, with 
  zero individual voids exceeding 2.0% of the contact area.
- Verification: 100% 3D Automated X-ray Inspection (AXI) on all power packages.

2.3 DIELECTRIC ENCAPSULATION & HIGH-POTENTIAL TESTING:
- Potting Material: ${pottingCompound}.
- Dispensing: Automated dual-head meter-mix dispensing with inline vacuum degasification 
  chamber (<10 mbar) to eliminate micro-voids and prevent partial discharge degradation.
- Dielectric Withstand (Hipot) Testing: 100% production verification at ${dielectricWithstandKv.toFixed(1)} kV DC 
  for a minimum dwell time of 60 seconds with measured leakage current <10 µA.

2.4 ENVIRONMENTAL STRESS SCREENING (ESS):
- Production lot thermal cycling: ${thermalCyclingRange}.
- Temperature ramp rate >= 10°C/minute with real-time electrical telemetry.

2.5 INSPECTION BASELINE:
- 100% compliance with ${ipcClass} (High Performance / Severe Environment Electronics) 
  and J-STD-001 soldering criteria.

3. TRACEABILITY & COUNTERFEIT AVOIDANCE (AS5553)
--------------------------------------------------------------------------------
- Component Provenance: 100% of semiconductors, passives, and relays must be sourced 
  directly from original component manufacturers (OCM) or authorized franchised distributors.
- Traceability: 2D DataMatrix laser-marked serial number on each PCBA linked to SMT feeder 
  lot logs, paste batch, and test telemetry records.

CONTRACT MANUFACTURER ACKNOWLEDGEMENT & ATTESTATION:
I, the undersigned authorized officer of the Contract Manufacturer, certify that our facility 
fully complies with all mandatory hard gates, technical specifications, and regulatory riders 
set forth in this document.

Officer Signature: __________________________________   Date: ________________________
Printed Name:      __________________________________   Title: _______________________
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedRfqText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([generatedRfqText], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `EMS_HighPower_RFQ_Rider_${projectName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span className="font-mono uppercase font-semibold text-slate-600">
              MODE C RFQ GENERATOR
            </span>
            <span aria-hidden="true">·</span>
            <span>Procurement &amp; Technical Rider Engine</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            High-Power RFQ &amp; Contract Rider Generator
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Generate enforceable procurement riders mandating heavy copper, SiC/GaN vacuum reflow, NDAA 889, and ISO 9001 gates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 shadow-xs"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{copied ? 'Copied Rider!' : 'Copy Document'}</span>
          </button>
          <button
            onClick={handleDownload}
            className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .txt</span>
          </button>
          <button
            onClick={() => window.print()}
            className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-slate-900 rounded-md hover:bg-slate-800 shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Rider</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Form: Parameter Controls */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              Project &amp; Electrical Parameters
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Target Bidding Supplier
                </label>
                <select
                  value={targetSupplierName}
                  onChange={(e) => setTargetSupplierName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 font-medium text-slate-800"
                >
                  <option value="All Bidding Contract Manufacturers">
                    General / All Bidders
                  </option>
                  {allSuppliers.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name} ({s.tier})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Project Title
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Operating Voltage
                  </label>
                  <input
                    type="text"
                    value={operatingVoltage}
                    onChange={(e) => setOperatingVoltage(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Continuous Current
                  </label>
                  <input
                    type="text"
                    value={continuousCurrent}
                    onChange={(e) => setContinuousCurrent(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Finished Copper Weight
                  </label>
                  <select
                    value={copperWeightOz}
                    onChange={(e) => setCopperWeightOz(parseInt(e.target.value, 10))}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 font-medium"
                  >
                    <option value={2}>2 oz (Commercial)</option>
                    <option value={4}>4 oz (Standard High Power)</option>
                    <option value={6}>6 oz (Heavy Copper)</option>
                    <option value={8}>8 oz (Ultra Heavy Copper)</option>
                    <option value={10}>10 oz (Heavy Busbar)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Semiconductor Technology
                  </label>
                  <input
                    type="text"
                    value={semiconductorType}
                    onChange={(e) => setSemiconductorType(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Hipot Dielectric Test
                  </label>
                  <select
                    value={dielectricWithstandKv}
                    onChange={(e) => setDielectricWithstandKv(parseFloat(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 font-medium"
                  >
                    <option value={3.0}>3.0 kV DC</option>
                    <option value={5.0}>5.0 kV DC (High Power Standard)</option>
                    <option value={8.0}>8.0 kV DC (Severe HV)</option>
                    <option value={10.0}>10.0 kV DC (Grid / EV)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    IPC Inspection Class
                  </label>
                  <select
                    value={ipcClass}
                    onChange={(e) => setIpcClass(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 font-medium"
                  >
                    <option value="IPC-A-610 Class 3">IPC-A-610 Class 3 (High Rel)</option>
                    <option value="IPC-A-610 Class 2">IPC-A-610 Class 2 (Standard)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Potting &amp; Encapsulation Spec
                </label>
                <input
                  type="text"
                  value={pottingCompound}
                  onChange={(e) => setPottingCompound(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Thermal Cycling Range
                </label>
                <input
                  type="text"
                  value={thermalCyclingRange}
                  onChange={(e) => setThermalCyclingRange(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Hard Gate Regulatory Riders */}
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              Mandatory Regulatory Riders
            </h3>

            <div className="space-y-2 text-xs text-slate-700">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requireIso9001}
                  onChange={(e) => setRequireIso9001(e.target.checked)}
                  className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                />
                <span className="font-semibold text-slate-900">Mandatory ISO 9001 Hard Gate</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requireNdaa889}
                  onChange={(e) => setRequireNdaa889(e.target.checked)}
                  className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                />
                <span className="font-semibold text-slate-900">NDAA Section 889 China-Free Clause</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requireTaa}
                  onChange={(e) => setRequireTaa(e.target.checked)}
                  className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                />
                <span>Trade Agreements Act (TAA) US / Allied Origin</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requireItar}
                  onChange={(e) => setRequireItar(e.target.checked)}
                  className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                />
                <span>ITAR Registration &amp; US Person Segregation</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requireAirGappedFlashing}
                  onChange={(e) => setRequireAirGappedFlashing(e.target.checked)}
                  className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                />
                <span>Air-Gapped Programming Cell &amp; Hash Verification</span>
              </label>
            </div>
          </div>
        </div>

        {/* Right Output: Formal Legal Document Preview */}
        <div className="lg:col-span-7 bg-white p-6 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-700" />
                <h3 className="text-sm font-bold text-slate-900">
                  Procurement Contract Rider Document
                </h3>
              </div>
              <span className="text-2xs font-mono text-slate-400">
                Ready for RFQ Packet
              </span>
            </div>

            <pre className="p-4 bg-slate-900 text-slate-100 rounded-md text-2xs font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap max-h-[620px] select-all">
              {generatedRfqText}
            </pre>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Includes legal signature attestation block</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="cursor-pointer px-3 py-1.5 font-semibold text-slate-700 hover:text-slate-900"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button
                onClick={handleDownload}
                className="cursor-pointer px-3 py-1.5 font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded"
              >
                Download File
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
