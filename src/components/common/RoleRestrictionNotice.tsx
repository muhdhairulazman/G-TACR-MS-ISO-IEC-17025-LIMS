import React from 'react';
import { useLIMS } from '../../context/LIMSContext';
import { USER_ROLES } from '../../data/mockData';
import { ShieldAlert, Users, CheckCircle, ArrowRight } from 'lucide-react';
import { Role } from '../../types/lims';

interface RoleRestrictionNoticeProps {
  requiredRoleName: string;
  actionName: string;
  targetRole: Role;
}

export const RoleRestrictionNotice: React.FC<RoleRestrictionNoticeProps> = ({
  requiredRoleName,
  actionName,
  targetRole
}) => {
  const { activeRole, setActiveRole } = useLIMS();
  const currentRoleInfo = USER_ROLES[activeRole];
  const targetRoleInfo = USER_ROLES[targetRole];

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900 flex flex-col md:flex-row md:items-center justify-between gap-3">
      <div className="flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-amber-950">
            ISO/IEC 17025 Access Control (Segregation of Duties)
          </p>
          <p className="text-xs text-amber-800 mt-0.5">
            Action <span className="font-medium underline">{actionName}</span> is restricted to the <span className="font-bold">{requiredRoleName}</span> role. 
            You are currently logged in as <span className="font-medium">{currentRoleInfo.badge}</span>.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setActiveRole(targetRole)}
        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-xs cursor-pointer"
      >
        <Users className="w-3.5 h-3.5" />
        Switch to {targetRoleInfo.badge}
        <ArrowRight className="w-3 h-3 ml-0.5" />
      </button>
    </div>
  );
};

export const SegregationOfDutiesModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { activeRole, setActiveRole } = useLIMS();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Segregation of Duties Matrix
            </h3>
            <p className="text-xs text-slate-500">
              Compliance with ISO/IEC 17025:2017 Laboratory Impartiality & Integrity Requirements
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <p className="text-xs text-slate-600 leading-relaxed">
            To satisfy ISO/IEC 17025 impartiality and data integrity clauses, personnel registering samples cannot approve results, and commercial personnel cannot alter analytical testing data. The system enforces 4 core roles:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(Object.keys(USER_ROLES) as Role[]).map(roleKey => {
              const r = USER_ROLES[roleKey];
              const isCurrent = activeRole === roleKey;
              return (
                <div 
                  key={roleKey}
                  className={`p-4 rounded-xl border transition-all ${
                    isCurrent 
                      ? 'border-blue-500 bg-blue-50/40 ring-1 ring-blue-500/20' 
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      {r.badge}
                    </span>
                    {isCurrent ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                        <CheckCircle className="w-3 h-3" /> Active
                      </span>
                    ) : (
                      <button
                        onClick={() => { setActiveRole(roleKey); onClose(); }}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
                      >
                        Select Role
                      </button>
                    )}
                  </div>
                  <h4 className="text-sm font-semibold text-slate-900">{r.name}</h4>
                  <p className="text-xs text-slate-500 mb-2">{r.title}</p>
                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {r.responsibilities}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
