
import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Loader2, Check, X, RefreshCw, Layers, 
  Clock, Target, Database, FileText, Activity
} from 'lucide-react';
import { supabaseService } from '../services/supabaseService';
// Fixed: Using correctly named type from types.ts
import { ApprovalQueueItem, UserProfile } from '../types';

interface Props {
  userProfile: UserProfile;
}

const ExtractionApprovals: React.FC<Props> = ({ userProfile }) => {
  const [queue, setQueue] = useState<ApprovalQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    // Fixed: fetchApprovalQueue is now implemented in supabaseService
    const data = await supabaseService.fetchApprovalQueue(userProfile.tenant_id);
    setQueue(data);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleAction = async (id: string, action: 'APPROVE' | 'REJECT') => {
    setProcessing(id);
    let res;
    if (action === 'APPROVE') {
      // Fixed: Passing mandatory userId and tenantId to satisfy the 3-argument requirement
      res = await supabaseService.approveIntelligence(id, userProfile.user_id, userProfile.tenant_id);
    } else {
      const reason = prompt("Enter rejection rationale for audit ledger:");
      if (reason === null) { setProcessing(null); return; }
      // Fixed: Service method implemented
      res = await supabaseService.rejectIntelligence(id, userProfile.user_id, reason || 'Specialist manual rejection.');
    }
    
    if (res.success) {
      setQueue(prev => prev.filter(item => item.id !== id));
    }
    setProcessing(null);
  };

  if (loading) return (
    <div className="h-full flex items-center justify-center">
      <Loader2 className="animate-spin text-brand-primary" size={40} />
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-500 max-w-[1600px] mx-auto pb-40">
      <header className="flex justify-between items-end border-b border-border-ui dark:border-slate-800 pb-10">
        <div className="space-y-4">
          <h1 className="text-6xl font-black flex items-center gap-6 text-text-primary dark:text-white tracking-tighter uppercase italic font-serif leading-none">
            <ShieldCheck className="text-brand-primary shrink-0" size={54} /> Approvals
          </h1>
          <p className="text-text-secondary font-medium text-lg italic">Refinery Clearance Plane — Intelligence Human-in-the-Loop</p>
        </div>
        <button onClick={loadData} className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-slate-500 hover:text-brand-primary transition-all shadow-lg">
          <RefreshCw size={24} />
        </button>
      </header>

      {queue.length === 0 ? (
        <div className="bg-card-panel dark:bg-slate-900 border border-border-ui dark:border-slate-800 p-40 rounded-[4rem] text-center space-y-8">
           <Layers size={64} className="mx-auto text-slate-800" />
           <p className="text-2xl font-black italic font-serif uppercase tracking-tight opacity-20">Clearance queue is empty.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8">
          {queue.map(item => (
            <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-[3rem] overflow-hidden shadow-2xl flex flex-col lg:flex-row items-stretch transition-all hover:border-brand-primary/40 group">
              <div className="lg:w-1/3 p-12 bg-slate-950 border-r border-slate-800 space-y-10">
                <div className="space-y-3">
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2"><Target size={12}/> Anchored Entity</span>
                  <h3 className="text-2xl font-black text-white italic font-serif uppercase tracking-tight leading-none">{(item as any).entities?.name || 'Institutional Node'}</h3>
                </div>
                <div className="pt-10 border-t border-slate-900 flex items-center gap-4 text-[10px] font-bold text-slate-600 uppercase italic">
                   <Clock size={14} /> Ingested: {new Date(item.created_at).toLocaleString()}
                </div>
              </div>

              <div className="flex-1 p-12 space-y-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 text-brand-primary/5 group-hover:text-brand-primary/10 transition-colors"><Database size={180} /></div>
                <div className="space-y-6 relative z-10">
                   <span className="text-[10px] font-black text-blue-500 bg-blue-500/10 border border-blue-500/20 px-4 py-1.5 rounded-lg uppercase tracking-widest italic">{item.intelligence_type} Insight</span>
                   <p className="text-3xl text-white italic font-serif leading-tight select-all">"{item.insight}"</p>
                </div>
                {item.diff_preview && (
                  <div className="p-8 bg-slate-950 border border-slate-800 rounded-[2rem] relative z-10 shadow-inner">
                     <p className="text-[9px] font-black text-slate-700 uppercase tracking-widest mb-6 flex items-center gap-2"><Activity size={14} className="text-amber-500"/> Differential Delta</p>
                     <p className="text-xs text-emerald-500 font-mono italic leading-relaxed">+{item.diff_preview}</p>
                  </div>
                )}
              </div>

              <div className="lg:w-80 p-10 bg-slate-950 flex flex-col justify-center gap-4 border-l border-slate-800">
                 <button 
                  onClick={() => handleAction(item.id, 'APPROVE')}
                  disabled={!!processing}
                  className="w-full py-6 bg-emerald-600 text-white rounded-[1.75rem] font-black uppercase text-[11px] tracking-[0.2em] shadow-xl hover:bg-emerald-500 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-30"
                 >
                   {processing === item.id ? <Loader2 className="animate-spin" size={16}/> : <><Check size={18}/> Approve</>}
                 </button>
                 <button 
                  onClick={() => handleAction(item.id, 'REJECT')}
                  disabled={!!processing}
                  className="w-full py-6 bg-slate-900 border border-slate-800 text-slate-500 rounded-[1.75rem] font-black uppercase text-[11px] tracking-[0.2em] hover:text-rose-500 hover:border-rose-500/40 transition-all flex items-center justify-center gap-3 disabled:opacity-30"
                 >
                   <X size={18}/> Reject
                 </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExtractionApprovals;
