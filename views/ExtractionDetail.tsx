
import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, FileText, Globe, Clock, History, Sparkles, 
  Loader2, ShieldCheck, Database, Zap,
  Activity, ArrowRight, ShieldAlert
} from 'lucide-react';
import { supabaseService } from '../services/supabaseService';
// Fixed: Using unified type names from types.ts
import { EntityDocument, EntityDocumentVersion as DocumentVersion, EntityDocumentDiff as DocumentDiff, EntityDocumentIntelligence as DocumentIntelligence } from '../types';

interface Props {
  documentId: string;
  onBack: () => void;
}

type Tab = 'DETAIL' | 'VERSIONS' | 'DIFFS' | 'INTEL';

const ExtractionDetail: React.FC<Props> = ({ documentId, onBack }) => {
  const [activeTab, setActiveTab] = useState<Tab>('DETAIL');
  const [doc, setDoc] = useState<EntityDocument | null>(null);
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [diffs, setDiffs] = useState<DocumentDiff[]>([]);
  const [intel, setIntel] = useState<DocumentIntelligence[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    // Fixed: supabaseService methods now implemented
    const [d, v, diffData, i] = await Promise.all([
      supabaseService.fetchDocumentById(documentId),
      supabaseService.fetchDocumentVersions(documentId),
      supabaseService.fetchDocumentDiffs(documentId),
      supabaseService.fetchDocumentIntelligence(documentId)
    ]);
    setDoc(d);
    setVersions(v);
    setDiffs(diffData);
    setIntel(i);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [documentId]);

  if (loading) return (
    <div className="h-full flex items-center justify-center">
      <Loader2 className="animate-spin text-brand-primary" size={40} />
    </div>
  );

  if (!doc) return (
    <div className="p-20 text-center">
      <ShieldAlert className="mx-auto text-rose-500 mb-6" size={64} />
      <p className="text-xl font-black italic font-serif text-white uppercase">Artifact Lost</p>
      <button onClick={onBack} className="mt-8 text-blue-500 font-bold uppercase text-xs">Return to Feed</button>
    </div>
  );

  const TabItem = ({ id, label, icon: Icon, count }: any) => (
    <button 
      onClick={() => setActiveTab(id)}
      className={`px-10 py-5 border-b-2 transition-all flex items-center gap-3 ${activeTab === id ? 'border-brand-primary bg-brand-primary/5 text-white' : 'border-transparent text-slate-500 hover:text-white hover:bg-slate-900'}`}
    >
      <Icon size={16} />
      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
      {count !== undefined && <span className="text-[8px] font-mono bg-slate-950 px-2 py-0.5 rounded-full text-slate-600 ml-2">{count}</span>}
    </button>
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-500 max-w-[1600px] mx-auto pb-40">
      <header className="flex items-center gap-10 border-b border-slate-800 pb-12">
        <button onClick={onBack} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-slate-500 hover:text-white transition-all">
          <ArrowLeft size={24} />
        </button>
        <div>
          <div className="flex items-center gap-4 mb-2">
            <span className="text-[10px] font-black text-brand-primary uppercase tracking-[0.4em] bg-brand-primary/10 px-4 py-1.5 rounded-full border border-brand-primary/20">Refinery Node</span>
            <span className="text-[10px] font-mono text-slate-700 uppercase">HASH: {doc.current_hash?.slice(0, 16)}</span>
          </div>
          <h1 className="text-5xl font-black text-white italic font-serif tracking-tight leading-none uppercase">{doc.source_name}</h1>
        </div>
      </header>

      <nav className="flex bg-slate-900/40 border-b border-slate-800 overflow-x-auto">
        <TabItem id="DETAIL" label="Extraction Kernel" icon={FileText} />
        <TabItem id="VERSIONS" label="Lineage Ledger" icon={History} count={versions.length} />
        <TabItem id="DIFFS" label="Differential Trace" icon={Activity} count={diffs.length} />
        <TabItem id="INTEL" label="Derived Intelligence" icon={Sparkles} count={intel.length} />
      </nav>

      <main className="min-h-[500px]">
        {activeTab === 'DETAIL' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 animate-in slide-in-from-bottom-4">
             <div className="lg:col-span-8 space-y-10">
                <section className="bg-slate-950 border border-slate-800 rounded-[3rem] p-12 shadow-inner relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-10 text-blue-500/5 group-hover:text-blue-500/10 transition-colors"><Database size={240}/></div>
                   <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.5em] mb-10 flex items-center gap-3 relative z-10"><Zap size={16}/> Immutable Trace</h4>
                   <div className="relative z-10 bg-slate-900/60 p-10 rounded-[2rem] border border-slate-800/50 shadow-2xl">
                      <p className="text-[18px] text-slate-300 leading-relaxed italic font-serif whitespace-pre-wrap select-all selection:bg-blue-500/30">
                        {doc.extracted_text || 'No extracted artifact persisted for this node.'}
                      </p>
                   </div>
                </section>
             </div>
             <aside className="lg:col-span-4 space-y-8">
                <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-10 space-y-8 shadow-2xl">
                   <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] border-b border-slate-800 pb-6 flex items-center gap-3"><Globe size={18}/> Registry Metadata</h4>
                   <div className="space-y-6">
                      {[
                        { label: 'Ingestion Method', val: doc.ingestion_method },
                        { label: 'Document Type', val: doc.document_type },
                        { label: 'Page Count', val: `${doc.page_count} Units` },
                        { label: 'Protocol URL', val: doc.source_url, font: 'font-mono text-[9px]' }
                      ].map((item, i) => (
                        <div key={i} className="space-y-2">
                           <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{item.label}</p>
                           <p className={`text-sm font-bold text-white italic truncate ${item.font || ''}`}>{item.val}</p>
                        </div>
                      ))}
                   </div>
                </div>
                <div className="p-8 bg-blue-600/5 border border-blue-600/10 rounded-[3rem] space-y-4 shadow-inner text-center">
                   <h5 className="text-[10px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-3 justify-center"><ShieldCheck size={16}/> Policy Enforced</h5>
                   <p className="text-xs text-slate-500 leading-relaxed italic font-medium">Extractions are read-only and audited at the kernel level. Manual edits are restricted to the clearance plane.</p>
                </div>
             </aside>
          </div>
        )}

        {activeTab === 'VERSIONS' && (
          <div className="space-y-6 animate-in slide-in-from-right-4">
             {versions.map(v => (
               <div key={v.id} className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] flex items-center justify-between hover:border-blue-500/40 transition-all shadow-xl group">
                  <div className="flex items-center gap-8">
                     <div className="w-14 h-14 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform"><History size={24}/></div>
                     <div>
                        <p className="text-lg font-black text-white italic font-serif uppercase tracking-tight">Cycle v{v.content_hash.slice(0, 6).toUpperCase()}</p>
                        <p className="text-[9px] font-mono text-slate-600 uppercase mt-1 tracking-widest">{new Date(v.created_at).toLocaleString()}</p>
                     </div>
                  </div>
                  <button className="px-6 py-3 bg-slate-950 border border-slate-800 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-white transition-all shadow-lg flex items-center gap-3">
                     Inspect Snapshot <ArrowRight size={14}/>
                  </button>
               </div>
             ))}
             {versions.length === 0 && <p className="py-20 text-center text-slate-600 italic">No historical snapshots recorded.</p>}
          </div>
        )}

        {activeTab === 'DIFFS' && (
          <div className="space-y-10 animate-in slide-in-from-right-4">
             {diffs.map(diff => (
               <div key={diff.id} className="bg-slate-950 border border-slate-800 rounded-[3rem] overflow-hidden shadow-3xl">
                  <header className="px-10 py-6 bg-slate-900/40 border-b border-slate-800 flex items-center justify-between">
                     <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-3"><Activity size={14} className="text-amber-500" /> Differential Handshake</span>
                     <span className="text-[10px] font-mono text-slate-700 uppercase">{new Date(diff.created_at).toLocaleString()}</span>
                  </header>
                  <div className="grid grid-cols-2 divide-x divide-slate-800">
                     <div className="p-10 space-y-6">
                        <h5 className="text-[9px] font-black text-emerald-500 uppercase tracking-widest ml-4">Additions (+)</h5>
                        <div className="p-8 bg-emerald-500/5 rounded-[2rem] border border-emerald-500/10 h-60 overflow-y-auto custom-scrollbar">
                           <p className="text-sm text-emerald-400 font-mono italic leading-relaxed whitespace-pre-wrap">{diff.added_text || 'NO_ADD_SIGNAL'}</p>
                        </div>
                     </div>
                     <div className="p-10 space-y-6">
                        <h5 className="text-[9px] font-black text-rose-500 uppercase tracking-widest ml-4">Pruned (-)</h5>
                        <div className="p-8 bg-rose-500/5 rounded-[2rem] border border-rose-500/10 h-60 overflow-y-auto custom-scrollbar">
                           <p className="text-sm text-rose-400 font-mono italic leading-relaxed whitespace-pre-wrap line-through opacity-50">{diff.removed_text || 'NO_PRUNE_SIGNAL'}</p>
                        </div>
                     </div>
                  </div>
               </div>
             ))}
             {diffs.length === 0 && <p className="py-20 text-center text-slate-600 italic font-serif text-2xl opacity-20 uppercase tracking-tighter">Zero differential delta detected.</p>}
          </div>
        )}

        {activeTab === 'INTEL' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-bottom-4">
             {intel.map(item => (
               <div key={item.id} className="bg-slate-900 border border-slate-800 p-10 rounded-[3.5rem] space-y-8 shadow-3xl group relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-10 text-brand-primary/5 group-hover:text-brand-primary/10 transition-colors"><Sparkles size={160}/></div>
                  <div className="flex justify-between items-start relative z-10">
                     <div>
                        <span className="text-[10px] font-black text-brand-primary uppercase tracking-widest bg-brand-primary/10 border border-brand-primary/20 px-3 py-1 rounded-lg italic">{item.insight_type}</span>
                        <p className="text-[9px] font-mono text-slate-600 uppercase mt-2">{new Date(item.created_at).toLocaleString()}</p>
                     </div>
                     <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border italic ${
                       item.approval_status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                       item.approval_status === 'REJECTED' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                       'bg-amber-500/10 text-amber-500 border-amber-500/20'
                     }`}>{item.approval_status}</span>
                  </div>
                  <div className="relative z-10 space-y-4">
                     <p className="text-2xl font-black text-white italic font-serif uppercase tracking-tight leading-tight">"{item.insight}"</p>
                     <div className="flex flex-col pt-6 border-t border-slate-800">
                        <span className="text-[9px] font-black text-slate-600 uppercase mb-1">Inference Confidence</span>
                        <div className="flex items-center gap-3">
                           <div className="w-24 h-1 bg-slate-950 rounded-full overflow-hidden shadow-inner">
                              <div className="h-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" style={{ width: `${item.confidence_score * 100}%` }}></div>
                           </div>
                           <span className="text-xs font-mono font-bold text-blue-400">{(item.confidence_score * 100).toFixed(0)}%</span>
                        </div>
                     </div>
                  </div>
               </div>
             ))}
             {intel.length === 0 && <div className="col-span-full py-40 text-center opacity-20"><Sparkles size={64} className="mx-auto mb-6"/><p className="text-2xl font-black italic font-serif uppercase">No derived insights generated.</p></div>}
          </div>
        )}
      </main>
    </div>
  );
};

export default ExtractionDetail;
