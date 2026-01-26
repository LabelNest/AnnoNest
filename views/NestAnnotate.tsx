
import React, { useState, useEffect } from 'react';
import { 
  PenTool, ArrowRight, Loader2, RefreshCw, Layers, Target, 
  ImageIcon, Languages, Mic, FileAudio, FileVideo, Fingerprint,
  CheckCircle2, Clock, Inbox, ChevronRight, Zap
} from 'lucide-react';
import { AnnotationTask, TenantSession, AnnotationModuleType } from '../types';
import { supabaseService } from '../services/supabaseService';

// Import Internal Hubs
import ImageHub from './ImageHub';
import VideoHub from './VideoHub';
import AudioHub from './AudioHub';
import TranscriptionHub from './TranscriptionHub';
import TranslationHub from './TranslationHub';

interface Props {
  userProfile: TenantSession;
  activeProjectId: string;
}

type SubView = 'QUEUE' | 'IMAGE_HUB' | 'VIDEO_HUB' | 'AUDIO_HUB' | 'TRANSCRIPTION_HUB' | 'TRANSLATION_HUB';

const NestAnnotate: React.FC<Props> = ({ userProfile, activeProjectId }) => {
  const [subView, setSubView] = useState<SubView>('QUEUE');
  const [tasks, setTasks] = useState<AnnotationTask[]>([]);
  const [activeTask, setActiveTask] = useState<AnnotationTask | null>(null);
  const [loading, setLoading] = useState(true);

  const loadQueue = async () => {
    setLoading(true);
    const data = await supabaseService.fetchAnnotatorTasks(userProfile.tenant_id, userProfile.user_id, activeProjectId);
    setTasks(data);
    setLoading(false);
  };

  useEffect(() => { loadQueue(); }, [userProfile.tenant_id, activeProjectId]);

  const handleEngage = (task: AnnotationTask) => {
    setActiveTask(task);
    const view = `${task.module.toUpperCase()}_HUB` as SubView;
    setSubView(view);
  };

  // Sub-router logic for internal execution planes
  if (subView === 'IMAGE_HUB') return <ImageHub onNavigate={() => setSubView('QUEUE')} projectName={activeTask?.metadata?.name} />;
  if (subView === 'VIDEO_HUB') return <VideoHub onNavigate={() => setSubView('QUEUE')} projectName={activeTask?.metadata?.name} />;
  if (subView === 'AUDIO_HUB') return <AudioHub onNavigate={() => setSubView('QUEUE')} projectName={activeTask?.metadata?.name} />;
  if (subView === 'TRANSCRIPTION_HUB') return <TranscriptionHub userProfile={userProfile} onNavigate={() => setSubView('QUEUE')} />;
  if (subView === 'TRANSLATION_HUB') return <TranslationHub onNavigate={() => setSubView('QUEUE')} />;

  const moduleCards: { type: AnnotationModuleType; icon: any; view: SubView }[] = [
    { type: 'Image', icon: ImageIcon, view: 'IMAGE_HUB' },
    { type: 'Video', icon: FileVideo, view: 'VIDEO_HUB' },
    { type: 'Audio', icon: FileAudio, view: 'AUDIO_HUB' },
    { type: 'Transcription', icon: Mic, view: 'TRANSCRIPTION_HUB' },
    { type: 'Translation', icon: Languages, view: 'TRANSLATION_HUB' },
  ];

  const statusCounts = {
    pending: tasks.filter(t => t.status === 'assigned' || t.status === 'in_progress').length,
    submitted: tasks.filter(t => t.status === 'submitted').length,
    completed: tasks.filter(t => t.status === 'completed').length,
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-500 max-w-[1600px] mx-auto pb-40 text-text-primary dark:text-white">
      <header className="flex justify-between items-end border-b border-border-ui dark:border-slate-800 pb-16">
        <div className="space-y-6">
          <h1 className="text-8xl font-black flex items-center gap-8 tracking-tighter uppercase italic font-serif leading-none">
            <PenTool className="text-accent-primary shrink-0" size={80} />
            Execution
          </h1>
          <p className="text-text-secondary font-medium text-xl italic flex items-center gap-4">
             <Fingerprint size={26} className="text-accent-primary" /> Operational Plane — <span className="text-accent-primary font-black uppercase text-xs tracking-[0.4em] bg-accent-primary/10 px-6 py-2 rounded-full border border-accent-primary/20 shadow-2xl italic">Refinery Lab v1.3</span>
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={loadQueue} className="p-4 bg-slate-100 dark:bg-slate-900 border border-border-ui dark:border-slate-800 text-slate-500 rounded-2xl hover:text-white transition-all shadow-xl active:scale-95">
            <RefreshCw size={24} className={loading ? 'animate-spin' : ''}/>
          </button>
        </div>
      </header>

      {/* HUB ACCESS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {moduleCards.map(m => {
          const countPending = tasks.filter(t => t.module === m.type && (t.status === 'assigned' || t.status === 'in_progress')).length;
          return (
            <button 
              key={m.type}
              onClick={() => setSubView(m.view)}
              className="p-8 rounded-[3rem] border-2 transition-all text-left relative overflow-hidden group bg-card-panel dark:bg-[#0E1626] border-border-ui dark:border-[#1C2A44] hover:border-accent-primary/40 shadow-xl"
            >
              <div className="absolute -right-4 -top-4 opacity-5 group-hover:scale-110 transition-transform text-accent-primary"><m.icon size={120} /></div>
              <div className="relative z-10 flex flex-col h-full pointer-events-none">
                <m.icon size={24} className="mb-6 text-accent-primary" />
                <h4 className="text-xl font-black uppercase italic font-serif mb-auto">{m.type} Hub</h4>
                <div className="pt-6 flex items-center justify-between">
                   <div className="flex flex-col">
                      <span className="text-[8px] font-black uppercase tracking-widest opacity-60">Backlog</span>
                      <span className="text-xl font-black text-text-primary dark:text-white">{countPending} Pending</span>
                   </div>
                   <div className="p-2.5 bg-accent-primary/10 text-accent-primary rounded-xl border border-accent-primary/20 group-hover:bg-accent-primary group-hover:text-white transition-all shadow-lg">
                      <ArrowRight size={18} />
                   </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="bg-card-panel dark:bg-[#0E1626] border border-border-ui dark:border-slate-800 rounded-[4rem] overflow-hidden shadow-4xl flex flex-col min-h-[600px]">
        <header className="px-10 py-8 bg-slate-950/40 border-b border-slate-800 flex items-center justify-between">
           <div className="flex items-center gap-6">
              <div className="w-10 h-10 rounded-xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center text-accent-primary">
                 <Inbox size={18}/>
              </div>
              <h3 className="text-xl font-black italic font-serif uppercase tracking-tight">Assigned Protocols</h3>
           </div>
           <button onClick={loadQueue} className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-500 hover:text-white transition-all shadow-lg">
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''}/>
           </button>
        </header>

        <div className="flex-1 overflow-x-auto custom-scrollbar">
           <table className="w-full text-left border-collapse">
              <thead className="bg-slate-950/20 border-b border-slate-800 text-[11px] font-black text-slate-600 uppercase tracking-[0.4em]">
                 <tr>
                    <th className="px-10 py-8">Protocol Node</th>
                    <th className="px-8 py-8">Category</th>
                    <th className="px-8 py-8 text-center">Urgency</th>
                    <th className="px-8 py-8 text-center">Status</th>
                    <th className="px-10 py-8 text-right">Execution</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                 {tasks.map(t => (
                   <tr key={t.id} className="hover:bg-accent-primary/5 transition-all group border-l-[6px] border-transparent hover:border-accent-primary">
                      <td className="px-10 py-8">
                         <div className="flex items-center gap-6">
                            <div className="w-12 h-12 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center text-accent-primary shadow-inner font-black italic font-serif">
                               {t.module[0]}
                            </div>
                            <div>
                               <p className="text-base font-black text-white italic font-serif uppercase leading-none mb-1.5">{t.name}</p>
                               <p className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">{t.id}</p>
                            </div>
                         </div>
                      </td>
                      <td className="px-8 py-8">
                         <span className="text-[10px] font-black uppercase text-slate-500 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800 italic">{t.module} Hub</span>
                      </td>
                      <td className="px-8 py-8 text-center">
                         <span className={`px-4 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border italic ${
                           t.priority === 'CRITICAL' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                           t.priority === 'HIGH' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                           'bg-slate-950 text-slate-700 border-slate-800'
                         }`}>{t.priority}</span>
                      </td>
                      <td className="px-8 py-8 text-center">
                         <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border italic ${
                           t.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' :
                           t.status === 'submitted' ? 'bg-blue-600/10 text-blue-400' :
                           'bg-amber-500/10 text-amber-500 animate-pulse'
                         }`}>{t.status}</span>
                      </td>
                      <td className="px-10 py-8 text-right">
                         <button 
                           onClick={() => handleEngage(t)}
                           className="px-8 py-3 bg-accent-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-blue hover:brightness-110 active:scale-95 transition-all flex items-center gap-3 ml-auto"
                         >
                            Engage <ChevronRight size={14}/>
                         </button>
                      </td>
                   </tr>
                 ))}
              </tbody>
           </table>
        </div>
      </div>
    </div>
  );
};

export default NestAnnotate;
