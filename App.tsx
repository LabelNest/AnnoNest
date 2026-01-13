
import React, { Component, useState, useEffect, createContext, useContext, ErrorInfo, ReactNode } from 'react';
import { LayoutGrid, Radar, PenTool, Database, Share2, Users, Bell, Terminal, Newspaper, ChevronDown, Globe, Shield, LogOut, ShieldAlert as SecurityIcon, Loader2, Clock, Network, Check, UserCog, Brain, Monitor, Activity, Cpu, ShieldCheck, SearchCheck, UserX, TriangleAlert, CircleAlert, SquareTerminal, Copy, ListTodo, TrendingUp, Target, Inbox, Settings2, UserPlus, Fingerprint, Lock, RefreshCw, KeyRound, ShieldHalf, CircleCheck, Sparkles, Crown, Link, Wifi, OctagonAlert } from 'lucide-react';
import Dashboard from './views/Dashboard';
import ExtractionRadar from './views/ExtractionRadar';
import NewsIntelligence from './views/NewsIntelligence';
import NestAnnotate from './views/NestAnnotate';
import DataNest from './views/DataNest';
import ContactGraph from './views/ContactGraph';
import MultiTenant from './views/MultiTenant';
import LandingPage from './views/LandingPage';
import QADashboard from './views/QADashboard';
import QAWorkbench from './views/QAWorkbench';
import SalesIntelligence from './views/SalesIntelligence';
import RegistryIntake from './views/RegistryIntake';
import { Entity, AnnotationTask, Project, UserRole, UserProfile, LocationRecord, NewsArticle, TENANT_NAME } from './types';
import { supabaseService, supabase, Organization } from './services/supabaseService';

type View = 'dashboard' | 'radar' | 'news' | 'annotate' | 'datanest' | 'network' | 'settings' | 'qa_dashboard' | 'qa_workbench' | 'tasks' | 'sales' | 'intake';

export const GeoContext = createContext<{ locations: LocationRecord[] }>({ locations: [] });

interface ErrorBoundaryProps { children?: ReactNode; }
interface ErrorBoundaryState { hasError: boolean; error: Error | null; }

