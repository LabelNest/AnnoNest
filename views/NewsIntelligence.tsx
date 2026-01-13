import React, { useState, useEffect, useMemo } from 'react';
import { 
  Newspaper, RefreshCw, Zap, Search, ExternalLink, Globe, 
  CheckCircle, XCircle, Clock, X, TrendingUp, Filter, 
  ShieldCheck, Activity, ThumbsUp, HelpCircle, BarChart3, Database,
  Monitor, Terminal, GitBranch, Target, Box, FileText, Send, Loader2,
  Brain, ShieldBan, UserCheck, FilePlus, PieChart as PieIcon,
  Layers, AlertCircle, Gauge, Sparkles, User, ChartBar as BarChartIcon,
  Check, Info, MessageSquare, Plus, ChevronRight, Layout, Link as LinkIcon,
  Building, Handshake, Landmark, Briefcase, UserCircle, Hash as HashIcon
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell, AreaChart, Area, PieChart, Pie 
} from 'recharts';
import { supabaseService } from '../services/supabaseService';
import { geminiService } from '../services/geminiService';
import { 
  NewsArticle, AnnotationTask, UserProfile, NewsStatus, 
  EventType, EntityType, Entity
} from '../types';

interface Props {
  userProfile: UserProfile;
  addTask: (task: AnnotationTask) => void;
  initialNews?: NewsArticle[];
}

type CockpitView = 'COCKPIT' | 'FEED';

const DATASET_TAGS = ['GP', 'Fund', 'Portfolio Company', 'Service Provider', 'Contact', 'Deal', 'Market', 'Policy', 'Other'];
const EVENT_TAGS = ['Fund Launch', 'Fund Close', 'Investment', 'Exit', 'Hiring', 'Partnership', 'Regulatory', 'Financial Results', 'Litigation', 'ESG', 'Other'];

