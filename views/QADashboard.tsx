import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldCheck, BarChart3, TrendingUp, RefreshCw, 
  History, DollarSign, SearchCheck, CheckCircle2, 
  Clock, ArrowRight, Loader2, Target, Globe, 
  Settings, Plus, Save, User, ShieldAlert, Zap, 
  X, ChevronRight, Database, Scale, Edit2, List,
  GitMerge, Users, Briefcase, Activity as ActivityIcon,
  Filter, Layers, ArrowUpRight
} from 'lucide-react';
import { supabaseService } from '../services/supabaseService';
import { 
  UserProfile, QAScoreSnapshot, QAReview, QACostLedger, 
  QAFieldDefinition, Entity
} from '../types';
import QAWorkbench from './QAWorkbench';
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, LineChart, Line, Cell
} from 'recharts';

interface Props {
  userProfile: UserProfile;
  activeProjectId: string;
}

type Tab = 'AUDIT_BACKLOG' | 'INTEGRITY_INDEX' | 'COST_LEDGER' | 'POLICY_DESIGNER' | 'WORKBENCH';

const QADashboard: React.FC<Props> = ({ userProfile, activeProjectId }) => {
  const [activeTab, setActiveTab] = useState<Tab>('AUDIT_BACKLOG');
  const [loading, setLoading] = useState(true);
  
  // Data State
  const [reviews, setReviews] = useState<QAReview[]>([]);
  const [snapshots, setSnapshots] = useState<QAScoreSnapshot[]>([]);
  const [ledger, setLedger] = useState<QACostLedger[]>([]);
  const [fieldDefs, setFieldDefs] = useState<QAFieldDefinition[]>([]);
  const [staleEntities, setStaleEntities] = useState<Entity[]>([]);

  // Selected ID for workbench
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);

  const isManagement = ['super_admin', 'tenant_admin', 'manager'].includes(userProfile.role);

  const loadData = async () => {
    setLoading(true);
    try {
      const [revs, snaps, costs, defs, stale] = await Promise.all([
        supabaseService.fetchQAReviews(userProfile.tenant_id, activeProjectId),
        supabaseService.fetchQAScoreSnapshots(userProfile.tenant_id),
        supabaseService.fetchQACostLedger(userProfile.tenant_id, activeProjectId),
        supabaseService.fetchQAFieldDefinitions(),
        supabaseService.fetchStaleAuditBacklog(userProfile.tenant_id)
      ]);
      setReviews(revs);
      setSnapshots(snaps);
      setLedger(costs);
      setFieldDefs(defs);
      setStaleEntities(stale);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [activeProjectId]);

  const stats = useMemo(() => {
    const pendingCount = reviews.filter(r => r.qc_status === 'Pending' || r.qc_status === 'Assigned').length;
    const avgScore = snapshots.length > 0 ? snapshots.reduce((acc, s) => acc + s.final_score, 0) / snapshots.length : 100;
    const totalCost = ledger.reduce((acc, c) => acc + (c.total_cost || 0), 0);
    const criticalBacklog = staleEntities.length;
    return { pendingCount, avgScore, totalCost, criticalBacklog };
  }, [reviews, snapshots, ledger, staleEntities]);

  if (activeTab === 'WORKBENCH' && selectedReviewId) {
    return <QAWorkbench reviewId={selectedReviewId} userProfile={userProfile} activeProjectId={activeProjectId} onComplete={() => { setSelectedReviewId(null); setActiveTab('AUDIT_BACKLOG'); loadData(); }} />;
  }

  if (loading) return (
    <div className="h-full flex flex-col items-center justify-center gap-8 text-accent-primary animate-pulse">
       <Loader2 className="animate-spin" size={64} />
       <p className="text-[12px] font-black uppercase tracking-[0.8em]">Synchronizing Integrity Matrix...</p>
    </div>
  );

  return (
    <div className="space-y-12 max-w-[1600px] mx-auto pb-40 text-text-primary animate-in fade-in duration-700">
      
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-12 border-b border-slate-800 pb-16">
        <div className="space-y-6">
          <h1 className="text-8xl font-black flex items-center gap-10 tracking-tighter uppercase italic font-serif leading-none text-white">
            <ShieldCheck className="text-accent-primary shrink-0" size={80} />
            Command
          </h1>
          <p className="text-text-secondary font-medium text-xl italic flex items-center gap-4">
             <ActivityIcon size={26} className="text-accent-primary" /> Integrity Hub — <span className="text-accent-primary font-black uppercase text-xs tracking-[0.4em] bg-accent-primary/10 px-6 py-2 rounded-full border border-accent-primary/20 shadow-blue italic">v2.0 Refinery Protocol</span>
          </p>
        </div>

        <div className="flex bg-card-panel dark:bg-[#0f172a] border border-border-ui dark:border-slate-800 rounded-[3rem] p-2 shadow-3xl">
          <button onClick={() => setActiveTab('AUDIT_BACKLOG')} className={`px-10 py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'AUDIT_BACKLOG' ? 'bg-accent-primary text-white shadow-blue' : 'text-text-secondary hover:text-text-primary'}`}>Backlog</button>
          <button onClick={() => setActiveTab('INTEGRITY_INDEX')} className={`px-10 py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'INTEGRITY_INDEX' ? 'bg-accent-primary text-white shadow-blue' : 'text-text-secondary hover:text-text-primary'}`}>Performance</button>
          <button onClick={() => setActiveTab('COST_LEDGER')} className={`px-10 py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'COST_LEDGER' ? 'bg-accent-primary text-white shadow-blue' : 'text-text-secondary hover:text-text-primary'}`}>Ledger</button>
          {isManagement && (
            <button onClick={() => setActiveTab('POLICY_DESIGNER')} className={`px-10 py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'POLICY_DESIGNER' ? 'bg-accent-primary text-white shadow-blue' : 'text-text-secondary hover:text-text-primary'}`}>Policies</button>
          )}
        </div>
      </header>

      {/* KPIS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {[
          { label: 'Pending Audits', val: stats.pendingCount, icon: Clock, color: '#FFB800' },
          { label: 'Accuracy Index', val: `${stats.avgScore.toFixed(1)}%`, icon: Target, color: '#00E676' },
          { label: 'Audit Investment', val: `₹${stats.totalCost.toLocaleString()}`, icon: DollarSign, color: '#0052FF' },
          { label: 'Stale Critical', val: stats.criticalBacklog, icon: ShieldAlert, color: '#F43F5E' },
        ].map((s, i) => (
          <div key={i} className="bg-card-panel border border-slate-800 p-10 rounded-[3.5rem] shadow-xl relative overflow-hidden group">
            <div className={`absolute -right-4 -top-4 opacity-5 group-hover:scale-110 transition-transform`} style={{ color: s.color }}><s.icon size={140} /></div>
            <p className="text-[11px] font-black text-text-muted uppercase tracking-[0.4em] mb-6">{s.label}</p>
            <p className="text-6xl font-black text-text-primary dark:text-white italic font-serif leading-none tracking-tighter">{s.val}</p>
          </div>
        ))}
      </div>

      {activeTab === 'AUDIT_BACKLOG' && (
        <div className="space-y-10 animate-in slide-in-from-bottom-8 duration-500">
           <header className="flex justify-between items-center px-10">
              <div className="space-y-1">
                 <h3 className="text-[12px] font-black text-text-secondary uppercase tracking-[0.6em] flex items-center gap-3"><History size={16} className="text-accent-primary"/> Audit Queue</h3>
                 <p className="text-[10px] text-slate-600 italic">Clearance signals awaiting forensic verification.</p>
              </div>
              <button onClick={loadData} className="p-4 bg-slate-950 border border-slate-800 text-slate-500 rounded-2xl hover:text-white transition-all shadow-inner"><RefreshCw size={24}/></button>
           </header>

           <div className="bg-card-panel border border-slate-800 rounded-[4rem] overflow-hidden shadow-4xl flex flex-col min-h-[600px]">
              <div className="flex-1 overflow-x-auto custom-scrollbar">
                 <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-950/60 border-b border-slate-800 sticky top-0 z-10">
                       <tr className="text-[11px] font-black text-slate-500 uppercase tracking-[0.5em]">
                          <th className="px-12 py-10">Institutional Signal</th>
                          <th className="px-10 py-10">Hub / Module</th>
                          <th className="px-10 py-10 text-center">Status</th>
                          <th className="px-10 py-10">Specialist Node</th>
                          <th className="px-12 py-10 text-right">Commit</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                       {reviews.map((rev) => (
                         <tr key={rev.id} className="hover:bg-accent-primary/[0.02] transition-all group border-l-[6px] border-transparent hover:border-accent-primary">
                            <td className="px-12 py-8">
                               <div className="flex items-center gap-8">
                                  <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-2xl font-black text-accent-primary italic font-serif shadow-inner group-hover:scale-110 transition-transform">
                                     {rev.module[0]}
                                  </div>
                                  <div>
                                     <p className="text-xl font-black text-text-primary dark:text-white italic font-serif leading-none mb-1.5 uppercase tracking-tight group-hover:text-accent-primary transition-colors">{rev.module} Audit</p>
                                     <p className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">RECORD_ID: {rev.record_id?.toUpperCase()}</p>
                                  </div>
                               </div>
                            </td>
                            <td className="px-10 py-8">
                               <span className="text-[10px] font-black uppercase text-slate-500 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 tracking-widest">{rev.dataset || 'GENERIC'}</span>
                            </td>
                            <td className="px-10 py-8 text-center">
                               <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border italic ${
                                 rev.qc_status === 'Assigned' ? 'bg-blue-600/10 text-blue-400 border-blue-500/20' :
                                 'bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse'
                               }`}>{rev.qc_status}</span>
                            </td>
                            <td className="px-10 py-8">
                               <div className="flex items-center gap-3">
                                  <User size={14} className="text-slate-700" />
                                  <span className="text-xs font-black text-slate-400 uppercase italic tracking-tight">{rev.qc_by || 'UNASSIGNED'}</span>
                               </div>
                            </td>
                            <td className="px-12 py-8 text-right">
                               <button 
                                onClick={() => { setSelectedReviewId(rev.id); setActiveTab('WORKBENCH'); }}
                                className="px-10 py-3.5 bg-accent-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-blue hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
                               >
                                  Engage <ChevronRight size={14}/>
                               </button>
                            </td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'INTEGRITY_INDEX' && (
        <div className="space-y-16 animate-in slide-in-from-right-8 duration-700">
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-8 bg-card-panel border border-slate-800 rounded-[4rem] p-12 shadow-2xl h-[500px]">
                 <h3 className="text-[12px] font-black text-text-secondary uppercase tracking-[0.6em] mb-12 flex items-center gap-4"><TrendingUp size={18} className="text-accent-primary"/> Historical Precision Sequence</h3>
                 <ResponsiveContainer width="100%" height="80%">
                    <AreaChart data={snapshots.map(s => ({ name: s.period_start, val: s.final_score }))}>
                       <defs>
                          <linearGradient id="colorAcc" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#00E676" stopOpacity={0.3}/>
                             <stop offset="95%" stopColor="#00E676" stopOpacity={0}/>
                          </linearGradient>
                       </defs>
                       <CartesianGrid strokeDasharray="3 3" stroke="#1C2A44" vertical={false} />
                       <XAxis dataKey="name" stroke="#64748B" fontSize={10} fontWeight="900" axisLine={false} />
                       <YAxis domain={[90, 100]} stroke="#64748B" fontSize={10} axisLine={false} />
                       <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#0C121D', border: '1px solid #1E293B' }} />
                       <Area type="monotone" dataKey="val" stroke="#00E676" strokeWidth={4} fillOpacity={1} fill="url(#colorAcc)" />
                    </AreaChart>
                 </ResponsiveContainer>
              </div>
              <div className="lg:col-span-4 bg-card-panel border border-slate-800 rounded-[4rem] p-10 shadow-2xl flex flex-col justify-center gap-10">
                 <div className="text-center space-y-4">
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">Segment Integrity Threshold</p>
                    <p className="text-8xl font-black text-emerald-500 italic font-serif leading-none tracking-tighter">95%</p>
                    <p className="text-[9px] font-bold text-slate-700 uppercase tracking-widest">MIN_ACCEPTABLE_PASS_RATE</p>
                 </div>
                 <div className="p-8 bg-slate-950 border border-slate-900 rounded-3xl space-y-6">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-900 pb-3">Drift Integrity Alert</h4>
                    <div className="flex items-center gap-4 text-rose-500">
                       <ShieldAlert size={20} />
                       <p className="text-[11px] font-bold italic leading-tight">DataNest GP Registry shows a 1.2% precision decay in the last 24h cycle.</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'COST_LEDGER' && (
        <div className="space-y-10 animate-in slide-in-from-bottom-8 duration-500">
           <header className="px-10 flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="space-y-1">
                 <h3 className="text-[12px] font-black text-text-secondary uppercase tracking-[0.6em] flex items-center gap-3"><DollarSign size={18} className="text-accent-primary"/> Temporal Audit Investment</h3>
                 <p className="text-[10px] text-slate-600 italic">Financial ledger tracking the cost of human-in-the-loop verification.</p>
              </div>
              <div className="px-8 py-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-4">
                 <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest italic">Segment ROI: Optimised</span>
                 <CheckCircle2 size={16} className="text-emerald-500"/>
              </div>
           </header>

           <div className="bg-card-panel border border-slate-800 rounded-[4rem] overflow-hidden shadow-4xl flex flex-col min-h-[500px]">
              <div className="flex-1 overflow-x-auto custom-scrollbar">
                 <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-950/60 border-b border-slate-800 sticky top-0 z-10">
                       <tr className="text-[11px] font-black text-slate-500 uppercase tracking-[0.5em]">
                          <th className="px-12 py-10">Refinery Node</th>
                          <th className="px-10 py-10">Temporal Units</th>
                          <th className="px-10 py-10">Cost Basis</th>
                          <th className="px-12 py-10 text-right">Total Investment</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                       {ledger.map(cl => (
                         <tr key={cl.id} className="hover:bg-accent-primary/[0.02] transition-all group">
                            <td className="px-12 py-8">
                               <p className="text-lg font-black text-white italic font-serif uppercase leading-none mb-1.5">{cl.module} // {cl.dataset_type}</p>
                               <p className="text-[9px] font-mono text-slate-700 uppercase tracking-widest">REVIEWER_NODE: {cl.reviewer_id}</p>
                            </td>
                            <td className="px-10 py-8">
                               <p className="text-2xl font-black text-slate-200 italic font-serif">{cl.time_spent_minutes}m</p>
                               <span className="text-[8px] font-black text-slate-700 uppercase tracking-widest">Active Verification</span>
                            </td>
                            <td className="px-10 py-8">
                               <p className="text-xl font-black text-slate-400 italic font-serif">₹{cl.cost_per_minute}/m</p>
                            </td>
                            <td className="px-12 py-8 text-right">
                               <p className="text-4xl font-black text-accent-primary italic font-serif">₹{cl.total_cost?.toLocaleString()}</p>
                            </td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'POLICY_DESIGNER' && isManagement && (
        <div className="space-y-12 animate-in slide-in-from-bottom-6">
           <header className="px-10 flex justify-between items-end">
              <div className="space-y-1">
                 <h3 className="text-[12px] font-black text-text-secondary uppercase tracking-[0.6em] flex items-center gap-3"><Scale size={18} className="text-accent-primary"/> Field Protocol Designer</h3>
                 <p className="text-[10px] text-slate-600 italic">Defining weighting rules and truth anchors per institutional dataset.</p>
              </div>
              <button className="px-8 py-3 bg-accent-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-blue hover:brightness-110 flex items-center gap-2">
                 <Plus size={16}/> New Field Definition
              </button>
           </header>

           <div className="bg-card-panel border border-slate-800 rounded-[4rem] overflow-hidden shadow-4xl">
              <table className="w-full text-left border-collapse">
                 <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-black text-slate-500 uppercase tracking-[0.5em]">
                    <tr>
                       <th className="px-12 py-10">Field Protocol Signature</th>
                       <th className="px-10 py-10">Hub / Set</th>
                       <th className="px-10 py-10 text-center">QC Weight</th>
                       <th className="px-10 py-10 text-center">Integrity Logic</th>
                       <th className="px-12 py-10 text-right">Mutation</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-800/40">
                    {fieldDefs.map(fd => (
                       <tr key={fd.id} className={`hover:bg-accent-primary/[0.03] transition-all group ${!fd.active ? 'opacity-40 grayscale' : ''}`}>
                          <td className="px-12 py-8">
                             <p className="text-xl font-black text-text-primary dark:text-white italic uppercase tracking-tight leading-none mb-1.5">{fd.field_label}</p>
                             <p className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">KEY: {fd.field_key}</p>
                          </td>
                          <td className="px-10 py-8">
                             <span className="text-[10px] font-black uppercase text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 italic">{fd.module} // {fd.dataset}</span>
                          </td>
                          <td className="px-10 py-8 text-center">
                             <p className="text-3xl font-black text-accent-primary italic font-serif">x{fd.qc_weight}</p>
                          </td>
                          <td className="px-10 py-8">
                             <div className="flex flex-wrap gap-2 justify-center">
                                {fd.required && <span className="px-3 py-1 rounded bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[8px] font-black uppercase tracking-widest">Required</span>}
                                {fd.allow_na && <span className="px-3 py-1 rounded bg-blue-500/10 border border-blue-500/20 text-blue-500 text-[8px] font-black uppercase tracking-widest">N/A Allowed</span>}
                             </div>
                          </td>
                          <td className="px-12 py-8 text-right">
                             <button className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-600 hover:text-white transition-all shadow-lg"><Edit2 size={18}/></button>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      )}

      {/* FOOTER HUD */}
      <footer className="fixed bottom-0 left-72 right-0 h-16 bg-slate-950/90 backdrop-blur-xl border-t border-slate-900 px-10 flex items-center justify-between z-[100] pointer-events-none">
         <div className="flex items-center gap-10">
            <div className="flex items-center gap-3">
               <div className="w-1.5 h-1.5 rounded-full bg-accent-primary animate-pulse shadow-blue"></div>
               <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">Integrity Monitor: active</span>
            </div>
            <div className="flex items-center gap-3">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-emerald-500/50"></div>
               <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">Clearance Plane: Nominal</span>
            </div>
         </div>
         <p className="text-[9px] font-black text-slate-800 uppercase tracking-[0.4em] italic font-serif leading-none">AnnoNest Mission Control v2.0 — Authorized Specialist: {userProfile.full_name || userProfile.email}</p>
      </footer>
    </div>
  );
};

export default QADashboard;