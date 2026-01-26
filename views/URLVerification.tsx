
import React, { useState, useEffect, useMemo } from 'react';
import { 
  CheckCircle2, XCircle, ExternalLink, RefreshCw, Loader2, 
  GlobeLock, Filter, Search, ChevronRight, Hash, 
  CheckSquare, Square, ShieldCheck, AlertCircle, X
} from 'lucide-react';
import { supabaseService } from '../services/supabaseService';
// Fixed: Using correct imports from types.ts
import { FirmURL, UserProfile, URLType } from '../types';

const URL_TYPES: URLType[] = [
  'TEAM_PAGE', 'BIO_PAGE', 'PORTFOLIO_PAGE', 'FIRM_WEBSITE', 
  'NEWS_WIRE', 'PERSONAL_WEBSITE'
];

// Extended list for this view as per objective
const EXTENDED_URL_TYPES = [
  'TEAM', 'ABOUT', 'PORTFOLIO', 'FUNDS', 'FILINGS', 
  'NEWS', 'CONTACT', 'CAREERS', 'ESG', 'STRATEGY', 
  'PHILOSOPHY', 'OTHER'
];

interface Props {
  userProfile: UserProfile;
}

const URLVerification: React.FC<Props> = ({ userProfile }) => {
  // Fixed: Added entity_name and entity_type to the urls state type to resolve access errors
  const [urls, setUrls] = useState<(FirmURL & { entity_name?: string; entity_type?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  
  // Rejection Modal
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const loadData = async () => {
    setLoading(true);
    // Fixed: fetchVerifiableURLs method now implemented
    const data = await supabaseService.fetchVerifiableURLs(userProfile.tenant_id);
    setUrls(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredUrls = useMemo(() => {
    return urls.filter(u => 
      u.entity_name?.toLowerCase().includes(search.toLowerCase()) || 
      u.url.toLowerCase().includes(search.toLowerCase())
    );
  }, [urls, search]);

  const handleUpdateType = async (id: string, type: string) => {
    setSyncing(id);
    // Fixed: updateFirmURLStatus method now implemented
    const res = await supabaseService.updateFirmURLStatus(id, { url_type: type as any });
    if (res.success) {
      setUrls(prev => prev.map(u => u.id === id ? { ...u, url_type: type as any } : u));
    }
    setSyncing(null);
  };

  const handleApprove = async (id: string) => {
    setSyncing(id);
    // Fixed: verified_at and verified_by are now correctly recognized by the FirmURL interface
    const res = await supabaseService.updateFirmURLStatus(id, {
      verification_status: 'VERIFIED',
      verified_at: new Date().toISOString(),
      verified_by: userProfile.user_id
    });
    if (res.success) {
      setUrls(prev => prev.filter(u => u.id !== id));
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
    setSyncing(null);
  };

  const handleReject = async () => {
    if (!rejectingId) return;
    setSyncing(rejectingId);
    // Fixed: updateFirmURLStatus method now implemented
    const res = await supabaseService.updateFirmURLStatus(rejectingId, {
      verification_status: 'REJECTED'
    });
    if (res.success) {
      setUrls(prev => prev.filter(u => u.id !== rejectingId));
      setRejectingId(null);
      setRejectionReason('');
    }
    setSyncing(null);
  };

  const handleBulkApprove = async () => {
    // Fixed: Explicitly casting Array.from result to string[] to resolve 'unknown[]' assignment error in strict type checking
    const ids = Array.from(selectedIds) as string[];
    if (ids.length === 0) return;
    setLoading(true);
    // Fixed: bulkUpdateFirmURLs method now implemented
    const res = await supabaseService.bulkUpdateFirmURLs(ids, {
      verification_status: 'VERIFIED',
      verified_at: new Date().toISOString(),
      verified_by: userProfile.user_id
    });
    if (res.success) {
      setUrls(prev => prev.filter(u => !selectedIds.has(u.id)));
      // Fixed: Explicitly typed generic for the new Set to avoid unknown array typing issues
      setSelectedIds(new Set<string>());
    }
    setLoading(false);
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredUrls.length) {
      setSelectedIds(new Set<string>());
    } else {
      setSelectedIds(new Set(filteredUrls.map(u => u.id)));
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-500 max-w-[1600px] mx-auto pb-40">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-10 border-b border-slate-800 pb-16">
        <div className="space-y-6">
          <h1 className="text-8xl font-black flex items-center gap-10 text-white tracking-tighter uppercase italic font-serif leading-none">
            <GlobeLock className="text-blue-500" size={80} />
            URL Verification
          </h1>
          <div className="flex items-center gap-6 text-slate-400 font-medium text-xl italic">
             <ShieldCheck size={26} className="text-blue-500" /> Quality Control — <span className="text-blue-500 font-black uppercase text-xs tracking-[0.4em] bg-blue-500/10 px-6 py-2 rounded-full border border-blue-500/20 shadow-2xl">Human-in-the-loop Clearance</span>
          </div>
        </div>
        <div className="flex bg-slate-900 border border-slate-800 rounded-[2.5rem] p-2 shadow-3xl">
           <button onClick={loadData} className="p-4 bg-slate-950 text-slate-500 hover:text-white transition-all border border-slate-800 rounded-[1.75rem]"><RefreshCw size={24} className={loading ? 'animate-spin' : ''}/></button>
        </div>
      </header>

      {/* FILTER & BULK BAR */}
      <div className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-xl border border-slate-800 rounded-[3rem] p-6 shadow-2xl flex flex-wrap gap-8 items-center">
         <div className="relative flex-1 group min-w-[300px]">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors" size={24} />
            <input 
              type="text" 
              placeholder="Search firm registry or URL protocol..." 
              className="w-full bg-slate-950 border border-slate-800 rounded-3xl pl-20 pr-8 py-5 text-lg text-white outline-none focus:ring-4 focus:ring-blue-500/10 transition-all italic font-serif"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
         </div>
         
         {selectedIds.size > 0 && (
           <div className="flex items-center gap-6 animate-in slide-in-from-right-4">
              <span className="text-xs font-black text-blue-500 uppercase tracking-widest">{selectedIds.size} nodes selected</span>
              <div className="flex gap-3">
                 <button onClick={handleBulkApprove} className="px-8 py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-emerald-500 active:scale-95 transition-all">Bulk Approve</button>
                 <button onClick={() => setSelectedIds(new Set<string>())} className="p-4 bg-slate-900 text-slate-500 rounded-2xl border border-slate-800 hover:text-white"><X size={20}/></button>
              </div>
           </div>
         )}
      </div>

      {/* DATA GRID */}
      <div className="bg-slate-900 border border-slate-800 rounded-[4rem] overflow-hidden shadow-3xl flex flex-col min-h-[600px]">
        <div className="flex-1 overflow-x-auto custom-scrollbar">
           <table className="w-full text-left border-collapse min-w-[1400px]">
              <thead className="bg-slate-950/40 border-b border-slate-800 sticky top-0 z-10">
                 <tr className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em]">
                    <th className="px-10 py-8 w-20">
                       <button onClick={toggleSelectAll} className="p-2 text-slate-700 hover:text-blue-500 transition-colors">
                          {selectedIds.size === filteredUrls.length && filteredUrls.length > 0 ? <CheckSquare size={20}/> : <Square size={20}/>}
                       </button>
                    </th>
                    <th className="px-8 py-10">Firm Signature</th>
                    <th className="px-8 py-10">Registry Target</th>
                    <th className="px-10 py-10">Verified Source</th>
                    <th className="px-8 py-10">Type Classification</th>
                    <th className="px-8 py-10 text-center">Protocol</th>
                    <th className="px-12 py-10 text-right">Handshake</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                 {loading ? (
                   <tr><td colSpan={7} className="py-40 text-center"><Loader2 className="animate-spin mx-auto text-blue-500" size={48}/></td></tr>
                 ) : filteredUrls.length === 0 ? (
                   <tr><td colSpan={7} className="py-60 text-center opacity-30 italic font-serif text-2xl">Verification backlog is clear. No pending URL signals.</td></tr>
                 ) : (
                   filteredUrls.map(u => (
                    <tr key={u.id} className={`hover:bg-blue-600/5 transition-all group border-l-[6px] border-transparent ${selectedIds.has(u.id) ? 'bg-blue-600/5 border-blue-500' : 'hover:border-blue-500'}`}>
                       <td className="px-10 py-8">
                          <button onClick={() => toggleSelect(u.id)} className={`p-2 transition-all ${selectedIds.has(u.id) ? 'text-blue-500 scale-110' : 'text-slate-800 group-hover:text-slate-600'}`}>
                             {selectedIds.has(u.id) ? <CheckSquare size={20}/> : <Square size={20}/>}
                          </button>
                       </td>
                       <td className="px-8 py-8">
                          <div className="flex items-center gap-5">
                             <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xl font-black text-blue-500 italic font-serif shadow-inner group-hover:scale-110 transition-transform">{u.entity_name?.[0] || 'U'}</div>
                             <div>
                                <p className="text-base font-black text-white italic font-serif leading-none mb-1.5 uppercase tracking-tight group-hover:text-blue-400 transition-colors">{u.entity_name}</p>
                                <p className="text-[9px] font-mono text-slate-600 uppercase tracking-tighter">ID: {u.entity_id.slice(0,14)}</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-8 py-8">
                          <span className="text-[10px] font-black uppercase text-slate-500 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 tracking-widest">{u.entity_type || 'UNKNOWN'}</span>
                       </td>
                       <td className="px-10 py-8">
                          <a href={u.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 group/link">
                             <p className="text-sm font-bold text-slate-400 italic truncate max-w-sm group-hover/link:text-blue-400 transition-colors">{u.url}</p>
                             <ExternalLink size={14} className="text-slate-700 group-hover/link:text-blue-500 transition-colors"/>
                          </a>
                       </td>
                       <td className="px-8 py-8">
                          <select 
                            className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-[10px] font-black uppercase text-slate-300 outline-none cursor-pointer focus:border-blue-500 transition-colors"
                            value={u.url_type}
                            onChange={(e) => handleUpdateType(u.id, e.target.value)}
                          >
                             {EXTENDED_URL_TYPES.map(type => (
                               <option key={type} value={type}>{type}</option>
                             ))}
                          </select>
                       </td>
                       <td className="px-8 py-8 text-center">
                          <span className={`px-3 py-1 rounded text-[8px] font-black uppercase border ${u.source_type === 'AUTO' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>{u.source_type} SOURCE</span>
                       </td>
                       <td className="px-12 py-8 text-right">
                          <div className="flex items-center justify-end gap-3">
                             <button 
                               onClick={() => handleApprove(u.id)}
                               disabled={syncing === u.id}
                               className="p-3 bg-emerald-600/10 text-emerald-500 border border-emerald-500/20 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-lg active:scale-90"
                               title="Approve URL"
                             >
                                <CheckCircle2 size={20}/>
                             </button>
                             <button 
                               onClick={() => setRejectingId(u.id)}
                               disabled={syncing === u.id}
                               className="p-3 bg-rose-600/10 text-rose-500 border border-rose-500/20 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-lg active:scale-90"
                               title="Reject URL"
                             >
                                <XCircle size={20}/>
                             </button>
                          </div>
                       </td>
                    </tr>
                   ))
                 )}
              </tbody>
           </table>
        </div>
      </div>

      {/* REJECTION MODAL */}
      {rejectingId && (
        <div className="fixed inset-0 z-[180] bg-slate-950/95 backdrop-blur-3xl flex items-center justify-center p-10 animate-in fade-in">
           <div className="bg-[#0B1220] border border-slate-800 rounded-[4rem] p-24 max-w-2xl w-full shadow-3xl relative overflow-hidden flex flex-col">
              <div className="absolute top-0 left-0 w-full h-2 bg-rose-600"></div>
              <button onClick={() => setRejectingId(null)} className="absolute top-12 right-12 text-slate-500 hover:text-white transition-all"><X size={48} /></button>
              
              <div className="mb-16 space-y-6">
                 <h2 className="text-6xl font-black text-white italic font-serif uppercase tracking-tight">Reject Node</h2>
                 <p className="text-xl text-slate-500 italic font-medium leading-relaxed">Rejected URLs are purged from the verifiable backlog. Document the structural rationale for this exclusion.</p>
              </div>

              <div className="space-y-4 mb-12">
                 <label className="text-[11px] font-black text-slate-600 uppercase tracking-widest ml-6">Rejection Rationale</label>
                 <textarea 
                   className="w-full bg-slate-950 border border-slate-800 rounded-[2.5rem] p-8 text-white italic font-serif outline-none focus:ring-4 focus:ring-rose-500/10 shadow-inner"
                   placeholder="e.g. Broken link, duplicated node, or irrelevant domain..."
                   value={rejectionReason}
                   onChange={e => setRejectionReason(e.target.value)}
                   rows={5}
                 />
              </div>

              <button 
                onClick={handleReject}
                className="w-full py-10 bg-rose-600 text-white rounded-[3rem] font-black uppercase text-sm tracking-[0.4em] shadow-3xl shadow-rose-600/40 hover:bg-rose-500 transition-all flex items-center justify-center gap-6 active:scale-95"
              >
                 Confirm Purge Protocol <XCircle size={32}/>
              </button>
           </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="fixed bottom-0 left-72 right-0 h-16 bg-slate-950/90 backdrop-blur-xl border-t border-slate-900 px-10 flex items-center justify-between z-[100]">
         <div className="flex items-center gap-10">
            <div className="flex items-center gap-3">
               <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
               <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">Verification Mode: ACTIVE</span>
            </div>
            <div className="flex items-center gap-3">
               <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
               <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">Node Sync: Synchronized</span>
            </div>
         </div>
         <p className="text-[9px] font-black text-slate-800 uppercase tracking-[0.4em] italic font-serif">AnnoNest URL Control — v1.0 CANON Monitor</p>
      </footer>
    </div>
  );
};

export default URLVerification;