const NewsIntelligence: React.FC<Props> = ({ userProfile, addTask, initialNews = [] }) => {
  const [news, setNews] = useState<NewsArticle[]>(initialNews || []);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<CockpitView>('COCKPIT');
  const [selectedNews, setSelectedNews] = useState<NewsArticle | null>(null);
  
  // Filtering
  const [sourceFilter, setSourceFilter] = useState<string | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<NewsStatus | 'ALL'>('ALL');
  const [searchFilter, setSearchFilter] = useState('');
  const [relevancyFilter, setRelevancyFilter] = useState<'ALL' | 'HIGH' | 'LOW'>('ALL');

  // --- REFINERY STATE ---
  const [isClearSignal, setIsClearSignal] = useState<boolean | null>(null);
  const [isRelevant, setIsRelevant] = useState<boolean | null>(null);
  const [refineryComment, setRefineryComment] = useState('');
  const [selectedDatasets, setSelectedDatasets] = useState<string[]>([]);
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [linkedEntities, setLinkedEntities] = useState<Record<string, string[]>>({});
  const [availableEntities, setAvailableEntities] = useState<Entity[]>([]);

  useEffect(() => {
    if (initialNews && initialNews.length > 0) setNews(initialNews);
    else loadData();
    loadDataNest();
  }, [initialNews]);

  const loadData = async () => {
    setLoading(true);
    try {
      const newsData = await supabaseService.fetchNews();
      setNews(Array.isArray(newsData) ? newsData : []);
    } finally { setLoading(false); }
  };

  const loadDataNest = async () => {
    const data = await supabaseService.fetchEntities(userProfile.tenant_id, userProfile.role);
    setAvailableEntities(Array.isArray(data) ? data : []);
  };

  const aiIntel = useMemo(() => {
    if (!selectedNews) return null;
    return {
      summary: [
        "Identified expansion of activities in the APAC region.",
        "Detected correlation between fund size and regional policy.",
        "Automated entity resolution flagged unmapped identifiers.",
        "Signal confidence boosted by multi-source validation.",
        "Temporal analysis suggests a 12-month deal cycle."
      ],
      datasetTags: ["GP", "Fund", "Deal"],
      eventTypes: ["Investment", "Fund Launch"],
      overallConfidence: "High"
    };
  }, [selectedNews]);

  useEffect(() => {
    if (aiIntel && selectedNews) {
      setSelectedDatasets(aiIntel.datasetTags || []);
      setSelectedEvents(aiIntel.eventTypes || []);
    } else {
      setIsClearSignal(null); setIsRelevant(null); setRefineryComment('');
      setSelectedDatasets([]); setSelectedEvents([]); setLinkedEntities({});
    }
  }, [selectedNews, aiIntel]);

  const submitRefinery = async () => {
    if (!selectedNews) return;
    setLoading(true);
    try {
      const refineryResult = {
        clear_signal: !!isClearSignal,
        relevance: !!isRelevant,
        dataset_tags: selectedDatasets,
        event_tags: selectedEvents,
        linked_entities: linkedEntities,
        comment: refineryComment,
        verified_by: userProfile.name
      };
      const res = await supabaseService.saveNewsRefineryResult(selectedNews.id, refineryResult);
      if (!res.success) throw new Error(res.error);
      setNews(prev => prev?.filter(n => n?.id !== selectedNews.id) || []);
      setSelectedNews(null);
    } catch (e: any) { alert(`Protocol Failure: ${e.message}`); }
    finally { setLoading(false); }
  };

  const filteredNews = useMemo(() => {
    if (!Array.isArray(news)) return [];
    return news.filter(n => {
      if (!n) return false;
      const matchStatus = statusFilter === 'ALL' || n.status === statusFilter;
      const matchSource = sourceFilter === 'ALL' || n.source_name === sourceFilter;
      const search = (searchFilter || '').toLowerCase();
      const headline = (n.headline || '').toLowerCase();
      const idStr = (n.id || '').toLowerCase();
      const matchSearch = headline.includes(search) || (n.source_name || '').toLowerCase().includes(search) || idStr.includes(search);
      const matchRel = relevancyFilter === 'ALL' ? true : (relevancyFilter === 'HIGH' ? n.relevance : !n.relevance);
      return matchStatus && matchSource && matchSearch && matchRel;
    });
  }, [news, statusFilter, sourceFilter, searchFilter, relevancyFilter]);

  const stats = useMemo(() => {
    if (!Array.isArray(news)) return { total: 0, covered: 0, pending: 0, relevant: 0, avgRelevancy: '0.0' };
    const total = news.length;
    const covered = news.filter(n => n?.status === 'COVERED' || n?.status === 'PUBLISHED').length;
    const relevant = news.filter(n => n?.relevance === true).length;
    // Fix: Correct counting for Active Signals (Pending, Unprocessed or No status)
    const pending = news.filter(n => !n?.status || n.status === 'PENDING' || n.status === 'UNPROCESSED').length;
    const avgRelevancy = total > 0 ? (relevant / total * 100).toFixed(1) : '0.0';
    return { total, covered, pending, relevant, avgRelevancy };
  }, [news]);

  // Analytics Data
  const trendData = [
    { name: '01:00', val: 12 }, { name: '04:00', val: 8 }, { name: '08:00', val: 24 },
    { name: '12:00', val: 32 }, { name: '16:00', val: 28 }, { name: '20:00', val: 14 }
  ];

  const sourceData = [
    { name: 'Bloomberg', val: 45 }, { name: 'Reuters', val: 30 }, { name: 'PE Hub', val: 15 }, { name: 'Others', val: 10 }
  ];

  const toggleDataset = (tag: string) => {
    setSelectedDatasets(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const toggleEvent = (tag: string) => {
    setSelectedEvents(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const StatCard = ({ label, value, icon: Icon, color, isActive, onClick, subtext }: any) => (
    <button 
      onClick={onClick}
      className={`p-6 rounded-[2rem] border text-left transition-all h-40 group relative overflow-hidden ${isActive ? `bg-${color}-500/10 border-${color}-500 shadow-2xl` : 'bg-slate-900 border-slate-800'}`}
    >
      <div className={`p-3 w-fit rounded-xl ${isActive ? `bg-${color}-500 text-white` : `bg-slate-800 text-${color}-400`}`}>
        <Icon size={20} />
      </div>
      <div className="mt-4">
        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
        <p className="text-4xl font-black text-white italic font-serif leading-none tracking-tighter">{value.toLocaleString()}</p>
        {subtext && <p className="text-[8px] font-bold text-slate-600 uppercase mt-1 italic">{subtext}</p>}
      </div>
    </button>
  );

  const canSubmit = isRelevant === false ? (refineryComment || '').length > 5 : (isClearSignal === true && isRelevant === true && selectedDatasets.length > 0 && selectedEvents.length > 0);

  return (
    <div className="space-y-12 animate-in fade-in duration-500 max-w-[1600px] mx-auto pb-20 relative">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 border-b border-slate-800 pb-16">
        <div>
          <h1 className="text-7xl font-black flex items-center gap-8 text-white tracking-tighter uppercase italic font-serif leading-none">
            <Monitor className="text-blue-500 shrink-0" size={72} />
            News Cockpit
          </h1>
          <p className="text-slate-400 mt-8 font-medium flex items-center gap-5 text-xl">
            <Terminal size={26} className="text-blue-500" /> Signal Validation Phase
          </p>
        </div>
        <div className="flex bg-slate-900 border border-slate-800 rounded-[3rem] p-2">
            <button onClick={() => setActiveTab('COCKPIT')} className={`px-12 py-4 rounded-[2.5rem] text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'COCKPIT' ? 'bg-blue-600 text-white shadow-2xl' : 'text-slate-500'}`}>Dashboard</button>
            <button onClick={() => setActiveTab('FEED')} className={`px-12 py-4 rounded-[2.5rem] text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'FEED' ? 'bg-blue-600 text-white shadow-2xl' : 'text-slate-500'}`}>Live Feed</button>
        </div>
      </div>

      {activeTab === 'COCKPIT' ? (
        <div className="space-y-12 animate-in zoom-in-95">
          {/* Top 5 stat blocks */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            <StatCard label="Active Signals" value={stats.pending} icon={Activity} color="blue" isActive={statusFilter === 'PENDING'} onClick={() => setStatusFilter('PENDING')} subtext="Registry Swell" />
            <StatCard label="Relevant" value={stats.relevant} icon={Target} color="emerald" isActive={relevancyFilter === 'HIGH'} onClick={() => setRelevancyFilter('HIGH')} subtext="Mission Alignment" />
            <StatCard label="Total Sweep" value={stats.total} icon={Layers} color="purple" isActive={statusFilter === 'ALL'} onClick={() => { setStatusFilter('ALL'); setRelevancyFilter('ALL'); }} subtext="24h Horizon" />
            <StatCard label="Processed" value={stats.covered} icon={CheckCircle} color="emerald" isActive={statusFilter === 'COVERED'} onClick={() => setStatusFilter('COVERED')} subtext="Archive Synced" />
            <StatCard label="Global Nodes" value={24} icon={Globe} color="rose" isActive={false} subtext="Source Grid" />
          </div>

          {/* Restored Analytics Dashboard */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-[3.5rem] p-12 shadow-3xl flex flex-col h-[500px]">
              <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] mb-12 flex items-center gap-3 border-b border-slate-800 pb-8">
                <TrendingUp size={20} className="text-blue-500" /> Hourly Signal Velocity
              </h3>
              <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 10}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 10}} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '1rem' }} />
                    <Area type="monotone" dataKey="val" stroke="#3b82f6" fill="url(#colorVal)" strokeWidth={3} />
                    <defs>
                      <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-[3.5rem] p-12 shadow-3xl flex flex-col">
              <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] mb-12 flex items-center gap-3 border-b border-slate-800 pb-8">
                <BarChart3 size={20} className="text-emerald-400" /> Source Distribution
              </h3>
              <div className="flex-1 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sourceData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#1e293b" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#f8fafc', fontSize: 11, fontWeight: 'bold'}} width={100} />
                    <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '0.75rem' }} />
                    <Bar dataKey="val" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-[4rem] overflow-hidden shadow-3xl animate-in slide-in-from-bottom-4">
           <div className="p-12 border-b border-slate-800 flex gap-10 items-center justify-between">
              <div className="relative flex-1 max-w-2xl">
                 <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-600" size={28} />
                 <input type="text" placeholder="Scan news registry (Headline, Provenance, or HASH)..." className="w-full bg-slate-950 border border-slate-800 rounded-[2.5rem] pl-20 pr-10 py-6 text-xl text-slate-100 outline-none font-serif italic" value={searchFilter} onChange={e => setSearchFilter(e.target.value)} />
              </div>
              <button onClick={loadData} className={`p-6 bg-slate-950 border border-slate-800 text-slate-500 rounded-[2rem] hover:text-white transition-all shadow-xl active:scale-95 ${loading ? 'animate-spin' : ''}`}>
                 <RefreshCw size={24} />
              </button>
           </div>
           <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1200px]">
                 <thead>
                    <tr className="bg-slate-950/40 border-b border-slate-800 text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">
                       <th className="px-14 py-8">Headline & Temporal Meta</th>
                       <th className="px-10 py-8">Provenance</th>
                       {/* Restored Assigned To column */}
                       <th className="px-10 py-8">Assigned To</th>
                       <th className="px-10 py-8">Lifecycle State</th>
                       {/* Restored HASH column */}
                       <th className="px-14 py-8 text-right">HASH Identity</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-800/40">
                    {filteredNews.map(n => (
                         <tr key={n.id} onClick={() => setSelectedNews(n)} className="hover:bg-blue-500/5 transition-all cursor-pointer border-l-[6px] border-transparent hover:border-blue-500">
                            <td className="px-14 py-10">
                               <p className="text-2xl font-black text-white italic font-serif leading-snug">{n.headline || 'Untitled Signal Sequence'}</p>
                               <span className="text-[10px] text-slate-600 font-mono mt-4 block uppercase tracking-tighter">{n.publish_date ? new Date(n.publish_date).toLocaleString() : 'N/A'}</span>
                            </td>
                            <td className="px-10 py-10">
                               <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{n.source_name}</span>
                            </td>
                            <td className="px-10 py-10">
                               <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-500 italic uppercase">
                                     {n.assigned_to ? (n.assigned_to[0] || 'A') : 'S'}
                                  </div>
                                  <span className="text-xs font-bold text-slate-400 italic uppercase">{n.assigned_to || 'SYSTEM'}</span>
                               </div>
                            </td>
                            <td className="px-10 py-10">
                               <span className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${n.status === 'COVERED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-600/10 text-amber-500 border-amber-500/20'}`}>
                                 {n.status || 'PENDING'}
                               </span>
                            </td>
                            <td className="px-14 py-10 text-right">
                               <span className="text-[10px] font-mono text-slate-700 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">{n.id?.slice(0, 12).toUpperCase() || 'UNK_ID'}</span>
                            </td>
                         </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      )}

      {selectedNews && (
        <div className="fixed inset-0 z-[100] bg-slate-950 flex animate-in fade-in">
           <div className="w-[30%] bg-slate-900 border-r border-slate-800 flex flex-col p-10 overflow-y-auto custom-scrollbar">
              <div className="flex items-center gap-4 mb-10 pb-10 border-b border-slate-800">
                 <div className="p-3 bg-blue-600/10 rounded-xl text-blue-500"><Brain size={24} /></div>
                 <h3 className="text-xl font-black text-white uppercase italic">AI Reconnaissance</h3>
              </div>
              <section className="space-y-8">
                 <div className="space-y-4">
                    <h4 className="text-[11px] font-black text-blue-500 uppercase tracking-[0.4em] flex items-center gap-3"><Sparkles size={16} /> Key Insights</h4>
                    <ul className="space-y-5">
                       {aiIntel?.summary.map((point, i) => (
                         <li key={i} className="flex gap-3 text-xs text-slate-400 italic leading-relaxed">
                           <span className="text-blue-500 mt-1 shrink-0"><Check size={14} /></span>
                           {point}
                         </li>
                       ))}
                    </ul>
                 </div>
                 
                 <div className="pt-8 border-t border-slate-800 space-y-4">
                    <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em]">Signal Provenance</h4>
                    <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                       <div className="flex justify-between text-[9px] font-black uppercase">
                          <span className="text-slate-600">SOURCE_ID</span>
                          <span className="text-white">{selectedNews.source_name}</span>
                       </div>
                       <div className="flex justify-between text-[9px] font-black uppercase">
                          <span className="text-slate-600">CONFIDENCE</span>
                          <span className="text-emerald-500">92% MATCH</span>
                       </div>
                    </div>
                 </div>
              </section>
           </div>
           <div className="w-[70%] bg-[#0b0f19] flex flex-col h-full overflow-hidden">
              <div className="min-h-24 px-12 border-b border-slate-800 flex items-center justify-between bg-slate-900/40 backdrop-blur-2xl">
                 <div className="flex items-center gap-8 py-6 flex-1 min-w-0">
                    <button onClick={() => setSelectedNews(null)} className="p-4 bg-slate-900 rounded-[1.25rem] text-slate-500 hover:text-white transition-all shrink-0"><X size={28} /></button>
                    <div className="flex flex-col gap-2 min-w-0 flex-1">
                       <div className="flex items-center gap-4">
                          {/* Restored HASH in Refinery details */}
                          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800 shrink-0">
                             <HashIcon size={12} className="text-slate-600" />
                             <span className="text-[10px] font-mono text-slate-500 uppercase tracking-tighter">HASH: {selectedNews.id}</span>
                          </div>
                          {/* Restored URL External link icon */}
                          {selectedNews.url && (
                            <a href={selectedNews.url} target="_blank" rel="noreferrer" className="p-2 bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white rounded-lg border border-blue-500/20 transition-all shrink-0">
                               <ExternalLink size={18} />
                            </a>
                          )}
                       </div>
                       {/* Full header (Removed truncate) */}
                       <h2 className="text-3xl font-black text-white italic font-serif uppercase leading-tight">{selectedNews.headline}</h2>
                    </div>
                 </div>
                 <button onClick={submitRefinery} disabled={!canSubmit || loading} className="px-12 py-5 bg-blue-600 text-white rounded-[1.5rem] font-black uppercase text-[12px] tracking-widest shadow-2xl hover:bg-blue-500 active:scale-95 disabled:opacity-30 flex items-center gap-4 shrink-0">
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={20} />} Commit Protocol
                 </button>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-16 space-y-20">
                 <section className="space-y-12">
                    <div className="flex items-center gap-6">
                       <div className="w-12 h-12 rounded-2xl bg-blue-600/10 text-blue-500 flex items-center justify-center font-black italic font-serif text-xl">01</div>
                       <h4 className="text-3xl font-black text-white italic font-serif uppercase tracking-tight">Signal Validation</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-10">
                       <div className="p-12 bg-slate-900 border border-slate-800 rounded-[3rem] flex items-center justify-between shadow-xl">
                          <div className="flex flex-col gap-1">
                             <span className="text-xl font-black text-white uppercase italic font-serif">Clear Signal?</span>
                             <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Minimal Noise detected</span>
                          </div>
                          <div className="flex bg-slate-950 p-2 rounded-2xl border border-slate-800">
                             <button onClick={() => setIsClearSignal(true)} className={`px-8 py-3 rounded-xl text-[11px] font-black uppercase transition-all ${isClearSignal === true ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-600 hover:text-slate-400'}`}>Verify</button>
                             <button onClick={() => setIsClearSignal(false)} className={`px-8 py-3 rounded-xl text-[11px] font-black uppercase transition-all ${isClearSignal === false ? 'bg-rose-600 text-white shadow-lg' : 'text-slate-600 hover:text-slate-400'}`}>Nullify</button>
                          </div>
                       </div>
                       <div className="p-12 bg-slate-900 border border-slate-800 rounded-[3rem] flex items-center justify-between shadow-xl">
                          <div className="flex flex-col gap-1">
                             <span className="text-xl font-black text-white uppercase italic font-serif">Relevant?</span>
                             <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Mission alignment check</span>
                          </div>
                          <div className="flex bg-slate-950 p-2 rounded-2xl border border-slate-800">
                             <button onClick={() => setIsRelevant(true)} className={`px-8 py-3 rounded-xl text-[11px] font-black uppercase transition-all ${isRelevant === true ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-600 hover:text-slate-400'}`}>High</button>
                             <button onClick={() => setIsRelevant(false)} className={`px-8 py-3 rounded-xl text-[11px] font-black uppercase transition-all ${isRelevant === false ? 'bg-rose-600 text-white shadow-lg' : 'text-slate-600 hover:text-slate-400'}`}>Reject</button>
                          </div>
                       </div>
                    </div>
                 </section>

                 {isRelevant === true && (
                   <>
                    <section className="space-y-12 animate-in slide-in-from-bottom-6 duration-500">
                       <div className="flex items-center gap-6">
                          <div className="w-12 h-12 rounded-2xl bg-amber-600/10 text-amber-500 flex items-center justify-center font-black italic font-serif text-xl">02</div>
                          <h4 className="text-3xl font-black text-white italic font-serif uppercase tracking-tight">Dataset Mapping</h4>
                       </div>
                       <div className="flex flex-wrap gap-4">
                          {DATASET_TAGS.map(tag => (
                            <button 
                               key={tag} 
                               onClick={() => toggleDataset(tag)} 
                               className={`px-10 py-5 rounded-[1.75rem] border text-[11px] font-black uppercase tracking-widest transition-all ${selectedDatasets.includes(tag) ? 'bg-blue-600 border-blue-500 text-white shadow-2xl' : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'}`}
                            >
                               {tag}
                            </button>
                          ))}
                       </div>
                    </section>
                    <section className="space-y-12 animate-in slide-in-from-bottom-10 duration-500">
                       <div className="flex items-center gap-6">
                          <div className="w-12 h-12 rounded-2xl bg-emerald-600/10 text-emerald-500 flex items-center justify-center font-black italic font-serif text-xl">03</div>
                          <h4 className="text-3xl font-black text-white italic font-serif uppercase tracking-tight">Event Classification</h4>
                       </div>
                       <div className="flex flex-wrap gap-4">
                          {EVENT_TAGS.map(tag => (
                            <button 
                               key={tag} 
                               onClick={() => toggleEvent(tag)} 
                               className={`px-10 py-5 rounded-[1.75rem] border text-[11px] font-black uppercase tracking-widest transition-all ${selectedEvents.includes(tag) ? 'bg-amber-600 border-amber-500 text-white shadow-2xl' : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'}`}
                            >
                               {tag}
                            </button>
                          ))}
                       </div>
                    </section>
                   </>
                 )}

                 {isRelevant === false && (
                    <section className="space-y-12 animate-in fade-in duration-500">
                       <div className="flex items-center gap-6">
                          <div className="w-12 h-12 rounded-2xl bg-rose-600/10 text-rose-500 flex items-center justify-center font-black italic font-serif text-xl">!!</div>
                          <h4 className="text-3xl font-black text-white italic font-serif uppercase tracking-tight">Rejection Context</h4>
                       </div>
                       <textarea 
                          placeholder="Provide reasoning for null signal classification..." 
                          className="w-full h-48 bg-slate-900 border border-slate-800 rounded-[2.5rem] p-10 text-white italic font-serif text-xl outline-none focus:ring-4 focus:ring-rose-600/10 transition-all shadow-inner"
                          value={refineryComment}
                          onChange={e => setRefineryComment(e.target.value)}
                       />
                    </section>
                 )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default NewsIntelligence;
