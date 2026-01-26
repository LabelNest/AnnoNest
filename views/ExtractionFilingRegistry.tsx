
import React, { useState, useEffect } from 'react';
import { 
  Landmark, RefreshCw, Plus, FileText, Search, ChevronRight, 
  ExternalLink, Loader2, Database, ShieldCheck, Clock, Layers
} from 'lucide-react';
import { supabaseService } from '../services/supabaseService';
import { EntityFiling, UserProfile, Entity } from '../types';

const ExtractionFilingRegistry: React.FC<{ userProfile: UserProfile }> = ({ userProfile }) => {
  const [filings, setFilings] = useState<EntityFiling[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newFiling, setNewFiling] = useState({ entityId: '', authority: 'SEC', type: '13F', uid: '', year: 2025, url: '' });

  const loadData = async () => {
    setLoading(true);
    const [fData, eData] = await Promise.all([
      supabaseService.fetchEntityFilings(userProfile.tenant_id),
      supabaseService.fetchEntities(userProfile.tenant_id)
    ]);
    setFilings(fData);
    setEntities(eData);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [userProfile.tenant_id]);

  const handleAdd = async () => {
    if (!newFiling.entityId || !newFiling.uid) return;
    const res = await supabaseService.addEntityFiling({
      entity_id: newFiling.entityId,
      filing_authority: newFiling.authority,
      filing_type: newFiling.type,
      filing_unique_id: newFiling.uid,
      filing_year: newFiling.year,
      filing_url: newFiling.url,
      status: 'PENDING',
      tenant_id: userProfile.tenant_id
    });
    // Fixed: Using property check 'data' in res to narrow union type
    if ('data' in res && res.data) {
      loadData();
      setShowAdd(false);
    }
  };

  if (loading) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-emerald-500" size={48} /></div>;

  return (
    <div className="space-y-12 animate-in fade-in duration-500 max-w-[1600px] mx-auto pb-40">
      <header className="flex justify-between items-end border-b border-[#1C2A44] pb-12">
        <div className="space-y-6">
          <h1 className="text-6xl font-black flex items-center gap-8 text-white tracking-tighter uppercase italic font-serif leading-none">
            <Landmark className="text-emerald-500" size={64} /> Filing Registry
          </h1>
          <p className="text-slate-400 font-medium text-lg italic flex items-center gap-4">
             <FileText size={20} className="text-emerald-500" /> Regulatory Ledger — <span className="text-emerald-500 font-black uppercase text-xs tracking-[0.4em] bg-emerald-500/10 px-4 py-1.5 rounded-full border border-emerald-500/20 shadow-xl italic">Auditable Artifact Intake</span>
          </p>
        </div>
        <button onClick={() => setShowAdd(true)} className="px-10 py-5 bg-emerald-600 text-white rounded-[2rem] text-sm font-black uppercase tracking-widest shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center gap-4">
           <Plus size={20} /> Register Disclosure
        </button>
      </header>

      <div className="grid grid-cols-1 gap-6">
         {filings.length === 0 ? (
           <div className="py-40 text-center opacity-20"><Database size={64} className="mx-auto mb-6"/><p className="text-2xl font-black italic font-serif uppercase">Registry sequence empty.</p></div>
         ) : filings.map(f => {
           const entity = entities.find(e => e.id === f.entity_id);
           return (
             <div key={f.id} className="bg-[#0E1626] border border-[#1C2A44] p-10 rounded-[3rem] flex items-center justify-between shadow-2xl group hover:border-emerald-500/30 transition-all">
                <div className="flex items-center gap-12">
                   <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">Institutional Signature</span>
                      <p className="text-xl font-black text-white italic font-serif uppercase tracking-tight leading-none mb-1">{entity?.name || 'UNKNOWN'}</p>
                      <span className="text-[9px] font-mono text-slate-700 uppercase italic">Filing Node: {f.filing_unique_id}</span>
                   </div>
                   <div className="h-12 w-px bg-slate-800"></div>
                   <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">Filing Handshake</span>
                      <div className="flex items-center gap-4">
                         <span className="px-3 py-1 rounded-lg bg-slate-950 border border-[#1C2A44] text-[11px] font-black text-emerald-500 uppercase italic">{f.filing_authority} // {f.filing_type}</span>
                         <span className="text-lg font-black text-slate-200 italic font-serif">{f.filing_year}</span>
                      </div>
                   </div>
                </div>
                <div className="flex items-center gap-8">
                   <div className="flex flex-col items-end">
                      <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Pipeline State</span>
                      <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest italic ${f.status === 'COMPLETED' ? 'text-emerald-500' : 'text-amber-500'}`}>{f.status}</span>
                   </div>
                   <div className="h-12 w-px bg-slate-800"></div>
                   <button className="p-4 bg-slate-950 border border-[#1C2A44] text-slate-500 rounded-2xl hover:text-white transition-all"><RefreshCw size={24}/></button>
                   <a href={f.filing_url} target="_blank" rel="noreferrer" className="p-4 bg-emerald-600 text-white rounded-2xl shadow-lg hover:brightness-110 active:scale-90 transition-all"><ExternalLink size={24}/></a>
                </div>
             </div>
           );
         })}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-[200] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-10 animate-in zoom-in-95">
           <div className="bg-[#0E1626] border border-[#1C2A44] rounded-[4rem] p-16 max-w-4xl w-full shadow-3xl relative overflow-hidden flex flex-col">
              <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500"></div>
              <h2 className="text-4xl font-black text-white italic font-serif uppercase tracking-tight mb-12">Commit Filing to Ledger</h2>
              <div className="grid grid-cols-2 gap-x-12 gap-y-8">
                 <div className="space-y-3"><label className="text-[11px] font-black text-slate-600 uppercase ml-6">Institutional Node</label><select className="w-full bg-slate-950 border border-[#1C2A44] rounded-[2rem] p-6 text-white font-bold outline-none" value={newFiling.entityId} onChange={e => setNewFiling({...newFiling, entityId: e.target.value})}>{entities.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</select></div>
                 <div className="space-y-3"><label className="text-[11px] font-black text-slate-600 uppercase ml-6">Filing UID</label><input className="w-full bg-slate-950 border border-[#1C2A44] rounded-[2rem] p-6 text-white font-bold outline-none" placeholder="e.g. 0001234567..." value={newFiling.uid} onChange={e => setNewFiling({...newFiling, uid: e.target.value})} /></div>
                 <div className="space-y-3"><label className="text-[11px] font-black text-slate-600 uppercase ml-6">Filing Type</label><input className="w-full bg-slate-950 border border-[#1C2A44] rounded-[2rem] p-6 text-white font-bold outline-none" placeholder="e.g. 13F-HR" value={newFiling.type} onChange={e => setNewFiling({...newFiling, type: e.target.value})} /></div>
                 <div className="space-y-3"><label className="text-[11px] font-black text-slate-600 uppercase ml-6">Temporal Node (Year)</label><input type="number" className="w-full bg-slate-950 border border-[#1C2A44] rounded-[2rem] p-6 text-white font-bold outline-none" value={newFiling.year} onChange={e => setNewFiling({...newFiling, year: parseInt(e.target.value)})} /></div>
                 <div className="col-span-2 space-y-3"><label className="text-[11px] font-black text-slate-600 uppercase ml-6">Protocol Address (URL)</label><input className="w-full bg-slate-950 border border-[#1C2A44] rounded-[2rem] p-6 text-white font-bold outline-none" placeholder="https://..." value={newFiling.url} onChange={e => setNewFiling({...newFiling, url: e.target.value})} /></div>
              </div>
              <div className="flex gap-6 pt-12">
                 <button onClick={() => setShowAdd(false)} className="flex-1 py-6 bg-slate-900 border border-[#1C2A44] text-slate-500 rounded-[2rem] font-black uppercase tracking-widest">Abort</button>
                 <button onClick={handleAdd} className="flex-[2] py-6 bg-emerald-600 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-lg">Persist Handshake</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ExtractionFilingRegistry;
