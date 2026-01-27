import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Activity, Database, ShieldCheck, Hammer, 
  Inbox, LogOut, Loader2, RefreshCw, Sun, Moon, 
  Fingerprint, Cpu, FileText, BarChart3, UserCog,
  ChevronRight, ShieldQuestion, Building2, ShieldAlert,
  Layers, Target, GlobeLock, ListTodo, Gauge, Monitor, Settings2,
  Globe, Landmark, Play, History, SearchCheck, UserSearch, Share2,
  Sparkles, Send, X, Brain, Mic, Languages, Network, TrendingUp,
  ClipboardList, Terminal, Shield, ArrowLeft, ArrowRight, Lock, Ban, AlertCircle, PenTool, Radar,
  Briefcase, Palette, User, BookOpen, KeyRound, Check
} from 'lucide-react';

// Intelligence Views
import Dashboard from './views/Dashboard';
import DataNest from './views/DataNest';
import NewsIntelligence from './views/NewsIntelligence';
import ContactIntelligence from './views/ContactIntelligence';
import ContactGraph from './views/ContactGraph';
import SalesIntelligence from './views/SalesIntelligence';
import FirmIntelligence from './views/FirmIntelligence';
import FilingTimelines from './views/FilingTimelines';

// Unified Refinery
import ExtractionHub from './views/ExtractionHub';
import ExtractionRadar from './views/ExtractionRadar';

// Operational Modules
import TaskCockpit from './views/TaskCockpit';
import QADashboard from './views/QADashboard';
import QAWorkbench from './views/QAWorkbench';
import RegistryIntake from './views/RegistryIntake';
import NestAnnotate from './views/NestAnnotate';
import LandingPage from './views/LandingPage';
import MultiTenant from './views/MultiTenant';
import UsageLedgerView from './views/UsageLedger';
import Manual from './views/Manual';

import { TenantSession, PermissionMatrix, Project } from './types';
import { supabaseService, supabase } from './services/supabaseService';
import { geminiService } from './services/geminiService';

// View type used in App component state and navigation
export type View = 'dashboard' | 'datanest' | 'news' | 'contact_intel' | 'firm_intel' | 'contact_graph' | 'timelines' | 'sales_intel' | 'ext_hub' | 'radar' | 'task_cockpit' | 'qa_dashboard' | 'qa_workbench' | 'intake' | 'annotate' | 'usage_ledger' | 'settings' | 'manual';

// AnnoNestLogo component 
export const AnnoNestLogo = ({ className, size = 24 }: { className?: string, size?: number }) => (
  <Activity className={className} size={size} />
);

type ThemeVariant = 'theme-cobalt' | 'theme-terminal' | 'theme-ledger' | 'theme-emerald' | 'theme-onyx';

const THEMES: { id: ThemeVariant; label: string; color: string }[] = [
  { id: 'theme-cobalt', label: 'Cobalt (Corporate)', color: '#0052FF' },
  { id: 'theme-terminal', label: 'Terminal (Market)', color: '#FFB800' },
  { id: 'theme-ledger', label: 'Ledger (Financial)', color: '#1E3A8A' },
  { id: 'theme-emerald', label: 'Emerald (Nest)', color: '#10B981' },
  { id: 'theme-onyx', label: 'Onyx (Stealth)', color: '#F1F5F9' },
];

