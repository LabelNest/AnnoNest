
import React, { useState } from 'react';
import { 
  BookOpen, Code2, Database, Zap, ShieldCheck, 
  Terminal, Workflow, Info, ChevronRight, Server,
  Cpu, Layout, FileText, Search, GitMerge, Fingerprint,
  Layers, HardDrive, Network, Target, Box,
  // Fix: Added missing Globe and Sparkles imports from lucide-react
  Globe, Sparkles
} from 'lucide-react';

// Fixed Icon definition for the manual sections moved to top to avoid TDZ issues
const Brain = ({ className, size }: { className?: string, size?: number }) => (
  <Sparkles className={className} size={size} />
);

const Manual: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'USER' | 'BACKEND' | 'API'>('USER');

  const SectionNav = ({ id, label, icon: Icon }: any) => (
    <button 
      onClick={() => setActiveSection(id)}
      className={`px-10 py-5 border-b-2 transition-all flex items-center gap-4 ${activeSection === id ? 'border-accent-primary bg-accent-primary/5 text-white' : 'border-transparent text-slate-500 hover:text-white'}`}
    >
      <Icon size={18} />
      <span className="text-[11px] font-black uppercase tracking-widest">{label}</span>
    </button>
  );

  return (
    <div className="space-y-12 max-w-[1400px] mx-auto pb-40 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-10 border-b border-slate-800 pb-16">
        <div className="space-y-6">
          <h1 className="text-8xl font-black flex items-center gap-10 text-white tracking-tighter uppercase italic font-serif leading-none">
            <BookOpen className="text-accent-primary shrink-0" size={80} />
            Foundation
          </h1>
          <p className="text-text-secondary font-medium text-xl italic flex items-center gap-4">
             <Terminal size={26} className="text-accent-primary" /> Operational Manual — <span className="text-accent-primary font-black uppercase text-xs tracking-[0.4em] bg-accent-primary/10 px-6 py-2 rounded-full border border-accent-primary/20 shadow-2xl italic">LabelNest OS v1.0 Canon</span>
          </p>
        </div>
      </header>

      <nav className="flex bg-slate-900/40 border-b border-slate-800 sticky top-0 z-50 backdrop-blur-xl">
         <SectionNav id="USER" label="Specialist Workflow" icon={Workflow} />
         <SectionNav id="BACKEND" label="Backend Schematics" icon={Database} />
         <SectionNav id="API" label="AI Protocol (Gemini)" icon={Brain} />
      </nav>

      {activeSection === 'USER' && (
        <div className="space-y-24 animate-in slide-in-from-bottom-8 duration-500">
           {/* PIPELINE OVERVIEW */}
           <section className="space-y-12">
              <h2 className="text-5xl font-black text-white italic font-serif uppercase tracking-tight flex items-center gap-6">
                 <Zap className="text-amber-500" /> The Signal-to-Registry Loop
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                 {[
                   { step: '01', title: 'Signal Ingest', desc: 'Raw data enters via Radar (News), Intake (Manual), or Ingest Terminal (Multi-Modal).', icon: Globe },
                   { step: '02', title: 'Task Routing', icon: GitMerge, desc: 'Signals are promoted to the Task Cockpit where specialists are bound to the node.' },
                   { step: '03', title: 'Refinery', icon: Cpu, desc: 'Analysts use Specialized Hubs (Image, Sonic, Text) to extract atomic truth.' },
                   { step: '04', title: 'Clearance', icon: ShieldCheck, desc: 'Quality Control managers perform a field-level audit before promoting to Master Registry.' }
                 ].map((s, i) => (
                   <div key={i} className="bg-slate-900 border border-slate-800 p-10 rounded-[3rem] space-y-6 relative overflow-hidden group">
                      <div className="absolute -right-4 -top-4 opacity-5 text-accent-primary group-hover:scale-110 transition-transform"><s.icon size={140}/></div>
                      <span className="text-4xl font-black italic font-serif text-accent-primary/30">{s.step}</span>
                      <h4 className="text-2xl font-black text-white italic font-serif uppercase tracking-tight">{s.title}</h4>
                      <p className="text-sm text-slate-400 italic leading-relaxed">{s.desc}</p>
                   </div>
                 ))}
              </div>
           </section>

           <section className="grid grid-cols-1 lg:grid-cols-2 gap-16">
              <div className="bg-[#0E1626] border border-slate-800 p-12 rounded-[4rem] space-y-10 shadow-3xl">
                 <h3 className="text-3xl font-black text-white italic font-serif uppercase tracking-tight flex items-center gap-4"><Target size={24} className="text-blue-500"/> Core Modules</h3>
                 <div className="space-y-8">
                    {[
                      { m: 'DataNest', d: 'The Master Registry. Global source of truth for Firms and Institutions.' },
                      { m: 'Diaspora', d: 'Personnel Intel. Tracking professional lineage across multiple firms.' },
                      { m: 'NestAnnotate', d: 'Multi-Modal Hub. Specialized planes for Image, Video, and Audio labeling.' },
                      { m: 'News Cockpit', d: 'Radar Monitor. Routing external signal volatility into internal work streams.' }
                    ].map((item, i) => (
                      <div key={i} className="flex gap-8 group">
                         <div className="w-12 h-12 bg-slate-950 rounded-xl flex items-center justify-center text-accent-primary shadow-inner shrink-0 group-hover:scale-110 transition-transform"><Box size={22}/></div>
                         <div>
                            <h5 className="text-lg font-black text-white italic uppercase tracking-tight">{item.m}</h5>
                            <p className="text-sm text-slate-500 italic mt-1">{item.d}</p>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>

              <div className="bg-emerald-600/5 border border-emerald-500/20 p-12 rounded-[4rem] space-y-10 shadow-3xl">
                 <h3 className="text-3xl font-black text-emerald-500 italic font-serif uppercase tracking-tight flex items-center gap-4"><ShieldCheck size={24}/> Integrity Rules</h3>
                 <div className="space-y-8">
                    {[
                      { r: 'Mandatory Rationale', d: 'Every registry mutation (edit) requires a justification ledger entry.' },
                      { r: 'Unique Signatures', d: 'Contact emails and Firm URLs are unique nodes. No duplicates in kernel.' },
                      { r: 'Audit Weighting', d: 'Quality scores are calculated based on field weights (C-Level Title > City Name).' },
                      { r: 'Project Context', d: 'Tasks and QA reviews are bound to specific projects for cost-tracking.' }
                    ].map((item, i) => (
                      <div key={i} className="flex gap-8 group">
                         <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500 shadow-inner shrink-0 group-hover:scale-110 transition-transform"><Info size={22}/></div>
                         <div>
                            <h5 className="text-lg font-black text-white italic uppercase tracking-tight">{item.r}</h5>
                            <p className="text-sm text-slate-500 italic mt-1">{item.d}</p>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
           </section>
        </div>
      )}

      {/* Correcting activeTab to activeSection to fix Cannot find name 'activeTab' */}
      {activeSection === 'BACKEND' && (
        <div className="space-y-16 animate-in fade-in duration-500">
           <div className="bg-slate-950 border border-slate-800 rounded-[4rem] p-16 shadow-4xl space-y-12">
              <div className="flex justify-between items-center border-b border-slate-900 pb-10">
                 <div className="space-y-2">
                    <h3 className="text-4xl font-black text-white italic font-serif uppercase tracking-tight flex items-center gap-4"><Database size={32} className="text-accent-primary"/> System ERD Map</h3>
                    <p className="text-slate-500 italic">Supabase Table assignments for Module Integrity.</p>
                 </div>
                 <div className="px-6 py-2 bg-accent-primary/10 border border-accent-primary/20 rounded-full text-accent-primary text-[10px] font-black uppercase tracking-[0.4em] italic shadow-blue">RELATION_MAP_V2</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                 {[
                   { mod: 'Master Registry', table: 'entities', p: 'id (uuid)', cols: 'name, type, tenant_id, last_updated_by' },
                   { mod: 'Contact Graph', table: 'entities_persons', p: 'id (uuid)', cols: 'full_name, current_firm, primary_email' },
                   { mod: 'Handshake Matrix', table: 'relationships', p: 'id (uuid)', cols: 'source_id, target_id, relationship_type' },
                   { mod: 'Pulse Stream', table: 'news', p: 'id (uuid)', cols: 'headline, source_name, processing_status' },
                   { mod: 'Execution Matrix', table: 'tasks', p: 'id (uuid)', cols: 'assigned_to, status, task_category, project_id' },
                   { mod: 'Multi-Modal Artifacts', table: 'annotation_tasks', p: 'id (uuid)', cols: 'module, asset_url, metadata (jsonb)' },
                   { mod: 'Audit Ledger', table: 'qa_reviews', p: 'id (uuid)', cols: 'qc_status, overall_score, review_json (jsonb)' },
                   { mod: 'Python Bridge', table: 'extraction_queue', p: 'id (uuid)', cols: 'url, status (QUEUED|RUNNING|DONE)' }
                 ].map((t, i) => (
                   <div key={i} className="p-8 bg-slate-900/40 border border-slate-800 rounded-[2.5rem] hover:border-accent-primary/20 transition-all group">
                      <div className="flex justify-between items-center mb-6">
                         <span className="text-[10px] font-black text-accent-primary uppercase tracking-widest italic">{t.mod}</span>
                         <span className="px-3 py-1 bg-slate-950 rounded-lg text-[9px] font-mono text-emerald-500 border border-emerald-500/20">TABLE: {t.table}</span>
                      </div>
                      <div className="space-y-4">
                         <div className="flex items-center gap-3">
                            <Fingerprint size={14} className="text-slate-700"/>
                            <span className="text-[10px] font-mono text-slate-500">PK: {t.p}</span>
                         </div>
                         <div className="flex items-center gap-3">
                            <Layers size={14} className="text-slate-700"/>
                            <span className="text-[10px] font-mono text-slate-400">COLS: {t.cols}</span>
                         </div>
                      </div>
                   </div>
                 ))}
              </div>
           </div>

           <div className="bg-[#020617] border border-slate-800 rounded-[4rem] p-16 space-y-12">
              <h3 className="text-3xl font-black text-white italic font-serif uppercase tracking-tight flex items-center gap-4"><Server size={28} className="text-blue-500"/> Infrastructure Architecture</h3>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                 <div className="space-y-6">
                    <h5 className="text-[11px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-3"><Layout size={16}/> Frontend Layer</h5>
                    <p className="text-sm text-slate-500 italic leading-relaxed">React 19 + Tailwind CSS. Multi-modal canvas engine (D3/SVG) for spatial annotation. Dynamic Identity Skins for institutional branding.</p>
                 </div>
                 <div className="space-y-6">
                    <h5 className="text-[11px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-3"><Database size={16}/> Persistence Layer</h5>
                    <p className="text-sm text-slate-500 italic leading-relaxed">Supabase (PostgreSQL). Row Level Security (RLS) handles multi-tenant isolation. Real-time broadcast for crawler logs.</p>
                 </div>
                 <div className="space-y-6">
                    <h5 className="text-[11px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-3"><Cpu size={16}/> Logic Hub (AI)</h5>
                    <p className="text-sm text-slate-500 italic leading-relaxed">Gemini 3 Pro/Flash API. Python workers monitor the extraction_queue for autonomous PDF/Web structural parsing.</p>
                 </div>
              </div>
           </div>
        </div>
      )}

      {activeSection === 'API' && (
        <div className="py-40 text-center space-y-12 animate-in zoom-in-95">
           <div className="w-32 h-32 bg-slate-900 border border-slate-800 rounded-[3rem] flex items-center justify-center text-accent-primary mx-auto shadow-4xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-accent-primary/5 animate-pulse"></div>
              <Brain size={64} className="relative z-10" />
           </div>
           <div className="space-y-4 max-w-2xl mx-auto">
              <h3 className="text-5xl font-black text-white italic font-serif uppercase tracking-tight leading-none">Intelligence Synthesis Protocols</h3>
              <p className="text-xl text-slate-500 italic font-medium leading-relaxed">
                 AnnoNest uses <span className="text-white font-bold">Gemini 3 Pro</span> for high-confidence institutional extraction and <span className="text-white font-bold">Gemini 3 Flash</span> for real-time linguistic bridges (Translation/Transcription). 
              </p>
              <div className="pt-10 flex flex-col items-center gap-4">
                 <span className="text-[10px] font-mono text-slate-700 uppercase tracking-widest">Active API Protocol: google/genai-v1.37</span>
                 <div className="w-64 h-1 bg-slate-900 rounded-full overflow-hidden shadow-inner"><div className="h-full bg-accent-primary w-3/4"></div></div>
              </div>
           </div>
        </div>
      )}

      <footer className="fixed bottom-0 left-72 right-0 h-16 bg-slate-950/90 backdrop-blur-xl border-t border-slate-900 px-10 flex items-center justify-between z-[100] pointer-events-none">
         <div className="flex items-center gap-10">
            <div className="flex items-center gap-3">
               <div className="w-1.5 h-1.5 rounded-full bg-accent-primary animate-pulse shadow-blue"></div>
               <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">Manual Pulse: active</span>
            </div>
            <div className="flex items-center gap-3">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-emerald-500/50"></div>
               <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">Canon Version: v1.0.0</span>
            </div>
         </div>
         <p className="text-[9px] font-black text-slate-800 uppercase tracking-[0.4em] italic font-serif leading-none">AnnoNest Operational Hub v1.0 — NODE_SECURE</p>
      </footer>
    </div>
  );
};

export default Manual;
