
import React, { useState, useEffect } from 'react';
import { 
  Cpu, Plus, RefreshCw, Loader2, Globe, 
  Clock, X, ChevronRight, Settings2,
  ArrowLeft, Landmark
} from 'lucide-react';
import { supabaseService } from '../services/supabaseService';
import { SchedulerJob, UserProfile, Entity } from '../types';

interface Props {
  userProfile: UserProfile;
  onBack: () => void;
}

const ExtractionSettings: React.FC<Props> = ({ userProfile, onBack }) => {
  const [jobs, setJobs] = useState<SchedulerJob[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [newJob, setNewJob] = useState<Partial<SchedulerJob>>({
    document_type: 'WEBSITE',
    frequency_minutes: 1440, // 24h
    is_active: true
  });

  const loadData = async () => {
    setLoading(true);
    const [jobData, entityData] = await Promise.all([
      supabaseService.fetchSchedulerJobs(userProfile.tenant_id),
      supabaseService.fetchEntities(userProfile.tenant_id)
    ]);
    setJobs(jobData);
    setEntities(entityData);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJob.entity_id || !newJob.source_url) return;
    setSubmitting(true);
    const res = await supabaseService.createSchedulerJob({
      ...newJob,
      tenant_id: userProfile.tenant_id 
    } as any);
    /** Fix: Checking data property in result instead of non-existent success */
    if ('data' in res && res.data) {
      setShowAdd(false);
      loadData();
    }
    setSubmitting(false);
  };

  if (loading) return (
    <div className="h-full flex items-center justify-center">
      <Loader2 className="animate-spin text-brand-primary" size={40} />
    </div>
  );

  return (
    <div className="space-y-12 animate-in fade-in duration-500 max-w-[1600px] mx-auto pb-40">
      <header className="flex justify-between items-end border-b border-border-ui dark:border-slate-800 pb-10">
        <div className="flex items-center gap-10">
           <button onClick={onBack} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-slate-500 hover:text-white transition-all shadow-lg">
             <ArrowLeft size={24} />
           </button>
           <div className="space-y-4">
             <h1 className="text-6xl font-black flex items-center gap-6 text-text-primary dark:text-white tracking-tighter uppercase italic font-serif leading-none">
               <Cpu className="text-brand-primary shrink-0" size={54} /> Monitor
             </h1>
             <p className="text-text-secondary font-medium text-lg italic">Autonomous Extraction Protocols</p>
           </div>
        </div>
        <button onClick={() => setShowAdd(true)} className="px-10 py-5 bg-brand-primary text-white rounded-[2rem] text-xs font-black uppercase tracking-widest shadow-2xl hover:brightness-110 active:scale-95 transition-all flex items-center gap-4">
           <Plus size={20} /> Initialize Protocol
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {jobs.map(job => (
          <div key={job.id} className="bg-slate-900 border border-slate-800 rounded-[3.5rem] p-12 space-y-10 shadow-2xl relative overflow-hidden group">
             <div className={`absolute top-0 left-0 w-full h-2 ${job.is_active ? 'bg-emerald-600' : 'bg-slate-800'}`}></div>
             <div className="space-y-4">
                <div className="w-16 h-16 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center text-blue-500 mb-6 shadow-inner">
                   <Landmark size={28} />
                </div>
                <h3 className="text-2xl font-black text-white italic font-serif uppercase tracking-tight truncate leading-none">
                  {entities.find(e => e.id === job.entity_id)?.name || 'Institutional Node'}
                </h3>
                <div className="flex items-center gap-3 pt-2">
                   <Globe size={14} className="text-slate-700" />
                   <p className="text-[10px] text-slate-500 font-mono truncate">{job.source_url}</p>
                </div>
             </div>
             <div className="pt-10 border-t border-slate-800 flex items-center justify-between">
                <div className="flex flex-col">
                   <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Cycle</span>
                   <span className="text-xs font-bold text-blue-400 italic">Every {job.frequency_minutes / 60}h</span>
                </div>
                <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase border ${job.is_active ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-slate-950 text-slate-700 border-slate-800'}`}>
                  {job.is_active ? 'ACTIVE' : 'OFFLINE'}
                </div>
             </div>
          </div>
        ))}
        {jobs.length === 0 && (
          <div className="col-span-full py-40 text-center opacity-20">
             <Settings2 size={64} className="mx-auto mb-6" />
             <p className="text-xl font-black italic font-serif uppercase">Scheduler Empty.</p>
          </div>
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-[200] bg-slate-950/95 backdrop-blur-3xl flex items-center justify-center p-10 animate-in fade-in">
           <form onSubmit={handleCreate} className="bg-[#0B1220] border border-slate-800 rounded-[4rem] p-20 max-w-2xl w-full shadow-3xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-brand-primary"></div>
              <button onClick={() => setShowAdd(false)} className="absolute top-10 right-10 text-slate-500 hover:text-white transition-all"><X size={40} /></button>
              <h2 className="text-5xl font-black text-white italic font-serif uppercase tracking-tight mb-12">Initialize Monitor</h2>
              <div className="space-y-10">
                 <div className="space-y-4">
                    <label className="text-[11px] font-black text-slate-600 uppercase tracking-widest ml-6">Registry Node</label>
                    <select 
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-[2rem] p-6 text-lg text-white font-bold italic font-serif appearance-none cursor-pointer outline-none focus:ring-4 focus:ring-blue-500/10"
                      value={newJob.entity_id}
                      onChange={e => setNewJob({...newJob, entity_id: e.target.value})}
                    >
                       <option value="">Select target...</option>
                       {entities.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </select>
                 </div>
                 <div className="space-y-4">
                    <label className="text-[11px] font-black text-slate-600 uppercase tracking-widest ml-6">Document Type</label>
                    <select 
                      className="w-full bg-slate-950 border border-slate-800 rounded-[2rem] p-6 text-lg text-white font-bold italic font-serif appearance-none cursor-pointer outline-none"
                      value={newJob.document_type}
                      onChange={e => setNewJob({...newJob, document_type: e.target.value as any})}
                    >
                       <option value="WEBSITE">Website Crawler</option>
                       <option value="PDF">Institutional PDF</option>
                       <option value="FILING">Legal Filing</option>
                    </select>
                 </div>
                 <div className="space-y-4">
                    <label className="text-[11px] font-black text-slate-600 uppercase tracking-widest ml-6">Source URL</label>
                    <input 
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-[2rem] p-6 text-lg text-white font-bold italic font-serif outline-none" 
                      placeholder="https://..." 
                      value={newJob.source_url}
                      onChange={e => setNewJob({...newJob, source_url: e.target.value})}
                    />
                 </div>
              </div>
              <button 
                type="submit"
                disabled={submitting}
                className="w-full mt-16 py-8 bg-brand-primary text-white rounded-[3rem] font-black uppercase text-sm tracking-[0.4em] shadow-3xl hover:brightness-110 transition-all flex items-center justify-center gap-6 active:scale-95"
              >
                 {submitting ? <Loader2 className="animate-spin" size={32}/> : <>Deploy Protocol <ChevronRight size={32}/></>}
              </button>
           </form>
        </div>
      )}
    </div>
  );
};

export default ExtractionSettings;