// Fixed: Inheriting from Component explicitly and using property initializer for state to resolve Property 'state' and 'props' errors
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState { 
    return { hasError: true, error }; 
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) { 
    console.error("CRITICAL_OS_ERROR:", error, errorInfo); 
  }

  render() {
    // Fixed: Correctly accessing state from class component properties
    if (this.state.hasError) {
      return (
        <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center p-10 text-center">
          <OctagonAlert size={64} className="text-rose-500 mb-6" />
          <h2 className="text-3xl font-black text-white uppercase italic font-serif">Kernel Panic</h2>
          <p className="text-slate-500 mt-4 max-w-md italic">"{this.state.error?.message || 'Protocol deviation detected'}"</p>
          <button onClick={() => window.location.reload()} className="mt-10 px-8 py-3 bg-blue-600 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-2xl">Restart System</button>
        </div>
      );
    }
    // Fixed: Correctly accessing children via this.props
    return this.props.children;
  }
}

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isPendingApproval, setIsPendingApproval] = useState(false);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [locations, setLocations] = useState<LocationRecord[]>([]);
  const [tasks, setTasks] = useState<AnnotationTask[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else { setUserProfile(null); setLoading(false); }
    });

    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') as View;
      const validViews: View[] = ['dashboard', 'radar', 'news', 'annotate', 'datanest', 'network', 'settings', 'qa_dashboard', 'qa_workbench', 'tasks', 'sales', 'intake'];
      if (validViews.includes(hash)) setCurrentView(hash);
    };
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { profile, isPending, error } = await supabaseService.getUserProfile(userId);
      if (error) { setBootstrapError(error); setLoading(false); return; }
      setIsPendingApproval(isPending);
      if (profile) {
        const [geoData] = await Promise.all([supabaseService.fetchLocations()]);
        setUserProfile(profile);
        setLocations(Array.isArray(geoData) ? geoData : []);
      }
    } catch (e) { console.error("Profile Error", e); }
    finally { setLoading(false); }
  };

  const syncData = async () => {
    if (!session || !userProfile || userProfile.status !== 'active') return;
    try {
      const [dbEntities, dbTasks, dbNews] = await Promise.all([
        supabaseService.fetchEntities(null, userProfile.role),
        supabaseService.fetchTasks(null, userProfile.role),
        supabaseService.fetchNews()
      ]);
      setEntities(dbEntities || []);
      setTasks(dbTasks || []);
      setNews(dbNews || []);
    } catch (e) { console.error("Sync Failure", e); }
  };

  useEffect(() => {
    if (session && userProfile?.status === 'active') {
      syncData();
      const interval = setInterval(syncData, 30000);
      return () => clearInterval(interval);
    }
  }, [session, userProfile]);

  const handleSignOut = async () => { await supabaseService.signOut(); window.location.hash = ''; };

  if (loading) return <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center gap-6"><Loader2 className="text-blue-500 animate-spin" size={48} /></div>;
  if (!session) return <LandingPage onSignIn={() => {}} />;
  if (isPendingApproval) return <div className="h-screen w-screen bg-slate-950 flex items-center justify-center text-white font-serif italic text-2xl uppercase tracking-widest">Clearance Pending.</div>;
  
  if (!userProfile) return (
    <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center p-10 text-center animate-in fade-in">
       <UserX size={56} className="text-rose-500 mb-8" />
       <h2 className="text-4xl font-black text-white uppercase italic font-serif">Registry Mismatch</h2>
       <button onClick={() => window.location.reload()} className="mt-12 px-16 py-5 bg-blue-600 text-white rounded-[2rem] font-black uppercase text-sm tracking-widest shadow-2xl active:scale-95 transition-all">Retry Handshake</button>
    </div>
  );

  const NavItem = ({ icon: Icon, label, view, count, module }: { icon: any, label: string, view: View, count?: number, module?: string }) => {
    const isSelected = currentView === view;
    return (
      <button
        onClick={() => { window.location.hash = view; setCurrentView(view); }}
        className={`flex items-center justify-between w-full px-6 py-4 transition-all group ${isSelected ? 'bg-blue-600/10 text-blue-500 border-l-4 border-blue-500 shadow-xl' : 'text-slate-500 hover:text-slate-300'}`}
      >
        <div className="flex items-center space-x-5">
          <Icon size={20} className={isSelected ? 'text-blue-500' : 'text-slate-500'} />
          <span className={`font-black text-[11px] uppercase tracking-widest ${isSelected ? 'text-white' : 'text-slate-500'}`}>{label}</span>
        </div>
        {count !== undefined && count > 0 && <span className="bg-blue-600 text-white text-[9px] font-black px-2 py-0.5 rounded shadow-lg">{count}</span>}
      </button>
    );
  };

  return (
    <ErrorBoundary>
      <GeoContext.Provider value={{ locations }}>
        <div className="flex h-screen bg-[#0b0f19] overflow-hidden text-slate-200">
          <aside className="w-72 bg-[#0d121f] border-r border-slate-800/50 flex flex-col z-20 transition-all shadow-2xl">
            <div className="p-8 pb-12 flex items-center gap-4 cursor-pointer" onClick={() => { setCurrentView('dashboard'); window.location.hash = 'dashboard'; }}>
              <Activity className="text-blue-600" size={32} />
              <h1 className="text-xl font-black tracking-tighter text-white uppercase italic font-serif">AnnoNest</h1>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto custom-scrollbar">
              <NavItem icon={LayoutGrid} label="DASHBOARD" view="dashboard" />
              <NavItem icon={Target} label="SALES INTEL" view="sales" />
              <NavItem icon={Newspaper} label="NEWS COCKPIT" view="news" count={news.length} />
              <NavItem icon={PenTool} label="ANNOTATE" view="annotate" count={tasks.filter(t => t.status === 'TODO').length} />
              <NavItem icon={Database} label="DATANEST" view="datanest" count={entities.length} />
              <NavItem icon={Inbox} label="INTAKE" view="intake" />
              <NavItem icon={SearchCheck} label="QA WORKBENCH" view="qa_workbench" />
              <NavItem icon={ShieldCheck} label="QA COMMAND" view="qa_dashboard" />
              <NavItem icon={Network} label="NETWORK GRAPH" view="network" />
              <NavItem icon={Cpu} label="RADAR" view="radar" />
              <NavItem icon={UserCog} label="GOVERNANCE" view="settings" />
            </nav>
            <div className="p-6 border-t border-slate-800/40">
              <button onClick={handleSignOut} className="flex items-center space-x-3 w-full px-4 py-2 text-slate-600 hover:text-rose-500 transition-all group">
                <LogOut size={16} />
                <span className="font-bold text-[9px] uppercase tracking-widest">End Session</span>
              </button>
            </div>
          </aside>

          <main className="flex-1 flex flex-col min-w-0 bg-[#0b0f19] relative">
            <header className="h-20 border-b border-slate-800/50 flex items-center justify-between px-10 bg-[#0d121f]/60 backdrop-blur-2xl sticky top-0 z-10">
              <div className="flex items-center gap-3 bg-slate-900/60 border border-slate-800/50 px-5 py-2.5 rounded-xl">
                <Fingerprint size={14} className="text-blue-500" />
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{userProfile.tenant_name || TENANT_NAME}</span>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black text-white uppercase tracking-tight">{userProfile.name}</span>
                    <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">{userProfile.role}</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-[12px] font-black uppercase italic font-serif text-blue-500 shadow-xl">{userProfile.name?.[0] || 'U'}</div>
              </div>
            </header>
            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
              {currentView === 'dashboard' && <Dashboard entityCount={entities.length} newsCount={news.length} onNavigate={(v) => { setCurrentView(v); window.location.hash = v; }} />}
              {currentView === 'sales' && <SalesIntelligence userProfile={userProfile} />}
              {currentView === 'intake' && <RegistryIntake userProfile={userProfile} />}
              {currentView === 'news' && <NewsIntelligence userProfile={userProfile} initialNews={news} addTask={(t) => setTasks(prev => [t, ...prev])} />}
              {currentView === 'radar' && <ExtractionRadar userProfile={userProfile} addTask={(t) => setTasks(prev => [t, ...prev])} />}
              {currentView === 'annotate' && <NestAnnotate tasks={tasks} commitEntity={(e, tid) => { if (tid) setTasks(prev => prev.filter(t => t.id !== tid)); supabaseService.upsertEntity(e, userProfile.id); }} />}
              {currentView === 'datanest' && <DataNest userProfile={userProfile} entities={entities} />}
              {currentView === 'network' && <ContactGraph />}
              {currentView === 'settings' && <MultiTenant userProfile={userProfile} />}
              {currentView === 'qa_dashboard' && <QADashboard userProfile={userProfile} />}
              {currentView === 'qa_workbench' && <QAWorkbench userProfile={userProfile} onComplete={() => syncData()} />}
            </div>
          </main>
        </div>
      </GeoContext.Provider>
    </ErrorBoundary>
  );
};

export default App;
