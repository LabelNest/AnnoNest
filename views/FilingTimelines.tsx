
import React, { useState, useEffect } from 'react';
import { 
  History, Search, Loader2, Landmark, Clock, FileText, 
  GitMerge, ChevronRight, CheckCircle2, AlertCircle
} from 'lucide-react';
import { supabaseService } from '../services/supabaseService';
import { UserProfile, Entity } from '../types';

interface Props {
  userProfile: UserProfile;
}

const FilingTimelines: React.FC<Props> = ({ userProfile }) => {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [fetchingTimeline, setFetchingTimeline] = useState(false);

  const loadEntities = async () => {
    setLoading(true);
    // Fixed: fetchEntities expected 1 argument, role removed to match implementation
    const data = await supabaseService.fetchEntities(userProfile.tenant_id);
    setEntities(data);
    setLoading(false);
  };

  useEffect(() => { loadEntities(); }, []);

  const handleEntitySelect = async (id: string) => {
    setSelectedEntityId(id);
    setFetchingTimeline(true);
    // Master Prompt: Call filing_timeline_engine
    const data = await supabaseService.fetchFilingTimeline(id);
    setTimeline(data || []);
    setFetchingTimeline(false);
  };

  if (loading) return (
    <div className="h-full flex items-center justify-center">
      <Loader2 className="animate-spin text-brand-primary" size={40} />
    </div>
  );

  return (
    <div className="h-full flex flex-col lg:flex-row overflow-hidden -m-10">
      <aside className="w-full lg:w-96 border-r border-border-ui dark:border-slate-800 bg-sidebar-bg dark:bg-slate-950 flex flex-col shrink-0">
         <header className="p-10 border-b border-border-ui dark:border-slate-800 space-y-6">
            <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] flex items-center gap-4">
              <Landmark size={18} className="text-brand-primary" /> Active Nodes
            </h4>
         </header>
         <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
            {entities.map(e => (
              <button 
                key={e.id}
                onClick={() => handleEntitySelect(e.id)}
                className={`w-full p-6 rounded-[1.5rem] text-left transition-all group ${selectedEntityId === e.id ? 'bg-brand-primary text-white shadow-xl scale-105' : 'bg-transparent text-slate-500 hover:bg-slate-900'}`}
              >
                 <h5 className="text-sm font-black italic font-serif uppercase truncate">{e.name}</h5>
                 <p className={`text-[8px] font-mono mt-1 ${selectedEntityId === e.id ? 'text-blue-100' : 'text-slate-700'}`}>ID: {e.id.slice(0, 16)}</p>
              </button>
            ))}
         </div>
      </aside>

      <main className="flex-1 bg-app-bg dark:bg-[#020617] overflow-y-auto custom-scrollbar p-12">
         {!selectedEntityId ? (
           <div className="h-full flex flex-col items-center justify-center text-center space-y-8 opacity-20">
              <History size={80} />
              <p className="text-2xl font-black italic font-serif uppercase tracking-tight">Select node to reconstruct lineage.</p>
           </div>
         ) : fetchingTimeline ? (
           <div className="h-full flex items-center justify-center">
              <Loader2 className="animate-spin text-brand-primary" size={48} />
           </div>
         ) : (
           <div className="max-w-4xl mx-auto space-y-20 relative">
              <div className="absolute left-10 top-0 bottom-0 w-px bg-slate-800"></div>
              {timeline.map((item, idx) => (
                <div key={idx} className="flex gap-12 relative z-10 animate-in fade-in slide-in-from-bottom-4">
                   <div className={`w-20 h-20 rounded-[2rem] border-4 flex items-center justify-center shrink-0 shadow-2xl transition-all ${
                     item.type === 'ORIGINAL' ? 'bg-blue-600 border-blue-500 text-white' :
                     'bg-slate-900 border-slate-800 text-brand-primary'
                   }`}>
                      {item.type === 'ORIGINAL' ? <FileText size={24}/> : <GitMerge size={24}/>}
                   </div>
                   <div className="flex-1 bg-slate-900 border border-slate-800 rounded-[3rem] p-10 space-y-8 shadow-3xl hover:border-brand-primary/40 transition-all">
                      <div className="flex justify-between items-start">
                         <div className="space-y-2">
                            <span className="text-[10px] font-black text-brand-primary uppercase tracking-[0.4em]">{item.type} DISCLOSURE</span>
                            <h3 className="text-3xl font-black text-white italic font-serif uppercase leading-none tracking-tight">{item.title}</h3>
                         </div>
                         <span className="text-xs font-bold text-slate-500 italic uppercase">{new Date(item.timestamp).toLocaleDateString()}</span>
                      </div>
                      <div className="p-8 bg-slate-950 border border-slate-800 rounded-[2rem] shadow-inner">
                         <p className="text-[15px] text-slate-400 font-medium italic font-serif leading-relaxed select-all">
                            {item.summary || "No extracted metadata signature persisted for this event."}
                         </p>
                      </div>
                      {item.intelligence && (
                        <div className="pt-8 border-t border-slate-800 flex flex-wrap gap-3">
                           {item.intelligence.map((intel: any, i: number) => (
                             <span key={i} className="px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl text-[9px] font-black uppercase italic flex items-center gap-2">
                                <CheckCircle2 size={12}/> {intel}
                             </span>
                           ))}
                        </div>
                      )}
                   </div>
                </div>
              ))}
              {timeline.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center py-40 opacity-20">
                   <AlertCircle size={64} />
                   <p className="text-lg font-black italic font-serif uppercase mt-6">Timeline sequence empty.</p>
                </div>
              )}
           </div>
         )}
      </main>
    </div>
  );
};

export default FilingTimelines;
