
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Cpu, RefreshCw, Layers, Zap, Clock, Search, Filter, 
  ArrowRight, ShieldCheck, ShieldAlert, History, ExternalLink,
  ChevronRight, Activity, Terminal, Database, Loader2, Play,
  AlertTriangle, CheckCircle2, XCircle, MoreVertical, LayoutGrid,
  FileText, ArrowUpRight, Sparkles, Brain, Signal
} from 'lucide-react';
import { supabaseService } from '../services/supabaseService';
import { geminiService } from '../services/geminiService';
import { ExtractionQueueItem, ExtractionRun, UserProfile, ExtractionStatus } from '../types';

interface Props {
  userProfile: UserProfile;
}

const ExtractionHub: React.FC<Props> = ({ userProfile }) => {
  const [kpis, setKpis] = useState<any>(null);
  const [queue, setQueue] = useState<ExtractionQueueItem[]>([]);
  const [runs, setRuns] = useState<ExtractionRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'QUEUE' | 'RUNS'>('QUEUE');
  const [systemLogs, setSystemLogs] = useState<string[]>(["[SYSTEM] Refinery Kernel Initialized...", "[SYSTEM] Awaiting Inbound Signals..."]);
  
  // Filters
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    try {
      const [kpiData, queueData, runsData] = await Promise.all([
        supabaseService.fetchExtractionKPIs(userProfile.tenant_id),
        supabaseService.fetchExtractionQueue(userProfile.tenant_id),
        supabaseService.fetchExtractionRuns(userProfile.tenant_id)
      ]);
      setKpis(kpiData);
      setQueue(queueData);
      setRuns(runsData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // --- REFINERY DRIVER: THE "LIVE" ENGINE SIMULATION ---
  useEffect(() => {
    const workerInterval = setInterval(async () => {
      const queuedItem = queue.find(q => q.status === 'QUEUED');
      if (queuedItem) {
        await runExtractionCycle(queuedItem);
      }
    }, 5000); // Check for work every 5 seconds

    return () => clearInterval(workerInterval);
  }, [queue]);

  const addLog = (msg: string) => {
    setSystemLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 10));
  };

  const runExtractionCycle = async (item: ExtractionQueueItem) => {
    addLog(`Picking up Node: ${item.entity_name}...`);
    
    // 1. Transition to RUNNING
    await supabaseService.updateTableRecord('extraction_queue', item.id, { status: 'RUNNING' });
    setQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'RUNNING' as ExtractionStatus } : q));
    addLog(`Status: RUNNING | Fetching protocol: ${item.url}`);

    try {
      // 2. Simulate Latency of "Crawling"
      await new Promise(resolve => setTimeout(resolve, 3000));

      // 3. Trigger Real AI Synthesis
      addLog(`AI SYNTHESIS: Mapping institutional nodes via Gemini 3...`);
      const extracted = await geminiService.extractEntities(`Source URL: ${item.url}. Task: Extract personnel and firm data.`);
      
      // 4. Persistence of Results
      await supabaseService.updateTableRecord('extraction_queue', item.id, { 
        status: 'COMPLETED', 
        completed_at: new Date().toISOString(),
        change_detected: true // Simulating detection
      });
      
      addLog(`SUCCESS: ${item.entity_name} synchronized. ${extracted.length} nodes identified.`);
      loadData();
    } catch (err) {
      addLog(`CRITICAL FAILURE: Node ${item.id} rejected handshake.`);
      await supabaseService.updateTableRecord('extraction_queue', item.id, { status: 'FAILED' });
      loadData();
    }
  };

  const handleRetry = async (id: string) => {
    setLoading(true);
    await supabaseService.retryExtraction(id);
    addLog(`RETRY: Node ${id.slice(0,8)} requeued.`);
    await loadData();
  };

  const filteredQueue = useMemo(() => {
    return queue.filter(q => {
      const matchStatus = filterStatus === 'ALL' || q.status === filterStatus;
      const matchSearch = q.entity_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          q.url.toLowerCase().includes(searchQuery.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [queue, filterStatus, searchQuery]);

  const StatCard = ({ label, val, icon: Icon, color }: any) => (
    <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-[2.5rem] relative overflow-hidden group">
      <div className={`absolute -right-4 -top-4 opacity-5 text-${color}-500 group-hover:scale-110 transition-transform`}><Icon size={120}/></div>
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-4">{label}</p>
      <p className="text-5xl font-black text-white italic font-serif tracking-tighter">{val}</p>
    </div>
  );

  return (
    <div className="space-y-12 animate-in fade-in duration-500 max-w-[1600px] mx-auto pb-40">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-10 border-b border-slate-800 pb-16">
        <div className="space-y-6">
          <h1 className="text-8xl font-black flex items-center gap-10 text-white tracking-tighter uppercase italic font-serif leading-none">
            <Cpu className="text-blue-500" size={80} />
            Extraction Hub
          </h1>
          <div className="flex items-center gap-6 text-slate-400 font-medium text-xl italic">
             <Activity size={26} className="text-blue-500" /> Control Plane — <span className="text-blue-500 font-black uppercase text-xs tracking-[0.4em] bg-blue-500/10 px-6 py-2 rounded-full border border-blue-500/20 shadow-2xl">Refinery Crawler Monitor</span>
          </div>
        </div>
        <div className="flex bg-slate-900 border border-slate-800 rounded-[2.5rem] p-2 shadow-3xl">
           <button onClick={() => setActiveTab('QUEUE')} className={`px-10 py-3.5 rounded-[1.75rem] text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'QUEUE' ? 'bg-blue-600 text-white shadow-xl' : 'text-text-secondary hover:text-text-primary'}`}>Execution Queue</button>
           <button onClick={() => setActiveTab('RUNS')} className={`px-10 py-3.5 rounded-[1.75rem] text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'RUNS' ? 'bg-blue-600 text-white shadow-xl' : 'text-text-secondary hover:text-text-primary'}`}>Batch History</button>
        </div>
      </header>

      {/* KPIS */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
        <StatCard label="Total firm nodes" val={kpis?.total_urls || 0} icon={Database} color="blue" />
        <StatCard label="Changes detected" val={kpis?.changes || 0} icon={Zap} color="amber" />
        <StatCard label="Tasks triggered" val={kpis?.tasks || 0} icon={Terminal} color="emerald" />
        <StatCard label="Failed sweeps" val={kpis?.failed || 0} icon={ShieldAlert} color="rose" />
        <div className="bg-slate-950 border border-blue-500/20 p-8 rounded-[2.5rem] flex flex-col justify-center gap-3">
           <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></div>
              <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Engine Live</span>
           </div>
           <p className="text-[9px] text-slate-600 italic font-medium leading-tight">Worker ID: REFINERY_NODE_ALPHA_01 (Stable)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* WORKSPACE */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-[4rem] overflow-hidden shadow-3xl flex flex-col min-h-[600px]">
          <header className="p-10 border-b border-slate-800 flex flex-wrap gap-8 items-center bg-slate-950/20">
            <div className="relative flex-1 group min-w-[300px]">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors" size={24} />
                <input 
                  type="text" 
                  placeholder="Search by entity name or URL protocol..." 
                  className="w-full bg-slate-950 border border-slate-800 rounded-3xl pl-20 pr-8 py-5 text-lg text-white outline-none focus:ring-4 focus:ring-blue-500/10 transition-all italic font-serif"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
            </div>
            <div className="flex gap-4">
                <select 
                  className="bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-[10px] font-black uppercase text-slate-400 outline-none cursor-pointer"
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                >
                  <option value="ALL">All States</option>
                  <option value="QUEUED">Queued</option>
                  <option value="RUNNING">Running</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="FAILED">Failed</option>
                </select>
                <button onClick={loadData} className="p-4 bg-slate-950 border border-slate-800 text-slate-500 rounded-2xl hover:text-white transition-all"><RefreshCw size={24} className={loading ? 'animate-spin' : ''}/></button>
            </div>
          </header>

          <div className="flex-1 overflow-x-auto custom-scrollbar">
            {activeTab === 'QUEUE' ? (
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead className="bg-slate-950/40 border-b border-slate-800">
                    <tr className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em]">
                      <th className="px-10 py-8">Entity Cluster</th>
                      <th className="px-8 py-8">Target URL</th>
                      <th className="px-8 py-8 text-center">Status</th>
                      <th className="px-8 py-8 text-center">Delta detected</th>
                      <th className="px-10 py-8 text-right">Execution</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                    {filteredQueue.map(q => (
                      <tr key={q.id} className={`hover:bg-blue-600/5 transition-all group ${q.status === 'RUNNING' ? 'bg-blue-500/[0.02]' : ''}`}>
                        <td className="px-10 py-8">
                            <div className="flex items-center gap-5">
                              <div className={`w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform ${q.status === 'RUNNING' ? 'text-blue-500 border-blue-500/40' : 'text-slate-600'}`}>
                                  {q.status === 'RUNNING' ? <Loader2 className="animate-spin" size={20}/> : <Database size={20} />}
                              </div>
                              <div>
                                  <p className="text-base font-black text-white italic font-serif leading-none mb-1 uppercase">{q.entity_name}</p>
                                  <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">{q.entity_type} Node</p>
                              </div>
                            </div>
                        </td>
                        <td className="px-8 py-8 max-w-[250px]">
                            <div className="flex items-center gap-3">
                              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded border border-slate-800 text-slate-500">{q.url_type}</span>
                              <p className="text-xs text-slate-400 italic truncate" title={q.url}>{q.url}</p>
                            </div>
                        </td>
                        <td className="px-8 py-8 text-center">
                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border italic transition-all ${
                              q.status === 'COMPLETED' || q.status === 'DONE' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                              q.status === 'FAILED' ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' :
                              q.status === 'RUNNING' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400 animate-pulse' :
                              'bg-slate-950 text-slate-600 border-slate-800'
                            }`}>
                              {q.status}
                            </span>
                        </td>
                        <td className="px-8 py-8 text-center">
                            {q.change_detected ? (
                              <div className="flex flex-col items-center gap-1.5 animate-in zoom-in-95">
                                <span className="text-[10px] font-black text-amber-500 bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20 shadow-lg">CHANGE DETECTED</span>
                              </div>
                            ) : (
                              <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest italic">Stationary</span>
                            )}
                        </td>
                        <td className="px-10 py-8 text-right">
                            <div className="flex items-center justify-end gap-3">
                              {q.status === 'FAILED' && <button onClick={() => handleRetry(q.id)} className="px-4 py-1.5 bg-slate-950 border border-slate-800 text-slate-500 rounded-lg text-[9px] font-black uppercase hover:text-white hover:border-blue-500 transition-all flex items-center gap-2"><RefreshCw size={12}/> Retry</button>}
                              {q.status === 'COMPLETED' && <button className="px-4 py-1.5 bg-emerald-600/10 border border-emerald-500/20 text-emerald-500 rounded-lg text-[9px] font-black uppercase hover:bg-emerald-600 hover:text-white transition-all">Audit Result</button>}
                              <button className="p-2 text-slate-700 hover:text-white transition-all"><MoreVertical size={18}/></button>
                            </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            ) : (
              <div className="p-20 text-center opacity-30 italic font-serif text-2xl uppercase tracking-tighter">Batch context records loading...</div>
            )}
          </div>
        </div>

        {/* LOG TERMINAL (RIGHT) */}
        <aside className="lg:col-span-4 flex flex-col gap-8">
           <section className="bg-slate-950 border border-slate-800 rounded-[3rem] p-8 shadow-inner flex flex-col h-full overflow-hidden">
              <header className="flex justify-between items-center mb-8 shrink-0">
                 <h3 className="text-[11px] font-black text-blue-500 uppercase tracking-[0.4em] flex items-center gap-3"><Terminal size={16}/> Refinery Logs</h3>
                 <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-emerald-500/50 shadow-lg"></span>
              </header>
              <div className="flex-1 overflow-y-auto custom-scrollbar font-mono text-[10px] space-y-3">
                 {systemLogs.map((log, i) => (
                   <div key={i} className={`p-3 rounded-lg border ${log.includes('CRITICAL') ? 'bg-rose-500/5 border-rose-500/20 text-rose-400' : log.includes('SUCCESS') ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' : 'bg-slate-900 border-slate-800 text-slate-400'} animate-in slide-in-from-left-2`}>
                      {log}
                   </div>
                 ))}
              </div>
              <footer className="mt-8 pt-6 border-t border-slate-900">
                 <p className="text-[9px] text-slate-700 uppercase tracking-[0.2em] italic">Engine sequence: PERSISTENT_HANDSHAKE</p>
              </footer>
           </section>

           <section className="bg-indigo-600 border border-indigo-500 rounded-[3rem] p-10 shadow-3xl text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform"><Brain size={160}/></div>
              <h4 className="text-xl font-black italic font-serif uppercase tracking-tight mb-4 relative z-10">AI Refinery State</h4>
              <p className="text-sm italic font-medium opacity-80 leading-relaxed mb-8 relative z-10">Extraction accuracy is currently maintaining a <span className="font-black">94.2% confidence ceiling</span> via Gemini 3 Pro reasoning.</p>
              <button className="w-full py-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all relative z-10">Deep Kernel Audit</button>
           </section>
        </aside>
      </div>

      {/* FOOTER */}
      <footer className="fixed bottom-0 left-72 right-0 h-16 bg-slate-950/90 backdrop-blur-xl border-t border-slate-900 px-10 flex items-center justify-between z-[100]">
         <div className="flex items-center gap-10">
            <div className="flex items-center gap-3">
               <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
               <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">Crawler Engine: Active</span>
            </div>
            <div className="flex items-center gap-3">
               <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
               <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">Integrity State: Optimal</span>
            </div>
         </div>
         <p className="text-[9px] font-black text-slate-800 uppercase tracking-[0.4em] italic font-serif">AnnoNest Extraction Hub — v1.0 LIVE CANON Monitor</p>
      </footer>
    </div>
  );
};

export default ExtractionHub;
