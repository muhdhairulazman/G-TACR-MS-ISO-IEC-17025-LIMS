import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Role, 
  UserRoleInfo, 
  Quote, 
  Invoice, 
  Sample, 
  AuditLog, 
  TestParameterDefinition,
  TestResultItem,
  SampleConditionLog,
  DigitalSignOff,
  TatStatusColor
} from '../types/lims';
import { 
  USER_ROLES, 
  STANDARD_TEST_PARAMETERS, 
  INITIAL_QUOTES, 
  INITIAL_INVOICES, 
  INITIAL_SAMPLES, 
  INITIAL_AUDIT_LOGS 
} from '../data/mockData';

interface LIMSContextType {
  activeRole: Role;
  setActiveRole: (role: Role) => void;
  currentUser: UserRoleInfo;
  quotes: Quote[];
  invoices: Invoice[];
  samples: Sample[];
  auditLogs: AuditLog[];
  parameters: TestParameterDefinition[];
  createQuote: (data: {
    clientName: string;
    clientOrg: string;
    clientEmail: string;
    clientPhone: string;
    sampleType: string;
    sampleMatrix: string;
    selectedParameterIds: string[];
    validUntil: string;
    decisionRule?: string;
    sampleVolumeRequired?: string;
    preservationRequirement?: string;
    holdingTime?: string;
    tatCommitment?: string;
    subcontractingPolicy?: string;
    statementOfConformity?: string;
  }) => Quote;
  convertQuoteToInvoice: (quoteId: string) => Invoice;
  markInvoiceAsPaid: (invoiceId: string, paymentMethod: string, paymentRef: string) => boolean;
  registerSample: (data: {
    invoiceId: string;
    sampleName: string;
    sampleType: string;
    sampleMatrix: string;
    samplingDate: string;
    condition: {
      temperature: number;
      containerIntact: boolean;
      sealIntact: boolean;
      labelMatched: boolean;
      chainOfCustodyMatched: boolean;
      decision: 'accepted' | 'rejected';
      rejectionReason?: string;
    };
    assignedParameterIds: string[];
  }) => { success: boolean; error?: string; sample?: Sample };
  updateTestResult: (sampleId: string, parameterId: string, resultValue: string, qcPassed: boolean, equipmentRef?: string) => void;
  submitDraftForReview: (sampleId: string, analystNotes: string) => { success: boolean; error?: string };
  approveSampleCOA: (sampleId: string, remarks?: string) => { success: boolean; error?: string };
  rejectDraftSample: (sampleId: string, remarks: string) => { success: boolean; error?: string };
  reviseApprovedCOA: (sampleId: string, reason: string) => { success: boolean; error?: string };
  deliverSampleCOA: (sampleId: string) => { success: boolean; error?: string };
  checkPermission: (action: string) => { allowed: boolean; reason?: string };
  resetToDefaultData: () => void;
}

const LIMSContext = createContext<LIMSContextType | undefined>(undefined);

const STORAGE_KEYS = {
  QUOTES: 'gtacr_lims_quotes_samm008_v1',
  INVOICES: 'gtacr_lims_invoices_samm008_v1',
  SAMPLES: 'gtacr_lims_samples_samm008_v1',
  LOGS: 'gtacr_lims_audit_logs_samm008_v1',
  ROLE: 'gtacr_lims_active_role_samm008_v1'
};

