import React, { useState } from 'react';
import { useLIMS } from '../../context/LIMSContext';
import { Sample } from '../../types/lims';
import { RoleRestrictionNotice } from '../common/RoleRestrictionNotice';
import { 
  FlaskConical, 
  CheckCircle, 
  Clock, 
  Send, 
  Check, 
  Building2,
  Sparkles,
  Zap
} from 'lucide-react';

export const AnalysisView: React.FC = () => {
  const { 
    samples, 
    updateTestResult, 
    submitDraftForReview, 
    activeRole 
  } = useLIMS();

  const isAnalyst = activeRole === 'analyst';

  // Active testing samples (registered, in_analysis, or draft_submitted)
  const labSamples = samples.filter(s => 
    s.status === 'registered' || s.status === 'in_analysis' || s.status === 'draft_submitted'
  );

  const [selectedSample, setSelectedSample] = useState<Sample | null>(() => labSamples[0] || null);
  const [analystNotes, setAnalystNotes] = useState(selectedSample?.analystNotes || '');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSelectSample = (sample: Sample) => {
    setSelectedSample(sample);
    setAnalystNotes(sample.analystNotes || '');
    setStatusMessage(null);
  };

  const handleParamResultChange = (parameterId: string, value: string, qcPassed: boolean, equipRef?: string) => {
    if (!selectedSample) return;
    updateTestResult(selectedSample.id, parameterId, value, qcPassed, equipRef);
  };

  // Re-read current selected sample from context so updates reflect live
  const activeSampleData = selectedSample ? samples.find(s => s.id === selectedSample.id) : null;

  const handleAutofillCompliant = () => {
    if (!activeSampleData) return;
    const presets: Record<string, string> = {
      'PARAM-PH': '7.2',
      'PARAM-BOD': '14.0',
      'PARAM-COD': '38.0',
      'PARAM-TSS': '22.0',
      'PARAM-OG': '0.4',
      'PARAM-PB': '0.015',
      'PARAM-CD': '0.002',
      'PARAM-AS': '0.008'
    };
    activeSampleData.assignedParameters.forEach(p => {
      const val = presets[p.parameterId] || '10.0';
      updateTestResult(activeSampleData.id, p.parameterId, val, true, p.equipmentRef);
    });
    setAnalystNotes('Sample analyzed in accordance with G-TACR SAMM No. 008 accredited standard methods. Standard calibration curve R² > 0.999. Method blanks and duplicates RPD < 3.5% (Compliant).');
  };

  const handleSubmitDraft = () => {
    if (!activeSampleData) return;
    setStatusMessage(null);

    const result = submitDraftForReview(activeSampleData.id, analystNotes);
    if (!result.success) {
      setStatusMessage({ type: 'error', text: result.error || 'Failed to submit draft' });
    } else {
      setStatusMessage({ 
        type: 'success', 
        text: `Draft COA for sample ${activeSampleData.sampleCode} has been submitted to the Technical Manager for QA/QC review and cryptographic digital sign-off.` 
      });
    }
  };

  const completedParamsCount = activeSampleData
    ? activeSampleData.assignedParameters.filter(p => p.resultValue && p.resultValue.trim() !== '').length
    : 0;
  const totalParamsCount = activeSampleData ? activeSampleData.assignedParameters.length : 0;
  const isAllParamsCompleted = totalParamsCount > 0 && completedParamsCount === totalParamsCount;

  return (
    <div className="space-y-6">

      {/* Role permission notice */}
      {!isAnalyst && (
        <RoleRestrictionNotice
          requiredRoleName="Chemist / Analyst"
          actionName="Laboratory Analysis & Multi-Parameter Test Result Entry"
          targetRole="analyst"
        />
      )}

      {/* Header Info */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              G-TACR Laboratory Worklist & Test Entry (Analyst)
            </h2>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-300">
              SAMM NO. 008 · Clauses 7.7 & 7.8
            </span>
          </div>
          <p className="text-xs text-slate-500 max-w-3xl leading-relaxed">
            The accredited chemist performs testing according to approved standard methods (APHA/ASTM/USEPA), enters instrument raw data with expanded measurement uncertainty (± U), verifies QC blank/duplicate limits, and submits Draft COAs for technical managerial approval.
          </p>
        </div>
      </div>

      {statusMessage && (
        <div className={`p-4 rounded-xl border text-xs font-semibold flex items-center justify-between ${
          statusMessage.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
            : 'bg-rose-50 border-rose-200 text-rose-900'
        }`}>
          <span>{statusMessage.text}</span>
          <button onClick={() => setStatusMessage(null)} className="p-1 text-slate-400 hover:text-slate-600">✕</button>
        </div>
      )}

      {/* Main split worklist + result entry workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Worklist Queue (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Active Lab Queue ({labSamples.length})
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-500">
              {labSamples.filter(s => s.status === 'in_analysis' || s.status === 'registered').length} Testing
            </span>
          </div>

          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
            {labSamples.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No active testing samples in lab queue.
              </div>
            ) : (
              labSamples.map(sample => {
                const isSelected = selectedSample?.id === sample.id;
                const completed = sample.assignedParameters.filter(p => p.resultValue && p.resultValue.trim() !== '').length;
                const total = sample.assignedParameters.length;

                return (
                  <button
                    key={sample.id}
                    type="button"
                    onClick={() => handleSelectSample(sample)}
                    className={`w-full p-4 text-left transition-colors flex flex-col gap-2 ${
                      isSelected 
                        ? 'bg-indigo-50/50 border-l-4 border-l-indigo-600' 
                        : 'hover:bg-slate-50 border-l-4 border-l-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-slate-900">{sample.sampleCode}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        sample.tat.statusColor === 'green' ? 'bg-emerald-100 text-emerald-800' :
                        sample.tat.statusColor === 'yellow' ? 'bg-amber-100 text-amber-900' :
                        'bg-rose-100 text-rose-800'
                      }`}>
                        TAT: {sample.tat.workingDaysRemaining}d left
                      </span>
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-slate-800 truncate">{sample.sampleName}</div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{sample.clientOrg}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100">
                      <span className="text-slate-500">
                        {completed}/{total} Parameters Done
                      </span>
                      <span className="text-xs font-semibold text-indigo-700">
                        {sample.status === 'draft_submitted' ? 'Draft Submitted' : 'Testing In Progress'}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Multi-Parameter Test Entry Stage (8 cols) */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          {activeSampleData ? (
            <div>
              
              {/* Stage Header */}
              <div className="p-5 border-b border-slate-200 bg-slate-50/50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold font-mono text-slate-900">
                        {activeSampleData.sampleCode}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        ({activeSampleData.invoiceNumber})
                      </span>
                    </div>
                    <div className="font-semibold text-slate-800 text-sm mt-0.5">
                      {activeSampleData.sampleName}
                    </div>
                    <div className="text-xs text-slate-500">
                      {activeSampleData.clientOrg} · Matrix: {activeSampleData.sampleMatrix}
                    </div>
                  </div>

                  {/* Completion Progress */}
                  <div className="text-right shrink-0">
                    <div className="text-xs font-bold text-slate-700 mb-1">
                      Testing Progress: {completedParamsCount} / {totalParamsCount}
                    </div>
                    <div className="w-40 bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${totalParamsCount > 0 ? (completedParamsCount / totalParamsCount) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>

                {activeSampleData.status === 'draft_submitted' && (
                  <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      Draft report has been submitted to the Technical Manager. You may review and update readings prior to final sign-off.
                    </span>
                  </div>
                )}
              </div>

              {/* Multi-Parameter Test Table */}
              <div className="p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
                  <div className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    Analytical Parameter Readings & Quality Assurance
                  </div>
                  {isAnalyst && (
                    <button
                      type="button"
                      onClick={handleAutofillCompliant}
                      className="px-3 py-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
                      <span>Auto-fill Realistic Lab Readings (1-Click)</span>
                    </button>
                  )}
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-3 px-3">Parameter & Test Method</th>
                        <th className="py-3 px-3">Standard Limit</th>
                        <th className="py-3 px-3 w-36">Test Result</th>
                        <th className="py-3 px-3">Uncertainty (± U)</th>
                        <th className="py-3 px-3 text-center">QC Pass</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activeSampleData.assignedParameters.map(param => {
                        const isFilled = param.resultValue && param.resultValue.trim() !== '';

                        return (
                          <tr key={param.parameterId} className="hover:bg-slate-50/70">
                            
                            {/* Param & Method */}
                            <td className="py-3 px-3">
                              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                <span>{param.parameterName}</span>
                                {isFilled && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                              </div>
                              <div className="text-[10px] font-mono text-indigo-700 font-medium">
                                {param.method}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {param.equipmentRef}
                              </div>
                            </td>

                            {/* Standard Limit */}
                            <td className="py-3 px-3 font-mono text-slate-600 whitespace-nowrap">
                              {param.regulatoryLimit || 'N/A'}
                            </td>

                            {/* Result Input */}
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-1">
                                <input
                                  type="text"
                                  placeholder={`Result (${param.unit})`}
                                  value={param.resultValue || ''}
                                  onChange={e => handleParamResultChange(
                                    param.parameterId,
                                    e.target.value,
                                    param.qcPassed ?? true,
                                    param.equipmentRef
                                  )}
                                  disabled={!isAnalyst}
                                  className="w-full px-2 py-1.5 border border-slate-300 rounded-md font-mono text-xs font-semibold focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white"
                                />
                                <span className="text-[10px] text-slate-500 font-mono shrink-0">
                                  {param.unit}
                                </span>
                              </div>
                            </td>

                            {/* Uncertainty */}
                            <td className="py-3 px-3 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                              {param.uncertainty}
                            </td>

                            {/* QC Pass Check */}
                            <td className="py-3 px-3 text-center">
                              <input
                                type="checkbox"
                                checked={param.qcPassed ?? false}
                                onChange={e => handleParamResultChange(
                                  param.parameterId,
                                  param.resultValue || '',
                                  e.target.checked,
                                  param.equipmentRef
                                )}
                                disabled={!isAnalyst}
                                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                title="Verify quality control compliance (Method Blank, Duplicate RPD <= 5%, Matrix Spike)"
                              />
                            </td>

                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Analyst Notes */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Chemist Remarks / Method Validity Statement (Clause 7.7)
                  </label>
                  <textarea
                    rows={2}
                    value={analystNotes}
                    onChange={e => setAnalystNotes(e.target.value)}
                    disabled={!isAnalyst}
                    placeholder="e.g. Sample analyzed in accordance with SAMM accredited standard methods. Standard calibration curve R² > 0.999. Method blank non-detectable."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                {/* Action Buttons */}
                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-xs text-slate-500 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>ISO/IEC 17025 Clause 7.7: Quality Assurance of Test Results</span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSubmitDraft}
                      disabled={!isAnalyst || !isAllParamsCompleted}
                      className={`px-4 py-2 text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 ${
                        isAnalyst && isAllParamsCompleted
                          ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                      title={!isAllParamsCompleted ? 'All parameter results must be recorded before draft submission' : ''}
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit Draft COA for Technical Approval</span>
                    </button>
                  </div>
                </div>

              </div>

            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 text-xs">
              Please select a sample from the laboratory worklist queue on the left to enter analysis data.
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
