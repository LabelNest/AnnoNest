import React, { useState, useEffect, useMemo } from 'react';
import { 
  Database, Search, Landmark, RefreshCw, X, ExternalLink, 
  Building2, Plus, Zap, Loader2, Target, Eye, Globe, Edit3, 
  Save, Briefcase, DollarSign, Scale, MapPin, Check, PlusCircle, 
  UploadCloud, ChevronRight, TrendingUp, BarChart3, History, Fingerprint,
  Wheat, Activity, Cpu, LineChart, ShieldCheck, Sparkles, Building,
  AlertCircle, ShieldAlert
} from 'lucide-react';
import { 
  UserProfile, EntityType, Entity, FirmURL, EntityFiling 
} from '../types';
import { supabaseService } from '../services/supabaseService';
import { AreaChart, Area, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';

type DataNestTab = 'DASHBOARD' | 'REGISTRY';

const REGISTRY_CONFIG: Record<string, { label: string, icon: any, color: string }> = {
  [EntityType.GP]: { label: 'GP Registry', icon: Briefcase, color: '#0052FF' },
  [EntityType.LP]: { label: 'LP Registry', icon: DollarSign, color: '#00E676' },
  [EntityType.FUND]: { label: 'Fund Registry', icon: Landmark, color: '#94A3B8' },
  [EntityType.PORTCO]: { label: 'Portfolio Asset', icon: Target, color: '#FFB800' },
  [EntityType.SERVICE_PROVIDER]: { label: 'Service Matrix', icon: Scale, color: '#7C3AED' },
  [EntityType.DEAL]: { label: 'Deal Node', icon: Zap, color: '#F43F5E' },
  [EntityType.AGRITECH]: { label: 'Agri Matrix', icon: Wheat, color: '#10B981' },
  [EntityType.HEALTHCARE]: { label: 'Health Registry', icon: Activity, color: '#F43F5E' },
  [EntityType.BLOCKCHAIN]: { label: 'Web3 Ledger', icon: Cpu, color: '#6366F1' },
  [EntityType.PUBLIC_MARKET]: { label: 'Public Index', icon: LineChart, color: '#0052FF' }
};

const DataNest: React.FC<{ userProfile: UserProfile, userMap: Record<string, string> }> = ({ userProfile, userMap }) => {
  const [activeTab, setActiveTab] = useState<DataNestTab>('DASHBOARD');
  const [activeRegistry, setActiveRegistry] = useState<EntityType>(EntityType.GP);
  const [loading, setLoading] = useState(true);
  const [registryData, setRegistryData] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [search, setSearch] = useState('');
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [newEntity, setNewEntity] = useState({
    name: '',
    type: EntityType.GP,
    status: 'active',
    hq_city: '',
    confidence_score: 100
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [r, s] = await Promise.all([
        supabaseService.fetchDataNestRegistry(userProfile.tenant_id, activeRegistry),
        supabaseService.fetchDataNestStats(userProfile.tenant_id)
      ]);
      setRegistryData(r || []);
      setStats(s || {});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [userProfile.tenant_id, activeRegistry]);

  const handleAddEntity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntity.name) return;
    setIsCommitting(true);
    const res = await supabaseService.createEntity({
      ...newEntity,
      tenant_id: userProfile.tenant_id
    });
    if (!res.error) {
      setShowAddModal(false);
      setNewEntity({ name: '', type: EntityType.GP, status: 'active', hq_city: '', confidence_score: 100 });
      loadData();
    }
    setIsCommitting(false);
  };

  const filteredList = useMemo(() => {
    return registryData.filter(e => !search || (e.name || '').toLowerCase().includes(search.toLowerCase()));
  }, [registryData, search]);

  return (
    <div className="space-y-12 animate-in fade-in duration-500 max-w-[1600px] mx-auto pb-40 relative">
      
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-10 border-b border-slate-800 pb-16">
        <div className="space-y-6">
          <h1 className="text-8xl font-black flex items-center gap-10 tracking-tighter uppercase italic font-serif leading-none text-white">
            <Database className="text-accent-primary shrink-0" size={80} />
            DataNest
          </h1>
          <p className="text-text-secondary font-medium text-xl italic flex items-center gap-4">
             <Landmark size={26} className="text-accent-primary" /> Federated Registries — <span className="text-accent-primary font-black uppercase text-xs tracking-[0.4em] bg-accent-primary/10 px-6 py-2 rounded-full border border-accent-primary/20 shadow-blue italic">Registry Operating System</span>
          </p>
        </div>

        <div className="flex bg-card-panel dark:bg-[#0f172a] border border-border-ui dark:border-slate-800 rounded-[3rem] p-2 shadow-3xl">
          <button onClick={() => setActiveTab('DASHBOARD')} className={`px-12 py-4 rounded-[2rem] text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'DASHBOARD' ? 'bg-accent-primary text-white shadow-blue' : 'text-text-secondary hover:text-text-primary'}`}>Intelligence Hub</button>
          <button onClick={() => setActiveTab('REGISTRY')} className={`px-12 py-4 rounded-[2rem] text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'REGISTRY' ? 'bg-accent-primary text-white shadow-blue' : 'text-text-secondary hover:text-text-primary'}`}>Master Matrix</button>
        </div>
      </header>

      {activeTab === 'DASHBOARD' ? (
        <DataNestDashboard stats={stats} />
      ) : (
        <div className="space-y-10 animate-in slide-in-from-bottom-8 duration-500">
           <section className="space-y-6 overflow-x-auto custom-scrollbar pb-4">
              <div className="flex justify-between items-center px-10">
                 <h3 className="text-[12px] font-black text-text-secondary uppercase tracking-[0.6em]">Registry Selector</h3>
                 <span className="text-[9px] font-black text-accent-primary bg-accent-primary/10 border border-accent-primary/20 px-4 py-1.5 rounded-full italic tracking-widest uppercase">Targeting: {activeRegistry}</span>
              </div>
              <div className="flex gap-4 px-4 min-w-max">
                 {Object.entries(REGISTRY_CONFIG).map(([type, cfg]) => (
                    <button 
                      key={type}
                      onClick={() => setActiveRegistry(type as EntityType)}
                      className={`p-6 w-44 rounded-[2.5rem] border-2 transition-all flex flex-col items-center gap-4 relative overflow-hidden group ${activeRegistry === type ? 'border-accent-primary bg-accent-primary/5 shadow-blue scale-105' : 'border-slate-800 bg-[#0E1626]/40 text-slate-600 hover:border-slate-700'}`}
                    >
                       <cfg.icon size={24} className={activeRegistry === type ? '' : 'opacity-40 group-hover:opacity-100'} style={{ color: cfg.color }} />
                       <span className={`text-[10px] font-black uppercase text-center tracking-tighter leading-tight ${activeRegistry === type ? 'text-white' : 'text-slate-500'}`}>{cfg.label}</span>
                    </button>
                 ))}
              </div>
           </section>

           <div className="bg-card-panel border border-border-ui rounded-[4rem] overflow-hidden shadow-4xl flex flex-col min-h-[800px]">
              <header className="p-10 border-b border-border-ui flex flex-wrap gap-8 items-center bg-slate-950/20">
                 <div className="relative flex-1 group min-w-[400px]">
                    <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-accent-primary transition-colors" size={24} />
                    <input 
                      type="text" 
                      placeholder={`Search ${activeRegistry} registry...`} 
                      className="w-full bg-slate-950 border border-slate-800 rounded-3xl pl-20 pr-8 py-5 text-xl text-text-primary outline-none focus:ring-4 focus:ring-accent-primary/10 transition-all font-serif italic"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                    />
                 </div>
                 <div className="flex gap-4">
                    <button onClick={() => setShowAddModal(true)} className="p-4 bg-accent-primary text-white rounded-2xl shadow-blue hover:brightness-110 active:scale-95 transition-all"><Plus size={24}/></button>
                    <button onClick={loadData} className="p-4 bg-slate-950 border border-slate-800 text-slate-500 rounded-2xl hover:text-white transition-all shadow-inner"><RefreshCw size={24} className={loading ? 'animate-spin' : ''}/></button>
                 </div>
              </header>

              <div className="flex-1 overflow-x-auto custom-scrollbar">
                 <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-950/60 border-b border-slate-800 sticky top-0 z-10">
                       <tr className="text-[11px] font-black text-slate-500 uppercase tracking-[0.5em]">
                          <th className="px-12 py-10">Institutional Identity</th>
                          <th className="px-10 py-10">HQ Node</th>
                          <th className="px-10 py-10">Custodian</th>
                          <th className="px-10 py-10 text-center">Confidence</th>
                          <th className="px-12 py-10 text-right">Execution</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                       {loading ? (
                         <tr><td colSpan={5} className="py-40 text-center"><Loader2 className="animate-spin mx-auto text-accent-primary" size={48}/></td></tr>
                       ) : filteredList.length === 0 ? (
                         <tr><td colSpan={5} className="py-60 text-center opacity-30 italic font-serif text-2xl uppercase tracking-tighter">Zero Nodes Found in Filtered Spectrum.</td></tr>
                       ) : (
                         filteredList.map(item => (
                            <tr key={item.id} className="hover:bg-accent-primary/[0.02] transition-all group border-l-[6px] border-transparent hover:border-accent-primary">
                               <td className="px-12 py-8">
                                  <div className="flex items-center gap-8">
                                     <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-2xl font-black text-accent-primary italic font-serif shadow-inner group-hover:scale-110 transition-transform">
                                        {(item.name || item.full_name || 'U')[0]}
                                     </div>
                                     <div>
                                        <p className="text-xl font-black text-text-primary dark:text-white italic font-serif leading-none mb-1.5 uppercase tracking-tight group-hover:text-accent-primary transition-colors">{item.name || item.full_name}</p>
                                        <p className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">SHA: {item.id.slice(0, 14).toUpperCase()}</p>
                                     </div>
                                  </div>
                               </td>
                               <td className="px-10 py-8">
                                  <div className="flex items-center gap-3">
                                     <MapPin size={14} className="text-slate-700" />
                                     <span className="text-[11px] font-black text-slate-400 uppercase italic tracking-tight">{item.hq_city || 'Global'}</span>
                                  </div>
                               </td>
                               <td className="px-10 py-8">
                                  <div className="flex items-center gap-3">
                                     <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-black text-slate-400 uppercase italic font-serif">
                                        {(userMap[item.last_updated_by || ''] || 'S')[0]}
                                     </div>
                                     <span className="text-xs font-black text-slate-400 uppercase italic leading-none">
                                        {userMap[item.last_updated_by || ''] || 'System Kernel'}
                                     </span>
                                  </div>
                               </td>
                               <td className="px-10 py-8 text-center">
                                  <span className={`text-xl font-black italic font-serif ${item.confidence_score > 80 ? 'text-emerald-500' : 'text-amber-500'}`}>{item.confidence_score}%</span>
                               </td>
                               <td className="px-12 py-8 text-right">
                                  <button onClick={() => setSelectedEntityId(item.id)} className="px-8 py-3 bg-accent-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-blue hover:brightness-110 active:scale-95 transition-all flex items-center gap-2">
                                     <Eye size={14}/> View Node
                                  </button>
                               </td>
                            </tr>
                         ))
                       )}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-[500] bg-slate-950/90 backdrop-blur-3xl flex items-center justify-center p-10 animate-in fade-in zoom-in-95">
           <form onSubmit={handleAddEntity} className="bg-[#0E1626] border border-accent-primary/20 rounded-[4rem] p-20 max-w-2xl w-full shadow-4xl relative overflow-hidden flex flex-col">
              <div className="absolute top-0 left-0 w-full h-2 bg-accent-primary shadow-blue"></div>
              <button type="button" onClick={() => setShowAddModal(false)} className="absolute top-10 right-10 text-slate-500 hover:text-white transition-all"><X size={40} /></button>
              <div className="mb-12 space-y-4">
                 <h2 className="text-5xl font-black text-white italic font-serif uppercase tracking-tight leading-none">Provision Entity</h2>
                 <p className="text-sm text-slate-500 italic">Initialize a new canonical institutional node in the DataNest registry.</p>
              </div>
              <div className="space-y-8">
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-4 italic">Institutional Name</label>
                    <input required className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-5 text-white font-bold italic font-serif outline-none focus:ring-4 focus:ring-accent-primary/10 transition-all shadow-inner" placeholder="e.g. Blackstone..." value={newEntity.name} onChange={e => setNewEntity({...newEntity, name: e.target.value})} />
                 </div>
                 <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-4 italic">Registry Target</label>
                       <select required className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-sm font-black text-accent-primary italic font-serif outline-none appearance-none cursor-pointer" value={newEntity.type} onChange={e => setNewEntity({...newEntity, type: e.target.value as any})}>
                          {Object.values(EntityType).map(t => <option key={t} value={t}>{t}</option>)}
                       </select>
                    </div>
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-4 italic">HQ Node (City)</label>
                       <input className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-sm text-white font-bold outline-none" placeholder="e.g. New York" value={newEntity.hq_city} onChange={e => setNewEntity({...newEntity, hq_city: e.target.value})} />
                    </div>
                 </div>
              </div>
              <button type="submit" disabled={isCommitting} className="w-full mt-12 py-8 bg-accent-primary text-white rounded-[2.5rem] font-black uppercase text-base tracking-[0.4em] shadow-blue hover:brightness-110 transition-all flex items-center justify-center gap-6 active:scale-95">
                 {isCommitting ? <Loader2 className="animate-spin" size={24}/> : <>Commit Entity <Save size={24}/></>}
              </button>
           </form>
        </div>
      )}

      {selectedEntityId && (
        <InstitutionalWindow 
          entityId={selectedEntityId} 
          entityType={activeRegistry}
          userProfile={userProfile}
          onClose={() => setSelectedEntityId(null)} 
        />
      )}
    </div>
  );
};

