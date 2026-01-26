import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, Search, RefreshCw, Loader2, Landmark, Clock, History, 
  Target, Zap, Globe, ArrowUpRight, Fingerprint, 
  ExternalLink, ChevronRight, ArrowLeft, Building2, Sparkles, 
  CheckCircle2, MoreVertical, Database, ShieldAlert, Info, Check, 
  ChevronDown, Network, BarChart2, FileText, UserPlus, Shield, X, 
  ArrowRight, Briefcase, TrendingUp, UserCheck, AlertTriangle, 
  LayoutGrid, MapPin, Edit3, Fingerprint as FingerprintIcon, Save, 
  BarChart3, Eye, GitMerge, Trash2, Plus, UploadCloud, Download,
  PlusCircle, Phone, Globe2, StickyNote, Activity, User, Mail,
  Hash, Layers, ShieldCheck, Gavel
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { 
  UserProfile, Person, ContactLink, PersonInference, Entity, DropdownValue
} from '../types';
import { supabaseService } from '../services/supabaseService';

type ViewMode = 'DASHBOARD' | 'MATRIX';

const ContactIntelligence: React.FC<{ userProfile: UserProfile, userMap: Record<string, string> }> = ({ userProfile, userMap }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('DASHBOARD');
  const [loading, setLoading] = useState(true);
  const [registry, setRegistry] = useState<Person[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [stats, setStats] = useState<any>({});
  
  const [search, setSearch] = useState('');
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [persons, firms] = await Promise.all([
        supabaseService.fetchContactRegistry(userProfile.tenant_id),
        supabaseService.fetchEntities(userProfile.tenant_id)
      ]);
      setRegistry(persons || []);
      setEntities(firms || []);
      setStats({ 
        totalNodes: (persons || []).length,
        uniqueFirms: (firms || []).length, 
        completeness: 81.4 
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [userProfile.tenant_id]);

  const filteredRegistry = useMemo(() => {
    return registry.filter(p => {
      const matchSearch = (p.full_name || '').toLowerCase().includes(search.toLowerCase()) || 
                          (p.current_firm || '').toLowerCase().includes(search.toLowerCase());
      return matchSearch;
    });
  }, [registry, search]);

  if (loading && viewMode === 'DASHBOARD') return (
    <div className="h-full flex flex-col items-center justify-center gap-8 text-accent-primary animate-pulse">
       <Loader2 className="animate-spin" size={64} />
       <p className="text-[12px] font-black uppercase tracking-[0.8em]">Synchronizing Diaspora Plane...</p>
    </div>
  );

  return (
    <div className="space-y-12 max-w-[1600px] mx-auto pb-40 text-text-primary dark:text-white relative animate-in fade-in duration-700">
      
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-10 border-b border-slate-800 pb-16">
        <div className="space-y-6">
          <h1 className="text-8xl font-black flex items-center gap-10 tracking-tighter uppercase italic font-serif leading-none text-white">
            <Users className="text-accent-primary shrink-0" size={80} />
            Diaspora
          </h1>
          <p className="text-text-secondary font-medium text-xl italic flex items-center gap-4">
             <UserCheck size={26} className="text-accent-primary" /> Identity Intelligence — <span className="text-accent-primary font-black uppercase text-xs tracking-[0.4em] bg-accent-primary/10 px-6 py-2 rounded-full border border-accent-primary/20 shadow-blue italic">Personnel Master Matrix</span>
          </p>
        </div>

        <div className="flex bg-card-panel dark:bg-[#0f172a] border border-border-ui dark:border-slate-800 rounded-[3rem] p-2 shadow-3xl">
          <button onClick={() => setViewMode('DASHBOARD')} className={`px-12 py-4 rounded-[2rem] text-[11px] font-black uppercase tracking-widest transition-all ${viewMode === 'DASHBOARD' ? 'bg-accent-primary text-white shadow-blue' : 'text-text-secondary hover:text-text-primary'}`}>Identity Pulse</button>
          <button onClick={() => setViewMode('MATRIX')} className={`px-12 py-4 rounded-[2rem] text-[11px] font-black uppercase tracking-widest transition-all ${viewMode === 'MATRIX' ? 'bg-accent-primary text-white shadow-blue' : 'text-text-secondary hover:text-text-primary'}`}>Execution Matrix</button>
        </div>
      </header>

      {viewMode === 'DASHBOARD' ? (
        <PeopleDashboard stats={stats} />
      ) : (
        <div className="space-y-10 animate-in slide-in-from-bottom-8 duration-500">
           <div className="bg-card-panel border border-border-ui rounded-[4rem] overflow-hidden shadow-4xl flex flex-col min-h-[800px]">
              <header className="p-10 border-b border-border-ui flex flex-wrap gap-8 items-center bg-slate-950/20">
                 <div className="relative flex-1 group min-w-[400px]">
                    <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-accent-primary transition-colors" size={24} />
                    <input 
                      type="text" 
                      placeholder="Identify individual or firm handshake..." 
                      className="w-full bg-slate-950 border border-slate-800 rounded-3xl pl-20 pr-8 py-5 text-xl text-text-primary outline-none focus:ring-4 focus:ring-accent-primary/10 transition-all font-serif italic"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                    />
                 </div>
                 <button onClick={loadData} className="p-4 bg-slate-950 border border-slate-800 text-slate-500 rounded-2xl hover:text-white transition-all shadow-inner"><RefreshCw size={24} className={loading ? 'animate-spin' : ''}/></button>
              </header>

              <div className="flex-1 overflow-x-auto custom-scrollbar">
                 <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-950/60 border-b border-slate-800 sticky top-0 z-10">
                       <tr className="text-[11px] font-black text-slate-500 uppercase tracking-[0.5em]">
                          <th className="px-12 py-10">Identity Node</th>
                          <th className="px-10 py-10">Institutional Anchor</th>
                          <th className="px-10 py-10 text-center">Data Recency</th>
                          <th className="px-10 py-10 text-center">Confidence</th>
                          <th className="px-12 py-10 text-right">Execution</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                       {filteredRegistry.map(person => (
                          <tr key={person.id} onClick={() => setSelectedPersonId(person.id)} className="hover:bg-accent-primary/[0.02] transition-all group border-l-[6px] border-transparent hover:border-accent-primary cursor-pointer">
                             <td className="px-12 py-8">
                                <div className="flex items-center gap-8">
                                   <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-2xl font-black text-accent-primary italic font-serif shadow-inner group-hover:scale-110 transition-transform">
                                      {(person.full_name || 'U')[0]}
                                   </div>
                                   <div>
                                      <p className="text-xl font-black text-text-primary dark:text-white italic font-serif leading-none mb-1.5 uppercase tracking-tight group-hover:text-accent-primary transition-colors">{person.full_name}</p>
                                      <p className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">{person.current_title || 'INDEPENDENT_NODE'}</p>
                                   </div>
                                </div>
                             </td>
                             <td className="px-10 py-8">
                                <div className="flex items-center gap-3">
                                   <Landmark size={14} className="text-slate-700" />
                                   <span className="text-[11px] font-black text-slate-400 uppercase italic tracking-tight">{person.current_firm || 'Global Search'}</span>
                                </div>
                             </td>
                             <td className="px-10 py-8 text-center">
                                <p className="text-sm font-black text-slate-300 italic font-serif">{person.last_seen ? new Date(person.last_seen).toLocaleDateString() : 'PR_READY'}</p>
                             </td>
                             <td className="px-10 py-8 text-center">
                                <span className={`text-xl font-black italic font-serif ${person.confidence_score > 80 ? 'text-emerald-500' : 'text-amber-500'}`}>{person.confidence_score}%</span>
                             </td>
                             <td className="px-12 py-8 text-right">
                                <button className="px-8 py-3 bg-accent-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-blue hover:brightness-110 active:scale-95 transition-all flex items-center gap-2">
                                   <Eye size={14}/> View Node
                                </button>
                             </td>
                          </tr>
                       ))}
                       {filteredRegistry.length === 0 && !loading && (
                         <tr><td colSpan={5} className="py-60 text-center opacity-30 italic font-serif text-3xl uppercase tracking-tighter">Zero identities found in spectrum.</td></tr>
                       )}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>
      )}

      {selectedPersonId && (
        <PersonnelWindow 
          personId={selectedPersonId} 
          userProfile={userProfile}
          onClose={() => setSelectedPersonId(null)} 
        />
      )}
    </div>
  );
};

// --- PERSONNEL WINDOW OVERLAY - STRICT 10/80/10 FORENSIC SPLIT ---

interface PersonnelWindowProps {
  personId: string;
  userProfile: UserProfile;
  onClose: () => void;
}

const PersonnelWindow: React.FC<PersonnelWindowProps> = ({ personId, userProfile, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [person, setPerson] = useState<Person | null>(null);
  const [links, setLinks] = useState<ContactLink[]>([]);
  const [intelligence, setIntelligence] = useState<PersonInference[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [rationale, setRationale] = useState('');
  
  // Controlled Dropdowns Data
  const [dropdowns, setDropdowns] = useState<Record<string, DropdownValue[]>>({});

  const loadDeepData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Authoritative Datasets (Strict Section 1-7 Mapping)
      // CORRECTED PROTOCOL: Using 'contact' as the dataset key for all fields
      const [p, l, i, dd_gender, dd_priority, dd_status, dd_type, dd_dept, dd_role, dd_asset, dd_sales] = await Promise.all([
        supabaseService.fetchPersonProfile(personId), // Section 1-3: entities_contacts
        supabaseService.fetchPersonRoleHistory(personId), // Section 7: all entities_contact_links rows
        supabaseService.fetchPersonInferenceProvenance(personId), // Right 10%: inferences
        // Dropdown Wiring (Strict per corrected 'contact' dataset key)
        supabaseService.fetchDropdownValues(userProfile.tenant_id, 'contact', 'gender'),
        supabaseService.fetchDropdownValues(userProfile.tenant_id, 'contact', 'contact_priority'),
        supabaseService.fetchDropdownValues(userProfile.tenant_id, 'contact', 'verification_status'),
        supabaseService.fetchDropdownValues(userProfile.tenant_id, 'contact', 'entity_type'),
        supabaseService.fetchDropdownValues(userProfile.tenant_id, 'contact', 'department'),
        supabaseService.fetchDropdownValues(userProfile.tenant_id, 'contact', 'role_title'),
        supabaseService.fetchDropdownValues(userProfile.tenant_id, 'contact', 'asset_classes'),
        supabaseService.fetchDropdownValues(userProfile.tenant_id, 'contact', 'sales_override_status')
      ]);

      setPerson(p);
      setLinks(l || []);
      setIntelligence(i || []);
      setDropdowns({
        gender: dd_gender,
        priority: dd_priority,
        status: dd_status,
        entity_type: dd_type,
        department: dd_dept,
        role: dd_role,
        asset: dd_asset,
        sales: dd_sales
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDeepData(); }, [personId]);

  const handleCommitMutation = async () => {
    if (!rationale) return alert("Rationale entry is mandatory for identity mutations.");
    setIsEditing(false);
    setRationale('');
    loadDeepData();
  };

  if (loading || !person) return (
    <div className="fixed inset-0 z-[1000] bg-slate-950 flex flex-col items-center justify-center gap-8">
       <Loader2 className="animate-spin text-accent-primary" size={64} />
       <p className="text-[12px] font-black uppercase tracking-[0.6em] animate-pulse">Syncing Personnel Node...</p>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[1000] bg-slate-950 flex animate-in fade-in duration-300">
      
      {/* 10% SPLIT (LEFT): LINEAGE AUDIT (Section 7) */}
      <aside className="w-[10%] border-r border-slate-800 bg-app-bg flex flex-col p-8 gap-10 overflow-y-auto custom-scrollbar shrink-0">
         <h4 className="text-[9px] font-black text-text-muted uppercase tracking-[0.3em] flex items-center gap-3 border-b border-slate-900 pb-6 shrink-0"><History size={14}/> Lineage Audit</h4>
         <div className="space-y-8">
            {links.map((link) => (
              <div key={link.id} className="space-y-2 opacity-60 hover:opacity-100 transition-opacity group cursor-default">
                 <div className="flex items-center gap-2"><div className={`w-1.5 h-1.5 rounded-full ${link.is_active ? 'bg-accent-primary shadow-blue' : 'bg-slate-700'}`}></div><span className="text-[8px] font-mono text-slate-500 uppercase tracking-tighter">{link.start_date ? new Date(link.start_date).getFullYear() : 'PR'}</span></div>
                 <p className="text-[10px] font-black text-white italic uppercase leading-tight group-hover:text-accent-primary">{link.role_title}</p>
                 <p className="text-[8px] font-mono text-slate-700 uppercase">{link.entity_type}</p>
                 {link.is_primary_contact && <span className="text-[7px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-1 py-0.5 rounded border border-emerald-500/20">Primary</span>}
              </div>
            ))}
            {links.length === 0 && <p className="text-[9px] text-slate-700 uppercase italic">Zero lineage signals.</p>}
         </div>
      </aside>

      {/* 80% SPLIT (CENTER): CANONICAL MATRIX (Section 1-6) */}
      <main className="flex-1 flex flex-col bg-card-panel overflow-hidden border-x border-slate-800 shadow-4xl">
         <header className="h-28 border-b border-slate-800 flex items-center justify-between px-16 bg-slate-950/40 backdrop-blur-md shrink-0">
            <div className="flex items-center gap-10">
               <button onClick={onClose} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-slate-500 hover:text-white transition-all shadow-xl active:scale-95"><X size={28}/></button>
               <div>
                  <div className="flex items-center gap-4 mb-2">
                     <span className="text-[9px] font-black text-accent-primary uppercase tracking-[0.4em] bg-accent-primary/10 px-3 py-1 rounded-lg border border-accent-primary/20 italic">Personnel Matrix Node</span>
                     <span className="text-[9px] font-mono text-slate-600 uppercase">SHA: {personId.toUpperCase().slice(0, 16)}</span>
                  </div>
                  <h2 className="text-4xl font-black text-text-primary italic font-serif uppercase tracking-tight leading-none">{person.full_name}</h2>
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
            <div className="max-w-[1200px] mx-auto space-y-24">
               
               {/* SECTION 1: PERSONAL DETAILS (entities_contacts) */}
               <section className="space-y-10">
                  <h3 className="text-[12px] font-black text-text-secondary uppercase tracking-[0.6em] flex items-center gap-4 border-b border-slate-800 pb-6 italic tracking-wider"><User size={18} className="text-accent-primary"/> Primary Signature Details (Section 1)</h3>
                  <div className="grid grid-cols-3 gap-10">
                     {[
                       { label: 'First Name', val: person.first_name, key: 'first_name', icon: User },
                       { label: 'Last Name', val: person.last_name, key: 'last_name', icon: User },
                       { label: 'Identity Email', val: person.email, key: 'email', icon: Mail },
                       { label: 'Phone Sequence', val: person.phone_number, key: 'phone_number', icon: Phone },
                       { label: 'Ext', val: person.phone_extension, key: 'phone_extension', icon: Hash },
                       { label: 'LinkedIn Trace', val: person.linkedin_url, key: 'linkedin_url', icon: Globe2 },
                       { label: 'Gender', val: person.gender, key: 'gender', icon: Activity, dropdown: 'gender' }
                     ].map((f, i) => (
                       <div key={i} className="space-y-4 group">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4 block group-hover:text-accent-primary transition-colors">{f.label}</label>
                          {isEditing && f.dropdown ? (
                             <select className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-8 py-5 text-xl text-white font-black italic font-serif outline-none appearance-none cursor-pointer">
                                {dropdowns[f.dropdown]?.map(d => <option key={d.id} value={d.value}>{d.label}</option>)}
                             </select>
                          ) : isEditing ? (
                             <input className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-8 py-5 text-xl text-white font-black italic font-serif outline-none focus:ring-4 focus:ring-accent-primary/10 transition-all shadow-inner" defaultValue={f.val} />
                          ) : (
                             <div className="p-8 bg-slate-900/40 border border-slate-800/40 rounded-[2.5rem] shadow-inner group-hover:border-accent-primary/20 transition-all flex items-center gap-6 relative overflow-hidden">
                                <f.icon size={20} className="text-slate-700 group-hover:text-accent-primary transition-colors" />
                                <p className="text-2xl font-black text-white italic font-serif uppercase tracking-tight leading-none truncate select-all">{f.val || 'NODE_EMPTY'}</p>
                             </div>
                          )}
                       </div>
                    ))}
                  </div>
               </section>

               {/* SECTION 2 & 3: STATUS & ANCHOR (entities_contacts) */}
               <section className="grid grid-cols-2 gap-20">
                  <div className="space-y-10">
                     <h3 className="text-[12px] font-black text-text-secondary uppercase tracking-[0.6em] flex items-center gap-4 border-b border-slate-800 pb-6 italic tracking-wider"><Target size={18} className="text-accent-primary"/> Operational Status (Section 2)</h3>
                     <div className="grid grid-cols-1 gap-8">
                        {[
                          { label: 'Priority Matrix', val: person.contact_priority, dropdown: 'priority' },
                          { label: 'Verification State', val: person.verification_status, dropdown: 'status' }
                        ].map((f, i) => (
                           <div key={i} className="space-y-4 group">
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4 block group-hover:text-accent-primary transition-colors">{f.label}</label>
                              <div className="p-8 bg-slate-950 border border-slate-800 rounded-[2.5rem] shadow-inner flex items-center justify-between group-hover:border-accent-primary/20 transition-all">
                                 <p className="text-2xl font-black text-white italic font-serif uppercase tracking-tight">{f.val || 'PENDING'}</p>
                                 <ChevronRight size={24} className="text-slate-800" />
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
                  <div className="space-y-10">
                     <h3 className="text-[12px] font-black text-text-secondary uppercase tracking-[0.6em] flex items-center gap-4 border-b border-slate-800 pb-6 italic tracking-wider"><Building2 size={18} className="text-accent-primary"/> Institutional Anchor (Section 3)</h3>
                     <div className="p-10 bg-slate-950 border border-slate-800 rounded-[3rem] shadow-2xl relative overflow-hidden group hover:border-accent-primary transition-all">
                        <div className="absolute top-0 right-0 p-10 opacity-5 text-accent-primary group-hover:scale-110 transition-transform"><Landmark size={180}/></div>
                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-6 italic">Registry Linkage (entities_contacts.firm_id)</p>
                        <h4 className="text-4xl font-black text-white italic font-serif uppercase tracking-tight leading-none mb-4">{person.current_firm || 'Independent Node'}</h4>
                        <div className="flex items-center gap-4">
                           <span className="text-[9px] font-mono text-slate-500 uppercase">UUID: {person.firm_id || 'NULL_NODE'}</span>
                           <button className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-600 hover:text-white transition-all shadow-inner"><ExternalLink size={14}/></button>
                        </div>
                     </div>
                  </div>
               </section>

               {/* SECTION 4-6: RELATIONSHIP ATTRIBUTES (Active Primary Link from entities_contact_links) */}
               {links.find(l => l.is_active) && (
                  <section className="space-y-10">
                     <h3 className="text-[12px] font-black text-text-secondary uppercase tracking-[0.6em] flex items-center gap-4 border-b border-slate-800 pb-6 italic tracking-wider"><GitMerge size={18} className="text-accent-primary"/> Employment & Coverage (Section 4-6)</h3>
                     <div className="grid grid-cols-3 gap-10">
                        {[
                           { label: 'Functional Role', val: links.find(l => l.is_active)?.role_title, icon: Briefcase },
                           { label: 'Department Node', val: links.find(l => l.is_active)?.department, icon: LayoutGrid },
                           { label: 'Asset Clusters', val: links.find(l => l.is_active)?.asset_classes?.join(', '), icon: Layers },
                           { label: 'Decision Logic', val: links.find(l => l.is_active)?.decision_maker ? 'TRUE' : 'FALSE', icon: Target },
                           { label: 'Signatory Authority', val: links.find(l => l.is_active)?.signatory ? 'TRUE' : 'FALSE', icon: Gavel },
                           { label: 'Link Source', val: links.find(l => l.is_active)?.link_source, icon: Globe2 },
                           { label: 'Link Confidence', val: `${links.find(l => l.is_active)?.link_confidence_score}%`, icon: ShieldCheck }
                        ].map((f, i) => (
                           <div key={i} className="space-y-4 group">
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4 block group-hover:text-accent-primary transition-colors">{f.label}</label>
                              <div className="p-8 bg-slate-900/40 border border-slate-800/40 rounded-[2.5rem] shadow-inner group-hover:border-accent-primary/20 transition-all flex items-center gap-6">
                                 <f.icon size={20} className="text-slate-700 group-hover:text-accent-primary transition-colors" />
                                 <p className="text-xl font-black text-white italic font-serif uppercase tracking-tight leading-none truncate">{f.val || 'N/A'}</p>
                              </div>
                           </div>
                        ))}
                     </div>
                  </section>
               )}
            </div>
         </div>
      </main>

      {/* 10% SPLIT (RIGHT): CONTACT INTELLIGENCE (Inferences) */}
      <aside className="w-[10%] border-l border-slate-800 bg-app-bg flex flex-col p-8 gap-10 overflow-y-auto custom-scrollbar shrink-0">
         <h4 className="text-[9px] font-black text-text-muted uppercase tracking-[0.3em] flex items-center gap-3 border-b border-slate-900 pb-6 shrink-0"><Sparkles size={14}/> Intelligence</h4>
         <div className="space-y-10">
            {intelligence.map((intel) => (
              <div key={intel.id} className="space-y-4 group cursor-default">
                 <div className="flex justify-between items-center"><span className="text-[8px] font-black text-accent-primary uppercase tracking-widest italic">Signal Pulse</span><div className="w-1.5 h-1.5 rounded-full bg-accent-primary animate-pulse shadow-blue"></div></div>
                 <p className="text-[11px] font-black text-white italic font-serif leading-snug uppercase tracking-tight group-hover:text-accent-primary transition-colors select-all">"{intel.insight}"</p>
              </div>
            ))}
            {intelligence.length === 0 && <p className="text-[9px] text-slate-700 uppercase italic">Zero active signals.</p>}
         </div>
      </aside>
    </div>
  );
};

const PeopleDashboard = ({ stats }: any) => {
  return (
    <div className="space-y-16 animate-in slide-in-from-bottom-8 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {[
          { label: 'Identified Nodes', val: stats.totalNodes || '0', icon: Users, color: '#0052FF' },
          { label: 'Firm Coverage', val: stats.uniqueFirms || '0', icon: Building2, color: '#00E676' },
          { label: 'Isolation Delta', val: '412', icon: ShieldAlert, color: '#FF0055', sub: 'Nodes with zero edges' },
          { label: 'Matrix Completion', val: `${stats.completeness}%`, icon: UserCheck, color: '#6366F1' },
        ].map((s, i) => (
          <div key={i} className="bg-card-panel border border-slate-800 p-10 rounded-[3.5rem] shadow-xl relative overflow-hidden group">
            <div className={`absolute -right-4 -top-4 opacity-5 group-hover:scale-110 transition-transform`} style={{ color: s.color }}><s.icon size={140} /></div>
            <p className="text-[11px] font-black text-text-muted uppercase tracking-[0.4em] mb-6">{s.label}</p>
            <p className="text-6xl font-black text-text-primary dark:text-white italic font-serif leading-none tracking-tighter">{s.val}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 bg-card-panel border border-slate-800 rounded-[4rem] p-12 shadow-2xl h-[500px]">
           <h3 className="text-[12px] font-black text-text-secondary uppercase tracking-[0.6em] mb-12 flex items-center gap-4"><TrendingUp size={18} className="text-accent-primary"/> Career Transition Velocity</h3>
           <ResponsiveContainer width="100%" height="80%">
             <BarChart data={[{name:'2021',v:40},{name:'2022',v:120},{name:'2023',v:240},{name:'2024',v:510}]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1C2A44" vertical={false} />
                <XAxis dataKey="name" stroke="#64748B" fontSize={10} fontWeight="900" axisLine={false} />
                <YAxis stroke="#64748B" fontSize={10} axisLine={false} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#0C121D', border: '1px solid #1E293B' }} />
                <Bar dataKey="v" fill="#0052FF" radius={[10, 10, 0, 0]} />
             </BarChart>
           </ResponsiveContainer>
        </div>
        <div className="lg:col-span-4 bg-card-panel border border-slate-800 rounded-[4rem] p-10 shadow-2xl flex flex-col">
           <h3 className="text-[12px] font-black text-text-secondary uppercase tracking-[0.6em] mb-10 flex items-center gap-4"><BarChart3 size={18} className="text-accent-primary"/> Classification Density</h3>
           <div className="space-y-6 flex-1">
              {[
                { name: 'C-Suite', val: 84, color: '#3B82F6' },
                { name: 'Managers', val: 62, color: '#10B981' },
                { name: 'Associates', val: 91, color: '#6366F1' },
                { name: 'Analysts', val: 45, color: '#F59E0B' },
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

export default ContactIntelligence;