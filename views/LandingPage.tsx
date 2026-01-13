import React, { useState, useRef } from 'react';
import { Database, Shield, Zap, Layers, Users, ChevronRight, Globe, Lock, ArrowRight, CheckCircle2, Factory, Monitor, BarChart3, Mail, Building2, FileText, Check, X, Search, Terminal, Activity, ShieldCheck, ChevronDown, KeyRound, Loader2, Sparkles, Cpu, Radar, PenTool, Share2, Network, HelpCircle, AlertCircle, Info, Send, Clock, AlertOctagon, TrendingUp, GitMerge, Brain, ShieldAlert, XCircle, CheckCircle } from 'lucide-react';
import { supabaseService } from '../services/supabaseService';
import { TENANT_NAME } from '../types';

interface Props {
  onSignIn: () => void;
}

const LandingPage: React.FC<Props> = ({ onSignIn }) => {
  const [authMode, setAuthMode] = useState<'LOGIN' | 'SIGNUP' | 'RECOVERY'>('LOGIN');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [form, setForm] = useState({ email: '', password: '', name: '', company: '' });
  const emailInputRef = useRef<HTMLInputElement>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    
    try {
      if (authMode === 'LOGIN') {
        const { data, error: signInError } = await supabaseService.signIn(form.email, form.password);
        if (signInError) {
          if (signInError.message.includes("Email not confirmed")) {
             setError("Handshake Incomplete: Please verify your email via the link sent to your corporate inbox.");
             setShowStatusModal(true);
          } else if (signInError.message.includes("Invalid login credentials")) {
             const existsSomewhere = await supabaseService.checkUserExists(form.email);
             if (existsSomewhere) {
               setError("Identity Locked: Credentials mismatch. If you haven't claimed your profile yet, use the 'Claim Identity' link below.");
             } else {
               setError("Unauthorized Access: This email is not in the verified registry. Contact your system admin for clearance.");
             }
             setShowStatusModal(true);
          } else {
             throw signInError;
          }
          return;
        }
        onSignIn();
      } else if (authMode === 'SIGNUP') {
        const { error: signUpError } = await supabaseService.signUp(form.email, form.password, form.name);
        if (signUpError) {
          // Detect the shadow identity conflict specifically
          if (signUpError.message.includes('Shadow Identity')) {
            setError("Shadow Identity Detected: Your corporate profile is already pre-registered in the AnnoNest registry. Please contact an administrator to 'unlink' your profile for a fresh signup, or try the 'Recovery Protocol' if you have an active auth account.");
          } else {
            setError(signUpError.message);
          }
          setShowStatusModal(true);
          return;
        }
        
        const existsInProfiles = await supabaseService.checkUserExists(form.email);
        
        if (existsInProfiles) {
          setSuccessMsg(`Identity Synchronized. Your existing registry profile has been linked. Check ${form.email} for a verification link.`);
        } else {
          setSuccessMsg(`Identity Registered. Your request has been moved to the Clearance Queue for admin approval. Please check your email to verify your address first.`);
        }
        setShowStatusModal(true);
      } else {
        const { error: resetError } = await supabaseService.resetPassword(form.email);
        if (resetError) throw resetError;
        setSuccessMsg("Recovery protocol triggered. Check your inbox for the reset link.");
        setShowStatusModal(true);
      }
    } catch (e: any) {
      setError(e.message || "Identity Interface Failure.");
      setShowStatusModal(true);
    } finally {
      setLoading(false);
    }
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  const focusForm = () => {
    emailInputRef.current?.focus();
    emailInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 overflow-y-auto custom-scrollbar font-sans selection:bg-blue-500/30">
      {/* Navigation */}
      <nav className="h-24 px-10 border-b border-slate-900 flex items-center justify-between sticky top-0 bg-slate-950/80 backdrop-blur-xl z-50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-xl">
             <Activity className="text-white" size={24} />
          </div>
          <div className="flex flex-col">
            <h1 className="text-2xl font-black tracking-tighter text-white italic leading-none uppercase">
              AnnoNest <span className="text-blue-500 lowercase font-serif italic text-lg">by LabelNest</span>
            </h1>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-1">A data refinery</span>
          </div>
        </div>
        <div className="flex items-center gap-8">
          <button onClick={() => scrollToSection('solution')} className="text-[10px] font-black text-slate-500 hover:text-white transition-colors uppercase tracking-widest">Our Solution</button>
          <button onClick={() => scrollToSection('flow')} className="text-[10px] font-black text-slate-500 hover:text-white transition-colors uppercase tracking-widest">The Flow</button>
          <button onClick={() => scrollToSection('guide')} className="text-[10px] font-black text-slate-500 hover:text-white transition-colors uppercase tracking-widest">Access Guide</button>
          <button onClick={focusForm} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-all text-xs font-black uppercase tracking-widest">Launch Console</button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-[calc(100vh-96px)] flex flex-col items-center justify-center px-10 py-20 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[120px] animate-pulse delay-1000"></div>
        </div>
        
        <div className="max-w-[1400px] w-full mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center relative z-10">
          <div className="flex flex-col items-start">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] mb-8">
              <ShieldCheck size={12} /> Institutional Data Infrastructure
            </div>
            <h1 className="text-7xl font-black text-white italic font-serif leading-[0.9] tracking-tighter mb-6">
              The Intelligence <br/> <span className="text-blue-500">Refinery.</span>
            </h1>
            <p className="max-w-xl text-lg text-slate-400 font-medium leading-relaxed mb-10 italic font-serif">
              A unified operating system for signal ingestion, human-in-the-loop annotation, and relationship mapping.
            </p>
            <button onClick={() => scrollToSection('solution')} className="flex items-center gap-4 text-[11px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-all group">
              Explore the OS Architecture <ChevronDown size={16} className="group-hover:translate-y-1 transition-transform" />
            </button>
          </div>

          <div id="access" className="scroll-mt-24 w-full">
            <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-12 lg:p-16 shadow-3xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-600"></div>
              
              <div className="mb-10">
                <h2 className="text-5xl font-black text-white italic font-serif leading-none tracking-tight mb-4">
                  {authMode === 'LOGIN' ? 'Authorize.' : (authMode === 'RECOVERY' ? 'Recover.' : 'Claim Profile.')}
                </h2>
                <p className="text-slate-500 font-medium text-lg italic leading-relaxed">
                  {authMode === 'LOGIN' ? 'Access the master engine.' : (authMode === 'RECOVERY' ? 'Trigger recovery protocol.' : 'Register or activate your pre-loaded identity.')}
                </p>
              </div>
              
              <form onSubmit={handleAuth} className="space-y-5">
                {authMode === 'SIGNUP' && (
                  <input required placeholder="Full Name" className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-5 text-white font-bold outline-none focus:ring-4 focus:ring-blue-500/10" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                )}
                <input ref={emailInputRef} required type="email" placeholder="Corporate Email" className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-5 text-white font-bold outline-none focus:ring-4 focus:ring-blue-500/10" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                
                {authMode !== 'RECOVERY' && (
                  <input required type="password" placeholder="Password" className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-5 text-white font-bold outline-none focus:ring-4 focus:ring-blue-500/10" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
                )}

                <button type="submit" disabled={loading} className="w-full py-6 bg-blue-600 text-white rounded-3xl font-black uppercase text-sm tracking-[0.2em] hover:bg-blue-500 transition-all shadow-2xl flex items-center justify-center gap-4 active:scale-95">
                  {loading ? <Loader2 className="animate-spin" /> : (authMode === 'LOGIN' ? 'Login' : (authMode === 'RECOVERY' ? 'Execute Recovery' : 'Submit Registry Request'))}
                </button>
                
                <div className="flex flex-col gap-3 mt-6">
                  <button type="button" onClick={() => setAuthMode(authMode === 'LOGIN' ? 'SIGNUP' : 'LOGIN')} className="text-xs font-black text-blue-500 uppercase tracking-widest hover:text-white transition-colors">
                    {authMode === 'LOGIN' ? 'Need to claim your profile?' : 'Return to Authorization console'}
                  </button>
                  {authMode === 'LOGIN' && (
                    <button type="button" onClick={() => setAuthMode('RECOVERY')} className="text-[10px] font-bold text-slate-600 uppercase tracking-widest hover:text-slate-400">
                      Forgot Master Credential?
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Operational Phase Section */}
      <section id="solution" className="px-10 py-40 border-t border-slate-900 scroll-mt-24 overflow-hidden relative">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-20">
          <div className="lg:col-span-4 space-y-10">
            <div>
              <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] mb-4">Our Solution</p>
              <h2 className="text-6xl font-black text-white italic font-serif leading-[0.9] tracking-tighter">
                Data operations <br/> are broken by <br/> <span className="text-blue-500">tool-sprawl.</span>
              </h2>
            </div>
            <p className="text-xl text-slate-500 font-medium italic leading-relaxed font-serif max-w-sm">
              Most organizations today rely on static silos. We unify the entire data lifecycle into a single, high-trust engine.
            </p>
          </div>

          <div className="lg:col-span-8">
            <div className="bg-slate-900/40 border border-slate-800 rounded-[3rem] overflow-hidden shadow-3xl backdrop-blur-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/40 border-b border-slate-800">
                    <th className="px-10 py-8 text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] w-1/4">Operational Phase</th>
                    <th className="px-10 py-8 text-[9px] font-black text-rose-500 uppercase tracking-[0.3em] w-3/8">Today's Silos</th>
                    <th className="px-10 py-8 text-[9px] font-black text-emerald-500 uppercase tracking-[0.3em] w-3/8">The AnnoNest OS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {[
                    { phase: 'Ingestion', silo: 'News in emails, static PDFs', nest: 'Direct pipeline stream ingest' },
                    { phase: 'Extraction', silo: 'Manual copy-pasting', nest: 'Gemini AI-driven field mapping' },
                    { phase: 'Verification', silo: 'Unlogged spot-checks', nest: 'Structured human-in-the-loop QA' },
                    { phase: 'Registry', silo: 'Fragmented CSV rows', nest: 'Institutional master records' }
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-white/5 transition-colors group">
                      <td className="px-10 py-8">
                        <span className="text-xs font-black text-slate-300 uppercase tracking-tighter italic font-serif">{row.phase}</span>
                      </td>
                      <td className="px-10 py-8">
                        <div className="flex items-start gap-4">
                          <XCircle size={16} className="text-rose-500/40 mt-1 shrink-0" />
                          <p className="text-sm text-slate-500 font-medium italic leading-relaxed">{row.silo}</p>
                        </div>
                      </td>
                      <td className="px-10 py-8 bg-emerald-500/5">
                        <div className="flex items-start gap-4">
                          <CheckCircle size={16} className="text-emerald-500 mt-1 shrink-0" />
                          <p className="text-sm text-slate-300 font-bold leading-relaxed">{row.nest}</p>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Guide Section */}
      <section id="guide" className="px-10 py-40 scroll-mt-24">
        <div className="max-w-4xl mx-auto space-y-20">
          <div className="text-center space-y-6">
             <h2 className="text-5xl font-black text-white italic font-serif uppercase">Access Protocol.</h2>
             <p className="text-slate-500 text-lg italic">The AnnoNest OS is a gated environment. Follow these steps to authorize.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
             <div className="space-y-6 p-10 bg-slate-900 border border-slate-800 rounded-[3rem] hover:border-blue-500/30 transition-all group shadow-2xl">
                <div className="w-14 h-14 bg-blue-600/10 text-blue-500 rounded-2xl flex items-center justify-center font-black group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner italic font-serif text-2xl">01</div>
                <h3 className="text-2xl font-black text-white italic font-serif">Identify</h3>
                <p className="text-sm text-slate-500 italic leading-relaxed">Sign up using your corporate credentials to be indexed in the system.</p>
             </div>
             <div className="space-y-6 p-10 bg-slate-900 border border-slate-800 rounded-[3rem] hover:border-emerald-500/30 transition-all group shadow-2xl">
                <div className="w-14 h-14 bg-emerald-600/10 text-emerald-500 rounded-2xl flex items-center justify-center font-black group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-inner italic font-serif text-2xl">02</div>
                <h3 className="text-2xl font-black text-white italic font-serif">Verify</h3>
                <p className="text-sm text-slate-500 italic leading-relaxed">A verification link will be dispatched to your inbox to secure the handshake.</p>
             </div>
             <div className="space-y-6 p-10 bg-slate-900 border border-slate-800 rounded-[3rem] hover:border-indigo-500/30 transition-all group shadow-2xl">
                <div className="w-14 h-14 bg-indigo-600/10 text-indigo-500 rounded-2xl flex items-center justify-center font-black group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner italic font-serif text-2xl">03</div>
                <h3 className="text-2xl font-black text-white italic font-serif">Clearance</h3>
                <p className="text-sm text-slate-500 italic leading-relaxed">System administrators will audit your request and assign a functional role.</p>
             </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-10 py-20 border-t border-slate-900 bg-slate-950">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg">
               <Activity className="text-white" size={16} />
            </div>
            <span className="text-sm font-black tracking-tighter text-white italic uppercase">AnnoNest</span>
          </div>
          <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.2em]">Build by LabelNest India Private Limited</p>
        </div>
      </footer>

      {showStatusModal && (
        <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-10 animate-in fade-in">
           <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-16 max-w-xl w-full shadow-3xl relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-full h-2 ${error ? 'bg-rose-600' : 'bg-emerald-600'}`}></div>
              <div className="flex flex-col items-center text-center space-y-8">
                 <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center ${error ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                    {error ? <ShieldAlert size={40} /> : <CheckCircle2 size={40} />}
                 </div>
                 <div className="space-y-4">
                    <h3 className="text-3xl font-black text-white italic font-serif">{error ? 'Identity Error' : 'Handshake Initiated'}</h3>
                    <p className="text-slate-500 italic leading-relaxed">{error || successMsg}</p>
                 </div>
                 <button onClick={() => setShowStatusModal(false)} className="w-full py-4 bg-slate-800 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-700 transition-all">Continue</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;