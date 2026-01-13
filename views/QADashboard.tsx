
import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldCheck, BarChart3, AlertTriangle, TrendingUp, RefreshCw, 
  Filter, Layers, User, Briefcase, Activity, Landmark, MapPin, 
  History, DollarSign, SearchCheck, CheckCircle2, XCircle, 
  HelpCircle, Clock, ArrowRight, Loader2, Gauge
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { supabaseService } from '../services/supabaseService';
import { QAItem, UserProfile, UserRole } from '../types';

interface Props {
  userProfile: UserProfile;
}

const QADashboard: React.FC<Props> = ({ userProfile }) => {
  const [qaItems, setQaItems] = useState<QAItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeModule, setActiveModule] = useState<string>('ALL');

  const loadData = async () => {
    setLoading(true);
    const data = await supabaseService.fetchQAItems(userProfile.tenant_id, 'ALL');
    setQaItems(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const stats = useMemo(() => {
    const total = qaItems.length;
    const passed = qaItems.filter(i => i.status === 'PASSED').length;
    const failed = qaItems.filter(i => i.status === 'FAILED').length;
    const pending = qaItems.filter(i => i.status === 'PENDING').length;
    const accuracy = (passed + failed) > 0 ? (passed / (passed + failed) * 100).toFixed(1) : '100';
    const reworkCost = failed * 5.25;

    return { total, passed, failed, pending, accuracy, reworkCost };
  }, [qaItems]);

  const moduleAccuracyData = useMemo(() => {
    const modules = ['DATANEST', 'NEWS', 'ANNOTATE', 'EXTRACTION'];
    return modules.map(m => {
      const items = qaItems.filter(i => i.module === m || (m === 'DATANEST' && i.module?.includes('entity')));
      const passed = items.filter(i => i.status === 'PASSED').length;
      const failed = items.filter(i => i.status === 'FAILED').length;
      const acc = (passed + failed) > 0 ? Math.round((passed / (passed + failed)) * 100) : 100;
      return { name: m, val: acc };
    });
  }, [qaItems]);

  const leaderboard = useMemo(() => {
    const map = new Map<string, { passed: number, total: number }>();
    qaItems.forEach(i => {
      if (!i.analyst_id) return;
      const cur = map.get(i.analyst_id) || { passed: 0, total: 0 };
      if (i.status === 'PASSED') cur.passed++;
      if (i.status !== 'PENDING') cur.total++;
      map.set(i.analyst_id, cur);
    });
    return Array.from(map.entries())
      .map(([name, s]) => ({
        name,
        acc: s.total > 0 ? parseFloat((s.passed / s.total * 100).toFixed(1)) : 100,
        items: s.total,
        color: s.passed / s.total > 0.9 ? 'emerald' : 'blue'
      }))
      .sort((a, b) => b.acc - a.acc)
      .slice(0, 4);
  }, [qaItems]);

  const StatCard = ({ label, value, icon: Icon, color, suffix = "" }: any) => (
    <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-[2rem] p-8 flex items-center justify-between shadow-xl group relative overflow-hidden">
      <div className={`absolute -right-4 -top-4 opacity-5 text-${color}-500 group-hover:opacity-10 transition-opacity`}>
        <Icon size={100} />
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">{label}</p>
        <p className="text-4xl font-black text-white italic font-serif leading-none tracking-tighter">
          {value}{suffix}
        </p>
      </div>
      <div className={`w-14 h-14 bg-${color}-500/10 border border-${color}-500/20 rounded-2xl flex items-center justify-center text-${color}-400 shadow-2xl`}>
        <Icon size={28} />
      </div>
    </div>
  );

  return (
    <div className="space-y-12 animate-in fade-in duration-500 max-w-[1600px] mx-auto pb-20 relative">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 border-b border-slate-800 pb-16 relative">
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none"></div>
        <div>
          <h1 className="text-6xl font-black flex items-center gap-8 text-white tracking-tighter uppercase italic font-serif leading-none">
            <ShieldCheck className="text-blue-500" size={60} />
            QA Command
          </h1>
          <p className="text-slate-400 mt-6 font-medium flex items-center gap-4 text-lg">
            <SearchCheck size={22} className="text-blue-500" />
            Quality Control Terminal — <span className="text-blue-500 font-black uppercase text-xs tracking-[0.4em] bg-blue-500/10 px-5 py-2 rounded-full italic font-serif shadow-2xl">Risk-Weighted Integrity Guard</span>
          </p>
        </div>
        
        <div className="flex items-center gap-4">
           <div className="flex bg-slate-900 border border-slate-800 rounded-[2rem] p-2 ring-1 ring-slate-700 shadow-2xl">
              {['ALL', 'DATANEST', 'NEWS', 'ANNOTATE'].map(m => (
                <button 
                  key={m}
                  onClick={() => setActiveModule(m)}
                  className={`px-8 py-3.5 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest transition-all ${activeModule === m ? 'bg-blue-600 text-white shadow-2xl' : 'text-slate-500 hover:text-white'}`}
                >
                  {m}
                </button>
              ))}
           </div>
           <button onClick={loadData} className={`p-5 bg-slate-950 border border-slate-800 text-slate-500 rounded-3xl hover:text-white transition-all shadow-xl active:scale-95 ${loading ? 'animate-spin' : ''}`}>
             <RefreshCw size={28} />
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard label="In Verification" value={stats.pending} icon={Clock} color="blue" />
        <StatCard label="Accuracy Yield" value={stats.accuracy} suffix="%" icon={Gauge} color="emerald" />
        <StatCard label="Rework Integrity" value={stats.failed} icon={AlertTriangle} color="rose" />
        <StatCard label="Rework Cost" value={stats.reworkCost.toFixed(2)} suffix="$" icon={DollarSign} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
         <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-[3.5rem] p-12 shadow-3xl flex flex-col h-[500px]">
            <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] mb-10 flex items-center gap-3">
               <TrendingUp size={18} className="text-blue-500" /> Module Accuracy Thresholds
            </h4>
            <div className="flex-1 w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={moduleAccuracyData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 10, fontWeight: 'bold' }} />
                     <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 10 }} />
                     <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '1rem' }}
                        itemStyle={{ color: '#60a5fa', fontWeight: 'bold' }}
                     />
                     <Bar dataKey="val" radius={[8, 8, 0, 0]} barSize={40}>
                        {moduleAccuracyData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={entry.val > 90 ? '#10b981' : (entry.val > 80 ? '#3b82f6' : '#f43f5e')} />
                        ))}
                     </Bar>
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>

         <div className="bg-slate-900 border border-slate-800 rounded-[3.5rem] p-12 shadow-3xl flex flex-col">
            <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] mb-10 flex items-center gap-3">
               <Activity size={18} className="text-emerald-500" /> Analyst Accuracy Leaderboard
            </h4>
            <div className="flex-1 space-y-6 overflow-y-auto custom-scrollbar pr-2">
               {leaderboard.length === 0 && (
                 <div className="py-20 text-center text-slate-600 text-[10px] font-black uppercase tracking-widest italic">No metrics generated yet.</div>
               )}
               {leaderboard.map((a, i) => (
                 <div key={i} className="group p-5 bg-slate-950/50 border border-slate-800 rounded-3xl hover:border-blue-500/50 transition-all">
                    <div className="flex items-center justify-between mb-4">
                       <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs italic font-serif bg-${a.color}-500/10 text-${a.color}-400`}>
                             {a.name[0]}
                          </div>
                          <div>
                             <p className="text-xs font-black text-white italic">{a.name}</p>
                             <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">{a.items} Items Scoped</p>
                          </div>
                       </div>
                       <span className={`text-xs font-black text-${a.color}-400`}>{a.acc}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                       <div className={`h-full bg-${a.color}-500`} style={{ width: `${a.acc}%` }}></div>
                    </div>
                 </div>
               ))}
            </div>
         </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-[3.5rem] p-12 shadow-2xl relative overflow-hidden">
         <div className="flex items-center justify-between mb-12 border-b border-slate-800 pb-8">
            <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] flex items-center gap-3">
               <History size={18} className="text-indigo-500" /> Operational QA Stream
            </h4>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
               <thead>
                  <tr className="bg-slate-950/40 border-b border-slate-800">
                     <th className="px-8 py-6 text-[10px] font-black text-slate-600 uppercase tracking-widest">Signal Source</th>
                     <th className="px-8 py-6 text-[10px] font-black text-slate-600 uppercase tracking-widest">Entity Target</th>
                     <th className="px-8 py-6 text-[10px] font-black text-slate-600 uppercase tracking-widest">Specialist</th>
                     <th className="px-8 py-6 text-[10px] font-black text-slate-600 uppercase tracking-widest text-center">Outcome</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-800/40">
                  {qaItems.slice(0, 10).map((item, i) => (
                    <tr key={i} className="hover:bg-slate-800/30 transition-colors group">
                       <td className="px-8 py-5">
                          <span className="text-[10px] font-black text-blue-500 bg-blue-500/10 px-3 py-1 rounded-lg border border-blue-500/20 uppercase tracking-tighter italic">{item.module}</span>
                       </td>
                       <td className="px-8 py-5">
                          <div className="flex flex-col">
                             <span className="text-sm font-black text-white italic font-serif">ID: {item.entity_id.slice(0, 10)}</span>
                             <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">{item.entity_type}</span>
                          </div>
                       </td>
                       <td className="px-8 py-5">
                          <span className="text-xs font-bold text-slate-400 italic">{item.analyst_id}</span>
                       </td>
                       <td className="px-8 py-5">
                          <div className="flex justify-center">
                             <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
                                item.status === 'PASSED' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 
                                item.status === 'FAILED' ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' :
                                'bg-blue-600/10 border-blue-500/20 text-blue-400 animate-pulse'
                             }`}>
                                {item.status}
                             </span>
                          </div>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};

export default QADashboard;
