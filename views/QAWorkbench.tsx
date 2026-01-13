
import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, SearchCheck, CheckCircle2, XCircle, AlertCircle, 
  ArrowRight, FileText, User, Zap, Landmark, ExternalLink, RefreshCw,
  Edit3, Save, X, ThumbsUp, ThumbsDown, MessageSquare, Box, History,
  Shield, Loader2, GitPullRequest, Database
} from 'lucide-react';
import { supabaseService } from '../services/supabaseService';
import { QAItem, QAResult, UserProfile, QAStatus } from '../types';

interface Props {
  userProfile: UserProfile;
  onComplete: () => void;
}

const QAWorkbench: React.FC<Props> = ({ userProfile, onComplete }) => {
  const [items, setItems] = useState<QAItem[]>([]);
  const [activeItem, setActiveItem] = useState<QAItem | null>(null);
  const [results, setResults] = useState<QAResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const data = await supabaseService.fetchQAItems(userProfile.tenant_id, 'PENDING');
    setItems(data);
    if (data.length > 0) {
      handleSelectItem(data[0]);
    } else {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectItem = async (item: QAItem) => {
    setActiveItem(item);
    setLoading(true);
    // Fetch theoretical field-level data for verification
    // In production, this would query entities_{type} tables
    const mockResults: QAResult[] = [
      { id: '1', qa_item_id: item.id, field_name: 'Name', ai_value: 'Blackstone Grp', analyst_value: 'Blackstone Group LP', qa_value: 'Blackstone Group LP', status: 'PASS', weight: 1.0 },
      { id: '2', qa_item_id: item.id, field_name: 'AUM', ai_value: '$1T', analyst_value: '$1.1T', qa_value: '', status: 'PASS', weight: 0.8 },
      { id: '3', qa_item_id: item.id, field_name: 'HQ', ai_value: 'New York', analyst_value: 'NY', qa_value: '', status: 'PASS', weight: 0.5 },
    ];
    setResults(mockResults);
    setLoading(false);
  };

  const handleFieldAction = (idx: number, status: 'PASS' | 'FAIL' | 'EDIT_PASS', newValue?: any) => {
    setResults(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], status, qa_value: newValue ?? next[idx].qa_value };
      return next;
    });
  };

  const handleFieldComment = (idx: number, comment: string) => {
    setResults(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], comment };
      return next;
    });
  };

  const handleSubmitQA = async (finalStatus: QAStatus) => {
    if (!activeItem) return;
    setSubmitting(true);
    const res = await supabaseService.submitQAResults(activeItem.id, results, finalStatus);
    if (res.success) {
      onComplete();
      loadData();
    }
    setSubmitting(false);
  };

  if (loading && items.length === 0) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center gap-6 animate-in fade-in">
        <Loader2 className="animate-spin text-blue-500" size={48} />
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Initializing QA Pipeline...</span>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in max-w-lg mx-auto">
        <div className="w-24 h-24 rounded-[2rem] bg-slate-900 flex items-center justify-center border border-slate-800 text-slate-700 shadow-2xl relative">
          <ShieldCheck size={48} />
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center text-[10px] font-black border border-slate-700 text-white">✓</div>
        </div>
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Integrity Cleared</h2>
          <p className="text-slate-500 mt-3 font-medium leading-relaxed italic">No unverified data records in the sampling queue. The production engine is operating within quality thresholds.</p>
        </div>
        <button 
          onClick={loadData}
          className="px-10 py-4 bg-blue-600 text-white rounded-[1.5rem] hover:bg-blue-500 font-black transition-all shadow-2xl flex items-center gap-3 active:scale-95"
        >
          Check Sampling Engine <RefreshCw size={20} />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in slide-in-from-right-8 duration-500 max-w-[1600px] mx-auto pb-20">
      <div className="flex justify-between items-center border-b border-slate-800 pb-8">
        <div>
          <h1 className="text-4xl font-black flex items-center gap-4 text-white uppercase italic font-serif tracking-tighter">
            <SearchCheck className="text-blue-500" size={40} />
            QA Workbench
          </h1>
          <p className="text-slate-500 mt-2 font-medium flex items-center gap-3 italic">
            <GitPullRequest size={16} className="text-blue-400" /> Reviewing {activeItem?.entity_type} record — <span className="text-blue-400 font-black uppercase text-[10px] tracking-widest bg-blue-400/5 px-3 py-1 rounded-full">Sample Verified</span>
          </p>
        </div>
        <div className="flex items-center gap-6">
           <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Queue Status</span>
              <span className="text-xl font-black text-white italic font-serif">{items.length} Pending Items</span>
           </div>
           <button onClick={loadData} className="p-4 bg-slate-900 border border-slate-800 text-slate-500 rounded-2xl hover:text-white transition-all"><RefreshCw size={24} /></button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-10">
        {/* Left Sidebar - Queue */}
        <div className="xl:col-span-1 space-y-4">
           <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] mb-6 flex items-center gap-2 px-2">
             <History size={16} className="text-blue-500" /> Sampling Queue
           </h4>
           <div className="space-y-3 max-h-[700px] overflow-y-auto custom-scrollbar pr-2">
              {items.map(item => (
                <button 
                  key={item.id}
                  onClick={() => handleSelectItem(item)}
                  className={`w-full p-6 border rounded-[1.75rem] text-left transition-all group relative overflow-hidden ${activeItem?.id === item.id ? 'bg-blue-600 border-blue-500 shadow-2xl text-white' : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-400'}`}
                >
                   <div className="flex justify-between items-start mb-4">
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase border ${activeItem?.id === item.id ? 'bg-white/20 border-white/30 text-white' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>{item.entity_type}</span>
                      <span className={`text-[9px] font-black italic ${item.priority === 'HIGH' ? 'text-rose-400' : 'text-blue-300'}`}>{item.priority} RISK</span>
                   </div>
                   <p className={`text-base font-black italic font-serif truncate ${activeItem?.id === item.id ? 'text-white' : 'text-slate-200'}`}>ID: {item.entity_id.slice(0, 12)}</p>
                   <p className={`text-[10px] mt-2 font-medium opacity-60`}>Sampled {new Date(item.sampled_at).toLocaleTimeString()}</p>
                </button>
              ))}
           </div>
        </div>

        {/* Main Panel - Field Comparison */}
        <div className="xl:col-span-3 space-y-8">
           <div className="bg-slate-900 border border-slate-800 rounded-[3rem] overflow-hidden shadow-3xl">
              <div className="p-10 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
                 <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center text-blue-500 shadow-inner">
                       <Landmark size={28} />
                    </div>
                    <div>
                       <h3 className="text-3xl font-black text-white italic font-serif leading-none mb-2">Record Inspection</h3>
                       <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Target Module: {activeItem?.module} // Analyst: {activeItem?.analyst_id}</p>
                    </div>
                 </div>
                 <div className="flex gap-4">
                    <button 
                      onClick={() => handleSubmitQA('PASSED')}
                      disabled={submitting}
                      className="px-10 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-2xl hover:bg-emerald-500 transition-all flex items-center gap-3"
                    >
                       {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={18} />} Final Pass
                    </button>
                    <button 
                      onClick={() => handleSubmitQA('FAILED')}
                      disabled={submitting}
                      className="px-10 py-4 bg-rose-600 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-2xl hover:bg-rose-500 transition-all flex items-center gap-3"
                    >
                       <XCircle size={18} /> Flag Failures
                    </button>
                 </div>
              </div>

              <div className="p-10 space-y-6">
                 <div className="grid grid-cols-12 gap-8 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 px-4">
                    <div className="col-span-2">Attribute</div>
                    <div className="col-span-3">Analyst State</div>
                    <div className="col-span-3">QA Verification</div>
                    <div className="col-span-4">Audit Feedback</div>
                 </div>

                 {results.map((res, idx) => (
                   <div key={idx} className={`p-8 bg-slate-950/50 border border-slate-800 rounded-[2rem] grid grid-cols-12 gap-8 items-center transition-all ${res.status === 'FAIL' ? 'ring-1 ring-rose-500/50 border-rose-500/20' : ''}`}>
                      <div className="col-span-2 flex flex-col gap-1">
                         <span className="text-xs font-black text-blue-400 italic font-serif uppercase">{res.field_name}</span>
                         <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">Wgt: {res.weight}</span>
                      </div>
                      
                      <div className="col-span-3">
                         <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                            <p className="text-xs text-slate-400 font-medium italic mb-1 uppercase text-[8px]">Analyst Claim</p>
                            <p className="text-sm font-bold text-white truncate">{res.analyst_value}</p>
                         </div>
                      </div>

                      <div className="col-span-3 flex gap-2">
                         <button 
                           onClick={() => handleFieldAction(idx, 'PASS')}
                           className={`flex-1 py-3.5 rounded-xl border flex items-center justify-center transition-all ${res.status === 'PASS' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-600 hover:text-white'}`}
                         >
                            <ThumbsUp size={16} />
                         </button>
                         <button 
                           onClick={() => handleFieldAction(idx, 'FAIL')}
                           className={`flex-1 py-3.5 rounded-xl border flex items-center justify-center transition-all ${res.status === 'FAIL' ? 'bg-rose-600 border-rose-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-600 hover:text-white'}`}
                         >
                            <ThumbsDown size={16} />
                         </button>
                         <button 
                           onClick={() => handleFieldAction(idx, 'EDIT_PASS')}
                           className={`flex-1 py-3.5 rounded-xl border flex items-center justify-center transition-all ${res.status === 'EDIT_PASS' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-600 hover:text-white'}`}
                         >
                            <Edit3 size={16} />
                         </button>
                      </div>

                      <div className="col-span-4 relative">
                         <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700" size={16} />
                         <input 
                           type="text" 
                           placeholder="Audit Comment..." 
                           className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-12 pr-4 py-3.5 text-xs text-white outline-none focus:ring-2 focus:ring-blue-500 italic"
                           value={res.comment || ''}
                           onChange={(e) => handleFieldComment(idx, e.target.value)}
                         />
                      </div>
                   </div>
                 ))}
              </div>

              <div className="p-10 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
                 <div className="flex items-center gap-8">
                    <div className="flex items-center gap-3">
                       <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                       <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Confidence Yield: <span className="text-white">84.2%</span></span>
                    </div>
                    <div className="flex items-center gap-3">
                       <div className="w-3 h-3 rounded-full bg-emerald-600"></div>
                       <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Verification Depth: <span className="text-white">100%</span></span>
                    </div>
                 </div>
                 <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.2em] italic font-serif">Registry Handshake Protocol: Ready</p>
              </div>
           </div>

           <div className="p-10 bg-blue-600/5 border border-blue-600/10 rounded-[3rem] flex items-start gap-8 shadow-xl">
              <div className="p-4 bg-blue-600/10 rounded-2xl text-blue-500 border border-blue-500/20 shadow-inner">
                 <Shield size={32} />
              </div>
              <div className="space-y-4">
                 <h5 className="text-xl font-black text-white italic font-serif uppercase tracking-tight">Expert Integrity Guidelines</h5>
                 <p className="text-sm text-slate-500 leading-relaxed italic">
                    All edits made during the QA phase are logged as "Gold Source Truth" and will immediately override existing registry records. Failing a field will trigger a priority resolution ticket for the analyst.
                 </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default QAWorkbench;
