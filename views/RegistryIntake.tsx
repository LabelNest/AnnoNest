
import React, { useState, useEffect } from 'react';
import { 
  Database, RefreshCw, Search, CheckCircle, XCircle, 
  ArrowRight, Landmark, ExternalLink, ShieldAlert,
  Loader2, Filter, Trash2, GitPullRequest, Info, Clock,
  MoreHorizontal, Users, Globe, Building2, Layers, ShieldCheck as VerifiedIcon
} from 'lucide-react';
import { Entity, UserProfile, UserRole } from '../types';
import { supabaseService } from '../services/supabaseService';

interface Props {
  userProfile: UserProfile;
}

const RegistryIntake: React.FC<Props> = ({ userProfile }) => {
  const [items, setItems] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actioningId, setActioningId] = useState<string | null>(null);

  useEffect(() => {
    loadIntakeData();
  }, []);

  const loadIntakeData = async () => {
    setLoading(true);
    const data = await supabaseService.fetchIntakeQueue(userProfile.tenant_id);
    setItems(data);
    setLoading(false);
  };

  const handleApprove = async (entity: Entity) => {
    setActioningId(entity.id);
    try {
      const updated = { ...entity, status: 'active' as any };
      const res = await supabaseService.upsertEntity(updated, userProfile.user_id);
      if (res.success) {
        setItems(prev => prev.filter(i => i.id !== entity.id));
      } else {
        alert("Promotion Failed: " + res.error);
      }
    } catch (e) {
      console.error("Promotion Failed", e);
    } finally {
      setActioningId(null);
    }
  };

  const handleReject = async (id: string) => {
    setActioningId(id);
    try {
      // Log rejection
      await supabaseService.logEntityChange(id, userProfile.user_id, 'reject', 'Record rejected and purged from intake queue.');
      setItems(prev => prev.filter(i => i.id !== id));
    } finally {
      setActioningId(null);
    }
  };

  const filtered = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-12 animate-in fade-in duration-500 max-w-[1600px] mx-auto pb-20">
       <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 border-b border-slate-800 pb-16">
        <div>
          <h1 className="text-6xl font-black flex items-center gap-8 text-white tracking-tighter uppercase italic font-serif leading-none">
            <VerifiedIcon className="text-blue-500" size={60} />
            Registry Intake
          </h1>
          <p className="text-slate-400 mt-6 font-medium flex items-center gap-4 text-lg">
            <Building2 size={22} className="text-blue-500" />
            Clearance Queue — <span className="text-blue-500 font-black uppercase text-[10px] tracking-[0.4em] bg-blue-500/10 px-5 py-2 rounded-full italic font-serif shadow-2xl">Unverified Target Buffer</span>
          </p>
        </div>

        <button 
          onClick={loadIntakeData}
          className={`p-5 bg-slate-950 border border-slate-800 text-slate-500 rounded-3xl hover:text-white transition-all shadow-xl active:scale-95 ${loading ? 'animate-spin' : ''}`}
        >
          <RefreshCw size={28} />
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-center justify-between bg-slate-900/40 p-8 rounded-[2.5rem] border border-slate-800 shadow-inner">
          <div className="relative flex-1 max-w-2xl group">
            <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-all" size={24} />
            <input 
              type="text" 
              placeholder={`Search unverified targets...`} 
              className="w-full bg-slate-950 border border-slate-800 rounded-[2rem] pl-20 pr-10 py-5 text-lg text-slate-100 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-700 font-serif italic"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-6 bg-slate-950 border border-slate-800 rounded-[2rem] p-1.5 pl-6 group">
             <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
               <Layers size={12} className="text-blue-500" /> Filter:
             </span>
             <select className="bg-blue-600 text-white px-8 py-3 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest outline-none cursor-pointer appearance-none text-center shadow-xl">
                <option>ALL_SOURCES</option>
                <option>OUTREACH</option>
                <option>NEWS_RADAR</option>
             </select>
          </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-[3.5rem] overflow-hidden shadow-3xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1400px]">
            <thead>
              <tr className="bg-slate-950/40 border-b border-slate-800">
                <th className="px-10 py-8 text-[11px] font-black text-slate-500 uppercase tracking-[0.4em]">Identity (Shell)</th>
                <th className="px-10 py-8 text-[11px] font-black text-slate-500 uppercase tracking-[0.4em]">Source</th>
                <th className="px-10 py-8 text-[11px] font-black text-slate-500 uppercase tracking-[0.4em]">Contact Detail</th>
                <th className="px-10 py-8 text-[11px] font-black text-slate-500 uppercase tracking-[0.4em]">Age in Queue</th>
                <th className="px-10 py-8 text-[11px] font-black text-slate-500 uppercase tracking-[0.4em]">Verification Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {filtered.map(item => (
                <tr key={item.id} className="hover:bg-slate-800/20 transition-all group">
                   <td className="px-10 py-8">
                      <div className="flex items-center gap-6">
                         <div className="w-14 h-14 bg-slate-800 border border-slate-700 rounded-2xl flex items-center justify-center font-black text-slate-500 italic uppercase">
                            {item.name[0]}
                         </div>
                         <div>
                            <p className="text-xl font-black text-white italic font-serif leading-none mb-1">{item.name}</p>
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{item.type}</span>
                         </div>
                      </div>
                   </td>
                   <td className="px-10 py-8">
                      <span className="text-[10px] font-black text-blue-400 bg-blue-500/5 px-3 py-1 rounded-lg border border-blue-500/10 uppercase tracking-widest">
                        {item.source || 'OUTREACH'}
                      </span>
                   </td>
                   <td className="px-10 py-8">
                      <div className="space-y-1">
                         <p className="text-xs font-bold text-slate-300 italic">{item.details?.contact_name || 'N/A'}</p>
                         <p className="text-[10px] text-slate-500 uppercase tracking-tight">{item.details?.contact_email || item.details?.firm_email || 'No email log'}</p>
                      </div>
                   </td>
                   <td className="px-10 py-8">
                      <div className="flex items-center gap-2 text-slate-500 font-black text-[10px] uppercase">
                         <Clock size={12} /> 12h
                      </div>
                   </td>
                   <td className="px-10 py-8">
                      <div className="flex gap-3">
                         <button 
                           onClick={() => handleApprove(item)}
                           disabled={actioningId === item.id}
                           className="px-6 py-2.5 bg-emerald-600/10 text-emerald-500 border border-emerald-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all flex items-center gap-2 active:scale-95 disabled:opacity-30"
                         >
                            {actioningId === item.id ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle size={14} />} Approve
                         </button>
                         <button 
                           onClick={() => handleReject(item.id)}
                           className="px-6 py-2.5 bg-rose-600/10 text-rose-500 border border-rose-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all flex items-center gap-2 active:scale-95"
                         >
                            <XCircle size={14} /> Reject
                         </button>
                         <button className="p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-500 hover:text-white transition-all"><GitPullRequest size={16} /></button>
                      </div>
                   </td>
                </tr>
              ))}
              {items.length === 0 && !loading && (
                <tr>
                   <td colSpan={5} className="py-32 text-center">
                      <Layers size={48} className="mx-auto text-slate-800 mb-6" />
                      <p className="text-slate-600 font-black italic uppercase text-xs tracking-[0.4em]">Clearance Pipe Empty</p>
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="p-12 bg-blue-600/5 border border-blue-600/10 rounded-[3.5rem] flex items-start gap-10 shadow-xl">
          <div className="p-5 bg-blue-600/10 border border-blue-500/20 rounded-[1.75rem] text-blue-500 shadow-inner">
             <ShieldAlert size={40} />
          </div>
          <div className="space-y-4">
             <h4 className="text-2xl font-black text-white italic font-serif uppercase tracking-tight">Intake Governance Protocol</h4>
             <p className="text-slate-500 text-lg leading-relaxed italic font-medium max-w-4xl">
               The Registry Intake screen is the final gatekeeper of data integrity. Outreach targets are added as "unverified" to prevent registry pollution. 
               Only upon explicit specialist approval are records promoted to <span className="text-blue-400 font-bold">ACTIVE</span> status, making them visible in DataNest and the Network Graph.
             </p>
          </div>
      </div>
    </div>
  );
};

export default RegistryIntake;
