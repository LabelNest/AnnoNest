
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Activity, Clock, Layers, ArrowRight, ShieldCheck, Database, Zap, Sparkles, Loader2,
  BookOpen, Compass, BarChart3, TrendingUp, Users, Globe, CheckCircle2, XCircle,
  FileText, Mic, Languages, Search, AlertCircle, Play, Settings2, Download,
  Fingerprint, ChevronRight, Info, User, Target, RotateCcw, Box, Landmark,
  PenTool, ListTodo, Building2, Cpu, History, Send
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts';
import { supabaseService } from '../services/supabaseService';
import { UserProfile, Task, Entity } from '../types';

const Newspaper = ({ className, size }: { className?: string, size?: number }) => (
  <BookOpen className={className} size={size} />
);

interface DashboardProps {
  userProfile: UserProfile;
  onNavigate: (v: any) => void;
  userMap: Record<string, string>;
  theme: 'light' | 'dark';
  newsCount?: number;
  activeProjectId?: string;
}

const Dashboard: React.FC<DashboardProps> = ({ userProfile, onNavigate, userMap, theme, newsCount, activeProjectId }) => {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [nestStats, setNestStats] = useState<any>({});
  const [pulseActivity, setPulseActivity] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'KNOWLEDGE' | 'ANALYTICS' | 'HEALTH'>('KNOWLEDGE');

  const loadData = async () => {
    setLoading(true);
    try {
      /** Fix: Added missing activeProjectId argument to fetchTasks call */
      const [tData, eData, sData, pData] = await Promise.all([
        supabaseService.fetchTasks(userProfile.tenant_id, activeProjectId || ''),
        supabaseService.fetchEntities(userProfile.tenant_id),
        supabaseService.fetchDataNestStats(userProfile.tenant_id),
        supabaseService.fetchPulseActivityMetrics(userProfile.tenant_id, activeProjectId || '')
      ]);
      setTasks(tData);
      setEntities(eData);
      setNestStats(sData);
      setPulseActivity(pData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [userProfile.tenant_id, activeProjectId]);

  const taskExecutionMetrics = useMemo(() => {
    return {
      total: tasks.length,
      completed: tasks.filter(t => t.status === 'completed' || t.status === 'closed').length,
      pending: tasks.filter(t => ['assigned', 'in_progress', 'created'].includes(t.status)).length,
      reopened: tasks.filter(t => t.status === 'reopened').length,
      inQC: tasks.filter(t => t.status === 'submitted').length,
    };
  }, [tasks]);

  const qualityIndicators = useMemo(() => {
    const qcTasks = tasks.filter(t => t.task_category === 'qc');
    const total = qcTasks.length || 1;
    const passed = qcTasks.filter(t => t.status === 'completed').length;
    return {
      passRate: Math.round((passed / total) * 100),
      failRate: Math.round(((total - passed) / total) * 100),
      reworkRate: 12,
      avgCycles: 1.4
    };
  }, [tasks]);

  if (loading) return (
    <div className="h-full flex flex-col items-center justify-center gap-6 text-accent-primary">
      <Loader2 className="animate-spin" size={64} />
      <p className="text-[12px] font-black uppercase tracking-[0.8em] animate-pulse">Syncing System Pulse Matrix...</p>
    </div>
  );

  return (
    <div className="space-y-16 max-w-[1600px] mx-auto pb-40 text-text-primary dark:text-white animate-in fade-in duration-700">
      
      {/* HUD HEADER */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-12 border-b border-border-ui dark:border-slate-800 pb-16">
        <div className="space-y-6">
          <div className="flex items-center gap-8">
            <h1 className="text-8xl font-black flex items-center gap-10 tracking-tighter uppercase italic font-serif leading-none text-white">
              <Activity className="text-accent-primary shrink-0" size={80} />
              Pulse
            </h1>
          </div>
          <p className="text-text-secondary font-medium text-xl italic flex items-center gap-4">
             <Fingerprint size={26} className="text-accent-primary" /> LabelNest OS — <span className="text-accent-primary font-black uppercase text-xs tracking-[0.4em] bg-accent-primary/10 px-6 py-2 rounded-full border border-accent-primary/20 shadow-2xl italic">Operational Kernel v1.0.4</span>
          </p>
        </div>

        <div className="flex bg-card-panel dark:bg-[#0f172a] border border-border-ui dark:border-slate-800 rounded-[3rem] p-2 shadow-3xl">
          <button onClick={() => setActiveTab('KNOWLEDGE')} className={`px-10 py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'KNOWLEDGE' ? 'bg-accent-primary text-white shadow-xl' : 'text-text-secondary hover:text-text-primary'}`}>Knowledge Hub</button>
          <button onClick={() => setActiveTab('ANALYTICS')} className={`px-10 py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'ANALYTICS' ? 'bg-accent-primary text-white shadow-xl' : 'text-text-secondary hover:text-text-primary'}`}>Live Analytics</button>
          <button onClick={() => setActiveTab('HEALTH')} className={`px-10 py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'HEALTH' ? 'bg-accent-primary text-white shadow-xl' : 'text-text-secondary hover:text-text-primary'}`}>Operational Health</button>
        </div>
      </header>

      {activeTab === 'KNOWLEDGE' && (
        <div className="space-y-24 animate-in slide-in-from-bottom-8 duration-500">
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="bg-card-panel dark:bg-[#0E1626] border border-border-ui dark:border-slate-800 rounded-[3.5rem] p-12 shadow-2xl overflow-hidden relative group">
               <div className="absolute top-0 right-0 p-10 text-accent-primary/5 group-hover:scale-105 transition-transform"><BookOpen size={280}/></div>
               <h3 className="text-3xl font-black italic font-serif uppercase tracking-tight mb-10 flex items-center gap-4 relative z-10 text-white">
                 <Info size={24} className="text-accent-primary" /> Glossary
               </h3>
               <div className="space-y-4 relative z-10 max-h-[500px] overflow-y-auto custom-scrollbar pr-4">
                  {[
                    { term: 'Entity', module: 'Data CRM', meaning: 'A canonical institutional node (GP, LP, Fund).', ex: 'Blackstone Group LP' },
                    { term: 'Dataset', module: 'Data CRM', meaning: 'A structured grouping of related institutional nodes.', ex: 'Global GP Registry' },
                    { term: 'Task', module: 'Execution', meaning: 'A single atomic unit of operational work assigned to an analyst.', ex: 'Extract 13F metadata' },
                    { term: 'QC', module: 'QA', meaning: 'Quality Control handshake verifying extraction accuracy.', ex: 'Field Accuracy Audit' },
                    { term: 'Version', module: 'Refinery', meaning: 'A historical snapshot of an extracted artifact.', ex: 'v1.0.4 - Initial Ingest' },
                    { term: 'Diff', module: 'Refinery', meaning: 'A differential delta between two document versions.', ex: 'New Fund Added (+1)' },
                    { term: 'Approval', module: 'QA', meaning: 'Managerial sign-off to promote data to the master registry.', ex: 'Clearance Handshake' },
                  ].map((g, i) => (
                    <div key={i} className="p-6 bg-app-bg dark:bg-slate-950/50 border border-border-ui dark:border-slate-800 rounded-2xl group/item hover:border-accent-primary/30 transition-all">
                       <div className="flex justify-between items-center mb-2">
                          <span className="text-lg font-black italic font-serif uppercase text-accent-primary">{g.term}</span>
                          <span className="text-[8px] font-black uppercase text-slate-500 bg-slate-900 px-2 py-0.5 rounded tracking-widest">{g.module}</span>
                       </div>
                       <p className="text-sm text-text-secondary dark:text-slate-400 font-medium italic mb-2">"{g.meaning}"</p>
                       <div className="text-[9px] font-mono text-slate-600 uppercase">Ex: {g.ex}</div>
                    </div>
                  ))}
               </div>
            </div>

            <div className="bg-card-panel dark:bg-[#0E1626] border border-border-ui dark:border-slate-800 rounded-[3.5rem] p-12 shadow-2xl overflow-hidden relative group">
               <div className="absolute top-0 right-0 p-10 text-emerald-500/5 group-hover:scale-105 transition-transform"><CheckCircle2 size={280}/></div>
               <h3 className="text-3xl font-black italic font-serif uppercase tracking-tight mb-10 flex items-center gap-4 relative z-10 text-white">
                 <ShieldCheck size={24} className="text-emerald-500" /> Operational Guidelines
               </h3>
               <div className="space-y-6 relative z-10 overflow-y-auto custom-scrollbar pr-4">
                  {[
                    { cat: 'Extraction', title: 'Zero-Noise Policy', desc: 'Avoid including boilerplate disclaimer text in kernel extracts.', do: 'Focus on tables and entities', dont: 'Include full legal footers', owner: 'R. Mehta', update: '12m ago' },
                    { cat: 'Annotation', title: 'Bounding Box Precision', desc: 'Boxes must fit within 1px of object boundaries.', do: 'Tight fit', dont: 'Loose padding', owner: 'A. Chen', update: '1d ago' },
                    { cat: 'QA', title: 'Dispute Resolution', desc: 'Always provide structural reasoning for rejections.', do: 'Link source evidence', dont: 'Vague rejection comments', owner: 'S. Kulkarni', update: '3h ago' },
                  ].map((g, i) => (
                    <div key={i} className="p-8 bg-app-bg dark:bg-slate-950/50 border border-border-ui dark:border-slate-800 rounded-[2.5rem] space-y-6">
                       <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">{g.cat} Protocol</span>
                            <h4 className="text-xl font-black text-white italic font-serif uppercase mt-1">{g.title}</h4>
                          </div>
                          <div className="text-right">
                             <p className="text-[8px] font-black text-slate-700 uppercase tracking-widest">Custodian</p>
                             <p className="text-[10px] font-bold text-slate-500">{g.owner}</p>
                          </div>
                       </div>
                       <p className="text-sm text-slate-400 italic leading-relaxed">{g.desc}</p>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                             <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mb-1">Standard</p>
                             <p className="text-[10px] font-bold text-emerald-400 italic">Do: {g.do}</p>
                          </div>
                          <div className="p-4 bg-rose-500/5 rounded-xl border border-rose-500/10">
                             <p className="text-[8px] font-black text-rose-600 uppercase tracking-widest mb-1">Restricted</p>
                             <p className="text-[10px] font-bold text-rose-400 italic">Don't: {g.dont}</p>
                          </div>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          </section>

          <section className="space-y-10">
             <h3 className="text-[12px] font-black text-text-secondary uppercase tracking-[0.6em] px-8">Navigation Map — OS Topology</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { id: 'datanest', label: 'Data CRM', desc: 'Institutional Master Registry', action: 'Update firm profiles', icon: Database, color: 'blue' },
                  { id: 'ext_hub', label: 'Extraction', desc: 'Autonomous Pipeline Monitor', action: 'Manage refinery workers', icon: Cpu, color: 'amber' },
                  { id: 'annotate', label: 'Annotation', desc: 'Multi-Modal Refinery Hub', action: 'Perform human labeling', icon: PenTool, color: 'indigo' },
                  { id: 'qa_dashboard', label: 'QA Command', desc: 'Integrity Audit Center', action: 'Review field accuracy', icon: ShieldCheck, color: 'rose' },
                  { id: 'task_cockpit', label: 'Task Cockpit', desc: 'Operational Throughput Queue', action: 'Process assigned protocols', icon: ListTodo, color: 'sky' },
                  { id: 'usage_ledger', label: 'Exports', desc: 'Data Promotion Ledger', action: 'Audit promovals & units', icon: Download, color: 'violet' },
                  { id: 'settings', label: 'Admin', desc: 'Identity & Segment Matrix', action: 'Configure workspace nodes', icon: Settings2, color: 'slate' },
                ].map((n, i) => (
                  <button 
                    key={n.id}
                    onClick={() => onNavigate(n.id)}
                    className="p-10 rounded-[3rem] border-2 bg-card-panel dark:bg-[#0E1626] border-border-ui dark:border-slate-800 text-left hover:border-accent-primary/40 transition-all shadow-xl group relative overflow-hidden"
                  >
                     <div className={`absolute -right-4 -top-4 opacity-5 group-hover:scale-110 transition-transform text-white`}><n.icon size={120} /></div>
                     <div className="relative z-10 space-y-8">
                        <div className={`w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 shadow-inner group-hover:scale-110 transition-transform`}><n.icon size={24}/></div>
                        <div className="space-y-2">
                           <h4 className="text-xl font-black text-white italic font-serif uppercase tracking-tight">{n.label}</h4>
                           <p className="text-[10px] text-slate-500 font-medium italic">{n.desc}</p>
                        </div>
                        <div className="pt-6 border-t border-slate-900 flex justify-between items-center">
                           <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest">{n.action}</span>
                           <ArrowRight size={16} className="text-slate-800 group-hover:text-accent-primary group-hover:translate-x-1 transition-all"/>
                        </div>
                     </div>
                  </button>
                ))}
             </div>
          </section>
        </div>
      )}

      {activeTab === 'ANALYTICS' && (
        <div className="space-y-24 animate-in fade-in duration-700">
           {/* ACTIVITY MATRIX (REPLACED GENERIC STATS) */}
           <section className="space-y-10">
              <div className="flex justify-between items-center px-8">
                 <h3 className="text-[12px] font-black text-text-secondary uppercase tracking-[0.6em]">30-Day Activity Matrix</h3>
                 <span className="text-[9px] font-black text-accent-primary bg-accent-primary/10 px-4 py-1.5 rounded-full border border-accent-primary/20 italic tracking-widest uppercase">Forensic Reality Layer</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
                 {[
                   { label: 'Firms updated (30 days)', val: pulseActivity?.firmsUpdated || 0, delta: 'Registry Sync', color: 'blue', icon: Building2 },
                   { label: 'News processed (30 days)', val: pulseActivity?.newsProcessed || 0, delta: 'Refinery Sweep', color: 'amber', icon: Newspaper },
                   { label: 'Firms reached out (30 days)', val: pulseActivity?.firmsReachedOut || 0, delta: 'Sequence Active', color: 'indigo', icon: Send },
                   { label: 'Contacts engaged (30 days)', val: pulseActivity?.contactsEngaged || 0, delta: 'Unique Signatures', color: 'emerald', icon: Users },
                   { label: 'Annotations completed (30 days)', val: pulseActivity?.annotationsCompleted || 0, delta: 'Human Intelligence', color: 'rose', icon: PenTool },
                   { label: 'QA reviews completed (30 days)', val: pulseActivity?.qaReviewsCompleted || 0, delta: 'Integrity Handshake', color: 'sky', icon: ShieldCheck },
                 ].map((v, i) => (
                   <div key={i} className="bg-[#0E1626] border border-slate-800 p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden group">
                      <div className={`absolute top-0 right-0 p-6 opacity-5 text-white group-hover:scale-110 transition-transform`}><v.icon size={80}/></div>
                      <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] mb-6 leading-tight min-h-[2.5rem]">{v.label}</p>
                      <p className="text-5xl font-black text-white italic font-serif leading-none tracking-tighter mb-4">{v.val.toLocaleString()}</p>
                      <p className="text-[9px] font-black text-slate-500 uppercase italic tracking-widest">{v.delta}</p>
                   </div>
                 ))}
              </div>
           </section>

           <section className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              <div className="lg:col-span-8 space-y-10">
                 <h3 className="text-[12px] font-black text-text-secondary uppercase tracking-[0.6em] px-8">Operational Throughput — Execution Queue</h3>
                 <div className="grid grid-cols-5 gap-4">
                    {[
                      { label: 'Created', val: tasks.length, color: 'slate' },
                      { label: 'Completed', val: taskExecutionMetrics.completed, color: 'emerald' },
                      { label: 'Pending', val: taskExecutionMetrics.pending, color: 'amber' },
                      { label: 'Reopened', val: taskExecutionMetrics.reopened, color: 'rose' },
                      { label: 'In QC', val: taskExecutionMetrics.inQC, color: 'blue' },
                    ].map((m, i) => (
                      <div key={i} className="p-6 bg-slate-950 border border-slate-900 rounded-[2rem] text-center shadow-inner group hover:border-accent-primary/40 transition-all">
                         <p className="text-[8px] font-black text-slate-700 uppercase tracking-widest mb-3">{m.label}</p>
                         <p className={`text-4xl font-black italic font-serif text-white`}>{m.val}</p>
                      </div>
                    ))}
                 </div>
                 <div className="bg-[#0E1626] border border-slate-800 rounded-[3.5rem] p-12 h-[450px] shadow-2xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(#1C2A44_1px,transparent_1px)] [background-size:40px_40px] opacity-10"></div>
                    <div className="relative z-10 flex flex-col h-full">
                       <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.5em] mb-12 flex items-center gap-3 text-slate-300"><BarChart3 size={16}/> Work-Type Output Distribution</h4>
                       <div className="flex-1">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={[
                              { name: 'Annotate', val: 42, color: '#3B82F6' },
                              { name: 'Extract', val: 85, color: '#10B981' },
                              { name: 'Translate', val: 12, color: '#6366F1' },
                              { name: 'Transcribe', val: 28, color: '#F59E0B' },
                              { name: 'Verify', val: 64, color: '#F43F5E' },
                            ]}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#1C2A44" vertical={false} />
                              <XAxis dataKey="name" stroke="#64748B" fontSize={10} fontWeight="900" tickLine={false} axisLine={false} tick={{ dy: 10 }} />
                              <YAxis stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} />
                              <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#0F172A', border: '1px solid #1C2A44', borderRadius: '12px' }} />
                              <Bar dataKey="val" radius={[8, 8, 0, 0]} barSize={50}>
                                 {[0,1,2,3,4].map((entry, index) => (
                                   <Cell key={`cell-${index}`} fill={['#3B82F6','#10B981','#6366F1','#F59E0B','#F43F5E'][index]} />
                                 ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                       </div>
                    </div>
                 </div>
              </div>
              
              <div className="lg:col-span-4 space-y-10">
                 <h3 className="text-[12px] font-black text-text-secondary uppercase tracking-[0.6em] px-8">Registry Coverage Matrix</h3>
                 <div className="bg-card-panel dark:bg-[#0E1626] border border-border-ui dark:border-slate-800 rounded-[3.5rem] p-10 space-y-8 shadow-2xl h-[620px] flex flex-col">
                    {[
                      { label: 'GPs Covered', val: 412, perc: 84, color: 'blue' },
                      { label: 'LPs Covered', val: 108, perc: 62, color: 'emerald' },
                      { label: 'Funds Covered', val: 1284, perc: 91, color: 'indigo' },
                      { label: 'PortCos Covered', val: 5642, perc: 45, color: 'amber' },
                      { label: 'Service Providers', val: 242, perc: 78, color: 'rose' },
                    ].map((c, i) => (
                      <div key={i} className="space-y-3 group cursor-pointer">
                         <div className="flex justify-between items-end">
                            <div className="flex flex-col">
                               <span className="text-[8px] font-black text-slate-700 uppercase tracking-widest">{c.label}</span>
                               <span className="text-xl font-black text-white italic font-serif leading-none mt-1 group-hover:text-accent-primary transition-colors">{c.val.toLocaleString()}</span>
                            </div>
                            <span className="text-[10px] font-mono font-bold text-slate-500 uppercase italic">v_{c.perc}% INTEL_GEN</span>
                         </div>
                         <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden shadow-inner">
                            <div className={`h-full transition-all duration-1000`} style={{ width: `${c.perc}%`, backgroundColor: c.color === 'blue' ? '#3B82F6' : c.color === 'emerald' ? '#10B981' : '#6366F1' }}></div>
                         </div>
                      </div>
                    ))}
                    <div className="mt-auto pt-8 border-t border-slate-900">
                       <button className="w-full py-4 bg-slate-950 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:text-white transition-all flex items-center justify-center gap-3 group">
                          Extract Full Coverage Audit <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                       </button>
                    </div>
                 </div>
              </div>
           </section>
        </div>
      )}

      {activeTab === 'HEALTH' && (
        <div className="space-y-24 animate-in slide-in-from-right-8 duration-500">
           <section className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {[
                { label: 'QC Pass Rate', val: `${qualityIndicators.passRate}%`, icon: CheckCircle2, color: 'emerald' },
                { label: 'QC Failure Delta', val: `${qualityIndicators.failRate}%`, icon: XCircle, color: 'rose' },
                { label: 'Rework rate', val: `${qualityIndicators.reworkRate}%`, icon: RotateCcw, color: 'amber' },
                { label: 'Avg Rework Cycles', val: qualityIndicators.avgCycles, icon: History, color: 'blue' },
              ].map((q, i) => (
                <div key={i} className="bg-[#0E1626] border border-slate-800 p-10 rounded-[3.5rem] shadow-xl relative overflow-hidden group">
                   <div className={`absolute -right-4 -top-4 opacity-5 text-white group-hover:scale-110 transition-transform`}><q.icon size={120}/></div>
                   <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] mb-6">{q.label}</p>
                   <p className={`text-6xl font-black italic font-serif tracking-tighter text-white`}>{q.val}</p>
                </div>
              ))}
           </section>

           <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              <div className="lg:col-span-8 space-y-10">
                 <h3 className="text-[12px] font-black text-text-secondary uppercase tracking-[0.6em] px-8">Forensic Pulse — Activity Feed</h3>
                 <div className="bg-[#0E1626] border border-slate-800 rounded-[4rem] p-12 space-y-10 shadow-2xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(#1C2A44_1px,transparent_1px)] [background-size:40px_40px] opacity-[0.03]"></div>
                    <div className="space-y-8 relative z-10">
                       {tasks.slice(0, 5).map((a, i) => (
                         <div key={i} className="flex gap-8 group">
                            <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-slate-900 flex items-center justify-center text-accent-primary font-black italic font-serif text-xl shadow-inner shrink-0 group-hover:scale-110 transition-transform">
                               {(userMap[a.assigned_to || ''] || 'S')[0]}
                            </div>
                            <div className="flex-1 pb-8 border-b border-slate-900 last:border-0">
                               <div className="flex justify-between items-start mb-2">
                                  <p className="text-lg font-black text-white italic font-serif leading-none tracking-tight group-hover:text-accent-primary transition-colors uppercase">
                                     {userMap[a.assigned_to || ''] || 'System Agent'} <span className="text-slate-500 font-normal lowercase not-italic text-sm">processed sequence</span>
                                  </p>
                                  <span className="text-[10px] font-mono font-bold text-slate-700 uppercase italic">{new Date(a.updated_at).toLocaleTimeString()}</span>
                               </div>
                               <div className="flex items-center gap-4">
                                  <span className="text-[9px] font-black text-slate-600 bg-slate-950 px-2 py-0.5 rounded border border-slate-900 tracking-widest">{a.task_category.toUpperCase()} Module</span>
                                  <span className="text-[10px] font-bold text-accent-primary italic">Status: {a.status}</span>
                               </div>
                            </div>
                         </div>
                       ))}
                       {tasks.length === 0 && <p className="text-center italic opacity-20 py-20 uppercase font-black text-xs tracking-widest">Pulse feed is idle.</p>}
                    </div>
                 </div>
              </div>

              <div className="lg:col-span-4 space-y-10">
                 <h3 className="text-[12px] font-black text-text-secondary uppercase tracking-[0.6em] px-8">Institutional Node Metadata</h3>
                 <div className="bg-card-panel dark:bg-[#0E1626] border border-border-ui dark:border-slate-800 rounded-[3.5rem] p-10 space-y-8 shadow-2xl h-full flex flex-col relative overflow-hidden">
                    <div className="absolute -right-8 -top-8 opacity-[0.02] text-white"><Settings2 size={300}/></div>
                    {[
                      { label: 'Active Personnel Nodes', val: 14, icon: Users, color: 'blue' },
                      { label: 'Open Project Kernels', val: 8, icon: Target, color: 'emerald' },
                      { label: 'Active Dataset Matrix', val: 12, icon: Layers, color: 'indigo' },
                      { label: 'Last Extraction Sequence', val: '2m ago', icon: Zap, color: 'amber' },
                      { label: 'Last Registry Promotion', val: '1d ago', icon: Download, color: 'rose' },
                    ].map((a, i) => (
                      <div key={i} className="flex items-center gap-6 group cursor-default relative z-10">
                         <div className={`w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-500 shadow-inner group-hover:scale-110 transition-transform`}><a.icon size={20}/></div>
                         <div>
                            <p className="text-[9px] font-black text-slate-700 uppercase tracking-widest mb-1">{a.label}</p>
                            <p className="text-2xl font-black text-white italic font-serif leading-none group-hover:text-accent-primary transition-colors">{a.val}</p>
                         </div>
                      </div>
                    ))}
                    <div className="mt-auto pt-10 border-t border-slate-900 space-y-4 relative z-10">
                       <button className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] text-xs font-black uppercase tracking-widest shadow-3xl shadow-indigo-900/40 hover:bg-indigo-500 transition-all active:scale-95 flex items-center justify-center gap-4 group">
                          Launch System Audit <ShieldCheck size={20} className="group-hover:rotate-12 transition-transform" />
                       </button>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* FOOTER HUD */}
      <footer className="fixed bottom-0 left-72 right-0 h-16 bg-slate-950/90 backdrop-blur-xl border-t border-slate-900 px-10 flex items-center justify-between z-[100] pointer-events-none">
         <div className="flex items-center gap-10">
            <div className="flex items-center gap-3">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
               <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">System Heartbeat: Nominal</span>
            </div>
            <div className="flex items-center gap-3">
               <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
               <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">Registry Integrity: Verified</span>
            </div>
         </div>
         <div className="flex items-center gap-6">
            <p className="text-[9px] font-black text-slate-800 uppercase tracking-[0.4em] italic font-serif leading-none">AnnoNest Operational Hub v1.0 — NODE_SECURE</p>
         </div>
      </footer>
    </div>
  );
};

export default Dashboard;
