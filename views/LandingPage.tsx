
import React, { useState, useRef, useEffect } from 'react';
import { 
  Database, ShieldCheck, Zap, Layers, Users, Globe, ArrowRight, 
  CheckCircle2, Monitor, FileText, ChevronDown, Loader2, 
  Sparkles, Cpu, ShieldAlert, XCircle, Video, HardDrive, GitMerge,
  Sun, Moon, Shield, Box, Activity, Landmark, Network, Target,
  Fingerprint, Search, ShieldCheck as VerifiedIcon, Workflow, Building2
} from 'lucide-react';
import { supabaseService } from '../services/supabaseService';
import { AnnoNestLogo } from '../App';

interface Props {
  onSignIn: () => void;
}

const LandingPage: React.FC<Props> = ({ onSignIn }) => {
  const [authMode, setAuthMode] = useState<'LOGIN' | 'SIGNUP' | 'RECOVERY'>('LOGIN');
  const [loading, setLoading] = useState(false);
  const [tenants, setTenants] = useState<{id: string, name: string}[]>([]);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [error, setError] = useState<string | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [form, setForm] = useState({ email: '', password: '', name: '', tenantId: '' });
  const emailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    
    // Fetch available tenants for signup
    const loadSegments = async () => {
      const data = await supabaseService.fetchAllTenants();
      setTenants(data);
    };
    loadSegments();
  }, [theme]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (authMode === 'LOGIN') {
        const { error: err } = await supabaseService.signIn(form.email, form.password);
        if (err) throw err;
        onSignIn();
      } else if (authMode === 'SIGNUP') {
        if (!form.tenantId) throw new Error("Please select an institutional segment.");
        const res = await supabaseService.signUp(form.email, form.password, form.name, form.tenantId);
        if (res.error) throw res.error;
        setSuccessMsg(`Provisioning Node Success. Handshake requested for ${form.email}. Check inbox to activate.`);
        setShowStatusModal(true);
      } else {
        const { error: err } = await supabaseService.resetPassword(form.email);
        if (err) throw err;
        setSuccessMsg("Master Reset Protocol triggered. Check inbox.");
        setShowStatusModal(true);
      }
    } catch (e: any) {
      setError(e.message || "Identity Interface Fault.");
      setShowStatusModal(true);
    } finally {
      setLoading(false);
    }
  };

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div className="h-screen bg-app-bg dark:bg-app-bg-dark text-text-primary dark:text-text-primary-dark overflow-y-auto custom-scrollbar font-sans selection:bg-accent-primary/30 transition-colors duration-200">
      
      {/* HUD NAVIGATION */}
      <nav className="h-24 px-10 border-b border-border-ui dark:border-border-ui flex items-center justify-between sticky top-0 bg-app-bg/80 dark:bg-app-bg-dark/80 backdrop-blur-xl z-[100]">
        <div className="flex items-center gap-5">
          <div className="w-12 h-12 bg-accent-primary rounded-2xl flex items-center justify-center shadow-blue">
             <AnnoNestLogo className="text-white" size={28} />
          </div>
          <div className="flex flex-col">
            <h1 className="text-2xl font-black tracking-tighter text-text-primary dark:text-white italic leading-none uppercase">AnnoNest</h1>
            <span className="text-[9px] font-black text-text-muted uppercase tracking-[0.4em] mt-1">Institutional Intelligence OS</span>
          </div>
        </div>
        <div className="flex items-center gap-10">
          <div className="hidden lg:flex items-center gap-10">
            <button onClick={() => scrollTo('fuel')} className="text-[10px] font-black text-text-secondary hover:text-accent-primary uppercase tracking-widest transition-colors">The Fuel</button>
            <button onClick={() => scrollTo('assembly')} className="text-[10px] font-black text-text-secondary hover:text-accent-primary uppercase tracking-widest transition-colors">The Assembly</button>
            <button onClick={() => scrollTo('ecosystem')} className="text-[10px] font-black text-text-secondary hover:text-accent-primary uppercase tracking-widest transition-colors">The Ecosystem</button>
            <button onClick={() => scrollTo('matrix')} className="text-[10px] font-black text-text-secondary hover:text-accent-primary uppercase tracking-widest transition-colors">The Matrix</button>
          </div>
          <div className="h-8 w-px bg-border-ui mx-2"></div>
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-3 bg-card-panel dark:bg-card-panel-dark border border-border-ui rounded-xl text-text-secondary hover:text-accent-primary transition-all">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button onClick={() => emailInputRef.current?.focus()} className="px-8 py-3 bg-accent-primary text-white rounded-xl hover:brightness-110 shadow-blue transition-all text-xs font-black uppercase tracking-widest">
            Launch OS
          </button>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative min-h-[calc(100vh-96px)] flex flex-col items-center justify-center px-10 py-20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-accent-primary/10 rounded-full blur-[140px] animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-accent-signal/5 rounded-full blur-[140px]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(#1C2A44_1px,transparent_1px)] [background-size:40px_40px] opacity-[0.05]"></div>
        </div>
        
        <div className="max-w-[1400px] w-full mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center relative z-10">
          <div className="flex flex-col items-start animate-in slide-in-from-left duration-700">
            <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-accent-primary/10 border border-accent-primary/20 rounded-full text-accent-primary text-[11px] font-black uppercase tracking-[0.2em] mb-10 shadow-sm">
              <ShieldCheck size={14} /> Intelligence-First Infrastructure
            </div>
            <h1 className="text-8xl font-black text-text-primary dark:text-white italic font-serif leading-[0.85] tracking-tighter mb-8 uppercase">
              The Intelligence <br/> <span className="text-accent-primary">Refinery.</span>
            </h1>
            <p className="max-w-xl text-2xl text-text-secondary dark:text-slate-300 font-medium leading-relaxed mb-12 italic font-serif">
              Where unstructured data sequences are synthesized into verified, auditable, institutional truth.
            </p>
            <div className="flex items-center gap-10">
               <button onClick={() => scrollTo('fuel')} className="flex items-center gap-4 text-[12px] font-black uppercase tracking-[0.2em] text-text-muted hover:text-text-primary transition-all group">
                 Explore Architecture <ChevronDown size={18} className="group-hover:translate-y-1 transition-transform" />
               </button>
            </div>
          </div>

          <div className="w-full animate-in zoom-in-95 duration-1000">
            <div className="bg-card-panel dark:bg-card-panel-dark border border-border-ui rounded-[4rem] p-12 lg:p-20 shadow-3xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-2 bg-accent-primary shadow-blue"></div>
              <h2 className="text-6xl font-black text-text-primary dark:text-white italic font-serif leading-none tracking-tight mb-4 uppercase">
                {authMode === 'LOGIN' ? 'Authorize.' : 'Initialize.'}
              </h2>
              <p className="text-text-muted text-sm font-medium italic mb-10">Identity handshake required for refinery access.</p>
              
              <form onSubmit={handleAuth} className="space-y-6">
                {authMode === 'SIGNUP' && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-4 italic">Full Legal Identity</label>
                       <input required className="w-full bg-elevated dark:bg-[#070B14] border border-border-ui rounded-2xl px-6 py-5 text-text-primary dark:text-white font-bold outline-none focus:ring-4 focus:ring-accent-primary/10 transition-all font-serif italic" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-4 italic">Institutional Segment</label>
                       <div className="relative group">
                          <Building2 className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-700 pointer-events-none" size={20} />
                          <select 
                            required 
                            className="w-full bg-elevated dark:bg-[#070B14] border border-border-ui rounded-2xl pl-16 pr-6 py-5 text-text-primary dark:text-white font-bold outline-none focus:ring-4 focus:ring-accent-primary/10 transition-all italic font-serif appearance-none cursor-pointer"
                            value={form.tenantId}
                            onChange={e => setForm({...form, tenantId: e.target.value})}
                          >
                             <option value="" disabled>Select Workspace Segment...</option>
                             {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                          </select>
                       </div>
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-4 italic">Master Node (Email)</label>
                   <input ref={emailInputRef} required type="email" placeholder="email@institutional.com" className="w-full bg-elevated dark:bg-[#070B14] border border-border-ui rounded-2xl px-6 py-5 text-text-primary dark:text-white font-bold outline-none focus:ring-4 focus:ring-accent-primary/10 transition-all italic font-serif" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                </div>
                {authMode !== 'RECOVERY' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-4 italic">Secret Sequence (Password)</label>
                    <input required type="password" placeholder="••••••••" className="w-full bg-elevated dark:bg-[#070B14] border border-border-ui rounded-2xl px-6 py-5 text-text-primary dark:text-white font-bold outline-none focus:ring-4 focus:ring-accent-primary/10 transition-all" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
                  </div>
                )}
                <button type="submit" disabled={loading} className="w-full py-8 mt-4 bg-accent-primary text-white rounded-[2rem] font-black uppercase text-base tracking-[0.4em] shadow-blue hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-6">
                  {loading ? <Loader2 className="animate-spin" size={24} /> : (authMode === 'LOGIN' ? <>Access Console <ArrowRight size={20}/></> : 'Deploy Identity Node')}
                </button>
                <div className="flex flex-col items-center gap-4 mt-8 pt-8 border-t border-border-ui">
                  <button type="button" onClick={() => setAuthMode(authMode === 'LOGIN' ? 'SIGNUP' : 'LOGIN')} className="text-[10px] font-black text-accent-primary uppercase tracking-[0.2em] hover:text-text-primary transition-colors italic">
                    {authMode === 'LOGIN' ? 'Register New Specialist' : 'Return to Authorization'}
                  </button>
                  {authMode === 'LOGIN' && (
                    <button type="button" onClick={() => setAuthMode('RECOVERY')} className="text-[9px] font-black text-text-muted uppercase tracking-widest hover:text-text-primary">Recover master key</button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 1: THE FUEL */}
      <section id="fuel" className="py-40 px-10 border-t border-border-ui bg-card-panel dark:bg-card-panel-dark transition-colors">
        <div className="max-w-[1400px] mx-auto">
          <div className="mb-24 flex flex-col md:flex-row md:items-end justify-between gap-10">
             <div className="space-y-6">
                <h2 className="text-7xl font-black text-text-primary dark:text-white italic font-serif uppercase tracking-tighter">The Fuel.</h2>
                <p className="text-2xl text-text-secondary italic font-medium max-w-xl">Raw ingestion signals that power the institutional matrix.</p>
             </div>
             <div className="flex items-center gap-4 px-8 py-4 bg-app-bg dark:bg-app-bg-dark rounded-2xl border border-border-ui">
                <Activity size={20} className="text-accent-primary" />
                <span className="text-[10px] font-black uppercase tracking-widest italic">Signal Pulse: active</span>
             </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Globe, title: 'Web Scraping', desc: 'Autonomous crawlers tracking global firm news-wires and institutional disclosures.', color: 'blue' },
              { icon: FileText, title: 'Legal Filings', desc: 'Structural parsing of SEC, 13F, and complex regulatory artifacts with precision extraction.', color: 'emerald' },
              { icon: Video, title: 'Multi-Modal', desc: 'AI-driven processing of video interviews, podcasts, and bio-presentations into atomic data.', color: 'amber' },
              { icon: HardDrive, title: 'Legacy Registries', desc: 'Mass digitization and normalization of historical datasets into canonical identity nodes.', color: 'indigo' }
            ].map((node, i) => (
              <div key={i} className="bg-app-bg dark:bg-app-bg-dark border border-border-ui p-12 rounded-[3.5rem] space-y-10 group shadow-lg hover:border-accent-primary transition-all relative overflow-hidden">
                <div className="absolute -right-4 -top-4 opacity-[0.03] text-text-primary dark:text-white group-hover:scale-110 transition-transform"><node.icon size={180}/></div>
                <div className="w-16 h-16 bg-card-panel dark:bg-card-panel-dark border border-border-ui rounded-2xl flex items-center justify-center text-accent-primary group-hover:bg-accent-primary group-hover:text-white transition-all shadow-inner">
                  <node.icon size={28} />
                </div>
                <div className="space-y-4 relative z-10">
                  <h4 className="text-3xl font-black text-text-primary dark:text-white italic font-serif uppercase tracking-tight">{node.title}</h4>
                  <p className="text-text-secondary text-base italic font-medium leading-relaxed">{node.desc}</p>
                </div>
                <div className="pt-6 border-t border-border-ui relative z-10">
                   <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Handshake: Secured</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 2: THE ASSEMBLY (REFINERY PIPELINE) */}
      <section id="assembly" className="py-40 px-10 bg-app-bg dark:bg-[#020617] border-t border-border-ui overflow-hidden">
        <div className="max-w-[1400px] mx-auto space-y-24">
           <div className="flex flex-col items-center text-center space-y-6">
              <h2 className="text-7xl font-black text-text-primary dark:text-white italic font-serif uppercase tracking-tighter">The Assembly.</h2>
              <p className="text-2xl text-text-secondary italic font-medium max-w-2xl">A four-stage extraction cycle that transforms signals into intelligence.</p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
              {[
                { step: '01', title: 'Extraction', icon: Cpu, desc: 'Gemini 3 Pro parsing complex PDFs and web structures into atomic JSON kernels.', color: 'blue' },
                { step: '02', title: 'Normalization', icon: Workflow, desc: 'De-duplication and canonical node mapping across multiple disparate signals.', color: 'indigo' },
                { step: '03', title: 'Verification', icon: Search, desc: 'Human-in-the-loop audit plane ensuring 99.9% precision on core institutional data.', color: 'emerald' },
                { step: '04', title: 'Promotion', icon: Zap, desc: 'Final promoting of data to the DataNest Master Registry for institutional consumption.', color: 'amber' }
              ].map((item, i) => (
                <div key={i} className="relative group">
                   <div className="mb-10 flex items-center gap-6">
                      <span className="text-6xl font-black text-accent-primary/20 italic font-serif">{item.step}</span>
                      <div className="h-px flex-1 bg-border-ui"></div>
                   </div>
                   <div className="space-y-6">
                      <div className="w-12 h-12 bg-accent-primary/10 rounded-xl flex items-center justify-center text-accent-primary"><item.icon size={24}/></div>
                      <h4 className="text-3xl font-black text-text-primary dark:text-white italic font-serif uppercase">{item.title}</h4>
                      <p className="text-text-secondary italic leading-relaxed">{item.desc}</p>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </section>

      {/* SECTION 3: THE ECOSYSTEM (NETWORK INTEL) */}
      <section id="ecosystem" className="py-40 px-10 border-t border-border-ui bg-card-panel dark:bg-card-panel-dark transition-colors">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-32 items-center">
             <div className="space-y-12">
                <div className="space-y-6">
                   <h2 className="text-7xl font-black text-text-primary dark:text-white italic font-serif uppercase tracking-tighter leading-none">The <br/><span className="text-accent-signal">Ecosystem.</span></h2>
                   <p className="text-3xl text-text-secondary italic font-medium leading-tight">Beyond static data — mapping the <span className="text-text-primary dark:text-white">Living Institutional Network.</span></p>
                </div>
                
                <div className="space-y-8">
                   {[
                     { icon: Network, title: '3L Network Traversal', desc: 'Uncover hidden influence through legacy roles and past institutional associations.' },
                     { icon: GitMerge, title: 'Handshake Discovery', desc: 'Identify reinforced relationships through co-investment and shared board seats.' },
                     { icon: Target, title: 'Institutional Gravity', desc: 'Automatically rank entities by network centrality and capital involvement.' }
                   ].map((feature, i) => (
                     <div key={i} className="flex gap-8 group">
                        <div className="w-12 h-12 bg-app-bg dark:bg-app-bg-dark border border-border-ui rounded-xl flex items-center justify-center text-accent-signal group-hover:bg-accent-signal group-hover:text-white transition-all shadow-lg shrink-0"><feature.icon size={22}/></div>
                        <div className="space-y-2">
                           <h5 className="text-xl font-black text-text-primary dark:text-white uppercase italic tracking-tight">{feature.title}</h5>
                           <p className="text-text-secondary italic font-medium leading-relaxed">{feature.desc}</p>
                        </div>
                     </div>
                   ))}
                </div>
             </div>

             <div className="relative">
                <div className="absolute inset-0 bg-accent-signal/5 blur-[120px] rounded-full animate-pulse"></div>
                <div className="bg-app-bg dark:bg-[#020617] border border-border-ui rounded-[4rem] p-12 shadow-3xl relative overflow-hidden">
                   <div className="flex justify-between items-center mb-10 pb-6 border-b border-border-ui">
                      <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.4em]">Gravity View v1.3</span>
                      <Activity size={16} className="text-accent-signal animate-pulse" />
                   </div>
                   <div className="space-y-8">
                      <div className="h-4 bg-accent-primary/20 rounded-full w-3/4"></div>
                      <div className="h-4 bg-accent-signal/20 rounded-full w-1/2"></div>
                      <div className="h-4 bg-accent-primary/20 rounded-full w-2/3"></div>
                      <div className="grid grid-cols-2 gap-6 pt-10">
                         <div className="p-6 bg-card-panel dark:bg-card-panel-dark border border-border-ui rounded-[2rem]">
                            <p className="text-[8px] font-black text-text-muted uppercase mb-2">Centrality</p>
                            <p className="text-2xl font-black text-white italic font-serif">Alpha Node</p>
                         </div>
                         <div className="p-6 bg-card-panel dark:bg-card-panel-dark border border-border-ui rounded-[2rem]">
                            <p className="text-[8px] font-black text-text-muted uppercase mb-2">Exposure</p>
                            <p className="text-2xl font-black text-accent-signal italic font-serif">Critical</p>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: THE MATRIX (COMPARISON) */}
      <section id="matrix" className="py-40 px-10 bg-app-bg dark:bg-[#020617] transition-colors">
        <div className="max-w-[1400px] mx-auto space-y-24">
           <div className="text-center space-y-8 max-w-4xl mx-auto">
              <div className="w-16 h-px bg-accent-primary mx-auto"></div>
              <h2 className="text-8xl font-black text-text-primary dark:text-white italic font-serif uppercase tracking-tighter">The Matrix.</h2>
              <p className="text-3xl text-text-secondary italic font-medium leading-tight">
                 Institutional grade data requires a <span className="text-text-primary dark:text-white underline decoration-accent-primary decoration-4">Refinery</span>, not a spreadsheet.
              </p>
           </div>

           <div className="bg-card-panel dark:bg-card-panel-dark border border-border-ui rounded-[4rem] overflow-hidden shadow-4xl relative">
              <div className="absolute inset-0 bg-accent-primary/[0.02] pointer-events-none"></div>
              <table className="w-full text-left border-collapse relative z-10">
                 <thead>
                    <tr className="bg-app-bg/50 dark:bg-app-bg-dark/50 border-b border-border-ui">
                       <th className="px-14 py-12 text-[11px] font-black text-text-muted uppercase tracking-[0.6em]">System Capability</th>
                       <th className="px-10 py-12 text-[11px] font-black text-text-muted uppercase tracking-center border-l border-border-ui text-center italic">Manual / Legacy</th>
                       <th className="px-10 py-12 text-[11px] font-black text-accent-primary uppercase tracking-center bg-accent-primary/[0.03] border-l border-border-ui text-center italic font-bold">AnnoNest Refinery</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-border-ui">
                    {[
                      { f: 'Identity Node Triangulation', m: false, a: true, info: 'Merging 4+ sources into one canonical node.' },
                      { f: '3L Network Traversal', m: false, a: true, info: 'Mapping legacy roles and hidden influence.' },
                      { f: 'Multi-Modal Contextual Ingestion', m: 'Restricted', a: 'Native', info: 'Direct processing of video/audio artifacts.' },
                      { f: 'Immutable Verification Trace', m: 'Manual', a: 'Digital Handshake', info: 'Full audit logs for every data point.' },
                      { f: 'Operational Gravity Analysis', m: false, a: true, info: 'Real-time ranking of institutional power.' }
                    ].map((row, i) => (
                      <tr key={i} className="hover:bg-accent-primary/[0.01] transition-colors group">
                         <td className="px-14 py-10">
                            <div className="space-y-1">
                               <p className="text-2xl font-black text-text-primary dark:text-white italic font-serif uppercase tracking-tight leading-none">{row.f}</p>
                               <p className="text-[11px] text-text-muted font-medium italic opacity-0 group-hover:opacity-100 transition-opacity">"{row.info}"</p>
                            </div>
                         </td>
                         <td className="px-10 py-10 text-center border-l border-border-ui">
                            {row.m === true ? <CheckCircle2 className="text-emerald-500 mx-auto" size={28} /> : row.m === false ? <XCircle className="text-text-muted opacity-20 mx-auto" size={28} /> : <span className="text-[12px] font-black uppercase text-text-muted italic">{row.m}</span>}
                         </td>
                         <td className="px-10 py-10 text-center bg-accent-primary/[0.02] border-l border-border-ui">
                            {row.a === true ? <CheckCircle2 className="text-accent-primary mx-auto drop-shadow-blue" size={32} /> : <span className="text-[12px] font-black uppercase text-accent-primary italic">{row.a}</span>}
                         </td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>
           
           <div className="flex flex-col md:flex-row items-center justify-between p-16 bg-accent-primary rounded-[3rem] text-white shadow-blue">
              <div className="space-y-4 mb-10 md:mb-0">
                 <h4 className="text-5xl font-black italic font-serif uppercase leading-none tracking-tighter">Secure Your Segment.</h4>
                 <p className="text-xl font-medium italic opacity-90">Authorize today to begin your institutional mapping cycle.</p>
              </div>
              <button onClick={() => { emailInputRef.current?.focus(); scrollTo('top'); }} className="px-16 py-6 bg-white text-accent-primary rounded-2xl font-black uppercase text-base tracking-[0.3em] shadow-2xl hover:scale-105 transition-all active:scale-95">
                 Initialize Handshake
              </button>
           </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-20 px-10 border-t border-border-ui bg-card-panel dark:bg-card-panel-dark text-center transition-colors">
         <div className="max-w-[1400px] mx-auto space-y-12">
            <div className="flex justify-center items-center gap-4">
               <div className="w-8 h-8 bg-accent-primary rounded-lg flex items-center justify-center">
                  <AnnoNestLogo className="text-white" size={18} />
               </div>
               <h3 className="text-lg font-black italic uppercase tracking-widest text-text-primary dark:text-white">AnnoNest OS</h3>
            </div>
            <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.5em] italic">
               © 2025 LabelNest Institutional Data Infrastructure — All Nodes Secured
            </p>
         </div>
      </footer>

      {/* STATUS MODALS */}
      {showStatusModal && (
        <div className="fixed inset-0 z-[200] bg-[#070B14]/95 backdrop-blur-xl flex items-center justify-center p-10 animate-in fade-in">
           <div className="bg-card-panel dark:bg-card-panel-dark border border-border-ui rounded-[3rem] p-16 max-w-xl w-full shadow-3xl text-center space-y-8 relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-full h-2 ${error ? 'bg-accent-signal' : 'bg-emerald-600'}`}></div>
              <div className={`w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto ${error ? 'bg-accent-signal/10 text-accent-signal' : 'bg-emerald-500/10 text-emerald-500'}`}>
                {error ? <ShieldAlert size={48} /> : <CheckCircle2 size={48} />}
              </div>
              <div className="space-y-4">
                 <h3 className="text-4xl font-black text-text-primary dark:text-white italic font-serif uppercase tracking-tight">{error ? 'Identity Error' : 'Handshake Success'}</h3>
                 <p className="text-lg text-text-secondary italic font-medium leading-relaxed">{error || successMsg}</p>
              </div>
              <button onClick={() => setShowStatusModal(false)} className="w-full py-5 bg-elevated dark:bg-[#070B14] border border-border-ui text-text-primary dark:text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-accent-primary hover:text-white transition-all">Proceed to Authorized Mode</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
