import React, { useState, useEffect, useMemo } from 'react';
import { 
  Newspaper, RefreshCw, Search, ExternalLink, 
  CheckCircle, XCircle, Clock, X, TrendingUp, Filter, 
  Terminal, Monitor, Layers, Sparkles, Check, Info, 
  ChevronRight, ArrowRight, Loader2, Gauge,
  Tag as TagIcon, Link as LinkIcon, History,
  ShieldCheck, AlertCircle, Calendar, ArrowLeft,
  MessageSquare, Brain, Plus, Trash2, Building2,
  GitMerge, User, Briefcase, Globe,
  Database, Zap, Landmark, SearchCheck, Edit2, Lock,
  PlusCircle, LayoutGrid, Landmark as LandmarkIcon,
  Save, FileText, SearchCode, Tag, SortAsc, SortDesc, UserSearch
} from 'lucide-react';
import { supabaseService } from '../services/supabaseService';
import { NewsArticle, UserProfile, ActionType, EntityType, Entity, EventType } from '../types';
import { geminiService } from '../services/geminiService';

const CockpitView = { DASHBOARD: 'DASHBOARD', FEED: 'FEED' } as const;
type CockpitView = typeof CockpitView[keyof typeof CockpitView];

const REFINERY_VERSION = "v1.1";

const EVENT_TAXONOMY = [
  { id: 'FUNDRAISING', label: '💰 Fundraising', color: 'indigo' },
  { id: 'DEAL_INVESTMENT', label: '🧾 Deal / Investment', color: 'blue' },
  { id: 'MERGER_ACQUISITION', label: '🔄 Merger & Acquisition', color: 'sky' },
  { id: 'PEOPLE_MOVE', label: '👥 People Move', color: 'emerald' },
  { id: 'EXIT', label: '🚪 Exit', color: 'rose' },
  { id: 'FUND_OPERATIONS', label: '🏦 Fund Operations', color: 'amber' },
  { id: 'REGULATORY_LEGAL', label: '⚖️ Regulatory & Legal', color: 'slate' },
  { id: 'FINANCIAL_PERFORMANCE', label: '📊 Financial Performance', color: 'green' },
  { id: 'STRATEGY_BUSINESS', label: '🧠 Strategy & Business', color: 'violet' },
  { id: 'ESG_IMPACT', label: '🌍 ESG & Impact', color: 'teal' },
  { id: 'PARTNERSHIPS', label: '🤝 Partnerships', color: 'cyan' },
  { id: 'OPERATIONAL', label: '🔧 Operational', color: 'orange' },
  { id: 'OTHER', label: '🧪 Other', color: 'slate' },
] as const;

interface Props {
  userProfile: UserProfile;
  userMap: Record<string, string>;
  initialNews?: NewsArticle[];
  onSync?: () => void;
}

