
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Layers, RefreshCw, Loader2, Search, Filter, Activity, 
  Database, Clock, Zap, ChevronRight, Hash, ShieldCheck,
  MoreVertical, ArrowUpRight
} from 'lucide-react';
import { supabaseService } from '../services/supabaseService';
import { ExtractionQueueItem, UserProfile } from '../types';

interface Props {
  userProfile: UserProfile;
}

const ExtractionQueue: React.FC<Props> = ({ userProfile }) => {
  const [queue, setQueue] = useState<ExtractionQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  const loadData = async () => {
    setLoading(true);
    const data = await supabaseService.fetchExtractionQueue(userProfile.tenant_id);
    setQueue(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = useMemo(() => {
    return queue.filter(q => {
      const matchSearch = q.entity_name.toLowerCase().includes(search.toLowerCase()) || 
                          q.url.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === 'ALL' || q.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [queue, search, filterStatus]);

  return (
    <div className="space-y-12 animate-in fade-in duration-500 max-w-[1600px] mx-auto pb-40">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-10 border-b border-slate-800 pb-16">
        <div className="space-y-6">
          <h1 className="text-8xl font-black flex items-center gap-10 text-white tracking-tighter uppercase italic font-serif leading-none">
            <Layers className="text-blue-500" size={80} />
            Crawler Queue
          </h1>
          <div className="flex items-center gap-6 text-slate-400 font-medium text-xl italic">
             <Activity size={26} className="text-blue-500" /> Pipeline Flow — <span className="text-blue-500 font-black uppercase text-xs tracking-[0.4em] bg-blue-500/10 px-6 py-2 rounded-full border border-blue-500/20 shadow-2xl">Read-only Operation Stream</span>
          </div>
        </div>
        <div className="flex bg-slate-900 border border-slate-800 rounded-[2.5rem] p-2 shadow-3xl">
           <button onClick={loadData} className="p-4 bg-slate-950 text-slate-500 hover:text-white transition-all border border-slate-800 rounded-[1.75rem]"><RefreshCw size={24} className={loading ? 'animate-spin' : ''}/></button>
        </div>
      </header>

      {/* FILTER BAR */}
      <div className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-xl border border-slate-800 rounded-[3rem] p-6 shadow-2xl flex flex-wrap gap-8 items-center">
         <div className="relative flex-1 group min-w-[300px]">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors" size={24} />
            <input 
              type="text" 
              placeholder="Search active entity or protocol address..." 
              className="w-full bg-slate-950 border border-slate-800 rounded-3xl pl-20 pr-8 py-5 text-lg text-white outline-none focus:ring-4 focus:ring-blue-500/10 transition-all italic font-serif"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
         </div>
         <div className="flex gap-4">
            <select 
              className="bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-[10px] font-black uppercase text-slate-400 outline-none cursor-pointer focus:border-blue-500 transition-colors"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
               <option value="ALL">All States</option>
               <option value="QUEUED">Queued</option>
               <option value="RUNNING">Running</option>
               <option value="COMPLETED">Completed</option>
               <option value="FAILED">Failed</option>
            </select>
         </div>
      </div>

      {/* DATA GRID */}
      <div className="bg-slate-900 border border-slate-800 rounded-[4rem] overflow-hidden shadow-3xl flex flex-col min-h-[700px]">
        <div className="flex-1 overflow-x-auto custom-scrollbar">
           <table className="w-full text-left border-collapse min-w-[1400px]">
              <thead className="bg-slate-950/40 border-b border-slate-800 sticky top-0 z-10">
                 <tr className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em]">
                    <th className="px-12 py-10">Entity Cluster</th>
                    <th className="px-10 py-10">URL Protocol</th>
                    <th className="px-8 py-10 text-center">Status</th>
                    <th className="px-8 py-10">Delta State</th>
                    <th className="px-10 py-10 text-right">Temporal Signature</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                 {loading ? (
                   <tr><td colSpan={5} className="py-40 text-center"><Loader2 className="animate-spin mx-auto text-blue-500" size={48}/></td></tr>
                 ) : filtered.length === 0 ? (
                   <tr><td colSpan={5} className="py-60 text-center opacity-30 italic font-serif text-2xl">Crawler pipeline is idle. No active extractions.</td></tr>
                 ) : (
                   filtered.map(q => (
                    <tr key={q.id} className="hover:bg-blue-600/5 transition-all group">
                       <td className="px-12 py-8">
                          <div className="flex items-center gap-5">
                             <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-blue-500 shadow-inner group-hover:scale-110 transition-transform">
                                <Database size={20} />
                             </div>
                             <div>
                                <p className="text-base font-black text-white italic font-serif leading-none mb-1.5 uppercase tracking-tight group-hover:text-blue-400 transition-colors">{q.entity_name}</p>
                                <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">{q.entity_type} Node</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-10 py-8">
                          <div className="flex flex-col gap-1.5">
                             <div className="flex items-center gap-3">
                                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded border border-slate-800 text-slate-500">{q.url_type}</span>
                                <p className="text-xs font-bold text-slate-400 italic truncate max-w-sm">{q.url}</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-8 py-8 text-center">
                          <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border italic ${
                             q.status === 'COMPLETED' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                             q.status === 'FAILED' ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' :
                             q.status === 'RUNNING' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400 animate-pulse' :
                             'bg-amber-500/10 border-amber-500/20 text-amber-500'
                          }`}>
                             {q.status}
                          </span>
                       </td>
                       <td className="px-8 py-8">
                          <div className="flex items-center gap-4">
                             {q.change_detected ? (
                                <div className="flex items-center gap-2 text-amber-500">
                                   <Zap size={14} className="animate-pulse" />
                                   <span className="text-[10px] font-black uppercase">Mutation Detected</span>
                                </div>
                             ) : (
                                <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest italic">Stationary</span>
                             )}
                          </div>
                       </td>
                       <td className="px-10 py-8 text-right">
                          <div className="flex flex-col items-end">
                             <p className="text-[10px] font-bold text-slate-500 uppercase">{q.completed_at ? new Date(q.completed_at).toLocaleString() : 'QUEUED'}</p>
                             <p className="text-[8px] font-mono text-slate-700 uppercase mt-1 italic">Protocol_v1.2</p>
                          </div>
                       </td>
                    </tr>
                   ))
                 )}
              </tbody>
           </table>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="fixed bottom-0 left-72 right-0 h-16 bg-slate-950/90 backdrop-blur-xl border-t border-slate-900 px-10 flex items-center justify-between z-[100]">
         <div className="flex items-center gap-10">
            <div className="flex items-center gap-3">
               <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
               <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">Crawler Heartbeat: Monitoring</span>
            </div>
            <div className="flex items-center gap-3">
               <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
               <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">Integrity: Locked</span>
            </div>
         </div>
         <p className="text-[9px] font-black text-slate-800 uppercase tracking-[0.4em] italic font-serif">AnnoNest Crawler Monitor — v1.0 CANON Monitoring</p>
      </footer>
    </div>
  );
};

export default ExtractionQueue;
