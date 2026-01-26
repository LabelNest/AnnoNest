
import React, { useState, useEffect, useMemo } from 'react';
import { 
  GlobeLock, Search, Plus, Globe, RefreshCw, Loader2, 
  ExternalLink, ChevronRight, CheckCircle2, XCircle, 
  Layers, Database, Landmark, MoreVertical, ShieldCheck,
  ChevronDown, GitMerge, Fingerprint, ShieldAlert, Target,
  Users, Briefcase, FileText, Zap, Link2, 
  // Fix: Added ArrowRight icon which was missing from imports
  ArrowRight
} from 'lucide-react';
import { supabaseService } from '../services/supabaseService';
import { FirmURL, UserProfile, Entity } from '../types';

const ExtractionURLManager: React.FC<{ userProfile: UserProfile }> = ({ userProfile }) => {
  const [urls, setUrls] = useState<FirmURL[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEntityId, setSelectedEntityId] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newUrlType, setNewUrlType] = useState('PARENT');

  const loadData = async () => {
    setLoading(true);
    try {
      const [uData, eData] = await Promise.all([
        supabaseService.fetchFirmUrls(userProfile.tenant_id),
        supabaseService.fetchEntities(userProfile.tenant_id)
      ]);
      setUrls(uData);
      setEntities(eData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [userProfile.tenant_id]);

  // DOMAIN LOGIC: Group by Entity. Within each entity, identify Parent and list Children.
  const groupedEntities = useMemo(() => {
    const map = new Map<string, { entity: Entity, parent: FirmURL | null, children: FirmURL[] }>();
    
    entities.forEach(e => {
      if (!search || e.name.toLowerCase().includes(search.toLowerCase())) {
        map.set(e.id, { entity: e, parent: null, children: [] });
      }
    });

    urls.forEach(u => {
      if (map.has(u.entity_id)) {
        const group = map.get(u.entity_id)!;
        // Logic: FIRM_WEBSITE or PARENT is the root
        if (u.url_type === 'FIRM_WEBSITE' || u.url_type === 'PARENT') {
          group.parent = u;
        } else {
          group.children.push(u);
        }
      }
    });

    return Array.from(map.values()).filter(g => g.parent || g.children.length > 0);
  }, [urls, entities, search]);

  const handleAdd = async () => {
    if (!selectedEntityId || !newUrl) return;
    const res = await supabaseService.addFirmUrl({
      entity_id: selectedEntityId,
      url: newUrl,
      url_type: newUrlType,
      verification_status: 'PENDING',
      tenant_id: userProfile.tenant_id
    });
    if ('success' in res && res.success) {
      loadData();
      setShowAddModal(false);
      setNewUrl('');
    }
  };

  const handleVerifyEntity = async (entityId: string) => {
    // DOMAIN LOGIC: Verification happens at ENTITY level.
    const entityUrls = urls.filter(u => u.entity_id === entityId);
    const ids = entityUrls.map(u => u.id);
    await supabaseService.bulkUpdateFirmURLs(ids, { 
      verification_status: 'VERIFIED',
      verified_at: new Date().toISOString(),
      verified_by: userProfile.user_id
    });
    loadData();
  };

  if (loading) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" size={48} /></div>;

  return (
    <div className="space-y-12 animate-in fade-in duration-500 max-w-[1600px] mx-auto pb-40">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-10 border-b border-[#1C2A44] pb-16">
        <div className="space-y-6">
          <h1 className="text-8xl font-black flex items-center gap-10 text-white tracking-tighter uppercase italic font-serif leading-none">
            <GlobeLock className="text-blue-500" size={80} />
            URL Manager
          </h1>
          <div className="flex items-center gap-6 text-slate-400 font-medium text-xl italic">
             <Target size={26} className="text-blue-500" /> Entity Hierarchy — <span className="text-blue-500 font-black uppercase text-xs tracking-[0.4em] bg-blue-500/10 px-6 py-2 rounded-full border border-blue-500/20 shadow-2xl">Root Ownership Pattern</span>
          </div>
        </div>
        <button onClick={() => setShowAddModal(true)} className="px-10 py-5 bg-blue-600 text-white rounded-[2rem] text-sm font-black uppercase tracking-widest shadow-blue hover:brightness-110 active:scale-95 transition-all flex items-center gap-4">
           <Plus size={20} /> Register Web Node
        </button>
      </header>

      {/* SEARCH HUD */}
      <div className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-xl border border-slate-800 rounded-[3rem] p-6 shadow-2xl flex flex-wrap gap-6 items-center">
         <div className="relative flex-1 group min-w-[300px]">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors" size={24} />
            <input 
              type="text" 
              placeholder="Identify institutional anchor (GP, LP, Fund)..." 
              className="w-full bg-slate-950 border border-slate-800 rounded-3xl pl-20 pr-8 py-5 text-lg text-white outline-none focus:ring-4 focus:ring-blue-500/10 transition-all italic font-serif"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
         </div>
         <button onClick={loadData} className="p-5 bg-slate-900 border border-slate-800 rounded-2xl text-slate-500 hover:text-white transition-all"><RefreshCw size={24}/></button>
      </div>

      {/* GROUPED HIERARCHY LIST */}
      <div className="space-y-12">
         {groupedEntities.map(({ entity, parent, children }) => {
           const isVerified = parent?.verification_status === 'VERIFIED';
           
           return (
             <section key={entity.id} className="bg-[#0E1626] border border-[#1C2A44] rounded-[4rem] overflow-hidden shadow-4xl group/entity">
                <header className="px-12 py-10 bg-slate-950/40 border-b border-[#1C2A44] flex items-center justify-between">
                   <div className="flex items-center gap-10">
                      <div className={`w-16 h-16 rounded-[1.5rem] border-2 flex items-center justify-center text-3xl font-black italic font-serif shadow-inner group-hover/entity:scale-105 transition-transform ${isVerified ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-500' : 'bg-slate-900 border-slate-800 text-slate-700'}`}>
                        {entity.name?.[0] || 'U'}
                      </div>
                      <div>
                        <div className="flex items-center gap-4 mb-2">
                           <h3 className="text-3xl font-black text-white italic font-serif uppercase tracking-tight leading-none group-hover/entity:text-blue-400 transition-colors">{entity.name}</h3>
                           {isVerified && <ShieldCheck size={20} className="text-emerald-500" />}
                        </div>
                        <div className="flex items-center gap-4 text-[9px] font-black text-slate-600 uppercase tracking-widest italic">
                           <span>{entity.type} Registry</span>
                           <div className="h-1 w-1 rounded-full bg-slate-800"></div>
                           <span>UID: {entity.id.slice(0, 16).toUpperCase()}</span>
                        </div>
                      </div>
                   </div>
                   <div className="flex items-center gap-4">
                      {!isVerified && (
                        <button 
                          onClick={() => handleVerifyEntity(entity.id)}
                          className="px-8 py-3 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-emerald-500 hover:text-white transition-all active:scale-95"
                        >
                           Verify Entity Root
                        </button>
                      )}
                      <button className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-600 hover:text-white transition-all shadow-inner"><MoreVertical size={20}/></button>
                   </div>
                </header>

                <div className="p-10 space-y-10">
                   {/* PARENT NODE */}
                   <div className="space-y-4">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] ml-10 flex items-center gap-3">
                         <Globe size={14} className="text-blue-500"/> Website Root (Parent)
                      </p>
                      {parent ? (
                        <div className="ml-10 p-8 bg-slate-900/60 border-2 border-blue-500/20 rounded-[3rem] flex items-center justify-between shadow-inner relative group/parent">
                           <div className="absolute top-0 left-0 w-2 h-full bg-blue-500 rounded-l-[3rem]"></div>
                           <div className="flex items-center gap-8">
                              <p className="text-2xl font-black text-white italic font-serif truncate max-w-2xl select-all">{parent.url}</p>
                              <a href={parent.url} target="_blank" rel="noreferrer" className="p-2.5 bg-slate-950 border border-slate-800 text-slate-500 hover:text-blue-500 rounded-xl transition-all shadow-lg">
                                 <ExternalLink size={20}/>
                              </a>
                           </div>
                           <div className="flex items-center gap-6">
                              <span className="px-4 py-1.5 rounded-full bg-blue-600/10 text-blue-400 border border-blue-500/20 text-[9px] font-black uppercase tracking-widest italic">PARENT_NODE</span>
                              {isVerified && <span className="flex items-center gap-2 text-emerald-500 text-[10px] font-black uppercase tracking-widest italic bg-emerald-500/5 px-4 py-1.5 rounded-full border border-emerald-500/10 shadow-lg shadow-emerald-900/10"><ShieldCheck size={14}/> Verified Root</span>}
                           </div>
                        </div>
                      ) : (
                        <div className="ml-10 p-8 border-2 border-dashed border-slate-800 rounded-[3rem] text-center opacity-30">
                           <p className="text-sm font-bold uppercase tracking-widest text-slate-600">No Parent URL Registered</p>
                        </div>
                      )}
                   </div>

                   {/* CHILD NODES */}
                   <div className="space-y-4">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] ml-10 flex items-center gap-3">
                         <GitMerge size={14} className="text-indigo-400"/> Protocol Nodes (Children)
                      </p>
                      <div className="ml-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {children.map(child => (
                          <div key={child.id} className="p-6 bg-slate-900/40 border border-[#1C2A44] rounded-[2.5rem] flex flex-col gap-6 group/child hover:border-indigo-500/30 transition-all">
                             <div className="flex justify-between items-start">
                                <div className="p-3 bg-slate-950 rounded-2xl text-indigo-400 shadow-inner group-hover/child:scale-110 transition-transform">
                                   {child.url_type === 'TEAM_PAGE' ? <Users size={18}/> : child.url_type === 'PORTFOLIO_PAGE' ? <Briefcase size={18}/> : <Link2 size={18}/>}
                                </div>
                                <span className="text-[8px] font-black text-slate-600 uppercase tracking-[0.2em] bg-slate-950 px-2 py-1 rounded border border-slate-800">{child.url_type}</span>
                             </div>
                             <p className="text-sm font-bold text-slate-300 italic font-serif truncate select-all">{child.url.replace('https://', '')}</p>
                             <div className="pt-4 border-t border-slate-800/40 flex justify-between items-center">
                                <span className={`text-[8px] font-black uppercase italic ${child.verification_status === 'VERIFIED' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                   {child.verification_status === 'VERIFIED' ? 'INHERITED_TRUST' : 'PENDING_ANCHOR'}
                                </span>
                                <a href={child.url} target="_blank" rel="noreferrer" className="text-slate-700 hover:text-white transition-colors"><ExternalLink size={14}/></a>
                             </div>
                          </div>
                        ))}
                        <button 
                          onClick={() => { setSelectedEntityId(entity.id); setNewUrlType('CHILD'); setShowAddModal(true); }}
                          className="p-6 border-2 border-dashed border-slate-800 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 text-slate-700 hover:text-indigo-400 hover:border-indigo-500/30 transition-all group/add"
                        >
                           <Plus size={24} className="group-hover/add:scale-125 transition-transform" />
                           <span className="text-[9px] font-black uppercase tracking-widest">Register Child Node</span>
                        </button>
                      </div>
                   </div>
                </div>

                <footer className="px-12 py-6 bg-slate-950/20 border-t border-[#1C2A44] flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className={`w-1.5 h-1.5 rounded-full ${isVerified ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-amber-500'} shadow-lg animate-pulse`}></div>
                      <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">Node Status: {isVerified ? 'Synchronized' : 'Verification Required'}</span>
                   </div>
                   <button className="text-[9px] font-black text-blue-500 uppercase tracking-widest hover:underline flex items-center gap-2">Discover Protocol Children <Zap size={10}/></button>
                </footer>
             </section>
           );
         })}
      </div>

      {/* ADD URL MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-[200] bg-slate-950/90 backdrop-blur-3xl flex items-center justify-center p-10 animate-in zoom-in-95">
           <div className="bg-[#0B1220] border border-slate-800 rounded-[4rem] p-20 max-w-2xl w-full shadow-3xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-blue-600 shadow-blue"></div>
              <button onClick={() => setShowAddModal(false)} className="absolute top-10 right-10 text-slate-500 hover:text-white transition-all"><XCircle size={32} /></button>
              
              <h2 className="text-5xl font-black text-white italic font-serif uppercase tracking-tight mb-12">Register Node</h2>

              <div className="space-y-10">
                 <div className="space-y-4">
                    <label className="text-[11px] font-black text-slate-600 uppercase tracking-widest ml-6">Institutional Anchor</label>
                    <select 
                      className="w-full bg-slate-950 border border-slate-800 rounded-[2rem] p-6 text-white font-bold outline-none focus:ring-4 focus:ring-blue-500/10 appearance-none italic font-serif"
                      value={selectedEntityId}
                      onChange={e => setSelectedEntityId(e.target.value)}
                    >
                       <option value="">Select entity...</option>
                       {entities.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </select>
                 </div>

                 <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-4">
                       <label className="text-[11px] font-black text-slate-600 uppercase tracking-widest ml-6">Hierarchy Level</label>
                       <select 
                        className="w-full bg-slate-950 border border-slate-800 rounded-[1.5rem] p-5 text-white font-bold outline-none appearance-none"
                        value={newUrlType}
                        onChange={e => setNewUrlType(e.target.value)}
                       >
                          <option value="FIRM_WEBSITE">Parent (Root)</option>
                          <option value="TEAM_PAGE">Child (Team)</option>
                          <option value="PORTFOLIO_PAGE">Child (Portfolio)</option>
                          <option value="BIO_PAGE">Child (Bio)</option>
                       </select>
                    </div>
                    <div className="space-y-4">
                       <label className="text-[11px] font-black text-slate-600 uppercase tracking-widest ml-6">Node Status</label>
                       <div className="p-5 bg-slate-950 border border-slate-800 rounded-[1.5rem] text-slate-600 font-black uppercase text-[10px] tracking-widest italic flex items-center gap-3">
                          <Fingerprint size={16}/> PENDING_AUDIT
                       </div>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <label className="text-[11px] font-black text-slate-600 uppercase tracking-widest ml-6">Protocol Address (URL)</label>
                    <input 
                      className="w-full bg-slate-950 border border-slate-800 rounded-[2rem] p-6 text-lg text-white font-black italic font-serif outline-none focus:ring-4 focus:ring-blue-500/10"
                      placeholder="https://..."
                      value={newUrl}
                      onChange={e => setNewUrl(e.target.value)}
                    />
                 </div>
              </div>

              <button 
                onClick={handleAdd}
                disabled={!selectedEntityId || !newUrl}
                className="w-full mt-12 py-8 bg-blue-600 text-white rounded-[3rem] font-black uppercase text-sm tracking-[0.4em] shadow-blue hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-6 disabled:opacity-30"
              >
                 {/* Fixed: Icon ArrowRight is now correctly imported */}
                 Commit to Registry <ArrowRight size={24}/>
              </button>
           </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="fixed bottom-0 left-72 right-0 h-16 bg-slate-950/90 backdrop-blur-xl border-t border-slate-900 px-10 flex items-center justify-between z-[100] pointer-events-none">
         <div className="flex items-center gap-10">
            <div className="flex items-center gap-3">
               <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shadow-blue"></div>
               <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">Hierarchy Pulse: Active</span>
            </div>
            <div className="flex items-center gap-3">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-emerald-900/40 shadow-lg"></div>
               <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">Data Sovereignty: Entity-Root</span>
            </div>
         </div>
         <p className="text-[9px] font-black text-slate-800 uppercase tracking-[0.4em] italic font-serif">AnnoNest URL Control Matrix — v1.0 CANON</p>
      </footer>
    </div>
  );
};

export default ExtractionURLManager;
