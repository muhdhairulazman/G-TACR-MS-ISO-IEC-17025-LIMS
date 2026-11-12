export type Role = 'admin' | 'sro' | 'analyst' | 'tech_manager';

export interface UserRoleInfo {
  role: Role;
  name: string;
  title: string;
  department: string;
  badge: string;
  responsibilities: string;
  allowedActions: string[];
}

export interface TestParameterDefinition {
  id: string;
  code: string;
  name: string;
  category: 'Physical' | 'Chemical' | 'Heavy Metals' | 'Microbiology';
  method: string;
  unit: string;
  standardLimit?: string;
  defaultPrice: number;
  uncertaintyEstimate: string;
  typicalEquipment: string;
}

export interface QuoteItem {
  parameterId: string;
  parameterName: string;
  method: string;
  unit: string;
  price: number;
  isAccredited?: boolean;
  standardLimit?: string;
  uncertaintyEstimate?: string;
}

export interface Quote {
  id: string;
  quoteNumber: string; // e.g. QT-2026-0042
  clientName: string;
  clientOrg: string;
  clientEmail: string;
  clientPhone: string;
  sampleType: string;
  sampleMatrix: string;
  items: QuoteItem[];
  subtotal: number;
  tax: number; // 6% SST
  totalAmount: number;
  status: 'draft' | 'sent' | 'accepted' | 'invoiced';
  createdAt: string;
  validUntil: string;
  // ISO/IEC 17025:2017 Clause 7.1 (Review of requests, tenders and contracts)
  decisionRule?: string; // Clause 7.1.3: Decision rule for statements of conformity
  sampleVolumeRequired?: string; // Clause 7.4: Required sample quantity & container
  preservationRequirement?: string; // Chilled <= 6°C, chemical preservation
  holdingTime?: string; // Maximum holding duration before test
  tatCommitment?: string; // Target Turn-Around Time (7 Hari Bekerja)
  subcontractingPolicy?: string; // Clause 6.6: Externally provided products & services
  statementOfConformity?: string; // Regulatory benchmark standard
  preparedBy?: string;
  reviewedBy?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // e.g. INV-2026-0089
  quoteId: string;
  quoteNumber: string;
  clientName: string;
  clientOrg: string;
  clientEmail: string;
  totalAmount: number;
  status: 'unpaid' | 'paid';
  createdAt: string;
  paymentDate?: string;
  paymentMethod?: string;
  paymentRef?: string;
}

export interface SampleConditionLog {
  temperature: number; // e.g. 4.2
  tempUnit: '°C';
  tempCompliant: boolean; // <= 6.0°C for environmental samples
  containerIntact: boolean;
  sealIntact: boolean;
  labelMatched: boolean;
  chainOfCustodyMatched: boolean;
  decision: 'accepted' | 'rejected';
  rejectionReason?: string;
  inspectedAt: string;
  inspectedBy: string;
}

export interface TestResultItem {
  parameterId: string;
  parameterName: string;
  category: string;
  method: string;
  unit: string;
  regulatoryLimit?: string;
  resultValue?: string;
  uncertainty?: string;
  equipmentRef?: string;
  status: 'pending' | 'in_progress' | 'completed';
  testedBy?: string;
  testedAt?: string;
  qcPassed?: boolean;
}

export type SampleStatus = 
  | 'received'         // Physical sample received by SRO
  | 'rejected'         // Physical condition failed inspection
  | 'registered'       // Registered in LIMS (ID generated, pre-payment confirmed)
  | 'in_analysis'      // Lab tests in progress
  | 'draft_submitted'  // Chemist submitted results for Technical Review
  | 'approved'         // Technical Manager signed off (Final COA ready)
  | 'delivered';       // Admin dispatched to client (TAT ended)

export type TatStatusColor = 'green' | 'yellow' | 'red' | 'overdue' | 'completed';

export interface SampleTAT {
  registeredAt: string;
  targetWorkingDays: number; // 7 days standard
  workingDaysElapsed: number;
  workingDaysRemaining: number;
  statusColor: TatStatusColor;
  completedAt?: string;
  deliveredAt?: string;
}

export interface DigitalSignOff {
  managerName: string;
  managerTitle: string;
  signedAt: string;
  signatureHash: string;
  certificateId: string;
  remarks?: string;
}

export interface ReportRevision {
  revisionNumber: number;
  revisionCode: string; // e.g. COA-2026-0089-Rev01
  revisedAt: string;
  revisedBy: string;
  reason: string;
  previousSignOff?: DigitalSignOff;
}

export interface Sample {
  id: string;
  sampleCode: string; // e.g. LAB-2026-0142
  invoiceId: string;
  invoiceNumber: string;
  quoteNumber: string;
  clientName: string;
  clientOrg: string;
  clientEmail: string;
  sampleName: string;
  sampleType: string;
  sampleMatrix: string;
  samplingDate: string;
  receivedDate: string;
  conditionLog: SampleConditionLog;
  assignedParameters: TestResultItem[];
  status: SampleStatus;
  analystNotes?: string;
  tat: SampleTAT;
  coaVersion: number;
  coaNumber: string; // e.g. COA-2026-0142-Rev00
  digitalSignOff?: DigitalSignOff;
  revisionHistory?: ReportRevision[];
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: Role;
  action: string;
  entityType: 'QUOTE' | 'INVOICE' | 'SAMPLE' | 'RESULT_ENTRY' | 'COA_APPROVAL' | 'DELIVERY' | 'REVISION';
  entityId: string;
  details: string;
  changeSummary?: string;
}