const AccessGuard: React.FC<{ 
  permission: keyof PermissionMatrix, 
  user: TenantSession, 
  children: React.ReactNode,
  fallback?: React.ReactNode
}> = ({ permission, user, children, fallback }) => {
  const hasRead = user.permissions[permission]?.read;
  const isActive = user.status === 'active';
  
  if (!isActive) return (
    <div className="h-full flex flex-col items-center justify-center space-y-12 animate-in zoom-in-95">
       <div className="w-32 h-32 bg-rose-950 border border-rose-500/30 rounded-[3rem] flex items-center justify-center shadow-3xl text-rose-500 relative">
          <Ban size={64} className="animate-pulse" />
       </div>
       <div className="text-center space-y-4">
          <h2 className="text-5xl font-black text-white italic font-serif uppercase tracking-tight leading-none">Access Suspended</h2>
          <p className="text-xl text-slate-500 italic font-medium leading-relaxed max-w-md mx-auto">Your institutional identity has been deactivated. Contact segment governance.</p>
       </div>
    </div>
  );

  if (!hasRead) return (
    fallback || (
      <div className="h-full flex flex-col items-center justify-center space-y-12 animate-in zoom-in-95">
        <div className="w-32 h-32 bg-slate-900 border border-slate-800 rounded-[3rem] flex items-center justify-center shadow-3xl text-slate-700 relative">
           <div className="absolute inset-0 bg-blue-500/5 animate-pulse rounded-[3rem]"></div>
           <Lock size={64} className="relative z-10" />
        </div>
        <div className="text-center space-y-4">
           <h2 className="text-5xl font-black text-white italic font-serif uppercase tracking-tight leading-none">Protocol Restricted.</h2>
           <p className="text-xl text-slate-500 italic font-medium leading-relaxed max-w-md mx-auto">Your identity node lacks <span className="text-accent-primary font-black">READ_{permission.toUpperCase()} clearance.</span></p>
        </div>
      </div>
    )
  );
  return <>{children}</>;
};

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [tenantSessions, setTenantSessions] = useState<TenantSession[]>([]);
  const [activeSession, setActiveSession] = useState<TenantSession | null>(null);
  const [globalStats, setGlobalStats] = useState({ entityCount: 0, newsCount: 0 });
  const [theme, setTheme] = useState<ThemeVariant>('theme-cobalt');
  
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string>('');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) initializeSessions();
      else setLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) initializeSessions();
      else setLoading(false);
    });
    return () => authListener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);

  const initializeSessions = async () => {
    setLoading(true);
    try {
      const sessions = await supabaseService.getTenantSessions();
      setTenantSessions(sessions);
      if (sessions.length > 0) {
  const authUserId = session?.user?.id;

  const active =
    sessions.find(s => s.user_id === authUserId) || sessions[0];

  setActiveSession(active);

        
        // Fetch baseline metrics from real DB
        const [projList, stats, news, members] = await Promise.all([
          supabaseService.fetchProjects(active.tenant_id),
          supabaseService.fetchDataNestStats(active.tenant_id),
          supabaseService.fetchNews(active.tenant_id),
          supabaseService.fetchTenantMembers(active.tenant_id)
        ]);
        
        setProjects(projList);
        if (projList.length > 0) setActiveProjectId(projList[0].id);

        const map: Record<string, string> = {};
        members.forEach((m: any) => {
          map[m.id] = m.full_name || m.email || "Unknown node";
          if (m.user_id) map[m.user_id] = m.full_name || m.email || "Unknown node";
        });
        setUserMap(map);
        
        setGlobalStats({ 
          entityCount: stats.entities_total || 0, 
          newsCount: news.length 
        });
      }
    } catch (err) {
      console.error("Institutional Handshake Failure:", err);
    } finally { 
      setLoading(false); 
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) return alert("Password must be at least 8 characters.");
    if (newPassword !== confirmPassword) return alert("Passwords do not match.");
    
    setPwdLoading(true);
    const { error } = await supabaseService.updatePassword(newPassword);
    if (!error) {
      alert("Institutional Node Secured. Handshake complete.");
      if (activeSession) {
        setActiveSession({ ...activeSession, is_first_login: false });
      }
    } else {
      alert("Node Hardening Failure: " + error.message);
    }
    setPwdLoading(false);
  };

  const renderCurrentView = () => {
    if (!activeSession) return null;

    switch (currentView) {
      case 'dashboard':
        return (
          <AccessGuard permission="dashboard" user={activeSession}>
            <Dashboard userProfile={activeSession} onNavigate={(v) => setCurrentView(v as View)} userMap={userMap} theme="dark" newsCount={globalStats.newsCount} activeProjectId={activeProjectId} />
          </AccessGuard>
        );
      case 'datanest':
        return (
          <AccessGuard permission="datanest" user={activeSession}>
            <DataNest userProfile={activeSession} userMap={userMap} />
          </AccessGuard>
        );
      case 'news':
        return (
          <AccessGuard permission="news" user={activeSession}>
            <NewsIntelligence userProfile={activeSession} userMap={userMap} />
          </AccessGuard>
        );
      case 'contact_intel':
        return (
          <AccessGuard permission="datanest" user={activeSession}>
            <ContactIntelligence userProfile={activeSession} userMap={userMap} />
          </AccessGuard>
        );
      case 'firm_intel':
        return (
          <AccessGuard permission="firm_intel" user={activeSession}>
            <FirmIntelligence userProfile={activeSession} />
          </AccessGuard>
        );
      case 'contact_graph':
        return (
          <AccessGuard permission="datanest" user={activeSession}>
            <ContactGraph userProfile={activeSession} />
          </AccessGuard>
        );
      case 'timelines':
        return (
          <AccessGuard permission="timelines" user={activeSession}>
            <FilingTimelines userProfile={activeSession} />
          </AccessGuard>
        );
      case 'sales_intel':
        return (
          <AccessGuard permission="sales" user={activeSession}>
            <SalesIntelligence userProfile={activeSession} />
          </AccessGuard>
        );
      case 'ext_hub':
        return (
          <AccessGuard permission="extraction" user={activeSession}>
            <ExtractionHub userProfile={activeSession} />
          </AccessGuard>
        );
      case 'radar':
        return (
          <AccessGuard permission="radar" user={activeSession}>
            <ExtractionRadar userProfile={activeSession} addTask={() => {}} activeProjectId={activeProjectId} />
          </AccessGuard>
        );
      case 'task_cockpit':
        return (
          <AccessGuard permission="execution" user={activeSession}>
            <TaskCockpit userProfile={activeSession} tenantSession={activeSession} activeProjectId={activeProjectId} userMap={userMap} onSync={initializeSessions} onNavigate={(v) => setCurrentView(v as View)} />
          </AccessGuard>
        );
      case 'qa_dashboard':
        return (
          <AccessGuard permission="qa" user={activeSession}>
            <QADashboard userProfile={activeSession} activeProjectId={activeProjectId} />
          </AccessGuard>
        );
      case 'qa_workbench':
        return (
          <AccessGuard permission="qa" user={activeSession}>
            <QAWorkbench userProfile={activeSession} activeProjectId={activeProjectId} onComplete={() => setCurrentView('qa_dashboard')} />
          </AccessGuard>
        );
      case 'intake':
        return (
          <AccessGuard permission="extraction" user={activeSession}>
            <RegistryIntake userProfile={activeSession} />
          </AccessGuard>
        );
      case 'annotate':
        return (
          <AccessGuard permission="execution" user={activeSession}>
            <NestAnnotate userProfile={activeSession} activeProjectId={activeProjectId} />
          </AccessGuard>
        );
      case 'usage_ledger':
        return (
          <AccessGuard permission="ledger" user={activeSession}>
            <UsageLedgerView userProfile={activeSession} />
          </AccessGuard>
        );
      case 'settings':
        return (
          <AccessGuard permission="governance" user={activeSession}>
            <MultiTenant tenantSession={activeSession} userMap={userMap} />
          </AccessGuard>
        );
      case 'manual':
        return <Manual />;
      default:
        return (
          <AccessGuard permission="dashboard" user={activeSession}>
            <Dashboard userProfile={activeSession} onNavigate={(v) => setCurrentView(v as View)} userMap={userMap} theme="dark" newsCount={globalStats.newsCount} activeProjectId={activeProjectId} />
          </AccessGuard>
        );
    }
  };

  if (loading) return (
    <div className="h-screen w-screen bg-[#070B14] flex flex-col items-center justify-center gap-6">
      <Loader2 className="text-accent-primary animate-spin" size={48} />
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] animate-pulse italic">Synchronizing Protocol Handshake...</p>
    </div>
  );

  if (!session) return <LandingPage onSignIn={() => initializeSessions()} />;

  if (!activeSession) return (
    <div className="h-screen w-screen bg-app-bg flex flex-col items-center justify-center p-10 animate-in fade-in zoom-in-95 duration-700">
       <div className="max-w-2xl w-full bg-card-panel border border-border-ui rounded-[4rem] p-20 shadow-3xl text-center space-y-12 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-rose-600 shadow-rose-900"></div>
          <div className="w-24 h-24 bg-slate-900 border border-slate-800 rounded-[2.5rem] flex items-center justify-center text-slate-600 mx-auto shadow-inner relative group">
             <div className="absolute inset-0 bg-rose-500/5 animate-pulse group-hover:bg-rose-500/10 rounded-[2.5rem]"></div>
             <Fingerprint size={48} className="relative z-10 text-rose-500" />
          </div>
          <div className="space-y-4">
             <h2 className="text-5xl font-black text-white italic font-serif uppercase tracking-tight leading-none">Identity Void.</h2>
             <p className="text-lg text-slate-500 italic font-medium leading-relaxed max-w-md mx-auto">Authorized session detected, but your master node is not mapped to an active institutional workspace or lacks protocol roles.</p>
          </div>
          <div className="grid grid-cols-2 gap-6 pt-10 border-t border-slate-800">
             <button onClick={() => supabaseService.signOut()} className="flex items-center justify-center gap-3 px-8 py-5 bg-slate-900 border border-slate-800 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:text-white hover:bg-rose-900/20 hover:border-rose-500/40 transition-all active:scale-95">
               <LogOut size={16}/> Terminate Session
             </button>
             <button onClick={initializeSessions} className="flex items-center justify-center gap-3 px-8 py-5 bg-accent-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-blue hover:brightness-110 active:scale-95 transition-all">
               <RefreshCw size={16}/> Retry Handshake
             </button>
          </div>
       </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-app-bg overflow-hidden text-text-primary font-sans selection:bg-accent-primary/30 relative">
        <aside className="w-72 bg-card-panel border-r border-border-ui flex flex-col z-20 shadow-xl shrink-0">
          <div className="p-10 pb-12 flex items-center gap-4">
            <div className="w-10 h-10 bg-accent-primary rounded-xl flex items-center justify-center shadow-xl"><AnnoNestLogo className="text-white" size={24} /></div>
            <h1 className="text-2xl font-black tracking-tighter uppercase italic text-text-primary leading-none">AnnoNest</h1>
          </div>

          <div className="px-8 pb-10">
             <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3 shadow-inner group transition-all hover:border-accent-primary/40">
                <div className="flex items-center justify-between">
                   <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest italic">Workflow Anchor</span>
                   <Briefcase size={12} className="text-accent-primary" />
                </div>
                <select 
                  className="w-full bg-transparent text-[11px] font-black text-white uppercase italic outline-none cursor-pointer appearance-none"
                  value={activeProjectId}
                  onChange={(e) => setActiveProjectId(e.target.value)}
                >
                  {projects.map(p => <option key={p.id} value={p.id} className="bg-slate-900">{p.name}</option>)}
                  {projects.length === 0 && <option value="">NO_ACTIVE_WORKFLOW</option>}
                </select>
             </div>
          </div>

          <nav className="flex-1 overflow-y-auto custom-scrollbar pb-10">
            <NavItem icon={Activity} label="System Pulse" view="dashboard" permission="dashboard" activeSession={activeSession} currentView={currentView} setCurrentView={setCurrentView} />
            <div className="px-8 mt-8 mb-3 text-[9px] font-black uppercase tracking-[0.4em] text-slate-600">Global Intelligence</div>
            <NavItem icon={Database} label="DataNest" view="datanest" permission="datanest" activeSession={activeSession} currentView={currentView} setCurrentView={setCurrentView} />
            <NavItem icon={Monitor} label="News Cockpit" view="news" permission="news" activeSession={activeSession} currentView={currentView} setCurrentView={setCurrentView} />
            <NavItem icon={BarChart3} label="Firm Intel" view="firm_intel" permission="firm_intel" activeSession={activeSession} currentView={currentView} setCurrentView={setCurrentView} />
            <NavItem icon={UserSearch} label="Contact Intel" view="contact_intel" permission="datanest" activeSession={activeSession} currentView={currentView} setCurrentView={setCurrentView} />
            <NavItem icon={TrendingUp} label="Sales Intel" view="sales_intel" permission="sales" activeSession={activeSession} currentView={currentView} setCurrentView={setCurrentView} />
            <NavItem icon={Network} label="Contact Graph" view="contact_graph" permission="datanest" activeSession={activeSession} currentView={currentView} setCurrentView={setCurrentView} />
            <div className="px-8 mt-8 mb-3 text-[9px] font-black uppercase tracking-[0.4em] text-slate-600">Refinery Workflows</div>
            <NavItem icon={Radar} label="Extraction Radar" view="radar" permission="radar" activeSession={activeSession} currentView={currentView} setCurrentView={setCurrentView} />
            <NavItem icon={Cpu} label="Extraction Hub" view="ext_hub" permission="extraction" activeSession={activeSession} currentView={currentView} setCurrentView={setCurrentView} />
            <NavItem icon={Landmark} label="Registry Intake" view="intake" permission="extraction" activeSession={activeSession} currentView={currentView} setCurrentView={setCurrentView} />
            <NavItem icon={History} label="Filing Timelines" view="timelines" permission="timelines" activeSession={activeSession} currentView={currentView} setCurrentView={setCurrentView} />
            <div className="px-8 mt-8 mb-3 text-[9px] font-black uppercase tracking-[0.4em] text-slate-600">Project Execution</div>
            <NavItem icon={ListTodo} label="Task Cockpit" view="task_cockpit" permission="execution" activeSession={activeSession} currentView={currentView} setCurrentView={setCurrentView} />
            <NavItem icon={PenTool} label="NestAnnotate" view="annotate" permission="execution" activeSession={activeSession} currentView={currentView} setCurrentView={setCurrentView} />
            <NavItem icon={ShieldCheck} label="QA Command" view="qa_dashboard" permission="qa" activeSession={activeSession} currentView={currentView} setCurrentView={setCurrentView} />
            <div className="mt-8 border-t border-border-ui pt-4">
              <NavItem icon={BookOpen} label="Foundation Manual" view="manual" permission="all" activeSession={activeSession} currentView={currentView} setCurrentView={setCurrentView} />
              <NavItem icon={UserCog} label="Governance" view="settings" permission="governance" activeSession={activeSession} currentView={currentView} setCurrentView={setCurrentView} />
              <NavItem icon={BarChart3} label="Usage Ledger" view="usage_ledger" permission="ledger" activeSession={activeSession} currentView={currentView} setCurrentView={setCurrentView} />
            </div>
          </nav>
        </aside>

        <main className="flex-1 flex flex-col min-0 bg-app-bg transition-colors relative">
          <header className="h-20 border-b border-border-ui flex items-center justify-between px-10 bg-card-panel/40 backdrop-blur-2xl shrink-0">
            <div className="flex items-center gap-6">
              <div className="bg-slate-800 border border-border-ui px-4 py-2 rounded-xl flex items-center gap-3 shadow-sm">
                  <Building2 size={14} className="text-accent-primary" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white">{activeSession.tenant_name}</span>
              </div>
              <div className="h-8 w-px bg-slate-800"></div>
              {/* THEME HUD */}
              <div className="flex items-center gap-2 bg-slate-900/50 p-1.5 rounded-2xl border border-border-ui">
                 {THEMES.map(t => (
                   <button 
                    key={t.id} 
                    onClick={() => setTheme(t.id)} 
                    title={t.label}
                    className={`w-6 h-6 rounded-full transition-all border-2 ${theme === t.id ? 'border-white scale-125 shadow-blue' : 'border-transparent opacity-40 hover:opacity-100 hover:scale-110'}`}
                    style={{ backgroundColor: t.color }}
                   />
                 ))}
              </div>
            </div>
            <div className="flex items-center gap-8">
               <div className="flex items-center gap-5">
                  <div className="text-right">
                     <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Personnel Node</p>
                     <p className="text-[11px] font-black text-text-primary uppercase italic leading-none">{activeSession.full_name || activeSession.email}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-accent-primary shadow-inner">
                    <User size={20} />
                  </div>
               </div>
               <button onClick={() => supabaseService.signOut()} className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-500 hover:text-rose-500 transition-all shadow-lg active:scale-90" title="Terminate Session">
                  <LogOut size={18} />
               </button>
            </div>
          </header>
          <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">{renderCurrentView()}</div>

          {/* FIRST LOGIN ENFORCEMENT OVERLAY */}
          {activeSession.is_first_login && (
             <div className="absolute inset-0 z-[600] bg-app-bg/95 backdrop-blur-3xl flex items-center justify-center p-10 animate-in fade-in duration-500">
                <form onSubmit={handleUpdatePassword} className="bg-[#0E1626] border border-border-ui rounded-[4rem] p-20 max-w-2xl w-full shadow-3xl text-center space-y-12 relative overflow-hidden">
                   <div className="absolute top-0 left-0 w-full h-2 bg-accent-primary shadow-blue"></div>
                   <div className="w-20 h-20 bg-accent-primary/10 border border-accent-primary/20 rounded-3xl flex items-center justify-center text-accent-primary mx-auto shadow-inner">
                      <KeyRound size={40} />
                   </div>
                   <div className="space-y-4">
                      <h2 className="text-5xl font-black text-white italic font-serif uppercase tracking-tight leading-none">Secure Your Node.</h2>
                      <p className="text-lg text-slate-400 italic font-medium leading-relaxed max-w-md mx-auto">First-time handshake detected. You must define a secure credential set for your institutional identity.</p>
                   </div>
                   <div className="space-y-6">
                      <div className="space-y-2 text-left">
                         <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">New Master Key</label>
                         <input required type="password" placeholder="Minimum 8 characters..." className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-8 py-5 text-white font-bold outline-none focus:ring-4 focus:ring-accent-primary/10" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                      </div>
                      <div className="space-y-2 text-left">
                         <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Confirm Handshake</label>
                         <input required type="password" placeholder="Re-enter password..." className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-8 py-5 text-white font-bold outline-none focus:ring-4 focus:ring-accent-primary/10" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                      </div>
                   </div>
                   <button type="submit" disabled={pwdLoading || newPassword.length < 8} className="w-full py-8 bg-accent-primary text-white rounded-[2rem] font-black uppercase text-base tracking-[0.4em] shadow-blue hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-6 disabled:opacity-30">
                      {pwdLoading ? <Loader2 className="animate-spin" size={24}/> : <>Secure Identity <Check size={24}/></>}
                   </button>
                   <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest italic flex items-center justify-center gap-3"><Shield size={14}/> Node Integrity Protocol Enforced</p>
                </form>
             </div>
          )}
        </main>
    </div>
  );
};

// Reusable NavItem component
const NavItem = ({ icon: Icon, label, view, permission, activeSession, currentView, setCurrentView }: any) => {
    const active = currentView === view;
    const hasRead = permission === 'all' ? true : activeSession.permissions[permission]?.read;
    
    return (
      <button 
        onClick={() => hasRead && setCurrentView(view)} 
        disabled={!hasRead}
        className={`flex items-center space-x-4 w-full px-8 py-2.5 transition-all group relative ${active ? 'bg-accent-primary/10' : 'hover:bg-slate-800'} ${!hasRead ? 'opacity-20 cursor-not-allowed grayscale' : ''}`}
      >
        <div className="relative">
           <Icon size={18} className={`transition-colors ${active ? 'text-accent-primary' : 'text-slate-500 group-hover:text-white'}`} />
           {!hasRead && <Lock size={8} className="absolute -top-1 -right-1 text-rose-500" />}
        </div>
        <span className={`font-semibold text-[10px] uppercase tracking-widest transition-colors ${active ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}>{label}</span>
        {active && <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent-primary" />}
      </button>
    );
};

export default App;