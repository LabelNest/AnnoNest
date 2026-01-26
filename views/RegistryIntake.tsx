
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Database, RefreshCw, Search, ArrowRight, Landmark, ExternalLink, ShieldAlert,
  Loader2, Filter, Layers, ShieldCheck as VerifiedIcon, Hash as HashIcon,
  Check, X, Building, Target, Zap, SearchCheck, Info, Clock, 
  ChevronRight, ArrowLeft, Building2, Globe, Sparkles, Tag, Save,
  AlertCircle, History, User, CheckCircle2, GitMerge
} from 'lucide-react';
import { 
  RegistryIntakeItem, UserProfile, UserRole, EntityType, 
  IntakeResolutionType, Entity 
} from '../types';
import { supabaseService } from '../services/supabaseService';

interface Props {
  userProfile: UserProfile;
}

const RegistryIntake: React.FC<Props> = ({ userProfile }) => {
  const [queue, setQueue] = useState<RegistryIntakeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeItem, setActiveItem] = useState<RegistryIntakeItem | null>(null);
  const [committing, setCommitting] = useState(false);

  // DECISION STATE
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState<EntityType | null>(null);
  const [resolution, setResolution] = useState<IntakeResolutionType | null>(null);
  const [justification, setJustification] = useState('');
  const [reasoning, setReasoning] = useState('');
  
  // Link Existing State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Entity[]>([]);
  const [selectedLinkedEntity, setSelectedLinkedEntity] = useState<Entity | null>(null);
  const [searching, setSearching] = useState(false);

  // Create New State
  const [shellData, setShellData] = useState({
    legal_name: '',
    website: '',
    jurisdiction: '',
    entity_type: EntityType.GP
  });

  useEffect(() => {
    loadQueue();
  }, []);

  useEffect(() => {
    if (activeItem) {
      setShellData({
        legal_name: activeItem.suggested_entity_name,
        website: '',
        jurisdiction: '',
        entity_type: activeItem.suggested_entity_type
      });
      setSelectedType(activeItem.suggested_entity_type);
      setSearchQuery(activeItem.suggested_entity_name);
    }
  }, [activeItem]);

  const loadQueue = async () => {
    setLoading(true);
    // Fixed: Using tenant_id
    const data = await supabaseService.fetchRegistryIntakeQueue(userProfile.tenant_id);
    setQueue(data);
    setLoading(false);
  };

  const handleSearchDataNest = async () => {
    if (!searchQuery) return;
    setSearching(true);
    // Fixed: Using tenant_id
    const results = await supabaseService.searchDataNest(userProfile.tenant_id, searchQuery);
    setSearchResults(results);
    setSearching(false);
  };

  const handleCommitDecision = async () => {
    if (!activeItem || !reasoning) return;
    setCommitting(true);
    
    let payload = {};
    if (resolution === 'LINK_EXISTING' && selectedLinkedEntity) {
      payload = { entity_id: selectedLinkedEntity.id };
    } else if (resolution === 'CREATE_NEW') {
      payload = shellData;
    }

    const res = await supabaseService.commitIntakeDecision(
      activeItem,
      resolution!,
      userProfile.user_id,
      reasoning,
      payload
    );

    if (res.success) {
      setActiveItem(null);
      setStep(1);
      setResolution(null);
      setSelectedType(null);
      setReasoning('');
      loadQueue();
    } else {
      /** Fix: Service result object doesn't have .error property, using generic alert */
      alert("Operational Handshake Failure.");
    }
    setCommitting(false);
  };

  const formatHash = (id: string) => (id || '').slice(0, 14).toUpperCase();

  if (activeItem) {
    return (
      <div className="fixed inset-0 z-[150] bg-app-bg dark:bg-[#020617] flex flex-col animate-in fade-in duration-500 overflow-hidden">
        <header className="h-20 bg-card-panel dark:bg-[#0F172A] border-b border-border-ui dark:border-[#1E293B] px-10 flex items-center justify-between shrink-0">
           <div className="flex items-center gap-8">
              <button onClick={() => setActiveItem(null)} className="flex items-center gap-3 px-6 py-2 bg-app-bg dark:bg-[#020617] border border-border-ui dark:border-[#1E293B] rounded-2xl text-[10px] font-black uppercase text-text-secondary hover:text-white transition-all group">
                <ArrowLeft size={16} className="group-hover:-translate-x-1" /> Back to Queue
              </button>
              <div className="h-8 w-px bg-slate-800"></div>
              <div className="flex items-center gap-4">
                 <span className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                   activeItem.source_type === 'NEWS' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                   activeItem.source_type === 'SALES' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                   'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                 }`}>
                   {activeItem.source_type} Signal
                 </span>
                 <p className="text-xl font-black text-white italic font-serif leading-none tracking-tight uppercase">{activeItem.suggested_entity_name}</p>
              </div>
           </div>
           <div className="flex items-center gap-6">
              <div className="text-right">
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Confidence Index</p>
                 <p className="text-xl font-black text-brand-primary italic font-serif">{(activeItem.confidence_score * 100).toFixed(0)}%</p>
              </div>
              <div className="h-10 w-10 bg-brand-primary/10 rounded-xl flex items-center justify-center text-brand-primary border border-brand-primary/20">
                 <SearchCheck size={20} />
              </div>
           </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
           {/* LEFT PANEL: SIGNAL CONTEXT */}
           <aside className="w-1/2 overflow-y-auto custom-scrollbar p-12 bg-[#020617] border-r border-slate-900 space-y-12">
              <section className="space-y-6">
                 <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.5em] flex items-center gap-3"><Info size={18} className="text-blue-500"/> Source Context</h4>
                 <div className="bg-slate-900/40 border border-slate-800 rounded-[3rem] p-10 space-y-10 shadow-inner relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-10 text-blue-500/5"><Globe size={240} /></div>
                    <div className="space-y-4 relative z-10">
                       <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Trigger Reference</p>
                       <p className="text-2xl font-black text-white italic font-serif leading-relaxed uppercase tracking-tighter">"{activeItem.trigger_reference}"</p>
                    </div>
                    {activeItem.payload_context?.text && (
                       <div className="space-y-4 relative z-10 pt-10 border-t border-slate-800">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Contextual Extract</p>
                          <p className="text-lg text-slate-400 font-medium italic leading-relaxed font-serif">{activeItem.payload_context.text}</p>
                       </div>
                    )}
                 </div>
              </section>

              <section className="grid grid-cols-2 gap-8">
                 <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-8 space-y-4">
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Identified Nodes</p>
                    <div className="flex flex-wrap gap-2">
                       {activeItem.payload_context?.extracted_entities?.map((e: string) => (
                         <span key={e} className="px-3 py-1 bg-slate-950 rounded-lg text-[10px] font-bold text-slate-400 italic border border-slate-800">{e}</span>
                       ))}
                    </div>
                 </div>
                 <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-8 space-y-4">
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Temporal Signature</p>
                    <div className="flex items-center gap-3 text-white font-bold italic text-sm">
                       <Clock size={16} className="text-blue-500" />
                       {new Date(activeItem.created_at).toLocaleString()}
                    </div>
                 </div>
              </section>

              <div className="p-8 bg-blue-500/5 border border-blue-500/10 rounded-[3rem] space-y-4">
                 <h5 className="text-[10px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-3"><VerifiedIcon size={16}/> Integrity Protocol</h5>
                 <p className="text-xs text-slate-500 leading-relaxed italic font-medium">Registry Intake is the strictly controlled gateway for institutional truth. All decisions must be accompanied by explicit reasoning and are permanently persisted in the audit ledger.</p>
              </div>
           </aside>

           {/* RIGHT PANEL: REGISTRY DECISION */}
           <main className="flex-1 overflow-y-auto custom-scrollbar p-12 bg-card-panel dark:bg-[#0F172A] space-y-12">
              <div className="max-w-[700px] mx-auto space-y-16">
                 
                 {/* STEP 1: ENTITY TYPE */}
                 <section className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center gap-6">
                       <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black italic font-serif text-xl shadow-xl">01</div>
                       <div>
                          <h3 className="text-2xl font-black text-white italic font-serif uppercase tracking-tight">Entity Classification</h3>
                          <p className="text-xs text-slate-500 font-medium italic">Assign the canonical registry target for this node.</p>
                       </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                       {Object.values(EntityType).map(type => (
                         <button 
                           key={type} 
                           onClick={() => setSelectedType(type)}
                           className={`px-6 py-3 rounded-xl border-2 transition-all text-[10px] font-black uppercase tracking-widest ${selectedType === type ? 'bg-blue-600 border-blue-500 text-white shadow-2xl scale-105' : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-blue-500/40'}`}
                         >
                           {type}
                         </button>
                       ))}
                    </div>
                 </section>

                 {/* STEP 2: RESOLUTION TYPE */}
                 {selectedType && (
                   <section className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                      <div className="flex items-center gap-6">
                         <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black italic font-serif text-xl shadow-xl">02</div>
                         <div>
                            <h3 className="text-2xl font-black text-white italic font-serif uppercase tracking-tight">Resolution Strategy</h3>
                            <p className="text-xs text-slate-500 font-medium italic">Determine how this signal impacts the DataNest master registry.</p>
                         </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                         {[
                           { id: 'LINK_EXISTING', label: 'Link Existing', icon: GitMerge },
                           { id: 'CREATE_NEW', label: 'Create Shell', icon: Building },
                           { id: 'IGNORE_SIGNAL', label: 'Ignore Signal', icon: X }
                         ].map(opt => (
                           <button 
                             key={opt.id} 
                             onClick={() => setResolution(opt.id as any)}
                             className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-4 text-center ${resolution === opt.id ? 'bg-emerald-600 border-emerald-500 text-white shadow-3xl scale-105' : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-emerald-500/40'}`}
                           >
                              <opt.icon size={24} />
                              <span className="text-[10px] font-black uppercase tracking-widest">{opt.label}</span>
                           </button>
                         ))}
                      </div>
                   </section>
                 )}

                 {/* STEP 3A: LINK EXISTING */}
                 {resolution === 'LINK_EXISTING' && (
                   <section className="space-y-8 animate-in zoom-in-95 duration-500">
                      <div className="bg-slate-950 border border-slate-800 rounded-[3rem] p-8 space-y-8 shadow-3xl">
                         <div className="relative group">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors" size={20} />
                            <input 
                              className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-16 pr-24 py-5 text-lg text-white font-bold italic font-serif outline-none"
                              placeholder="Search DataNest Registry..."
                              value={searchQuery}
                              onChange={e => setSearchQuery(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && handleSearchDataNest()}
                            />
                            <button onClick={handleSearchDataNest} className="absolute right-4 top-1/2 -translate-y-1/2 px-5 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase shadow-xl hover:bg-emerald-500">Scan</button>
                         </div>

                         <div className="space-y-3">
                            {searching && <div className="flex items-center justify-center py-10 gap-3 text-slate-500"><Loader2 className="animate-spin" size={20}/> Scouring master registry...</div>}
                            {searchResults.map(res => (
                              <button 
                                key={res.id} 
                                onClick={() => setSelectedLinkedEntity(res)}
                                className={`w-full p-6 border-2 rounded-[2rem] text-left transition-all flex items-center justify-between group ${selectedLinkedEntity?.id === res.id ? 'bg-emerald-600 border-emerald-500 text-white shadow-2xl' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-emerald-500/40'}`}
                              >
                                 <div className="flex items-center gap-6">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black italic font-serif text-xl ${selectedLinkedEntity?.id === res.id ? 'bg-white/20 text-white' : 'bg-slate-950 text-emerald-500 shadow-inner'}`}>{res.name[0]}</div>
                                    <div>
                                       <p className="text-base font-black italic font-serif uppercase leading-none mb-1.5">{res.name}</p>
                                       <p className={`text-[9px] font-mono uppercase tracking-tighter ${selectedLinkedEntity?.id === res.id ? 'text-emerald-100' : 'text-slate-600'}`}>MASTER_HASH: {formatHash(res.id)}</p>
                                    </div>
                                 </div>
                                 <ChevronRight size={18} className={selectedLinkedEntity?.id === res.id ? 'text-white' : 'text-slate-700'} />
                              </button>
                            ))}
                         </div>
                      </div>
                   </section>
                 )}

                 {/* STEP 3B: CREATE NEW (SHELL ONLY) */}
                 {resolution === 'CREATE_NEW' && (
                   <section className="space-y-8 animate-in zoom-in-95 duration-500">
                      <div className="bg-slate-950 border border-slate-800 rounded-[3rem] p-10 space-y-8 shadow-3xl">
                         <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-6">Legal Name</label>
                            <input className="w-full bg-slate-900 border border-slate-800 rounded-[2rem] p-6 text-xl text-white font-black italic font-serif uppercase outline-none focus:ring-4 focus:ring-emerald-500/10" value={shellData.legal_name} onChange={e => setShellData({...shellData, legal_name: e.target.value})} />
                         </div>
                         <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-4">
                               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-6">Primary Domain</label>
                               <input className="w-full bg-slate-900 border border-slate-800 rounded-[1.5rem] p-5 text-sm text-blue-400 font-bold outline-none" placeholder="e.g. firm.com" value={shellData.website} onChange={e => setShellData({...shellData, website: e.target.value})} />
                            </div>
                            <div className="space-y-4">
                               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-6">Jurisdiction</label>
                               <input className="w-full bg-slate-900 border border-slate-800 rounded-[1.5rem] p-5 text-sm text-white font-bold outline-none" placeholder="e.g. Delaware, US" value={shellData.jurisdiction} onChange={e => setShellData({...shellData, jurisdiction: e.target.value})} />
                            </div>
                         </div>
                      </div>
                   </section>
                 )}

                 {/* STEP 4: REASONING */}
                 {resolution && (
                   <section className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                      <div className="flex items-center gap-6">
                         <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black italic font-serif text-xl shadow-xl">03</div>
                         <div>
                            <h3 className="text-2xl font-black text-white italic font-serif uppercase tracking-tight">Operational Rationale</h3>
                            <p className="text-xs text-slate-500 font-medium italic">Provide the institutional justification for this decision.</p>
                         </div>
                      </div>
                      <textarea 
                        className="w-full bg-slate-950 border border-slate-800 rounded-[2.5rem] p-10 text-lg text-white font-medium italic font-serif outline-none focus:ring-4 focus:ring-blue-500/10 shadow-inner"
                        placeholder="Explain the logic behind this clearance decision..."
                        value={reasoning}
                        onChange={e => setReasoning(e.target.value)}
                        rows={5}
                      />
                   </section>
                 )}

                 {/* STEP 5: CONFIRMATION */}
                 {reasoning.length > 10 && (
                   <footer className="pt-10 border-t border-slate-800 animate-in fade-in duration-700">
                      <button 
                        onClick={handleCommitDecision}
                        disabled={committing}
                        className="w-full py-10 bg-blue-600 text-white rounded-[3rem] font-black uppercase text-sm tracking-[0.4em] shadow-3xl shadow-blue-600/40 flex items-center justify-center gap-6 hover:bg-blue-500 active:scale-95 transition-all"
                      >
                         {committing ? <Loader2 className="animate-spin" size={32} /> : <>Commit Registry Handshake <ArrowRight size={32} /></>}
                      </button>
                   </footer>
                 )}
              </div>
           </main>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-500 max-w-[1600px] mx-auto pb-40">
      
      {/* HUD HEADER */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-10 border-b border-slate-800 pb-16">
        <div className="space-y-6">
          <h1 className="text-8xl font-black flex items-center gap-10 text-white tracking-tighter uppercase italic font-serif leading-none">
            <Database className="text-blue-500" size={80} />
            Intake Queue
          </h1>
          <div className="flex items-center gap-6 text-slate-400 font-medium text-xl italic">
             <Landmark size={26} className="text-blue-500" /> Gateway Control — <span className="text-blue-500 font-black uppercase text-xs tracking-[0.4em] bg-blue-500/10 px-6 py-2 rounded-full border border-blue-500/20 shadow-2xl">Refinery Clearance Layer</span>
          </div>
        </div>
        <div className="flex bg-slate-900 border border-slate-800 rounded-[2.5rem] p-2 shadow-3xl">
           <button onClick={loadQueue} className="p-4 bg-slate-950 text-slate-500 hover:text-white transition-all border border-slate-800 rounded-[1.75rem]"><RefreshCw size={24} className={loading ? 'animate-spin' : ''} /></button>
        </div>
      </header>

      {/* QUEUE TABLE */}
      <div className="bg-slate-900 border border-slate-800 rounded-[4rem] overflow-hidden shadow-3xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-950/40 border-b border-slate-800 text-[11px] font-black text-slate-500 uppercase tracking-[0.5em]">
              <th className="px-12 py-10">Signal Target</th>
              <th className="px-10 py-10">Source Pulse</th>
              <th className="px-10 py-10 text-center">Confidence</th>
              <th className="px-10 py-10 text-center">Status</th>
              <th className="px-12 py-10 text-right">Execution</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40">
            {queue.map(item => (
              <tr 
                key={item.id} 
                onClick={() => setActiveItem(item)}
                className="hover:bg-blue-600/5 cursor-pointer transition-all group border-l-[6px] border-transparent hover:border-blue-500"
              >
                <td className="px-12 py-10">
                   <div className="flex items-center gap-8">
                      <div className="w-16 h-16 rounded-[1.25rem] bg-slate-800 border border-slate-700 flex items-center justify-center text-3xl font-black text-blue-500 italic font-serif shadow-inner group-hover:scale-110 transition-transform">
                        {item.suggested_entity_name[0]}
                      </div>
                      <div>
                         <p className="text-2xl font-black text-white italic font-serif leading-none mb-3 uppercase tracking-tight group-hover:text-blue-400 transition-colors">{item.suggested_entity_name}</p>
                         <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest italic">{item.suggested_entity_type} // SUGGESTED_NODE</p>
                      </div>
                   </div>
                </td>
                <td className="px-10 py-10">
                   <div className="flex items-center gap-4">
                      <span className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border italic ${
                        item.source_type === 'NEWS' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                        item.source_type === 'SALES' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                      }`}>
                        {item.source_type}
                      </span>
                      <p className="text-[11px] text-slate-500 font-medium italic truncate max-w-[150px]">{item.trigger_reference}</p>
                   </div>
                </td>
                <td className="px-10 py-10 text-center">
                   <div className="flex flex-col items-center gap-2">
                      <span className="text-xl font-black text-white italic font-serif">{(item.confidence_score * 100).toFixed(0)}%</span>
                      <div className="w-16 h-1 bg-slate-800 rounded-full overflow-hidden">
                         <div className="h-full bg-brand-primary" style={{ width: `${item.confidence_score * 100}%` }}></div>
                      </div>
                   </div>
                </td>
                <td className="px-10 py-10 text-center">
                   <span className="px-5 py-2 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] italic animate-pulse">PENDING_AUDIT</span>
                </td>
                <td className="px-12 py-10 text-right">
                   <button className="px-8 py-3.5 bg-slate-950 border border-slate-800 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:text-white hover:border-blue-500 transition-all flex items-center gap-3 ml-auto shadow-xl">
                      Begin Review <ArrowRight size={16} />
                   </button>
                </td>
              </tr>
            ))}
            {queue.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="py-60 text-center">
                   <div className="max-w-md mx-auto space-y-8 animate-in fade-in zoom-in-95">
                      <div className="w-24 h-24 bg-slate-950 rounded-[2.5rem] border border-slate-800 flex items-center justify-center text-slate-800 mx-auto shadow-inner">
                        <Layers size={54} />
                      </div>
                      <div className="space-y-3">
                         <h3 className="text-3xl font-black text-white italic font-serif uppercase tracking-tight leading-none">Intake Queue Clear.</h3>
                         <p className="text-lg text-slate-500 italic font-medium leading-relaxed">No institutional signals awaiting clearance at this horizon. All inbound protocols are synchronized.</p>
                      </div>
                      <button onClick={loadQueue} className="px-12 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-3xl hover:bg-blue-500 transition-all active:scale-95">Refresh Sweeper <RefreshCw size={18} className="ml-3 inline-block" /></button>
                   </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* FOOTER */}
      <footer className="fixed bottom-0 left-72 right-0 h-16 bg-slate-950/90 backdrop-blur-xl border-t border-slate-900 px-10 flex items-center justify-between z-[100]">
         <div className="flex items-center gap-10">
            <div className="flex items-center gap-3">
               <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
               <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">Intake Sweeper: Active</span>
            </div>
            <div className="flex items-center gap-3">
               <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
               <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">Clearinghouse State: Optimal</span>
            </div>
         </div>
         <p className="text-[9px] font-black text-slate-800 uppercase tracking-[0.4em] italic font-serif">AnnoNest Registry Intake — v1.0 CANON</p>
      </footer>

    </div>
  );
};

export default RegistryIntake;
