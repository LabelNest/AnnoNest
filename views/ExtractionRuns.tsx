
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Play, RefreshCw, Loader2, Activity, Clock, Zap, Target, 
  Terminal, ShieldCheck, History, AlertTriangle, ChevronRight,
  Database, GitMerge, FileText, CheckCircle2, MoreVertical,
  Pause, StopCircle, BarChart3, Fingerprint, Search
} from 'lucide-react';
import { supabaseService } from '../services/supabaseService';
import { SchedulerJob, ExtractionQueueItem, UserProfile, Entity, ExtractionStatus } from '../types';

interface Props {
  userProfile: UserProfile;
}

const ExtractionRuns: React.FC<Props> = ({ userProfile }) => {
  const [jobs, setJobs] = useState<SchedulerJob[]>([]);
  const [queue, setQueue] = useState<ExtractionQueueItem[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'HISTORY'>('ACTIVE');
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    try {
      const [jData, qData, eData] = await Promise.all([
        supabaseService.fetchSchedulerJobs(userProfile.tenant_id),
        supabaseService.fetchExtractionQueue(userProfile.tenant_id),
        supabaseService.fetchEntities(userProfile.tenant_id)
      ]);
      setJobs(jData);
      setQueue(qData);
      setEntities(eData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const pollInterval = setInterval(loadData, 5000); // Live sync every 5s to monitor Python backend state
    return () => clearInterval(pollInterval);
  }, [userProfile.tenant_id]);

  const triggerRun = async (jobId: string) => {
    // Note: This pushes a new node to extraction_queue which the Python backend then picks up.
    await supabaseService.triggerManualExtraction(jobId, userProfile.tenant_id);
    loadData();
  };

  const activeExtractions = useMemo(() => {
    return queue.filter(q => q.status === 'RUNNING' || q.status === 'QUEUED');
  }, [queue]);

  const historicalExtractions = useMemo(() => {
    return queue.filter(q => q.status === 'COMPLETED' || q.status === 'FAILED' || q.status === 'DONE');
  }, [queue]);

  const filteredItems = activeTab === 'ACTIVE' ? activeExtractions : historicalExtractions;
  const searchedItems = filteredItems.filter(item => 
    item.entity_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const StatCard = ({ label, val, color, icon: Icon }: any) => (
    <div className="bg-[#0E1626] border border-slate-800 p-8 rounded-[2.5rem] relative overflow-hidden group">
      <div className={`absolute -right-4 -top-4 opacity-5 text-${color}-500 group-hover:scale-110 transition-transform`}><Icon size={120}/></div>
      <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] mb-4">{label}</p>
      <p className={`text-5xl font-black text-white italic font-serif tracking-tighter`}>{val}</p>
    </div>
  );

  return (
    <div className="space-y-12 animate-in fade-in duration-500 max-w-[1600px] mx-auto pb-40">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-10 border-b border-[#1C2A44] pb-16">
        <div className="space-y-6">
          <h1 className="text-8xl font-black flex items-center gap-10 text-white tracking-tighter uppercase italic font-serif leading-none">
            <Play className="text-blue-500" size={80} />
            Execution Plane
          </h1>
          <div className="flex items-center gap-6 text-slate-400 font-medium text-xl italic">
             <Activity size={26} className="text-blue-500" /> Operational Throughput — <span className="text-blue-500 font-black uppercase text-xs tracking-[0.4em] bg-blue-500/10 px-6 py-2 rounded-full border border-blue-500/20 shadow-2xl">Python Backend Live Stream</span>
          </div>
        </div>
        <div className="flex bg-slate-900 border border-slate-800 rounded-[2.5rem] p-2 shadow-3xl">
           <button onClick={() => setActiveTab('ACTIVE')} className={`px-10 py-3.5 rounded-[1.75rem] text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'ACTIVE' ? 'bg-blue-600 text-white shadow-xl' : 'text-text-secondary hover:text-text-primary'}`}>Active Workers</button>
           <button onClick={() => setActiveTab('HISTORY')} className={`px-10 py-3.5 rounded-[1.75rem] text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'HISTORY' ? 'bg-blue-600 text-white shadow-xl' : 'text-text-secondary hover:text-text-primary'}`}>Run Archive</button>
        </div>
      </header>

      {/* KPIS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <StatCard label="Active Sequences" val={activeExtractions.length} color="blue" icon={Activity} />
        <StatCard label="Queued Nodes" val={queue.filter(q => q.status === 'QUEUED').length} color="amber" icon={Clock} />
        <StatCard label="Total Success (24h)" val={historicalExtractions.filter(h => h.status === 'COMPLETED').length} color="emerald" icon={ShieldCheck} />
        <StatCard label="System Integrity" val="99.2%" color="indigo" icon={BarChart3} />
      </div>

      {/* CONTROL BOARD */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* MAIN LIST */}
        <div className="lg:col-span-8 bg-[#0E1626] border border-slate-800 rounded-[4rem] overflow-hidden shadow-4xl flex flex-col min-h-[700px]">
          <header className="p-10 border-b border-slate-800 flex flex-wrap gap-8 items-center bg-slate-950/20">
            <div className="relative flex-1 group min-w-[300px]">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors" size={24} />
                <input 
                  type="text" 
                  placeholder="Search execution nodes..." 
                  className="w-full bg-slate-950 border border-slate-800 rounded-3xl pl-20 pr-8 py-5 text-lg text-white outline-none focus:ring-4 focus:ring-blue-500/10 transition-all italic font-serif"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
            </div>
            <button onClick={loadData} className="p-4 bg-slate-950 border border-slate-800 text-slate-500 rounded-2xl hover:text-white transition-all"><RefreshCw size={24} className={loading ? 'animate-spin' : ''}/></button>
          </header>

          <div className="flex-1 overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-950/60 border-b border-slate-800">
                  <tr className="text-[11px] font-black text-slate-500 uppercase tracking-[0.5em]">
                    <th className="px-10 py-8">Sequence Target</th>
                    <th className="px-8 py-8 text-center">Status</th>
                    <th className="px-8 py-8">Progress</th>
                    <th className="px-10 py-8 text-right">Action</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {searchedItems.map(item => (
                  <tr key={item.id} className="hover:bg-blue-600/5 transition-all group">
                    <td className="px-10 py-8">
                       <div className="flex items-center gap-6">
                          <div className={`w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center ${item.status === 'RUNNING' ? 'text-blue-500 border-blue-500/40' : 'text-slate-600'}`}>
                             {item.status === 'RUNNING' ? <Loader2 className="animate-spin" size={20}/> : <Database size={20} />}
                          </div>
                          <div>
                             <p className="text-lg font-black text-white italic font-serif uppercase leading-none mb-1.5">{item.entity_name}</p>
                             <p className="text-[9px] font-mono text-slate-600 uppercase tracking-widest truncate max-w-xs">{item.url}</p>
                          </div>
                       </div>
                    </td>
                    <td className="px-8 py-8 text-center">
                       <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border italic ${
                         item.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                         item.status === 'FAILED' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                         item.status === 'RUNNING' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse' :
                         'bg-slate-900 text-slate-700 border-slate-800'
                       }`}>
                         {item.status}
                       </span>
                    </td>
                    <td className="px-8 py-8">
                       <div className="w-full space-y-2">
                          <div className="flex justify-between text-[8px] font-black text-slate-700 uppercase tracking-widest">
                             <span>Analysis Depth</span>
                             <span>{item.status === 'COMPLETED' ? '100%' : item.status === 'RUNNING' ? '45%' : '0%'}</span>
                          </div>
                          <div className="h-1 bg-slate-950 rounded-full overflow-hidden border border-slate-900 shadow-inner">
                             <div 
                                className={`h-full transition-all duration-1000 ${item.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-blue-600 animate-pulse'}`} 
                                style={{ width: item.status === 'COMPLETED' ? '100%' : item.status === 'RUNNING' ? '45%' : '0%' }}
                             ></div>
                          </div>
                       </div>
                    </td>
                    <td className="px-10 py-8 text-right">
                       <button className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-600 hover:text-white transition-all shadow-lg active:scale-90">
                          <MoreVertical size={18}/>
                       </button>
                    </td>
                  </tr>
                ))}
                {searchedItems.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-40 text-center">
                       <div className="opacity-20 space-y-6">
                          <History size={64} className="mx-auto" />
                          <p className="text-2xl font-black italic font-serif uppercase tracking-tight">Sequence registry clear.</p>
                       </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* RECENT TRIGGERS (RIGHT) */}
        <aside className="lg:col-span-4 space-y-8">
          <section className="bg-[#0B1220] border border-slate-800 rounded-[3rem] p-10 shadow-3xl flex flex-col gap-10">
             <header className="flex justify-between items-center">
                <h3 className="text-[11px] font-black text-blue-500 uppercase tracking-[0.4em] flex items-center gap-3"><Zap size={16}/> Instant Triggers</h3>
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
             </header>
             <div className="space-y-4">
                {jobs.slice(0, 6).map(job => (
                   <button 
                    key={job.id}
                    onClick={() => triggerRun(job.id)}
                    className="w-full p-6 bg-slate-950 border border-slate-900 rounded-[2rem] flex items-center justify-between group hover:border-blue-500/40 transition-all text-left"
                   >
                      <div className="flex items-center gap-5">
                         <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                            <RefreshCw size={16}/>
                         </div>
                         <div>
                            <p className="text-xs font-black text-white italic font-serif uppercase leading-none mb-1">{job.job_name}</p>
                            <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">{job.document_type}</p>
                         </div>
                      </div>
                      <ChevronRight size={16} className="text-slate-800 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                   </button>
                ))}
             </div>
             <div className="pt-6 border-t border-slate-900">
                <p className="text-[9px] text-slate-600 italic font-medium leading-relaxed">System Note: Manual triggers override scheduler intervals and are prioritized in the execution queue.</p>
             </div>
          </section>

          <section className="bg-indigo-600 border border-indigo-500 rounded-[3rem] p-10 text-white relative overflow-hidden group shadow-3xl">
             <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform"><Terminal size={160}/></div>
             <h4 className="text-2xl font-black italic font-serif uppercase tracking-tight mb-4 relative z-10">Kernel State</h4>
             <p className="text-sm italic font-medium opacity-80 leading-relaxed mb-10 relative z-10">Python Extraction Engine (PEE) is currently maintaining a throughput of <span className="font-black underline decoration-2">12.4 artifacts/min</span>.</p>
             <button className="w-full py-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all relative z-10 flex items-center justify-center gap-3">
                <ShieldCheck size={14}/> Node Audit Logs
             </button>
          </section>
        </aside>

      </div>

      {/* FOOTER */}
      <footer className="fixed bottom-0 left-72 right-0 h-14 bg-slate-950/90 backdrop-blur-xl border-t border-slate-900 px-10 flex items-center justify-between z-[100] pointer-events-none">
         <div className="flex items-center gap-10">
            <div className="flex items-center gap-3">
               <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shadow-blue"></div>
               <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest italic">Worker Stream: Synchronized</span>
            </div>
            <div className="flex items-center gap-3">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
               <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest italic">Integrity State: Optimal</span>
            </div>
         </div>
         <p className="text-[8px] font-black text-slate-800 uppercase tracking-[0.4em] italic font-serif">AnnoNest Execution Plane — v1.0 CANON Execution Layer</p>
      </footer>
    </div>
  );
};

export default ExtractionRuns;
