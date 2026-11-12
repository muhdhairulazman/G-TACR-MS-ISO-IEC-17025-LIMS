import React, { useState } from 'react';
import { useLIMS } from '../../context/LIMSContext';
import { Sample } from '../../types/lims';
import { RoleRestrictionNotice } from '../common/RoleRestrictionNotice';
import { 
  ShieldCheck, 
  RotateCcw, 
  CheckCircle, 
  Clock, 
  Fingerprint, 
  FileText, 
  Thermometer
} from 'lucide-react';

interface TechnicalReviewViewProps {
  onSelectSampleForCOA: (sample: Sample) => void;
}

export const TechnicalReviewView: React.FC<TechnicalReviewViewProps> = ({
  onSelectSampleForCOA
}) => {
  const { 
    samples, 
    approveSampleCOA, 
    rejectDraftSample, 
    reviseApprovedCOA, 
    activeRole, 
    currentUser 
  } = useLIMS();

  const isTechManager = activeRole === 'tech_manager';

  // Samples pending QA sign-off
  const draftSamples = samples.filter(s => s.status === 'draft_submitted');
  // Approved or finalized samples
  const approvedSamples = samples.filter(s => s.status === 'approved' || s.status === 'delivered');

  const [activeSubTab, setActiveSubTab] = useState<'pending' | 'approved'>('pending');
  const [selectedSample, setSelectedSample] = useState<Sample | null>(() => draftSamples[0] || approvedSamples[0] || null);

  // Digital Sign-Off Modal State
  const [showSignModal, setShowSignModal] = useState(false);
  const [signRemarks, setSignRemarks] = useState(
    'All quality control checks, detection limits, and standard methods have been verified in compliance with MS ISO/IEC 17025:2017. This report is approved as Final Certificate of Analysis (COA).'
  );

  // Rejection / Return Modal State
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectRemarks, setRejectRemarks] = useState('');

  // Report Revision Modal State (ISO 17025 Clause 7.8.8)
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionReason, setRevisionReason] = useState('');

  // QA Checklists
  const [qaChecks, setQaChecks] = useState({
    methodAccredited: true,
    calibrationValid: true,
    qcTolerancesPassed: true,
    noAnomalies: true
  });

  const allQaChecksPassed = Object.values(qaChecks).every(v => v === true);

  const activeSampleData = selectedSample ? samples.find(s => s.id === selectedSample.id) : null;

  const handleApproveConfirm = () => {
    if (!activeSampleData) return;
    const res = approveSampleCOA(activeSampleData.id, signRemarks);
    setShowSignModal(false);
    if (res.success) {
      setActiveSubTab('approved');
    }
  };

  const handleRejectConfirm = () => {
    if (!activeSampleData || !rejectRemarks.trim()) return;
    rejectDraftSample(activeSampleData.id, rejectRemarks);
    setShowRejectModal(false);
    setRejectRemarks('');
  };

  const handleRevisionConfirm = () => {
    if (!activeSampleData || !revisionReason.trim()) return;
    reviseApprovedCOA(activeSampleData.id, revisionReason);
    setShowRevisionModal(false);
    setRevisionReason('');
  };

  return (
    <div className="space-y-6">

      {/* Role permission check */}
      {!isTechManager && (
        <RoleRestrictionNotice
          requiredRoleName="Technical Manager"
          actionName="Technical Review (QA/QC) & Digital Sign-off of Final Reports"
          targetRole="tech_manager"
        />
      )}

      {/* Header Info */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              G-TACR Technical Review & Digital Sign-off (QA/QC)
            </h2>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-300">
              SAMM NO. 008 · Clause 7.8 Signatory
            </span>
          </div>
          <p className="text-xs text-slate-500 max-w-3xl leading-relaxed">
            The Technical Manager is responsible for certifying test data integrity, accredited method validity, QA/QC tolerance thresholds, executing cryptographic digital sign-offs, and managing official report amendments (Clause 7.8.8 Rev01).
          </p>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => {
            setActiveSubTab('pending');
            if (draftSamples[0]) setSelectedSample(draftSamples[0]);
          }}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 ${
            activeSubTab === 'pending'
              ? 'bg-rose-50 text-rose-800 border border-rose-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-4 h-4 text-rose-600" />
          <span>Pending Review & Approval ({draftSamples.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveSubTab('approved');
            if (approvedSamples[0]) setSelectedSample(approvedSamples[0]);
          }}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 ${
            activeSubTab === 'approved'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>Final COAs / Approved ({approvedSamples.length})</span>
        </button>
      </div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Sample List (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              {activeSubTab === 'pending' ? 'Drafts Awaiting Sign-off' : 'Approved Final COAs'}
            </h3>
            <span className="text-[11px] font-mono text-slate-500">
              {activeSubTab === 'pending' ? draftSamples.length : approvedSamples.length} Records
            </span>
          </div>

          <div className="divide-y divide-slate-100 max-h-[580px] overflow-y-auto">
            {(activeSubTab === 'pending' ? draftSamples : approvedSamples).length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                {activeSubTab === 'pending' 
                  ? 'No drafts pending technical review at this moment.' 
                  : 'No approved final reports.'}
              </div>
            ) : (
              (activeSubTab === 'pending' ? draftSamples : approvedSamples).map(sample => {
                const isSelected = selectedSample?.id === sample.id;
                return (
                  <button
                    key={sample.id}
                    type="button"
                    onClick={() => setSelectedSample(sample)}
                    className={`w-full p-4 text-left transition-colors flex flex-col gap-2 ${
                      isSelected 
                        ? 'bg-blue-50/50 border-l-4 border-l-blue-600' 
                        : 'hover:bg-slate-50 border-l-4 border-l-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-slate-900">{sample.sampleCode}</span>
                      <span className="font-mono text-[10px] text-slate-500">{sample.coaNumber}</span>
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-slate-800 truncate">{sample.sampleName}</div>
                      <div className="text-[10px] text-slate-500 truncate">{sample.clientOrg}</div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100">
                      <span className="text-slate-500">{sample.assignedParameters.length} Tested Parameters</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.2 rounded-sm ${
                        sample.status === 'draft_submitted' 
                          ? 'bg-amber-100 text-amber-900' 
                          : 'bg-emerald-100 text-emerald-900'
                      }`}>
                        {sample.status === 'draft_submitted' ? 'Draft Ready' : 'COA Approved'}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: QA/QC Inspection & Digital Sign-off Stage (8 cols) */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          {activeSampleData ? (
            <div>
              
              {/* Review Header Banner */}
              <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold font-mono text-slate-900">
                      {activeSampleData.sampleCode}
                    </span>
                    <span className="text-xs font-mono font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {activeSampleData.coaNumber}
                    </span>
                  </div>
                  <div className="font-semibold text-slate-800 text-sm mt-0.5">
                    {activeSampleData.sampleName}
                  </div>
                  <div className="text-xs text-slate-500">
                    {activeSampleData.clientOrg} · Matrix: {activeSampleData.sampleMatrix}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onSelectSampleForCOA(activeSampleData)}
                    className="px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1.5 border border-blue-200"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Preview Official COA</span>
                  </button>
                </div>
              </div>

              <div className="p-5 space-y-5">
                
                {/* Physical Intake Audit Strip */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                  <div className="font-bold text-slate-700 uppercase text-[10px] tracking-wider mb-2 flex items-center gap-1.5">
                    <Thermometer className="w-3.5 h-3.5 text-slate-500" />
                    <span>Physical Receipt Integrity Log (Clause 7.4)</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-600">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Receipt Temperature:</span>
                      <span className="font-mono font-semibold text-slate-900">{activeSampleData.conditionLog.temperature} °C</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Container Integrity:</span>
                      <span className="font-semibold text-emerald-700">Intact & Sealed</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Security Tamper Seal:</span>
                      <span className="font-semibold text-emerald-700">Verified Intact</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Inspecting Officer:</span>
                      <span className="truncate block font-medium">{activeSampleData.conditionLog.inspectedBy.split(' ')[0]}</span>
                    </div>
                  </div>
                </div>

                {/* Multi-parameter test results inspection table */}
                <div>
                  <h4 className="text-xs font-bold text-slate-900 mb-2 uppercase tracking-wide">
                    Multi-Parameter Test Results & Measurement Uncertainty (± U)
                  </h4>
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="py-2.5 px-3">Test Parameter</th>
                          <th className="py-2.5 px-3">Standard Method</th>
                          <th className="py-2.5 px-3">Regulatory Limit</th>
                          <th className="py-2.5 px-3">Measured Result</th>
                          <th className="py-2.5 px-3">Uncertainty (± U)</th>
                          <th className="py-2.5 px-3 text-center">QC Check</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {activeSampleData.assignedParameters.map(param => (
                          <tr key={param.parameterId} className="hover:bg-slate-50/70">
                            <td className="py-2.5 px-3 font-semibold text-slate-900">
                              {param.parameterName}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-600 text-[11px]">
                              {param.method}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px]">
                              {param.regulatoryLimit || 'N/A'}
                            </td>
                            <td className="py-2.5 px-3 font-mono font-bold text-blue-900">
                              {param.resultValue || 'Pending entry'} {param.unit}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px]">
                              {param.uncertainty}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="inline-flex items-center text-emerald-700 text-xs font-semibold">
                                ✓ Passed
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Analyst's notes */}
                {activeSampleData.analystNotes && (
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                    <span className="font-bold text-slate-700 block mb-0.5">Analyst Laboratory Notes:</span>
                    <p className="text-slate-600 italic">"{activeSampleData.analystNotes}"</p>
                  </div>
                )}

                {/* Technical QA Checklist for Approval (ISO 17025 Integrity Gate) */}
                {activeSampleData.status === 'draft_submitted' && (
                  <div className="border border-emerald-200 bg-emerald-50/30 rounded-xl p-4 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-700" />
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                          Technical QA/QC Verification Checklist (Approval Gating)
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => setQaChecks({
                          methodAccredited: true,
                          calibrationValid: true,
                          qcTolerancesPassed: true,
                          noAnomalies: true
                        })}
                        className="px-2.5 py-1 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors shadow-2xs self-start sm:self-auto cursor-pointer"
                      >
                        ✓ Pass All 4 QA Checks (1-Click)
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={qaChecks.methodAccredited}
                          onChange={e => setQaChecks(prev => ({ ...prev, methodAccredited: e.target.checked }))}
                          className="rounded text-emerald-600"
                        />
                        <span className="text-slate-800">Methods Accredited under G-TACR SAMM NO. 008 Scope</span>
                      </label>

                      <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={qaChecks.calibrationValid}
                          onChange={e => setQaChecks(prev => ({ ...prev, calibrationValid: e.target.checked }))}
                          className="rounded text-blue-600"
                        />
                        <span className="text-slate-800">Instrument Calibration Valid & Traceable (NIST/SI)</span>
                      </label>

                      <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={qaChecks.qcTolerancesPassed}
                          onChange={e => setQaChecks(prev => ({ ...prev, qcTolerancesPassed: e.target.checked }))}
                          className="rounded text-blue-600"
                        />
                        <span className="text-slate-800">Blank & Duplicate Tolerances Compliant (RPD ≤ 5%)</span>
                      </label>

                      <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={qaChecks.noAnomalies}
                          onChange={e => setQaChecks(prev => ({ ...prev, noAnomalies: e.target.checked }))}
                          className="rounded text-blue-600"
                        />
                        <span className="text-slate-800">No Matrix Interferences or Out-of-Trend Anomalies</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Digital Signature Audit Stamp if already approved */}
                {activeSampleData.digitalSignOff && (
                  <div className="border border-emerald-200 bg-emerald-50/40 rounded-xl p-4 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-emerald-950">
                        <Fingerprint className="w-4 h-4 text-emerald-700" />
                        <span>Cryptographic Digital Sign-off Verified</span>
                      </div>
                      <span className="font-mono text-[10px] text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                        {activeSampleData.digitalSignOff.certificateId}
                      </span>
                    </div>
                    <div className="text-slate-700">
                      Signatory: <span className="font-semibold">{activeSampleData.digitalSignOff.managerName}</span> ({activeSampleData.digitalSignOff.managerTitle})
                    </div>
                    <div className="font-mono text-[10px] text-slate-500 break-all bg-white p-2 rounded border border-emerald-100">
                      SHA-256 Hash: {activeSampleData.digitalSignOff.signatureHash}
                    </div>
                    <p className="text-[11px] text-slate-600 italic">
                      "{activeSampleData.digitalSignOff.remarks}"
                    </p>
                  </div>
                )}

                {/* Action Buttons for Technical Manager */}
                <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-xs text-slate-500">
                    Authorized Signatory: <span className="font-semibold text-slate-800">Technical Manager</span>
                  </div>

                  <div className="flex gap-2">
                    {/* For Drafts: Return vs Approve */}
                    {activeSampleData.status === 'draft_submitted' && (
                      <>
                        <button
                          type="button"
                          onClick={() => setShowRejectModal(true)}
                          disabled={!isTechManager}
                          className="px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors border border-rose-200"
                        >
                          Return to Laboratory
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowSignModal(true)}
                          disabled={!isTechManager || !allQaChecksPassed}
                          className={`px-4 py-2 text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 ${
                            isTechManager && allQaChecksPassed
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          <Fingerprint className="w-4 h-4" />
                          <span>Approve & Sign-off Final COA</span>
                        </button>
                      </>
                    )}

                    {/* For Approved: Revision Control */}
                    {(activeSampleData.status === 'approved' || activeSampleData.status === 'delivered') && (
                      <button
                        type="button"
                        onClick={() => setShowRevisionModal(true)}
                        disabled={!isTechManager}
                        className="px-3.5 py-2 text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg flex items-center gap-1.5 transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                        <span>Amend Report (Clause 7.8.8 Rev)</span>
                      </button>
                    )}
                  </div>
                </div>

              </div>

            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 text-xs">
              Please select a sample record from the list to perform technical review.
            </div>
          )}
        </div>

      </div>

      {/* Modal: Digital Sign-off Confirmation */}
      {showSignModal && activeSampleData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Fingerprint className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Execute Cryptographic Digital Sign-off
                </h3>
                <p className="text-xs text-slate-500">
                  COA Reference: <span className="font-mono font-bold text-slate-800">{activeSampleData.coaNumber}</span>
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs mb-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <div><span className="text-slate-500">Signatory Officer:</span> <span className="font-bold text-slate-900">{currentUser.name}</span></div>
                <div><span className="text-slate-500">Designation:</span> <span className="font-medium text-slate-800">{currentUser.title}</span></div>
                <div><span className="text-slate-500">Certificate Authority ID:</span> <span className="font-mono font-semibold text-blue-700">ISO17025-SIG-{activeSampleData.sampleCode.replace('LAB-', '')}</span></div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Compliance Statement / Approval Sign-off Remarks
                </label>
                <textarea
                  rows={3}
                  value={signRemarks}
                  onChange={e => setSignRemarks(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-[11px] text-amber-900">
                <strong>Legal Effect:</strong> Report status will transition to <strong>Final COA</strong> and will be immutably locked. Any subsequent alterations require formal Amendment (Rev01) per ISO/IEC 17025 Clause 7.8.8.
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowSignModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApproveConfirm}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs flex items-center gap-1.5"
              >
                <Fingerprint className="w-4 h-4" />
                <span>Confirm Signature & Issue Final COA</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Return to Lab / Reject Draft */}
      {showRejectModal && activeSampleData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 mb-2">
              Return Draft to Laboratory (Re-testing Required)
            </h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Draft report for <span className="font-mono font-bold text-slate-800">{activeSampleData.sampleCode}</span> will be reverted to 'Testing In Progress' status for corrective action by the chemist.
            </p>

            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Reason for Return / Corrective Action Required <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                placeholder="e.g. BOD5 reading duplicate RPD exceeds 5% tolerance threshold. Re-calibrate dissolved oxygen sensor and repeat dilution."
                value={rejectRemarks}
                onChange={e => setRejectRemarks(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-rose-500"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectConfirm}
                disabled={!rejectRemarks.trim()}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-lg shadow-xs"
              >
                Return Draft
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Report Amendment (ISO 17025 Clause 7.8.8) */}
      {showRevisionModal && activeSampleData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2 mb-2">
              <RotateCcw className="w-5 h-5 text-amber-600" />
              <h3 className="text-base font-bold text-slate-900">
                Official Report Amendment (Clause 7.8.8)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              In accordance with <strong>MS ISO/IEC 17025:2017 Clause 7.8.8</strong>: Any amendment to an issued Certificate of Analysis generates an incremented revision identifier (e.g. <span className="font-mono font-bold text-slate-800">{activeSampleData.sampleCode}-Rev01</span>) and permanently archives prior versions alongside technical justifications.
            </p>

            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Technical Justification for Amendment <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                placeholder="e.g. Correction of measurement units for Heavy Metals per written client request dated 11 Nov 2026."
                value={revisionReason}
                onChange={e => setRevisionReason(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-amber-500"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowRevisionModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRevisionConfirm}
                disabled={!revisionReason.trim()}
                className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 rounded-lg shadow-xs"
              >
                Generate Revision (Rev01)
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
