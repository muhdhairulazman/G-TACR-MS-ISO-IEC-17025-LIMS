import React, { useState } from 'react';
import { useLIMS } from '../../context/LIMSContext';
import { Quote, Invoice } from '../../types/lims';
import { RoleRestrictionNotice } from '../common/RoleRestrictionNotice';
import { QuotationModal } from './QuotationModal';
import { 
  Plus, 
  CheckCircle, 
  Clock, 
  FileText, 
  Building2, 
  Printer, 
  Lock, 
  Unlock,
  Check,
  Receipt,
  Eye,
  Scale,
  Sparkles
} from 'lucide-react';

export const FinanceView: React.FC = () => {
  const { 
    quotes, 
    invoices, 
    parameters, 
    createQuote, 
    convertQuoteToInvoice, 
    markInvoiceAsPaid, 
    activeRole 
  } = useLIMS();

  const [activeSubTab, setActiveSubTab] = useState<'invoices' | 'quotes'>('quotes');
  const [showCreateQuoteModal, setShowCreateQuoteModal] = useState(false);
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [viewingQuote, setViewingQuote] = useState<Quote | null>(null);

  // New quote form state
  const [clientName, setClientName] = useState('');
  const [clientOrg, setClientOrg] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [sampleType, setSampleType] = useState('Effluent Raw Latex Processing Water');
  const [sampleMatrix, setSampleMatrix] = useState('Industrial Wastewater (Rubber Matrix)');
  const [selectedParamIds, setSelectedParamIds] = useState<string[]>(['PARAM-PH', 'PARAM-BOD', 'PARAM-COD', 'PARAM-TSS']);
  const [validUntil, setValidUntil] = useState('2026-12-15');
  const [decisionRule, setDecisionRule] = useState('Binary Decision Rule with Guard Band (ILAC-G8:09/2019 w = U)');
  const [sampleVolumeRequired, setSampleVolumeRequired] = useState('2 x 1000 mL Amber glass bottles (PTFE-lined cap) + 1 x 500 mL HDPE');
  const [statementOfConformity, setStatementOfConformity] = useState('Environmental Quality (Industrial Effluent) Regulations 2009 - Standard A');

  // Payment form state
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer (FPX Corporate)');
  const [paymentRef, setPaymentRef] = useState('');

  const isAdmin = activeRole === 'admin';

  const handleToggleParam = (paramId: string) => {
    setSelectedParamIds(prev => 
      prev.includes(paramId) ? prev.filter(id => id !== paramId) : [...prev, paramId]
    );
  };

  const handleApplyPreset = (preset: 'lgm' | 'heavymetals' | 'full') => {
    if (preset === 'lgm') {
      setClientOrg('Malaysian Rubber Board (LGM)');
      setClientName('Ir. Ahmad Zikri');
      setClientEmail('ahmadzikri@lgm.gov.my');
      setClientPhone('+603-6145 1200');
      setSampleType('Effluent Raw Latex Processing Water');
      setSampleMatrix('Industrial Wastewater (Rubber Matrix)');
      setSelectedParamIds(['PARAM-PH', 'PARAM-BOD', 'PARAM-COD', 'PARAM-TSS']);
      setDecisionRule('Binary Decision Rule with Guard Band (ILAC-G8:09/2019 w = U)');
      setStatementOfConformity('Environmental Quality (Industrial Effluent) Regulations 2009 - Standard A');
      setSampleVolumeRequired('2 x 1000 mL Amber glass bottles (PTFE-lined cap) + 1 x 500 mL HDPE');
    } else if (preset === 'heavymetals') {
      setClientOrg('Department of Environment / River Basin Authority');
      setClientName('Dr. Noraini Kassim');
      setClientEmail('noraini@ecowaters.com.my');
      setClientPhone('+603-8946 8800');
      setSampleType('River Basin Heavy Metals Surveillance');
      setSampleMatrix('Surface River Water');
      setSelectedParamIds(['PARAM-PH', 'PARAM-PB', 'PARAM-CD', 'PARAM-AS']);
      setDecisionRule('Binary Decision Rule with Guard Band (ILAC-G8:09/2019 w = U)');
      setStatementOfConformity('National Water Quality Standards (NWQS Class IIA)');
      setSampleVolumeRequired('1 x 1000 mL HNO3 acidified HDPE bottle pH < 2 + 1 x 500 mL unpreserved');
    } else if (preset === 'full') {
      setClientOrg('Apex Glove Technologies Sdn Bhd');
      setClientName('Ts. Mohd Rizal bin Sulaiman');
      setClientEmail('mrizal@apexglove.com');
      setClientPhone('+603-4256 9000');
      setSampleType('Industrial Clarifier Discharge with Oil/Grease');
      setSampleMatrix('Industrial Treated Effluent');
      setSelectedParamIds(['PARAM-PH', 'PARAM-BOD', 'PARAM-COD', 'PARAM-TSS', 'PARAM-OG']);
      setDecisionRule('Simple Acceptance Rule (ILAC-G8:09/2019)');
      setStatementOfConformity('Environmental Quality Regulations 2009 - Standard A/B');
      setSampleVolumeRequired('2 x 1000 mL Amber Glass PTFE-lined + 1 x 500 mL HDPE');
    }
  };

  const calculateQuoteSubtotal = () => {
    return parameters
      .filter(p => selectedParamIds.includes(p.id))
      .reduce((sum, p) => sum + p.defaultPrice, 0);
  };

  const quoteSubtotal = calculateQuoteSubtotal();
  const quoteTax = Math.round(quoteSubtotal * 0.06 * 100) / 100;
  const quoteTotal = Math.round((quoteSubtotal + quoteTax) * 100) / 100;

  const handleCreateQuoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !clientOrg || selectedParamIds.length === 0) return;

    createQuote({
      clientName,
      clientOrg,
      clientEmail,
      clientPhone,
      sampleType,
      sampleMatrix,
      selectedParameterIds: selectedParamIds,
      validUntil,
      decisionRule,
      sampleVolumeRequired,
      statementOfConformity
    });

    // Reset & close
    setClientName('');
    setClientOrg('');
    setClientEmail('');
    setClientPhone('');
    setSelectedParamIds(['PARAM-PH', 'PARAM-BOD', 'PARAM-COD', 'PARAM-TSS']);
    setShowCreateQuoteModal(false);
    setActiveSubTab('quotes');
  };

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingInvoice) return;
    const ref = paymentRef.trim() || `TXN-${Date.now().toString().slice(-6)}`;
    markInvoiceAsPaid(payingInvoice.id, paymentMethod, ref);
    setPayingInvoice(null);
    setPaymentRef('');
  };

  return (
    <div className="space-y-6">

      {/* Role permission check notice */}
      {!isAdmin && (
        <RoleRestrictionNotice
          requiredRoleName="Admin / CS"
          actionName="Finance (Generate Quotes, Invoices & Verify Payments)"
          targetRole="admin"
        />
      )}

      {/* Top Header Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              G-TACR Finance & Contract Review Module
            </h2>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-300">
              SAMM NO. 008 · Clause 7.1
            </span>
          </div>
          <p className="text-xs text-slate-500 max-w-3xl leading-relaxed">
            Testing laboratory quotations per ISO/IEC 17025 must explicitly declare accredited test methods, agreed Decision Rules (ILAC-G8), sample preservation protocols, maximum holding times, and committed 7-day TAT schedules.
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={() => setShowCreateQuoteModal(true)}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create ISO 17025 Quotation</span>
          </button>
        )}
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveSubTab('quotes')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 ${
            activeSubTab === 'quotes'
              ? 'bg-blue-50 text-blue-800 border border-blue-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>ISO 17025 Quotations ({quotes.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('invoices')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 ${
            activeSubTab === 'invoices'
              ? 'bg-blue-50 text-blue-800 border border-blue-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Invoices & Pre-Payment Gating ({invoices.length})</span>
        </button>
      </div>

      {/* Tab: Quotes List (ISO 17025 Compliant) */}
      {activeSubTab === 'quotes' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>G-TACR ISO/IEC 17025 Quotations (SAMM No. 008)</span>
                <span className="text-[10px] font-mono text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded font-semibold">
                  Clause 7.1 Contract Review
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Complete with Decision Rules (ILAC-G8), Chilling/Preservation Protocols, and Expanded Measurement Uncertainty (± U).
              </p>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              {quotes.length} Quotations Available
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Quote No.</th>
                  <th className="py-3 px-4">Client & Organization</th>
                  <th className="py-3 px-4">Sample Type & Matrix</th>
                  <th className="py-3 px-4">Decision Rule (Clause 7.1.3)</th>
                  <th className="py-3 px-4">Total (MYR)</th>
                  <th className="py-3 px-4">Contract Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {quotes.map(quote => (
                  <tr key={quote.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span>{quote.quoteNumber}</span>
                        {quote.quoteNumber === 'QT-2026-0045' && (
                          <span className="text-[10px] bg-blue-100 text-blue-800 font-sans font-semibold px-1.5 py-0.2 rounded">
                            Exemplar
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono block">
                        Valid: {quote.validUntil}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{quote.clientName}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{quote.clientOrg}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 max-w-[200px]">
                      <div className="font-medium text-slate-800 truncate" title={quote.sampleType}>
                        {quote.sampleType}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {quote.sampleMatrix} · {quote.items.length} Parameters
                      </div>
                    </td>

                    <td className="py-3 px-4 max-w-[220px]">
                      <div className="text-[11px] text-slate-700 truncate font-medium flex items-center gap-1" title={quote.decisionRule}>
                        <Scale className="w-3 h-3 text-blue-600 shrink-0" />
                        <span className="truncate">{quote.decisionRule || 'Simple Acceptance Rule'}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        TAT: {quote.tatCommitment || '7 Working Days'}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-slate-900 tabular-nums whitespace-nowrap">
                      MYR {quote.totalAmount.toFixed(2)}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      {quote.status === 'invoiced' ? (
                        <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                          Invoiced
                        </span>
                      ) : quote.status === 'sent' ? (
                        <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                          Sent to Client
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                          Draft Quotation
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setViewingQuote(quote)}
                          className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View ISO 17025 Quote</span>
                        </button>

                        {quote.status !== 'invoiced' ? (
                          <button
                            type="button"
                            onClick={() => {
                              if (isAdmin) {
                                convertQuoteToInvoice(quote.id);
                                setActiveSubTab('invoices');
                              } else {
                                alert('Only Admin / CS can convert quotations to invoices.');
                              }
                            }}
                            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                              isAdmin
                                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            }`}
                          >
                            Convert to Invoice
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-mono">Invoice Created</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Invoices List */}
      {activeSubTab === 'invoices' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Payment Verification & Sample Intake Unlock Gate
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              {invoices.filter(i => i.status === 'unpaid').length} Pending Payment
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Invoice No.</th>
                  <th className="py-3 px-4">Client & Organization</th>
                  <th className="py-3 px-4">Quote Ref</th>
                  <th className="py-3 px-4">Total (MYR)</th>
                  <th className="py-3 px-4">Payment Status</th>
                  <th className="py-3 px-4">Lab Intake Impact</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map(invoice => {
                  const isPaid = invoice.status === 'paid';
                  return (
                    <tr key={invoice.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {invoice.invoiceNumber}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{invoice.clientName}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{invoice.clientOrg}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-600">
                        {invoice.quoteNumber}
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-slate-900 tabular-nums">
                        MYR {invoice.totalAmount.toFixed(2)}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                            <Check className="w-3 h-3 text-emerald-600" /> PAID (Cleared)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded-md">
                            <Clock className="w-3 h-3 text-amber-600" /> UNPAID (Pending)
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-xs whitespace-nowrap">
                        {isPaid ? (
                          <span className="text-emerald-700 flex items-center gap-1 font-medium text-[11px]">
                            <Unlock className="w-3 h-3 text-emerald-600" /> Unlocked (SRO registration open)
                          </span>
                        ) : (
                          <span className="text-rose-700 flex items-center gap-1 font-medium text-[11px]">
                            <Lock className="w-3 h-3 text-rose-600" /> LOCKED (Intake blocked)
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setViewingInvoice(invoice)}
                            className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                          >
                            View Invoice
                          </button>

                          {!isPaid && (
                            <button
                              type="button"
                              onClick={() => {
                                if (isAdmin) {
                                  setPayingInvoice(invoice);
                                } else {
                                  alert('Only Admin / CS can record and verify invoice payments.');
                                }
                              }}
                              className={`px-3 py-1 text-xs font-bold rounded-md transition-colors shadow-xs ${
                                isAdmin
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                              }`}
                              title={isAdmin ? 'Confirm payment receipt' : 'Only Admin/CS can confirm payment'}
                            >
                              Mark as Paid
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Create Quotation with ISO 17025 Clause 7.1 Presets */}
      {showCreateQuoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>Create ISO/IEC 17025:2017 Quotation</span>
                  <span className="text-xs bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded">Clause 7.1</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Laboratory contract review, accredited method selection, and decision rule specification
                </p>
              </div>
              <button 
                onClick={() => setShowCreateQuoteModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateQuoteSubmit} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto">
              
              {/* Quick Template Presets */}
              <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-3">
                <span className="text-[11px] font-bold text-blue-950 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Load ISO 17025 Quotation Presets:</span>
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('lgm')}
                    className="px-2.5 py-1 text-xs font-semibold bg-white hover:bg-blue-100 text-blue-900 rounded-lg border border-blue-300 transition-colors shadow-2xs"
                  >
                    1. Malaysian Rubber Board Effluent (Standard A)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('heavymetals')}
                    className="px-2.5 py-1 text-xs font-semibold bg-white hover:bg-blue-100 text-blue-900 rounded-lg border border-blue-300 transition-colors shadow-2xs"
                  >
                    2. River Basin Heavy Metals Surveillance (USEPA 6010D)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('full')}
                    className="px-2.5 py-1 text-xs font-semibold bg-white hover:bg-blue-100 text-blue-900 rounded-lg border border-blue-300 transition-colors shadow-2xs"
                  >
                    3. Manufacturing Effluent Discharge & Oil/Grease
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Client Representative / Contact Person <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ir. Ahmad Zikri"
                    value={clientName}
                    onChange={e => setClientName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Organization / Agency / Company <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Malaysian Rubber Board (LGM)"
                    value={clientOrg}
                    onChange={e => setClientOrg(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Official Email
                  </label>
                  <input
                    type="email"
                    placeholder="contact@agency.gov.my"
                    value={clientEmail}
                    onChange={e => setClientEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="+603-xxxx xxxx"
                    value={clientPhone}
                    onChange={e => setClientPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Sample Description
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Industrial Clarifier Discharge"
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
                    <option value="Industrial Wastewater (Rubber Matrix)">Industrial Wastewater (Rubber Matrix)</option>
                    <option value="Industrial Wastewater">Industrial Wastewater (General Effluent)</option>
                    <option value="Surface River Water">Surface River Water</option>
                    <option value="Potable Raw Water">Potable Raw Water</option>
                    <option value="Groundwater / Runoff">Groundwater / Runoff</option>
                  </select>
                </div>
              </div>

              {/* ISO 17025 Clause 7.1.3 Decision Rule & Conformity */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-blue-600" />
                  <span>Clause 7.1.3: Conformity Assessment Decision Rule Specification</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Agreed Decision Rule
                    </label>
                    <select
                      value={decisionRule}
                      onChange={e => setDecisionRule(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md bg-white text-xs focus:outline-hidden"
                    >
                      <option value="Binary Decision Rule with Guard Band (ILAC-G8:09/2019 w = U)">
                        Binary Decision Rule with Guard Band (ILAC-G8:09/2019 w = U)
                      </option>
                      <option value="Simple Acceptance Rule (Based on ILAC-G8:09/2019)">
                        Simple Acceptance Rule (Shared Risk)
                      </option>
                      <option value="Non-Binary with Expanded Uncertainty (ISO 10576-1)">
                        Non-Binary with Expanded Uncertainty (ISO 10576-1)
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Conformity Benchmark / Regulatory Standard
                    </label>
                    <input
                      type="text"
                      value={statementOfConformity}
                      onChange={e => setStatementOfConformity(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md bg-white text-xs focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Sample Volume & Container Requirements (Clause 7.4)
                  </label>
                  <input
                    type="text"
                    value={sampleVolumeRequired}
                    onChange={e => setSampleVolumeRequired(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md bg-white text-xs focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Parameter Selection Checklist */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Select Laboratory Test Parameters (Accredited Scope) <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border border-slate-200 rounded-xl p-3 bg-slate-50/50 max-h-48 overflow-y-auto">
                  {parameters.map(param => {
                    const isSelected = selectedParamIds.includes(param.id);
                    return (
                      <label 
                        key={param.id}
                        className={`flex items-start gap-2.5 p-2 rounded-lg border cursor-pointer transition-colors ${
                          isSelected ? 'bg-blue-50 border-blue-300' : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleParam(param.id)}
                          className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900">{param.code}</span>
                            <span className="text-xs font-mono font-semibold text-slate-700">MYR {param.defaultPrice.toFixed(2)}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 truncate">{param.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{param.method} · {param.uncertaintyEstimate}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Pricing calculation summary */}
              <div className="bg-slate-100 p-4 rounded-xl space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Selected Parameters:</span>
                  <span className="font-semibold">{selectedParamIds.length} accredited tests</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-mono font-semibold">MYR {quoteSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Service Tax (SST 6%):</span>
                  <span className="font-mono font-semibold">MYR {quoteTax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-900 font-bold border-t border-slate-200 pt-1.5 text-sm">
                  <span>Total Quotation Amount:</span>
                  <span className="font-mono text-blue-700">MYR {quoteTotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateQuoteModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={selectedParamIds.length === 0}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-50 rounded-lg shadow-xs"
                >
                  Generate ISO 17025 Quotation
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Modal: Mark as Paid */}
      {payingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Confirm Payment Receipt
                </h3>
                <p className="text-xs text-slate-500">
                  Invoice Ref: <span className="font-mono font-bold text-slate-800">{payingInvoice.invoiceNumber}</span>
                </p>
              </div>
            </div>

            <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3 mb-4 text-xs text-emerald-900">
              <p className="font-semibold">Laboratory Intake Impact:</p>
              <p className="text-[11px] text-emerald-800 mt-0.5">
                Per pre-payment gating rules, confirming this payment will <strong>automatically unlock sample intake registration</strong> for SRO officers.
              </p>
            </div>

            <form onSubmit={handleConfirmPayment} className="space-y-4">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                <div className="flex justify-between mb-1">
                  <span className="text-slate-500">Client:</span>
                  <span className="font-semibold text-slate-900">{payingInvoice.clientName}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-500">Organization:</span>
                  <span className="font-semibold text-slate-900">{payingInvoice.clientOrg}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200">
                  <span>Amount Due:</span>
                  <span className="font-mono text-emerald-700 text-sm">MYR {payingInvoice.totalAmount.toFixed(2)}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-hidden bg-white"
                >
                  <option value="Bank Transfer (FPX Corporate)">Bank Transfer (FPX Corporate / Maybank2E / CIMB Biz)</option>
                  <option value="Direct Debit EFT">Direct Debit EFT</option>
                  <option value="Government EFT Warrant">Government EFT Warrant</option>
                  <option value="Cheque / Crossed Bank Draft">Cheque / Crossed Bank Draft</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Transaction / Receipt Reference
                </label>
                <input
                  type="text"
                  placeholder="e.g. FPX-20261111-99238"
                  value={paymentRef}
                  onChange={e => setPaymentRef(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-hidden font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPayingInvoice(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs"
                >
                  Confirm & Unlock Intake
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View Itemized Invoice */}
      {viewingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-slate-200 pb-4 mb-4">
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-blue-700">
                  OFFICIAL LABORATORY SERVICES INVOICE
                </div>
                <h3 className="text-xl font-bold font-mono text-slate-900 mt-0.5">
                  {viewingInvoice.invoiceNumber}
                </h3>
                <p className="text-xs text-slate-500">
                  Issued: {viewingInvoice.createdAt}
                </p>
              </div>
              <div className="text-right">
                {viewingInvoice.status === 'paid' ? (
                  <div className="inline-block border-2 border-emerald-600 text-emerald-600 font-bold font-mono px-3 py-1 rounded-lg uppercase tracking-wider text-xs rotate-[-3deg]">
                    ✓ PAID / CLEARED
                  </div>
                ) : (
                  <div className="inline-block border-2 border-amber-600 text-amber-600 font-bold font-mono px-3 py-1 rounded-lg uppercase tracking-wider text-xs">
                    UNPAID / PENDING
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div>
                <div className="font-bold text-slate-500 uppercase text-[10px] mb-1">Billed To (Client):</div>
                <div className="font-bold text-slate-900">{viewingInvoice.clientName}</div>
                <div className="text-slate-600">{viewingInvoice.clientOrg}</div>
                <div className="text-slate-500 font-mono text-[11px]">{viewingInvoice.clientEmail}</div>
              </div>
              <div>
                <div className="font-bold text-slate-500 uppercase text-[10px] mb-1">Invoice Particulars:</div>
                <div><span className="text-slate-500">Quote Ref:</span> <span className="font-mono font-semibold">{viewingInvoice.quoteNumber}</span></div>
                {viewingInvoice.paymentDate && (
                  <div><span className="text-slate-500">Payment Date:</span> <span className="font-mono text-emerald-700">{viewingInvoice.paymentDate}</span></div>
                )}
                {viewingInvoice.paymentRef && (
                  <div><span className="text-slate-500">Receipt Ref:</span> <span className="font-mono font-semibold">{viewingInvoice.paymentRef}</span></div>
                )}
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden mb-6">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-bold uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Service Description</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-800">ISO/IEC 17025 Multi-Parameter Test Package</div>
                      <div className="text-[11px] text-slate-500">Contract reference quotation {viewingInvoice.quoteNumber}</div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold">
                      MYR {(viewingInvoice.totalAmount / 1.06).toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-slate-500 text-[11px]">Service Tax (SST 6%)</td>
                    <td className="py-2 px-3 text-right font-mono text-slate-600 text-[11px]">
                      MYR {(viewingInvoice.totalAmount - (viewingInvoice.totalAmount / 1.06)).toFixed(2)}
                    </td>
                  </tr>
                  <tr className="bg-slate-50/80 font-bold text-slate-900">
                    <td className="py-2.5 px-3 text-sm">Total Amount Due</td>
                    <td className="py-2.5 px-3 text-right font-mono text-blue-700 text-sm">
                      MYR {viewingInvoice.totalAmount.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-[11px] text-slate-400">
                ISO/IEC 17025 Pre-Testing Commercial Gate Compliance
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Invoice
                </button>
                <button
                  type="button"
                  onClick={() => setViewingInvoice(null)}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Official ISO 17025 Quotation Modal */}
      <QuotationModal
        quote={viewingQuote}
        onClose={() => setViewingQuote(null)}
        onConvertToInvoice={convertQuoteToInvoice}
      />

    </div>
  );
};
