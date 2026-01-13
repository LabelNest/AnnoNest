import React, { useState, useEffect } from 'react';
import { 
  Users, Globe, Shield, Plus, ChevronRight, Lock, Layout, Briefcase, 
  Database, Activity, RefreshCw, Search, ShieldCheck, 
  UserCheck, Clock, Settings2, UserCog, Mail, X,
  UserPlus, Building2, Send, Save, ShieldAlert, Loader2, CheckSquare, Square,
  UserX, Check, Info, Target, Gauge, Fingerprint, Box, Eye, GitPullRequest,
  Zap, TriangleAlert, Command, GitMerge, UserMinus, Building, ExternalLink,
  KeyRound, ShieldHalf, CheckCircle, 
  Shapes, Wand2, XCircle, ShieldBan, MoreVertical, ToggleLeft, ToggleRight, 
  Trash2, Hash, LogIn, 
  Copy, Link, Sparkles, LifeBuoy, Wifi, Ghost, Trash, UserSearch,
  Brackets, ZapOff, Link2, Unlink, Code, CircleAlert, Terminal,
  Cpu, ArrowUpRight
} from 'lucide-react';
import { Project, UserProfile, UserRole, UserStatus, UserPermission, CANONICAL_MODULES, EntityType, UserClearance, TENANT_NAME } from '../types';
import { supabaseService, supabase, TenantRecord } from '../services/supabaseService';

interface Props {
  userProfile: UserProfile;
}

