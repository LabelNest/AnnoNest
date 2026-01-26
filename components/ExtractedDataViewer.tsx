
import React, { useState, useEffect, useMemo } from 'react';
import { 
  History, Clock, CheckCircle2, ChevronRight, ChevronLeft, 
  Terminal, ArrowRight, ShieldCheck, Database, FileText,
  Search, Loader2, Sparkles, AlertCircle
} from 'lucide-react';
import { supabaseService } from '../services/supabaseService';
import { ExtractedDataVersion } from '../types';

interface Props {
  urlId: string;
}

const ExtractedDataViewer: React.FC<Props> = ({ urlId }) => {
  const [versions, setVersions] = useState<ExtractedDataVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeVersionIdx, setActiveVersionIdx] = useState(0);
  const [compareVersionIdx, setCompareVersionIdx] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await supabaseService.fetchExtractedVersions(urlId);
      setVersions(data);
      setLoading(false);
    };
    load();
  }, [urlId]);

  const activeV = versions[activeVersionIdx];
  const compareV = compareVersionIdx !== null ? versions[compareVersionIdx] : null;

  const renderPayload = (payload: any) => (
    <pre className="text-xs font-mono text-emerald-500/90 whitespace-pre-wrap leading-relaxed select-all">
      {JSON.stringify(payload, null, 2)}
    </pre>
  );

  if (loading) return (
    <div className="h-full w-full flex flex-col items-center justify-center gap-6 bg-slate-950">
      <Loader2 className="text-blue-500 animate-spin" size={48} />
      <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] italic">Retrieving version ledger...</span>
    </div>
  );

  if (versions.length === 0) return (
    <div className="h-full w-full flex flex-col items-center justify-center gap-6 bg-slate-950 p-20 text-center">
       <div className="w-20 h-20 bg-slate-900 border border-slate-800 rounded-[2rem] flex items-center justify-center text-slate-700 shadow-inner">
          <Terminal size={40} />
       </div>
       <div className="space-y-3">
          <h3 className="text-2xl font-black text-white italic font-serif uppercase tracking-tight">Ledger Empty</h3>
          <p className="text-slate-500 italic max-w-sm mx-auto">This URL protocol hasn't produced any extraction artifacts yet. Awaiting first refinery cycle.</p>
       </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col lg:flex-row overflow-hidden bg-slate-950">
      
      {/* VERSION SIDEBAR */}
      <aside className="w-full lg:w-96 border-r border-slate-900 flex flex-col shrink-0 bg-slate-900/20">
         <header className="p-8 border-b border-slate-900 flex items-center justify-between">
            <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] flex items-center gap-3"><History size={16}/> Extract Lineage</h4>
            <span className="text-[9px] font-mono text-slate-700 uppercase">n={versions.length}</span>
         </header>
         <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-3">
            {versions.map((v, i) => (
              <button 
                key={v.id} 
                onClick={() => { setActiveVersionIdx(i); setCompareVersionIdx(null); }}
                className={`w-full p-5 rounded-2xl border text-left transition-all relative group ${activeVersionIdx === i ? 'bg-blue-600 border-blue-500 text-white shadow-2xl' : 'bg-slate-950 border-slate-900 text-slate-500 hover:border-slate-800'}`}
              >
                 <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-black uppercase tracking-tighter">Version v{v.version_number}</span>
                    {v.is_current && <span className={`px-2 py-0.5 rounded text-[7px] font-black uppercase ${activeVersionIdx === i ? 'bg-white text-blue-600' : 'bg-emerald-600/10 text-emerald-500 border border-emerald-500/20'}`}>CURRENT</span>}
                 </div>
                 <p className="text-[9px] font-bold opacity-60 uppercase italic">{new Date(v.extracted_at).toLocaleString()}</p>
                 <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
                    <span className="text-[9px] font-black">Score: {v.confidence_score}%</span>
                    {activeVersionIdx !== i && <button onClick={(e) => { e.stopPropagation(); setCompareVersionIdx(i); }} className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase transition-all ${compareVersionIdx === i ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-slate-500 hover:bg-white hover:text-black'}`}>Compare</button>}
                 </div>
              </button>
            ))}
         </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <main className="flex-1 flex flex-col overflow-hidden">
         <header className="px-10 py-6 border-b border-slate-900 bg-slate-950/40 flex items-center justify-between">
            <div className="flex items-center gap-8">
               <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest italic">Active Workspace</span>
                  <h3 className="text-lg font-black text-white italic font-serif uppercase tracking-tight">v{activeV.version_number} <span className="text-slate-600 font-mono italic not-uppercase text-xs ml-3 font-normal">{(activeV.id).slice(0, 16)}</span></h3>
               </div>
               {compareV && (
                 <>
                   <ArrowRight className="text-slate-800" size={24} />
                   <div className="flex flex-col">
                      <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest italic">Comparison Reference</span>
                      <h3 className="text-lg font-black text-white italic font-serif uppercase tracking-tight">v{compareV.version_number}</h3>
                   </div>
                 </>
               )}
            </div>
            {activeV.change_summary && (
              <div className="bg-amber-500/10 border border-amber-500/20 px-6 py-2 rounded-2xl flex items-center gap-3 animate-in fade-in duration-700">
                 <Sparkles size={14} className="text-amber-500" />
                 <p className="text-[10px] text-amber-500 font-bold italic truncate max-w-md">"AI Change: {activeV.change_summary}"</p>
              </div>
            )}
         </header>

         <div className="flex-1 overflow-hidden flex flex-col md:flex-row p-10 gap-10 bg-[#020617]">
            <div className="flex-1 flex flex-col gap-6">
               <h5 className="text-[10px] font-black text-slate-700 uppercase tracking-[0.4em] ml-6 flex items-center gap-3"><Terminal size={14}/> {compareV ? `v${activeV.version_number} (Subject)` : 'Canonical Payload'}</h5>
               <div className="flex-1 bg-slate-900 border border-slate-800 rounded-[3rem] p-10 shadow-inner overflow-y-auto custom-scrollbar relative">
                  <div className="absolute top-4 right-8 text-[9px] font-black text-slate-800 uppercase tracking-widest">Immutable Trace</div>
                  {renderPayload(activeV.payload)}
               </div>
            </div>

            {compareV && (
               <div className="flex-1 flex flex-col gap-6 animate-in slide-in-from-right-8 duration-500">
                  <h5 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] ml-6 flex items-center gap-3"><Database size={14}/> v{compareV.version_number} (Reference)</h5>
                  <div className="flex-1 bg-slate-900 border border-emerald-500/30 rounded-[3rem] p-10 shadow-2xl overflow-y-auto custom-scrollbar relative">
                     <div className="absolute top-4 right-8 text-[9px] font-black text-emerald-500/40 uppercase tracking-widest">Baseline Node</div>
                     {renderPayload(compareV.payload)}
                  </div>
               </div>
            )}
         </div>
      </main>
    </div>
  );
};

export default ExtractedDataViewer;
