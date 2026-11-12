import React, { useState } from 'react';
import { useLIMS } from '../../context/LIMSContext';
import { Sample, Invoice } from '../../types/lims';
import { RoleRestrictionNotice } from '../common/RoleRestrictionNotice';
import { 
  CheckCircle, 
  AlertTriangle, 
  Lock, 
  Thermometer, 
  PackageCheck, 
  Barcode, 
  Printer, 
  Layers,
  ArrowRight
} from 'lucide-react';

export const RegistrationView: React.FC = () => {
  const { 
    invoices, 
    samples, 
    parameters, 
    registerSample, 
    activeRole 
  } = useLIMS();

  const isSRO = activeRole === 'sro';

  const [showIntakeModal, setShowIntakeModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedSampleForLabel, setSelectedSampleForLabel] = useState<Sample | null>(null);

  // Intake Form State
  const [sampleName, setSampleName] = useState('');
  const [sampleType, setSampleType] = useState('Effluent Water Sample');
  const [sampleMatrix, setSampleMatrix] = useState('Industrial Wastewater');
  const [samplingDate, setSamplingDate] = useState('2026-11-11 08:30');
  
  // ISO 17025 Condition Log Checklist State
  const [temperature, setTemperature] = useState<number>(4.2);
  const [containerIntact, setContainerIntact] = useState(true);
  const [sealIntact, setSealIntact] = useState(true);
  const [labelMatched, setLabelMatched] = useState(true);
  const [chainOfCustodyMatched, setChainOfCustodyMatched] = useState(true);
  const [decision, setDecision] = useState<'accepted' | 'rejected'>('accepted');
  const [rejectionReason, setRejectionReason] = useState('');
  const [assignedParamIds, setAssignedParamIds] = useState<string[]>(['PARAM-PH', 'PARAM-BOD', 'PARAM-COD', 'PARAM-TSS']);
  const [formError, setFormError] = useState<string | null>(null);

  // Eligible invoices (PAID only!)
  const paidInvoices = invoices.filter(i => i.status === 'paid');
  const unpaidInvoices = invoices.filter(i => i.status === 'unpaid');

  const handleStartIntake = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setFormError(null);
    setSampleName(`${invoice.clientOrg} - Point Discharge 01`);
    setShowIntakeModal(true);
  };

  const handleToggleParam = (id: string) => {
    setAssignedParamIds(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleSubmitIntake = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    setFormError(null);

    const result = registerSample({
      invoiceId: selectedInvoice.id,
      sampleName,
      sampleType,
      sampleMatrix,
      samplingDate,
      condition: {
        temperature,
        containerIntact,
        sealIntact,
        labelMatched,
        chainOfCustodyMatched,
        decision,
        rejectionReason: decision === 'rejected' ? rejectionReason : undefined
      },
      assignedParameterIds: decision === 'accepted' ? assignedParamIds : []
    });

    if (!result.success) {
      setFormError(result.error || 'Sample registration failed');
      return;
    }

    setShowIntakeModal(false);
    if (result.sample && result.sample.status !== 'rejected') {
      setSelectedSampleForLabel(result.sample);
    }
  };

  return (
    <div className="space-y-6">

      {/* Role access check */}
      {!isSRO && (
        <RoleRestrictionNotice
          requiredRoleName="Sample Receiving Officer (SRO)"
          actionName="Physical Sample Inspection & Intake Registration"
          targetRole="sro"
        />
      )}

      {/* Header Info */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              G-TACR Sample Intake & Lab ID Registration (SRO)
            </h2>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-300">
              SAMM NO. 008 · Clause 7.4
            </span>
          </div>
          <p className="text-xs text-slate-500 max-w-3xl leading-relaxed">
            The Sample Receiving Officer inspects physical sample condition (chilled temperature ≤ 6.0°C, container intactness, tamper seal, Chain of Custody record) and generates an authoritative Lab Code (e.g. <span className="font-mono font-semibold">LAB-2026-XXXX</span>). Sample registration is <strong>strictly gated</strong> to verified <span className="font-semibold text-emerald-700">PAID</span> invoices.
          </p>
        </div>
      </div>

      {/* Pre-Payment Gate Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Paid Invoices (Ready for Intake) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Invoices Cleared for Registration ({paidInvoices.length})
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Pre-Payment Verified
            </span>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {paidInvoices.map(inv => {
              const alreadyRegistered = samples.some(s => s.invoiceId === inv.id && s.status !== 'rejected');
              return (
                <div 
                  key={inv.id} 
                  className="p-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/20 transition-all flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900">{inv.invoiceNumber}</span>
                      <span className="text-[10px] font-mono text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded">
                        PAID
                      </span>
                    </div>
                    <div className="font-medium text-slate-800 truncate">{inv.clientOrg}</div>
                    <div className="text-[10px] text-slate-400">Ref: {inv.quoteNumber} · MYR {inv.totalAmount.toFixed(2)}</div>
                  </div>

                  <div>
                    {alreadyRegistered ? (
                      <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                        Registered
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleStartIntake(inv)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1 whitespace-nowrap ${
                          isSRO
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                        }`}
                        title={isSRO ? 'Register intake sample' : 'Only SRO can register samples'}
                      >
                        <span>Register Intake</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Unpaid Invoices (Locked!) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Unpaid Invoices — LOCKED ({unpaidInvoices.length})
              </h3>
            </div>
            <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 flex items-center gap-1">
              <Lock className="w-3 h-3" /> Mandatory Pre-Payment Gate
            </span>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {unpaidInvoices.length === 0 ? (
              <div className="text-xs text-slate-400 p-6 text-center">
                No outstanding unpaid invoices. All billing accounts are in good standing.
              </div>
            ) : (
              unpaidInvoices.map(inv => (
                <div 
                  key={inv.id} 
                  className="p-3 rounded-xl border border-rose-200 bg-rose-50/30 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900">{inv.invoiceNumber}</span>
                      <span className="text-[10px] font-mono font-bold text-rose-700 bg-rose-100 px-1.5 py-0.2 rounded">
                        UNPAID
                      </span>
                    </div>
                    <div className="font-medium text-slate-800 truncate">{inv.clientOrg}</div>
                    <div className="text-[10px] text-slate-500">Amount: MYR {inv.totalAmount.toFixed(2)}</div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-700 bg-white border border-rose-200 px-2.5 py-1 rounded-lg">
                      <Lock className="w-3 h-3 text-rose-600" /> Intake Blocked
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Registered Samples Table with Print Label Action */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Registered Samples & Test Parameter Allocation
            </h3>
            <p className="text-xs text-slate-500">
              Physical condition log (temperature & container integrity) per Clause 7.4 ISO/IEC 17025
            </p>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {samples.length} Active Records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Lab ID Code</th>
                <th className="py-3 px-4">Sample Description & Client</th>
                <th className="py-3 px-4">Intake Temp</th>
                <th className="py-3 px-4">Container & Seal</th>
                <th className="py-3 px-4">Allocated Tests</th>
                <th className="py-3 px-4">Intake Status</th>
                <th className="py-3 px-4 text-right">SRO Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {samples.map(sample => {
                const isRejected = sample.status === 'rejected';
                return (
                  <tr key={sample.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {sample.sampleCode}
                    </td>

                    <td className="py-3 px-4 max-w-[200px]">
                      <div className="font-semibold text-slate-900 truncate">{sample.sampleName}</div>
                      <div className="text-[10px] text-slate-500 truncate">{sample.clientOrg}</div>
                    </td>

                    <td className="py-3 px-4 font-mono whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                        sample.conditionLog.tempCompliant 
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}>
                        <Thermometer className="w-3 h-3" />
                        {sample.conditionLog.temperature} °C
                      </span>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-[11px]">
                        {sample.conditionLog.containerIntact && sample.conditionLog.sealIntact ? (
                          <span className="text-emerald-700 flex items-center gap-1 font-medium">
                            <CheckCircle className="w-3 h-3" /> Intact & Sealed
                          </span>
                        ) : (
                          <span className="text-rose-700 flex items-center gap-1 font-bold">
                            <AlertTriangle className="w-3 h-3" /> Compromised / Broken Seal
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 max-w-[180px]">
                      <div className="text-[11px] text-slate-700 truncate" title={sample.assignedParameters.map(p => p.parameterName).join(', ')}>
                        {sample.assignedParameters.length > 0 ? (
                          <span>{sample.assignedParameters.length} Tests ({sample.assignedParameters.map(p => p.parameterName.split(' ')[0]).join(', ')})</span>
                        ) : (
                          <span className="text-slate-400">None (Rejected)</span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      {isRejected ? (
                        <span className="text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                          REJECTED BY SRO
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                          ACCEPTED (Active)
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      {!isRejected && (
                        <button
                          type="button"
                          onClick={() => setSelectedSampleForLabel(sample)}
                          className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors inline-flex items-center gap-1"
                        >
                          <Barcode className="w-3.5 h-3.5" />
                          <span>Print Label</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Intake & ISO Condition Log Checklist */}
      {showIntakeModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Sample Inspection & Registration Form
                </h3>
                <p className="text-xs text-slate-500">
                  Clause 7.4 ISO/IEC 17025:2017: Handling of Test Items and Physical Integrity Verification
                </p>
              </div>
              <button 
                onClick={() => setShowIntakeModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitIntake} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              
              {formError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium">
                  {formError}
                </div>
              )}

              {/* Linked Invoice Info Banner */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                <div>
                  <span className="text-slate-500">Invoice Reference:</span> <span className="font-mono font-bold text-slate-900">{selectedInvoice.invoiceNumber}</span>
                  <div className="font-semibold text-slate-800">{selectedInvoice.clientOrg}</div>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                  Status: PAID (Payment Cleared)
                </span>
              </div>

              {/* Sample Identification */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Sample Name / Sampling Point Description <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={sampleName}
                    onChange={e => setSampleName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Sampling Date & Time (Field Record)
                  </label>
                  <input
                    type="text"
                    value={samplingDate}
                    onChange={e => setSamplingDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Sample Category
                  </label>
                  <input
                    type="text"
                    value={sampleType}
                    onChange={e => setSampleType(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Testing Matrix
                  </label>
                  <select
                    value={sampleMatrix}
                    onChange={e => setSampleMatrix(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-hidden bg-white"
                  >
                    <option value="Industrial Wastewater">Industrial Wastewater</option>
                    <option value="Surface River Water">Surface River Water</option>
                    <option value="Potable Raw Water">Potable Raw Water</option>
                    <option value="Soil / Sediment Extraction">Soil / Sediment Extraction</option>
                  </select>
                </div>
              </div>

              {/* ISO 17025 Sample Condition Checklist */}
              <div className="border border-blue-200 bg-blue-50/30 rounded-xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <PackageCheck className="w-4 h-4 text-emerald-700" />
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                      Physical Intake Log & Verification Checklist (Clause 7.4)
                    </h4>
                  </div>
                  {/* Quick Preset Buttons for High Interactivity */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setTemperature(3.8);
                        setContainerIntact(true);
                        setSealIntact(true);
                        setLabelMatched(true);
                        setChainOfCustodyMatched(true);
                        setDecision('accepted');
                      }}
                      className="px-2 py-0.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[10px] font-bold rounded border border-emerald-300 transition-colors shadow-2xs"
                    >
                      ✓ Quick Fill: Compliant (3.8°C)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTemperature(8.5);
                        setContainerIntact(false);
                        setSealIntact(false);
                        setDecision('rejected');
                        setRejectionReason('Sample temperature at 8.5°C exceeds maximum threshold (6.0°C) and container seal broken.');
                      }}
                      className="px-2 py-0.5 bg-rose-100 hover:bg-rose-200 text-rose-800 text-[10px] font-bold rounded border border-rose-300 transition-colors shadow-2xs"
                    >
                      ✗ Simulate Warm (8.5°C)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Temperature */}
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <div className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                      <span>Receipt Temperature (°C)</span>
                      <span className={`text-[11px] font-mono font-bold ${temperature <= 6.0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {temperature <= 6.0 ? '✓ Chilled (≤ 6.0°C)' : '✗ Non-Compliant (> 6.0°C)'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Thermometer className={`w-4 h-4 ${temperature <= 6.0 ? 'text-emerald-600' : 'text-rose-600'}`} />
                      <input
                        type="number"
                        step="0.1"
                        value={temperature}
                        onChange={e => setTemperature(parseFloat(e.target.value) || 0)}
                        className={`w-full px-2.5 py-1.5 border rounded-md font-mono text-xs font-bold focus:outline-hidden ${
                          temperature <= 6.0 
                            ? 'border-emerald-300 text-emerald-950 bg-emerald-50/30 focus:border-emerald-500' 
                            : 'border-rose-300 text-rose-950 bg-rose-50/30 focus:border-rose-500'
                        }`}
                      />
                    </div>
                    {/* Visual Slider */}
                    <div className="mt-2">
                      <input
                        type="range"
                        min="0"
                        max="15"
                        step="0.1"
                        value={temperature}
                        onChange={e => setTemperature(parseFloat(e.target.value))}
                        className="w-full accent-emerald-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                      />
                      <div className="flex justify-between text-[9px] text-slate-400 font-mono mt-0.5">
                        <span>0°C</span>
                        <span className="text-emerald-700 font-bold">Limit: 6.0°C</span>
                        <span>15°C</span>
                      </div>
                    </div>
                  </div>

                  {/* Container Integrity */}
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <label className="block font-bold text-slate-700 mb-1">
                      Container Physical Integrity
                    </label>
                    <div className="flex gap-4 mt-2">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="container"
                          checked={containerIntact}
                          onChange={() => setContainerIntact(true)}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-slate-800">Intact & Sealed</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="container"
                          checked={!containerIntact}
                          onChange={() => setContainerIntact(false)}
                          className="text-red-600 focus:ring-red-500"
                        />
                        <span className="text-red-700 font-semibold">Damaged / Leaking</span>
                      </label>
                    </div>
                  </div>

                  {/* Seal Verification */}
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <label className="block font-bold text-slate-700 mb-1">
                      Security & Tamper Seal
                    </label>
                    <div className="flex gap-4 mt-2">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="seal"
                          checked={sealIntact}
                          onChange={() => setSealIntact(true)}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-slate-800">Seal Intact</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="seal"
                          checked={!sealIntact}
                          onChange={() => setSealIntact(false)}
                          className="text-red-600 focus:ring-red-500"
                        />
                        <span className="text-red-700 font-semibold">Missing / Broken</span>
                      </label>
                    </div>
                  </div>

                  {/* Chain of Custody */}
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <label className="block font-bold text-slate-700 mb-1">
                      Chain of Custody (COC) Record
                    </label>
                    <div className="flex gap-4 mt-2">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="coc"
                          checked={chainOfCustodyMatched}
                          onChange={() => setChainOfCustodyMatched(true)}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-slate-800">Matches Form</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="coc"
                          checked={!chainOfCustodyMatched}
                          onChange={() => setChainOfCustodyMatched(false)}
                          className="text-red-600 focus:ring-red-500"
                        />
                        <span className="text-red-700 font-semibold">Discrepancy</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* SRO Decision */}
                <div className="bg-white p-3 rounded-lg border border-slate-200 pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-slate-900 text-xs">SRO Intake Decision:</span>
                    <div className="flex gap-3">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="decision"
                          value="accepted"
                          checked={decision === 'accepted'}
                          onChange={() => setDecision('accepted')}
                          className="text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="font-bold text-emerald-800 text-xs">ACCEPT (Compliant)</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="decision"
                          value="rejected"
                          checked={decision === 'rejected'}
                          onChange={() => setDecision('rejected')}
                          className="text-rose-600 focus:ring-rose-500"
                        />
                        <span className="font-bold text-rose-800 text-xs">REJECT (Non-Compliant)</span>
                      </label>
                    </div>
                  </div>

                  {decision === 'rejected' && (
                    <div>
                      <label className="block text-[11px] font-bold text-rose-800 mb-1">
                        Reason for Physical Sample Rejection (Mandatory for ISO audit trail)
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Temperature exceeds 6.0°C and container seal was broken upon receipt"
                        value={rejectionReason}
                        onChange={e => setRejectionReason(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-rose-300 rounded-md text-xs text-rose-900 focus:outline-hidden"
                      />
                    </div>
                  )}
                </div>

              </div>

              {/* Modular Parameter Assignment */}
              {decision === 'accepted' && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Layers className="w-4 h-4 text-slate-600" />
                    <label className="text-xs font-bold text-slate-900">
                      Modular Parameter Assignment
                    </label>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border border-slate-200 rounded-xl p-3 bg-slate-50/50 max-h-40 overflow-y-auto">
                    {parameters.map(param => {
                      const isChecked = assignedParamIds.includes(param.id);
                      return (
                        <label
                          key={param.id}
                          className={`flex items-start gap-2 p-2 rounded-lg border text-xs cursor-pointer ${
                            isChecked ? 'bg-blue-50 border-blue-300' : 'bg-white border-slate-200'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleParam(param.id)}
                            className="mt-0.5 rounded text-blue-600"
                          />
                          <div className="min-w-0">
                            <span className="font-bold text-slate-900 block">{param.code}</span>
                            <span className="text-[10px] text-slate-500 block truncate">{param.name}</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowIntakeModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-xs font-bold text-white rounded-lg shadow-xs ${
                    decision === 'accepted' ? 'bg-blue-700 hover:bg-blue-800' : 'bg-rose-700 hover:bg-rose-800'
                  }`}
                >
                  {decision === 'accepted' ? 'Confirm Intake & Generate LAB ID' : 'Confirm Sample Rejection'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Modal: Print Sample Barcode Label */}
      {selectedSampleForLabel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Barcode className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Sample Barcode Label (ISO 17025)
                </h3>
              </div>
              <button 
                onClick={() => setSelectedSampleForLabel(null)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            {/* Thermal Label Simulation Box */}
            <div className="border-2 border-dashed border-slate-400 rounded-xl p-4 bg-white font-mono text-slate-900 shadow-inner mb-4">
              <div className="text-center pb-2 border-b border-slate-300">
                <div className="flex items-center justify-between gap-2 mb-1 px-1">
                  <img 
                    src="/assets/aistudio/Logo_LGM_wo_BG_90314aa6.png" 
                    alt="LGM" 
                    className="h-7 w-7 object-contain"
                  />
                  <div className="text-[9px] uppercase font-sans font-extrabold tracking-wider text-emerald-900 text-center">
                    G-TACR · SAMM NO. 008<br/>
                    <span className="text-[8px] font-normal text-slate-500">LEMBAGA GETAH MALAYSIA</span>
                  </div>
                  <img 
                    src="/assets/aistudio/Logo_G-TACR_fe961507.png" 
                    alt="G-TACR" 
                    className="h-7 max-w-[50px] object-contain"
                  />
                </div>
                <div className="text-2xl font-bold font-mono tracking-wider text-slate-900 mt-1">
                  {selectedSampleForLabel.sampleCode}
                </div>
                {/* Visual Barcode Strip */}
                <div className="h-10 my-2 bg-slate-900 flex items-center justify-center text-white text-[10px] tracking-widest font-mono">
                  ||||| ||| |||||| |||| ||||||| |||||
                </div>
              </div>

              <div className="pt-2 space-y-1 text-[11px]">
                <div className="truncate"><span className="text-slate-500">Name:</span> <span className="font-semibold">{selectedSampleForLabel.sampleName}</span></div>
                <div className="truncate"><span className="text-slate-500">Client:</span> <span>{selectedSampleForLabel.clientOrg}</span></div>
                <div><span className="text-slate-500">Invoice Ref:</span> <span>{selectedSampleForLabel.invoiceNumber}</span></div>
                <div><span className="text-slate-500">Registered:</span> <span>{selectedSampleForLabel.tat.registeredAt}</span></div>
                <div><span className="text-slate-500">Intake Temp:</span> <span className="font-bold">{selectedSampleForLabel.conditionLog.temperature} °C</span></div>
                <div className="pt-1 text-[10px] text-slate-500 truncate">
                  Parameters: {selectedSampleForLabel.assignedParameters.map(p => p.parameterId.replace('PARAM-', '')).join(', ')}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 text-[11px]">Thermal Label Simulation for Container Tracking</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg flex items-center gap-1 shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Label
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSampleForLabel(null)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
