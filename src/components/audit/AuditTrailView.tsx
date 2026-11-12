import React, { useState } from 'react';
import { useLIMS } from '../../context/LIMSContext';
import { AuditLog } from '../../types/lims';
import { 
  Search, 
  Download, 
  ShieldCheck, 
  User, 
  Tag
} from 'lucide-react';

export const AuditTrailView: React.FC = () => {
  const { auditLogs } = useLIMS();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntity, setSelectedEntity] = useState<string>('ALL');
  const [selectedRole, setSelectedRole] = useState<string>('ALL');

  const filteredLogs = auditLogs.filter(log => {
    if (selectedEntity !== 'ALL' && log.entityType !== selectedEntity) return false;
    if (selectedRole !== 'ALL' && log.actorRole !== selectedRole) return false;

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchAction = log.action.toLowerCase().includes(q);
      const matchActor = log.actorName.toLowerCase().includes(q);
      const matchDetails = log.details.toLowerCase().includes(q);
      const matchId = log.entityId.toLowerCase().includes(q);
      return matchAction || matchActor || matchDetails || matchId;
    }

    return true;
  });

  const handleExportAuditLog = () => {
    const csvHeader = 'Timestamp,Actor,Role,Action,EntityType,EntityId,Details\n';
    const csvRows = filteredLogs.map(l => 
      `"${l.timestamp}","${l.actorName}","${l.actorRole}","${l.action}","${l.entityType}","${l.entityId}","${l.details.replace(/"/g, '""')}"`
    ).join('\n');

    const blob = new Blob([csvHeader + csvRows], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ISO17025_LIMS_Audit_Trail_${new Date().toISOString().substring(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getEntityBadge = (type: AuditLog['entityType']) => {
    switch (type) {
      case 'INVOICE':
        return <span className="text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded">INVOICE</span>;
      case 'SAMPLE':
        return <span className="text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.5 rounded">SAMPLE</span>;
      case 'RESULT_ENTRY':
        return <span className="text-[10px] font-mono font-bold bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.5 rounded">RESULTS</span>;
      case 'COA_APPROVAL':
        return <span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded">APPROVAL</span>;
      case 'DELIVERY':
        return <span className="text-[10px] font-mono font-bold bg-teal-50 text-teal-800 border border-teal-200 px-1.5 py-0.5 rounded">DELIVERY</span>;
      case 'REVISION':
        return <span className="text-[10px] font-mono font-bold bg-amber-50 text-amber-900 border border-amber-300 px-1.5 py-0.5 rounded">REVISION</span>;
      default:
        return <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">{type}</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Info */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              G-TACR System Audit Trail & Records Control
            </h2>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-300">
              SAMM NO. 008 · Clause 8.4
            </span>
          </div>
          <p className="text-xs text-slate-500 max-w-3xl leading-relaxed">
            Immutable chronological logging of all critical system events: pre-payment confirmations, physical sample intake verifications, analytical raw results entry, cryptographic managerial approvals, and official report amendments.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportAuditLog}
          className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Audit Log (CSV)</span>
        </button>
      </div>

      {/* Audit Log Card with Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          <div className="flex flex-wrap items-center gap-2">
            {/* Filter by Entity */}
            <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              <label htmlFor="entity-filter" className="text-slate-500">Entity:</label>
              <select
                id="entity-filter"
                value={selectedEntity}
                onChange={e => setSelectedEntity(e.target.value)}
                className="bg-transparent font-semibold text-slate-800 focus:outline-hidden cursor-pointer"
              >
                <option value="ALL">All Entities</option>
                <option value="INVOICE">Invoices (Finance)</option>
                <option value="SAMPLE">Sample Intake</option>
                <option value="RESULT_ENTRY">Test Results Entry</option>
                <option value="COA_APPROVAL">COA Sign-off</option>
                <option value="DELIVERY">Client Delivery</option>
                <option value="REVISION">Report Amendments (Rev)</option>
              </select>
            </div>

            {/* Filter by Role */}
            <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <label htmlFor="role-filter" className="text-slate-500">Role:</label>
              <select
                id="role-filter"
                value={selectedRole}
                onChange={e => setSelectedRole(e.target.value)}
                className="bg-transparent font-semibold text-slate-800 focus:outline-hidden cursor-pointer"
              >
                <option value="ALL">All Roles</option>
                <option value="admin">Admin / CS</option>
                <option value="sro">SRO</option>
                <option value="analyst">Chemist / Analyst</option>
                <option value="tech_manager">Technical Manager</option>
              </select>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative w-full lg:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search action, user, entity ID..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500"
            />
          </div>

        </div>

        {/* Audit Log Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">User & Role</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity / Reference ID</th>
                <th className="py-3 px-4">Change Particulars (Audit Trail)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No audit trail logs match the current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    
                    {/* Timestamp */}
                    <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                      <div className="font-semibold text-slate-900">{log.timestamp.substring(0, 10)}</div>
                      <div className="text-[10px] text-slate-400">{log.timestamp.substring(11)}</div>
                    </td>

                    {/* Actor */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-900">{log.actorName}</div>
                      <div className="text-[10px] text-slate-500 uppercase font-mono">{log.actorRole}</div>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-800">
                      {log.action}
                    </td>

                    {/* Entity & ID */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {getEntityBadge(log.entityType)}
                        <span className="font-mono font-bold text-slate-900 text-xs">
                          {log.entityId}
                        </span>
                      </div>
                    </td>

                    {/* Details */}
                    <td className="py-3 px-4 max-w-md text-slate-600 leading-relaxed text-[11px]">
                      {log.details}
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Controlled Records Integrity: All transactions permanently logged without delete capabilities.</span>
          </div>
          <span className="font-mono">{filteredLogs.length} Records Displayed</span>
        </div>

      </div>

    </div>
  );
};
