
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Cpu, Database, Search, Landmark, Globe, FileText, 
  RefreshCw, Loader2, Zap, ShieldCheck, ShieldAlert,
  ArrowRight, Activity, Clock, Plus, ChevronRight,
  CheckCircle2, XCircle, Terminal, History, Fingerprint, 
  Layers, Target, ExternalLink, ChevronLeft, AlertCircle, 
  Sparkles, Save, X, MoreVertical
} from 'lucide-react';
import { supabaseService } from '../services/supabaseService';
import { 
  FirmURL, EntityFiling, ExtractionQueueItem, EntityDocument,
  EntityDocumentDiff, EntityDocumentIntelligence, UserProfile, 
  Entity, EntityType, SchedulerJob, ExtractionStatus
} from '../types';

interface Props {
  userProfile: UserProfile;
}

const ExtractionRefinery: React.FC<Props> = ({ userProfile }) => {
  const [loading, setLoading] = useState(true);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  
  // Left Panel State
  const [urls, setUrls] = useState<FirmURL[]>([]);
  const [filings, setFilings] = useState<EntityFiling[]>([]);
  
  // Center Panel State
  const [activeSourceId, setActiveSourceId] = useState<string | null>(null);
  const [activeSourceType, setActiveSourceType] = useState<'URL' | 'FILING' | null>(null);
  /** Fix: Renamed state 'document' to 'activeDocument' to avoid shadowing the global browser 'document' object */
  const [activeDocument, setActiveDocument] = useState<EntityDocument | null>(null);
  const [diffs, setDiffs] = useState<EntityDocumentDiff[]>([]);
  const [committingTrigger, setCommittingTrigger] = useState(false);
  
  // Right Panel State
  const [intelligence, setIntelligence] = useState<EntityDocumentIntelligence[]>([]);
  
  // Modals / Intake State
  const [showAddUrl, setShowAddUrl] = useState(false);
  const [showAddFiling, setShowAddFiling] = useState(false);
  const [newUrl, setNewUrl] = useState({ url: '', type: 'PARENT' });
  const [newFiling, setNewFiling] = useState({ authority: 'SEC', type: '13F', uid: '', year: 2025, url: '' });

  const loadEntities = async () => {
    setLoading(true);
    try {
      const data = await supabaseService.fetchEntities(userProfile.tenant_id);
      setEntities(data);
      if (data.length > 0 && !selectedEntity) {
        handleEntitySelect(data[0]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadEntities(); }, []);

  const handleEntitySelect = async (entity: Entity) => {
    setSelectedEntity(entity);
    const [u, f] = await Promise.all([
      supabaseService.fetchFirmUrls(entity.id),
      // Corrected call: fetching filings for specific entity
      supabaseService.fetchEntityFilings(entity.id)
    ]);
    setUrls(u);
    setFilings(f);
    if (u.length > 0) handleSourceSelect(u[0].id, 'URL');
    else if (f.length > 0) handleSourceSelect(f[0].id, 'FILING');
    else {
      setActiveSourceId(null);
      setActiveDocument(null);
      setDiffs([]);
      setIntelligence([]);
    }
  };

  const handleSourceSelect = async (sourceId: string, type: 'URL' | 'FILING') => {
    setActiveSourceId(sourceId);
    setActiveSourceType(type);
    setLoading(true);
    try {
      const doc = await supabaseService.fetchLatestDocument(sourceId);
      setActiveDocument(doc);
      if (doc) {
        const [d, i] = await Promise.all([
          supabaseService.fetchDocumentDiffs(doc.id),
          supabaseService.fetchDocumentIntelligence(doc.id)
        ]);
        setDiffs(d);
        setIntelligence(i);
      } else {
        setDiffs([]);
        setIntelligence([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const triggerExecution = async () => {
    if (!selectedEntity || !activeSourceId || !activeSourceType) return;
    setCommittingTrigger(true);
    
    const sourceUrl = activeSourceType === 'URL' 
      ? urls.find(u => u.id === activeSourceId)?.url 
      : filings.find(f => f.id === activeSourceId)?.filing_url;

    await supabaseService.createExtractionQueueItem({
      entity_id: selectedEntity.id,
      entity_name: selectedEntity.name,
      entity_type: selectedEntity.type,
      url: sourceUrl || '',
      url_type: activeSourceType,
      status: 'QUEUED' as ExtractionStatus,
      tenant_id: userProfile.tenant_id
    });

    setCommittingTrigger(false);
    alert("Sequence Handshake Initiated: Node moved to Execution Queue.");
  };

  const handleApprovalAction = async (intelId: string, action: 'APPROVE' | 'REJECT') => {
    const res = await supabaseService.processApproval("AUTO_GEN_ID", intelId, userProfile.user_id, action, "Refinery manual action.");
    if (!res.error) {
      if (activeSourceId && activeSourceType) handleSourceSelect(activeSourceId, activeSourceType);
    }
  };

  if (loading && !selectedEntity) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-accent-primary" size={48} /></div>;

  return (
    <div className="h-full flex flex-col gap-6 animate-in fade-in duration-500 pb-20 overflow-hidden">
      <header className="flex justify-between items-end border-b border-border-ui dark:border-slate-800 pb-6 shrink-0">
        <div className="space-y-3">
          <h1 className="text-4xl font-black flex items-center gap-6 text-text-primary dark:text-white tracking-tighter uppercase italic font-serif leading-none">
            <Cpu className="text-accent-primary shrink-0" size={40} /> Extraction Refinery
          </h1>
          <div className="flex items-center gap-4 text-text-secondary font-medium text-sm italic">
             <Activity size={18} className="text-accent-primary" /> Intelligence Sequencing - <span className="text-accent-primary font-black uppercase text-[10px] tracking-[0.4em] bg-accent-primary/10 px-4 py-1.5 rounded-full border border-accent-primary/20 shadow-xl">Signal Processing Layer</span>
          </div>
        </div>
        <div className="flex gap-4">
           <div className="flex flex-col items-end">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Active Institution</span>
              <p className="text-base font-black text-white italic font-serif uppercase tracking-tight">{selectedEntity?.name || 'NODE_IDLE'}</p>
           </div>
           <button onClick={loadData} className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-500 hover:text-white transition-all active:scale-90"><RefreshCw size={20}/></button>
        </div>
      </header>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* LEFT PANEL: SOURCE INVENTORY */}
        <aside className="w-80 shrink-0 flex flex-col gap-6 overflow-hidden">
           <section className="bg-card-panel dark:bg-[#0E1626] border border-border-ui dark:border-[#1C2A44] rounded-[2rem] p-6 space-y-6 shadow-xl flex-1 flex flex-col overflow-hidden">
              <div className="relative group shrink-0">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
                 <select 
                  className="w-full bg-app-bg dark:bg-[#070B14] border border-border-ui dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-[11px] text-white outline-none focus:ring-2 focus:ring-accent-primary/20 appearance-none" 
                  value={selectedEntity?.id || ''}
                  onChange={(e) => {
                    const ent = entities.find(ent => ent.id === e.target.value);
                    if (ent) handleEntitySelect(ent);
                  }}
                 >
                   {entities.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                 </select>
              </div>
              <div className="flex-1 flex flex-col gap-8 overflow-y-auto custom-scrollbar pr-2">
                 <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2"><Globe size={12}/> URL Inventory</h4>
                    <div className="space-y-2">
                       {urls.map(u => (
                         <button 
                          key={u.id} 
                          onClick={() => handleSourceSelect(u.id, 'URL')} 
                          className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between group ${activeSourceId === u.id ? 'bg-accent-primary border-accent-primary text-white shadow-lg' : 'bg-app-bg dark:bg-slate-950 border-slate-900 text-slate-500 hover:border-slate-800'}`}
                         >
                            <div className="truncate">
                               <p className="text-[11px] font-black italic font-serif uppercase truncate">{u.url.replace('https://', '')}</p>
                               <span className={`text-[8px] font-mono uppercase ${activeSourceId === u.id ? 'text-blue-100' : 'text-slate-700'}`}>{u.url_type}</span>
                            </div>
                            <ChevronRight size={14} className={`shrink-0 ${activeSourceId === u.id ? 'text-white' : 'text-slate-800'}`}/>
                         </button>
                       ))}
                    </div>
                 </div>
                 <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2"><FileText size={12}/> Filing Registry</h4>
                    <div className="space-y-2">
                       {filings.map(f => (
                         <button 
                          key={f.id} 
                          onClick={() => handleSourceSelect(f.id, 'FILING')} 
                          className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between group ${activeSourceId === f.id ? 'bg-accent-primary border-accent-primary text-white shadow-lg' : 'bg-app-bg dark:bg-slate-950 border-slate-900 text-slate-500 hover:border-slate-800'}`}
                         >
                            <div className="truncate">
                               <p className="text-[11px] font-black italic font-serif uppercase truncate">{f.filing_authority} // {f.filing_type}</p>
                               <span className={`text-[8px] font-mono uppercase ${activeSourceId === f.id ? 'text-blue-100' : 'text-slate-700'}`}>{f.filing_year}</span>
                            </div>
                            <ChevronRight size={14} className={`shrink-0 ${activeSourceId === f.id ? 'text-white' : 'text-slate-800'}`}/>
                         </button>
                       ))}
                    </div>
                 </div>
              </div>
           </section>
        </aside>

        {/* CENTER PANEL: REFINERY VIEWPORT */}
        <main className="flex-1 flex flex-col gap-6 overflow-hidden">
           <section className="bg-slate-950 border border-slate-800 rounded-[2.5rem] flex-1 flex flex-col overflow-hidden shadow-2xl relative">
              <header className="px-8 py-4 border-b border-slate-900 flex justify-between items-center bg-slate-900/20">
                 <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Terminal size={14}/> Artifact Kernel</span>
                 <div className="flex gap-4">
                    <button 
                      onClick={triggerExecution}
                      disabled={committingTrigger || !activeSourceId}
                      className="px-6 py-2 bg-accent-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-blue hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-30"
                    >
                       {committingTrigger ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12}/>}
                       Execute Sequence
                    </button>
                 </div>
              </header>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-10 bg-[#020617]">
                 {loading ? (
                    <div className="h-full flex flex-col items-center justify-center gap-6 opacity-30">
                       <Loader2 className="animate-spin text-accent-primary" size={40} />
                       <span className="text-[10px] font-black uppercase tracking-widest">Reconstructing Trace...</span>
                    </div>
                 ) : activeDocument ? (
                    <div className="space-y-12">
                       <div className="p-8 bg-slate-900/40 border border-slate-800 rounded-[2rem] shadow-inner">
                          <p className="text-lg text-slate-300 font-serif italic leading-relaxed whitespace-pre-wrap select-all">
                             {activeDocument.extracted_text || 'No textual metadata persisted for this node.'}
                          </p>
                       </div>
                       {diffs.length > 0 && (
                          <div className="space-y-6">
                             <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-2"><History size={14}/> Differential Handshake</h4>
                             {diffs.map(d => (
                                <div key={d.id} className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
                                   <p className="text-[11px] text-emerald-400 font-mono italic leading-relaxed">+{d.added_text}</p>
                                   <p className="text-[11px] text-rose-400 font-mono italic leading-relaxed line-through opacity-40">-{d.removed_text}</p>
                                </div>
                             ))}
                          </div>
                       )}
                    </div>
                 ) : (
                    <div className="h-full flex flex-col items-center justify-center opacity-10 gap-6">
                       <Layers size={80} />
                       <p className="text-3xl font-black italic font-serif uppercase tracking-tighter">Handshake Void</p>
                    </div>
                 )}
              </div>
           </section>
        </main>

        {/* RIGHT PANEL: INTELLIGENCE DECK */}
        <aside className="w-96 shrink-0 flex flex-col gap-6 overflow-hidden">
           <section className="bg-card-panel dark:bg-[#0E1626] border border-border-ui dark:border-[#1C2A44] rounded-[2rem] p-6 space-y-6 shadow-xl flex-1 flex flex-col overflow-hidden">
              <header className="shrink-0 flex justify-between items-center mb-2">
                 <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] flex items-center gap-2"><Sparkles size={14}/> Derived Intel</h4>
                 <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse shadow-blue"></div>
              </header>
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
                 {intelligence.map(intel => (
                    <div key={intel.id} className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 hover:border-indigo-500/30 transition-all group">
                       <div className="flex justify-between items-start">
                          <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest italic">{intel.insight_type}</span>
                          <div className={`px-2 py-0.5 rounded text-[7px] font-black uppercase border ${intel.approval_status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>{intel.approval_status}</div>
                       </div>
                       <p className="text-[12px] font-black text-white italic font-serif uppercase tracking-tight leading-snug">"{intel.insight}"</p>
                       {intel.approval_status === 'PENDING' && (
                          <div className="flex gap-2 pt-2">
                             <button onClick={() => handleApprovalAction(intel.id, 'APPROVE')} className="flex-1 py-2 bg-emerald-600 text-white rounded-lg text-[8px] font-black uppercase shadow-lg hover:bg-emerald-500 transition-all">Commit</button>
                             <button onClick={() => handleApprovalAction(intel.id, 'REJECT')} className="flex-1 py-2 bg-slate-800 text-slate-400 rounded-lg text-[8px] font-black uppercase hover:text-white transition-all">Reject</button>
                          </div>
                       )}
                    </div>
                 ))}
                 {intelligence.length === 0 && (
                    <div className="py-20 text-center opacity-10 italic uppercase font-black text-xs tracking-widest">Zero signals derived.</div>
                 )}
              </div>
              <footer className="pt-6 border-t border-slate-800 shrink-0">
                 <div className="p-4 bg-slate-950 rounded-xl space-y-2">
                    <p className="text-[8px] font-black text-slate-700 uppercase tracking-widest">Inference Protocol</p>
                    <p className="text-[10px] text-slate-500 italic">Structural analysis enabled via Gemini 3 Pro reasoning layer.</p>
                 </div>
              </footer>
           </section>
        </aside>
      </div>

      {/** Fixed: Ensured the footer JSX is correctly structured and all tags are properly balanced to avoid 'Cannot find name div' errors */}
      <footer className="fixed bottom-0 left-72 right-0 h-16 bg-slate-950/90 backdrop-blur-xl border-t border-slate-900 px-10 flex items-center justify-between z-[100] pointer-events-none">
         <div className="flex items-center gap-10">
            <div className="flex items-center gap-3">
               <div className="w-1.5 h-1.5 rounded-full bg-accent-primary animate-pulse shadow-blue"></div>
               <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">Refinery Node: Locked</span>
            </div>
            <div className="flex items-center gap-3">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
               <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">Matrix State: Synchronized</span>
            </div>
         </div>
         <p className="text-[9px] font-black text-slate-800 uppercase tracking-[0.4em] italic font-serif leading-none">AnnoNest Refinery - v1.0 Operational Plane</p>
      </footer>
    </div>
  );
};

export default ExtractionRefinery;
