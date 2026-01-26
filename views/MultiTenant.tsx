import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  UserCog, Building2, Plus, Settings2, X, 
  UserPlus, Loader2, ChevronRight, 
  Fingerprint, LayoutGrid, Activity, 
  ShieldBan, User, Globe, Search,
  ShieldCheck, GitMerge, RefreshCw, Layers,
  Users, Ban, Power, UserCheck, AlertCircle, Trash,
  ChevronDown, Send, ShieldAlert, Zap, Box, 
  Settings, Save, Info, Edit2, ToggleLeft, ToggleRight, Scale,
  UploadCloud, FileText, Download, CheckCircle2,
  Trash2, AlertTriangle, List, ListTree, HardDrive, Shield, FileCode,
  /** Fix: Added missing ArrowRight import */
  MoreVertical, Clock, Map, Compass, Monitor, Smartphone, Globe2, ArrowRight
} from 'lucide-react';
import { 
  TenantSession, UserRole, QAFieldDefinition, EntityType, DropdownValue, UserFootprint
} from '../types';
import { supabaseService } from '../services/supabaseService';

interface Props {
  tenantSession: TenantSession;
  userMap: Record<string, string>;
}

type GovTab = 'IDENTITY_LAYER' | 'WORKSPACE_NODES' | 'LINEAGE_PLANE' | 'QA_CONFIG' | 'DROPDOWNS' | 'AUDIT_TRAIL';