const DataNestDashboard = ({ stats }: any) => {
  return (
    <div className="space-y-16 animate-in slide-in-from-bottom-8 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {[
          { label: 'Total Federated Nodes', val: stats.entities_total || 0, icon: Building2, color: '#0052FF' },
          { label: 'Registry Refreshes (24h)', val: '412', icon: Zap, color: '#FFB800' },
          { label: 'Integrity Index', val: '94.8%', icon: Check, color: '#00E676' },
          { label: 'Extraction Yield', val: '96.2%', icon: Target, color: '#6366F1' },
        ].map((s, i) => (
          <div key={i} className="bg-card-panel border border-slate-800 p-10 rounded-[3.5rem] shadow-xl relative overflow-hidden group">
            <div className={`absolute -right-4 -top-4 opacity-5 group-hover:scale-110 transition-transform`} style={{ color: s.color }}><s.icon size={140} /></div>
            <p className="text-[11px] font-black text-text-muted uppercase tracking-[0.4em] mb-6">{s.label}</p>
            <p className="text-6xl font-black text-text-primary italic font-serif leading-none tracking-tighter">{s.val}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 bg-card-panel border border-slate-800 rounded-[4rem] p-12 shadow-2xl h-[500px]">
           <h3 className="text-[12px] font-black text-text-secondary uppercase tracking-[0.6em] mb-12 flex items-center gap-4"><TrendingUp size={18} className="text-accent-primary"/> Registry Synchronization Velocity</h3>
           <ResponsiveContainer width="100%" height="80%">
             <AreaChart data={[{d:'01',v:200},{d:'10',v:1500},{d:'20',v:2400},{d:'30',v:2800}]}>
               <Area type="monotone" dataKey="v" stroke="#0052FF" strokeWidth={4} fill="#0052FF33" />
             </AreaChart>
           </ResponsiveContainer>
        </div>
        <div className="lg:col-span-4 bg-card-panel border border-slate-800 rounded-[4rem] p-10 shadow-2xl flex flex-col">
           <h3 className="text-[12px] font-black text-text-secondary uppercase tracking-[0.6em] mb-10 flex items-center gap-4"><BarChart3 size={18} className="text-accent-primary"/> Classification Density</h3>
           <div className="space-y-6">
              {[
                { name: 'GPs', val: 84, color: '#3B82F6' },
                { name: 'LPs', val: 62, color: '#10B981' },
                { name: 'Funds', val: 91, color: '#6366F1' },
                { name: 'PortCos', val: 45, color: '#F59E0B' },
              ].map(item => (
                <div key={item.name} className="space-y-2">
                   <div className="flex justify-between items-end"><span className="text-[10px] font-black uppercase text-slate-400">{item.name}</span><span className="text-sm font-black text-white italic">{item.val}%</span></div>
                   <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden shadow-inner"><div className="h-full" style={{ width: `${item.val}%`, backgroundColor: item.color }}></div></div>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};

interface InstitutionalWindowProps {
  entityId: string;
  entityType: EntityType;
  userProfile: UserProfile;
  onClose: () => void;
}

const InstitutionalWindow: React.FC<InstitutionalWindowProps> = ({ entityId, entityType, userProfile, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [entityData, setEntityData] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [intelligence, setIntelligence] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'MATRIX' | 'LINEAGE' | 'SIGNALS'>('MATRIX');
  const [isEditing, setIsEditing] = useState(false);
  const [rationale, setRationale] = useState('');

  const loadDeepData = async () => {
    setLoading(true);
    try {
const [e, h, i] = await Promise.all([
  supabaseService.fetchEntityById(entityType, entityId),
  supabaseService.fetchEntityHistory(entityId),
  supabaseService.fetchDocumentIntelligence(entityId)
]);

setEntityData(e);
setHistory(h);
setIntelligence(i.slice(0, 8));

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDeepData(); }, [entityId]);

  const handleCommitMutation = async () => {
    if (!rationale) return alert("Rationale entry is mandatory for identity mutations.");
    setIsEditing(false);
    setRationale('');
    loadDeepData();
  };

  if (loading || !entityData) return (
    <div className="fixed inset-0 z-[1000] bg-slate-950 flex flex-col items-center justify-center gap-8">
       <Loader2 className="animate-spin text-accent-primary" size={64} />
       <p className="text-[12px] font-black uppercase tracking-[0.6em] animate-pulse">Syncing Domain Node...</p>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[1000] bg-slate-950 flex animate-in fade-in duration-300">
      
      {/* 10% LEFT: LINEAGE AUDIT */}
      <aside className="w-[10%] border-r border-slate-800 bg-app-bg flex flex-col p-8 gap-10 overflow-y-auto custom-scrollbar shrink-0">
         <h4 className="text-[9px] font-black text-text-muted uppercase tracking-[0.3em] flex items-center gap-3 border-b border-slate-900 pb-6 shrink-0"><History size={14}/> Lineage Audit</h4>
         <div className="space-y-10">
            {history.map((h, i) => (
              <div key={i} className="space-y-3 opacity-60 hover:opacity-100 transition-opacity cursor-default group">
                 <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-accent-primary"></div><span className="text-[8px] font-mono text-slate-500 uppercase">{new Date(h.created_at).toLocaleDateString()}</span></div>
                 <p className="text-[10px] font-black text-white italic leading-tight uppercase group-hover:text-accent-primary">{h.source_reference || 'Refinery Extract'}</p>
                 <p className="text-[9px] text-slate-600 italic">"Field Mutation Detect"</p>
              </div>
            ))}
            {history.length === 0 && <p className="text-[9px] text-slate-700 uppercase italic">Zero lineage signals.</p>}
         </div>
      </aside>

      {/* 80% CENTER: CANONICAL MATRIX */}
      <main className="flex-1 flex flex-col bg-card-panel overflow-hidden border-x border-slate-800 shadow-4xl">
         <header className="h-28 border-b border-slate-800 flex items-center justify-between px-16 bg-slate-950/40 backdrop-blur-md shrink-0">
            <div className="flex items-center gap-10">
               <button onClick={onClose} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-slate-500 hover:text-white transition-all shadow-xl active:scale-95"><X size={28}/></button>
               <div>
                  <div className="flex items-center gap-4 mb-2">
                     <span className="text-[9px] font-black text-accent-primary uppercase tracking-[0.4em] bg-accent-primary/10 px-3 py-1 rounded-lg border border-accent-primary/20 italic">{entityType} Registry Node</span>
                     <span className="text-[9px] font-mono text-slate-600 uppercase">SHA: {entityId.toUpperCase().slice(0, 16)}</span>
                  </div>
                  <h2 className="text-4xl font-black text-text-primary italic font-serif uppercase tracking-tight leading-none">{entityData.name || entityData.full_name}</h2>
               </div>
            </div>
            
            <div className="flex items-center gap-6">
               {isEditing ? (
                 <div className="flex items-center gap-4 animate-in slide-in-from-right-4">
                    <input className="bg-slate-950 border border-amber-500/30 rounded-xl px-6 py-3 text-[11px] text-white italic font-serif outline-none min-w-[250px]" placeholder="Mandatory Mutation Rationale..." value={rationale} onChange={e => setRationale(e.target.value)} />
                    <button onClick={handleCommitMutation} className="px-10 py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:brightness-110 flex items-center gap-3"><Save size={18}/> Commit Ledger</button>
                    <button onClick={() => { setIsEditing(false); setRationale(''); }} className="p-3 bg-slate-900 text-slate-500 rounded-xl hover:text-white transition-all"><X size={20}/></button>
                 </div>
               ) : (
                 <button onClick={() => setIsEditing(true)} className="px-10 py-4 bg-slate-900 border border-slate-800 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:text-white flex items-center gap-3 transition-all shadow-2xl group font-serif italic"><Edit3 size={18} className="group-hover:text-accent-primary"/> Mutation Protocol</button>
               )}
            </div>
         </header>

         <div className="flex-1 overflow-y-auto custom-scrollbar p-16 bg-[#0B1220]">
            <div className="max-w-[1200px] mx-auto">
               <div className="grid grid-cols-2 gap-12 animate-in fade-in duration-500">
                  {Object.entries(entityData).filter(([k]) => !['id', 'tenant_id', 'updated_at', 'created_at'].includes(k)).map(([key, val], i) => (
                    <div key={i} className="space-y-4 group">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4 block uppercase italic tracking-wider">{key.replace(/_/g, ' ')}</label>
                       {isEditing ? (
                         <input 
                           className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-8 py-5 text-xl text-white font-black italic font-serif outline-none focus:ring-4 focus:ring-accent-primary/10 transition-all shadow-inner"
                           defaultValue={String(val || '')}
                         />
                       ) : (
                         <div className="p-8 bg-slate-900/40 border border-slate-800/40 rounded-[2.5rem] shadow-inner group-hover:border-accent-primary/20 transition-all relative overflow-hidden">
                            <p className="text-2xl font-black text-white italic font-serif uppercase tracking-tight leading-none truncate select-all">{String(val || 'NODE_PENDING')}</p>
                         </div>
                       )}
                    </div>
                  ))}

                  {/* SPECIALIZED VERTICAL FIELDS (FORCED RESTORATION) */}
                  {entityType === EntityType.AGRITECH && (
                    <div className="col-span-2 mt-10 p-10 bg-emerald-600/5 border border-emerald-500/20 rounded-[3rem] space-y-8 animate-in slide-in-from-bottom-4 shadow-xl">
                       <h4 className="text-[12px] font-black text-emerald-500 uppercase tracking-[0.4em] flex items-center gap-4"><Wheat size={20}/> Agri-Specific Matrix</h4>
                       <div className="grid grid-cols-3 gap-8">
                          <div className="space-y-2"><p className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Crop Segment</p><p className="text-xl font-black text-white italic">Industrial Pulses</p></div>
                          <div className="space-y-2"><p className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Soil Index</p><p className="text-xl font-black text-white italic">Grade A-1</p></div>
                          <div className="space-y-2"><p className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Yield Velocity</p><p className="text-xl font-black text-emerald-500 italic">Nominal (12.4%)</p></div>
                       </div>
                    </div>
                  )}
               </div>
            </div>
         </div>
      </main>

      {/* 10% RIGHT: SIGNAL PULSE */}
      <aside className="w-[10%] border-l border-slate-800 bg-app-bg flex flex-col p-8 gap-10 overflow-y-auto custom-scrollbar shrink-0">
         <h4 className="text-[9px] font-black text-text-muted uppercase tracking-[0.3em] flex items-center gap-3 border-b border-slate-900 pb-6 shrink-0"><Sparkles size={14}/> Signal Pulse</h4>
         <div className="space-y-10">
            {intelligence.map((intel, i) => (
              <div key={i} className="space-y-4 group cursor-default">
                 <div className="flex justify-between items-center"><span className="text-[8px] font-black text-accent-primary uppercase tracking-widest italic">{intel.insight_type}</span><div className="w-1.5 h-1.5 rounded-full bg-accent-primary animate-pulse shadow-blue"></div></div>
                 <p className="text-[11px] font-black text-white italic font-serif leading-snug uppercase tracking-tight group-hover:text-accent-primary transition-colors select-all">"{intel.insight}"</p>
              </div>
            ))}
            {intelligence.length === 0 && <p className="text-[9px] text-slate-700 uppercase italic">Zero active signals.</p>}
         </div>
      </aside>
    </div>
  );
};

export default DataNest;