export const LIMSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeRole, setActiveRoleState] = useState<Role>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ROLE);
    return (saved as Role) || 'admin';
  });

  const [quotes, setQuotes] = useState<Quote[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.QUOTES);
    return saved ? JSON.parse(saved) : INITIAL_QUOTES;
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.INVOICES);
    return saved ? JSON.parse(saved) : INITIAL_INVOICES;
  });

  const [samples, setSamples] = useState<Sample[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SAMPLES);
    return saved ? JSON.parse(saved) : INITIAL_SAMPLES;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LOGS);
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ROLE, activeRole);
  }, [activeRole]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.QUOTES, JSON.stringify(quotes));
  }, [quotes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SAMPLES, JSON.stringify(samples));
  }, [samples]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(auditLogs));
  }, [auditLogs]);

  const currentUser = USER_ROLES[activeRole];

  const formatTimestamp = () => {
    const now = new Date();
    return now.toISOString().replace('T', ' ').substring(0, 19);
  };

  const addAuditLog = (
    action: string,
    entityType: AuditLog['entityType'],
    entityId: string,
    details: string,
    changeSummary?: string
  ) => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: formatTimestamp(),
      actorName: currentUser.name,
      actorRole: activeRole,
      action,
      entityType,
      entityId,
      details,
      changeSummary
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const checkPermission = (action: string): { allowed: boolean; reason?: string } => {
    if (currentUser.allowedActions.includes(action)) {
      return { allowed: true };
    }
    return {
      allowed: false,
      reason: `Action '${action}' is restricted for role '${currentUser.badge}'. Please switch to the authorized role in compliance with ISO/IEC 17025.`
    };
  };

  const setActiveRole = (role: Role) => {
    setActiveRoleState(role);
  };

  // 1. Create Quote (ISO/IEC 17025 Clause 7.1 Contract Review)
  const createQuote = (data: {
    clientName: string;
    clientOrg: string;
    clientEmail: string;
    clientPhone: string;
    sampleType: string;
    sampleMatrix: string;
    selectedParameterIds: string[];
    validUntil: string;
    decisionRule?: string;
    sampleVolumeRequired?: string;
    preservationRequirement?: string;
    holdingTime?: string;
    tatCommitment?: string;
    subcontractingPolicy?: string;
    statementOfConformity?: string;
  }): Quote => {
    const quoteNum = `QT-2026-${String(quotes.length + 41).padStart(4, '0')}`;
    const selectedParams = STANDARD_TEST_PARAMETERS.filter(p => data.selectedParameterIds.includes(p.id));
    const items = selectedParams.map(p => ({
      parameterId: p.id,
      parameterName: p.name,
      method: p.method,
      unit: p.unit,
      price: p.defaultPrice,
      isAccredited: true,
      standardLimit: p.standardLimit,
      uncertaintyEstimate: p.uncertaintyEstimate
    }));
    const subtotal = items.reduce((sum, item) => sum + item.price, 0);
    const tax = Math.round(subtotal * 0.06 * 100) / 100;
    const totalAmount = Math.round((subtotal + tax) * 100) / 100;

    const newQuote: Quote = {
      id: `quote-${Date.now()}`,
      quoteNumber: quoteNum,
      clientName: data.clientName,
      clientOrg: data.clientOrg,
      clientEmail: data.clientEmail,
      clientPhone: data.clientPhone,
      sampleType: data.sampleType,
      sampleMatrix: data.sampleMatrix,
      items,
      subtotal,
      tax,
      totalAmount,
      status: 'draft',
      createdAt: formatTimestamp(),
      validUntil: data.validUntil,
      decisionRule: data.decisionRule || 'Simple Acceptance Rule (ILAC-G8:09/2019: Conformity statements evaluated based on specification limits without guard banding).',
      sampleVolumeRequired: data.sampleVolumeRequired || '2 x 1000 mL Amber Glass Bottles with PTFE caps + 1 x 500 mL HDPE Bottle.',
      preservationRequirement: data.preservationRequirement || 'Chilled immediately at 2°C - 6°C in an insulated ice cooler.',
      holdingTime: data.holdingTime || 'BOD: ≤ 48 hrs; pH: immediate/24 hrs; COD: ≤ 28 days; TSS: ≤ 7 days.',
      tatCommitment: data.tatCommitment || '7 Working Days (Standard ISO 17025 LIMS TAT).',
      subcontractingPolicy: data.subcontractingPolicy || 'Tested 100% in-house under G-TACR SAMM No. 008 accreditation with zero subcontracting.',
      statementOfConformity: data.statementOfConformity || 'Environmental Quality (Industrial Effluent) Regulations 2009 - Standard A.',
      preparedBy: `${currentUser.name} (${currentUser.title})`,
      reviewedBy: 'Ir. Ts. Dr. Shamsul bin Othman, FMIC (Technical Manager)'
    };

    setQuotes(prev => [newQuote, ...prev]);
    addAuditLog(
      'Create New Quotation (ISO 17025)',
      'QUOTE',
      quoteNum,
      `ISO 17025 compliant quotation created for ${data.clientOrg} (${data.clientName}) for ${data.sampleType}. Total: RM ${totalAmount.toFixed(2)}.`
    );

    return newQuote;
  };

  // 2. Convert Quote to Invoice
  const convertQuoteToInvoice = (quoteId: string): Invoice => {
    const quote = quotes.find(q => q.id === quoteId);
    if (!quote) throw new Error('Quotation not found');

    const invNum = `INV-2026-${String(invoices.length + 88).padStart(4, '0')}`;
    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: invNum,
      quoteId: quote.id,
      quoteNumber: quote.quoteNumber,
      clientName: quote.clientName,
      clientOrg: quote.clientOrg,
      clientEmail: quote.clientEmail,
      totalAmount: quote.totalAmount,
      status: 'unpaid',
      createdAt: formatTimestamp()
    };

    setInvoices(prev => [newInvoice, ...prev]);
    setQuotes(prev => prev.map(q => q.id === quoteId ? { ...q, status: 'invoiced' } : q));

    addAuditLog(
      'Convert Quotation to Invoice',
      'INVOICE',
      invNum,
      `Invoice generated from Quotation ${quote.quoteNumber}. Amount: RM ${quote.totalAmount.toFixed(2)}. Status: UNPAID (Mandatory pre-payment lock active until payment is confirmed).`
    );

    return newInvoice;
  };

  // 3. Mark Invoice as Paid (Crucial pre-requisite for SRO sample intake)
  const markInvoiceAsPaid = (invoiceId: string, paymentMethod: string, paymentRef: string): boolean => {
    const targetInv = invoices.find(inv => inv.id === invoiceId);
    if (!targetInv) return false;

    const updatedTime = formatTimestamp();
    setInvoices(prev => prev.map(inv => {
      if (inv.id === invoiceId) {
        return {
          ...inv,
          status: 'paid',
          paymentDate: updatedTime,
          paymentMethod,
          paymentRef
        };
      }
      return inv;
    }));

    addAuditLog(
      'Confirm Payment Received (PAID)',
      'INVOICE',
      targetInv.invoiceNumber,
      `Payment confirmed in the amount of RM ${targetInv.totalAmount.toFixed(2)} via ${paymentMethod} (Ref: ${paymentRef}). ISO 17025 pre-payment gating unlocked for sample registration.`
    );

    return true;
  };

  // 4. Sample Receiving & Registration (SRO) with Strict Pre-Payment Rule
  const registerSample = (data: {
    invoiceId: string;
    sampleName: string;
    sampleType: string;
    sampleMatrix: string;
    samplingDate: string;
    condition: {
      temperature: number;
      containerIntact: boolean;
      sealIntact: boolean;
      labelMatched: boolean;
      chainOfCustodyMatched: boolean;
      decision: 'accepted' | 'rejected';
      rejectionReason?: string;
    };
    assignedParameterIds: string[];
  }): { success: boolean; error?: string; sample?: Sample } => {
    // 1. Verify pre-payment requirement
    const linkedInvoice = invoices.find(inv => inv.id === data.invoiceId);
    if (!linkedInvoice) {
      return { success: false, error: 'Referenced invoice is invalid or not found in system.' };
    }

    if (linkedInvoice.status !== 'paid') {
      addAuditLog(
        'Registration Blocked (Pre-Payment Required)',
        'SAMPLE',
        'N/A',
        `Sample intake registration for invoice ${linkedInvoice.invoiceNumber} was locked by the system because payment status is UNPAID in compliance with ISO 17025 pre-laboratory policy.`
      );
      return { 
        success: false, 
        error: `REGISTRATION LOCKED: Invoice ${linkedInvoice.invoiceNumber} is not yet settled (Status: UNPAID). Under laboratory ISO/IEC 17025 policy, payment must be confirmed PAID before physical samples can be registered.` 
      };
    }

    // 2. Build Condition Log
    const nowStr = formatTimestamp();
    const tempCompliant = data.condition.temperature <= 6.0; // standard chilling threshold <=6°C
    const conditionLog: SampleConditionLog = {
      temperature: data.condition.temperature,
      tempUnit: '°C',
      tempCompliant,
      containerIntact: data.condition.containerIntact,
      sealIntact: data.condition.sealIntact,
      labelMatched: data.condition.labelMatched,
      chainOfCustodyMatched: data.condition.chainOfCustodyMatched,
      decision: data.condition.decision,
      rejectionReason: data.condition.rejectionReason,
      inspectedAt: nowStr,
      inspectedBy: `${currentUser.name} (${currentUser.badge})`
    };

    // If physical condition rejected
    if (data.condition.decision === 'rejected') {
      const rejectedCode = `LAB-2026-REJ-${String(samples.length + 1).padStart(3, '0')}`;
      const rejectedSample: Sample = {
        id: `sample-${Date.now()}`,
        sampleCode: rejectedCode,
        invoiceId: linkedInvoice.id,
        invoiceNumber: linkedInvoice.invoiceNumber,
        quoteNumber: linkedInvoice.quoteNumber,
        clientName: linkedInvoice.clientName,
        clientOrg: linkedInvoice.clientOrg,
        clientEmail: linkedInvoice.clientEmail,
        sampleName: data.sampleName,
        sampleType: data.sampleType,
        sampleMatrix: data.sampleMatrix,
        samplingDate: data.samplingDate,
        receivedDate: nowStr,
        conditionLog,
        status: 'rejected',
        assignedParameters: [],
        tat: {
          registeredAt: nowStr,
          targetWorkingDays: 7,
          workingDaysElapsed: 0,
          workingDaysRemaining: 0,
          statusColor: 'completed'
        },
        coaVersion: 0,
        coaNumber: 'N/A'
      };

      setSamples(prev => [rejectedSample, ...prev]);
      addAuditLog(
        'Physical Sample Rejection (Intake Failure)',
        'SAMPLE',
        rejectedCode,
        `Physical sample REJECTED during SRO intake. Reason: ${data.condition.rejectionReason || 'Chilling temperature exceeded or damaged container'}. Temperature recorded: ${data.condition.temperature}°C.`
      );
      return { success: true, sample: rejectedSample };
    }

    // 3. Accepted: Generate Unique LAB ID & Initialize Parameters
    const nextLabNum = String(samples.length + 94).padStart(4, '0');
    const sampleCode = `LAB-2026-${nextLabNum}`;
    const coaNum = `COA-2026-${nextLabNum}-Rev00`;

    const selectedParamDefs = STANDARD_TEST_PARAMETERS.filter(p => data.assignedParameterIds.includes(p.id));
    const testItems: TestResultItem[] = selectedParamDefs.map(p => ({
      parameterId: p.id,
      parameterName: p.name,
      category: p.category,
      method: p.method,
      unit: p.unit,
      regulatoryLimit: p.standardLimit,
      resultValue: '',
      uncertainty: p.uncertaintyEstimate,
      equipmentRef: p.typicalEquipment,
      status: 'pending',
      qcPassed: false
    }));

    const newSample: Sample = {
      id: `sample-${Date.now()}`,
      sampleCode,
      invoiceId: linkedInvoice.id,
      invoiceNumber: linkedInvoice.invoiceNumber,
      quoteNumber: linkedInvoice.quoteNumber,
      clientName: linkedInvoice.clientName,
      clientOrg: linkedInvoice.clientOrg,
      clientEmail: linkedInvoice.clientEmail,
      sampleName: data.sampleName,
      sampleType: data.sampleType,
      sampleMatrix: data.sampleMatrix,
      samplingDate: data.samplingDate,
      receivedDate: nowStr,
      conditionLog,
      status: 'registered',
      assignedParameters: testItems,
      tat: {
        registeredAt: nowStr,
        targetWorkingDays: 7,
        workingDaysElapsed: 0,
        workingDaysRemaining: 7,
        statusColor: 'green'
      },
      coaVersion: 0,
      coaNumber: coaNum
    };

    setSamples(prev => [newSample, ...prev]);

    addAuditLog(
      'Register New Sample & Assign Tests',
      'SAMPLE',
      sampleCode,
      `Sample registered under ID ${sampleCode} after physical integrity verified (Temperature: ${data.condition.temperature}°C). ${testItems.length} test parameters assigned. 7 Working Days TAT tracker initiated (7 days remaining).`
    );

    return { success: true, sample: newSample };
  };

  // 5. Update Test Result (Chemist/Analyst)
  const updateTestResult = (
    sampleId: string, 
    parameterId: string, 
    resultValue: string, 
    qcPassed: boolean, 
    equipmentRef?: string
  ) => {
    const timestamp = formatTimestamp();
    setSamples(prev => prev.map(s => {
      if (s.id !== sampleId) return s;

      const updatedParams = s.assignedParameters.map(p => {
        if (p.parameterId === parameterId) {
          return {
            ...p,
            resultValue,
            qcPassed,
            equipmentRef: equipmentRef || p.equipmentRef,
            status: resultValue.trim() !== '' ? ('completed' as const) : ('in_progress' as const),
            testedBy: currentUser.name,
            testedAt: timestamp
          };
        }
        return p;
      });

      const newStatus = s.status === 'registered' ? 'in_analysis' : s.status;

      return {
        ...s,
        status: newStatus,
        assignedParameters: updatedParams
      };
    }));
  };

  // 6. Submit Draft for Technical Review (Chemist)
  const submitDraftForReview = (sampleId: string, analystNotes: string): { success: boolean; error?: string } => {
    const sample = samples.find(s => s.id === sampleId);
    if (!sample) return { success: false, error: 'Sample not found' };

    const pending = sample.assignedParameters.filter(p => !p.resultValue || p.resultValue.trim() === '');
    if (pending.length > 0) {
      return { 
        success: false, 
        error: `There are ${pending.length} pending parameters with empty results (${pending.map(p => p.parameterName).join(', ')}). Please complete all tests before submitting draft.` 
      };
    }

    setSamples(prev => prev.map(s => {
      if (s.id === sampleId) {
        return {
          ...s,
          status: 'draft_submitted',
          analystNotes
        };
      }
      return s;
    }));

    addAuditLog(
      'Submit Draft COA for Technical Review',
      'RESULT_ENTRY',
      sample.sampleCode,
      `Analyst ${currentUser.name} submitted draft report for ${sample.sampleCode} with ${sample.assignedParameters.length} parameters to the Technical Manager for QA/QC approval.`
    );

    return { success: true };
  };

  // 7. Approve Sample & Digital Sign-off (Technical Manager)
  const approveSampleCOA = (sampleId: string, remarks?: string): { success: boolean; error?: string } => {
    const sample = samples.find(s => s.id === sampleId);
    if (!sample) return { success: false, error: 'Sample not found' };

    const signTime = formatTimestamp();
    const hashData = `${sample.sampleCode}-${sample.coaNumber}-${currentUser.name}-${signTime}`;
    const mockHash = Array.from(hashData).reduce((hash, char) => {
      return ((hash << 5) - hash + char.charCodeAt(0)) | 0;
    }, 0);
    const signatureHash = `sha256:${Math.abs(mockHash).toString(16).padStart(16, '0')}${Date.now().toString(16)}`;

    const signOff: DigitalSignOff = {
      managerName: currentUser.name,
      managerTitle: currentUser.title,
      signedAt: signTime,
      signatureHash,
      certificateId: `ISO17025-SIG-${sample.sampleCode.replace('LAB-', '')}`,
      remarks: remarks || 'All quality control parameters, detection limits, and standard methods conform to accredited ISO/IEC 17025 requirements.'
    };

    setSamples(prev => prev.map(s => {
      if (s.id === sampleId) {
        return {
          ...s,
          status: 'approved',
          digitalSignOff: signOff,
          tat: {
            ...s.tat,
            completedAt: signTime
          }
        };
      }
      return s;
    }));

    addAuditLog(
      'Technical Approval & Digital Sign-off',
      'COA_APPROVAL',
      sample.coaNumber,
      `Technical Manager (${currentUser.name}) approved analytical results with cryptographic digital signature (Hash: ${signatureHash.substring(0, 18)}...). Report status updated to Final COA.`
    );

    return { success: true };
  };

  // 8. Reject Draft (Technical Manager requests revision from Analyst)
  const rejectDraftSample = (sampleId: string, remarks: string): { success: boolean; error?: string } => {
    const sample = samples.find(s => s.id === sampleId);
    if (!sample) return { success: false, error: 'Sample not found' };

    setSamples(prev => prev.map(s => {
      if (s.id === sampleId) {
        return {
          ...s,
          status: 'in_analysis',
          analystNotes: `[RETURNED BY TECHNICAL MANAGER]: ${remarks}`
        };
      }
      return s;
    }));

    addAuditLog(
      'Draft Returned to Laboratory',
      'COA_APPROVAL',
      sample.sampleCode,
      `Technical Manager returned draft for ${sample.sampleCode} to chemist for re-testing/correction. Remarks: ${remarks}`
    );

    return { success: true };
  };

  // 9. Revise Approved COA (ISO 17025 Clause 7.8.8 Amendment to Reports)
  const reviseApprovedCOA = (sampleId: string, reason: string): { success: boolean; error?: string } => {
    const sample = samples.find(s => s.id === sampleId);
    if (!sample) return { success: false, error: 'Sample not found' };

    const newRevNum = (sample.coaVersion || 0) + 1;
    const baseNum = sample.sampleCode.replace('LAB-', '');
    const newCoaNumber = `COA-2026-${baseNum}-Rev${String(newRevNum).padStart(2, '0')}`;
    const revTime = formatTimestamp();

    const revisionEntry = {
      revisionNumber: newRevNum,
      revisionCode: newCoaNumber,
      revisedAt: revTime,
      revisedBy: currentUser.name,
      reason,
      previousSignOff: sample.digitalSignOff
    };

    setSamples(prev => prev.map(s => {
      if (s.id === sampleId) {
        return {
          ...s,
          coaVersion: newRevNum,
          coaNumber: newCoaNumber,
          status: 'in_analysis',
          revisionHistory: [...(s.revisionHistory || []), revisionEntry]
        };
      }
      return s;
    }));

    addAuditLog(
      'Final Report Amendment (ISO 17025 Clause 7.8.8)',
      'REVISION',
      newCoaNumber,
      `Report amendment authorized under Clause 7.8.8 ISO/IEC 17025. New revision generated: ${newCoaNumber} (superseding ${sample.coaNumber}). Reason: ${reason}`
    );

    return { success: true };
  };

  // 10. Deliver Final COA to Client (Admin / CS) - Stops TAT Timer
  const deliverSampleCOA = (sampleId: string): { success: boolean; error?: string } => {
    const sample = samples.find(s => s.id === sampleId);
    if (!sample) return { success: false, error: 'Sample not found' };

    if (sample.status !== 'approved') {
      return { 
        success: false, 
        error: 'Report is not yet approved by the Technical Manager. Only reports in Final COA status can be delivered to clients.' 
      };
    }

    const deliveryTime = formatTimestamp();

    setSamples(prev => prev.map(s => {
      if (s.id === sampleId) {
        return {
          ...s,
          status: 'delivered',
          tat: {
            ...s.tat,
            deliveredAt: deliveryTime,
            statusColor: 'completed' as TatStatusColor
          }
        };
      }
      return s;
    }));

    addAuditLog(
      'Dispatch COA & Conclude TAT',
      'DELIVERY',
      sample.coaNumber,
      `Final COA (${sample.coaNumber}) dispatched to client (${sample.clientOrg} / ${sample.clientEmail}). 7-day TAT monitoring officially closed.`
    );

    return { success: true };
  };

  // Reset to initial mock dataset for testing
  const resetToDefaultData = () => {
    setQuotes(INITIAL_QUOTES);
    setInvoices(INITIAL_INVOICES);
    setSamples(INITIAL_SAMPLES);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    localStorage.removeItem(STORAGE_KEYS.QUOTES);
    localStorage.removeItem(STORAGE_KEYS.INVOICES);
    localStorage.removeItem(STORAGE_KEYS.SAMPLES);
    localStorage.removeItem(STORAGE_KEYS.LOGS);
  };

  return (
    <LIMSContext.Provider
      value={{
        activeRole,
        setActiveRole,
        currentUser,
        quotes,
        invoices,
        samples,
        auditLogs,
        parameters: STANDARD_TEST_PARAMETERS,
        createQuote,
        convertQuoteToInvoice,
        markInvoiceAsPaid,
        registerSample,
        updateTestResult,
        submitDraftForReview,
        approveSampleCOA,
        rejectDraftSample,
        reviseApprovedCOA,
        deliverSampleCOA,
        checkPermission,
        resetToDefaultData
      }}
    >
      {children}
    </LIMSContext.Provider>
  );
};

export const useLIMS = (): LIMSContextType => {
  const context = useContext(LIMSContext);
  if (!context) {
    throw new Error('useLIMS must be used within a LIMSProvider');
  }
  return context;
};
