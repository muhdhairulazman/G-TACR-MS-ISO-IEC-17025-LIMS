import React, { useState } from 'react';
import { useLIMS } from '../../context/LIMSContext';
import { Sample } from '../../types/lims';
import { 
  Download, 
  Printer, 
  Send, 
  ShieldCheck, 
  CheckCircle, 
  Fingerprint
} from 'lucide-react';

interface CertificateModalProps {
  sample: Sample | null;
  onClose: () => void;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({ sample, onClose }) => {
  const { deliverSampleCOA, activeRole } = useLIMS();
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [deliverySuccess, setDeliverySuccess] = useState(false);

  if (!sample) return null;

  const isApprovedOrDelivered = sample.status === 'approved' || sample.status === 'delivered';
  const isAdmin = activeRole === 'admin';

  const handleSimulatePdfExport = () => {
    // Generate text/html based downloadable simulation
    const content = `
========================================================================
             G-TACR CERTIFICATE OF ANALYSIS (COA)
     GLOBAL TESTING & ANALYTICAL CHEMISTRY RESEARCH (MALAYSIAN RUBBER BOARD)
               MS ISO/IEC 17025:2017 ACCREDITED TESTING LABORATORY
        (Skim Akreditasi Makmal Malaysia - SAMM Accreditation No. 008)
========================================================================
Certificate No.             : ${sample.coaNumber}
Laboratory Sample ID (Lab ID): ${sample.sampleCode}
Client / Applicant          : ${sample.clientName} (${sample.clientOrg})
Sample Description          : ${sample.sampleName}
Sample Matrix               : ${sample.sampleMatrix}
Date of Receipt             : ${sample.receivedDate}
Receipt Temperature (Intake): ${sample.conditionLog.temperature} °C (Chilled Compliance Verified)
Container & Security Seal   : Intact & Sealed
Reporting Status            : ${isApprovedOrDelivered ? 'FINAL OFFICIAL REPORT' : 'UNAPPROVED DRAFT'}

------------------------------------------------------------------------
ANALYTICAL TEST RESULTS
------------------------------------------------------------------------
Parameter          | Standard Method  | Limit       | Measured Result | Uncertainty (±U)
------------------------------------------------------------------------
${sample.assignedParameters.map(p => 
  `${p.parameterName.padEnd(18)} | ${p.method.padEnd(16)} | ${(p.regulatoryLimit || 'N/A').padEnd(11)} | ${(p.resultValue + ' ' + p.unit).padEnd(15)} | ${p.uncertainty}`
).join('\n')}

------------------------------------------------------------------------
QUALITY ASSURANCE & DIGITAL SIGN-OFF (CLAUSE 7.8)
------------------------------------------------------------------------
Testing Chemist     : Dr. Hazim bin Mansur, CChem MMIC
Authorized Signatory: ${sample.digitalSignOff?.managerName || 'Pending Final Approval'}
Date Authorized     : ${sample.digitalSignOff?.signedAt || 'Draft Under Review'}
Digital Signature   : ${sample.digitalSignOff?.signatureHash || 'N/A'}
Signatory Cert ID   : ${sample.digitalSignOff?.certificateId || 'N/A'}

Accreditation Scope: G-TACR SAMM Laboratory No. 008 (MS ISO/IEC 17025:2017)
========================================================================
`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${sample.coaNumber}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const handleDeliverToClient = () => {
    const res = deliverSampleCOA(sample.id);
    if (res.success) {
      setDeliverySuccess(true);
      setTimeout(() => setDeliverySuccess(false), 3500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto no-print">
      <div className="bg-white rounded-2xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        
        {/* Top Control Bar */}
        <div className="px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <div>
              <span className="text-xs font-bold tracking-tight text-white block">
                Certificate of Analysis (COA) Preview
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {sample.coaNumber} · MS ISO/IEC 17025:2017 Accredited
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Simulated Export to PDF */}
            <button
              type="button"
              onClick={handleSimulatePdfExport}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 border border-slate-700"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>Export Certificate (TXT/PDF)</span>
            </button>

            {/* Print button */}
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 border border-slate-700"
            >
              <Printer className="w-3.5 h-3.5 text-slate-300" />
              <span className="hidden sm:inline">Print</span>
            </button>

            {/* Admin: Deliver to Client (Concludes TAT) */}
            {isApprovedOrDelivered && sample.status !== 'delivered' && isAdmin && (
              <button
                type="button"
                onClick={handleDeliverToClient}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Deliver to Client (Close TAT)</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="ml-2 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Feedback banners */}
        {downloadSuccess && (
          <div className="bg-blue-600 text-white text-xs font-semibold px-4 py-2 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>Certificate of Analysis ({sample.coaNumber}) exported successfully!</span>
          </div>
        )}

        {deliverySuccess && (
          <div className="bg-emerald-600 text-white text-xs font-semibold px-4 py-2 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>Report delivered to client ({sample.clientEmail}). 7-Day TAT tracker officially closed!</span>
          </div>
        )}

        {/* Printable Certificate Canvas Stage */}
        <div className="p-6 sm:p-10 overflow-y-auto bg-slate-100/60 print-container">
          <div className="max-w-3xl mx-auto bg-white border border-slate-300 shadow-sm rounded-xl p-8 sm:p-12 text-slate-900 font-sans relative">
            
            {/* Watermark for draft status */}
            {!isApprovedOrDelivered && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
                <span className="text-8xl font-black uppercase text-slate-900 rotate-[-35deg]">
                  DRAFT ONLY
                </span>
              </div>
            )}

            {/* Certificate Official Letterhead Header */}
            <div className="border-b-2 border-slate-900 pb-5 mb-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Left: Official LGM Emblem */}
                <div className="shrink-0 flex items-center justify-center">
                  <img 
                    src="/assets/aistudio/Logo_LGM_wo_BG_90314aa6.png" 
                    alt="Lembaga Getah Malaysia (LGM)" 
                    className="h-20 w-20 object-contain"
                  />
                </div>

                {/* Center: Official Government Laboratory Header */}
                <div className="text-center flex-1 px-2">
                  <div className="text-[12px] font-extrabold uppercase tracking-wider text-slate-800">
                    LEMBAGA GETAH MALAYSIA (MALAYSIAN RUBBER BOARD)
                  </div>
                  <div className="text-[11px] font-bold uppercase tracking-tight text-emerald-800 mt-0.5">
                    GLOBAL TESTING & ANALYTICAL CHEMISTRY RESEARCH (G-TACR)
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-950 mt-1 tracking-tight">
                    CERTIFICATE OF ANALYSIS (COA)
                  </h1>
                  <p className="text-[11px] text-slate-600 font-semibold mt-0.5">
                    MS ISO/IEC 17025:2017 Testing Laboratory · SAMM Accreditation No. 008
                  </p>
                </div>

                {/* Right: G-TACR Official SAMM NO. 008 & ILAC-MRA Logo */}
                <div className="shrink-0 flex items-center justify-center bg-white p-1 rounded-lg border border-slate-200 shadow-2xs">
                  <img 
                    src="/assets/aistudio/Logo_G-TACR_fe961507.png" 
                    alt="G-TACR MS ISO/IEC 17025 SAMM NO. 008" 
                    className="h-20 max-w-[145px] object-contain"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4 pt-3 border-t border-slate-200 text-xs font-mono">
                <div>
                  <span className="text-slate-400 block text-[10px]">Certificate No:</span>
                  <span className="font-bold text-slate-900">{sample.coaNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Lab Sample ID:</span>
                  <span className="font-bold text-slate-900">{sample.sampleCode}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Date Issued:</span>
                  <span className="font-semibold text-slate-800">{sample.digitalSignOff?.signedAt.substring(0, 10) || 'Draft'}</span>
                </div>
              </div>
            </div>

            {/* Client & Sampling Information Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs mb-6 pb-6 border-b border-slate-200">
              <div className="space-y-1">
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Client & Customer Particulars:
                </div>
                <div className="font-bold text-sm text-slate-900">{sample.clientName}</div>
                <div className="text-slate-700 font-medium">{sample.clientOrg}</div>
                <div className="text-slate-500 font-mono text-[11px]">{sample.clientEmail}</div>
                <div className="text-slate-500 text-[11px]">Invoice Ref: <span className="font-mono text-slate-700">{sample.invoiceNumber}</span></div>
              </div>

              <div className="space-y-1 sm:text-right">
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Sample & Intake Information:
                </div>
                <div className="font-bold text-slate-900">{sample.sampleName}</div>
                <div className="text-slate-600">Matrix: <span className="font-medium text-slate-800">{sample.sampleMatrix}</span></div>
                <div className="text-slate-500">Date Received: <span className="font-mono">{sample.receivedDate}</span></div>
                <div className="text-slate-500">
                  Receipt Temp: <span className="font-mono font-bold text-emerald-800">{sample.conditionLog.temperature} °C</span> (Intact)
                </div>
              </div>
            </div>

            {/* Test Results Table */}
            <div className="mb-6">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2">
                Analytical Test Results (Accredited Scope)
              </div>
              <div className="border border-slate-300 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Test Parameter</th>
                      <th className="py-2.5 px-3">Approved Standard Method</th>
                      <th className="py-2.5 px-3">Regulatory Limit</th>
                      <th className="py-2.5 px-3">Result</th>
                      <th className="py-2.5 px-3">Uncertainty (± U)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {sample.assignedParameters.map(param => (
                      <tr key={param.parameterId}>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          {param.parameterName}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-700">
                          {param.method}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                          {param.regulatoryLimit || 'N/A'}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900 text-sm">
                          {param.resultValue || '-'} {param.unit}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                          {param.uncertainty}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Legal Statement & Disclaimer */}
            <div className="text-[10px] text-slate-500 leading-normal mb-8 bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
              <p>
                <strong>ISO/IEC 17025 Integrity Attestation:</strong> The results reported herein relate solely to the physical sample item as received and analyzed. This certificate shall not be reproduced except in full without written approval of the testing laboratory.
              </p>
              <p>
                Expanded measurement uncertainty (± U) is expressed at approximately 95% confidence level with coverage factor k = 2.
              </p>
            </div>

            {/* Signatures & Accreditation Seal Block */}
            <div className="pt-4 border-t-2 border-slate-900 grid grid-cols-2 gap-8 items-end">
              
              {/* Analyst signature */}
              <div>
                <div className="font-serif italic text-lg text-slate-800 mb-2 border-b border-slate-400 pb-1">
                  Dr. Hazim Mansur
                </div>
                <div className="text-xs font-bold text-slate-900">Dr. Hazim bin Mansur, CChem MMIC</div>
                <div className="text-[11px] text-slate-500">Senior Analytical Chemist</div>
                <div className="text-[10px] text-slate-400 font-mono">Chemical & Environmental Testing Division</div>
              </div>

              {/* Technical Manager Digital Seal */}
              <div className="text-right">
                {sample.digitalSignOff ? (
                  <div className="inline-block text-left p-3 rounded-xl border border-emerald-300 bg-emerald-50/50">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 mb-1">
                      <Fingerprint className="w-4 h-4 text-emerald-700" />
                      <span>CRYPTOGRAPHIC SIGN-OFF VERIFIED</span>
                    </div>
                    <div className="font-serif italic text-base text-slate-900">
                      Ir. Ts. Dr. Shamsul Othman
                    </div>
                    <div className="text-[11px] font-bold text-slate-900">
                      {sample.digitalSignOff.managerName}
                    </div>
                    <div className="text-[10px] text-slate-600">
                      {sample.digitalSignOff.managerTitle}
                    </div>
                    <div className="font-mono text-[9px] text-slate-500 mt-1">
                      Serial: {sample.digitalSignOff.certificateId}
                    </div>
                    <div className="font-mono text-[8px] text-slate-400 truncate max-w-[200px]">
                      Hash: {sample.digitalSignOff.signatureHash.substring(0, 24)}...
                    </div>
                  </div>
                ) : (
                  <div className="p-3 border-2 border-dashed border-slate-300 rounded-xl text-center text-xs text-slate-400">
                    Awaiting Technical Manager QA Review & Digital Sign-off
                  </div>
                )}
              </div>

            </div>

            {/* Version control banner if Rev01+ */}
            {sample.coaVersion > 0 && (
              <div className="mt-6 pt-3 border-t border-amber-200 text-[11px] text-amber-900 bg-amber-50 p-2.5 rounded-lg flex items-center justify-between">
                <span>
                  <strong>Report Amendment Notice (ISO 17025 Clause 7.8.8):</strong> Version {sample.coaNumber} supersedes all previous issues. Original records are archived in compliance with clause 8.4.
                </span>
                <span className="font-mono font-bold text-amber-800">Version {sample.coaVersion}</span>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
};
