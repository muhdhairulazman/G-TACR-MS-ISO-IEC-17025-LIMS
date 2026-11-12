import React from 'react';
import { useLIMS } from '../../context/LIMSContext';
import { 
  LayoutDashboard, 
  ReceiptText, 
  TestTube2, 
  FlaskConical, 
  CheckSquare, 
  History,
  Lock,
  ChevronRight,
  Award,
  Zap
} from 'lucide-react';

export type TabType = 'dashboard' | 'finance' | 'registration' | 'analysis' | 'review' | 'audit';

interface SidebarProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onTabChange }) => {
  const { activeRole, invoices, samples } = useLIMS();

  // Badge calculations
  const unpaidInvoicesCount = invoices.filter(i => i.status === 'unpaid').length;
  const readyForRegistrationCount = invoices.filter(i => i.status === 'paid').length;
  const inLabCount = samples.filter(s => s.status === 'registered' || s.status === 'in_analysis').length;
  const pendingApprovalCount = samples.filter(s => s.status === 'draft_submitted').length;

  const navItems: Array<{
    id: TabType;
    label: string;
    sublabel: string;
    icon: React.ComponentType<{ className?: string }>;
    primaryFor: string[];
    color: string;
    badgeCount?: number;
    badgeColor?: string;
  }> = [
    {
      id: 'dashboard',
      label: 'Dashboard & TAT',
      sublabel: '7-Day Working Countdown',
      icon: LayoutDashboard,
      primaryFor: ['admin', 'sro', 'analyst', 'tech_manager'],
      color: 'text-indigo-600',
    },
    {
      id: 'finance',
      label: 'Finance & Invoices',
      sublabel: 'Quotes & Pre-Payment Gate',
      icon: ReceiptText,
      primaryFor: ['admin'],
      color: 'text-purple-600',
      badgeCount: unpaidInvoicesCount,
      badgeColor: 'bg-amber-100 text-amber-900 font-bold border border-amber-300'
    },
    {
      id: 'registration',
      label: 'Sample Registration',
      sublabel: 'SRO Physical Intake & Log',
      icon: TestTube2,
      primaryFor: ['sro'],
      color: 'text-amber-600',
      badgeCount: readyForRegistrationCount,
      badgeColor: 'bg-emerald-100 text-emerald-900 font-bold border border-emerald-300'
    },
    {
      id: 'analysis',
      label: 'Laboratory Testing',
      sublabel: 'Worklist & Method Entry',
      icon: FlaskConical,
      primaryFor: ['analyst'],
      color: 'text-blue-600',
      badgeCount: inLabCount,
      badgeColor: 'bg-blue-100 text-blue-900 font-bold border border-blue-300'
    },
    {
      id: 'review',
      label: 'Technical Review',
      sublabel: 'QA/QC & Digital Sign-off',
      icon: CheckSquare,
      primaryFor: ['tech_manager'],
      color: 'text-emerald-600',
      badgeCount: pendingApprovalCount,
      badgeColor: 'bg-rose-100 text-rose-900 font-bold border border-rose-300 animate-pulse'
    },
    {
      id: 'audit',
      label: 'Audit Trail (ISO 17025)',
      sublabel: 'Clause 8.4 Records Control',
      icon: History,
      primaryFor: ['tech_manager', 'admin'],
      color: 'text-slate-600'
    }
  ];

  return (
    <aside className="w-full lg:w-64 bg-white border-r border-slate-200 shrink-0 flex flex-col justify-between p-3 lg:p-4 shadow-2xs">
      <div className="space-y-5">
        <div>
          <div className="px-3 py-1.5 mb-2 flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              LIMS Workflow Modules
            </span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
              ISO 17025
            </span>
          </div>

          <nav className="space-y-1.5">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              const isPrimaryForCurrentRole = item.primaryFor.includes(activeRole);

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all group cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-50/90 to-teal-50/50 text-slate-900 font-bold border border-emerald-300 shadow-xs ring-1 ring-emerald-500/10'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`p-1.5 rounded-lg transition-colors ${isActive ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 truncate">
                      <div className="text-xs truncate flex items-center gap-1.5">
                        <span className={isActive ? 'text-slate-900 font-extrabold' : ''}>{item.label}</span>
                        {isPrimaryForCurrentRole && !isActive && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block shrink-0 ring-2 ring-emerald-200" title="Primary module for your active role" />
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">{item.sublabel}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    {item.badgeCount !== undefined && item.badgeCount > 0 && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${item.badgeColor}`}>
                        {item.badgeCount}
                      </span>
                    )}
                    {isActive && <ChevronRight className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Pre-Payment Policy Gating Card */}
        <div className="p-3.5 bg-gradient-to-br from-slate-50 to-blue-50/30 border border-slate-200 rounded-2xl text-[11px] text-slate-600 space-y-2 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <Lock className="w-3.5 h-3.5 text-amber-600" />
              <span>Pre-Payment Gating</span>
            </div>
            <span className="text-[9px] font-bold bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded border border-amber-300">
              Mandatory
            </span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            In accordance with ISO 17025 contract rules, SRO sample registration is strictly locked until invoice status is verified as <span className="font-bold text-emerald-700">PAID</span>.
          </p>
        </div>
      </div>

      {/* Accreditation Footer */}
      <div className="pt-4 border-t border-slate-200 space-y-2">
        <div className="p-2.5 rounded-xl bg-gradient-to-tr from-emerald-50 via-teal-50 to-cyan-50 border border-emerald-200/80 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-white p-0.5 border border-emerald-200 shadow-2xs shrink-0 flex items-center justify-center">
              <img 
                src="/assets/aistudio/Logo_LGM_wo_BG_90314aa6.png" 
                alt="LGM" 
                className="w-full h-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-black text-emerald-950 truncate">
                SAMM NO. 008
              </div>
              <div className="text-[10px] text-emerald-700 truncate font-semibold">
                Lembaga Getah Malaysia (LGM)
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-1.5 border border-emerald-100 flex items-center justify-center shadow-2xs">
            <img 
              src="/assets/aistudio/Logo_G-TACR_fe961507.png" 
              alt="G-TACR SAMM NO. 008" 
              className="h-10 w-full object-contain"
            />
          </div>
        </div>

        <div className="flex justify-between items-center text-[10px] text-slate-400 px-1">
          <span>Standard:</span>
          <span className="font-mono text-slate-600 font-semibold">MS ISO/IEC 17025</span>
        </div>
      </div>
    </aside>
  );
};
