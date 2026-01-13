
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  PenTool, Check, ChevronRight, MessageSquare, ShieldCheck, Zap, 
  FileText, FolderOpen, ArrowRight, Maximize2, 
  Play, Pause, SkipForward, SkipBack, Image as ImageIcon, 
  Video, Mic, Type, Languages, Trash2, Save, Send, AlertCircle, Loader2,
  Clock, PlusCircle, Filter, LayoutGrid, CheckSquare,
  ArrowUpRight, Target, Headphones, Languages as TranslateIcon, Volume2, Timer,
  Globe, Scissors, Activity, Layers, Info, ListTodo, MapPin, Upload, Sparkles,
  Search, Eye, SplitSquareVertical, Command, AlertTriangle, CloudUpload,
  Fingerprint, X, Database, RefreshCw, CheckCircle,
  MousePointer2, Square, Hash, Layers3, User
} from 'lucide-react';
import { ProjectType, AnnotationTask, Project, AnnotationValue } from '../types';
import { supabaseService } from '../services/supabaseService';

interface Props {
  tasks: AnnotationTask[];
  commitEntity: (entity: any, taskId?: string) => void;
}

const NestAnnotate: React.FC<Props> = ({ tasks, commitEntity }) => {
  const [viewMode, setViewMode] = useState<'PROJECTS' | 'WORKBENCH'>('PROJECTS');
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<AnnotationTask | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [localAnnotations, setLocalAnnotations] = useState<AnnotationValue[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isIngesting, setIsIngesting] = useState(false);
  const [aiSyncing, setAiSyncing] = useState(false);
  const [activeTool, setActiveTool] = useState('BOX');

  // DERIVED STATS: Real counts from the tasks pipeline
  // Added defensive optional chaining to prevent crash if projectId is missing
  const pipelineStats = useMemo(() => {
    return {
      transcription: tasks.filter(t => t.type === 'ENTITY_EXTRACTION' && t.projectId?.includes('TRANS')).length,
      translation: tasks.filter(t => t.projectId?.includes('TRANS') && t.type === 'VERIFICATION').length,
      image: tasks.filter(t => t.projectId?.includes('IMG') || t.projectId?.includes('IMAGE')).length,
      video: tasks.filter(t => t.projectId?.includes('VID')).length,
      audio: tasks.filter(t => t.projectId?.includes('AUD')).length,
    };
  }, [tasks]);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    const data = await supabaseService.fetchProjects('SYSTEM', 'LABELNEST', 'super_admin' as any);
    setProjects(data);
  };

  const handleOpenProject = (proj: Project) => {
    setProject(proj);
    const projectTasks = tasks.filter(t => t.projectId === proj.id);
    if (projectTasks.length > 0) {
      setActiveTaskId(projectTasks[0].id);
    } else {
      setActiveTaskId(null);
    }
    setViewMode('WORKBENCH');
  };

  useEffect(() => {
    if (activeTaskId) {
      const task = tasks.find(t => t.id === activeTaskId);
      if (task) {
        setActiveTask(task);
        setLocalAnnotations(task.annotations || []);
      }
    } else if (viewMode === 'WORKBENCH' && !activeTaskId) {
      setActiveTask(null);
      setLocalAnnotations([]);
    }
  }, [activeTaskId, tasks, viewMode]);

  const handleUpdateField = (fieldId: string, value: any) => {
    setLocalAnnotations(prev => prev.map(ann => 
      ann.field_id === fieldId ? { ...ann, human_value: value, final_value: value } : ann
    ));
  };

  const handleRunGemini = async () => {
    setAiSyncing(true);
    await new Promise(r => setTimeout(r, 1500));
    setLocalAnnotations(prev => prev.map(ann => ({
      ...ann,
      ai_value: ann.ai_value || "Extracted logic block",
      confidence: 0.95
    })));
    setAiSyncing(false);
  };

  const handleSubmit = async () => {
    if (!activeTask) return;
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 800)); 
    commitEntity(localAnnotations, activeTask.id);
    setIsSaving(false);
    
    const currentIndex = tasks.findIndex(t => t.id === activeTaskId);
    if (currentIndex < tasks.length - 1) {
      setActiveTaskId(tasks[currentIndex + 1].id);
    } else {
      setActiveTaskId(null);
      setViewMode('PROJECTS');
    }
  };

  const StatCard = ({ label, count, icon: Icon, color }: any) => (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between h-36 group hover:border-slate-700 transition-all shadow-xl">
       <div className="flex justify-between items-start">
          <div className={`p-3 rounded-xl bg-${color}-500/10 text-${color}-500`}>
            <Icon size={20} />
          </div>
          <span className="text-2xl font-black text-white">{count.toLocaleString()}</span>
       </div>
       <div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
          <p className="text-[9px] text-slate-600 font-bold uppercase mt-1 italic">Active Tasks</p>
       </div>
    </div>
  );

  const TranscriptionEngine = () => (
    <div className="flex-1 flex flex-col bg-slate-950 rounded-[3rem] border border-slate-800 overflow-hidden shadow-3xl">
       <div className="h-20 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-10">
          <div className="flex items-center gap-6">
             <div className="w-12 h-12 bg-blue-600/20 text-blue-500 rounded-2xl flex items-center justify-center shadow-inner">
                <Volume2 size={24} />
             </div>
             <div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Diarization Engine Active</span>
                <span className="text-xs font-bold text-white italic">meeting_registry_441.wav</span>
             </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="flex gap-1">
                <button className="p-3 bg-slate-800 text-white rounded-xl hover:bg-blue-600 transition-all"><SkipBack size={16} /></button>
                <button className="p-3 bg-white text-black rounded-xl"><Pause size={16} /></button>
                <button className="p-3 bg-slate-800 text-white rounded-xl hover:bg-blue-600 transition-all"><SkipForward size={16} /></button>
             </div>
          </div>
       </div>
       <div className="flex-1 overflow-y-auto p-12 custom-scrollbar bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:40px_40px]">
          <div className="max-w-4xl mx-auto space-y-8">
             {[
               { time: "00:01", speaker: "SPEAKER_01", text: "Initializing the quarterly wrap for the Portfolio Companies." },
               { time: "00:15", speaker: "SPEAKER_02", text: "Zephyr Logistics just reported a 40% surge in last-mile efficiency." },
               { time: "00:42", speaker: "SPEAKER_01", text: "Understood. Mapping that signal to the growth equity round." }
             ].map((line, i) => (
               <div key={i} className="group flex gap-8 items-start hover:bg-white/5 p-6 rounded-3xl transition-all cursor-pointer border border-transparent hover:border-slate-800 relative">
                  <span className="text-[10px] font-mono font-bold text-blue-500 mt-1.5 bg-blue-500/10 px-2 py-1 rounded-lg">{line.time}</span>
                  <div className="space-y-2 flex-1">
                     <div className="flex items-center gap-3">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest bg-slate-900 px-2 py-0.5 rounded border border-slate-800">{line.speaker}</span>
                        <div className="h-px flex-1 bg-slate-800 opacity-20"></div>
                     </div>
                     <p className="text-xl font-serif italic text-white leading-relaxed">{line.text}</p>
                  </div>
               </div>
             ))}
          </div>
       </div>
    </div>
  );

  const ImageEngine = () => (
    <div className="flex-1 flex flex-col bg-slate-950 rounded-[3rem] border border-slate-800 overflow-hidden shadow-3xl">
       <div className="flex-1 bg-slate-900 relative group overflow-hidden cursor-crosshair">
          <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] opacity-20"></div>
          
          <div className="absolute top-[20%] left-[30%] w-80 h-56 border-2 border-blue-500 bg-blue-500/10 shadow-[0_0_30px_rgba(59,130,246,0.2)]">
             <div className="absolute -top-7 left-0 px-3 py-1 bg-blue-600 text-white text-[10px] font-black uppercase rounded-lg shadow-xl">BOX_ANNOTATION_01</div>
          </div>
          
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
             <polygon points="100,100 200,150 150,250 50,200" className="fill-emerald-500/20 stroke-emerald-500 stroke-2" />
             <circle cx="450" cy="400" r="6" className="fill-rose-500 stroke-white stroke-2 shadow-2xl" />
          </svg>

          <div className="absolute top-8 right-8 flex flex-col gap-3">
             <div className="bg-slate-900/80 backdrop-blur border border-slate-800 p-4 rounded-2xl shadow-3xl flex flex-col gap-3">
                {[
                  { id: 'BOX', icon: Square, label: 'Bounding Box' },
                  { id: 'POLY', icon: Activity, label: 'Polygon Path' },
                  { id: 'POINT', icon: Target, label: 'Keypoint' },
                  { id: 'MASK', icon: Layers3, label: 'Semantic Mask' }
                ].map(tool => (
                  <button 
                    key={tool.id}
                    onClick={() => setActiveTool(tool.id)}
                    className={`p-3 rounded-xl transition-all ${activeTool === tool.id ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-500 hover:text-white'}`}
                    title={tool.label}
                  >
                    <tool.icon size={20} />
                  </button>
                ))}
             </div>
          </div>
       </div>
       <div className="h-24 bg-slate-900 border-t border-slate-800 px-12 flex items-center justify-between">
          <div className="flex items-center gap-6">
             <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Tool: <span className="text-white">{activeTool}</span></span>
             <div className="h-8 w-px bg-slate-800"></div>
             <div className="flex gap-2">
                <button className="px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-[10px] font-black text-slate-400 hover:text-white transition-all">Clear All</button>
                <button className="px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-[10px] font-black text-slate-400 hover:text-white transition-all">Export JSON</button>
             </div>
          </div>
          <div className="flex items-center gap-4">
             <span className="text-[10px] font-black text-slate-600 uppercase">Objects Found:</span>
             <span className="text-lg font-black text-blue-500">12</span>
          </div>
       </div>
    </div>
  );

  const VideoEngine = () => (
    <div className="flex-1 flex flex-col bg-slate-950 rounded-[3rem] border border-slate-800 overflow-hidden shadow-3xl">
       <div className="flex-1 bg-black flex items-center justify-center relative group">
          <Video size={100} className="text-slate-900" />
          <div className="absolute bottom-0 left-0 w-full p-12 bg-gradient-to-t from-black to-transparent space-y-8">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                   <button className="w-16 h-16 bg-white text-black rounded-2xl flex items-center justify-center shadow-2xl hover:scale-105 transition-transform"><Play size={32} className="ml-1" /></button>
                   <div className="flex flex-col">
                      <span className="text-2xl font-mono font-bold text-white">02:14.05</span>
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Master Clock</span>
                   </div>
                </div>
             </div>
          </div>
       </div>
       <div className="h-48 bg-slate-900 border-t border-slate-800 px-12 py-8 space-y-6">
          <div className="flex items-center gap-6 overflow-x-auto custom-scrollbar pb-2">
             {['Visual Events', 'OCR Track', 'Audio Signal', 'Entity Metadata'].map((track, idx) => (
                <div key={track} className="shrink-0 w-80 h-14 bg-slate-950 border border-slate-800 rounded-2xl relative overflow-hidden group">
                   <div className="absolute inset-0 opacity-10 bg-blue-600" style={{ width: `${Math.random() * 100}%` }}></div>
                   <div className="absolute inset-0 flex items-center px-6">
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest group-hover:text-blue-400 transition-colors">{track}</span>
                   </div>
                </div>
             ))}
          </div>
          <div className="h-1.5 w-full bg-slate-950 rounded-full relative overflow-hidden">
             <div className="h-full bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,1)]" style={{ width: '45%' }}></div>
          </div>
       </div>
    </div>
  );

  const AudioEngine = () => (
    <div className="flex-1 flex flex-col bg-slate-950 rounded-[3rem] border border-slate-800 overflow-hidden shadow-3xl p-12 space-y-12">
       <div className="h-64 bg-slate-900 border border-slate-800 rounded-[2.5rem] flex items-center justify-center p-12 relative overflow-hidden group">
          <div className="flex items-center gap-1.5 h-full w-full">
             {Array.from({length: 40}).map((_, i) => (
                <div key={i} className="flex-1 bg-emerald-500/20 rounded-full group-hover:bg-emerald-500 transition-all duration-500" style={{ height: `${Math.random() * 80 + 10}%` }}></div>
             ))}
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-transparent to-slate-900"></div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="bg-slate-900 border border-slate-800 p-10 rounded-[2.5rem] space-y-8">
             <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] flex items-center gap-3">
                <Activity size={18} className="text-emerald-500" /> Acoustic Features
             </h4>
             <div className="space-y-4">
                {['Signal-to-Noise', 'Spectral Density', 'Pitch Deviation'].map((f, i) => (
                   <div key={f} className="flex justify-between items-center p-4 bg-slate-950 border border-slate-800 rounded-xl">
                      <span className="text-[10px] font-black text-slate-500 uppercase">{f}</span>
                      <span className="text-xs font-mono font-bold text-white">{(Math.random() * 20 + 5).toFixed(1)} unit</span>
                   </div>
                ))}
             </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-10 rounded-[2.5rem] space-y-8">
             <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] flex items-center gap-3">
                <Fingerprint size={18} className="text-blue-500" /> Biometric Identity
             </h4>
             <div className="flex items-center gap-6 p-6 bg-slate-950 border border-slate-800 rounded-2xl">
                <div className="w-14 h-14 bg-blue-600/10 text-blue-500 rounded-xl flex items-center justify-center shadow-inner"><User size={24} /></div>
                <div>
                   <p className="text-sm font-black text-white italic">PORTCO_CEO_ID_41</p>
                   <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mt-1">Institutional Consensus Match</p>
                </div>
             </div>
          </div>
       </div>
    </div>
  );

  if (viewMode === 'PROJECTS') {
    return (
      <div className="space-y-12 animate-in fade-in duration-500 max-w-[1600px] mx-auto pb-20">
        <div className="flex justify-between items-end border-b border-slate-800 pb-16">
          <div>
            <h1 className="text-6xl font-black text-white italic font-serif tracking-tighter uppercase leading-none">NestAnnotate</h1>
            <p className="text-slate-400 mt-6 font-medium italic text-xl">Operational Data Refinery — Scale institutional intelligence.</p>
          </div>
          <div className="flex gap-6">
             <button 
               className="px-8 py-4 bg-slate-900 border border-slate-800 text-slate-300 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:text-white transition-all flex items-center gap-3 shadow-xl"
               onClick={() => setIsIngesting(true)}
             >
                <CloudUpload size={18} className="text-blue-500" /> Direct Ingest
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
           <StatCard label="Transcription" count={pipelineStats.transcription} icon={Volume2} color="blue" />
           <StatCard label="Translation" count={pipelineStats.translation} icon={Languages} color="purple" />
           <StatCard label="Image Geometry" count={pipelineStats.image} icon={ImageIcon} color="emerald" />
           <StatCard label="Video Temporal" count={pipelineStats.video} icon={Video} color="rose" />
           <StatCard label="Audio Signals" count={pipelineStats.audio} icon={Headphones} color="amber" />
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-[4rem] overflow-hidden shadow-3xl">
           <div className="p-12 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <FolderOpen size={24} className="text-blue-500" />
                 <h2 className="text-3xl font-black text-white uppercase italic font-serif tracking-tight">Mission Registry</h2>
              </div>
           </div>
           <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1200px]">
                <thead>
                  <tr className="bg-slate-950/40 border-b border-slate-800">
                    <th className="px-12 py-8 text-[11px] font-black text-slate-500 uppercase tracking-[0.4em]">Project ID & Name</th>
                    <th className="px-8 py-8 text-[11px] font-black text-slate-500 uppercase tracking-[0.4em]">Protocol Class</th>
                    <th className="px-8 py-8 text-[11px] font-black text-slate-500 uppercase tracking-[0.4em]">Status</th>
                    <th className="px-8 py-8 text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] text-center">Payload Count</th>
                    <th className="px-12 py-8 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {projects.map((proj) => {
                    const projectTasksCount = tasks.filter(t => t.projectId === proj.id).length;
                    return (
                      <tr key={proj.id} className="hover:bg-slate-800/20 transition-all group cursor-pointer" onClick={() => handleOpenProject(proj)}>
                        <td className="px-12 py-8">
                          <div className="flex flex-col gap-1">
                             <span className="text-[10px] font-mono text-slate-500 uppercase tracking-tighter">{proj.id}</span>
                             <span className="text-xl font-black text-white italic font-serif leading-none group-hover:text-blue-400 transition-colors uppercase tracking-tight">{proj.name}</span>
                          </div>
                        </td>
                        <td className="px-8 py-8">
                           <span className={`text-[10px] font-black px-4 py-1.5 rounded-xl uppercase tracking-widest border ${
                             proj.project_type === ProjectType.AUDIO ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
                             proj.project_type === ProjectType.IMAGE ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                             proj.project_type === ProjectType.VIDEO ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' :
                             proj.project_type === ProjectType.TRANSCRIPTION ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' :
                             'bg-purple-500/10 border-purple-500/20 text-purple-400'
                           }`}>
                             {proj.project_type}
                           </span>
                        </td>
                        <td className="px-8 py-8">
                           <span className={`px-5 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border ${proj.status === 'ACTIVE' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
                             {proj.status}
                           </span>
                        </td>
                        <td className="px-8 py-8 text-center">
                           <div className="flex flex-col items-center">
                              <span className="text-2xl font-black text-white">{projectTasksCount}</span>
                              <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Blocks</span>
                           </div>
                        </td>
                        <td className="px-12 py-8 text-right">
                           <button className="px-8 py-3 bg-slate-950 border border-slate-800 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:text-white hover:border-blue-500 transition-all flex items-center gap-3 ml-auto">
                              Initialize <ArrowUpRight size={14} />
                           </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
           </div>
        </div>

        {/* Restore Direct Ingest Modal */}
        {isIngesting && (
          <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-12 animate-in fade-in" onClick={() => setIsIngesting(false)}>
             <div className="bg-slate-900 border border-slate-800 rounded-[4rem] p-16 max-w-3xl w-full shadow-3xl relative overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="absolute top-0 left-0 w-full h-2 bg-blue-600"></div>
                <button onClick={() => setIsIngesting(false)} className="absolute top-12 right-12 text-slate-500 hover:text-white transition-all"><X size={32} /></button>
                <div className="mb-12">
                   <h2 className="text-5xl font-black text-white italic font-serif uppercase tracking-tight leading-none mb-6">Direct Ingest.</h2>
                   <p className="text-slate-500 text-lg italic leading-relaxed">Map raw source assets directly to mission-scoped projects.</p>
                </div>
                <div className="space-y-10">
                   <div className="p-12 border-2 border-dashed border-slate-800 rounded-[3rem] flex flex-col items-center justify-center gap-6 group hover:border-blue-500/50 transition-all cursor-pointer bg-slate-950/30">
                      <div className="w-20 h-20 bg-blue-600/10 text-blue-500 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform"><Upload size={40} /></div>
                      <div className="text-center">
                         <p className="text-xl font-black text-white italic font-serif">Drop Payload Here</p>
                         <p className="text-[10px] text-slate-600 uppercase tracking-[0.4em] mt-3">PDF, MP3, MP4, JPEG Supported</p>
                      </div>
                   </div>
                   <div className="space-y-4">
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-2">Target Protocol</label>
                      <select className="w-full bg-slate-950 border border-slate-800 rounded-[1.5rem] px-8 py-5 text-sm text-white font-bold appearance-none outline-none focus:ring-4 focus:ring-blue-500/10 italic font-serif">
                         {projects.map(p => <option key={p.id} value={p.id}>{p.name} ({p.id})</option>)}
                      </select>
                   </div>
                   <button 
                     onClick={() => setIsIngesting(false)}
                     className="w-full py-8 bg-blue-600 text-white rounded-[2.5rem] font-black uppercase text-base tracking-[0.2em] shadow-2xl hover:bg-blue-500 transition-all flex items-center justify-center gap-6 active:scale-95"
                   >
                      Authorize Ingest <Check size={28} />
                   </button>
                </div>
             </div>
          </div>
        )}
      </div>
    );
  }

  // --- WORKBENCH VIEW ---

  return (
    <div className="h-[calc(100vh-140px)] flex gap-10 animate-in fade-in duration-500">
      <aside className={`${sidebarOpen ? 'w-80' : 'w-24'} h-full bg-slate-900 border border-slate-800 rounded-[4rem] flex flex-col transition-all shadow-3xl overflow-hidden relative`}>
        <div className="p-10 border-b border-slate-800 flex items-center justify-between">
           {sidebarOpen && <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.5em]">Buffer</h3>}
           <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-3 hover:bg-slate-800 rounded-2xl text-slate-500">
              <ListTodo size={24} />
           </button>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
           <button 
             onClick={() => setViewMode('PROJECTS')}
             className="w-full p-4 mb-6 flex items-center gap-4 text-[10px] font-black uppercase text-blue-500 hover:text-white transition-colors border-b border-slate-800 pb-8"
           >
              <ArrowRight size={18} className="rotate-180" /> {sidebarOpen ? 'Mission Registry' : ''}
           </button>
           {tasks.filter(t => !project || t.projectId === project.id).map(task => (
             <button 
               key={task.id}
               onClick={() => setActiveTaskId(task.id)}
               className={`w-full p-8 rounded-[2.5rem] border transition-all text-left group relative overflow-hidden ${activeTaskId === task.id ? 'bg-blue-600 border-blue-500 shadow-2xl text-white' : 'bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400'}`}
             >
               <div className="flex justify-between items-start mb-6">
                  <span className={`text-[8px] font-black px-2 py-0.5 rounded border ${activeTaskId === task.id ? 'bg-white/20 border-white/30 text-white' : 'bg-slate-800 border border-slate-700 text-slate-500'}`}>
                    {task.projectId?.split('-')[1] || 'UNIT'}
                  </span>
               </div>
               {sidebarOpen && (
                 <>
                   <p className="text-sm font-black italic font-serif leading-none mb-3 truncate">Task: {task.id}</p>
                   <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest opacity-60">
                      <Clock size={12} /> {task.type?.replace('_', ' ') || 'TASK'}
                   </div>
                 </>
               )}
             </button>
           ))}
        </div>
      </aside>

      <div className="flex-1 flex flex-col gap-10 min-w-0">
         <div className="flex items-center justify-between px-6">
            <div className="flex items-center gap-10">
               <div className="w-16 h-16 bg-blue-600 rounded-[1.75rem] flex items-center justify-center text-white shadow-2xl shadow-blue-600/30">
                  {project?.project_type === ProjectType.AUDIO ? <Mic size={28} /> : 
                   project?.project_type === ProjectType.TRANSLATION ? <TranslateIcon size={28} /> : 
                   project?.project_type === ProjectType.IMAGE ? <ImageIcon size={28} /> : 
                   project?.project_type === ProjectType.VIDEO ? <Video size={28} /> : 
                   project?.project_type === ProjectType.TRANSCRIPTION ? <Volume2 size={28} /> : <Type size={28} />}
               </div>
               <div>
                  <h2 className="text-5xl font-black text-white italic font-serif leading-none tracking-tighter uppercase">{project?.name || 'Session Context'}</h2>
                  <p className="text-[11px] font-black text-slate-600 uppercase tracking-[0.5em] mt-3">TARGET_HASH: {activeTaskId || 'AWAITING_PAYLOAD'}</p>
               </div>
            </div>
            
            <div className="flex items-center gap-6 bg-slate-900 border border-slate-800 rounded-[2.5rem] p-2.5 shadow-3xl">
               <button 
                 onClick={handleRunGemini}
                 disabled={aiSyncing || !activeTaskId}
                 className="px-10 py-5 bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 rounded-3xl text-[11px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-4 active:scale-95 disabled:opacity-30"
               >
                  {aiSyncing ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />} Gemini Recon
               </button>
               <button 
                 onClick={handleSubmit}
                 disabled={isSaving || !activeTaskId}
                 className="px-14 py-5 bg-emerald-600 text-white rounded-3xl text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-emerald-600/30 hover:bg-emerald-500 transition-all flex items-center gap-4 active:scale-95 disabled:opacity-30"
               >
                  {isSaving ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={20} />} Registry Commit
               </button>
            </div>
         </div>

         <div className="flex-1 flex gap-10 min-h-0">
            {project?.project_type === ProjectType.AUDIO && <AudioEngine />}
            {project?.project_type === ProjectType.TRANSCRIPTION && <TranscriptionEngine />}
            {project?.project_type === ProjectType.IMAGE && <ImageEngine />}
            {project?.project_type === ProjectType.VIDEO && <VideoEngine />}
            {(!project || (project.project_type !== ProjectType.AUDIO && project.project_type !== ProjectType.IMAGE && project.project_type !== ProjectType.VIDEO && project.project_type !== ProjectType.TRANSCRIPTION)) && (
              <div className="flex-1 flex flex-col bg-slate-950 rounded-[4rem] border border-slate-800 p-20 overflow-y-auto custom-scrollbar relative justify-center items-center text-center">
                  {!activeTaskId ? (
                    <div className="max-w-md space-y-8">
                       <Database size={64} className="mx-auto text-slate-800" />
                       <h2 className="text-3xl font-black text-white italic font-serif uppercase">Payload Pending.</h2>
                       <p className="text-slate-500 italic">Select a task from the buffer.</p>
                    </div>
                  ) : (
                    <div className="bg-slate-900 border border-slate-800 p-16 rounded-[4rem] relative shadow-inner">
                       <div className="absolute top-12 right-12 text-blue-500/5"><MessageSquare size={160} /></div>
                       <p className="text-3xl font-serif italic text-slate-200 leading-relaxed relative z-10 selection:bg-blue-600/40">
                          "{activeTask?.data.content || activeTask?.data.source_text || 'Raw mission data identified. Expert classification required.'}"
                       </p>
                    </div>
                  )}
              </div>
            )}

            <aside className="w-[450px] flex flex-col gap-8 h-full">
               <div className="flex-1 bg-slate-900 border border-slate-800 rounded-[4rem] flex flex-col shadow-3xl overflow-hidden relative">
                  <div className="p-10 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
                     <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.5em] flex items-center gap-3">
                        <Zap size={20} className="text-yellow-400" /> Attribute Matrix
                     </h4>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-10">
                     <div className="p-8 bg-blue-600/5 border border-blue-600/10 rounded-[2.5rem] space-y-4 shadow-inner">
                        <div className="flex items-center gap-3 text-blue-400">
                           <Info size={18} />
                           <span className="text-[10px] font-black uppercase tracking-widest">Mission Intent</span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium italic leading-relaxed">
                          "{project?.project_instructions || 'Awaiting mission initialization.'}"
                        </p>
                     </div>

                     <div className="space-y-10">
                        {localAnnotations.map((ann, idx) => (
                           <div key={ann.field_id || idx} className="space-y-4 group animate-in slide-in-from-right-4 duration-300" style={{ animationDelay: `${idx * 100}ms` }}>
                              <div className="flex justify-between items-baseline px-2">
                                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-white transition-colors">{ann.label}</label>
                                 <span className="text-[9px] font-black italic text-emerald-500">
                                    {Math.round((ann.confidence || 0) * 100)}% Conf.
                                 </span>
                              </div>
                              <div className="relative">
                                 <input 
                                   type="text" 
                                   value={ann.human_value || ann.ai_value || ''}
                                   onChange={(e) => handleUpdateField(ann.field_id, e.target.value)}
                                   className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-8 py-5 text-sm text-white font-bold outline-none focus:ring-4 focus:ring-blue-500/10 shadow-inner group-hover:border-slate-700 transition-all placeholder:text-slate-800"
                                   placeholder="Awaiting extraction..."
                                 />
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            </aside>
         </div>
      </div>
    </div>
  );
};

export default NestAnnotate;
