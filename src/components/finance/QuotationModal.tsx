import React, { useState } from 'react';
import { Quote } from '../../types/lims';
import { useLIMS } from '../../context/LIMSContext';
import { 
  Download, 
  Printer, 
  ShieldCheck, 
  CheckCircle, 
  Scale, 
  ArrowRight
} from 'lucide-react';

interface QuotationModalProps {
  quote: Quote | null;
  onClose: () => void;
  onConvertToInvoice?: (quoteId: string) => void;
}

export const QuotationModal: React.FC<QuotationModalProps> = ({
  quote,
  onClose,
  onConvertToInvoice
}) => {
  const { activeRole } = useLIMS();
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!quote) return null;

  const isAdmin = activeRole === 'admin';

  const handleSimulateExport = () => {
    const content = `
========================================================================
    G-TACR OFFICIAL TESTING SERVICES QUOTATION & CONTRACT REVIEW
     GLOBAL TESTING & ANALYTICAL CHEMISTRY RESEARCH (MALAYSIAN RUBBER BOARD)
               MS ISO/IEC 17025:2017 ACCREDITED TESTING LABORATORY
        (Skim Akreditasi Makmal Malaysia - SAMM Accreditation No. 008)
========================================================================
Quotation Reference / Quote No : ${quote.quoteNumber}
Date Issued                    : ${quote.createdAt}
Valid Until                    : ${quote.validUntil}
Contract Status                : ${quote.status.toUpperCase()}

1. CUSTOMER & APPLICANT PARTICULARS
------------------------------------------------------------------------
Contact Person / Officer       : ${quote.clientName}
Organization / Agency          : ${quote.clientOrg}
Official Email                 : ${quote.clientEmail}
Phone Number                   : ${quote.clientPhone}

2. SAMPLE IDENTIFICATION & MATRIX
------------------------------------------------------------------------
Sample Category                : ${quote.sampleType}
Testing Matrix                 : ${quote.sampleMatrix}
Conformity Benchmark           : ${quote.statementOfConformity || 'Industrial Effluent Regulations 2009 - Standard A'}

3. ACCREDITED TEST PARAMETERS, METHODS & PRICING
------------------------------------------------------------------------
Parameter          | Standard Method  | Regulatory Limit| Uncertainty (±U)  | Price (MYR)
------------------------------------------------------------------------
${quote.items.map(item => 
  `${item.parameterName.padEnd(18)} | ${item.method.padEnd(16)} | ${(item.standardLimit || 'N/A').padEnd(15)} | ${(item.uncertaintyEstimate || 'N/A').padEnd(17)} | MYR ${item.price.toFixed(2)}`
).join('\n')}

Subtotal                       : MYR ${quote.subtotal.toFixed(2)}
Service Tax (SST 6%)           : MYR ${quote.tax.toFixed(2)}
Total Quotation Amount         : MYR ${quote.totalAmount.toFixed(2)}

4. MANDATORY ISO/IEC 17025:2017 CONTRACT TERMS (CLAUSE 7.1)
------------------------------------------------------------------------
a) DECISION RULE SPECIFICATION (CLAUSE 7.1.3):
   ${quote.decisionRule || 'Binary Decision Rule with Guard Band (ILAC-G8:09/2019 w = U)'}

b) SAMPLE CONTAINER & MINIMUM VOLUME (CLAUSE 7.4):
   ${quote.sampleVolumeRequired || '2 x 1000 mL Amber glass bottles (PTFE-lined cap) + 1 x 500 mL HDPE.'}

c) PRESERVATION & CHILLING PROTOCOL:
   ${quote.preservationRequirement || 'Chilled at 2°C - 6°C in transit cooler box with ice packs.'}

d) MAXIMUM HOLDING TIMES:
   ${quote.holdingTime || 'BOD: ≤ 48 hrs; pH: ≤ 24 hrs; TSS: ≤ 7 days; COD: ≤ 28 days.'}

e) COMMITTED TURN-AROUND TIME (TAT):
   ${quote.tatCommitment || 'Standard 7 Working Days (Countdown begins upon sample receipt & payment confirmation).'}

f) SUBCONTRACTING POLICY (CLAUSE 6.6):
   ${quote.subcontractingPolicy || '100% tested in-house at G-TACR under SAMM No. 008 scope without external subcontracting.'}

------------------------------------------------------------------------
5. LABORATORY ATTESTATION & CLIENT ACCEPTANCE
------------------------------------------------------------------------
Prepared By : ${quote.preparedBy || 'Zulaikha binti Ariffin (Commercial & CS Executive)'}
Reviewed By : ${quote.reviewedBy || 'Ir. Ts. Dr. Shamsul bin Othman, FMIC (Technical Manager)'}

Customer Acceptance:
By endorsing below, the customer formally agrees to the standard test methods,
decision rules, pricing, and ISO 17025 pre-payment gating terms:

Customer Signature   : _______________________
Name & Designation   : ${quote.clientName}
Date of Endorsement  : _______________________
========================================================================
`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${quote.quoteNumber}_ISO17025_Quotation.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto no-print">
      <div className="bg-white rounded-2xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col my-auto max-h-[94vh]">
        
        {/* Top Control Bar */}
        <div className="px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <div>
              <span className="text-xs font-bold tracking-tight text-white block">
                G-TACR Official ISO/IEC 17025 Quotation (Clause 7.1 Contract Review)
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {quote.quoteNumber} · SAMM Laboratory Accreditation No. 008 (LGM)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSimulateExport}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 border border-slate-700"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>Export Quotation (TXT/PDF)</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 border border-slate-700"
            >
              <Printer className="w-3.5 h-3.5 text-slate-300" />
              <span className="hidden sm:inline">Print</span>
            </button>

            {quote.status !== 'invoiced' && isAdmin && onConvertToInvoice && (
              <button
                type="button"
                onClick={() => {
                  onConvertToInvoice(quote.id);
                  onClose();
                }}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <span>Convert to Invoice</span>
                <ArrowRight className="w-3.5 h-3.5" />
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

        {downloadSuccess && (
          <div className="bg-blue-600 text-white text-xs font-semibold px-4 py-2 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>Official Quotation Document ({quote.quoteNumber}) exported successfully!</span>
          </div>
        )}

        {/* Printable Canvas */}
        <div className="p-6 sm:p-10 overflow-y-auto bg-slate-100/60 print-container">
          <div className="max-w-3xl mx-auto bg-white border border-slate-300 shadow-sm rounded-xl p-8 sm:p-12 text-slate-900 font-sans relative">
            
            {/* Header Letterhead */}
            <div className="border-b-2 border-slate-900 pb-5 mb-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Left: LGM Official Emblem */}
                <div className="shrink-0 flex items-center justify-center">
                  <img 
                    src="/assets/aistudio/Logo_LGM_wo_BG_90314aa6.png" 
                    alt="Lembaga Getah Malaysia (LGM)" 
                    className="h-16 w-16 object-contain"
                  />
                </div>

                {/* Center: Official Title */}
                <div className="text-center flex-1 px-2">
                  <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-800">
                    LEMBAGA GETAH MALAYSIA (MALAYSIAN RUBBER BOARD)
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-tight text-emerald-800 mt-0.5">
                    GLOBAL TESTING & ANALYTICAL CHEMISTRY RESEARCH (G-TACR)
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-950 mt-1 tracking-tight">
                    OFFICIAL QUOTATION & CONTRACT REVIEW
                  </h1>
                  <p className="text-[11px] text-slate-600 font-semibold mt-0.5">
                    MS ISO/IEC 17025:2017 Clause 7.1 · SAMM Accreditation No. 008
                  </p>
                </div>

                {/* Right: G-TACR SAMM NO. 008 Logo */}
                <div className="shrink-0 flex items-center justify-center bg-white p-1 rounded-lg border border-slate-200 shadow-2xs">
                  <img 
                    src="/assets/aistudio/Logo_G-TACR_fe961507.png" 
                    alt="G-TACR SAMM NO. 008" 
                    className="h-16 max-w-[130px] object-contain"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-slate-200 text-xs font-mono">
                <div>
                  <span className="text-slate-400 block text-[10px]">Quote Reference:</span>
                  <span className="font-bold text-slate-900">{quote.quoteNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Date Issued:</span>
                  <span className="font-semibold text-slate-800">{quote.createdAt.substring(0, 10)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Valid Until:</span>
                  <span className="font-semibold text-slate-800">{quote.validUntil}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Status:</span>
                  <span className="font-bold uppercase text-blue-700">{quote.status}</span>
                </div>
              </div>
            </div>

            {/* Customer & Sample Matrix Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs mb-6 pb-6 border-b border-slate-200">
              <div className="space-y-1">
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Customer & Applicant Details:
                </div>
                <div className="font-bold text-sm text-slate-900">{quote.clientName}</div>
                <div className="text-slate-700 font-medium">{quote.clientOrg}</div>
                <div className="text-slate-500 font-mono text-[11px]">{quote.clientEmail} · {quote.clientPhone}</div>
              </div>

              <div className="space-y-1 sm:text-right">
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Sample Description & Specification:
                </div>
                <div className="font-bold text-slate-900">{quote.sampleType}</div>
                <div className="text-slate-600">Matrix: <span className="font-medium text-slate-800">{quote.sampleMatrix}</span></div>
                <div className="text-slate-500">
                  Regulatory Benchmark: <span className="font-semibold text-blue-900">{quote.statementOfConformity || 'Industrial Effluent Regulations 2009 - Standard A'}</span>
                </div>
              </div>
            </div>

            {/* Parameter & Test Methods Table */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Accredited Test Parameters, Standard Methods & Estimated Uncertainty
                </span>
                <span className="text-[10px] font-mono text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                  SAMM NO. 008 Accredited
                </span>
              </div>

              <div className="border border-slate-300 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Test Parameter</th>
                      <th className="py-2.5 px-3">Standard Method</th>
                      <th className="py-2.5 px-3">Regulatory Limit</th>
                      <th className="py-2.5 px-3">Uncertainty (± U)</th>
                      <th className="py-2.5 px-3 text-right">Price (MYR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {quote.items.map(item => (
                      <tr key={item.parameterId}>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          {item.parameterName}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-700">
                          {item.method}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                          {item.standardLimit || 'N/A'}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                          {item.uncertaintyEstimate || 'Estimated (k=2)'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                          MYR {item.price.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-slate-50/70">
                      <td colSpan={4} className="py-2 px-3 text-right text-slate-600 font-medium">Subtotal:</td>
                      <td className="py-2 px-3 text-right font-mono font-semibold">MYR {quote.subtotal.toFixed(2)}</td>
                    </tr>
                    <tr className="bg-slate-50/70">
                      <td colSpan={4} className="py-2 px-3 text-right text-slate-600 font-medium">Service Tax (SST 6%):</td>
                      <td className="py-2 px-3 text-right font-mono font-semibold">MYR {quote.tax.toFixed(2)}</td>
                    </tr>
                    <tr className="bg-blue-50/40 font-bold text-slate-900 border-t border-slate-300">
                      <td colSpan={4} className="py-2.5 px-3 text-right text-sm">Total Quotation:</td>
                      <td className="py-2.5 px-3 text-right font-mono text-blue-900 text-sm">MYR {quote.totalAmount.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* ISO 17025 Clause 7.1 Contract Terms Box */}
            <div className="space-y-3 mb-8 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5 border-b border-slate-200 pb-2">
                <Scale className="w-4 h-4 text-blue-700" />
                <span>Mandatory Contractual Terms & Declarations (ISO/IEC 17025:2017)</span>
              </div>

              {/* Decision Rule (Clause 7.1.3) */}
              <div className="space-y-0.5">
                <span className="font-bold text-slate-800 flex items-center gap-1">
                  <span>1. Decision Rule for Statements of Conformity (Clause 7.1.3):</span>
                </span>
                <p className="text-slate-600 text-[11px] leading-relaxed pl-3 border-l-2 border-blue-400">
                  {quote.decisionRule || 'Binary Decision Rule with Guard Band (ILAC-G8:09/2019 w = U): Acceptance requires measured value plus expanded uncertainty to remain within regulatory threshold.'}
                </p>
              </div>

              {/* Sample Requirements & Holding Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="font-bold text-slate-800 block text-[11px]">2. Sample Container & Volume Requirements (Clause 7.4):</span>
                  <p className="text-slate-600 text-[11px]">{quote.sampleVolumeRequired || '2 x 1000 mL Amber glass bottles (PTFE-lined cap) + 1 x 500 mL HDPE.'}</p>
                </div>
                <div>
                  <span className="font-bold text-slate-800 block text-[11px]">3. Sample Preservation & Chilling Protocol:</span>
                  <p className="text-slate-600 text-[11px]">{quote.preservationRequirement || 'Chilled at 2°C - 6°C in insulated cooler box during transit.'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="font-bold text-slate-800 block text-[11px]">4. Maximum Sample Holding Times:</span>
                  <p className="text-slate-600 text-[11px] font-mono">{quote.holdingTime || 'BOD: ≤ 48 hrs; pH: ≤ 24 hrs; TSS: ≤ 7 days; COD: ≤ 28 days.'}</p>
                </div>
                <div>
                  <span className="font-bold text-slate-800 block text-[11px]">5. Turn-Around Time (TAT) Commitment:</span>
                  <p className="text-slate-600 text-[11px]">{quote.tatCommitment || 'Standard 7 Working Days (Commences upon sample acceptance and payment clearance).'}</p>
                </div>
              </div>

              {/* Subcontracting Policy (Clause 6.6) */}
              <div className="pt-1">
                <span className="font-bold text-slate-800 block text-[11px]">6. Subcontracting Policy (Clause 6.6):</span>
                <p className="text-slate-600 text-[11px]">{quote.subcontractingPolicy || 'All parameters performed 100% in-house at G-TACR under SAMM Accreditation No. 008 with no external subcontracting.'}</p>
              </div>
            </div>

            {/* Acceptance Sign-Off Block */}
            <div className="pt-4 border-t-2 border-slate-900 grid grid-cols-2 gap-8 items-end text-xs">
              
              {/* Lab Officer */}
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Laboratory Attestation:</div>
                <div className="font-serif italic text-base text-slate-900 pb-1 mb-1 border-b border-slate-300">
                  {quote.preparedBy?.split(' ')[0] || 'Zulaikha Ariffin'}
                </div>
                <div className="font-bold text-slate-900">{quote.preparedBy || 'Zulaikha binti Ariffin'}</div>
                <div className="text-[10px] text-slate-500">Commercial & Customer Service Executive</div>
                <div className="text-[10px] text-slate-400">Technical Endorsement: {quote.reviewedBy || 'Ir. Ts. Dr. Shamsul bin Othman, FMIC'}</div>
              </div>

              {/* Customer Agreement Sign-Off */}
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Customer Acceptance & Endorsement:</div>
                <div className="border-b border-slate-300 pb-6 mb-1 text-slate-300 text-center italic text-[11px]">
                  (Authorized Signature & Company Stamp)
                </div>
                <div className="font-bold text-slate-900">{quote.clientName}</div>
                <div className="text-[10px] text-slate-500">{quote.clientOrg}</div>
                <div className="text-[10px] text-slate-400">Date of Acceptance: ____________________</div>
              </div>

            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
