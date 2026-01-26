
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
  const [document, setDocument] = useState<EntityDocument | null>(null);
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
    const data = await supabaseService.fetchEntities(userProfile.tenant_id);
    setEntities(data);
    if (data.length > 0 && !selectedEntity) {
      handleEntitySelect(data[0]);
    }
    setLoading(false);
  };

  useEffect(() => { loadEntities(); }, []);

  const handleEntitySelect = async (entity: Entity) => {
    setSelectedEntity(entity);
    const [u, f] = await Promise.all([
      supabaseService.fetchFirmUrls(entity.id),
      supabaseService.fetchEntityFilings(entity.id)
    ]);
    setUrls(u);
    setFilings(f);
    if (u.length > 0) handleSourceSelect(u[0].id, 'URL');
    else if (f.length > 0) handleSourceSelect(f[0].id, 'FILING');
    else {
      setActiveSourceId(null);
      setDocument(null);
      setDiffs([]);
      setIntelligence([]);
    }
  };

  const handleSourceSelect = async (sourceId: string, type: 'URL' | 'FILING') => {
    setActiveSourceId(sourceId);
    setActiveSourceType(type);
    setLoading(true);
    
    const doc = await supabaseService.fetchLatestDocument(sourceId);
    setDocument(doc);
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
    setLoading(false);
  };

  const triggerExecution = async () => {
    if (!selectedEntity || !activeSourceId || !activeSourceType) return;
    setCommittingTrigger(true);
    
    const sourceUrl = activeSourceType === 'URL' 
      ? urls.find(u => u.id === activeSourceId)?.url 
      : filings.find(f => f.id === activeSourceId)?.filing_url;

    // Use specific create method for new queue items instead of dynamic update helper
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
    if (res.success) {
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
             <Activity size={18} className="text-accent-primary" /> Intelligence Sequencing — <span className="text-accent-primary font-black uppercase text-[10px] tracking-[0.4em] bg-accent-primary/10 px-4 py-1.5 rounded-full border border-accent-primary/20 shadow-xl">Signal Processing Layer</span>
          </div>
        </div>
        <div className="flex gap-4">
           <div className="flex flex-col items-end">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Active Institution</span>
              <p className="text-base font-black text-white italic font-serif uppercase tracking-tight">{selectedEntity?.name || 'NODE_IDLE'}</p>
           </div>
           <button onClick={loadEntities} className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-500 hover:text-white transition-all active:scale-95"><RefreshCw size={20}/></button>
        </div>
      </header>
      <div className="flex-1 flex gap-6 overflow-hidden">
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
                               <p className="text-[11px] font-black italic font-serif uppercase">{f.filing_type} Node</p>
                               <span className={`text-[8px] font-mono uppercase ${activeSourceId === f.id ? 'text-blue-100' : 'text-slate-700'}`}>ID: {f.filing_unique_id} // {f.filing_year}</span>
                            </div>
                            <ChevronRight size={14} className={`shrink-0 ${activeSourceId === f.id ? 'text-white' : 'text-slate-800'}`}/>
                         </button>
                       ))}
                    </div>
                 </div>
              </div>
           </section>
        </aside>
        <main className="flex-1 bg-card-panel dark:bg-[#0E1626] border border-border-ui dark:border-[#1C2A44] rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col relative">
           <div className="absolute top-0 left-0 w-full h-1 bg-accent-primary shadow-blue"></div>
           <header className="px-8 py-6 border-b border-border-ui dark:border-slate-800 bg-app-bg/20 dark:bg-slate-950/20 flex items-center justify-between shrink-0">
              <div className="space-y-1">
                 <span className="text-[10px] font-black text-accent-primary uppercase tracking-[0.4em] flex items-center gap-2"><Terminal size={14}/> Refinery Kernel</span>
                 <h2 className="text-xl font-black text-text-primary dark:text-white italic font-serif uppercase tracking-tight">Active Extraction Document</h2>
              </div>
              <button 
                onClick={triggerExecution}
                disabled={!activeSourceId || committingTrigger}
                className="px-6 py-2.5 bg-accent-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-blue hover:brightness-110 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-30"
              >
                 {committingTrigger ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />} Trigger Sequence
              </button>
           </header>
           <div className="flex-1 overflow-hidden flex flex-col">
              {document ? (
                <div className="flex-1 flex flex-col min-h-0">
                   <div className="h-40 border-b border-slate-900 bg-[#020617] p-6 overflow-y-auto custom-scrollbar shrink-0">
                      <h5 className="text-[9px] font-black text-slate-700 uppercase tracking-widest mb-4 flex items-center gap-2"><History size={12}/> Differential delta</h5>
                      {diffs.length > 0 ? (
                        <div className="space-y-3">
                           {diffs.map(d => (
                             <div key={d.id} className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
                                <p className="text-[11px] text-emerald-500 font-mono italic">"{d.change_summary}"</p>
                                <span className="text-[7px] font-mono text-slate-700 mt-1 block uppercase">{new Date(d.created_at).toLocaleString()}</span>
                             </div>
                           ))}
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-700 italic">Zero differential signals persisted.</p>
                      )}
                   </div>
                   <div className="flex-1 p-8 overflow-y-auto custom-scrollbar bg-slate-950/40">
                      <div className="max-w-3xl mx-auto space-y-6">
                         <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">Document Payload v{document.version_number || 1}</span>
                            <span className="text-[9px] font-mono text-slate-700 uppercase">SHA: {document.current_hash?.slice(0, 16)}</span>
                         </div>
                         <p className="text-base text-slate-400 font-serif leading-relaxed italic select-all whitespace-pre-wrap">
                            {document.extracted_text || 'Extracted artifact text not available in kernel.'}
                         </p>
                      </div>
                   </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-20 space-y-6 opacity-30">
                   <Layers size={64} />
                   <p className="text-xl font-black italic font-serif uppercase tracking-tight">Source Pipeline Idle</p>
                   <p className="text-sm italic font-medium max-w-xs">Select a URL or Filing node and trigger an extraction sequence to generate intelligence.</p>
                </div>
              )}
           </div>
        </main>
        <aside className="w-96 shrink-0 border-l border-border-ui dark:border-[#1C2A44] bg-card-panel dark:bg-[#0E1626] overflow-hidden flex flex-col shadow-3xl rounded-[2.5rem]">
           <header className="p-6 border-b border-border-ui dark:border-slate-800 bg-slate-950/20 shrink-0">
              <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] flex items-center gap-3"><Sparkles size={16} className="text-accent-primary"/> Derived Intelligence</h4>
           </header>
           <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
              {intelligence.length === 0 ? (
                <div className="py-20 text-center space-y-4 opacity-20">
                   <AlertCircle size={40} className="mx-auto" />
                   <p className="text-[10px] font-black uppercase tracking-widest">No intelligence synthesized</p>
                </div>
              ) : (
                intelligence.map(intel => (
                  <div key={intel.id} className="bg-app-bg dark:bg-[#070B14] border border-border-ui dark:border-slate-800 p-6 rounded-[2rem] space-y-4 shadow-lg relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-4 opacity-5 text-accent-primary group-hover:scale-110 transition-transform"><Database size={80}/></div>
                     <div className="relative z-10 space-y-3">
                        <div className="flex items-center justify-between">
                           <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">{intel.insight_type}</span>
                           <span className="text-xl font-black text-accent-primary italic font-serif">{intel.confidence_score}%</span>
                        </div>
                        <p className="text-sm text-white font-black italic font-serif leading-snug uppercase tracking-tight select-all">"{intel.insight_text || intel.insight}"</p>
                        <div className="flex items-center justify-between pt-4 border-t border-slate-900">
                           <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase italic ${intel.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-500' : intel.status === 'REJECTED' ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500 animate-pulse'}`}>{intel.status}</span>
                           {intel.status === 'PROPOSED' && (
                             <div className="flex gap-2">
                                <button onClick={() => handleApprovalAction(intel.id, 'REJECT')} className="p-2 bg-slate-900 border border-slate-800 text-rose-500 rounded-lg hover:bg-rose-600 hover:text-white transition-all"><XCircle size={14}/></button>
                                <button onClick={() => handleApprovalAction(intel.id, 'APPROVE')} className="p-2 bg-accent-primary text-white rounded-lg shadow-blue hover:brightness-110 transition-all"><CheckCircle2 size={14}/></button>
                             </div>
                           )}
                        </div>
                     </div>
                  </div>
                ))
              )}
           </div>
        </aside>
      </div>
      <footer className="fixed bottom-0 left-72 right-0 h-14 bg-slate-950/90 backdrop-blur-xl border-t border-slate-900 px-10 flex items-center justify-between z-[100] pointer-events-none">
         <div className="flex items-center gap-10">
            <div className="flex items-center gap-3">
               <div className="w-1.5 h-1.5 rounded-full bg-accent-primary animate-pulse shadow-blue"></div>
               <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest italic">Refinery Plane: Nominal</span>
            </div>
            <div className="flex items-center gap-3">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
               <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest italic">Data Continuity: Persistent</span>
            </div>
         </div>
         <p className="text-[8px] font-black text-slate-800 uppercase tracking-[0.4em] italic font-serif">AnnoNest Extraction Refinery — v1.0 CANON Execution Layer</p>
      </footer>
    </div>
  );
};

export default ExtractionRefinery;
