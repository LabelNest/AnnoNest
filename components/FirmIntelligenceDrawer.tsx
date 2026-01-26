
import React, { useState } from 'react';
import { 
  X, Globe, FileText, History, Zap, ShieldCheck, 
  TrendingUp, Activity, Target, Landmark, Calendar, MapPin, 
  Clock, ArrowUpRight, CheckCircle2, Fingerprint, Layers
} from 'lucide-react';
import { FirmIntelligenceMetric } from '../types';

interface Props {
  firm: FirmIntelligenceMetric | null;
  onClose: () => void;
}

type Tab = 'OVERVIEW' | 'WEBSITE' | 'FILINGS' | 'HISTORY';

const FirmIntelligenceDrawer: React.FC<Props> = ({ firm, onClose }) => {
  const [activeTab, setActiveTab] = useState<Tab>('OVERVIEW');

  if (!firm) return null;

  const TabButton = ({ id, label, icon: Icon }: any) => (
    <button 
      onClick={() => setActiveTab(id)}
      className={`px-8 py-5 border-b-2 transition-all flex items-center gap-3 ${activeTab === id ? 'border-blue-500 bg-blue-500/5 text-white' : 'border-transparent text-slate-500 hover:text-white hover:bg-slate-900'}`}
    >
      <Icon size={16} />
      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    </button>
  );

  const MetricItem = ({ label, val, sub, icon: Icon, color = 'blue' }: any) => (
    <div className="p-8 bg-slate-950 border border-slate-900 rounded-[2.5rem] shadow-inner space-y-6 relative overflow-hidden group">
      <div className={`absolute top-0 right-0 p-6 opacity-5 text-${color}-500 group-hover:scale-110 transition-transform`}><Icon size={80}/></div>
      <div className="relative z-10">
        <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] mb-3">{label}</p>
        <p className={`text-4xl font-black italic font-serif leading-none tracking-tighter text-${color}-400`}>{val}</p>
        {sub && <p className="text-[10px] text-slate-500 mt-3 italic font-medium">"{sub}"</p>}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[200] overflow-hidden pointer-events-none">
       <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm pointer-events-auto" onClick={onClose}></div>
       <aside className="absolute top-0 right-0 h-full w-[650px] bg-[#0d121f] border-l border-slate-800 shadow-3xl pointer-events-auto flex flex-col animate-in slide-in-from-right duration-500">
          
          <header className="px-10 py-10 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900/40 backdrop-blur-md">
             <div className="flex items-center gap-8">
                <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black italic font-serif text-3xl shadow-3xl shadow-blue-600/30">{firm.entity_name?.[0]}</div>
                <div>
                   <h2 className="text-3xl font-black text-white italic font-serif leading-tight uppercase tracking-tight">{firm.entity_name}</h2>
                   <div className="flex items-center gap-4 mt-2">
                      <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">{firm.entity_type} Node</span>
                      <div className="h-1 w-1 rounded-full bg-slate-700"></div>
                      <span className="text-[9px] font-mono text-slate-500 uppercase tracking-tighter">REGISTRY_HASH: {firm.entity_id.slice(0,16)}</span>
                   </div>
                </div>
             </div>
             <button onClick={onClose} className="p-4 text-slate-600 hover:text-white transition-all active:scale-90"><X size={32}/></button>
          </header>

          <nav className="flex bg-slate-950/20 border-b border-slate-800 shrink-0">
             <TabButton id="OVERVIEW" label="Overview" icon={Activity} />
             <TabButton id="WEBSITE" label="Website Intel" icon={Globe} />
             <TabButton id="FILINGS" label="Filing Intel" icon={FileText} />
             <TabButton id="HISTORY" label="History" icon={History} />
          </nav>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-10">
             
             {activeTab === 'OVERVIEW' && (
               <div className="space-y-10 animate-in fade-in duration-500">
                  <div className="grid grid-cols-2 gap-6">
                     <MetricItem label="Activity State" val={firm.activity_status} icon={Zap} color={firm.activity_status === 'ACTIVE' ? 'emerald' : 'slate'} />
                     <MetricItem label="Velocity Score" val={firm.change_velocity_score.toFixed(1)} icon={TrendingUp} color="blue" />
                     <MetricItem label="Confidence" val={`${firm.source_reliability_score}%`} icon={ShieldCheck} color="indigo" />
                     <MetricItem label="Confirmation" val={`${Math.round(firm.confirmation_rate * 100)}%`} icon={CheckCircle2} color="emerald" />
                  </div>

                  <section className="bg-slate-950 border border-slate-900 rounded-[3rem] p-10 space-y-8 shadow-inner">
                     <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] flex items-center gap-3"><MapPin size={16}/> Jurisdictional Coverage</h4>
                     <div className="flex flex-wrap gap-3">
                        {firm.countries_covered.map(c => (
                          <span key={c} className="px-6 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-black text-slate-400 uppercase tracking-widest">{c}</span>
                        ))}
                     </div>
                     <p className="text-[10px] text-slate-500 italic font-medium leading-relaxed pt-6 border-t border-slate-900">
                        Most active jurisdictional node: <span className="text-blue-500 font-black">{firm.most_active_country}</span>
                     </p>
                  </section>
               </div>
             )}

             {activeTab === 'WEBSITE' && (
               <div className="space-y-10 animate-in slide-in-from-bottom-4">
                  <div className="grid grid-cols-1 gap-6">
                     <MetricItem label="Total Changes Logged" val={firm.website_changes_total} icon={Layers} color="blue" />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                     <MetricItem label="Changes (30d)" val={firm.website_changes_30d} icon={Clock} color="indigo" />
                     <MetricItem label="Changes (90d)" val={firm.website_changes_90d} icon={Calendar} color="amber" />
                  </div>
                  <section className="bg-slate-950 border border-slate-900 rounded-[3rem] p-10 space-y-8 shadow-inner relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-10 text-blue-500/5"><Globe size={180}/></div>
                     <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] flex items-center gap-3"><Target size={16}/> Differential Intelligence</h4>
                     <div className="space-y-6 relative z-10">
                        <div>
                           <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Most Volatile Node</p>
                           <p className="text-xl font-black text-white italic font-serif uppercase tracking-tight">{firm.most_changed_url_type.replace('_', ' ')}</p>
                        </div>
                        <div className="pt-6 border-t border-slate-900">
                           <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Most Stable Node</p>
                           <p className="text-xl font-black text-slate-400 italic font-serif uppercase tracking-tight">{firm.least_changed_url_type.replace('_', ' ')}</p>
                        </div>
                     </div>
                  </section>
               </div>
             )}

             {activeTab === 'FILINGS' && (
               <div className="space-y-10 animate-in slide-in-from-bottom-4">
                  <MetricItem label="Total Registry Records" val={firm.filings_total} icon={Landmark} color="emerald" />
                  
                  <section className="bg-slate-950 border border-slate-900 rounded-[3rem] p-10 space-y-10 shadow-inner">
                     <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] flex items-center gap-3"><History size={16}/> Filing Temporal Distribution</h4>
                     <div className="space-y-4">
                        {Object.entries(firm.filings_by_year).sort((a,b) => b[0].localeCompare(a[0])).map(([year, count]) => (
                           <div key={year} className="flex items-center gap-6">
                              <span className="text-sm font-black text-white italic font-serif w-12">{year}</span>
                              <div className="flex-1 h-2 bg-slate-900 rounded-full overflow-hidden">
                                 <div className="h-full bg-emerald-500" style={{ width: `${(Number(count) / firm.filings_total) * 100}%` }}></div>
                              </div>
                              {/* Fixed: Cast count to ReactNode */}
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{count as React.ReactNode} Records</span>
                           </div>
                        ))}
                     </div>
                  </section>

                  <div className="grid grid-cols-1 gap-6">
                     <MetricItem label="Mean Filing Interval" val={`${Math.round(firm.avg_days_between_filings)} days`} icon={Clock} color="indigo" />
                     <MetricItem label="Latest Institutional Trace" val={new Date(firm.latest_filing_date).toLocaleDateString()} sub={`v${firm.latest_filing_year} Master`} icon={ShieldCheck} color="emerald" />
                  </div>
               </div>
             )}

             {activeTab === 'HISTORY' && (
               <div className="space-y-10 animate-in fade-in duration-500">
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-8 border-2 border-dashed border-slate-800 rounded-[4rem]">
                     <div className="p-8 bg-slate-950 border border-slate-900 rounded-[2.5rem] text-slate-800 shadow-inner">
                        <Fingerprint size={64}/>
                     </div>
                     <div className="px-12">
                        <h4 className="text-2xl font-black text-white italic font-serif uppercase tracking-tight leading-tight">Immutable Audit Log</h4>
                        <p className="text-sm text-slate-500 font-medium italic mt-4 leading-relaxed">
                           Detailed signal timeline is being reconstructed from the event ledger. Institutional traceability available in v1.2 release.
                        </p>
                     </div>
                  </div>
               </div>
             )}
          </div>

          <footer className="px-10 py-8 border-t border-slate-800 shrink-0 bg-slate-900/20 backdrop-blur-md">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                   <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest italic">Protocol Verified: Audited Intelligence Node</span>
                </div>
                <button className="flex items-center gap-2 text-blue-500 text-[10px] font-black uppercase tracking-widest hover:underline"><ArrowUpRight size={14}/> Full Matrix Access</button>
             </div>
          </footer>
       </aside>
    </div>
  );
};

export default FirmIntelligenceDrawer;
