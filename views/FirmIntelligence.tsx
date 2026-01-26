import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart3, Search, Globe, TrendingUp, 
  Clock, ShieldAlert, Zap, Loader2, RefreshCw, 
  Target, Activity, Database
} from 'lucide-react';
import { supabaseService } from '../services/supabaseService';
import { FirmIntelligenceMetric, UserProfile, VelocityBand } from '../types';
import FirmIntelligenceDrawer from '../components/FirmIntelligenceDrawer';

interface Props {
  userProfile: UserProfile;
}

const FirmIntelligence: React.FC<Props> = ({ userProfile }) => {
  const [metrics, setMetrics] = useState<FirmIntelligenceMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFirm, setSelectedFirm] = useState<FirmIntelligenceMetric | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDataset, setFilterDataset] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterBand, setFilterBand] = useState<string>('ALL');
  const [filterRange, setFilterRange] = useState<number>(365); // days

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await supabaseService.fetchFirmIntelligence(userProfile.tenant_id);
      setMetrics(data);
    } finally {
      setLoading(false);
    }
  };

  const filteredMetrics = useMemo(() => {
    return metrics.filter(m => {
      const matchSearch = (m.entity_name || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchDataset = filterDataset === 'ALL' || m.entity_type === filterDataset;
      const matchStatus = filterStatus === 'ALL' || m.activity_status === filterStatus;
      const matchBand = filterBand === 'ALL' || m.velocity_band === filterBand;
      const matchRange = m.days_since_last_update <= filterRange;
      
      return matchSearch && matchDataset && matchStatus && matchBand && matchRange;
    });
  }, [metrics, searchQuery, filterDataset, filterStatus, filterBand, filterRange]);

  const kpis = useMemo(() => {
    const total = metrics.length;
    const active = metrics.filter(m => m.activity_status === 'ACTIVE').length;
    const highVelocity = metrics.filter(m => m.velocity_band === 'HIGH' || m.velocity_band === 'CRITICAL').length;
    const updated7d = metrics.filter(m => m.days_since_last_update <= 7).length;
    const dormant = metrics.filter(m => m.activity_status === 'DORMANT' || m.activity_status === 'INACTIVE').length;

    return { total, active, highVelocity, updated7d, dormant };
  }, [metrics]);

  const getBandBadge = (band: VelocityBand) => {
    switch (band) {
      case 'CRITICAL':
      case 'HIGH': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      case 'MEDIUM': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'LOW': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      default: return 'bg-slate-800 text-slate-500 border-slate-700';
    }
  };

  const StatBlock = ({ label, val, icon: Icon, color }: any) => (
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
            <BarChart3 className="text-blue-500" size={80} />
            Firm Intelligence
          </h1>
          <div className="flex items-center gap-6 text-slate-400 font-medium text-xl italic">
             <Target size={26} className="text-blue-500" /> Observation Layer — <span className="text-blue-500 font-black uppercase text-xs tracking-[0.4em] bg-blue-500/10 px-6 py-2 rounded-full border border-blue-500/20 shadow-2xl">Derived Signal Integrity</span>
          </div>
        </div>
        <div className="flex bg-slate-900 border border-slate-800 rounded-[2.5rem] p-2 shadow-3xl">
           <button onClick={loadData} className="p-4 bg-slate-950 text-slate-500 hover:text-white transition-all border border-slate-800 rounded-[1.75rem]"><RefreshCw size={24} className={loading ? 'animate-spin' : ''}/></button>
        </div>
      </header>

      {/* OVERVIEW KPIS */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <StatBlock label="Total Observed" val={kpis.total} icon={Database} color="blue" />
        <StatBlock label="Active Firms" val={kpis.active} icon={Activity} color="emerald" />
        <StatBlock label="High Velocity" val={kpis.highVelocity} icon={Zap} color="rose" />
        <StatBlock label="Updated (7d)" val={kpis.updated7d} icon={Clock} color="amber" />
        <StatBlock label="Dormant" val={kpis.dormant} icon={ShieldAlert} color="slate" />
      </div>

      {/* FILTER BAR */}
      <div className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-xl border border-slate-800 rounded-[3rem] p-6 shadow-2xl flex flex-wrap gap-6 items-center">
         <div className="relative flex-1 group min-w-[300px]">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors" size={24} />
            <input 
              type="text" 
              placeholder="Search institutional registry..." 
              className="w-full bg-slate-950 border border-slate-800 rounded-3xl pl-20 pr-8 py-5 text-lg text-white outline-none focus:ring-4 focus:ring-blue-500/10 transition-all italic font-serif"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
         </div>
         
         <div className="flex gap-4">
            <div className="flex flex-col gap-1.5">
               <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">Dataset</span>
               <select className="bg-slate-900 border border-slate-800 rounded-2xl px-6 py-4 text-[10px] font-black uppercase text-slate-400 outline-none cursor-pointer" value={filterDataset} onChange={e => setFilterDataset(e.target.value)}>
                  <option value="ALL">All Sets</option>
                  <option value="GP">GP Registry</option>
                  <option value="LP">LP Registry</option>
                  <option value="Fund">Fund Registry</option>
                  <option value="PortCo">PortCo Registry</option>
               </select>
            </div>
            <div className="flex flex-col gap-1.5">
               <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">Activity</span>
               <select className="bg-slate-900 border border-slate-800 rounded-2xl px-6 py-4 text-[10px] font-black uppercase text-slate-400 outline-none cursor-pointer" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                  <option value="ALL">All Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="DORMANT">Dormant</option>
               </select>
            </div>
            <div className="flex flex-col gap-1.5">
               <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">Velocity</span>
               <select className="bg-slate-900 border border-slate-800 rounded-2xl px-6 py-4 text-[10px] font-black uppercase text-slate-400 outline-none cursor-pointer" value={filterBand} onChange={e => setFilterBand(e.target.value)}>
                  <option value="ALL">All Bands</option>
                  <option value="CRITICAL">Critical</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
               </select>
            </div>
            <div className="flex flex-col gap-1.5">
               <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">Recency</span>
               <select className="bg-slate-900 border border-slate-800 rounded-2xl px-6 py-4 text-[10px] font-black uppercase text-slate-400 outline-none cursor-pointer" value={filterRange} onChange={e => setFilterRange(parseInt(e.target.value))}>
                  <option value={7}>Last 7d</option>
                  <option value={30}>Last 30d</option>
                  <option value={90}>Last 90d</option>
                  <option value={365}>Last 365d</option>
               </select>
            </div>
         </div>
      </div>

      {/* INTELLIGENCE TABLE */}
      <div className="bg-slate-900 border border-slate-800 rounded-[4rem] overflow-hidden shadow-3xl flex flex-col min-h-[700px]">
        <div className="flex-1 overflow-x-auto custom-scrollbar">
           <table className="w-full text-left border-collapse min-w-[1400px]">
              <thead className="bg-slate-950/40 border-b border-slate-800 sticky top-0 z-10">
                 <tr className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em]">
                    <th className="px-12 py-10">Firm Signature</th>
                    <th className="px-10 py-10">Dataset</th>
                    <th className="px-10 py-10 text-center">Status</th>
                    <th className="px-10 py-10 text-center">Velocity Band</th>
                    <th className="px-10 py-10">Last Activity</th>
                    <th className="px-10 py-10 text-center">Δ Website (90d)</th>
                    <th className="px-10 py-10 text-center">Filings</th>
                    <th className="px-12 py-10 text-right">Coverage</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                 {loading ? (
                   <tr><td colSpan={8} className="py-40 text-center"><Loader2 className="animate-spin mx-auto text-blue-500" size={48}/></td></tr>
                 ) : filteredMetrics.length === 0 ? (
                   <tr><td colSpan={8} className="py-40 text-center opacity-30 italic font-serif text-2xl">No institutional matches in current sweep.</td></tr>
                 ) : (
                   filteredMetrics.map(item => (
                    <tr key={`${item.entity_id}-${item.entity_type}`} onClick={() => setSelectedFirm(item)} className="hover:bg-blue-600/5 cursor-pointer transition-all group border-l-[6px] border-transparent hover:border-blue-500">
                       <td className="px-12 py-8">
                          <div className="flex items-center gap-8">
                             <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-2xl font-black text-blue-500 italic font-serif shadow-inner group-hover:scale-110 transition-transform">{item.entity_name?.[0] || 'U'}</div>
                             <div>
                                <p className="text-xl font-black text-white italic font-serif leading-none mb-2 uppercase tracking-tight group-hover:text-blue-400 transition-colors">{item.entity_name}</p>
                                <p className="text-[9px] font-mono text-slate-600 uppercase tracking-tighter">ID: {item.entity_id.slice(0,14)}</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-10 py-8">
                          <span className="text-[10px] font-black uppercase text-slate-500 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 tracking-widest">{item.entity_type}</span>
                       </td>
                       <td className="px-10 py-8 text-center">
                          <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border italic ${item.activity_status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>{item.activity_status}</span>
                       </td>
                       <td className="px-10 py-8 text-center">
                          <span className={`px-4 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border italic ${getBandBadge(item.velocity_band)}`}>{item.velocity_band}</span>
                       </td>
                       <td className="px-10 py-8">
                          <div className="flex flex-col">
                             <p className="text-xs font-bold text-slate-200">{new Date(item.last_activity_date).toLocaleDateString()}</p>
                             <p className="text-[8px] font-black text-slate-600 uppercase mt-1 italic">{item.last_activity_type.replace('_', ' ')}</p>
                          </div>
                       </td>
                       <td className="px-10 py-8 text-center">
                          <span className="text-lg font-black text-blue-400 italic font-serif">{item.website_changes_90d}</span>
                       </td>
                       <td className="px-10 py-8 text-center">
                          <span className="text-lg font-black text-emerald-500 italic font-serif">{item.filings_total}</span>
                       </td>
                       <td className="px-12 py-8 text-right">
                          <div className="flex justify-end gap-1">
                             {item.countries_covered.slice(0, 3).map(c => (
                                <span key={c} className="px-2 py-0.5 bg-slate-950 border border-slate-800 rounded text-[8px] font-black text-slate-500 uppercase">{c}</span>
                             ))}
                             {item.countries_covered.length > 3 && <span className="text-[8px] font-black text-slate-700 mt-1">+{item.countries_covered.length - 3}</span>}
                          </div>
                       </td>
                    </tr>
                   ))
                 )}
              </tbody>
           </table>
        </div>
      </div>

      {/* DRAWER COMPONENT */}
      <FirmIntelligenceDrawer 
        firm={selectedFirm} 
        onClose={() => setSelectedFirm(null)} 
      />

      {/* FOOTER */}
      <footer className="fixed bottom-0 left-72 right-0 h-16 bg-slate-950/90 backdrop-blur-xl border-t border-slate-900 px-10 flex items-center justify-between z-[100]">
         <div className="flex items-center gap-10">
            <div className="flex items-center gap-3">
               <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
               <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">Intelligence Layer: Active</span>
            </div>
            <div className="flex items-center gap-3">
               <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
               <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">Node Sync: Synchronized</span>
            </div>
         </div>
         <p className="text-[9px] font-black text-slate-800 uppercase tracking-[0.4em] italic font-serif">AnnoNest Data Intelligence — v1.0 CANON Monitor</p>
      </footer>
    </div>
  );
};

export default FirmIntelligence;