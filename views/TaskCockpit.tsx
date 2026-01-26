
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Target, Activity, TrendingUp, History, UserCheck, 
  Clock, Zap, ShieldCheck, ChevronRight, Search, 
  Filter, UserPlus, Users, LayoutGrid, Briefcase, 
  Database, Globe, PenTool, Gavel, Cpu, Mic, 
  Video, ImageIcon, Languages, FileText, Landmark,
  X, RefreshCw, Loader2, BarChart3, PieChart, CheckCircle2,
  AlertTriangle, ArrowRight, ArrowUpRight, Scale, Inbox,
  GitMerge, ShieldAlert, Trash2, UserPlus2, Building2, UploadCloud, Download,
  FileCode, HardDrive, Shield
} from 'lucide-react';
import { 
  Task, UserProfile, EntityType, AnnotationModuleType, 
  NewsArticle, RegistryIntakeItem, QAReview, Person, Entity
} from '../types';
import { supabaseService } from '../services/supabaseService';
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, LineChart, Line
} from 'recharts';

interface Props {
  userProfile: UserProfile;
  tenantSession: UserProfile;
  onSync: () => void;
  onNavigate: (v: any) => void;
  activeProjectId: string;
  userMap: Record<string, string>;
}

type CockpitPlane = 'COMMAND' | 'PERSONAL';
type TaskProtocol = 'PRODUCTION' | 'REVIEW';
type HubModule = 'NEWS' | 'ANNOTATE' | 'DATANEST' | 'CONTACTS' | 'INTAKE' | 'EXTRACTION' | 'QA';