const PermissionGrid: React.FC<{ 
  profile_id: string; 
  projectId: string; 
  canEdit: boolean;
  tenantName: string;
}> = ({ profile_id, projectId, canEdit, tenantName }) => {
  const [permissions, setPermissions] = useState<UserPermission[]>([]);
  const [syncingModule, setSyncingModule] = useState<string | null>(null);

  useEffect(() => { if (profile_id && projectId) loadPermissions(); }, [profile_id, projectId]);

  const loadPermissions = async () => {
    const data = await supabaseService.fetchModuleAccess(profile_id, projectId);
    setPermissions(data);
  };

  const handleToggle = async (module: string, action: 'can_read' | 'can_write') => {
    if (!canEdit) return;
    setSyncingModule(`${module}-${action}`);
    const existing = permissions.find(p => p.module === module);
    const currentValue = !!(existing as any)?.[action];
    const newPerm: UserPermission = existing 
      ? { ...existing, [action]: !currentValue }
      : { profile_id: profile_id, tenant_name: tenantName, project_id: projectId, module, can_read: action === 'can_read', can_write: action === 'can_write' };
    const result = await supabaseService.upsertModuleAccess(newPerm);
    if (result.success) loadPermissions();
    setSyncingModule(null);
  };

  const isChecked = (module: string, action: 'can_read' | 'can_write') => {
    const p = permissions.find(perm => perm.module === module);
    return !!(p as any)?.[action];
  };

  const Section = ({ title, modules }: { title: string, modules: string[] }) => (
    <div className="space-y-4">
      <h5 className="text-[10px] font-black text-blue-500/50 uppercase tracking-[0.3em] mb-4 flex items-center gap-2"><Fingerprint size={14} /> {title}</h5>
      <div className="overflow-hidden border border-slate-800 rounded-2xl bg-slate-950/30">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900/50 border-b border-slate-800 text-[9px] font-black text-slate-500 uppercase tracking-widest">
              <th className="px-6 py-4 w-2/3">Module Identity</th>
              <th className="px-4 py-4 text-center">READ</th>
              <th className="px-4 py-4 text-center">WRITE</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40">
            {modules.map(mod => (
              <tr key={mod} className="hover:bg-blue-500/5 transition-colors group">
                <td className="px-6 py-5">
                  <span className="text-xs font-bold text-slate-300 group-hover:text-white uppercase tracking-tight">{mod.replace(/_/g, ' ')}</span>
                </td>
                <td className="px-4 py-5 text-center">
                  <button disabled={!canEdit || syncingModule === `${mod}-can_read`} onClick={() => handleToggle(mod, 'can_read')}>
                    {syncingModule === `${mod}-can_read` ? <Loader2 className="animate-spin text-blue-500" size={20} /> : isChecked(mod, 'can_read') ? <CheckCircle className="text-emerald-500" size={20} /> : <XCircle className="text-slate-800" size={20} />}
                  </button>
                </td>
                <td className="px-4 py-5 text-center">
                  <button disabled={!canEdit || syncingModule === `${mod}-can_write`} onClick={() => handleToggle(mod, 'can_write')}>
                    {syncingModule === `${mod}-can_write` ? <Loader2 className="animate-spin text-emerald-500" size={20} /> : isChecked(mod, 'can_write') ? <CheckCircle className="text-emerald-500" size={20} /> : <XCircle className="text-slate-800" size={20} />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-12 pb-10">
      <Section title="Market Intelligence" modules={CANONICAL_MODULES.DATA_DOMAINS} />
      <Section title="Factory Operations" modules={CANONICAL_MODULES.DATA_PRODUCTION} />
    </div>
  );
};

const MultiTenant: React.FC<Props> = ({ userProfile }) => {
  const [activeTab, setActiveTab] = useState<'MEMBERS' | 'CLEARANCE' | 'DIAGNOSTICS'>('MEMBERS');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [clearanceQueue, setClearanceQueue] = useState<UserClearance[]>([]);
  const [loading, setLoading] = useState(false);
  const [diagnosticsLogs, setDiagnosticsLogs] = useState<string[]>([]);
  const [bulkEmails, setBulkEmails] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [actioningEmail, setActioningEmail] = useState<string | null>(null);

  const isSuperAdmin = userProfile.role === UserRole.SUPER_ADMIN;

  const loadKernelData = async () => {
    setLoading(true);
    try {
      const allProfiles = await supabaseService.fetchAllUserProfiles(isSuperAdmin ? 'ALL' : userProfile.tenant_id);
      
      // Explicitly normalising for robustness against DB value variance
      const active = allProfiles.filter(u => u.status?.toLowerCase() === 'active');
      const pending = allProfiles.filter(u => u.status?.toLowerCase() === 'pending');
      const disabled = allProfiles.filter(u => u.status?.toLowerCase() === 'disabled');

      setUsers([...active, ...disabled]);
      setClearanceQueue(pending.map(u => ({ 
        id: u.email, 
        auth_user_id: u.user_id, 
        email: u.email, 
        full_name: u.name, 
        tenant_name: u.tenant_name || TENANT_NAME, 
        tenant_id: u.tenant_id,
        status: 'pending', 
        requested_at: u.created_at || new Date().toISOString() 
      })));

      setDiagnosticsLogs(prev => [`[FETCH] Registry sweep complete. Found ${allProfiles.length} records (${pending.length} pending).`, ...prev]);
    } catch (e: any) { 
      console.error("Kernel Sync Failure:", e);
      setDiagnosticsLogs(prev => [`[ERR] Kernel Sync Failure: ${e.message}`, ...prev]);
    }
    finally { setLoading(false); }
  };

  useEffect(() => { loadKernelData(); }, []);

  const handleApprove = async (clearance: UserClearance) => {
     setActioningEmail(clearance.email);
     try {
        const res = await supabaseService.approveUser(clearance, userProfile.id);
        if (res.success) {
           await loadKernelData();
           setDiagnosticsLogs(prev => [`[CLEARANCE] Approved ${clearance.email}`, ...prev]);
        } else {
           alert(`Clearance Error: ${res.error}`);
        }
     } finally {
        setActioningEmail(null);
     }
  };

  const handleReject = async (email: string) => {
     if (!confirm(`Are you sure you want to reject and purge ${email}?`)) return;
     setActioningEmail(email);
     try {
        setDiagnosticsLogs(prev => [`[CLEARANCE] Purged ${email} from queue.`, ...prev]);
        await loadKernelData();
     } finally {
        setActioningEmail(null);
     }
  };

  const handleBulkRepair = async () => {
     if (!bulkEmails) return;
     const emails = bulkEmails.split(/[\n,]+/).map(e => e.trim()).filter(e => e.includes('@'));
     setLoading(true);
     setDiagnosticsLogs(prev => [`[INIT] Handshaking ${emails.length} accounts...`, ...prev]);
     for (const email of emails) {
        const res = await supabaseService.repairShadowIdentity(email);
        setDiagnosticsLogs(prev => [`[${res.success ? 'OK' : 'ERR'}] ${email}: ${res.success ? 'Linked' : res.error}`, ...prev]);
     }
     setBulkEmails(''); setLoading(false); loadKernelData();
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-500 max-w-[1600px] mx-auto pb-20 relative">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 border-b border-slate-800 pb-16">
        <div>
          <h1 className="text-6xl font-black flex items-center gap-8 text-white tracking-tighter uppercase italic font-serif leading-none">
            <UserCog className="text-blue-500 shrink-0" size={60} />
            Governance
          </h1>
          <p className="text-slate-400 mt-6 font-medium flex items-center gap-4 text-lg"><ShieldCheck size={22} className="text-emerald-500" /> Registry Management</p>
        </div>
        <div className="flex bg-slate-900 border border-slate-800 rounded-[2.5rem] p-2 shadow-2xl">
          <button onClick={() => setActiveTab('MEMBERS')} className={`px-10 py-4 rounded-[1.75rem] text-[11px] font-black uppercase transition-all ${activeTab === 'MEMBERS' ? 'bg-blue-600 text-white shadow-2xl' : 'text-slate-500'}`}>People ({users.length})</button>
          <button onClick={() => setActiveTab('CLEARANCE')} className={`px-10 py-4 rounded-[1.75rem] text-[11px] font-black uppercase transition-all ${activeTab === 'CLEARANCE' ? 'bg-amber-600 text-white shadow-2xl' : 'text-slate-500'}`}>Clearance ({clearanceQueue.length})</button>
          {isSuperAdmin && <button onClick={() => setActiveTab('DIAGNOSTICS')} className={`px-10 py-4 rounded-[1.75rem] text-[11px] font-black uppercase transition-all ${activeTab === 'DIAGNOSTICS' ? 'bg-rose-600 text-white shadow-2xl' : 'text-slate-500'}`}>Diagnostics</button>}
        </div>
      </div>

      {activeTab === 'MEMBERS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-[3.5rem] overflow-hidden shadow-3xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/40 border-b border-slate-800 text-[11px] font-black text-slate-500 uppercase tracking-[0.4em]">
                <th className="px-10 py-8">Person Profile</th>
                <th className="px-8 py-8">Class</th>
                <th className="px-8 py-8">Status</th>
                <th className="px-10 py-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-800/30 transition-all cursor-pointer border-l-[6px] border-transparent hover:border-blue-500" onClick={() => setSelectedUser(u)}>
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center font-black uppercase italic font-serif text-xl">{u.name?.[0]}</div>
                      <div>
                        <p className="text-lg font-black text-white italic font-serif leading-none mb-1">{u.name}</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6"><span className="text-[9px] font-black px-3 py-1 bg-slate-800 text-slate-400 rounded-lg uppercase italic border border-slate-700">{u.role}</span></td>
                  <td className="px-8 py-6"><span className={`text-[9px] font-black uppercase tracking-widest ${u.status === 'active' ? 'text-emerald-500' : 'text-rose-500'}`}>{u.status}</span></td>
                  <td className="px-10 py-6 text-right"><Settings2 size={20} className="text-slate-700 hover:text-white transition-colors ml-auto" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'CLEARANCE' && (
        <div className="bg-slate-900 border border-slate-800 rounded-[3.5rem] overflow-hidden shadow-3xl">
           {clearanceQueue.length === 0 ? (
             <div className="py-32 flex flex-col items-center justify-center text-center space-y-6">
                {loading ? <Loader2 className="animate-spin text-blue-500" size={48} /> : (
                  <>
                    <div className="p-6 bg-slate-950 border border-slate-800 rounded-[2rem] text-slate-800"><ShieldCheck size={64} /></div>
                    <div>
                       <h3 className="text-2xl font-black text-white italic font-serif uppercase">Queue Clear.</h3>
                       <p className="text-slate-600 font-medium italic">No identities awaiting clearance protocols.</p>
                    </div>
                    <button onClick={loadKernelData} className="mt-8 px-6 py-2 bg-slate-800 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-white transition-all flex items-center gap-2">
                       <RefreshCw size={14} /> Refresh Registry
                    </button>
                  </>
                )}
             </div>
           ) : (
             <table className="w-full text-left border-collapse">
               <thead>
                 <tr className="bg-slate-950/40 border-b border-slate-800 text-[11px] font-black text-slate-500 uppercase tracking-[0.4em]">
                   <th className="px-10 py-8">Awaiting Clearance</th>
                   <th className="px-8 py-8">Requested Access</th>
                   <th className="px-8 py-8">Timestamp</th>
                   <th className="px-10 py-8 text-right">Verification Protocol</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-800/40">
                 {clearanceQueue.map(c => (
                   <tr key={c.email} className="hover:bg-amber-500/5 transition-all group">
                     <td className="px-10 py-6">
                       <div className="flex items-center gap-6">
                         <div className="w-12 h-12 rounded-xl bg-amber-600/10 text-amber-500 flex items-center justify-center font-black uppercase italic font-serif text-xl border border-amber-500/20">{c.full_name?.[0] || '?'}</div>
                         <div>
                           <p className="text-lg font-black text-white italic font-serif leading-none mb-1">{c.full_name}</p>
                           <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{c.email}</p>
                         </div>
                       </div>
                     </td>
                     <td className="px-8 py-6">
                       <div className="flex items-center gap-3">
                          <Building2 size={14} className="text-blue-500" />
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{c.tenant_name}</span>
                       </div>
                     </td>
                     <td className="px-8 py-6">
                       <span className="text-[10px] font-mono text-slate-600">{new Date(c.requested_at).toLocaleString()}</span>
                     </td>
                     <td className="px-10 py-6 text-right">
                       <div className="flex gap-4 justify-end">
                         <button 
                           onClick={() => handleApprove(c)}
                           disabled={actioningEmail === c.email}
                           className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-30 shadow-xl shadow-emerald-600/20"
                         >
                           {actioningEmail === c.email ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />} Approve
                         </button>
                         <button 
                           onClick={() => handleReject(c.email)}
                           disabled={actioningEmail === c.email}
                           className="px-6 py-2.5 bg-slate-800 text-slate-400 border border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all flex items-center gap-2 active:scale-95 disabled:opacity-30"
                         >
                           <XCircle size={14} /> Reject
                         </button>
                       </div>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           )}
        </div>
      )}

      {activeTab === 'DIAGNOSTICS' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="bg-slate-900 border border-slate-800 rounded-[3.5rem] p-12 space-y-10">
             <h3 className="text-xl font-black text-white italic font-serif uppercase tracking-tight">Identity Provisioning</h3>
             <textarea placeholder="Enter corporate emails (one per line)..." className="w-full h-48 bg-slate-950 border border-slate-800 rounded-2xl p-6 text-white font-mono text-sm outline-none focus:ring-4 focus:ring-rose-500/10 shadow-inner" value={bulkEmails} onChange={e => setBulkEmails(e.target.value)} />
             <div className="flex gap-4">
                <button onClick={handleBulkRepair} disabled={loading || !bulkEmails} className="flex-1 py-6 bg-rose-600 text-white rounded-2xl font-black uppercase text-sm tracking-[0.2em] shadow-2xl hover:bg-rose-500 transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50">
                    {loading ? <Loader2 className="animate-spin" size={20} /> : <>Execute Bridge Protocol <Zap size={20} /></>}
                </button>
                <button onClick={loadKernelData} className="px-8 py-6 bg-slate-800 text-slate-300 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-700 transition-all active:scale-95">
                    <RefreshCw size={24} />
                </button>
             </div>
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded-[3.5rem] p-12 shadow-inner h-[500px] overflow-y-auto custom-scrollbar font-mono text-xs text-blue-400 space-y-2">
             <div className="text-slate-700 mb-4 tracking-[0.4em] uppercase font-black text-[10px] flex justify-between items-center">
                <span><Brackets size={16} className="inline mr-2" /> Bridge Terminal Logs</span>
                <button onClick={() => setDiagnosticsLogs([])} className="text-[8px] hover:text-white">CLEAR_BUFFER</button>
             </div>
             {diagnosticsLogs.map((log, i) => <div key={i} className={log.includes('ERR') ? 'text-rose-500' : (log.includes('FETCH') ? 'text-blue-400' : 'text-emerald-400')}>[{new Date().toLocaleTimeString()}] {log}</div>)}
             {diagnosticsLogs.length === 0 && <p className="text-slate-800 italic uppercase text-[10px] tracking-widest mt-10 text-center">Waiting for protocol dispatch...</p>}
          </div>
        </div>
      )}

      {selectedUser && (
        <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex items-center justify-end animate-in fade-in" onClick={() => setSelectedUser(null)}>
          <div className="h-full w-full max-w-4xl bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-500" onClick={e => e.stopPropagation()}>
            <div className="p-12 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
              <div className="flex items-center gap-6">
                 <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-3xl font-black italic font-serif">{selectedUser.name[0]}</div>
                 <h3 className="text-4xl font-black text-white italic font-serif uppercase tracking-tight">Person Matrix</h3>
              </div>
              <button onClick={() => setSelectedUser(null)} className="p-5 text-slate-500 hover:text-white bg-slate-950 rounded-2xl border border-slate-800 transition-all"><X size={36} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
              <PermissionGrid profile_id={selectedUser.id} projectId="BASELINE" canEdit={true} tenantName={selectedUser.tenant_name} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiTenant;
