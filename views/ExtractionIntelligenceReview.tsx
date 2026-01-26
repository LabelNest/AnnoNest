
import React, { useState, useEffect } from 'react';
import { 
  SearchCheck, RefreshCw, Loader2, Zap, ShieldCheck, Database, 
  XCircle, CheckCircle2, History, ArrowRight, Activity, 
  Terminal, Sparkles, Target, Landmark, AlertCircle, FileText,
  Layers
} from 'lucide-react';
import { supabaseService } from '../services/supabaseService';
// Fixed: Using correct imports from types.ts
import { EntityDocumentIntelligence, UserProfile } from '../types';

const ExtractionIntelligenceReview: React.FC<{ userProfile: UserProfile }> = ({ userProfile }) => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [committing, setCommitting] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    // Fixed: fetchIntelligenceForReview method now implemented
    const data = await supabaseService.fetchIntelligenceForReview(userProfile.tenant_id);
    setItems(data);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [userProfile.tenant_id]);

  const handleApprove = async (intelId: string) => {
    setCommitting(intelId);
    // Fixed: approveIntelligence method now implemented with mandatory tenantId
    await supabaseService.approveIntelligence(intelId, userProfile.user_id, userProfile.tenant_id);
    setItems(prev => prev.filter(i => i.id !== intelId));
    setCommitting(null);
  };

  const handleReject = async (intelId: string) => {
    const reason = prompt("Describe rejection rationale for audit ledger:");
    if (!reason) return;
    setCommitting(intelId);
    // Fixed: rejectIntelligence method now implemented
    await supabaseService.rejectIntelligence(intelId, userProfile.user_id, reason);
    setItems(prev => prev.filter(i => i.id !== intelId));
    setCommitting(null);
  };

  if (loading) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" size={48} /></div>;

  return (
    <div className="space-y-12 animate-in fade-in duration-500 max-w-[1600px] mx-auto pb-40">
      <header className="flex justify-between items-end border-b border-[#1C2A44] pb-12">
        <div className="space-y-6">
          <h1 className="text-6xl font-black flex items-center gap-8 text-white tracking-tighter uppercase italic font-serif leading-none">
            <SearchCheck className="text-blue-500" size={64} /> Intelligence Review
          </h1>
          <p className="text-slate-400 font-medium text-lg italic flex items-center gap-4">
             <ShieldCheck size={20} className="text-blue-500" /> Clearance Plane — <span className="text-blue-500 font-black uppercase text-xs tracking-[0.4em] bg-blue-500/10 px-6 py-2 rounded-full border border-blue-500/20 shadow-xl italic">Human-in-the-Loop Validation</span>
          </p>
        </div>
        <button onClick={loadData} className="p-5 bg-slate-900 border border-[#1C2A44] text-slate-500 rounded-full hover:text-blue-500 transition-all"><RefreshCw size={24}/></button>
      </header>

      <div className="grid grid-cols-1 gap-10">
         {items.length === 0 ? (
           <div className="py-60 text-center space-y-10 animate-in fade-in zoom-in-95">
              <div className="w-24 h-24 bg-slate-900 border border-[#1C2A44] rounded-[3rem] flex items-center justify-center text-slate-800 mx-auto shadow-inner"><Layers size={54} /></div>
              <div className="space-y-4">
                 <h3 className="text-3xl font-black text-white italic font-serif uppercase tracking-tight">Clearance Queue Empty.</h3>
                 <p className="text-lg text-slate-500 italic font-medium leading-relaxed max-w-md mx-auto">No derived institutional intelligence nodes are currently awaiting handshake at this horizon.</p>
              </div>
           </div>
         ) : items.map(intel => (
           <div key={intel.id} className="bg-[#0E1626] border border-[#1C2A44] rounded-[4rem] overflow-hidden shadow-3xl flex flex-col lg:flex-row items-stretch group hover:border-blue-500/30 transition-all">
              <div className="lg:w-1/3 p-12 bg-slate-950/40 border-r border-[#1C2A44] space-y-10 flex flex-col">
                 <div className="space-y-3">
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-3"><Landmark size={14}/> Target Registry</span>
                    <h3 className="text-2xl font-black text-white italic font-serif uppercase tracking-tight leading-tight">Institutional Signature Node</h3>
                    <p className="text-[9px] font-mono text-slate-700 uppercase italic">ID: {intel.id.slice(0,20)}</p>
                 </div>
                 <div className="flex-1 space-y-8 py-10 border-y border-[#1C2A44]/60">
                    <div className="flex flex-col">
                       <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2">Inference confidence</span>
                       <div className="flex items-center gap-4">
                          <span className="text-3xl font-black text-blue-500 italic font-serif">{intel.confidence_score}%</span>
                          <div className="flex-1 h-1.5 bg-slate-950 rounded-full overflow-hidden border border-[#1C2A44]"><div className="h-full bg-blue-500" style={{ width: `${intel.confidence_score}%` }}></div></div>
                       </div>
                    </div>
                    <div className="flex flex-col">
                       <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Temporal Ingest</span>
                       <span className="text-xs font-bold text-slate-400 italic">{new Date(intel.created_at).toLocaleString()}</span>
                    </div>
                 </div>
                 <div className="pt-2 flex items-center gap-3 text-[10px] font-black text-blue-400 uppercase italic"><Zap size={14} className="animate-pulse"/> Signal: {intel.insight_type}</div>
              </div>

              <div className="flex-1 p-14 space-y-12 relative overflow-hidden flex flex-col">
                 <div className="absolute top-0 right-0 p-10 text-blue-500/5 group-hover:scale-105 transition-transform"><Database size={240}/></div>
                 <div className="space-y-6 relative z-10">
                    <h4 className="text-[12px] font-black text-slate-500 uppercase tracking-[0.5em] flex items-center gap-4"><Sparkles size={18} className="text-blue-500"/> Derived Intelligence Payload</h4>
                    <p className="text-4xl text-white italic font-serif leading-tight selection:bg-blue-600/30 uppercase tracking-tight">"{intel.insight_text || intel.insight}"</p>
                 </div>
                 {intel.diff_id && (
                   <div className="p-8 bg-slate-950 border border-[#1C2A44] rounded-[2.5rem] relative z-10 shadow-inner group-hover:border-blue-500/20 transition-all">
                      <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-6 flex items-center gap-3"><Activity size={14} className="text-amber-500" /> Delta Reference: Immutable Trace</p>
                      <p className="text-xs text-emerald-500 font-mono italic leading-relaxed bg-slate-900 p-4 rounded-xl">Differential trace detected institutional volatility. Intelligence synthesized from comparative kernel snapshot.</p>
                   </div>
                 )}
                 <div className="mt-auto pt-10 flex gap-6">
                    <button 
                      onClick={() => handleReject(intel.id)}
                      disabled={!!committing}
                      className="flex-1 py-8 bg-slate-900 border border-[#1C2A44] text-slate-500 rounded-[2.5rem] font-black uppercase text-xs tracking-[0.3em] hover:text-rose-500 hover:border-rose-500/40 transition-all flex items-center justify-center gap-4 active:scale-95"
                    >
                       <XCircle size={24}/> Reject Signal
                    </button>
                    <button 
                      onClick={() => handleApprove(intel.id)}
                      disabled={!!committing}
                      className="flex-[2] py-8 bg-blue-600 text-white rounded-[2.5rem] font-black uppercase text-sm tracking-[0.4em] shadow-3xl shadow-blue-600/30 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-6"
                    >
                       {committing === intel.id ? <Loader2 className="animate-spin" size={24}/> : <><CheckCircle2 size={28}/> Commit Handshake</>}
                    </button>
                 </div>
              </div>
           </div>
         ))}
      </div>

      <footer className="fixed bottom-0 left-72 right-0 h-16 bg-slate-950/90 backdrop-blur-xl border-t border-slate-900 px-10 flex items-center justify-between z-[100]">
         <div className="flex items-center gap-10">
            <div className="flex items-center gap-3">
               <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-blue"></div>
               <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">Clearance Plane: Active</span>
            </div>
            <div className="flex items-center gap-3">
               <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-emerald-500/20"></div>
               <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">Audit Protocol: Locked</span>
            </div>
         </div>
         <p className="text-[9px] font-black text-slate-800 uppercase tracking-[0.4em] italic font-serif">AnnoNest Intelligence Review — v1.0 CANON</p>
      </footer>
    </div>
  );
};

export default ExtractionIntelligenceReview;
