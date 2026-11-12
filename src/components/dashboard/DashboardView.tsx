import React, { useState } from 'react';
import { useLIMS } from '../../context/LIMSContext';
import { Sample, TatStatusColor } from '../../types/lims';
import { TabType } from '../layout/Sidebar';
import { 
  Clock, 
  Search, 
  CheckCircle2, 
  ArrowUpRight,
  FileText,
  Building2,
  Calendar,
  Sparkles,
  Award,
  AlertTriangle,
  ChevronRight,
  Filter,
  Layers,
  Thermometer
} from 'lucide-react';

interface DashboardViewProps {
  onNavigateTab: (tab: TabType) => void;
  onSelectSampleForCOA: (sample: Sample) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateTab,
  onSelectSampleForCOA
}) => {
  const { samples, activeRole, setActiveRole } = useLIMS();
  const [filterColor, setFilterColor] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Count metrics
  const activeSamples = samples.filter(s => s.status !== 'delivered' && s.status !== 'rejected');
  const greenCount = activeSamples.filter(s => s.tat.statusColor === 'green').length;
  const yellowCount = activeSamples.filter(s => s.tat.statusColor === 'yellow').length;
  const redCount = activeSamples.filter(s => s.tat.statusColor === 'red' || s.tat.statusColor === 'overdue').length;
  const completedCount = samples.filter(s => s.status === 'delivered').length;

  const totalMonitored = samples.length || 1;
  const greenPct = Math.round((greenCount / totalMonitored) * 100);
  const yellowPct = Math.round((yellowCount / totalMonitored) * 100);
  const redPct = Math.round((redCount / totalMonitored) * 100);
  const completedPct = Math.round((completedCount / totalMonitored) * 100);

  // Filtered samples
  const filteredSamples = samples.filter(s => {
    // Color filter
    if (filterColor === 'active') {
      if (s.status === 'delivered' || s.status === 'rejected') return false;
    } else if (filterColor === 'green') {
      if (s.tat.statusColor !== 'green' || s.status === 'delivered') return false;
    } else if (filterColor === 'yellow') {
      if (s.tat.statusColor !== 'yellow' || s.status === 'delivered') return false;
    } else if (filterColor === 'red') {
      if ((s.tat.statusColor !== 'red' && s.tat.statusColor !== 'overdue') || s.status === 'delivered') return false;
    } else if (filterColor === 'completed') {
      if (s.status !== 'delivered') return false;
    }

    // Search query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchCode = s.sampleCode.toLowerCase().includes(q);
      const matchName = s.sampleName.toLowerCase().includes(q);
      const matchOrg = s.clientOrg.toLowerCase().includes(q);
      const matchClient = s.clientName.toLowerCase().includes(q);
      const matchInvoice = s.invoiceNumber.toLowerCase().includes(q);
      return matchCode || matchName || matchOrg || matchClient || matchInvoice;
    }

    return true;
  });

  const getTatBadge = (statusColor: TatStatusColor, remainingDays: number, isDelivered: boolean) => {
    if (isDelivered) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300 shadow-2xs">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>TAT Concluded (Dispatched)</span>
        </span>
      );
    }

    switch (statusColor) {
      case 'green':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{remainingDays}d Left (Safe)</span>
          </span>
        );
      case 'yellow':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>{remainingDays}d Left (Warning)</span>
          </span>
        );
      case 'red':
      case 'overdue':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-extrabold bg-rose-100 text-rose-900 border border-rose-300 shadow-xs animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>{remainingDays <= 0 ? 'Critical: Overdue' : `${remainingDays}d Left (Critical)`}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700">
            <span>{remainingDays}d Left</span>
          </span>
        );
    }
  };

  const getWorkflowBadge = (status: Sample['status']) => {
    switch (status) {
      case 'registered':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span>Registered</span>
          </span>
        );
      case 'in_analysis':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-800 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
            <span>In Testing</span>
          </span>
        );
      case 'draft_submitted':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-md">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
            <span>Pending Sign-off</span>
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-900 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-md">
            <CheckCircle2 className="w-3 h-3 text-emerald-700" />
            <span>COA Approved</span>
          </span>
        );
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-100 border border-slate-300 px-2 py-0.5 rounded-md">
            <span>Dispatched</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-800 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
            <span>Rejected (SRO)</span>
          </span>
        );
      default:
        return <span className="text-[11px] text-slate-600">{status}</span>;
    }
  };

  const renderStageIndicator = (status: Sample['status']) => {
    const stages = [
      { key: 'intake', label: 'Intake' },
      { key: 'testing', label: 'Testing' },
      { key: 'review', label: 'Review' },
      { key: 'approved', label: 'Final' }
    ];

    let currentIdx = 0;
    if (status === 'registered') currentIdx = 1;
    if (status === 'in_analysis') currentIdx = 1;
    if (status === 'draft_submitted') currentIdx = 2;
    if (status === 'approved' || status === 'delivered') currentIdx = 3;

    return (
      <div className="flex items-center gap-1 pt-1">
        {stages.map((st, i) => (
          <div key={st.key} className="flex items-center gap-0.5">
            <div className={`h-1.5 w-6 rounded-full transition-all ${
              i <= currentIdx 
                ? i === 3 ? 'bg-emerald-500' : 'bg-blue-600'
                : 'bg-slate-200'
            }`} />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Top Hero Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-3xl p-6 shadow-md relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Dual Logos Showcase */}
            <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/20 shrink-0 shadow-inner">
              <div className="w-12 h-12 rounded-full bg-white p-1 flex items-center justify-center shadow-xs">
                <img 
                  src="/assets/aistudio/Logo_LGM_wo_BG_90314aa6.png" 
                  alt="Lembaga Getah Malaysia" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="h-12 bg-white px-2 py-0.5 rounded-xl border border-white/40 flex items-center justify-center shadow-xs">
                <img 
                  src="/assets/aistudio/Logo_G-TACR_fe961507.png" 
                  alt="G-TACR SAMM NO. 008" 
                  className="h-10 max-w-[110px] object-contain"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 font-bold text-xs rounded-full border border-emerald-400/30 flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-emerald-400" />
                  <span>SAMM NO. 008 ACCREDITED LABORATORY</span>
                </span>
                <span className="text-xs text-slate-300 font-mono">
                  MS ISO/IEC 17025:2017
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                G-TACR Laboratory Operations & TAT Tracker
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Global Testing & Analytical Chemistry Research (Lembaga Getah Malaysia). Real-time 7 working days TAT tracking from physical intake through technical review and cryptographic sign-off.
              </p>
            </div>
          </div>

          {/* Quick Action tailored to role */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {activeRole === 'admin' && (
              <button
                type="button"
                onClick={() => onNavigateTab('finance')}
                className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>Finance & Pre-Payment Gating</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            )}
            {activeRole === 'sro' && (
              <button
                type="button"
                onClick={() => onNavigateTab('registration')}
                className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>Sample Physical Intake</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            )}
            {activeRole === 'analyst' && (
              <button
                type="button"
                onClick={() => onNavigateTab('analysis')}
                className="px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>Testing Worklist & Entry</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            )}
            {activeRole === 'tech_manager' && (
              <button
                type="button"
                onClick={() => onNavigateTab('review')}
                className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>QA Review & Sign-off</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Colourful KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        
        {/* Card 1: Active Samples */}
        <div className="bg-gradient-to-br from-white to-slate-50 border border-slate-200/80 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-all">
          <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1 flex items-center justify-between">
            <span>Total Monitored</span>
            <Layers className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-mono text-slate-900 tabular-nums">
              {activeSamples.length}
            </span>
            <span className="text-[10px] text-slate-500 font-semibold">in pipeline</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-slate-700 h-full rounded-full" style={{ width: '100%' }} />
          </div>
        </div>

        {/* Card 2: Green Safe */}
        <div 
          onClick={() => setFilterColor('green')}
          className="bg-gradient-to-br from-emerald-50/60 to-white border border-emerald-200 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-all cursor-pointer hover:border-emerald-300"
        >
          <div className="text-[10px] font-black uppercase tracking-wider text-emerald-800 mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Green (Safe)</span>
            </span>
            <span className="text-[10px] font-mono font-bold text-emerald-700">{greenPct}%</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-700 tabular-nums">
              {greenCount}
            </span>
            <span className="text-[10px] text-emerald-600 font-semibold">4 - 7d left</span>
          </div>
          <div className="w-full bg-emerald-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${greenPct}%` }} />
          </div>
        </div>

        {/* Card 3: Yellow Warning */}
        <div 
          onClick={() => setFilterColor('yellow')}
          className="bg-gradient-to-br from-amber-50/60 to-white border border-amber-200 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-all cursor-pointer hover:border-amber-300"
        >
          <div className="text-[10px] font-black uppercase tracking-wider text-amber-900 mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Yellow (Attention)</span>
            </span>
            <span className="text-[10px] font-mono font-bold text-amber-800">{yellowPct}%</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-mono text-amber-800 tabular-nums">
              {yellowCount}
            </span>
            <span className="text-[10px] text-amber-700 font-semibold">2 - 3d left</span>
          </div>
          <div className="w-full bg-amber-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${yellowPct}%` }} />
          </div>
        </div>

        {/* Card 4: Red Critical */}
        <div 
          onClick={() => setFilterColor('red')}
          className="bg-gradient-to-br from-rose-50/70 to-white border border-rose-200 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-all cursor-pointer hover:border-rose-300"
        >
          <div className="text-[10px] font-black uppercase tracking-wider text-rose-900 mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
              <span>Red (Urgent)</span>
            </span>
            <span className="text-[10px] font-mono font-bold text-rose-700">{redPct}%</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-mono text-rose-700 tabular-nums">
              {redCount}
            </span>
            <span className="text-[10px] text-rose-600 font-semibold">≤ 1d left</span>
          </div>
          <div className="w-full bg-rose-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-rose-600 h-full rounded-full transition-all duration-500" style={{ width: `${redPct}%` }} />
          </div>
        </div>

        {/* Card 5: Completed */}
        <div 
          onClick={() => setFilterColor('completed')}
          className="bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-all col-span-2 lg:col-span-1 cursor-pointer hover:border-slate-300"
        >
          <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Completed</span>
            </span>
            <span className="text-[10px] font-mono font-bold text-slate-600">{completedPct}%</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-mono text-slate-800 tabular-nums">
              {completedCount}
            </span>
            <span className="text-[10px] text-slate-500 font-semibold">COA closed</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-emerald-600 h-full rounded-full transition-all duration-500" style={{ width: `${completedPct}%` }} />
          </div>
        </div>

      </div>

      {/* Main Table Section */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        
        {/* Table Toolbar & Filters */}
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-gradient-to-r from-slate-50 via-white to-slate-50">
          
          {/* Interactive Filter Pills */}
          <div className="flex items-center gap-1 p-1 bg-slate-100/80 border border-slate-200 rounded-xl shrink-0 overflow-x-auto">
            <button
              type="button"
              onClick={() => setFilterColor('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                filterColor === 'all' 
                  ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-200' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({samples.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterColor('active')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                filterColor === 'active' 
                  ? 'bg-blue-600 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Active ({activeSamples.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterColor('green')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                filterColor === 'green' 
                  ? 'bg-emerald-600 text-white shadow-xs' 
                  : 'text-emerald-700 hover:text-emerald-950'
              }`}
            >
              Green ({greenCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterColor('yellow')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                filterColor === 'yellow' 
                  ? 'bg-amber-500 text-white shadow-xs' 
                  : 'text-amber-800 hover:text-amber-950'
              }`}
            >
              Yellow ({yellowCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterColor('red')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                filterColor === 'red' 
                  ? 'bg-rose-600 text-white shadow-xs' 
                  : 'text-rose-700 hover:text-rose-950'
              }`}
            >
              Red ({redCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterColor('completed')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                filterColor === 'completed' 
                  ? 'bg-slate-800 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Completed ({completedCount})
            </button>
          </div>

          {/* Interactive Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search Lab ID, Sample, Matrix, Client..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-2xs"
            />
          </div>

        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Sample Code / COA</th>
                <th className="py-3 px-4">Description & Matrix</th>
                <th className="py-3 px-4">Client / Agency</th>
                <th className="py-3 px-4">Stage Progress</th>
                <th className="py-3 px-4">Workflow Status</th>
                <th className="py-3 px-4">TAT Countdown (7-Day)</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSamples.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No sample records match the current filter or search criteria.
                  </td>
                </tr>
              ) : (
                filteredSamples.map(sample => {
                  const isDelivered = sample.status === 'delivered';
                  return (
                    <tr key={sample.id} className="hover:bg-slate-50/80 transition-colors">
                      
                      {/* Code */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-900 font-bold text-xs">{sample.sampleCode}</span>
                          {sample.coaVersion > 0 && (
                            <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300 px-1 py-0.2 rounded font-mono font-bold">
                              Rev{sample.coaVersion}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono block">
                          {sample.coaNumber}
                        </span>
                      </td>

                      {/* Name & Matrix */}
                      <td className="py-3 px-4 max-w-[220px]">
                        <div className="font-semibold text-slate-900 truncate" title={sample.sampleName}>
                          {sample.sampleName}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate" title={sample.sampleMatrix}>
                          {sample.sampleMatrix}
                        </div>
                      </td>

                      {/* Client */}
                      <td className="py-3 px-4 max-w-[200px]">
                        <div className="font-medium text-slate-800 truncate flex items-center gap-1" title={sample.clientOrg}>
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{sample.clientOrg}</span>
                        </div>
                        <div className="text-[10px] font-mono text-emerald-700 font-medium">
                          {sample.invoiceNumber}
                        </div>
                      </td>

                      {/* Stage Progress Bar */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {renderStageIndicator(sample.status)}
                      </td>

                      {/* Workflow Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {getWorkflowBadge(sample.status)}
                      </td>

                      {/* TAT Badge */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {getTatBadge(sample.tat.statusColor, sample.tat.workingDaysRemaining, isDelivered)}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* COA View button if approved or delivered */}
                          {(sample.status === 'approved' || sample.status === 'delivered') && (
                            <button
                              type="button"
                              onClick={() => onSelectSampleForCOA(sample)}
                              className="px-2.5 py-1 text-xs font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                            >
                              <FileText className="w-3.5 h-3.5 text-emerald-600" />
                              <span>View COA</span>
                            </button>
                          )}

                          {/* Quick workflow routing based on sample status */}
                          {sample.status === 'registered' && (
                            <button
                              type="button"
                              onClick={() => onNavigateTab('analysis')}
                              className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                            >
                              Start Testing
                            </button>
                          )}

                          {sample.status === 'in_analysis' && (
                            <button
                              type="button"
                              onClick={() => onNavigateTab('analysis')}
                              className="px-2.5 py-1 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors cursor-pointer"
                            >
                              Enter Data
                            </button>
                          )}

                          {sample.status === 'draft_submitted' && (
                            <button
                              type="button"
                              onClick={() => onNavigateTab('review')}
                              className="px-2.5 py-1 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg transition-colors cursor-pointer shadow-2xs"
                            >
                              QA Sign-off
                            </button>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info bar */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="flex items-center gap-1.5 font-medium text-emerald-800">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Green: 4-7d Left (Safe)</span>
            </span>
            <span className="flex items-center gap-1.5 font-medium text-amber-800">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Yellow: 2-3d Left (Warning)</span>
            </span>
            <span className="flex items-center gap-1.5 font-medium text-rose-800">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>Red: ≤1d Left (Urgent/Critical)</span>
            </span>
          </div>

          <div className="font-semibold text-slate-600 flex items-center gap-1">
            <Award className="w-3.5 h-3.5 text-emerald-600" />
            <span>G-TACR Malaysian Rubber Board · SAMM NO. 008 Accredited</span>
          </div>
        </div>

      </div>

    </div>
  );
};