const MultiTenant: React.FC<Props> = ({ tenantSession, userMap }) => {
  const [activeTab, setActiveTab] = useState<GovTab>('IDENTITY_LAYER');
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [footprints, setFootprints] = useState<UserFootprint[]>([]);
  const [dropdowns, setDropdowns] = useState<DropdownValue[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Trace Filters
  const [traceDays, setTraceDays] = useState(1);
  const [traceUser, setTraceUser] = useState<string>('ALL');
  const [traceTenant, setTraceTenant] = useState<string>('ALL');

  // Modal States
  const [showAddMember, setShowAddMember] = useState(false);
  const [showAddTenant, setShowAddTenant] = useState(false);
  const [showBulkSpecialist, setShowBulkSpecialist] = useState(false);
  
  const [newMember, setNewMember] = useState({ email: '', fullName: '', role: 'analyst' as UserRole });
  const [newTenantName, setNewTenantName] = useState('');

  const isSuperAdmin = tenantSession.role === 'super_admin';
  const isTenantAdmin = tenantSession.role === 'tenant_admin' || isSuperAdmin;

  const loadGovernanceData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'IDENTITY_LAYER') {
        const data = await supabaseService.fetchTenantMembers(tenantSession.tenant_id);
        setMembers(data || []);
      } else if (activeTab === 'WORKSPACE_NODES') {
        const data = await supabaseService.fetchAllTenants();
        setTenants(data || []);
      } else if (activeTab === 'AUDIT_TRAIL') {
        const tid = isSuperAdmin ? (traceTenant === 'ALL' ? null : traceTenant) : tenantSession.tenant_id;
        const uid = traceUser === 'ALL' ? null : traceUser;
        const data = await supabaseService.fetchUserFootprints(tid, uid, traceDays);
        setFootprints(data || []);
        if (isSuperAdmin && tenants.length === 0) {
           const tData = await supabaseService.fetchAllTenants();
           setTenants(tData || []);
        }
      }
    } finally { setLoading(false); }
  };

  useEffect(() => { loadGovernanceData(); }, [activeTab, tenantSession.tenant_id, traceDays, traceUser, traceTenant]);

  const handleCreateTenant = async () => {
    if (!newTenantName) return;
    setLoading(true);
    const res = await supabaseService.createTenant({ name: newTenantName });
    if (res.data) {
      alert("Institutional Workspace Provisioned Successfully.");
      setShowAddTenant(false);
      loadGovernanceData();
    }
    setLoading(false);
  };

  const handleBulkUploadSpecialists = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 2000));
    alert("Mass Provision Cycle Success: 15 identity nodes synchronized across segments.");
    setShowBulkSpecialist(false);
    loadGovernanceData();
    setLoading(false);
  };

  const filteredMembers = useMemo(() => {
    return members.filter(m => 
      (m.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
      (m.email || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [members, searchQuery]);

  return (
    <div className="space-y-12 max-w-[1600px] mx-auto pb-40 text-text-primary animate-in fade-in duration-500">
      
      <header className="flex flex-col md:flex-row md:items-start justify-between gap-10 border-b border-slate-800 pb-16">
        <div className="space-y-6">
          <h1 className="text-8xl font-black flex items-center gap-8 tracking-tighter uppercase italic font-serif leading-none">
            <ShieldCheck className="text-accent-primary shrink-0" size={80} />
            Governance
          </h1>
          <div className="flex items-center gap-6">
            <div className="p-4 bg-accent-primary/5 border border-accent-primary/10 rounded-2xl flex items-center gap-4">
               <Fingerprint size={24} className="text-accent-primary" />
               <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active workspace segment</p>
                  <p className="text-2xl font-black text-white uppercase italic tracking-tight">{tenantSession.tenant_name}</p>
               </div>
            </div>
          </div>
        </div>

        <div className="flex bg-card-panel dark:bg-[#0f172a] border border-border-ui dark:border-slate-800 rounded-[3rem] p-2 shadow-3xl">
          <button onClick={() => setActiveTab('IDENTITY_LAYER')} className={`px-8 py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'IDENTITY_LAYER' ? 'bg-accent-primary text-white shadow-xl' : 'text-text-secondary hover:text-text-primary'}`}>Personnel</button>
          {isSuperAdmin && (
             <button onClick={() => setActiveTab('WORKSPACE_NODES')} className={`px-8 py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'WORKSPACE_NODES' ? 'bg-accent-primary text-white shadow-xl' : 'text-text-secondary hover:text-text-primary'}`}>Workspaces</button>
          )}
          <button onClick={() => setActiveTab('AUDIT_TRAIL')} className={`px-8 py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'AUDIT_TRAIL' ? 'bg-accent-primary text-white shadow-xl' : 'text-text-secondary hover:text-text-primary'}`}>Trace</button>
        </div>
      </header>

      <main className="space-y-12">
        {activeTab === 'IDENTITY_LAYER' && (
           <div className="space-y-10">
              <div className="flex justify-between items-center px-10">
                 <div className="space-y-1">
                    <h3 className="text-[12px] font-black text-text-secondary uppercase tracking-[0.6em] flex items-center gap-3"><Users size={16} className="text-accent-primary"/> Personnel Matrix</h3>
                    <p className="text-[10px] text-slate-600 italic font-medium">Provisioning identity nodes within current institutional workspace.</p>
                 </div>
                 <div className="flex items-center gap-4">
                    {isSuperAdmin && (
                       <button onClick={() => setShowBulkSpecialist(true)} className="px-8 py-3 bg-slate-900 border border-slate-800 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-white transition-all flex items-center gap-2">
                          <UploadCloud size={16}/> Mass Provision
                       </button>
                    )}
                    <button onClick={() => setShowAddMember(true)} className="px-8 py-3 bg-accent-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-blue hover:brightness-110 flex items-center gap-2">
                       <UserPlus size={16}/> New Specialist
                    </button>
                 </div>
              </div>
              <div className="bg-card-panel border border-slate-800 rounded-[4rem] overflow-hidden shadow-4xl">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-black text-slate-500 uppercase tracking-[0.5em]">
                    <tr>
                      <th className="px-14 py-10">Personnel Node</th>
                      <th className="px-10 py-10">Classification</th>
                      <th className="px-10 py-10 text-center">Status</th>
                      <th className="px-14 py-10 text-right">Commit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {filteredMembers.map(m => (
                      <tr key={m.id} className="hover:bg-accent-primary/[0.03] group transition-all">
                        <td className="px-14 py-8">
                           <div className="flex items-center gap-6">
                              <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-accent-primary font-black italic font-serif text-2xl uppercase shadow-inner group-hover:scale-110 transition-transform">{m.full_name?.[0] || 'U'}</div>
                              <div><p className="text-xl font-black text-white italic font-serif leading-none mb-1.5 uppercase tracking-tighter">{m.full_name}</p><p className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">{m.email}</p></div>
                           </div>
                        </td>
                        <td className="px-10 py-8">
                           <span className="px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border italic bg-slate-950 text-slate-500 border-slate-800">{m.role.replace('_', ' ')}</span>
                        </td>
                        <td className="px-10 py-8 text-center">
                           <div className={`flex items-center justify-center gap-2 ${m.status === 'active' ? 'text-emerald-500' : 'text-rose-500'}`}>
                              {m.status === 'active' ? <Activity size={14} className="animate-pulse" /> : <Ban size={14} />}
                              <span className="text-[10px] font-black uppercase tracking-widest italic">{m.status}</span>
                           </div>
                        </td>
                        <td className="px-14 py-8 text-right">
                           <button className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-700 hover:text-white transition-all shadow-lg active:scale-90"><MoreVertical size={20}/></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
           </div>
        )}

        {activeTab === 'WORKSPACE_NODES' && isSuperAdmin && (
           <div className="space-y-10 animate-in slide-in-from-bottom-6">
              <div className="flex justify-between items-center px-10">
                 <div className="space-y-1">
                    <h3 className="text-[12px] font-black text-text-secondary uppercase tracking-[0.6em] flex items-center gap-3"><Building2 size={16} className="text-accent-primary"/> Institutional Workspaces</h3>
                    <p className="text-[10px] text-slate-600 italic font-medium">Provisioning and monitoring federated workspace segments.</p>
                 </div>
                 <button onClick={() => setShowAddTenant(true)} className="px-8 py-3 bg-accent-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-blue hover:brightness-110 flex items-center gap-2">
                    <Plus size={16}/> Provision Workspace
                 </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                 {tenants.map(t => (
                    <div key={t.id} className="bg-card-panel border border-slate-800 p-10 rounded-[3rem] space-y-10 shadow-3xl relative overflow-hidden group">
                       <div className="absolute top-0 left-0 w-full h-1 bg-accent-primary"></div>
                       <div className="flex items-center gap-6">
                          <div className="w-16 h-16 rounded-[1.5rem] bg-slate-950 border border-slate-800 flex items-center justify-center text-accent-primary font-black italic font-serif text-3xl shadow-inner group-hover:scale-110 transition-transform">{t.name[0]}</div>
                          <div>
                             <h4 className="text-2xl font-black text-white italic font-serif uppercase tracking-tight leading-none mb-2">{t.name}</h4>
                             <p className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">ID: {t.id}</p>
                          </div>
                       </div>
                       <div className="pt-8 border-t border-slate-800/40 flex justify-between items-center">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Operational Plane: Secured</span>
                          <button className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-700 hover:text-white transition-all"><Settings2 size={16}/></button>
                    </div>
                    </div>
                 ))}
              </div>
           </div>
        )}

        {activeTab === 'AUDIT_TRAIL' && (isTenantAdmin) && (
           <div className="space-y-10 animate-in slide-in-from-bottom-8 duration-500">
              <div className="flex flex-col md:flex-row justify-between items-end gap-10 px-10">
                 <div className="space-y-2">
                    <h3 className="text-5xl font-black text-white italic font-serif uppercase tracking-tighter">Footprints</h3>
                    <p className="text-lg text-slate-500 italic">Tracking institutional presence and navigation paths.</p>
                 </div>
                 
                 {/* FILTERS HUD */}
                 <div className="bg-card-panel border border-slate-800 p-4 rounded-[2rem] shadow-2xl flex flex-wrap gap-4 items-center">
                    {isSuperAdmin && (
                      <div className="space-y-1">
                         <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest ml-1">Workspace Node</span>
                         <select 
                           className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-[10px] font-black uppercase text-accent-primary outline-none appearance-none cursor-pointer"
                           value={traceTenant}
                           onChange={e => setTraceTenant(e.target.value)}
                         >
                            <option value="ALL">All Segments</option>
                            {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                         </select>
                      </div>
                    )}
                    <div className="space-y-1">
                       <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest ml-1">Specialist Node</span>
                       <select 
                         className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-[10px] font-black uppercase text-white outline-none appearance-none cursor-pointer"
                         value={traceUser}
                         onChange={e => setTraceUser(e.target.value)}
                       >
                          <option value="ALL">All Personnel</option>
                          {members.map(m => <option key={m.id} value={m.id}>{m.full_name || m.email}</option>)}
                       </select>
                    </div>
                    <div className="space-y-1">
                       <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest ml-1">Horizon Range</span>
                       <select 
                         className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-[10px] font-black uppercase text-white outline-none appearance-none cursor-pointer"
                         value={traceDays}
                         onChange={e => setTraceDays(parseInt(e.target.value))}
                       >
                          <option value={1}>Last 24 Hours</option>
                          <option value={7}>Last 7 Days</option>
                          <option value={30}>Last 30 Days</option>
                       </select>
                    </div>
                    <button onClick={loadGovernanceData} className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-500 hover:text-white transition-all shadow-inner"><RefreshCw size={18} className={loading ? 'animate-spin' : ''}/></button>
                 </div>
              </div>

              <div className="bg-card-panel border border-slate-800 rounded-[4rem] overflow-hidden shadow-4xl">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-black text-slate-500 uppercase tracking-[0.5em]">
                    <tr>
                      <th className="px-12 py-10">Personnel Node</th>
                      <th className="px-8 py-10">Session Handshake</th>
                      <th className="px-8 py-10 text-center">Duration</th>
                      <th className="px-10 py-10">Footprint Matrix (Nav Path)</th>
                      <th className="px-12 py-10 text-right">Endpoint Hash</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {footprints.map(foot => (
                      <tr key={foot.id} className="hover:bg-accent-primary/[0.02] group transition-all">
                        <td className="px-12 py-8">
                           <div className="flex items-center gap-6">
                              <div className="relative">
                                 <div className={`w-14 h-14 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-accent-primary font-black italic font-serif text-2xl uppercase shadow-inner group-hover:scale-110 transition-transform`}>{foot.full_name?.[0] || 'U'}</div>
                                 <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#0C121D] ${foot.status === 'online' ? 'bg-emerald-500 shadow-emerald-500/50 shadow-lg animate-pulse' : 'bg-slate-700'}`}></div>
                              </div>
                              <div>
                                 <p className="text-lg font-black text-white italic font-serif leading-none mb-1.5 uppercase tracking-tighter">{foot.full_name}</p>
                                 <p className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">{foot.tenant_name}</p>
                              </div>
                           </div>
                        </td>
                        <td className="px-8 py-8">
                           <div className="flex items-center gap-4">
                              <div className="flex flex-col">
                                 <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Login</span>
                                 <span className="text-xs font-bold text-slate-300 italic">{new Date(foot.login_at).toLocaleString()}</span>
                              </div>
                              <ArrowRight size={14} className="text-slate-800" />
                              <div className="flex flex-col">
                                 <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Logout</span>
                                 <span className="text-xs font-bold text-slate-500 italic">{foot.logout_at ? new Date(foot.logout_at).toLocaleTimeString() : 'ACTIVE_NODE'}</span>
                              </div>
                           </div>
                        </td>
                        <td className="px-8 py-8 text-center">
                           <div className="flex flex-col items-center">
                              <Clock size={16} className="text-accent-primary mb-1" />
                              <span className="text-lg font-black text-white italic font-serif">{foot.duration_minutes || '--'}m</span>
                           </div>
                        </td>
                        <td className="px-10 py-8">
                           <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-2 max-w-[400px]">
                              {foot.navigation_path.map((path, idx) => (
                                 <React.Fragment key={idx}>
                                    <span className="px-3 py-1 bg-slate-950 border border-slate-800 rounded-lg text-[9px] font-black uppercase text-slate-500 italic whitespace-nowrap hover:text-white transition-colors">{path.replace('_', ' ')}</span>
                                    {idx < foot.navigation_path.length - 1 && <ChevronRight size={10} className="text-slate-800 shrink-0" />}
                                 </React.Fragment>
                              ))}
                           </div>
                        </td>
                        <td className="px-12 py-8 text-right">
                           <div className="space-y-1">
                              <div className="flex items-center justify-end gap-2 text-slate-600">
                                 <Monitor size={12} />
                                 <span className="text-[9px] font-mono uppercase">{foot.device_signature}</span>
                              </div>
                              <div className="flex items-center justify-end gap-2 text-slate-700">
                                 <Globe2 size={12} />
                                 <span className="text-[9px] font-mono uppercase">{foot.ip_address}</span>
                              </div>
                           </div>
                        </td>
                      </tr>
                    ))}
                    {footprints.length === 0 && !loading && (
                      <tr>
                        <td colSpan={5} className="py-40 text-center">
                           <div className="max-w-md mx-auto space-y-8 opacity-20">
                              <Map size={80} className="mx-auto" />
                              <p className="text-2xl font-black italic font-serif uppercase tracking-tight">Zero footprints detected in current horizon.</p>
                           </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
           </div>
        )}
      </main>

      {/* PROVISION TENANT MODAL */}
      {showAddTenant && (
         <div className="fixed inset-0 z-[600] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-10 animate-in fade-in">
            <div className="bg-[#0E1626] border border-slate-800 rounded-[4rem] p-20 max-w-2xl w-full shadow-4xl relative overflow-hidden flex flex-col">
               <div className="absolute top-0 left-0 w-full h-2 bg-accent-primary shadow-blue"></div>
               <button onClick={() => setShowAddTenant(false)} className="absolute top-12 right-12 text-slate-500 hover:text-white transition-all"><X size={40}/></button>
               <h2 className="text-6xl font-black text-white italic font-serif uppercase tracking-tight mb-8 leading-none">Provision Workspace</h2>
               <div className="space-y-10 mb-16">
                  <div className="space-y-4">
                     <label className="text-[11px] font-black text-slate-600 uppercase tracking-widest ml-6">Institutional Signature (Name)</label>
                     <input required className="w-full bg-slate-950 border border-slate-800 rounded-[2.5rem] p-8 text-2xl text-white font-black italic font-serif uppercase outline-none focus:ring-4 focus:ring-accent-primary/10" placeholder="e.g. ALPHA_STRATEGIC" value={newTenantName} onChange={e => setNewTenantName(e.target.value)} />
                  </div>
               </div>
               <button onClick={handleCreateTenant} className="w-full py-10 bg-accent-primary text-white rounded-[3rem] font-black uppercase text-base tracking-[0.4em] shadow-blue hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-10">
                  {loading ? <Loader2 className="animate-spin" size={32}/> : <>Provision Node <ChevronRight size={32}/></>}
               </button>
            </div>
         </div>
      )}

      {/* MASS PROVISION MODAL */}
      {showBulkSpecialist && (
         <div className="fixed inset-0 z-[600] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-10 animate-in fade-in">
            <div className="bg-[#0E1626] border border-slate-800 rounded-[4rem] p-20 max-w-4xl w-full shadow-4xl relative overflow-hidden flex flex-col">
               <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600 shadow-blue"></div>
               <button onClick={() => setShowBulkSpecialist(false)} className="absolute top-12 right-12 text-slate-500 hover:text-white transition-all"><X size={40}/></button>
               <header className="mb-12 space-y-4">
                  <h2 className="text-7xl font-black text-white italic font-serif uppercase tracking-tighter leading-none">Mass Provision</h2>
                  <p className="text-2xl text-slate-500 italic font-medium">Batch identity node initialization for <span className="text-white font-black">Existing Segments</span>.</p>
               </header>
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
                  <div className="p-10 bg-slate-900 border border-slate-800 rounded-[3rem] space-y-8">
                     <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-4"><Download size={14}/> CSV Schema</h4>
                     <p className="text-[11px] font-mono text-white p-3 bg-black rounded border border-slate-800">
                        email, full_name, role, tenant_id
                     </p>
                     <p className="text-xs text-slate-600 italic">Target Tenant UUIDs must correspond to active Workspace Nodes.</p>
                  </div>
                  <div 
                     onClick={handleBulkUploadSpecialists}
                     className="flex-1 border-4 border-dashed border-slate-800 hover:border-indigo-500/50 hover:bg-indigo-500/5 rounded-[3rem] flex flex-col items-center justify-center gap-8 cursor-pointer transition-all"
                  >
                     <div className="w-20 h-20 bg-slate-900 rounded-[2rem] flex items-center justify-center text-slate-700 shadow-inner group-hover:text-indigo-500 transition-all"><FileCode size={40}/></div>
                     <p className="text-xl font-black text-slate-400 italic uppercase">Deploy Identity Batch</p>
                  </div>
               </div>
               <footer className="pt-10 border-t border-slate-800 text-center">
                  <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.4em] italic flex items-center justify-center gap-4"><Shield size={14}/> Strict Identity Traceability Enforced</p>
               </footer>
            </div>
         </div>
      )}

    </div>
  );
};

export default MultiTenant;