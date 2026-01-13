
import React, { useState, useMemo, useEffect } from 'react';
import { 
  TrendingUp, Activity, CircleCheck, Database, CircleAlert, ArrowRight, 
  Clock, User, BarChart3, PieChart as PieIcon, Cpu, PenTool, 
  SearchCheck, Globe, ShieldCheck, Zap, Layers, Command, ChevronDown,
  Info, Monitor, Terminal, Share2, ShieldHalf, KeyRound, TriangleAlert
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { supabaseService } from '../services/supabaseService';

const MODULE_COLORS = {
  EXTRACTION: '#3b82f6', 
  ANNOTATE: '#10b981',   
  QA: '#f59e0b',         
  SALES: '#6366f1',      
  CORE: '#64748b'        
};

interface DashboardProps {
  onNavigate: (v: any) => void;
  entityCount: number;
  newsCount: number;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate, entityCount, newsCount }) => {
  const [selectedUser, setSelectedUser] = useState('ALL');
  const [backlogCount, setBacklogCount] = useState(0);

  useEffect(() => {
    supabaseService.fetchQAItems(null, 'PENDING').then(items => setBacklogCount(items.length));
  }, []);

  const timeData = [
    { name: 'Extraction', value: 35, color: MODULE_COLORS.EXTRACTION },
    { name: 'Labeling', value: 45, color: MODULE_COLORS.ANNOTATE },
    { name: 'QA Review', value: 15, color: MODULE_COLORS.QA },
    { name: 'Sales Intel', value: 5, color: MODULE_COLORS.SALES }
  ];

  const throughputData = [
    { name: 'Mon', signals: newsCount > 0 ? Math.floor(newsCount * 0.1) : 0, verified: entityCount > 0 ? Math.floor(entityCount * 0.05) : 0 },
    { name: 'Tue', signals: newsCount > 0 ? Math.floor(newsCount * 0.2) : 0, verified: entityCount > 0 ? Math.floor(entityCount * 0.12) : 0 },
    { name: 'Wed', signals: newsCount > 0 ? Math.floor(newsCount * 0.15) : 0, verified: entityCount > 0 ? Math.floor(entityCount * 0.08) : 0 },
    { name: 'Thu', signals: newsCount > 0 ? Math.floor(newsCount * 0.3) : 0, verified: entityCount > 0 ? Math.floor(entityCount * 0.25) : 0 },
    { name: 'Fri', signals: newsCount > 0 ? Math.floor(newsCount * 0.25) : 0, verified: entityCount > 0 ? Math.floor(entityCount * 0.5) : 0 },
  ];

  const StatCard = ({ title, value, change, icon: Icon, color }: any) => (
    <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] hover:border-slate-700 transition-all shadow-2xl relative overflow-hidden group">
      <div className={`absolute -right-4 -top-4 opacity-5 text-${color}-500 group-hover:opacity-10 transition-opacity`}>
        <Icon size={120} />
      </div>
      <div className="flex justify-between items-start mb-6 relative">
        <div className={`p-4 rounded-2xl bg-${color}-500/10 text-${color}-500 border border-${color}-500/20`}>
          <Icon size={24} />
        </div>
        <span className="text-[10px] font-black px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20 uppercase tracking-widest">
          {change}
        </span>
      </div>
      <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">{title}</h3>
      <p className="text-4xl font-black text-white mt-2 italic font-serif tracking-tighter">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
    </div>
  );

  return (
    <div className="space-y-12 animate-in fade-in duration-500 max-w-[1600px] mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 border-b border-slate-800 pb-16">
        <div>
          <h1 className="text-6xl font-black text-white tracking-tighter uppercase italic font-serif leading-none">
            Operation <span className="text-blue-500">Center</span>
          </h1>
          <p className="text-slate-400 mt-6 font-medium flex items-center gap-4 text-lg">
            <Activity size={22} className="text-blue-500" />
            Registry Performance — <span className="text-blue-500 font-black uppercase text-[10px] tracking-[0.4em] bg-blue-500/10 px-5 py-2 rounded-full italic shadow-2xl">Integrity Sync</span>
          </p>
        </div>

        <div className="flex items-center gap-6">
           <button 
             onClick={() => onNavigate('settings')}
             className="px-8 py-4 bg-rose-600/10 border border-rose-500/20 text-rose-500 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all shadow-xl flex items-center gap-3"
           >
              <KeyRound size={16} /> Security Protocol
           </button>
           <div className="flex items-center gap-4 bg-slate-900 border border-slate-800 rounded-[2rem] p-1.5 pl-6 group shadow-3xl">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <User size={12} className="text-blue-500" /> System:
              </span>
              <div className="relative">
                <select 
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="bg-blue-600 text-white pl-8 pr-12 py-3 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest outline-none cursor-pointer appearance-none text-center shadow-xl"
                >
                  <option value="ALL">GLOBAL_NETWORK</option>
                </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-white pointer-events-none" />
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard title="Active Signals" value={newsCount} change="LIVE" icon={Activity} color="blue" />
        <StatCard title="Registry Yield" value={entityCount > 0 ? "LIVE" : "EMPTY"} change="SYNCED" icon={CircleCheck} color="emerald" />
        <StatCard title="Density" value={entityCount} change="RECORDS" icon={Database} color="purple" />
        <StatCard title="Backlog" value={backlogCount} change="QA_QUEUE" icon={CircleAlert} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-[3.5rem] p-12 shadow-3xl flex flex-col min-h-[550px]">
          <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] mb-12 flex items-center gap-3 border-b border-slate-800 pb-8">
            <BarChart3 size={20} className="text-blue-500" /> Operational Analysis
          </h3>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={throughputData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 10}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 10}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '1.5rem' }}
                />
                <Bar dataKey="signals" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={25} />
                <Bar dataKey="verified" fill="#10b981" radius={[6, 6, 0, 0]} barSize={25} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-[3.5rem] p-12 shadow-3xl flex flex-col">
          <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] mb-12 flex items-center gap-3 border-b border-slate-800 pb-8">
             <PieIcon size={20} className="text-emerald-400" /> Resource Focus
          </h3>
          <div className="flex-1 min-h-[300px] relative">
            <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                  <Pie data={timeData} cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={8} dataKey="value" stroke="none">
                    {timeData.map((entry: any, index: number) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '1rem' }} />
               </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Active</span>
                <span className="text-3xl font-black text-white italic font-serif">Registry</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
