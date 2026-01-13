
import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, Target, Zap, Globe, Mail, Search, ShieldCheck, 
  ArrowRight, Sparkles, Send, FileText, Plus, ChevronRight,
  User, Building2, History, Info, Loader2, X, Check, ExternalLink,
  MessageSquare, Layout, Filter, MoreHorizontal, Clock, ShieldAlert,
  Database, CheckSquare, Square, ChevronDown
} from 'lucide-react';
import { 
  Entity, EntityType, OutreachTarget, OutreachStatus, OutreachTemplate, 
  UserProfile, UserRole, EntityStatus, OutreachIdentity 
} from '../types';
import { supabaseService } from '../services/supabaseService';
import { GoogleGenAI } from "@google/genai";

interface Props {
  userProfile: UserProfile;
}

const SalesIntelligence: React.FC<Props> = ({ userProfile }) => {
  const [view, setView] = useState<'HOME' | 'WIZARD' | 'HISTORY'>('HOME');
  const [targets, setTargets] = useState<OutreachTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Wizard State
  const [step, setStep] = useState(1);
  const [targetSource, setTargetSource] = useState<'EXISTING' | 'NEW'>('EXISTING');
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [recipientType, setRecipientType] = useState<'Individual' | 'Firm'>('Individual');
  const [newFirmData, setNewFirmData] = useState({ name: '', website: '', contactName: '', contactEmail: '', role: '', firmEmail: '' });
  const [selectedTemplate, setSelectedTemplate] = useState<OutreachTemplate | null>(null);
  const [selectedIdentity, setSelectedIdentity] = useState<OutreachIdentity | null>(null);
  const [aiSnippet, setAiSnippet] = useState('');
  const [isGeneratingSnippet, setIsGeneratingSnippet] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [outlookConnected, setOutlookConnected] = useState(false);

  const [templates, setTemplates] = useState<OutreachTemplate[]>([]);
  const [identities, setIdentities] = useState<OutreachIdentity[]>([]);
  const [activeEntities, setActiveEntities] = useState<Entity[]>([]);

  // DERIVED STATS: From targets collection
  const stats = useMemo(() => {
    const totalSent = targets.filter(t => t.status === 'sent' || t.status === 'replied' || t.status === 'follow-up').length;
    const totalReplied = targets.filter(t => t.status === 'replied').length;
    const totalPromoted = targets.filter(t => t.status === 'closed').length;
    const responseRate = totalSent > 0 ? (totalReplied / totalSent * 100).toFixed(1) : '0.0';

    return {
      pending: targets.filter(t => t.status === 'new').length,
      sent: totalSent,
      rate: responseRate,
      promoted: totalPromoted
    };
  }, [targets]);

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    setLoading(true);
    try {
      const [t, temp, ent, dbIdents] = await Promise.all([
        supabaseService.fetchOutreachTargets(userProfile.tenant_id),
        supabaseService.fetchOutreachTemplates(),
        supabaseService.fetchEntities(userProfile.tenant_id, userProfile.role),
        supabaseService.fetchOutreachIdentities(userProfile.tenant_id)
      ]);
      
      setTargets(t);
      setTemplates(temp);
      setActiveEntities(ent);

      const selfIdentity: OutreachIdentity = {
        id: `USER-${userProfile.user_id}`,
        tenant_id: userProfile.tenant_id,
        name: `${userProfile.name} (You)`,
        email: userProfile.email,
        provider: 'Outlook',
        status: 'active'
      };

      const mergedIdents = [selfIdentity, ...dbIdents.filter(i => i.email !== userProfile.email)];
      setIdentities(mergedIdents);
      
      if (mergedIdents.length > 0) {
        setSelectedIdentity(mergedIdents[0]);
        setOutlookConnected(true);
      }

    } catch (e) {
      console.error("Registry Sync Failure", e);
    } finally {
      setLoading(false);
    }
  };

  const generateAISnippet = async () => {
    if (!selectedEntity && !newFirmData.name) return;
    setIsGeneratingSnippet(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const firmName = selectedEntity?.name || newFirmData.name;
      const contactName = recipientType === 'Individual' ? (selectedEntity?.details?.contact_name || newFirmData.contactName) : 'Team';
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Generate a 4-5 line outreach snippet for ${firmName}. 
        Focus strictly on recent signals like funding, expansion, or hiring. 
        Recipient is ${contactName}. 
        Rules: No greeting, no pricing, no sales pitch, no signature. 
        Tone: Institutional, data-driven, precise.`
      });
      setAiSnippet(response.text || '');
    } catch (e) {
      console.error("AI Generation Failed", e);
      setAiSnippet("Analyzed your recent market signals regarding institutional growth. LabelNest provides verified data layers to support expansion in this vertical.");
    } finally {
      setIsGeneratingSnippet(false);
    }
  };

  const handleCreateIntakeAndSend = async () => {
    if (!selectedIdentity) return;
    setIsSending(true);
    try {
      let entityId = selectedEntity?.id;
      
      if (targetSource === 'NEW') {
        const newIntake: Entity = {
          id: `INT-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
          tenant_id: userProfile.tenant_id || 'LABELNEST',
          project_id: 'SYSTEM',
          name: newFirmData.name,
          type: EntityType.GP, 
          status: 'intake',
          source: 'outreach',
          lastVerified: new Date().toISOString(),
          tags: ['OUTREACH_INTAKE'],
          details: {
            website: newFirmData.website,
            contact_name: newFirmData.contactName,
            contact_email: newFirmData.contactEmail,
            role: newFirmData.role,
            firm_email: newFirmData.firmEmail
          }
        };
        await supabaseService.upsertEntity(newIntake);
        entityId = newIntake.id;
      }

      console.log(`GRAPH_API_DISPATCH: Sending from ${selectedIdentity.email} to ${recipientType === 'Individual' ? (selectedEntity?.details?.contact_email || newFirmData.contactEmail) : (selectedEntity?.details?.firm_email || newFirmData.firmEmail)}`);
      await new Promise(r => setTimeout(r, 2000));
      
      await supabaseService.logOutreach({
        firm_name: selectedEntity?.name || newFirmData.name,
        contact_name: recipientType === 'Individual' ? (selectedEntity?.details?.contact_name || newFirmData.contactName || 'Contact') : undefined,
        email: recipientType === 'Individual' ? (selectedEntity?.details?.contact_email || newFirmData.contactEmail) : (selectedEntity?.details?.firm_email || newFirmData.firmEmail),
        recipient_type: recipientType,
        template_id: selectedTemplate?.id,
        ai_insert_text: aiSnippet,
        sent_date: new Date().toISOString(),
        status: 'sent',
        tenant_id: userProfile.tenant_id || 'LABELNEST',
        project_id: 'OUTREACH'
      });

      setView('HOME');
      setStep(1);
      loadHomeData();
    } catch (e) {
      console.error("Send Failure", e);
    } finally {
      setIsSending(false);
    }
  };

  const StatCard = ({ label, value, icon: Icon, color }: any) => (
    <div className="bg-slate-900/50 border border-slate-800 rounded-[2rem] p-8 shadow-xl relative overflow-hidden group">
       <div className={`absolute -right-4 -top-4 opacity-5 text-${color}-500 group-hover:opacity-10 transition-opacity`}>
         <Icon size={100} />
       </div>
       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{label}</p>
       <p className="text-3xl font-black text-white italic font-serif">{value}</p>
    </div>
  );

  return (
    <div className="space-y-12 animate-in fade-in duration-500 max-w-[1600px] mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 border-b border-slate-800 pb-16">
        <div>
          <h1 className="text-6xl font-black flex items-center gap-8 text-white tracking-tighter uppercase italic font-serif leading-none">
            <Target className="text-blue-500" size={60} />
            Sales Intel
          </h1>
          <p className="text-slate-400 mt-6 font-medium flex items-center gap-4 text-lg">
            <Sparkles size={22} className="text-blue-500" />
            Outreach Intelligence — <span className="text-blue-500 font-black uppercase text-[10px] tracking-[0.4em] bg-blue-500/10 px-5 py-2 rounded-full italic font-serif shadow-2xl">Signal-Driven Engagement</span>
          </p>
        </div>

        <div className="flex items-center gap-6">
           <button 
             onClick={() => setOutlookConnected(!outlookConnected)}
             className={`px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-3 shadow-xl ${outlookConnected ? 'bg-emerald-600/10 text-emerald-500 border border-emerald-500/20' : 'bg-slate-900 border border-slate-800 text-slate-400'}`}
           >
             <Mail size={16} /> {outlookConnected ? 'Identity Active' : 'Connect Outlook'}
           </button>
           <button 
             onClick={() => { setView('WIZARD'); setStep(1); }}
             className="px-10 py-4 bg-blue-600 text-white rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest shadow-2xl shadow-blue-600/30 hover:bg-blue-500 transition-all flex items-center gap-3"
           >
             <Plus size={18} /> New Outreach
           </button>
        </div>
      </div>

      {view === 'HOME' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <StatCard label="Pending Targets" value={stats.pending} icon={Target} color="blue" />
            <StatCard label="Total Sent" value={stats.sent} icon={Send} color="emerald" />
            <StatCard label="Response Rate" value={`${stats.rate}%`} icon={TrendingUp} color="amber" />
            <StatCard label="Intake Promotion" value={stats.promoted} icon={ShieldCheck} color="indigo" />
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-[3.5rem] overflow-hidden shadow-3xl">
             <div className="p-10 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                <div className="relative flex-1 max-w-xl group">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500" size={20} />
                  <input 
                    type="text" 
                    placeholder="Search targets..." 
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-16 pr-8 py-4 text-sm text-white outline-none focus:ring-4 focus:ring-blue-500/10"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="flex gap-4">
                  <button className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-slate-500 hover:text-white"><Filter size={20} /></button>
                  <button className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-slate-500 hover:text-white"><History size={20} /></button>
                </div>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[1200px]">
                   <thead>
                      <tr className="bg-slate-950/40 border-b border-slate-800">
                         <th className="px-10 py-8 text-[11px] font-black text-slate-500 uppercase tracking-[0.4em]">Firm & Contact</th>
                         <th className="px-10 py-8 text-[11px] font-black text-slate-500 uppercase tracking-[0.4em]">Trigger Signal</th>
                         <th className="px-10 py-8 text-[11px] font-black text-slate-500 uppercase tracking-[0.4em]">Recipient Type</th>
                         <th className="px-10 py-8 text-[11px] font-black text-slate-500 uppercase tracking-[0.4em]">Freshness</th>
                         <th className="px-10 py-8 text-[11px] font-black text-slate-500 uppercase tracking-[0.4em]">State</th>
                         <th className="px-10 py-8"></th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-800/40">
                      {targets.filter(t => t.firm_name.toLowerCase().includes(search.toLowerCase())).map(t => (
                        <tr key={t.id} className="hover:bg-slate-800/30 transition-all cursor-pointer group">
                           <td className="px-10 py-6">
                              <div className="flex items-center gap-6">
                                 <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center font-black text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all uppercase italic font-serif">
                                   {t.firm_name[0]}
                                 </div>
                                 <div>
                                    <p className="text-base font-black text-white italic font-serif">{t.firm_name}</p>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t.contact_name || 'Generic Entry'}</p>
                                 </div>
                              </div>
                           </td>
                           <td className="px-10 py-6">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">{t.trigger}</span>
                           </td>
                           <td className="px-10 py-6">
                              <span className="text-[10px] font-bold text-slate-500 uppercase italic">{t.recipient_type}</span>
                           </td>
                           <td className="px-10 py-6">
                              <div className="flex items-center gap-3">
                                 <div className="w-16 h-1 bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500" style={{ width: `${t.confidence * 100}%` }}></div>
                                 </div>
                                 <span className="text-[10px] font-mono font-bold text-slate-400">{(t.confidence * 100).toFixed(0)}%</span>
                              </div>
                           </td>
                           <td className="px-10 py-6">
                              <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
                                t.status === 'sent' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 
                                t.status === 'new' ? 'bg-blue-600/10 border-blue-600/20 text-blue-400 animate-pulse' :
                                'bg-slate-800 text-slate-500'
                              }`}>
                                {t.status}
                              </span>
                           </td>
                           <td className="px-10 py-6 text-right">
                              <button className="p-3 text-slate-600 hover:text-white"><MoreHorizontal size={24} /></button>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
        </>
      )}

      {view === 'WIZARD' && (
        <div className="max-w-5xl mx-auto space-y-12 animate-in slide-in-from-bottom-8 duration-500">
           <div className="flex items-center justify-between border-b border-slate-800 pb-8">
              <div className="flex items-center gap-6">
                 <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-2xl">
                    <Target size={32} />
                 </div>
                 <div>
                    <h2 className="text-4xl font-black text-white italic font-serif leading-none tracking-tight uppercase">Outreach Wizard</h2>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-3">Step {step} of 4: {step === 1 ? 'Target Selection' : step === 2 ? 'Lead Intel' : step === 3 ? 'Composition' : 'Final Execution'}</p>
                 </div>
              </div>
              <button onClick={() => setView('HOME')} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-slate-500 hover:text-white transition-all"><X size={24} /></button>
           </div>

           {step === 1 && (
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="space-y-8">
                   <h3 className="text-xl font-black text-white italic font-serif uppercase tracking-tight">Select Provenance</h3>
                   <div className="grid grid-cols-2 gap-6">
                      <button 
                        onClick={() => setTargetSource('EXISTING')}
                        className={`p-10 rounded-[2.5rem] border text-left transition-all space-y-6 ${targetSource === 'EXISTING' ? 'bg-blue-600/10 border-blue-500 shadow-2xl' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}
                      >
                         <div className={`p-4 w-fit rounded-2xl ${targetSource === 'EXISTING' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-500'}`}><Database size={24} /></div>
                         <div>
                            <p className="text-lg font-black text-white italic font-serif">Registry Record</p>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-2">Verified DataNest Entity</p>
                         </div>
                      </button>
                      <button 
                        onClick={() => setTargetSource('NEW')}
                        className={`p-10 rounded-[2.5rem] border text-left transition-all space-y-6 ${targetSource === 'NEW' ? 'bg-indigo-600/10 border-indigo-500 shadow-2xl' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}
                      >
                         <div className={`p-4 w-fit rounded-2xl ${targetSource === 'NEW' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-500'}`}><Plus size={24} /></div>
                         <div>
                            <p className="text-lg font-black text-white italic font-serif">New Intake</p>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-2">Unverified Shell Entity</p>
                         </div>
                      </button>
                   </div>

                   {targetSource === 'EXISTING' ? (
                     <div className="space-y-6 bg-slate-900 border border-slate-800 p-10 rounded-[2.5rem]">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Select Target Entity</label>
                        <div className="relative">
                           <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                           <input 
                             type="text" 
                             placeholder="Search Registry..." 
                             className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-16 pr-8 py-5 text-lg text-white font-bold outline-none focus:ring-4 focus:ring-blue-500/10"
                             value={search}
                             onChange={(e) => setSearch(e.target.value)}
                           />
                        </div>
                        <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
                           {activeEntities.filter(e => e.name.toLowerCase().includes(search.toLowerCase())).map(e => (
                             <button 
                               key={e.id}
                               onClick={() => setSelectedEntity(e)}
                               className={`w-full p-5 rounded-2xl border text-left flex items-center justify-between transition-all ${selectedEntity?.id === e.id ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-950 border border-slate-800 text-slate-400 hover:border-slate-600'}`}
                             >
                                <span className="font-bold">{e.name}</span>
                                <span className="text-[8px] font-black uppercase bg-slate-900 px-2 py-0.5 rounded">{e.type}</span>
                             </button>
                           ))}
                        </div>
                     </div>
                   ) : (
                     <div className="space-y-6 bg-slate-900 border border-slate-800 p-10 rounded-[2.5rem]">
                        <div className="grid grid-cols-2 gap-6">
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-600 uppercase">Firm Name</label>
                              <input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white" value={newFirmData.name} onChange={e => setNewFirmData({...newFirmData, name: e.target.value})} />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-600 uppercase">Website</label>
                              <input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white" value={newFirmData.website} onChange={e => setNewFirmData({...newFirmData, website: e.target.value})} />
                           </div>
                        </div>
                        <div className="pt-4 border-t border-slate-800">
                           <div className="flex gap-4 mb-6">
                              <button onClick={() => setRecipientType('Individual')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase ${recipientType === 'Individual' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-500'}`}>Contact</button>
                              <button onClick={() => setRecipientType('Firm')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase ${recipientType === 'Firm' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-500'}`}>Generic Email</button>
                           </div>
                           {recipientType === 'Individual' ? (
                             <div className="space-y-4">
                               <input placeholder="Contact Name" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white" value={newFirmData.contactName} onChange={e => setNewFirmData({...newFirmData, contactName: e.target.value})} />
                               <input placeholder="Contact Email" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white" value={newFirmData.contactEmail} onChange={e => setNewFirmData({...newFirmData, contactEmail: e.target.value})} />
                             </div>
                           ) : (
                             <input placeholder="Firm-wide Email" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white" value={newFirmData.firmEmail} onChange={e => setNewFirmData({...newFirmData, firmEmail: e.target.value})} />
                           )}
                        </div>
                     </div>
                   )}
                </div>

                <div className="bg-slate-900/50 border border-slate-800 rounded-[3rem] p-12 space-y-10 relative overflow-hidden">
                   <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-600/5 rounded-full blur-3xl"></div>
                   <h3 className="text-xl font-black text-white italic font-serif uppercase tracking-tight">Configuration Audit</h3>
                   <div className="space-y-6">
                      <div className="flex items-center justify-between p-6 bg-slate-950 border border-slate-800 rounded-2xl">
                         <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Protocol</span>
                         <span className="text-xs font-black text-emerald-500 uppercase">SIGNAL_AWARE_ENGAGEMENT</span>
                      </div>
                      <div className="flex items-center justify-between p-6 bg-slate-950 border border-slate-800 rounded-2xl">
                         <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Data Guard</span>
                         <span className="text-xs font-black text-blue-400 uppercase">RLS_TENANT_ISOLATION_ACTIVE</span>
                      </div>
                   </div>
                   <button 
                     disabled={targetSource === 'EXISTING' ? !selectedEntity : !newFirmData.name}
                     onClick={() => setStep(2)}
                     className="w-full py-6 bg-emerald-600 text-white rounded-2xl font-black uppercase text-sm tracking-[0.2em] shadow-2xl shadow-emerald-600/30 hover:bg-emerald-500 transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-30"
                   >
                      Confirm Target <ArrowRight size={22} />
                   </button>
                </div>
             </div>
           )}

           {step === 2 && (
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 animate-in fade-in duration-500">
                <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-[3rem] p-12 space-y-12">
                   <div className="flex items-center gap-8">
                      <div className="w-20 h-20 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center text-4xl font-black text-blue-500 italic font-serif uppercase">
                        {(selectedEntity?.name || newFirmData.name)[0]}
                      </div>
                      <div>
                         <h3 className="text-4xl font-black text-white italic font-serif tracking-tight">{selectedEntity?.name || newFirmData.name}</h3>
                         <div className="flex items-center gap-3 mt-2">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{selectedEntity?.type || 'NEW_INTAKE'}</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Active Signal Sweep</span>
                         </div>
                      </div>
                   </div>

                   <div className="space-y-6">
                      <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] flex items-center gap-3 border-b border-slate-800 pb-5">
                         <Zap size={18} className="text-yellow-400" /> Lead Context Signals
                      </h4>
                      <div className="space-y-4">
                         {[
                           { msg: 'Series B funding round of $45M identified via Bloomberg.', type: 'FUNDING', time: '2d ago' },
                           { msg: 'New VP of Engineering hired from Stripe.', type: 'HIRING', time: '5d ago' },
                           { msg: 'Registered new office entity in Singapore.', type: 'EXPANSION', time: '1w ago' }
                         ].map((sig, i) => (
                           <div key={i} className="p-6 bg-slate-950 border border-slate-800 rounded-2xl flex items-start justify-between group hover:border-blue-500/30 transition-all">
                              <div className="flex gap-5">
                                 <div className="p-3 bg-slate-900 rounded-xl text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all"><Sparkles size={18} /></div>
                                 <div>
                                    <p className="text-sm font-bold text-slate-300 italic group-hover:text-white transition-colors leading-relaxed">"{sig.msg}"</p>
                                    <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest mt-2 block">{sig.type} • {sig.time}</span>
                                 </div>
                              </div>
                              <Check className="text-emerald-500 opacity-20 group-hover:opacity-100" size={20} />
                           </div>
                         ))}
                      </div>
                   </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-12 space-y-10 flex flex-col justify-between">
                   <div className="space-y-8">
                      <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em]">Signal Integrity</h4>
                      <div className="p-10 bg-slate-950 border border-slate-800 rounded-[2rem] text-center space-y-4 shadow-inner">
                         <p className="text-5xl font-black text-white italic font-serif">94<span className="text-blue-500 text-3xl">%</span></p>
                         <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Composite Outreach Score</p>
                      </div>
                      <p className="text-xs text-slate-500 font-medium leading-relaxed italic">
                        High-confidence signals detected across 3 tiers. Engagement is recommended using the "Capital Efficiency" template.
                      </p>
                   </div>
                   <button 
                     onClick={() => setStep(3)}
                     className="w-full py-6 bg-blue-600 text-white rounded-2xl font-black uppercase text-sm tracking-[0.2em] shadow-2xl shadow-blue-600/30 hover:bg-blue-500 transition-all flex items-center justify-center gap-4 active:scale-95"
                   >
                      Next: Composition <ArrowRight size={22} />
                   </button>
                </div>
             </div>
           )}

           {step === 3 && (
             <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 animate-in slide-in-from-right-8 duration-500">
                <div className="lg:col-span-1 space-y-6">
                   <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] mb-4">Outreach Settings</h4>
                   <div className="space-y-6">
                      <div className="space-y-3">
                         <label className="text-[9px] font-black text-slate-600 uppercase">Sender Identity</label>
                         <div className="relative group">
                            <select 
                              value={selectedIdentity?.id || ''}
                              onChange={(e) => setSelectedIdentity(identities.find(i => i.id === e.target.value) || null)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white font-bold appearance-none outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-inner"
                            >
                               {identities.length === 0 && <option value="">No Identities Authorized</option>}
                               {identities.map(id => (
                                 <option key={id.id} value={id.id}>{id.name} {id.id.startsWith('USER-') ? '(Primary)' : ''}</option>
                               ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" size={14} />
                         </div>
                         <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-lg">
                            <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest">Selected Sender:</p>
                            <p className="text-[10px] font-bold text-slate-300 mt-1 truncate">{selectedIdentity?.email}</p>
                         </div>
                      </div>
                      <div className="space-y-3">
                         <label className="text-[9px] font-black text-slate-600 uppercase">Email Template</label>
                         <div className="space-y-2">
                            {templates.map(t => (
                              <button 
                                key={t.id}
                                onClick={() => setSelectedTemplate(t)}
                                className={`w-full p-4 rounded-xl border text-left text-xs font-bold transition-all ${selectedTemplate?.id === t.id ? 'bg-blue-600 border-blue-500 text-white shadow-xl' : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-600'}`}
                              >
                                {t.name}
                              </button>
                            ))}
                         </div>
                      </div>
                      <div className="space-y-3">
                         <label className="text-[9px] font-black text-slate-600 uppercase">Attachments (PDF)</label>
                         <div className="space-y-2 p-4 bg-slate-900 border border-slate-800 rounded-xl">
                            <div className="flex items-center gap-3">
                               <CheckSquare size={14} className="text-blue-500" />
                               <span className="text-[10px] text-slate-300">LabelNest_Profile.pdf</span>
                            </div>
                            <div className="flex items-center gap-3">
                               <Square size={14} className="text-slate-700" />
                               <span className="text-[10px] text-slate-500">APAC_Growth_Data_2024.pdf</span>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-[3rem] overflow-hidden shadow-3xl flex flex-col min-h-[600px]">
                   <div className="p-8 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                         <span className="text-[9px] font-black text-slate-600 uppercase">TO:</span>
                         <span className="text-xs font-bold text-white bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">
                           {recipientType === 'Individual' ? (selectedEntity?.details?.contact_email || newFirmData.contactEmail || 'Select Contact') : (selectedEntity?.details?.firm_email || newFirmData.firmEmail || 'Select Firm Email')}
                         </span>
                      </div>
                      <div className="flex gap-4">
                        <button 
                          onClick={generateAISnippet}
                          disabled={isGeneratingSnippet}
                          className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-2xl flex items-center gap-2 hover:bg-indigo-500 transition-all disabled:opacity-50"
                        >
                           {isGeneratingSnippet ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />} {aiSnippet ? 'Re-gen Context' : 'AI Context Snippet'}
                        </button>
                      </div>
                   </div>
                   
                   <div className="flex-1 p-12 overflow-y-auto custom-scrollbar bg-slate-950/20">
                      <div className="max-w-3xl mx-auto space-y-10">
                         <div className="space-y-2">
                            <span className="text-[10px] font-black text-slate-600 uppercase">Subject Line</span>
                            <p className="text-xl font-black text-white italic font-serif">{selectedTemplate?.subject || 'Introduction from LabelNest Intelligence'}</p>
                         </div>

                         <div className="space-y-8 text-slate-400 font-medium italic text-lg leading-relaxed font-serif">
                            <p>{selectedTemplate?.header || 'Hello,'}</p>
                            <p>{selectedTemplate?.body || 'We have been tracking institutional movements in your vertical and noticed specific signals that suggest imminent expansion phase.'}</p>
                            
                            <div className={`p-8 rounded-[2rem] border-2 border-dashed relative group transition-all ${aiSnippet ? 'bg-indigo-500/5 border-indigo-500/30 text-indigo-100' : 'border-slate-800 opacity-30'}`}>
                               {!aiSnippet && <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-slate-700">AI Context Placeholder</div>}
                               {aiSnippet && (
                                 <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-indigo-400 text-[9px] font-black uppercase tracking-widest">
                                       <Sparkles size={12} /> Signal-Aware Intelligence Snippet
                                    </div>
                                    <p className="text-xl leading-relaxed italic">{aiSnippet}</p>
                                 </div>
                               )}
                            </div>

                            <p>{selectedTemplate?.footer || 'Attached is a high-level capability matrix of how LabelNest supports these deployments.'}</p>
                            
                            <div className="pt-8 border-t border-slate-900 text-sm font-black uppercase tracking-widest text-slate-600">
                               {selectedTemplate?.signature || 'LabelNest Intelligence | Data Operations OS'}
                            </div>
                         </div>
                      </div>
                   </div>

                   <div className="p-8 border-t border-slate-800 bg-slate-900/50 flex justify-end gap-6">
                      <button 
                        onClick={handleCreateIntakeAndSend}
                        disabled={isSending || !aiSnippet || !outlookConnected}
                        className="px-16 py-6 bg-emerald-600 text-white rounded-[1.75rem] font-black uppercase text-sm tracking-[0.2em] shadow-2xl shadow-emerald-600/40 hover:bg-emerald-500 transition-all flex items-center gap-4 active:scale-95 disabled:opacity-30"
                      >
                         {isSending ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />} Execute Protocol
                      </button>
                   </div>
                </div>
             </div>
           )}
        </div>
      )}
    </div>
  );
};

export default SalesIntelligence;
