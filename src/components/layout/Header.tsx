import React, { useState } from 'react';
import { useLIMS } from '../../context/LIMSContext';
import { Role } from '../../types/lims';
import { SegregationOfDutiesModal } from '../common/RoleRestrictionNotice';
import { 
  ShieldCheck, 
  RotateCcw, 
  HelpCircle,
  ChevronDown,
  Sparkles,
  Award,
  Layers
} from 'lucide-react';

interface HeaderProps {
  onNavigateTab?: (tab: 'dashboard' | 'finance' | 'registration' | 'analysis' | 'review' | 'audit') => void;
}

export const Header: React.FC<HeaderProps> = ({ onNavigateTab }) => {
  const { activeRole, setActiveRole, currentUser, resetToDefaultData, invoices, samples } = useLIMS();
  const [showMatrixModal, setShowMatrixModal] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Quick stats for interactivity
  const unpaidCount = invoices.filter(i => i.status === 'unpaid').length;
  const inLabCount = samples.filter(s => s.status === 'registered' || s.status === 'in_analysis').length;
  const pendingReviewCount = samples.filter(s => s.status === 'draft_submitted').length;

  const handleRoleSelect = (newRole: Role) => {
    setActiveRole(newRole);
  };

  const handleReset = () => {
    resetToDefaultData();
    setShowResetConfirm(false);
  };

  // Role visual theme configurations
  const roleThemes: Record<Role, {
    bg: string;
    border: string;
    text: string;
    badge: string;
    ring: string;
    name: string;
    tagline: string;
  }> = {
    admin: {
      bg: 'bg-purple-500',
      border: 'border-purple-300',
      text: 'text-purple-700',
      badge: 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white',
      ring: 'ring-purple-400',
      name: 'Admin / Commercial CS',
      tagline: 'Quotes, Invoices & Pre-Payment Gating'
    },
    sro: {
      bg: 'bg-amber-500',
      border: 'border-amber-300',
      text: 'text-amber-800',
      badge: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white',
      ring: 'ring-amber-400',
      name: 'Sample Receiving Officer (SRO)',
      tagline: 'Intake Inspection & Barcode Printing'
    },
    analyst: {
      bg: 'bg-cyan-500',
      border: 'border-cyan-300',
      text: 'text-cyan-800',
      badge: 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white',
      ring: 'ring-cyan-400',
      name: 'Chemist / Analyst',
      tagline: 'Multi-Parameter Testing & QC Verification'
    },
    tech_manager: {
      bg: 'bg-emerald-500',
      border: 'border-emerald-300',
      text: 'text-emerald-800',
      badge: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white',
      ring: 'ring-emerald-400',
      name: 'Technical Manager (Signatory)',
      tagline: 'QA/QC Review & Cryptographic Sign-off'
    }
  };

  const currentTheme = roleThemes[activeRole];

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-3 lg:px-6 py-2.5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Zone 1: G-TACR Wordmark & SAMM No. 008 Badge */}
          <div className="flex items-center justify-between md:justify-start gap-3 shrink-0">
            <div className="flex items-center gap-3">
              {/* Institutional Logos (LGM & G-TACR) */}
              <div 
                className="flex items-center gap-2 cursor-pointer group" 
                onClick={() => onNavigateTab && onNavigateTab('dashboard')}
                title="G-TACR Lembaga Getah Malaysia (SAMM NO. 008)"
              >
                {/* LGM Circular Emblem */}
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center p-0.5 border border-emerald-200 shadow-2xs group-hover:scale-105 transition-transform shrink-0">
                  <img 
                    src="/assets/aistudio/Logo_LGM_wo_BG_90314aa6.png" 
                    alt="Lembaga Getah Malaysia (LGM)" 
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* G-TACR SAMM 008 Official Logo */}
                <div className="h-10 px-1.5 py-0.5 rounded-lg bg-white border border-slate-200 shadow-2xs flex items-center justify-center group-hover:border-emerald-300 transition-colors shrink-0">
                  <img 
                    src="/assets/aistudio/Logo_G-TACR_fe961507.png" 
                    alt="G-TACR SAMM NO. 008" 
                    className="h-8 max-w-[120px] object-contain"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                    <span className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 bg-clip-text text-transparent">
                      G-TACR MS ISO/IEC 17025 LIMS
                    </span>
                  </h1>

                  {/* SAMM NO. 008 High-visibility Badge */}
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-900 bg-emerald-100/90 border border-emerald-300 px-2 py-0.5 rounded-md shadow-2xs">
                    <Award className="w-3.5 h-3.5 text-emerald-700" />
                    <span>SAMM NO. 008</span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 hidden sm:block">
                  Global Testing & Analytical Chemistry Research · Malaysian Rubber Board (LGM)
                </p>
              </div>
            </div>

            {/* Mobile Reset & Role quick button */}
            <div className="flex items-center gap-1 md:hidden">
              <button
                type="button"
                onClick={() => setShowResetConfirm(true)}
                title="Reset Demo Data"
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Zone 2: Interactive Role Switcher & Live Simulation Buttons */}
          <div className="flex items-center justify-between sm:justify-end gap-2 flex-wrap">
            
            {/* Quick Interactive Role Pills */}
            <div className="hidden xl:flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => handleRoleSelect('admin')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all text-[11px] ${
                  activeRole === 'admin' 
                    ? 'bg-purple-600 text-white shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                }`}
              >
                1. Admin/CS
              </button>
              <button
                type="button"
                onClick={() => handleRoleSelect('sro')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all text-[11px] ${
                  activeRole === 'sro' 
                    ? 'bg-amber-600 text-white shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                }`}
              >
                2. SRO (Intake)
              </button>
              <button
                type="button"
                onClick={() => handleRoleSelect('analyst')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all text-[11px] ${
                  activeRole === 'analyst' 
                    ? 'bg-blue-600 text-white shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                }`}
              >
                3. Chemist
              </button>
              <button
                type="button"
                onClick={() => handleRoleSelect('tech_manager')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all text-[11px] ${
                  activeRole === 'tech_manager' 
                    ? 'bg-emerald-600 text-white shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                }`}
              >
                4. Tech Manager
              </button>
            </div>

            {/* Standard Dropdown Role Selector for Smaller Screens */}
            <div className="flex xl:hidden items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">Role:</span>
              <div className="relative inline-flex items-center">
                <select
                  value={activeRole}
                  onChange={e => handleRoleSelect(e.target.value as Role)}
                  className="appearance-none bg-transparent pr-5 text-xs font-bold text-slate-900 focus:outline-hidden cursor-pointer"
                >
                  <option value="admin">1. Admin/CS (Finance & Gating)</option>
                  <option value="sro">2. SRO (Intake Inspection)</option>
                  <option value="analyst">3. Chemist / Analyst (Testing)</option>
                  <option value="tech_manager">4. Tech Manager (COA Sign-off)</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-0 pointer-events-none" />
              </div>
            </div>

            {/* Segregation of Duties Matrix Button */}
            <button
              type="button"
              onClick={() => setShowMatrixModal(true)}
              title="View ISO 17025 Segregation of Duties Matrix"
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200 cursor-pointer shadow-2xs"
            >
              <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">Role Matrix</span>
            </button>

            {/* Active User Chip */}
            <div className="flex items-center gap-2 pl-1 border-l border-slate-200">
              <div className="relative">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white shadow-xs ${currentTheme.badge}`}>
                  {currentUser.name.charAt(currentUser.name.startsWith('Dr.') ? 4 : (currentUser.name.startsWith('Ir.') ? 7 : 4))}
                </div>
                <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${currentTheme.bg}`} />
              </div>

              <div className="hidden md:flex flex-col text-right">
                <span className="text-xs font-bold text-slate-900 max-w-[150px] truncate leading-tight">
                  {currentUser.name}
                </span>
                <span className={`text-[10px] font-semibold truncate max-w-[150px] ${currentTheme.text}`}>
                  {currentUser.title.split('(')[0].trim()}
                </span>
              </div>

              {/* Reset Data Button */}
              <button
                type="button"
                onClick={() => setShowResetConfirm(true)}
                title="Reset QA Demo Data"
                className="hidden md:block p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>
      </header>

      {/* Interactive Quick ISO 17025 Workflow Step Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white px-3 lg:px-6 py-2 shadow-inner border-b border-slate-700/60 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 font-bold text-[11px] text-amber-300 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              ISO 17025 Live Flow:
            </span>
            <span className="text-slate-300 text-[11px]">
              Active Role: <strong className="text-white underline decoration-emerald-400 decoration-2">{currentTheme.name}</strong> ({currentTheme.tagline})
            </span>
          </div>

          {/* Direct module shortcut links */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 sm:pb-0 text-[11px]">
            <button
              type="button"
              onClick={() => {
                handleRoleSelect('admin');
                onNavigateTab && onNavigateTab('finance');
              }}
              className={`px-2 py-0.5 rounded-md transition-colors flex items-center gap-1 font-mono whitespace-nowrap ${
                activeRole === 'admin' ? 'bg-purple-500/30 text-purple-200 border border-purple-400' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              <span>1. Pay Gate</span>
              {unpaidCount > 0 && <span className="bg-amber-400 text-slate-900 px-1 text-[9px] font-bold rounded">{unpaidCount}</span>}
            </button>

            <span className="text-slate-500">→</span>

            <button
              type="button"
              onClick={() => {
                handleRoleSelect('sro');
                onNavigateTab && onNavigateTab('registration');
              }}
              className={`px-2 py-0.5 rounded-md transition-colors flex items-center gap-1 font-mono whitespace-nowrap ${
                activeRole === 'sro' ? 'bg-amber-500/30 text-amber-200 border border-amber-400' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              <span>2. SRO Intake</span>
            </button>

            <span className="text-slate-500">→</span>

            <button
              type="button"
              onClick={() => {
                handleRoleSelect('analyst');
                onNavigateTab && onNavigateTab('analysis');
              }}
              className={`px-2 py-0.5 rounded-md transition-colors flex items-center gap-1 font-mono whitespace-nowrap ${
                activeRole === 'analyst' ? 'bg-blue-500/30 text-blue-200 border border-blue-400' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              <span>3. Lab Test</span>
              {inLabCount > 0 && <span className="bg-blue-400 text-slate-900 px-1 text-[9px] font-bold rounded">{inLabCount}</span>}
            </button>

            <span className="text-slate-500">→</span>

            <button
              type="button"
              onClick={() => {
                handleRoleSelect('tech_manager');
                onNavigateTab && onNavigateTab('review');
              }}
              className={`px-2 py-0.5 rounded-md transition-colors flex items-center gap-1 font-mono whitespace-nowrap ${
                activeRole === 'tech_manager' ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-400' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              <span>4. Sign-off</span>
              {pendingReviewCount > 0 && <span className="bg-emerald-400 text-slate-900 px-1 text-[9px] font-bold rounded">{pendingReviewCount}</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Segregation of Duties Explainer Modal */}
      <SegregationOfDutiesModal
        isOpen={showMatrixModal}
        onClose={() => setShowMatrixModal(false)}
      />

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full border border-slate-200 shadow-2xl animate-in fade-in zoom-in-95">
            <h4 className="text-base font-bold text-slate-900 mb-1">Reset G-TACR Demo Data?</h4>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              This will restore all Quotations, Invoices, Samples, and Audit Trail logs back to the default ISO 17025 demonstration dataset for SAMM No. 008.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold shadow-xs cursor-pointer"
              >
                Reset Data
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