const NewsIntelligence: React.FC<Props> = ({ userProfile, userMap, initialNews = [], onSync }) => {
  const [news, setNews] = useState<NewsArticle[]>(initialNews);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<CockpitView>('FEED');
  const [selectedNews, setSelectedNews] = useState<NewsArticle | null>(null);
  
  const [searchFilter, setSearchFilter] = useState('');
  const [specialistFilter, setSpecialistFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [pulseSourceFilter, setPulseSourceFilter] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');

  const [relevancy, setRelevancy] = useState<'RELEVANT' | 'NOT_RELEVANT' | null>(null);
  const [rejectionComment, setRejectionComment] = useState('');
  
  const [selectedActions, setSelectedActions] = useState<Set<ActionType>>(new Set());
  const [selectedDatasets, setSelectedDatasets] = useState<Set<EntityType>>(new Set());
  const [selectedEvents, setSelectedEvents] = useState<Set<EventType>>(new Set());
  
  const [entitySearch, setEntitySearch] = useState('');
  const [mappedEntity, setMappedEntity] = useState<Entity | null>(null);

  const [localRawText, setLocalRawText] = useState('');
  
  const [aiSuggestions, setAiSuggestions] = useState<{name: string, type: string, reason: string}[]>([]);
  const [approvedSuggestions, setApprovedSuggestions] = useState<Set<number>>(new Set());
  const [loadingAI, setLoadingAI] = useState(false);
  
  const [showManualIntake, setShowManualIntake] = useState(false);
  const [manualShell, setManualShell] = useState({ name: '', type: EntityType.GP });

  const [committing, setCommitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [newsData, entityData] = await Promise.all([
        supabaseService.fetchNews(userProfile.tenant_id),
        supabaseService.fetchEntities(userProfile.tenant_id)
      ]);
      setNews(newsData);
      setEntities(entityData);
    } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, [userProfile.tenant_id]);

  useEffect(() => {
    if (selectedNews) {
      setRelevancy(null);
      setRejectionComment('');
      setSelectedActions(new Set());
      setSelectedDatasets(new Set());
      setSelectedEvents(new Set());
      setMappedEntity(null);
      setEntitySearch('');
      setLocalRawText(selectedNews.raw_text || '');
      setApprovedSuggestions(new Set());
      setShowManualIntake(false);
      if (selectedNews.raw_text || selectedNews.clean_text) fetchAISuggestions(selectedNews);
    }
  }, [selectedNews]);

  const fetchAISuggestions = async (item: NewsArticle, overrideText?: string) => {
    setLoadingAI(true);
    try {
      const textToAnalyze = overrideText || item.raw_text || item.clean_text || '';
      const suggestions = await geminiService.extractEntities(`Perform entity mapping for financial news. Headline: ${item.headline}. Text: ${textToAnalyze}`);
      setAiSuggestions(suggestions.map((s: any) => ({ name: s.name, type: s.type, reason: s.summary || "Extracted from signal." })));
    } catch (e) { 
      console.error("AI insights Error:", e); 
      setAiSuggestions([]);
    } finally { setLoadingAI(false); }
  };

  const handleManualShellCreate = async () => {
    if (!manualShell.name) return;
    setCommitting(true);
    const res = await supabaseService.createEntityShell({
      name: manualShell.name,
      type: manualShell.type,
      status: 'intake',
      tenant_id: userProfile.tenant_id,
      source: 'REFINERY_MANUAL'
    });
    /** Fix: Changed .success to !res.error for PostgrestResponse compatibility */
    if (!res.error) {
      alert("Registry Intake Initiated: Shell record queued for clearance.");
      setShowManualIntake(false);
      setManualShell({ name: '', type: EntityType.GP });
    }
    setCommitting(false);
  };

  const handleCommitReview = async () => {
    if (!selectedNews || !relevancy) return;
    if (relevancy === 'NOT_RELEVANT' && !rejectionComment) return;
    
    setCommitting(true);
    const result = await supabaseService.commitNewsReview(selectedNews.id, {
      processing_status: relevancy === 'RELEVANT' ? 'COMPLETED_RELEVANT' : 'COMPLETED_NOT_RELEVANT',
      reviewed_by: userProfile.user_id,
      action_types: Array.from(selectedActions),
      raw_text: localRawText || selectedNews.raw_text,
      review_metadata: {
        rejection_reason: rejectionComment,
        target_registries: Array.from(selectedDatasets),
        event_types: Array.from(selectedEvents),
        mapped_entity_id: mappedEntity?.id,
        mapped_entity_name: mappedEntity?.name,
        verified_at: new Date().toISOString()
      }
    });
    /** Fix: Changed .success to !result.error for PostgrestResponse compatibility */
    if (!result.error) {
      if (onSync) onSync();
      loadData();
      setSelectedNews(null);
    }
    setCommitting(false);
  };

  const stats = useMemo(() => {
    const pendingCount = news.filter(n => !n.processing_status || n.processing_status === 'PENDING').length;
    const relevantCount = news.filter(n => n.processing_status === 'COMPLETED_RELEVANT').length;
    const notRelevantCount = news.filter(n => n.processing_status === 'COMPLETED_NOT_RELEVANT').length;
    
    const sourcesMap = new Map<string, { total: number, relevant: number, completed: number }>();
    news.forEach(n => {
      const sName = n.source_name || 'UNKNOWN';
      const cur = sourcesMap.get(sName) || { total: 0, relevant: 0, completed: 0 };
      cur.total++;
      if (n.processing_status === 'COMPLETED_RELEVANT') cur.relevant++;
      if (n.processing_status && n.processing_status !== 'PENDING') cur.completed++;
      sourcesMap.set(sName, cur);
    });

    const sourceMetricsList = Array.from(sourcesMap.entries()).map(([name, s]) => ({
      name, 
      total: s.total, 
      relevancyYield: parseFloat(((s.relevant / (s.total || 1)) * 100).toFixed(1)),
      completionRate: parseFloat(((s.completed / (s.total || 1)) * 100).toFixed(1))
    })).sort((a,b) => b.total - a.total);
    
    return { pending: pendingCount, relevant: relevantCount, notRelevant: notRelevantCount, total: news.length, sourceMetricsList };
  }, [news]);

  const uniqueSources = useMemo(() => {
    return Array.from(new Set(news.map(n => n.source_name || 'UNKNOWN'))).sort();
  }, [news]);

  const processedNews = useMemo(() => {
    return news
      .filter(n => {
        const matchSearch = n.headline.toLowerCase().includes(searchFilter.toLowerCase());
        const matchSpecialist = specialistFilter === 'ALL' || n.assigned_to_profile_id === specialistFilter;
        const matchStatus = statusFilter === 'ALL' || (n.processing_status || 'PENDING') === statusFilter;
        return matchSearch && matchSpecialist && matchStatus;
      })
      .sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return sortOrder === 'DESC' ? dateB - dateA : dateA - dateB;
      });
  }, [news, searchFilter, specialistFilter, statusFilter, sortOrder]);

  const toggleSetItem = (set: Set<any>, setter: (s: Set<any>) => void, item: any) => {
    const next = new Set(set);
    if (next.has(item)) next.delete(item);
    else next.add(item);
    setter(next);
  };

  const filteredEntities = useMemo(() => {
    if (!entitySearch) return [];
    return entities.filter(e => e.name.toLowerCase().includes(entitySearch.toLowerCase())).slice(0, 5);
  }, [entities, entitySearch]);

  if (selectedNews) {
    return (
      <div className="fixed inset-0 z-[140] bg-white dark:bg-[#0B1220] animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col overflow-hidden">
        <header className="h-20 border-b border-border-ui dark:border-[#1E293B] px-10 flex items-center justify-between shrink-0 bg-white/80 dark:bg-[#0B1220]/80 backdrop-blur-md">
           <button onClick={() => setSelectedNews(null)} className="flex items-center gap-3 px-6 py-2.5 bg-slate-100 dark:bg-[#0F1B2D] border border-border-ui dark:border-[#1E293B] rounded-2xl text-[11px] font-black uppercase text-text-secondary hover:text-white transition-all group">
             <ArrowLeft size={16} className="group-hover:-translate-x-1" /> Back to Feed
           </button>
           <div className="flex items-center gap-4">
              <span className="text-[10px] font-black text-text-muted bg-slate-100 dark:bg-[#0F1B2D] px-4 py-1.5 rounded-lg border border-border-ui dark:border-[#1E293B] uppercase tracking-widest italic italic">SPECIALIST: {userMap[selectedNews.assigned_to_profile_id || ''] || 'UNCLAIMED'}</span>
              <span className="text-[10px] font-black text-text-muted bg-slate-100 dark:bg-[#0F1B2D] px-4 py-1.5 rounded-lg border border-border-ui dark:border-[#1E293B] uppercase tracking-widest">REFINERY: {REFINERY_VERSION}</span>
           </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-10 py-16">
          <div className="max-w-[1000px] mx-auto space-y-16 pb-32">
             <div className="space-y-10 border-b border-border-ui dark:border-[#1E293B] pb-12">
               <span className="text-[11px] font-black text-brand-primary uppercase tracking-[0.6em] flex items-center gap-3"><Monitor size={16}/> Signal Protocol Handshake</span>
               <h1 className="text-6xl font-black text-[#0F172A] dark:text-[#E5E7EB] italic font-serif leading-tight uppercase tracking-tight">{selectedNews.headline}</h1>
               <div className="flex items-center gap-6 text-[11px] font-bold text-slate-500 uppercase tracking-widest italic">
                  <span className="flex items-center gap-2"><Newspaper size={16}/> {selectedNews.source_name}</span>
                  <span className="flex items-center gap-2"><Clock size={16}/> Ingested: {new Date(selectedNews.created_at).toLocaleDateString()}</span>
                  <a href={selectedNews.url} target="_blank" rel="noreferrer" className="ml-auto text-brand-primary hover:underline flex items-center gap-2 not-italic font-black">Open Source <ExternalLink size={14}/></a>
               </div>
             </div>
             <section className="space-y-6">
                <div className="flex items-center justify-between">
                   <h4 className="text-[12px] font-black text-text-secondary uppercase tracking-[0.5em]">Institutional Text Payload</h4>
                   <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Sourced via Refinery v1.1</span>
                </div>
                <div className={`border border-border-ui dark:border-[#1E293B] rounded-[3rem] p-12 shadow-inner min-h-[350px] relative overflow-hidden ${selectedNews.raw_text ? 'bg-[#F8FAFC] dark:bg-[#0F1B2D]' : 'bg-[#F1F5F9] dark:bg-[#020617]'}`}>
                   <div className="absolute top-0 right-0 p-10 text-blue-500/5"><FileText size={240}/></div>
                   {selectedNews.raw_text ? (
                     <p className="text-[18px] text-[#0F172A] dark:text-[#E5E7EB] leading-relaxed italic font-serif relative z-10 selection:bg-blue-500/30">
                       {selectedNews.raw_text}
                     </p>
                   ) : (
                     <textarea 
                       className="w-full h-full bg-transparent text-[18px] text-white outline-none resize-none placeholder:italic font-serif relative z-10" 
                       placeholder="Paste institutional text here for structural mapping..." 
                       rows={12} 
                       value={localRawText} 
                       onChange={e => setLocalRawText(e.target.value)} 
                     />
                   )}
                </div>
             </section>
             <section className="space-y-12 pt-16 border-t border-border-ui dark:border-[#1E293B]">
                <div className="text-center space-y-4">
                   <h3 className="text-4xl font-black text-white italic font-serif uppercase tracking-tight">Relevancy Decision</h3>
                   <p className="text-slate-500 text-sm font-medium italic">Does this signal contain actionable private market data?</p>
                </div>
                <div className="flex gap-10 max-w-2xl mx-auto">
                   <button onClick={() => setRelevancy('RELEVANT')} className={`flex-1 py-12 rounded-[3rem] border-2 font-black uppercase text-[12px] tracking-[0.4em] flex flex-col items-center gap-8 transition-all ${relevancy === 'RELEVANT' ? 'bg-emerald-600 border-emerald-600 text-white shadow-3xl scale-[1.05]' : 'bg-white dark:bg-[#0F1B2D] border-border-ui dark:border-[#1E293B] text-slate-500 hover:border-emerald-500/50'}`}>
                      <Check size={40}/> Relevant
                   </button>
                   <button onClick={() => setRelevancy('NOT_RELEVANT')} className={`flex-1 py-12 rounded-[3rem] border-2 font-black uppercase text-[12px] tracking-[0.4em] flex flex-col items-center gap-8 transition-all ${relevancy === 'NOT_RELEVANT' ? 'bg-rose-600 border-rose-600 text-white shadow-3xl scale-[1.05]' : 'bg-white dark:bg-[#0F1B2D] border-border-ui dark:border-[#1E293B] text-slate-500 hover:border-rose-500/50'}`}>
                      <X size={40}/> Not Relevant
                   </button>
                </div>
                {relevancy === 'NOT_RELEVANT' && (
                  <div className="max-w-2xl mx-auto space-y-6 animate-in slide-in-from-top-4">
                     <label className="text-[10px] font-black text-rose-500 uppercase tracking-widest ml-4 italic">Mandatory Rejection Ledger Entry (Audit Required)</label>
                     <textarea 
                        className="w-full bg-rose-500/5 border border-rose-500/20 rounded-[2.5rem] p-8 text-white italic font-serif outline-none focus:ring-4 focus:ring-rose-500/10"
                        placeholder="Detail why this institutional signal was filtered out..."
                        value={rejectionComment}
                        onChange={e => setRejectionComment(e.target.value)}
                        rows={4}
                     />
                  </div>
                )}
             </section>
             {relevancy === 'RELEVANT' && (
               <div className="space-y-24 animate-in slide-in-from-bottom-12 duration-700">
                  <section className="space-y-8">
                     <div className="text-center"><h4 className="text-[11px] font-black text-text-secondary uppercase tracking-[0.5em]">Step A — Action Protocol (Multi-Select)</h4></div>
                     <div className="grid grid-cols-3 gap-6">
                        {(['NO_NEW_INFO', 'ADDED_SHELL', 'UPDATED_EXISTING'] as ActionType[]).map(act => (
                           <button 
                             key={act} 
                             onClick={() => toggleSetItem(selectedActions, setSelectedActions, act)} 
                             className={`p-6 rounded-2xl border transition-all text-[10px] font-black uppercase tracking-widest ${selectedActions.has(act) ? 'bg-brand-primary text-white border-brand-primary shadow-xl scale-105' : 'bg-slate-900 border-slate-800 text-slate-500'}`}
                           >
                              {selectedActions.has(act) && <Check size={12} className="inline mr-2" />}
                              {act.replace('_', ' ')}
                           </button>
                        ))}
                     </div>
                  </section>
                  <section className="space-y-8">
                     <div className="text-center"><h4 className="text-[11px] font-black text-text-secondary uppercase tracking-[0.5em]">Step B — Dataset Mapping (Multi-Select)</h4></div>
                     <div className="flex flex-wrap gap-3 justify-center">
                        {Object.values(EntityType).map(type => (
                           <button 
                             key={type} 
                             onClick={() => toggleSetItem(selectedDatasets, setSelectedDatasets, type)} 
                             className={`px-6 py-3 rounded-xl border transition-all text-[9px] font-black uppercase tracking-widest ${selectedDatasets.has(type) ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg' : 'bg-slate-900 border-slate-800 text-slate-500'}`}
                           >
                              {selectedDatasets.has(type) && <Check size={10} className="inline mr-2" />}
                              {type} Registry
                           </button>
                        ))}
                     </div>
                  </section>
                  <section className="space-y-12">
                     <div className="text-center"><h4 className="text-[11px] font-black text-text-secondary uppercase tracking-[0.5em]">Step C — Event Sequence Matrix (Multi-Select)</h4></div>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {EVENT_TAXONOMY.map(ev => (
                           <button 
                             key={ev.id} 
                             onClick={() => toggleSetItem(selectedEvents, setSelectedEvents, ev.id as EventType)} 
                             className={`p-6 rounded-2xl border transition-all text-[11px] font-black uppercase text-left flex items-center justify-between group ${selectedEvents.has(ev.id as EventType) ? `bg-${ev.color}-600 border-${ev.color}-500 text-white shadow-xl scale-[1.03]` : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'}`}
                           >
                              <span className="italic font-serif">{ev.label}</span>
                              {selectedEvents.has(ev.id as EventType) ? <CheckCircle size={20}/> : <Plus size={18} className="opacity-30 group-hover:opacity-100 transition-opacity" />}
                           </button>
                        ))}
                     </div>
                  </section>
                  <section className="space-y-8">
                     <div className="text-center"><h4 className="text-[11px] font-black text-indigo-500 uppercase tracking-[0.5em]">Step D.1 — DataNest Institutional Anchor</h4></div>
                     {mappedEntity ? (
                       <div className="p-8 bg-indigo-600 border border-indigo-500 rounded-[2.5rem] flex items-center justify-between shadow-2xl animate-in zoom-in-95 max-w-2xl mx-auto">
                          <div className="flex items-center gap-6">
                             <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-white font-black italic font-serif text-xl">{mappedEntity.name[0]}</div>
                             <div>
                                <p className="text-xl font-black text-white italic font-serif uppercase leading-none mb-1">{mappedEntity.name}</p>
                                <p className="text-[9px] font-black text-indigo-100 uppercase tracking-widest italic">Institutional Anchor Verified</p>
                             </div>
                          </div>
                          <button onClick={() => setMappedEntity(null)} className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"><X size={20}/></button>
                       </div>
                     ) : (
                       <div className="space-y-4 relative max-w-2xl mx-auto">
                         <div className="relative group">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-500 transition-colors" size={20} />
                            <input 
                              className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-16 pr-8 py-5 text-lg text-white font-bold italic font-serif outline-none focus:ring-4 focus:ring-indigo-500/10"
                              placeholder="Search database for existing firm, fund, or contact..."
                              value={entitySearch}
                              onChange={e => setEntitySearch(e.target.value)}
                            />
                         </div>
                         {filteredEntities.length > 0 && (
                           <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-3xl z-50">
                              {filteredEntities.map(e => (
                                <button key={e.id} onClick={() => setMappedEntity(e)} className="w-full p-6 text-left hover:bg-indigo-600 flex items-center justify-between group transition-all border-b border-slate-800 last:border-0">
                                   <div className="flex items-center gap-4">
                                      <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest bg-slate-950 px-2 py-1 rounded group-hover:bg-white/20 group-hover:text-white">{e.type}</span>
                                      <span className="text-sm font-black text-white italic font-serif uppercase">{e.name}</span>
                                   </div>
                                   <ChevronRight size={18} className="text-slate-700 group-hover:text-white" />
                                </button>
                              ))}
                           </div>
                         )}
                       </div>
                     )}
                  </section>
                  <section className="space-y-10">
                     <div className="text-center space-y-4">
                        <h4 className="text-[11px] font-black text-text-secondary uppercase tracking-[0.5em]">Step D — AI Handshake</h4>
                        <p className="text-slate-500 text-sm italic">Institutional nodes identified by the Gemini Intelligence Layer.</p>
                     </div>
                     <div className="bg-indigo-500/5 border border-indigo-500/20 p-12 rounded-[4rem] space-y-10 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-12 text-indigo-500/5"><Brain size={180}/></div>
                        <div className="flex justify-between items-center relative z-10">
                           <h5 className="text-[11px] font-black text-indigo-500 uppercase tracking-[0.4em] flex items-center gap-4">
                              <Sparkles size={20} className="animate-pulse"/> AI Registry Suggestions
                           </h5>
                           <button onClick={() => setShowManualIntake(!showManualIntake)} className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2 hover:bg-indigo-500 transition-all">
                             <PlusCircle size={14}/> Step E: Initialize Manual Shell
                           </button>
                        </div>
                        {showManualIntake && (
                           <div className="p-10 bg-white dark:bg-[#020617] border border-indigo-500/30 rounded-[2.5rem] animate-in zoom-in-95 space-y-8 relative z-20">
                              <div className="grid grid-cols-2 gap-8">
                                 <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Institutional Name</label>
                                    <input className="w-full bg-slate-100 dark:bg-[#0B1220] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 text-sm font-bold text-white italic outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Blackstone..." value={manualShell.name} onChange={e => setManualShell({...manualShell, name: e.target.value})} />
                                 </div>
                                 <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Registry Type</label>
                                    <select className="w-full bg-slate-100 dark:bg-[#0B1220] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 text-sm font-bold text-indigo-400 appearance-none outline-none cursor-pointer" value={manualShell.type} onChange={e => setManualShell({...manualShell, type: e.target.value as any})}>
                                       {Object.values(EntityType).map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                 </div>
                              </div>
                              <button onClick={handleManualShellCreate} className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl hover:bg-emerald-500 transition-all">Commit Manual Shell to Intake Queue</button>
                           </div>
                        )}
                        <div className="space-y-4 relative z-10">
                           {loadingAI && <div className="flex items-center justify-center gap-3 text-indigo-400 text-[10px] font-black uppercase tracking-[0.4em] py-10"><Loader2 className="animate-spin" size={16}/> Extracting Institutional Kernels...</div>}
                           {aiSuggestions.map((sug, i) => (
                             <div key={i} className={`p-8 rounded-[2.5rem] border-2 transition-all flex items-center justify-between gap-10 ${approvedSuggestions.has(i) ? 'bg-indigo-600 border-indigo-500 text-white shadow-3xl' : 'bg-white dark:bg-[#0B1220] border-border-ui dark:border-[#1E293B] hover:border-indigo-500/40'}`}>
                                <div className="flex-1 flex items-center gap-8">
                                   <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black italic font-serif text-xl ${approvedSuggestions.has(i) ? 'bg-white/20 text-white' : 'bg-indigo-500/10 text-indigo-400'}`}>{sug.name[0]}</div>
                                   <div><p className="text-lg font-black italic font-serif mb-2 uppercase">{sug.name}</p><div className="flex items-center gap-4"><span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border ${approvedSuggestions.has(i) ? 'bg-white/20 border-white/30 text-white' : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'}`}>{sug.type}</span><p className={`text-[10px] italic font-medium ${approvedSuggestions.has(i) ? 'text-indigo-100' : 'text-slate-500'}`}>"{sug.reason}"</p></div></div>
                                </div>
                                <button onClick={() => { const next = new Set(approvedSuggestions); if (next.has(i)) next.delete(i); else next.add(i); setApprovedSuggestions(next); }} className={`p-5 rounded-2xl border transition-all ${approvedSuggestions.has(i) ? 'bg-white text-indigo-600 border-white shadow-xl' : 'border-border-ui dark:border-slate-800 text-slate-500 hover:text-indigo-500'}`}>{approvedSuggestions.has(i) ? <CheckCircle size={28}/> : <Plus size={28}/>}</button>
                             </div>
                           ))}
                        </div>
                     </div>
                  </section>
               </div>
             )}
          </div>
        </div>
        <footer className="h-32 border-t border-border-ui dark:border-[#1E293B] bg-white dark:bg-[#0B1220] px-10 flex items-center justify-center shrink-0 shadow-3xl">
           <button onClick={handleCommitReview} disabled={committing || !relevancy || (relevancy === 'NOT_RELEVANT' && !rejectionComment)} className="w-full max-w-[700px] py-10 bg-brand-primary text-white rounded-[3rem] font-black uppercase text-sm tracking-[0.4em] shadow-3xl shadow-brand-primary/40 disabled:opacity-30 active:scale-95 transition-all flex items-center justify-center gap-8 group">
              {committing ? <Loader2 className="animate-spin" size={28} /> : <>Commit Refinery Validation <ShieldCheck size={32} className="group-hover:scale-110 transition-transform"/></>}
           </button>
        </footer>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500 max-w-[1600px] mx-auto pb-32">
      <div className="flex justify-between items-end border-b border-border-ui dark:border-[#1E293B] pb-12">
        <div className="space-y-6">
          <h1 className="text-8xl font-black flex items-center gap-10 text-text-primary dark:text-white tracking-tighter uppercase italic font-serif leading-none">
            <Monitor className="text-brand-primary shrink-0" size={80} /> News Cockpit
          </h1>
          <div className="flex items-center gap-6 text-text-secondary font-medium text-xl italic">
             <Terminal size={26} className="text-brand-primary" /> 
             Operational Air Traffic Control — <span className="text-blue-500 font-black uppercase text-xs tracking-[0.4em] bg-blue-500/10 px-6 py-2 rounded-full border border-blue-500/20 shadow-2xl">Refinery {REFINERY_VERSION}</span>
          </div>
        </div>
        <div className="flex bg-[#F1F5F9] dark:bg-[#0F172A] border border-border-ui rounded-[3rem] p-2.5 shadow-inner">
            <button onClick={() => setActiveTab('DASHBOARD')} className={`px-14 py-4 rounded-[2.5rem] text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'DASHBOARD' ? 'bg-brand-primary text-white shadow-2xl scale-105' : 'text-text-secondary hover:text-white'}`}>Pulse</button>
            <button onClick={() => setActiveTab('FEED')} className={`px-14 py-4 rounded-[2.5rem] text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'FEED' ? 'bg-brand-primary text-white shadow-2xl scale-105' : 'text-text-secondary hover:text-white'}`}>Execution</button>
        </div>
      </div>
      {activeTab === 'DASHBOARD' ? (
        <div className="space-y-16 animate-in slide-in-from-bottom-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             <div className="bg-card-panel dark:bg-[#0F172A] p-10 rounded-[3.5rem] border border-border-ui shadow-sm relative overflow-hidden group"><div className="absolute -right-4 -top-4 opacity-5 text-amber-500 group-hover:scale-110 transition-transform"><Clock size={160}/></div><p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6">Pending Backlog</p><p className="text-7xl font-black text-amber-500 italic font-serif tracking-tighter">{stats.pending}</p></div>
             <div className="bg-card-panel dark:bg-[#0F172A] p-10 rounded-[3.5rem] border border-border-ui shadow-sm relative overflow-hidden group"><div className="absolute -right-4 -top-4 opacity-5 text-emerald-500 group-hover:scale-110 transition-transform"><ShieldCheck size={160}/></div><p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6">Validated Signals</p><p className="text-7xl font-black text-emerald-500 italic font-serif tracking-tighter">{stats.relevant}</p></div>
             <div className="bg-card-panel dark:bg-[#0F172A] p-10 rounded-[3.5rem] border border-border-ui shadow-sm relative overflow-hidden group"><div className="absolute -right-4 -top-4 opacity-5 text-rose-500 group-hover:scale-110 transition-transform"><XCircle size={160}/></div><p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6">Discarded</p><p className="text-7xl font-black text-rose-500 italic font-serif tracking-tighter">{stats.notRelevant}</p></div>
          </div>
          <div className="space-y-10">
             <div className="flex justify-between items-center px-4">
                <h3 className="text-[12px] font-black text-slate-500 uppercase tracking-[0.5em] flex items-center gap-3"><Globe size={18} className="text-blue-500"/> Source Intensity Analysis</h3>
                <div className="flex items-center gap-4">
                   <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Filter Domain:</span>
                   <select 
                      className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-[10px] font-black text-slate-400 uppercase outline-none cursor-pointer"
                      value={pulseSourceFilter}
                      onChange={e => setPulseSourceFilter(e.target.value)}
                   >
                      <option value="ALL">All Sources</option>
                      {uniqueSources.map(s => <option key={s} value={s}>{s}</option>)}
                   </select>
                </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {stats.sourceMetricsList
                  .filter(m => pulseSourceFilter === 'ALL' || m.name === pulseSourceFilter)
                  .map((m, i) => (
                    <div key={i} className="bg-[#0F172A] border border-slate-800 p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden group">
                       <div className="absolute top-0 right-0 p-6 opacity-5 text-blue-500 group-hover:scale-110 transition-transform"><Newspaper size={80}/></div>
                       <h4 className="text-xl font-black text-white italic font-serif uppercase tracking-tight mb-8 truncate pr-10">{m.name}</h4>
                       <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-800/50">
                          <div className="space-y-1">
                             <p className="text-[8px] font-black text-slate-600 uppercase tracking-tighter">Total</p>
                             <p className="text-lg font-black text-slate-200 italic font-serif">{m.total}</p>
                          </div>
                          <div className="space-y-1">
                             <p className="text-[8px] font-black text-emerald-600 uppercase tracking-tighter">Yield</p>
                             <p className="text-lg font-black text-emerald-500 italic font-serif">{m.relevancyYield}%</p>
                          </div>
                          <div className="space-y-1">
                             <p className="text-[8px] font-black text-blue-600 uppercase tracking-tighter">Done</p>
                             <p className="text-lg font-black text-blue-400 italic font-serif">{m.completionRate}%</p>
                          </div>
                       </div>
                    </div>
                ))}
             </div>
          </div>
        </div>
      ) : (
        <div className="space-y-10 animate-in slide-in-from-bottom-4">
           <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-[#0F172A] border border-slate-800 rounded-3xl p-6 flex items-center justify-between shadow-xl"><div><p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Pending Backlog</p><p className="text-3xl font-black text-amber-500 italic font-serif">{stats.pending}</p></div><div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl"><Clock size={20}/></div></div>
              <div className="bg-[#0F172A] border border-slate-800 rounded-3xl p-6 flex items-center justify-between shadow-xl"><div><p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Relevant Signals</p><p className="text-3xl font-black text-emerald-500 italic font-serif">{stats.relevant}</p></div><div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl"><ShieldCheck size={20}/></div></div>
              <div className="bg-[#0F172A] border border-slate-800 rounded-3xl p-6 flex items-center justify-between shadow-xl"><div><p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Not Relevant</p><p className="text-3xl font-black text-rose-500 italic font-serif">{stats.notRelevant}</p></div><div className="p-3 bg-rose-500/10 text-rose-500 rounded-xl"><XCircle size={20}/></div></div>
              <div className="bg-[#0F172A] border border-slate-800 rounded-3xl p-6 flex items-center justify-between shadow-xl"><div><p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">System Load</p><p className="text-3xl font-black text-slate-200 italic font-serif">{news.length}</p></div><div className="p-3 bg-slate-500/10 text-slate-500 rounded-xl"><Layers size={20}/></div></div>
           </div>
           <div className="bg-card-panel dark:bg-[#0F172A] border border-border-ui dark:border-[#1E293B] rounded-[4rem] overflow-hidden shadow-2xl min-h-[700px] flex flex-col">
              <div className="p-10 border-b border-border-ui dark:border-[#1E293B] flex flex-wrap gap-8 items-center bg-[#F8FAFC] dark:bg-[#0F172A]">
                 <div className="relative flex-1 group min-w-[300px]"><Search className="absolute left-8 top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-brand-primary transition-colors" size={24} /><input type="text" placeholder="Search signal headline..." className="w-full bg-app-bg dark:bg-[#020617] border border-border-ui dark:border-[#1E293B] rounded-3xl pl-20 pr-8 py-5 text-lg text-text-primary dark:text-white outline-none focus:ring-4 focus:ring-brand-primary/10 transition-all italic font-serif" value={searchFilter} onChange={e => setSearchFilter(e.target.value)} /></div>
                 <div className="flex gap-4">
                    <div className="flex flex-col gap-1.5"><span className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">Status Protocol</span><select className="bg-app-bg dark:bg-[#020617] border border-border-ui dark:border-[#1E293B] rounded-2xl px-6 py-3 text-[10px] font-black uppercase text-slate-400 outline-none cursor-pointer" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option value="ALL">All States</option><option value="PENDING">Pending Audit</option><option value="COMPLETED_RELEVANT">Relevant Signal</option><option value="COMPLETED_NOT_RELEVANT">No Intelligence</option></select></div>
                    <div className="flex flex-col gap-1.5"><span className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">Ingestion Sequence</span><button onClick={() => setSortOrder(sortOrder === 'DESC' ? 'ASC' : 'DESC')} className="bg-app-bg dark:bg-[#020617] border border-border-ui dark:border-[#1E293B] rounded-2xl px-6 py-3 text-[10px] font-black uppercase text-slate-400 flex items-center gap-3 transition-all hover:text-brand-primary">{sortOrder === 'DESC' ? <SortDesc size={14}/> : <SortAsc size={14}/>}{sortOrder === 'DESC' ? 'Newest First' : 'Oldest First'}</button></div>
                    <button onClick={loadData} className="p-4 bg-app-bg dark:bg-[#020617] border border-border-ui dark:border-[#1E293B] text-slate-500 rounded-2xl hover:text-brand-primary transition-all self-end"><RefreshCw size={24}/></button>
                 </div>
              </div>
              <div className="flex-1 overflow-x-auto custom-scrollbar">
                 <table className="w-full text-left border-collapse min-w-[1400px]">
                    <thead className="bg-[#F1F5F9] dark:bg-[#020617] border-b border-border-ui dark:border-[#1E293B] sticky top-0 z-10"><tr className="text-[11px] font-black text-slate-500 uppercase tracking-[0.5em]"><th className="px-12 py-8">Signal Integrity (Headline)</th><th className="px-10 py-8">Source Hub</th><th className="px-10 py-8">Specialist Name</th><th className="px-10 py-8 text-center">Operational State</th></tr></thead>
                    <tbody className="divide-y divide-border-ui dark:divide-[#1E293B]/40">
                       {processedNews.map(n => (
                         <tr key={n.id} onClick={() => setSelectedNews(n)} className="hover:bg-brand-primary/5 cursor-pointer group border-l-[6px] border-transparent hover:border-brand-primary transition-all">
                            <td className="px-12 py-8 max-w-2xl"><p className="text-[17px] font-black text-text-primary dark:text-white font-serif italic group-hover:text-brand-primary transition-colors leading-tight uppercase tracking-tight">{n.headline}</p><div className="flex items-center gap-4 mt-3"><p className="text-[9px] font-mono text-slate-700 uppercase tracking-widest">SIGNAL_ID: {n.id.slice(-12).toUpperCase()}</p><span className="text-[8px] font-black text-slate-700 uppercase bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded">Ingested: {new Date(n.created_at).toLocaleDateString()}</span></div></td>
                            <td className="px-10 py-8"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-900 border border-border-ui dark:border-slate-800 flex items-center justify-center text-[10px] font-black text-slate-500 italic font-serif">{n.source_name[0]}</div><span className="text-[12px] font-bold text-slate-500 uppercase tracking-widest">{n.source_name}</span></div></td>
                            <td className="px-10 py-8">{n.assigned_to_profile_id ? (<div className="flex items-center gap-4"><div className="w-9 h-9 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-[11px] font-black text-blue-500 italic font-serif uppercase">{(userMap[n.assigned_to_profile_id] || 'S')[0]}</div><span className="text-xs font-black text-slate-400 uppercase tracking-tight">{userMap[n.assigned_to_profile_id] || 'System Specialist'}</span></div>) : (<span className="px-4 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-border-ui dark:border-slate-800 text-[10px] font-black text-slate-500 uppercase tracking-widest italic opacity-60">UNCLAIMED</span>)}</td>
                            <td className="px-10 py-8 text-center"><span className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border shadow-sm transition-all ${n.processing_status === 'COMPLETED_RELEVANT' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : n.processing_status === 'COMPLETED_NOT_RELEVANT' ? 'bg-slate-500/10 text-slate-500 border-slate-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse'}`}>{n.processing_status || 'PENDING'}</span></td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default NewsIntelligence;