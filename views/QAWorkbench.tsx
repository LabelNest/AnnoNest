import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldCheck, SearchCheck, CheckCircle2, XCircle, AlertCircle, 
  ArrowLeft, FileText, User, Zap, RefreshCw, X, ThumbsUp, ThumbsDown, 
  MessageSquare, History, Shield, Loader2, Database, Target, Clock, 
  Filter, Eye, Hash, RotateCcw, AlertTriangle, FileJson, ChevronRight, 
  Info, Check, Save, ExternalLink, Globe, ShieldAlert, Scale,
  ChevronLeft
} from 'lucide-react';
import { supabaseService } from '../services/supabaseService';
import { QAReview, UserProfile, QAFieldDefinition } from '../types';

interface Props {
  reviewId: string;
  userProfile: UserProfile;
  onComplete: () => void;
  activeProjectId: string;
}

const QAWorkbench: React.FC<Props> = ({ reviewId, userProfile, onComplete, activeProjectId }) => {
  const [review, setReview] = useState<QAReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [fieldDefinitions, setFieldDefinitions] = useState<QAFieldDefinition[]>([]);
  const [currentReviewJson, setCurrentReviewJson] = useState<Record<string, 'CORRECT' | 'INCORRECT' | 'N/A' | 'DISPUTED'>>({});
  const [remarks, setRemarks] = useState('');
  const [minutesSpent, setMinutesSpent] = useState(0);

  const loadData = async () => {
    setLoading(true);
    try {
      const revs = await supabaseService.fetchQAReviews(userProfile.tenant_id, activeProjectId);
      const activeRev = revs.find(r => r.id === reviewId);
      if (activeRev) {
        setReview(activeRev);
        const defs = await supabaseService.fetchQAFieldDefinitions(activeRev.module, activeRev.dataset || undefined);
        setFieldDefinitions(defs);
        setCurrentReviewJson(activeRev.review_json || {});
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [reviewId]);

  // Timer logic for cost ledger
  useEffect(() => {
    const timer = setInterval(() => setMinutesSpent(m => m + 1), 60000);
    return () => clearInterval(timer);
  }, []);

  const handleFieldDecision = (fieldKey: string, result: 'CORRECT' | 'INCORRECT' | 'N/A' | 'DISPUTED') => {
    setCurrentReviewJson(prev => ({
      ...prev,
      [fieldKey]: result
    }));
  };

  const handleCommitReview = async () => {
    if (!review || !remarks) return;

    // Validation: Mandatory fields check
    const missingRequired = fieldDefinitions.filter(df => df.required && !currentReviewJson[df.field_key]);
    if (missingRequired.length > 0) {
      alert(`Structural Fault: Mandatory verification nodes missing for [${missingRequired.map(m => m.field_label).join(', ')}]`);
      return;
    }

    setSubmitting(true);
    const result = await supabaseService.completeQAReview(
      review.id, 
      currentReviewJson, 
      remarks,
      minutesSpent
    );

    if (result.success) {
      alert(`Clearance Protocol Success. Accuracy: ${result.accuracy}% | State: ${result.status.toUpperCase()}`);
      onComplete();
    } else {
      alert("Operational Handshake Failure.");
    }
    setSubmitting(false);
  };

  if (loading || !review) return (
    <div className="h-full flex flex-col items-center justify-center gap-6 text-accent-primary animate-pulse">
       <Loader2 className="animate-spin" size={64} />
       <p className="text-[10px] font-black uppercase tracking-[0.8em]">Initializing Audit Handshake...</p>
    </div>
  );

  return (
    <div className="h-full flex flex-col gap-10 animate-in fade-in duration-500 pb-20 overflow-hidden">
      <header className="flex justify-between items-end border-b border-slate-800 pb-10">
        <div className="space-y-4">
           <button onClick={onComplete} className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-all group mb-4">
             <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Abort Clearance
           </button>
          <h1 className="text-6xl font-black flex items-center gap-6 text-text-primary dark:text-white tracking-tighter uppercase italic font-serif leading-none">
            <SearchCheck className="text-accent-primary shrink-0" size={54} /> Workbench
          </h1>
          <p className="text-text-secondary font-medium text-lg italic">Tactical Audit Plane — Cycle Ref: {review.id.slice(-8).toUpperCase()}</p>
        </div>
        <div className="flex bg-slate-950 px-8 py-3 rounded-2xl border border-slate-800 shadow-3xl items-center gap-8">
           <div className="flex flex-col">
              <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest italic">Handshake Context</span>
              <span className="text-lg font-black text-blue-500 italic font-serif leading-none uppercase">{review.module} // {review.dataset}</span>
           </div>
           <div className="h-10 w-px bg-slate-800"></div>
           <div className="flex flex-col items-center">
              <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest italic">Elapsed</span>
              <span className="text-xl font-black text-white italic font-serif leading-none">{minutesSpent}m</span>
           </div>
        </div>
      </header>

      <div className="flex-1 flex gap-10 overflow-hidden">
        {/* LEFT: SOURCE VIEWPORT (IDENTITY NODE) */}
        <section className="flex-1 bg-slate-950 border border-slate-800 rounded-[4rem] overflow-hidden shadow-2xl flex flex-col relative">
           <header className="px-10 py-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/40">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 italic"><Globe size={14}/> Protocol Subject Node</span>
              <ExternalLink size={16} className="text-slate-700 hover:text-accent-primary cursor-pointer" />
           </header>
           <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-12">
              <div className="w-32 h-32 bg-slate-900 border-2 border-slate-800 rounded-[3rem] flex items-center justify-center text-accent-primary shadow-inner">
                 <Database size={64} />
              </div>
              <div className="space-y-4">
                 <h3 className="text-5xl font-black text-white italic font-serif uppercase tracking-tighter">Anchored Node</h3>
                 <p className="text-xl text-slate-500 italic">Structural verification required for Task: <span className="text-accent-primary font-black uppercase">v_{review.record_id}</span></p>
              </div>
              <div className="p-8 bg-slate-900/40 border border-slate-800 rounded-3xl max-w-sm w-full">
                 <p className="text-[9px] font-mono text-slate-700 uppercase tracking-widest mb-4">INVARIANT_SHA_SEQUENCE</p>
                 <p className="text-xs font-mono text-blue-500 break-all">{review.id.toUpperCase()}</p>
              </div>
           </div>
        </section>

        {/* RIGHT: AUDIT CONTROL PANEL (DYNAMIC CHECKLIST) */}
        <aside className="w-[600px] flex flex-col gap-6 overflow-hidden">
           <div className="bg-card-panel dark:bg-[#0E1626] border border-slate-800 rounded-[4rem] overflow-hidden shadow-2xl flex-1 flex flex-col">
              <header className="p-8 border-b border-slate-800 bg-slate-950/20 shrink-0 flex justify-between items-center">
                 <div>
                    <span className="text-[9px] font-black text-accent-primary uppercase tracking-[0.4em] mb-1 italic">Audit Protocol</span>
                    <h2 className="text-2xl font-black text-white italic font-serif uppercase tracking-tight">Integrity Handshake</h2>
                 </div>
                 <div className="flex flex-col items-end">
                    <span className="text-[8px] font-black text-slate-700 uppercase">Weight Pool</span>
                    <span className="text-xl font-black text-accent-primary italic font-serif">x{fieldDefinitions.reduce((acc, f) => acc + f.qc_weight, 0).toFixed(1)}</span>
                 </div>
              </header>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8">
                 {fieldDefinitions.map(df => (
                    <div key={df.id} className="p-6 bg-slate-900 border border-slate-800 rounded-[2.5rem] space-y-6 group hover:border-accent-primary/20 transition-all">
                       <div className="flex justify-between items-center">
                          <div className="space-y-1">
                             <div className="flex items-center gap-3">
                                <p className="text-lg font-black text-white italic font-serif uppercase leading-none">{df.field_label}</p>
                                {df.required && <span className="text-[7px] font-black text-rose-500 uppercase bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">Critical Node</span>}
                             </div>
                             <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest italic">Precision Weight: x{df.qc_weight}</p>
                          </div>
                          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 shadow-inner">
                             {(['CORRECT', 'INCORRECT', 'N/A', 'DISPUTED'] as const).map(res => {
                               if (res === 'N/A' && !df.allow_na) return null;
                               const isActive = currentReviewJson[df.field_key] === res;
                               const btnColor = res === 'CORRECT' ? 'emerald' : res === 'INCORRECT' ? 'rose' : res === 'DISPUTED' ? 'amber' : 'slate';
                               return (
                                 <button 
                                   key={res} 
                                   onClick={() => handleFieldDecision(df.field_key, res)}
                                   className={`px-4 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${isActive ? `bg-${btnColor}-600 text-white shadow-lg` : 'text-slate-600 hover:text-slate-300'}`}
                                 >
                                   {res}
                                 </button>
                               );
                             })}
                          </div>
                       </div>
                    </div>
                 ))}
              </div>

              <footer className="p-8 border-t border-slate-800 bg-slate-950/40 space-y-6 shrink-0">
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-accent-primary uppercase tracking-widest ml-6 italic">Audit Trace Ledger (Rationale Mandatory)</label>
                    <textarea 
                       className="w-full bg-slate-950 border border-slate-800 rounded-[2rem] p-6 text-sm text-white italic font-serif outline-none focus:ring-4 focus:ring-accent-primary/10 shadow-inner"
                       placeholder="Define the structural reasoning for the audit outcome..."
                       rows={3}
                       value={remarks}
                       onChange={e => setRemarks(e.target.value)}
                    />
                 </div>
                 <button 
                    onClick={handleCommitReview}
                    disabled={submitting || !remarks}
                    className="w-full py-8 bg-accent-primary text-white rounded-[2.5rem] font-black uppercase text-sm tracking-[0.4em] shadow-3xl shadow-accent-primary/40 flex items-center justify-center gap-6 hover:brightness-110 active:scale-95 transition-all disabled:opacity-30"
                 >
                    {submitting ? <Loader2 className="animate-spin" size={24}/> : <>Initiate Clearance Protocol <ShieldCheck size={28}/></>}
                 </button>
              </footer>
           </div>

           <div className="bg-indigo-600/5 border border-indigo-500/10 rounded-[2.5rem] p-8 space-y-4 shadow-inner relative overflow-hidden shrink-0">
              <div className="absolute top-0 right-0 p-6 text-indigo-500/5"><Scale size={120}/></div>
              <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] relative z-10 flex items-center gap-3"><ShieldAlert size={16}/> Weighted Index Rule</h3>
              <p className="text-xs text-slate-500 italic font-medium leading-relaxed relative z-10">
                 System enforces a <span className="text-indigo-400 font-bold">95.0% Weighted Integrity Index</span>. Audits failing this threshold automatically route the parent task back to production.
              </p>
           </div>
        </aside>
      </div>

      <footer className="fixed bottom-0 left-72 right-0 h-16 bg-slate-950/90 backdrop-blur-xl border-t border-slate-900 px-10 flex items-center justify-between z-[100] pointer-events-none">
         <div className="flex items-center gap-10">
            <div className="flex items-center gap-3">
               <div className="w-2 h-2 rounded-full bg-accent-primary animate-pulse shadow-blue"></div>
               <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">Verification Mode: ACTIVE</span>
            </div>
            <div className="flex items-center gap-3">
               <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-emerald-500/50"></div>
               <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">Audit Engine: Nominal</span>
            </div>
         </div>
         <p className="text-[9px] font-black text-slate-800 uppercase tracking-[0.4em] italic font-serif leading-none">AnnoNest High-Precision Audit — v2.0 CANON</p>
      </footer>
    </div>
  );
};

export default QAWorkbench;