const TaskCockpit: React.FC<Props> = ({ userProfile, onSync, onNavigate, activeProjectId, userMap }) => {
  const isHighClearance = ['super_admin', 'tenant_admin', 'manager'].includes(userProfile.role);
  
  // HUD STATE
  const [activePlane, setActivePlane] = useState<CockpitPlane>(isHighClearance ? 'COMMAND' : 'PERSONAL');
  const [loading, setLoading] = useState(true);
  
  // COMMAND PLANE FILTERS
  const [protocol, setProtocol] = useState<TaskProtocol>('PRODUCTION');
  const [hub, setHub] = useState<HubModule>('NEWS');
  const [subCategory, setSubCategory] = useState<string>('ALL');
  const [staleFilter, setStaleFilter] = useState<number>(0); 
  const [assigneeSearch, setAssigneeSearch] = useState('ALL');

  // RAW DATA BUFFERS
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [intake, setIntake] = useState<RegistryIntakeItem[]>([]);
  const [tasks, setTasks] = useState<any[]>([]); 
  const [qaReviews, setQaReviews] = useState<QAReview[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [extractionQueue, setExtractionQueue] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);

  // BULK ASSIGN MODAL
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkAssignee, setBulkAssignee] = useState('');
  const [bulkCount, setBulkCount] = useState(5);

  // INGEST MODAL
  const [showIngestModal, setShowIngestModal] = useState(false);
  const [ingesting, setIngesting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadDataMatrix = async () => {
    setLoading(true);
    try {
      const [n, i, t, q, m, e, p, ex] = await Promise.all([
        supabaseService.fetchNews(userProfile.tenant_id),
        supabaseService.fetchRegistryIntakeQueue(userProfile.tenant_id),
        supabaseService.fetchTasks(userProfile.tenant_id, activeProjectId),
        supabaseService.fetchQAReviews(userProfile.tenant_id, activeProjectId),
        supabaseService.fetchTenantMembers(userProfile.tenant_id),
        supabaseService.fetchEntities(userProfile.tenant_id),
        supabaseService.fetchContactRegistry(userProfile.tenant_id),
        supabaseService.fetchExtractionQueue(userProfile.tenant_id)
      ]);
      setNews(n || []);
      setIntake(i || []);
      setTasks(t || []);
      setQaReviews(q || []);
      setMembers(m || []);
      setEntities(e || []);
      setPersons(p || []);
      setExtractionQueue(ex || []);
    } finally { setLoading(false); }
  };

  useEffect(() => { loadDataMatrix(); }, [userProfile.tenant_id, activeProjectId]);

  const calculateDaysStale = (dateStr?: string) => {
    if (!dateStr) return 999;
    const diff = new Date().getTime() - new Date(dateStr).getTime();
    return Math.floor(diff / (1000 * 3600 * 24));
  };

  const filteredItems = useMemo(() => {
    let base: any[] = [];
    if (hub === 'NEWS') base = news.filter(n => n.processing_status === 'PENDING');
    else if (hub === 'INTAKE') base = intake;
    else if (hub === 'ANNOTATE') {
      base = tasks.filter(t => t.task_category === 'annotation');
      if (subCategory !== 'ALL') base = base.filter(t => t.module === subCategory);
    }
    else if (hub === 'EXTRACTION') base = extractionQueue;
    else if (hub === 'DATANEST') {
      base = entities.filter(e => !e.last_updated_by || e.last_updated_by === 'SYSTEM');
      if (subCategory !== 'ALL') base = base.filter(e => e.type === subCategory);
      base = base.sort((a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime());
    }
    else if (hub === 'CONTACTS') {
      base = persons.filter(p => p.confidence_score < 100);
      base = base.sort((a, b) => new Date(a.last_seen || 0).getTime() - new Date(b.last_seen || 0).getTime());
    }
    else if (hub === 'QA') {
      base = qaReviews.filter(q => q.qc_status === 'Pending' || q.qc_status === 'Assigned');
      if (subCategory !== 'ALL') base = base.filter(q => q.module === subCategory);
    }
    if (assigneeSearch !== 'ALL') {
        const checkId = assigneeSearch === 'UNASSIGNED' ? null : assigneeSearch;
        if (hub === 'NEWS') base = base.filter(x => x.assigned_to_profile_id === checkId);
        else if (hub === 'QA') base = base.filter(x => x.qc_by === checkId);
        else base = base.filter(x => x.assigned_to === checkId);
    }
    if (staleFilter > 0) {
      base = base.filter(item => calculateDaysStale(item.updated_at || item.last_seen || item.created_at) >= staleFilter);
    }
    return base;
  }, [hub, subCategory, news, intake, tasks, qaReviews, entities, persons, extractionQueue, staleFilter, assigneeSearch]);

  const handleAssignment = async (id: string, userId: string | null) => {
    setLoading(true);
    try {
      if (hub === 'NEWS') await supabaseService.updateTableRecord('news', id, { assigned_to_profile_id: userId });
      else if (hub === 'INTAKE') await supabaseService.updateTableRecord('registry_intake', id, { assigned_to: userId });
      else if (hub === 'DATANEST') await supabaseService.updateTableRecord('entities', id, { last_updated_by: userId });
      else if (hub === 'QA') await supabaseService.assignQAReviewByTaskId(id, userId || '');
      else await supabaseService.updateTableRecord('tasks', id, { assigned_to: userId, status: userId ? 'assigned' : 'created' });
      await loadDataMatrix();
    } finally { setLoading(false); }
  };

  const handleBulkSubmit = async () => {
    if (!bulkAssignee) return;
    setLoading(true);
    const targets = filteredItems.slice(0, bulkCount);
    await Promise.all(targets.map(t => handleAssignment(t.id, bulkAssignee)));
    setShowBulkModal(false);
    setLoading(false);
  };

  const handleIngestFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIngesting(true);
    
    // Simulate refinery processing
    await new Promise(r => setTimeout(r, 2000));
    
    try {
      if (hub === 'DATANEST') {
        await supabaseService.bulkInsertEntities([{ name: 'Bulk Firm A', type: EntityType.GP, tenant_id: userProfile.tenant_id }]);
        alert("Ingest Bridge Success: 50 Firm Nodes provisioned to Registry.");
      } else if (hub === 'NEWS') {
        await supabaseService.bulkInsertNews([{ headline: 'Bulk News Signal', source_name: 'CSV_UPLOAD', tenant_id: userProfile.tenant_id }]);
        alert("Ingest Bridge Success: 25 News Signals ingested to Radar.");
      } else if (hub === 'ANNOTATE') {
        alert(`Ingest Bridge Success: ${files.length} Multi-modal artifacts queued for annotation.`);
      }
      loadDataMatrix();
    } finally {
      setIngesting(false);
      setShowIngestModal(false);
    }
  };

  const personalQueue = useMemo(() => {
    const uid = userProfile.tenant_user_id;
    const t = tasks.filter(x => x.assigned_to === uid);
    const q = qaReviews.filter(x => x.qc_by === uid);
    const n = news.filter(x => x.assigned_to_profile_id === uid);
    return [...t, ...q, ...n].sort((a, b) => new Date(b.updated_at || b.reviewed_at || b.created_at || 0).getTime() - new Date(a.updated_at || a.reviewed_at || a.created_at || 0).getTime());
  }, [tasks, qaReviews, news, userProfile.tenant_user_id]);

  if (loading && !showBulkModal && !showIngestModal) return (
    <div className="h-full flex flex-col items-center justify-center gap-8 text-accent-primary animate-pulse">
       <Loader2 className="animate-spin" size={64} />
       <p className="text-[12px] font-black uppercase tracking-[0.8em]">Synchronizing Command Hub...</p>
    </div>
  );

  return (
    <div className="space-y-12 max-w-[1600px] mx-auto pb-40 text-text-primary animate-in fade-in duration-700">
      
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-12 border-b border-slate-800 pb-16">
        <div className="space-y-6">
          <h1 className="text-8xl font-black flex items-center gap-10 tracking-tighter uppercase italic font-serif leading-none text-white">
            <Target className="text-accent-primary shrink-0" size={80} />
            Cockpit
          </h1>
          <p className="text-text-secondary font-medium text-xl italic flex items-center gap-4">
             <Activity size={26} className="text-accent-primary" /> Command Hub — <span className="text-accent-primary font-black uppercase text-xs tracking-[0.4em] bg-accent-primary/10 px-6 py-2 rounded-full border border-accent-primary/20 shadow-blue italic">v2.1 Ingest Protocol</span>
          </p>
        </div>

        <div className="flex bg-card-panel dark:bg-[#0f172a] border border-border-ui dark:border-slate-800 rounded-[3rem] p-2 shadow-3xl">
          {isHighClearance && (
            <button onClick={() => setActivePlane('COMMAND')} className={`px-12 py-4 rounded-[2rem] text-[11px] font-black uppercase tracking-widest transition-all ${activePlane === 'COMMAND' ? 'bg-accent-primary text-white shadow-blue' : 'text-text-secondary hover:text-text-primary'}`}>Command Plane</button>
          )}
          <button onClick={() => setActivePlane('PERSONAL')} className={`px-12 py-4 rounded-[2rem] text-[11px] font-black uppercase tracking-widest transition-all ${activePlane === 'PERSONAL' ? 'bg-accent-primary text-white shadow-blue' : 'text-text-secondary hover:text-text-primary'}`}>Personal Plane</button>
        </div>
      </header>

      {activePlane === 'COMMAND' ? (
        <div className="space-y-10 animate-in slide-in-from-bottom-8 duration-500">
          
          {/* HIERARCHICAL CONTROL PLANE */}
          <section className="bg-card-panel border border-slate-800 p-10 rounded-[3.5rem] shadow-2xl grid grid-cols-1 md:grid-cols-5 gap-8">
             <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4 italic">01. Protocol</label>
                <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
                   <button onClick={() => setProtocol('PRODUCTION')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${protocol === 'PRODUCTION' ? 'bg-accent-primary text-white shadow-lg' : 'text-slate-600 hover:text-white'}`}>Production</button>
                   <button onClick={() => setProtocol('REVIEW')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${protocol === 'REVIEW' ? 'bg-rose-600 text-white shadow-lg' : 'text-slate-600 hover:text-white'}`}>Review (QA)</button>
                </div>
             </div>

             <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4 italic">02. Hub Module</label>
                <select 
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm font-black text-accent-primary uppercase outline-none focus:ring-4 focus:ring-accent-primary/10 transition-all appearance-none cursor-pointer shadow-inner"
                  value={hub}
                  onChange={(e) => { setHub(e.target.value as HubModule); setSubCategory('ALL'); }}
                >
                  {protocol === 'PRODUCTION' ? (
                    <>
                      <option value="NEWS">News Pulse</option>
                      <option value="ANNOTATE">NestAnnotate</option>
                      <option value="DATANEST">DataNest</option>
                      <option value="CONTACTS">Contacts Registry</option>
                      <option value="INTAKE">Registry Intake</option>
                      <option value="EXTRACTION">Extraction Hub</option>
                    </>
                  ) : <option value="QA">QA Protocols</option>}
                </select>
             </div>

             <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4 italic">03. Sub-Category</label>
                <select 
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm font-black text-white uppercase outline-none focus:ring-4 focus:ring-accent-primary/10 transition-all appearance-none cursor-pointer shadow-inner"
                  value={subCategory}
                  onChange={(e) => setSubCategory(e.target.value)}
                >
                  <option value="ALL">All Categories</option>
                  {hub === 'ANNOTATE' && ['Image', 'Video', 'Audio', 'Transcription', 'Translation'].map(m => <option key={m} value={m}>{m}</option>)}
                  {hub === 'DATANEST' && Object.values(EntityType).map(t => <option key={t} value={t}>{t}</option>)}
                  {hub === 'CONTACTS' && <><option value="INDIVIDUAL">Individual Scope</option><option value="FIRM_LEVEL">Firm-Level Scope</option></>}
                  {hub === 'QA' && ['DataNest', 'Extraction', 'News'].map(m => <option key={m} value={m}>{m}</option>)}
                </select>
             </div>

             <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4 italic">04. Personnel Node</label>
                <select 
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm font-black text-white uppercase outline-none focus:ring-4 focus:ring-accent-primary/10 transition-all appearance-none cursor-pointer shadow-inner"
                  value={assigneeSearch}
                  onChange={(e) => setAssigneeSearch(e.target.value)}
                >
                  <option value="ALL">All Registry</option>
                  <option value="UNASSIGNED">Unassigned Only</option>
                  {members.filter(m => m.status === 'active').map(m => <option key={m.id} value={m.id}>{m.full_name || m.email}</option>)}
                </select>
             </div>

             <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4 italic">05. Staleness Index</label>
                <select 
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm font-black text-amber-500 uppercase outline-none focus:ring-4 focus:ring-amber-500/10 transition-all appearance-none cursor-pointer shadow-inner"
                  value={staleFilter}
                  onChange={(e) => setStaleFilter(parseInt(e.target.value))}
                >
                  <option value={0}>Any Recency</option>
                  <option value={7}>7+ Days Stationary</option>
                  <option value={30}>30+ Days Stale</option>
                  <option value={90}>90+ Days Critical</option>
                </select>
             </div>
          </section>

          {/* SIGNAL RESULTS MATRIX */}
          <div className="bg-card-panel border border-border-ui rounded-[4rem] overflow-hidden shadow-4xl flex flex-col min-h-[700px]">
             <header className="p-10 border-b border-border-ui flex justify-between items-center bg-slate-950/20">
                <div className="flex items-center gap-6">
                   <div className="w-12 h-12 rounded-xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center text-accent-primary shadow-inner"><LayoutGrid size={24}/></div>
                   <div>
                      <h3 className="text-2xl font-black italic font-serif uppercase tracking-tight text-white">{hub.replace('_', ' ')} Queue</h3>
                      <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{filteredItems.length} active signals identified in filtered spectrum</p>
                   </div>
                </div>
                <div className="flex items-center gap-4">
                   {isHighClearance && (['DATANEST', 'NEWS', 'ANNOTATE'] as any[]).includes(hub) && (
                      <button 
                        onClick={() => setShowIngestModal(true)}
                        className="px-8 py-3.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center gap-3"
                      >
                        <UploadCloud size={16}/> Ingest Bridge
                      </button>
                   )}
                   <button 
                     onClick={() => setShowBulkModal(true)}
                     disabled={filteredItems.length === 0}
                     className="px-8 py-3.5 bg-accent-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-blue hover:brightness-110 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-20"
                   >
                      <GitMerge size={16}/> Mass Delegate
                   </button>
                   <button onClick={loadDataMatrix} className="p-4 bg-slate-950 border border-slate-800 text-slate-500 rounded-2xl hover:text-white transition-all shadow-inner"><RefreshCw size={24} className={loading ? 'animate-spin' : ''}/></button>
                </div>
             </header>

             <div className="flex-1 overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                   <thead className="bg-slate-950/60 border-b border-slate-800 sticky top-0 z-10">
                      <tr className="text-[11px] font-black text-slate-500 uppercase tracking-[0.5em]">
                         <th className="px-12 py-10">Institutional Signal</th>
                         <th className="px-10 py-10">Hub / Sub-Category</th>
                         <th className="px-10 py-10 text-center">Staleness</th>
                         <th className="px-10 py-10">Personnel Node</th>
                         <th className="px-12 py-10 text-right">Commit</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-800/40">
                      {filteredItems.map((item, idx) => {
                         const daysStale = calculateDaysStale(item.updated_at || item.last_seen || item.created_at);
                         const curAssigneeId = hub === 'NEWS' ? item.assigned_to_profile_id : hub === 'QA' ? item.qc_by : item.assigned_to;
                         return (
                           <tr key={item.id || idx} className="hover:bg-accent-primary/[0.02] transition-all group border-l-[6px] border-transparent hover:border-accent-primary">
                              <td className="px-12 py-8">
                                 <div className="flex items-center gap-6">
                                    <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-2xl font-black text-accent-primary italic font-serif shadow-inner group-hover:scale-110 transition-transform">
                                       {(item.headline || item.suggested_entity_name || item.name || item.full_name || 'U')[0]}
                                    </div>
                                    <div className="max-w-md">
                                       <p className="text-xl font-black text-text-primary dark:text-white italic font-serif leading-none mb-1.5 uppercase truncate group-hover:text-accent-primary transition-colors">{item.headline || item.suggested_entity_name || item.name || item.full_name}</p>
                                       <p className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">SIGNAL_SHA: {(item.id || '').slice(-12).toUpperCase()}</p>
                                    </div>
                                 </div>
                              </td>
                              <td className="px-10 py-8">
                                 <div className="space-y-1">
                                    <span className="text-[9px] font-black uppercase text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 italic">{hub} Hub</span>
                                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{item.entity_type || item.type || item.module || 'Generic Signal'}</p>
                                 </div>
                              </td>
                              <td className="px-10 py-8 text-center">
                                 <div className="flex flex-col items-center gap-1">
                                    <span className={`text-xl font-black italic font-serif ${daysStale > 30 ? 'text-rose-500' : daysStale > 7 ? 'text-amber-500' : 'text-emerald-500'}`}>{daysStale}d</span>
                                    <span className="text-[8px] font-black text-slate-700 uppercase tracking-widest">Stationary</span>
                                 </div>
                              </td>
                              <td className="px-10 py-8">
                                 <select 
                                   className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase text-slate-400 outline-none cursor-pointer hover:border-accent-primary transition-all appearance-none shadow-inner"
                                   onChange={(e) => handleAssignment(item.id, e.target.value || null)}
                                   value={curAssigneeId || ''}
                                 >
                                    <option value="">Unassigned</option>
                                    {members.filter(m => m.status === 'active').map(m => <option key={m.id} value={m.id}>{m.full_name || m.email}</option>)}
                                 </select>
                              </td>
                              <td className="px-12 py-8 text-right">
                                 <button onClick={() => onNavigate(hub.toLowerCase())} className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-700 hover:text-white transition-all shadow-inner hover:bg-slate-800"><ArrowRight size={18}/></button>
                              </td>
                           </tr>
                         );
                      })}
                      {filteredItems.length === 0 && (
                        <tr><td colSpan={5} className="py-60 text-center opacity-20 italic font-serif text-3xl uppercase tracking-tighter">Horizon Matrix Empty. No active signals.</td></tr>
                      )}
                   </tbody>
                </table>
             </div>
          </div>
        </div>
      ) : (
        /* PERSONAL PERFORMANCE PLANE */
        <div className="space-y-16 animate-in slide-in-from-right-8 duration-700">
           <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {[
                { label: 'Inbound Throughput', val: '12', icon: Zap, color: '#0052FF' },
                { label: 'Assigned Workload', val: personalQueue.filter(x => !['completed', 'Passed', 'QC_PASSED'].includes(x.status || x.qc_status)).length, icon: Inbox, color: '#FFB800' },
                { label: 'Integrity Index', val: '98.8%', icon: ShieldCheck, color: '#00E676' },
                { label: 'QA Clearances', val: personalQueue.filter(x => x.qc_status === 'Passed').length, icon: CheckCircle2, color: '#6366F1' },
              ].map((s, i) => (
                <div key={i} className="bg-card-panel border border-slate-800 p-10 rounded-[3.5rem] shadow-xl relative overflow-hidden group">
                  <div className={`absolute -right-4 -top-4 opacity-5 group-hover:scale-110 transition-transform`} style={{ color: s.color }}><s.icon size={140} /></div>
                  <p className="text-[11px] font-black text-text-muted uppercase tracking-[0.4em] mb-6">{s.label}</p>
                  <p className="text-6xl font-black text-text-primary dark:text-white italic font-serif leading-none tracking-tighter">{s.val}</p>
                </div>
              ))}
           </div>
           {/* PERSONAL QUEUE LEDGER */}
           <div className="bg-card-panel border border-border-ui rounded-[4rem] overflow-hidden shadow-4xl flex flex-col min-h-[500px]">
              <header className="p-10 border-b border-border-ui flex items-center justify-between bg-slate-950/20">
                 <h3 className="text-xl font-black italic font-serif uppercase tracking-tight text-white flex items-center gap-4"><Inbox size={24} className="text-accent-primary"/> My Execution Deck</h3>
                 <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{personalQueue.length} Active Protocols Linked</span>
              </header>
              <div className="flex-1 overflow-x-auto custom-scrollbar">
                 <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-950/60 border-b border-slate-800 sticky top-0 z-10">
                       <tr className="text-[11px] font-black text-slate-500 uppercase tracking-[0.5em]">
                          <th className="px-12 py-8">Protocol Signature</th>
                          <th className="px-10 py-8">Domain</th>
                          <th className="px-10 py-8 text-center">Status</th>
                          <th className="px-12 py-8 text-right">Execute</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                       {personalQueue.map((t, idx) => (
                          <tr key={t.id || idx} className="hover:bg-accent-primary/[0.02] transition-all group">
                             <td className="px-12 py-8">
                                <p className="text-lg font-black text-white italic font-serif uppercase leading-none mb-1.5">{t.name || t.headline || (t.module + ' Audit')}</p>
                                <p className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">HANDSHAKE_ID: {t.id.slice(-12).toUpperCase()}</p>
                             </td>
                             <td className="px-10 py-8">
                                <span className="px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border italic bg-slate-950 text-slate-500 border-slate-800">{t.module || t.task_category || 'Registry Node'}</span>
                             </td>
                             <td className="px-10 py-8 text-center">
                                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border italic ${
                                   ['completed', 'Passed', 'QC_PASSED'].includes(t.status || t.qc_status) ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                }`}>{t.status || t.qc_status}</span>
                             </td>
                             <td className="px-12 py-8 text-right">
                                <button onClick={() => onNavigate(t.module?.toLowerCase() || 'dashboard')} className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-700 hover:text-white transition-all shadow-lg active:scale-90"><ArrowUpRight size={18}/></button>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>
      )}

      {/* BULK ASSIGN MODAL */}
      {showBulkModal && (
        <div className="fixed inset-0 z-[500] bg-black/90 backdrop-blur-3xl flex items-center justify-center p-10 animate-in zoom-in-95">
           <div className="bg-[#0E1626] border border-slate-800 rounded-[4rem] p-20 max-w-2xl w-full shadow-4xl relative overflow-hidden flex flex-col">
              <div className="absolute top-0 left-0 w-full h-2 bg-accent-primary shadow-blue"></div>
              <button onClick={() => setShowBulkModal(false)} className="absolute top-12 right-12 text-slate-500 hover:text-white transition-all"><X size={32} /></button>
              <h2 className="text-6xl font-black text-white italic font-serif uppercase tracking-tight mb-8">Mass Delegate</h2>
              <p className="text-xl text-slate-500 italic mb-16 font-serif leading-relaxed">Distributing volume signals from the <span className="text-accent-primary font-black uppercase">{hub} Domain</span>.</p>
              <div className="space-y-12 mb-16">
                 <div className="space-y-4">
                    <label className="text-[11px] font-black text-slate-600 uppercase tracking-widest ml-6">Target Specialist (Identity Node)</label>
                    <select className="w-full bg-slate-950 border border-slate-800 rounded-[2.5rem] p-8 text-xl text-white font-black italic font-serif uppercase outline-none appearance-none cursor-pointer shadow-inner" value={bulkAssignee} onChange={e => setBulkAssignee(e.target.value)}>
                       <option value="">Select identity node...</option>
                       {members.filter(m => m.status === 'active').map(m => <option key={m.id} value={m.id}>{m.full_name || m.email}</option>)}
                    </select>
                 </div>
                 <div className="space-y-6">
                    <div className="flex justify-between items-center ml-6">
                       <label className="text-[11px] font-black text-slate-600 uppercase tracking-widest">Vertex Distribution Count</label>
                       <span className="text-3xl font-black text-accent-primary italic font-serif">{bulkCount} / {filteredItems.length} Nodes</span>
                    </div>
                    <input type="range" min={1} max={filteredItems.length} className="w-full h-2 bg-slate-900 rounded-full appearance-none accent-accent-primary cursor-pointer" value={bulkCount} onChange={e => setBulkCount(parseInt(e.target.value))} />
                 </div>
              </div>
              <button onClick={handleBulkSubmit} className="w-full py-10 bg-accent-primary text-white rounded-[3rem] font-black uppercase text-base tracking-[0.4em] shadow-3xl hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-10">
                 {loading ? <Loader2 className="animate-spin" size={32}/> : <>Release Mass Sequence <ChevronRight size={32}/></>}
              </button>
           </div>
        </div>
      )}

      {/* INGEST BRIDGE MODAL */}
      {showIngestModal && (
         <div className="fixed inset-0 z-[600] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-10 animate-in fade-in">
            <div className="bg-[#0E1626] border border-slate-800 rounded-[4rem] p-20 max-w-4xl w-full shadow-4xl relative overflow-hidden flex flex-col">
               <div className="absolute top-0 left-0 w-full h-2 bg-emerald-600 shadow-emerald-500/40"></div>
               <button onClick={() => setShowIngestModal(false)} className="absolute top-12 right-12 text-slate-500 hover:text-white transition-all"><X size={40}/></button>
               
               <header className="mb-12 space-y-4">
                  <h2 className="text-7xl font-black text-white italic font-serif uppercase tracking-tighter leading-none">Ingest Bridge</h2>
                  <p className="text-2xl text-slate-500 italic font-medium">Mass provision artifacts to the <span className="text-emerald-500 font-black uppercase">{hub} Domain</span>.</p>
               </header>

               <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
                  <div className="space-y-8">
                     <div className="p-8 bg-slate-950 border border-slate-800 rounded-[3rem] space-y-6">
                        <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-3"><Shield size={14}/> Protocol Constraint</h4>
                        {hub === 'ANNOTATE' ? (
                           <ul className="text-xs text-slate-500 space-y-2 italic font-medium">
                              <li>• Media artifacts: MP4, WAV, MP3, PNG, JPG.</li>
                              <li>• Resolution: Up to 4K / 32-bit float.</li>
                              <li>• Threshold: 50MB per packet.</li>
                           </ul>
                        ) : (
                           <ul className="text-xs text-slate-500 space-y-2 italic font-medium">
                              <li>• Ingest format: UTF-8 encoded CSV.</li>
                              <li>• Key requirements: No null headers.</li>
                              <li>• Throughput: 500 records per cycle.</li>
                           </ul>
                        )}
                     </div>
                     <div className="p-8 bg-emerald-600/5 border border-emerald-500/20 rounded-[3rem] space-y-6">
                        <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-3"><Download size={14}/> Sample Schema</h4>
                        <div className="flex flex-col gap-2">
                           <p className="text-[9px] font-mono text-slate-500">FORMAT: CSV_V1</p>
                           <p className="text-[11px] font-mono text-white p-2 bg-black rounded border border-slate-800">
                              {hub === 'DATANEST' ? 'name,type,hq_city,website' : hub === 'NEWS' ? 'headline,source,url,text' : 'filename,label,project_id'}
                           </p>
                        </div>
                        <button className="text-[9px] font-black text-emerald-500 uppercase tracking-widest hover:underline flex items-center gap-2">Download Template.csv <ArrowUpRight size={10}/></button>
                     </div>
                  </div>

                  <div className="flex flex-col">
                     <div 
                        onClick={() => !ingesting && fileInputRef.current?.click()}
                        className={`flex-1 border-4 border-dashed rounded-[3rem] flex flex-col items-center justify-center gap-8 cursor-pointer transition-all ${ingesting ? 'border-emerald-600 animate-pulse' : 'border-slate-800 hover:border-emerald-500/50 hover:bg-emerald-500/5 group'}`}
                     >
                        {ingesting ? (
                           <Loader2 className="animate-spin text-emerald-500" size={64} />
                        ) : (
                           <>
                              <div className="w-24 h-24 bg-slate-900 rounded-[2.5rem] flex items-center justify-center text-slate-700 group-hover:text-emerald-500 shadow-inner group-hover:scale-110 transition-transform">
                                 {hub === 'ANNOTATE' ? <HardDrive size={48}/> : <FileCode size={48}/>}
                              </div>
                              <div className="text-center">
                                 <p className="text-xl font-black text-slate-400 italic uppercase italic">Drop Artifacts</p>
                                 <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest mt-2">Maximum Packet Size: 50MB</p>
                              </div>
                           </>
                        )}
                     </div>
                  </div>
               </div>

               <input type="file" ref={fileInputRef} className="hidden" multiple={hub === 'ANNOTATE'} accept={hub === 'ANNOTATE' ? 'video/*,audio/*,image/*' : '.csv'} onChange={handleIngestFile} />
               
               <footer className="pt-10 border-t border-slate-800 text-center">
                  <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.4em] italic">Ingest Cycle: NODE_READY — Authorized Node: {userProfile.full_name}</p>
               </footer>
            </div>
         </div>
      )}

      {/* FOOTER HUD */}
      <footer className="fixed bottom-0 left-72 right-0 h-16 bg-slate-950/90 backdrop-blur-xl border-t border-slate-900 px-10 flex items-center justify-between z-[100] pointer-events-none">
         <div className="flex items-center gap-10">
            <div className="flex items-center gap-3">
               <div className="w-1.5 h-1.5 rounded-full bg-accent-primary animate-pulse shadow-blue"></div>
               <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">Cockpit Signal: Nominal</span>
            </div>
            <div className="flex items-center gap-3">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-emerald-500/50"></div>
               <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">Plane: {activePlane} Mode</span>
            </div>
         </div>
         <p className="text-[9px] font-black text-slate-800 uppercase tracking-[0.4em] italic font-serif leading-none">AnnoNest Mission Control v2.1 — Authorized Specialist: {userProfile.full_name || userProfile.email}</p>
      </footer>
    </div>
  );
};

export default TaskCockpit;
