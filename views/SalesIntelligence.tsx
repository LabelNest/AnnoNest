
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Target, Zap, Search, ChevronRight, Loader2, Globe, 
  Send, Mail, MessageSquare, Briefcase, Plus, Filter, Sparkles,
  ArrowRight, CheckCircle2, History, ExternalLink, UserPlus,
  MoreVertical, ArrowLeft, FileText, LayoutGrid, Clock, ShieldCheck,
  Check, X, FileSearch, Trash2, Edit3, Fingerprint, Paperclip,
  CheckCircle, AlertTriangle, Calendar, Building2, User,
  Database, GitMerge, RefreshCw, Brain, Lock, Inbox, AlertCircle,
  Archive, Package, FileCode, HardDrive, Settings, Save, Link as LinkIcon,
  PlusCircle, UserCheck
} from 'lucide-react';
import { 
  Entity, UserProfile, EntityType
} from '../types';
import { supabaseService } from '../services/supabaseService';
import { geminiService } from '../services/geminiService';

interface Props {
  userProfile: UserProfile;
}

type SIFlow = 'TARGETING' | 'REFINERY' | 'PROPAGATION' | 'LEDGER' | 'INVENTORY';

const SalesIntelligence: React.FC<Props> = ({ userProfile }) => {
  const [activeFlow, setActiveFlow] = useState<SIFlow>('TARGETING');
  const [loading, setLoading] = useState(false);
  
  // Data State
  const [registryEntities, setRegistryEntities] = useState<Entity[]>([]);
  const [outreachTargets, setOutreachTargets] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [identities, setIdentities] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [signatures, setSignatures] = useState<any[]>([]);

  // Manual Ingest State
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualForm, setManualForm] = useState({ firmName: '', contactName: '', email: '', website: '' });

  // Context State
  const [targetContext, setTargetContext] = useState({
    firmName: '',
    contactName: '',
    contactEmail: '',
    entityId: '',
    website: '',
    targetId: ''
  });

  // Composition State
  const [subject, setSubject] = useState('');
  const [draftContent, setDraftContent] = useState('');
  const [aiParagraph, setAiParagraph] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [selectedSignatureId, setSelectedSignatureId] = useState<string | null>(null);
  const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string>>(new Set());
  const [generatingAi, setGeneratingAi] = useState(false);
  const [aiHookSources, setAiHookSources] = useState<string[]>([]);

  // Propagation State
  const [selectedIdentityId, setSelectedIdentityId] = useState<string | null>(null);
  const [scheduledTime, setScheduledTime] = useState('');
  const [cc, setCc] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Search/Filter State
  const [intakeSearch, setIntakeSearch] = useState('');

  const handleFollowUp = (item: any) => {
    setTargetContext({
      firmName: item.firm_name,
      contactName: item.contact_name,
      contactEmail: item.contact_email,
      entityId: '',
      website: '',
      targetId: ''
    });
    setSubject(`Follow-up: ${item.subject}`);
    setDraftContent(`Hi ${item.contact_name || 'there'},\n\nI'm following up on my previous message regarding ${item.subject}. Would love to discuss this further.`);
    setActiveFlow('REFINERY');
  };

  useEffect(() => {
    loadBaseData();
  }, [userProfile.tenant_id]);

  const loadBaseData = async () => {
    setLoading(true);
    const [ent, targets, tmpl, ids, hist, ass, sigs] = await Promise.all([
      supabaseService.fetchEntities(userProfile.tenant_id),
      supabaseService.fetchOutreachTargets(userProfile.tenant_id),
      supabaseService.fetchOutreachTemplates(),
      supabaseService.fetchOutreachIdentities(userProfile.tenant_id),
      supabaseService.fetchOutreachHistory(userProfile.tenant_id),
      supabaseService.fetchOutreachAssets(userProfile.tenant_id),
      supabaseService.fetchOutreachSignatures(userProfile.tenant_id)
    ]);
    setRegistryEntities(ent);
    setOutreachTargets(targets);
    setTemplates(tmpl);
    setIdentities(ids);
    setHistory(hist);
    setAssets(ass);
    setSignatures(sigs);
    if (ids.length > 0) setSelectedIdentityId(ids.find(i => i.is_default)?.id || ids[0].id);
    if (sigs.length > 0) setSelectedSignatureId(sigs[0].id);
    setLoading(false);
  };

  const handleTargetSelect = (target: any, isRegistry: boolean = false) => {
    setTargetContext({
      firmName: target.firm_name || target.name,
      contactName: target.contact_name || '',
      contactEmail: target.email || '',
      entityId: isRegistry ? target.id : target.registry_entity_id || '',
      website: target.website || '',
      targetId: isRegistry ? '' : target.id
    });
    setActiveFlow('REFINERY');
  };

  const handleManualIngestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.firmName || !manualForm.email) return;
    
    setTargetContext({
      firmName: manualForm.firmName,
      contactName: manualForm.contactName,
      contactEmail: manualForm.email,
      entityId: 'NEW_NODE_PENDING_INTAKE', 
      website: manualForm.website,
      targetId: ''
    });
    
    setShowManualModal(false);
    setActiveFlow('REFINERY');
  };

  const handleAiSynthesis = async () => {
    setGeneratingAi(true);
    const synth = await geminiService.synthesizeSalesHook(targetContext.firmName, targetContext.website);
    setAiParagraph(synth.text);
    setAiHookSources(synth.sources);
    setGeneratingAi(false);
  };

  const handleTemplateSelect = (id: string) => {
    const tmpl = templates.find(t => t.id === id);
    if (tmpl) {
      setSelectedTemplateId(id);
      setSubject(tmpl.subject || '');
      const fullBody = `${tmpl.header || ''}\n\n${tmpl.body || ''}\n\n${tmpl.footer || ''}`.trim();
      setDraftContent(fullBody);
    }
  };

  const handleCommitSequence = async () => {
    setIsSending(true);
    await new Promise(r => setTimeout(r, 2000));
    
    const signatureHtml = signatures.find(s => s.id === selectedSignatureId)?.html || '';
    
    const payload = {
      tenant_id: userProfile.tenant_id,
      firm_name: targetContext.firmName,
      contact_name: targetContext.contactName,
      contact_email: targetContext.contactEmail,
      subject,
      draft_content: draftContent + "\n\n" + signatureHtml,
      ai_paragraph: aiParagraph,
      template_id: selectedTemplateId,
      outreach_identity_id: selectedIdentityId,
      scheduled_at: scheduledTime || null,
      cc: cc ? cc.split(',').map(e => e.trim()) : [],
      bcc: ['partnership@labelnest.in'],
      status: scheduledTime ? 'SCHEDULED' : 'SENT',
      sent_via: 'OUTLOOK_API',
      attachments: Array.from(selectedAssetIds)
    };

    // DOMAIN LOGIC: If target is unknown, route to Registry Intake automatically
    if (targetContext.entityId === 'NEW_NODE_PENDING_INTAKE') {
       await supabaseService.pushToIntake({
          tenant_id: userProfile.tenant_id,
          suggested_entity_name: targetContext.firmName,
          suggested_entity_type: EntityType.GP,
          source_type: 'SALES',
          trigger_reference: `Outreach initiated to unknown firm node via Sales Intelligence.`,
          confidence_score: 1.0,
          payload_context: { 
            contact_email: targetContext.contactEmail, 
            contact_name: targetContext.contactName,
            website: targetContext.website 
          }
       });
    }

    const res = await supabaseService.createOutreachRecord(payload);
    if (res.data) {
      setActiveFlow('LEDGER');
      loadBaseData();
    }
    setIsSending(false);
  };

  const duplicateMatches = useMemo(() => {
    if (intakeSearch.length < 3) return [];
    return registryEntities.filter(e => e.name.toLowerCase().includes(intakeSearch.toLowerCase()));
  }, [intakeSearch, registryEntities]);

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center gap-6">
      <Loader2 className="animate-spin text-accent-primary" size={48} />
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] italic">Synchronizing Outreach Nodes...</p>
    </div>
  );

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-500">
      
      {/* HUD HEADER */}
      <header className="h-20 border-b border-border-ui dark:border-[#1E293B] flex items-center justify-between px-10 shrink-0 bg-card-panel/80 backdrop-blur-xl z-[200]">
        <div className="flex items-center gap-8">
           <h1 className="text-3xl font-black italic font-serif uppercase tracking-tight text-text-primary flex items-center gap-4">
             <Target className="text-accent-primary" /> Sales Intelligence
           </h1>
           <nav className="flex bg-slate-900 border border-slate-800 rounded-xl p-1">
              {(['TARGETING', 'REFINERY', 'PROPAGATION', 'LEDGER', 'INVENTORY'] as SIFlow[]).map(f => (
                <button 
                  key={f} 
                  onClick={() => setActiveFlow(f)}
                  className={`px-6 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeFlow === f ? 'bg-accent-primary text-white shadow-lg' : 'text-slate-500 hover:text-white disabled:opacity-20'}`}
                >
                  {f}
                </button>
              ))}
           </nav>
        </div>
        <div className="flex items-center gap-6">
           <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-emerald-500/50"></div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Outlook Node: Connected</span>
           </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        
        {/* TARGETING HUB */}
        {activeFlow === 'TARGETING' && (
          <div className="h-full grid grid-cols-2 divide-x divide-border-ui animate-in slide-in-from-bottom-4 duration-500">
             <section className="p-16 space-y-10 flex flex-col overflow-hidden bg-app-bg">
                <header className="space-y-4">
                   <div className="w-12 h-12 bg-accent-primary/10 border border-accent-primary/20 rounded-xl flex items-center justify-center text-accent-primary shadow-inner"><Inbox size={24}/></div>
                   <h2 className="text-4xl font-black text-text-primary italic font-serif uppercase tracking-tight">Signal Matrix</h2>
                   <p className="text-text-muted italic">Prioritized leads from high-confidence extraction signals.</p>
                </header>
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-4">
                   {outreachTargets.map(t => (
                     <button key={t.id} onClick={() => handleTargetSelect(t)} className="w-full p-6 bg-card-panel border border-border-ui rounded-[2.5rem] flex items-center justify-between group hover:border-accent-primary transition-all text-left">
                        <div className="flex items-center gap-6">
                           <div className="w-12 h-12 rounded-2xl bg-slate-950 flex items-center justify-center text-accent-primary font-black italic font-serif text-xl shadow-inner group-hover:scale-110 transition-transform">{t.firm_name[0]}</div>
                           <div>
                              <p className="text-lg font-black text-text-primary italic font-serif uppercase tracking-tight leading-none mb-2">{t.firm_name}</p>
                              <div className="flex items-center gap-3">
                                 <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">{t.contact_name || 'Anonymous Node'}</span>
                                 <div className="h-1 w-1 rounded-full bg-slate-800"></div>
                                 <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest italic">{t.trigger || 'Signal Detected'}</span>
                              </div>
                           </div>
                        </div>
                        <ChevronRight size={20} className="text-slate-800 group-hover:text-accent-primary group-hover:translate-x-1 transition-all" />
                     </button>
                   ))}
                </div>
             </section>

             <section className="p-16 space-y-10 bg-slate-950/20 overflow-y-auto custom-scrollbar flex flex-col">
                <header className="space-y-4">
                   <div className="w-12 h-12 bg-amber-600/10 border border-amber-500/20 rounded-xl flex items-center justify-center text-amber-500 shadow-inner"><Database size={24}/></div>
                   <h2 className="text-4xl font-black text-text-primary italic font-serif uppercase tracking-tight">Registry Sweep</h2>
                   <p className="text-text-muted italic">Search existing registry or provision a new institutional node.</p>
                </header>
                
                <div className="space-y-8 flex-1">
                   <div className="space-y-6">
                      <div className="relative group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-amber-500 transition-colors" size={20}/>
                        <input 
                          className="w-full bg-slate-900 border border-border-ui rounded-2xl pl-16 pr-6 py-5 text-lg text-white font-bold italic font-serif outline-none focus:ring-4 focus:ring-amber-500/10 transition-all" 
                          placeholder="Search master database..." 
                          value={intakeSearch}
                          onChange={e => setIntakeSearch(e.target.value)}
                        />
                      </div>

                      <button 
                        onClick={() => setShowManualModal(true)}
                        className="w-full py-5 bg-slate-900 border border-border-ui border-dashed hover:border-amber-500/50 hover:bg-amber-500/5 rounded-[2rem] text-slate-500 hover:text-amber-500 font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-3"
                      >
                         <PlusCircle size={16}/> Provision Manual Node (Intake Bridge)
                      </button>
                   </div>

                   <div className="space-y-3">
                      {duplicateMatches.map(e => (
                        <button key={e.id} onClick={() => handleTargetSelect(e, true)} className="w-full p-5 bg-slate-900 border border-border-ui rounded-2xl flex items-center justify-between group hover:border-amber-500/40 transition-all">
                           <div className="flex items-center gap-4">
                              <span className="text-[9px] font-black text-amber-500 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20 uppercase">{e.type}</span>
                              <span className="text-sm font-black text-white italic font-serif uppercase">{e.name}</span>
                           </div>
                           <ChevronRight size={16} className="text-slate-700 group-hover:text-amber-400" />
                        </button>
                      ))}
                   </div>
                </div>
             </section>
          </div>
        )}

        {activeFlow === 'REFINERY' && (
          <div className="h-full flex divide-x divide-border-ui animate-in fade-in zoom-in-95 duration-500">
             <aside className="w-80 p-8 flex flex-col gap-8 bg-slate-950/20">
                <header className="space-y-2">
                   <h3 className="text-[11px] font-black text-text-muted uppercase tracking-[0.5em] flex items-center gap-3"><LayoutGrid size={16}/> Layout Matrix</h3>
                </header>
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2">
                   {templates.map(t => (
                     <button key={t.id} onClick={() => handleTemplateSelect(t.id)} className={`w-full p-4 rounded-2xl border-2 transition-all text-left ${selectedTemplateId === t.id ? 'bg-accent-primary border-accent-primary text-white shadow-lg' : 'bg-slate-900 border-border-ui text-slate-500 hover:border-slate-700'}`}>
                        <p className="text-[10px] font-black uppercase tracking-widest truncate">{t.name}</p>
                     </button>
                   ))}
                </div>
                <div className="h-px bg-slate-800 my-4"></div>
                <header className="space-y-2">
                   <h3 className="text-[11px] font-black text-text-muted uppercase tracking-[0.5em] flex items-center gap-3"><Fingerprint size={16}/> Protocol Signature</h3>
                </header>
                <div className="space-y-2 overflow-y-auto custom-scrollbar pr-2">
                   {signatures.map(s => (
                     <button key={s.id} onClick={() => setSelectedSignatureId(s.id)} className={`w-full p-4 rounded-2xl border-2 transition-all text-left ${selectedSignatureId === s.id ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-slate-900 border-border-ui text-slate-500 hover:border-slate-700'}`}>
                        <p className="text-[10px] font-black uppercase tracking-widest truncate">{s.name}</p>
                     </button>
                   ))}
                </div>
             </aside>

             <section className="flex-1 flex flex-col min-w-0 bg-app-bg">
                <header className="px-10 py-6 border-b border-border-ui flex items-center justify-between bg-card-panel/40">
                   <div className="flex items-center gap-6">
                      <div className="w-12 h-12 bg-slate-950 border border-border-ui rounded-2xl flex items-center justify-center text-accent-primary font-black italic font-serif text-xl">{targetContext.firmName[0]}</div>
                      <div>
                        <p className="text-[10px] font-black text-accent-primary uppercase tracking-widest italic leading-none mb-2">Composition Node</p>
                        <h3 className="text-xl font-black text-white italic font-serif uppercase tracking-tight leading-none">{targetContext.contactName || 'Anonymous'} // {targetContext.firmName}</h3>
                      </div>
                   </div>
                   <button onClick={() => setActiveFlow('PROPAGATION')} disabled={!draftContent || !subject} className="px-10 py-3.5 bg-accent-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-blue hover:brightness-110 transition-all flex items-center gap-3 active:scale-95">
                      Propagation Cycle <ArrowRight size={16}/>
                   </button>
                </header>
                <div className="flex-1 p-12 overflow-y-auto custom-scrollbar space-y-10">
                   <input className="w-full bg-transparent border-b border-border-ui py-4 text-3xl text-white font-black italic font-serif uppercase tracking-tight outline-none focus:border-accent-primary transition-colors" placeholder="Subject Line..." value={subject} onChange={e => setSubject(e.target.value)} />
                   <div className="space-y-10">
                      {aiParagraph && (
                        <div className="p-10 bg-indigo-600 border border-indigo-500 rounded-[3rem] shadow-2xl relative overflow-hidden animate-in slide-in-from-top-4">
                           <p className="text-[10px] font-black text-white uppercase tracking-[0.5em] mb-6 flex items-center gap-3"><Brain size={14}/> AI Synthesis Hook</p>
                           <p className="text-xl text-white italic font-serif leading-relaxed relative z-10 select-all">"{aiParagraph}"</p>
                           <button onClick={() => setAiParagraph('')} className="absolute top-8 right-8 text-white/40 hover:text-white"><Trash2 size={16}/></button>
                        </div>
                      )}
                      <textarea className="w-full min-h-[400px] bg-card-panel border border-border-ui rounded-[4rem] p-12 text-xl text-text-secondary leading-relaxed italic font-serif outline-none focus:ring-4 focus:ring-accent-primary/10 transition-all resize-none shadow-inner" placeholder="Compose institutional payload..." value={draftContent} onChange={e => setDraftContent(e.target.value)} />
                      {selectedSignatureId && (
                        <div className="p-10 border border-dashed border-border-ui rounded-[3rem] bg-slate-950/20">
                           <p className="text-[9px] font-black text-slate-700 uppercase tracking-widest mb-6">Persistent Signature Signature</p>
                           <div className="text-slate-500 italic font-serif opacity-60" dangerouslySetInnerHTML={{ __html: signatures.find(s => s.id === selectedSignatureId)?.html || '' }}></div>
                        </div>
                      )}
                   </div>
                </div>
             </section>

             <aside className="w-[450px] p-8 flex flex-col gap-10 bg-card-panel/60 backdrop-blur-xl">
                <header className="flex justify-between items-center">
                   <h3 className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.5em] flex items-center gap-4"><Sparkles size={20} className="animate-pulse"/> Signal Refinery</h3>
                   <button onClick={handleAiSynthesis} disabled={generatingAi} className="p-2 bg-slate-900 border border-slate-800 text-slate-500 hover:text-white rounded-xl transition-all">
                     {generatingAi ? <Loader2 size={18} className="animate-spin"/> : <RefreshCw size={18}/>}
                   </button>
                </header>
                {generatingAi ? (
                  <div className="flex-1 flex flex-col items-center justify-center gap-10 opacity-40">
                     <Brain size={64} className="text-indigo-500 animate-bounce" />
                     <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 italic">Synthesizing Signal...</p>
                  </div>
                ) : aiParagraph ? (
                  <div className="flex-1 flex flex-col gap-8">
                     <div className="p-8 bg-slate-900 border-2 border-indigo-500/40 rounded-[3rem] space-y-6 shadow-3xl">
                        <p className="text-lg text-slate-200 font-serif italic leading-relaxed select-all">"{aiParagraph}"</p>
                     </div>
                     <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-4">Grounding Source Nodes</h4>
                        <div className="space-y-2">
                           {aiHookSources.map((src, i) => (
                             <a key={i} href={src} target="_blank" className="block p-4 bg-slate-950 border border-slate-800 rounded-2xl text-[9px] font-black text-slate-600 uppercase italic truncate hover:text-indigo-400 transition-all">{src}</a>
                           ))}
                        </div>
                     </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center opacity-10 border-2 border-dashed border-slate-800 rounded-[4rem]">
                     <Sparkles size={80} />
                     <p className="text-xl font-black italic font-serif uppercase mt-6">Signal Void</p>
                  </div>
                )}
             </aside>
          </div>
        )}

        {activeFlow === 'PROPAGATION' && (
          <div className="h-full flex items-center justify-center p-20 animate-in zoom-in-95 bg-app-bg">
             <div className="bg-card-panel border border-border-ui rounded-[4rem] p-24 max-w-5xl w-full shadow-4xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-accent-primary shadow-blue"></div>
                <button onClick={() => setActiveFlow('REFINERY')} className="absolute top-12 right-12 text-slate-500 hover:text-white transition-all"><X size={32}/></button>
                <header className="text-center space-y-6 mb-24">
                   <div className="w-16 h-16 bg-accent-primary rounded-3xl flex items-center justify-center text-white mx-auto shadow-blue"><Send size={32}/></div>
                   <h2 className="text-5xl font-black text-white italic font-serif uppercase tracking-tighter">Propagation Handshake</h2>
                </header>
                <div className="grid grid-cols-2 gap-24">
                   <section className="space-y-16">
                      <div className="space-y-8">
                         <h4 className="text-[11px] font-black text-slate-600 uppercase tracking-[0.5em] flex items-center gap-4"><Clock size={18} className="text-accent-primary"/> Release Window</h4>
                         <div className="flex bg-slate-950 p-2 rounded-2xl border border-slate-900 shadow-inner">
                            <button onClick={() => setScheduledTime('')} className={`flex-1 py-5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!scheduledTime ? 'bg-accent-primary text-white shadow-xl' : 'text-slate-500 hover:text-white'}`}>Immediate</button>
                            <button onClick={() => setScheduledTime(new Date().toISOString())} className={`flex-1 py-5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${scheduledTime ? 'bg-accent-primary text-white shadow-xl' : 'text-slate-500 hover:text-white'}`}>Scheduled</button>
                         </div>
                      </div>
                      <div className="space-y-8">
                         <h4 className="text-[11px] font-black text-slate-600 uppercase tracking-[0.5em] flex items-center gap-4"><Mail size={18} className="text-accent-primary"/> Routing</h4>
                         <input className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-5 text-white font-bold italic outline-none focus:ring-2 focus:ring-accent-primary/20" placeholder="CC: node1@firm.com, node2@firm.com" value={cc} onChange={e => setCc(e.target.value)} />
                      </div>
                   </section>
                   <section className="space-y-16">
                      <div className="space-y-8">
                         <h4 className="text-[11px] font-black text-slate-600 uppercase tracking-[0.5em] flex items-center gap-4"><Fingerprint size={18} className="text-accent-primary"/> Outlook Node</h4>
                         <div className="space-y-3 max-h-[350px] overflow-y-auto custom-scrollbar pr-2">
                            {identities.map(id => (
                              <button key={id.id} onClick={() => setSelectedIdentityId(id.id)} className={`w-full p-6 rounded-[2rem] border-2 transition-all text-left flex items-center justify-between ${selectedIdentityId === id.id ? 'bg-accent-primary border-accent-primary text-white shadow-xl scale-[1.02]' : 'bg-slate-950 border-slate-800 text-slate-600 hover:border-slate-800'}`}>
                                 <div className="flex items-center gap-5">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black italic font-serif text-xl ${selectedIdentityId === id.id ? 'bg-white/20' : 'bg-slate-900 text-accent-primary shadow-inner'}`}>{id.outreach_name[0]}</div>
                                    <div>
                                       <p className="text-base font-black italic font-serif uppercase leading-none mb-1.5">{id.outreach_name}</p>
                                       <p className="text-[9px] font-black uppercase tracking-widest">{id.outreach_email}</p>
                                    </div>
                                 </div>
                                 {selectedIdentityId === id.id && <CheckCircle size={20} className="text-white" />}
                              </button>
                            ))}
                         </div>
                      </div>
                   </section>
                </div>
                <footer className="mt-24 pt-12 border-t border-slate-800">
                   <button onClick={handleCommitSequence} disabled={isSending} className="w-full py-10 bg-accent-primary text-white rounded-[3rem] font-black uppercase text-base tracking-[0.4em] shadow-3xl shadow-accent-primary/40 hover:scale-[1.01] transition-all flex items-center justify-center gap-10">
                      {isSending ? <Loader2 className="animate-spin" size={40}/> : <>Release Propagation <Globe size={40} className="animate-pulse"/></>}
                   </button>
                </footer>
             </div>
          </div>
        )}

        {activeFlow === 'LEDGER' && (
          <div className="h-full p-10 space-y-12 animate-in slide-in-from-right-4 bg-app-bg overflow-y-auto custom-scrollbar">
             <header className="flex justify-between items-end px-10">
                <div className="space-y-2">
                   <h3 className="text-[12px] font-black text-text-muted uppercase tracking-[0.6em] flex items-center gap-4"><History size={20}/> Propagation Ledger</h3>
                   <p className="text-[10px] text-text-muted italic">Audit trail of institutional outreach sequences.</p>
                </div>
                <button onClick={loadBaseData} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-slate-500 hover:text-white transition-all shadow-xl"><RefreshCw size={24}/></button>
             </header>
             <div className="bg-card-panel border border-border-ui rounded-[4rem] overflow-hidden shadow-4xl min-h-[700px] flex flex-col">
                <div className="flex-1 overflow-x-auto custom-scrollbar">
                   <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-950/60 border-b border-border-ui sticky top-0 z-10">
                         <tr className="text-[11px] font-black text-slate-500 uppercase tracking-[0.5em]">
                            <th className="px-12 py-10">Target Node</th>
                            <th className="px-10 py-10">Signature</th>
                            <th className="px-10 py-10 text-center">State</th>
                            <th className="px-10 py-10">Temporal Node</th>
                            <th className="px-12 py-10 text-right">Action</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-border-ui">
                         {history.map(item => (
                           <tr key={item.id} className="hover:bg-accent-primary/[0.02] transition-all group border-l-[6px] border-transparent hover:border-accent-primary">
                              <td className="px-12 py-8">
                                 <div className="flex items-center gap-8">
                                    <div className="w-16 h-16 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-3xl font-black text-accent-primary italic font-serif shadow-inner group-hover:scale-110 transition-transform">{item.firm_name[0]}</div>
                                    <div>
                                       <p className="text-2xl font-black text-white italic font-serif uppercase tracking-tight mb-2 group-hover:text-accent-primary transition-colors leading-none">{item.firm_name}</p>
                                       <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{item.contact_email}</span>
                                    </div>
                                 </div>
                              </td>
                              <td className="px-10 py-8 max-w-sm">
                                 <p className="text-sm font-bold text-slate-400 italic truncate group-hover:text-white transition-colors">"{item.subject}"</p>
                              </td>
                              <td className="px-10 py-8 text-center">
                                 <span className={`px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border shadow-sm italic transition-all ${item.status === 'SENT' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse'}`}>
                                    {item.status}
                                 </span>
                              </td>
                              <td className="px-10 py-8">
                                 <p className="text-sm font-black text-slate-400 italic font-serif leading-none mb-1">{new Date(item.created_at).toLocaleDateString()}</p>
                              </td>
                              <td className="px-12 py-8 text-right">
                                 <button onClick={() => handleFollowUp(item)} className="px-8 py-3 bg-accent-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-blue hover:brightness-110 transition-all flex items-center gap-3"><Plus size={14}/> Follow Up</button>
                              </td>
                           </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>
          </div>
        )}
      </main>

      {/* MANUAL INGEST MODAL */}
      {showManualModal && (
        <div className="fixed inset-0 z-[500] bg-slate-950/90 backdrop-blur-3xl flex items-center justify-center p-10 animate-in fade-in zoom-in-95">
           <form onSubmit={handleManualIngestSubmit} className="bg-[#0E1626] border border-amber-500/20 rounded-[4rem] p-24 max-w-3xl w-full shadow-4xl relative overflow-hidden flex flex-col">
              <div className="absolute top-0 left-0 w-full h-2 bg-amber-500 shadow-amber-500/50"></div>
              <button type="button" onClick={() => setShowManualModal(false)} className="absolute top-12 right-12 text-slate-500 hover:text-white transition-all"><X size={40} /></button>
              
              <div className="mb-16 space-y-6">
                 <h2 className="text-6xl font-black text-white italic font-serif uppercase tracking-tight">Provision Node</h2>
                 <p className="text-xl text-slate-500 italic font-medium leading-relaxed">Initialize outreach to a firm not yet in the master registry. This node will be <span className="text-amber-500 font-black">queued for intake</span> validation upon release.</p>
              </div>

              <div className="space-y-10 mb-16">
                 <div className="space-y-4">
                    <label className="text-[11px] font-black text-slate-600 uppercase tracking-widest ml-6">Institutional Name (Required)</label>
                    <input 
                      required 
                      className="w-full bg-slate-950 border border-slate-800 rounded-[2.5rem] p-8 text-2xl text-white font-black italic font-serif uppercase outline-none focus:ring-4 focus:ring-amber-500/10" 
                      placeholder="e.g. ALPHA_GROWTH_PARTNERS"
                      value={manualForm.firmName}
                      onChange={e => setManualForm({...manualForm, firmName: e.target.value})}
                    />
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-4">
                       <label className="text-[11px] font-black text-slate-600 uppercase tracking-widest ml-6">Primary Recipient Node (Email)</label>
                       <input 
                        required 
                        type="email"
                        className="w-full bg-slate-950 border border-slate-800 rounded-[2rem] p-6 text-lg text-white font-bold italic outline-none focus:ring-4 focus:ring-amber-500/10"
                        placeholder="node@institutional.com"
                        value={manualForm.email}
                        onChange={e => setManualForm({...manualForm, email: e.target.value})}
                       />
                    </div>
                    <div className="space-y-4">
                       <label className="text-[11px] font-black text-slate-600 uppercase tracking-widest ml-6">Target Signature (Full Name)</label>
                       <input 
                        className="w-full bg-slate-950 border border-slate-800 rounded-[2rem] p-6 text-lg text-white font-bold italic outline-none focus:ring-4 focus:ring-amber-500/10"
                        placeholder="e.g. Jane Doe"
                        value={manualForm.contactName}
                        onChange={e => setManualForm({...manualForm, contactName: e.target.value})}
                       />
                    </div>
                 </div>
                 <div className="space-y-4">
                    <label className="text-[11px] font-black text-slate-600 uppercase tracking-widest ml-6">Institutional Domain (Website)</label>
                    <div className="relative">
                      <Globe className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                      <input 
                        className="w-full bg-slate-950 border border-slate-800 rounded-[2rem] pl-16 pr-6 py-6 text-lg text-white font-bold italic outline-none focus:ring-4 focus:ring-amber-500/10"
                        placeholder="https://www.firm.com"
                        value={manualForm.website}
                        onChange={e => setManualForm({...manualForm, website: e.target.value})}
                      />
                    </div>
                 </div>
              </div>

              <button 
                type="submit"
                className="w-full py-10 bg-amber-600 text-white rounded-[3rem] font-black uppercase text-sm tracking-[0.4em] shadow-3xl shadow-amber-900/40 hover:scale-[1.01] active:scale-98 transition-all flex items-center justify-center gap-10"
              >
                 Initialize Ingest Bridge <UserCheck size={32}/>
              </button>
           </form>
        </div>
      )}

    </div>
  );
};

export default SalesIntelligence;
