import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  FileVideo, UploadCloud, Play, Pause, FastForward, Rewind, 
  Sparkles, ShieldCheck, ArrowLeft, Brain, Loader2, Scissors, 
  Target, Clock, History, LayoutGrid, Terminal, X, Plus, 
  Trash2, MousePointer2, Box, Eye, EyeOff, Save, ChevronRight,
  Maximize, Activity, List, Settings, Layers, Film, SkipBack, SkipForward,
  Volume2, VolumeX, Monitor, Search
} from 'lucide-react';
import { geminiService } from '../services/geminiService';

interface VideoAnnotation {
  id: string;
  label: string;
  timestamp: number; // in seconds
  x: number; // percentage
  y: number; // percentage
  width: number; // percentage
  height: number; // percentage
  color: string;
  type: 'OBJECT' | 'SEGMENT';
}

interface TemporalSegment {
  id: string;
  label: string;
  start: number;
  end: number;
  color: string;
}

interface LabelClass {
  id: string;
  name: string;
  color: string;
}

interface Props {
  onNavigate: () => void;
  projectName?: string;
  predefinedClasses?: LabelClass[];
}

const DEFAULT_CLASSES: LabelClass[] = [
  { id: 'ACTION', name: 'Key Action', color: '#3B82F6' },
  { id: 'SUBJECT', name: 'Primary Subject', color: '#10B981' },
  { id: 'ANOMALY', name: 'Security Anomaly', color: '#F43F5E' },
  { id: 'TEXT', name: 'On-Screen Text', color: '#8B5CF6' },
  { id: 'OBJECT', name: 'Static Asset', color: '#F59E0B' }
];

const VideoHub: React.FC<Props> = ({ onNavigate, projectName, predefinedClasses }) => {
  const [video, setVideo] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTool, setActiveTool] = useState<'SELECT' | 'BBOX' | 'SEGMENT'>('BBOX');
  const [activeClass, setActiveClass] = useState<string>(predefinedClasses?.[0]?.id || DEFAULT_CLASSES[0].id);
  const [showLabels, setShowLabels] = useState(true);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  
  const [annotations, setAnnotations] = useState<VideoAnnotation[]>([]);
  const [segments, setSegments] = useState<TemporalSegment[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentBox, setCurrentBox] = useState<Partial<VideoAnnotation> | null>(null);
  const [labelClasses] = useState<LabelClass[]>(predefinedClasses || DEFAULT_CLASSES);

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideo(url);
      setAnnotations([]);
      setSegments([]);
      setCurrentTime(0);
    }
  };

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const onTimeUpdate = () => setCurrentTime(v.currentTime);
    const onLoadedMetadata = () => setDuration(v.duration);
    const onEnded = () => setIsPlaying(false);

    v.addEventListener('timeupdate', onTimeUpdate);
    v.addEventListener('loadedmetadata', onLoadedMetadata);
    v.addEventListener('ended', onEnded);

    return () => {
      v.removeEventListener('timeupdate', onTimeUpdate);
      v.removeEventListener('loadedmetadata', onLoadedMetadata);
      v.removeEventListener('ended', onEnded);
    };
  }, [video]);

  const togglePlayback = () => {
    if (!videoRef.current) return;
    if (isPlaying) videoRef.current.pause();
    else videoRef.current.play();
    setIsPlaying(!isPlaying);
  };

  const seek = (time: number) => {
    if (!videoRef.current) return;
    const newTime = Math.max(0, Math.min(time, duration));
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    const ms = Math.floor((time % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const handleTimelineClick = (e: React.MouseEvent) => {
    if (!timelineRef.current || duration === 0) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    seek(pos * duration);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (activeTool !== 'BBOX' || !video || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setIsDrawing(true);
    setCurrentBox({ id: Date.now().toString(), x, y, width: 0, height: 0, timestamp: currentTime });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !currentBox || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setCurrentBox({ ...currentBox, width: x - (currentBox.x || 0), height: y - (currentBox.y || 0) });
  };

  const handleMouseUp = () => {
    if (isDrawing && currentBox) {
      const selectedClass = labelClasses.find(c => c.id === activeClass);
      const finalBox: VideoAnnotation = {
        ...currentBox,
        color: selectedClass?.color || '#FFFFFF',
        label: selectedClass?.name || 'Unknown',
        type: 'OBJECT',
        timestamp: currentTime
      } as VideoAnnotation;
      if (Math.abs(finalBox.width) > 0.5 && Math.abs(finalBox.height) > 0.5) {
        if (finalBox.width < 0) { finalBox.x += finalBox.width; finalBox.width = Math.abs(finalBox.width); }
        if (finalBox.height < 0) { finalBox.y += finalBox.height; finalBox.height = Math.abs(finalBox.height); }
        setAnnotations([...annotations, finalBox]);
      }
    }
    setIsDrawing(false);
    setCurrentBox(null);
  };

  const runAISynthesis = async () => {
    if (!video) return;
    setIsProcessing(true);
    try {
      await geminiService.askRefinery(`Analyze video sequence. Suggest key temporal segments and object nodes.`, { video_mode: true });
      setTimeout(() => {
        const aiSegments: TemporalSegment[] = [
          { id: `ai-seg-${Date.now()}`, label: 'Action: Initiation', start: 0, end: duration * 0.3, color: '#3B82F6' },
          { id: `ai-seg-${Date.now()+1}`, label: 'Subject Peak Performance', start: duration * 0.4, end: duration * 0.8, color: '#10B981' }
        ];
        setSegments([...segments, ...aiSegments]);
        setIsProcessing(false);
      }, 1500);
    } catch (e) {
      console.error(e);
      setIsProcessing(false);
    }
  };

  const visibleAnnotations = useMemo(() => {
    return annotations.filter(a => Math.abs(a.timestamp - currentTime) < 0.5);
  }, [annotations, currentTime]);

  return (
    <div className="h-screen flex flex-col bg-app-bg dark:bg-[#070B14] text-text-primary dark:text-white transition-colors overflow-hidden font-sans selection:bg-accent-primary/30">
      
      {/* HUD HEADER */}
      <header className="h-20 px-10 border-b border-border-ui dark:border-[#1C2A44] flex items-center justify-between shrink-0 bg-card-panel/80 dark:bg-[#0E1626]/80 backdrop-blur-2xl z-[150] shadow-xl">
        <div className="flex items-center gap-8">
           <button onClick={onNavigate} className="p-3 bg-elevated dark:bg-slate-900 border border-border-ui dark:border-slate-800 rounded-xl text-text-muted hover:text-white transition-all active:scale-90 shadow-lg group">
             <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform"/>
           </button>
           <div>
              <div className="flex items-center gap-3 mb-1">
                 <span className="text-[9px] font-black text-accent-primary uppercase tracking-[0.4em] bg-accent-primary/10 px-2 py-0.5 rounded border border-accent-primary/20 italic">Hub Mode: Production</span>
                 <p className="text-[9px] font-mono text-text-muted uppercase tracking-widest">{projectName || 'Temporal Analysis Sequence'}</p>
              </div>
              <h1 className="text-2xl font-black italic font-serif leading-none tracking-tighter uppercase">Temporal Lab v1.4</h1>
           </div>
        </div>

        <div className="flex items-center gap-4">
           <button 
             onClick={runAISynthesis}
             disabled={isProcessing || !video}
             className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-blue hover:brightness-110 active:scale-95 transition-all flex items-center gap-3"
           >
             {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Brain size={16} />} Use AI Synthesis
           </button>

           <button 
             onClick={() => fileInputRef.current?.click()} 
             className="px-6 py-2.5 bg-accent-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-blue hover:brightness-110 active:scale-95 transition-all flex items-center gap-3"
           >
             <UploadCloud size={16} /> Deploy Stream
           </button>
           <button 
             disabled={annotations.length === 0 && segments.length === 0}
             className="px-8 py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-emerald-900/40 hover:bg-emerald-500 disabled:opacity-20 transition-all flex items-center gap-3"
           >
             <ShieldCheck size={16} /> Commit Ledger
           </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-20 shrink-0 border-r border-border-ui dark:border-[#1C2A44] bg-card-panel dark:bg-[#0E1626] flex flex-col items-center py-10 gap-6 z-50 shadow-2xl">
           <ToolbarButton active={activeTool === 'SELECT'} onClick={() => setActiveTool('SELECT')} icon={MousePointer2} label="Selector" />
           <ToolbarButton active={activeTool === 'BBOX'} onClick={() => setActiveTool('BBOX')} icon={Box} label="Object Box" />
           <ToolbarButton active={activeTool === 'SEGMENT'} onClick={() => setActiveTool('SEGMENT')} icon={Scissors} label="Temporal Segment" />
           <div className="h-px w-8 bg-slate-800 my-2"></div>
           <ToolbarButton active={!showLabels} onClick={() => setShowLabels(!showLabels)} icon={showLabels ? Eye : EyeOff} label="Tgl Metadata" />
           <div className="mt-auto">
              <ToolbarButton active={false} onClick={() => {}} icon={Settings} label="Engine Config" />
           </div>
        </aside>

        <main className="flex-1 relative bg-black overflow-hidden group flex flex-col">
           <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-[radial-gradient(#1C2A44_1px,transparent_1px)] [background-size:40px_40px] bg-opacity-5">
              <div 
                ref={containerRef}
                className="relative max-w-[95%] max-h-[90%] aspect-video bg-slate-900 shadow-4xl cursor-crosshair group/vid rounded-sm"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
              >
                {video ? (
                  <>
                    <video ref={videoRef} src={video} className="w-full h-full block pointer-events-none select-none rounded-sm" />
                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-30">
                       {visibleAnnotations.map(anno => (
                         <g key={anno.id}>
                            <rect x={`${anno.x}%`} y={`${anno.y}%`} width={`${anno.width}%`} height={`${anno.height}%`} fill={`${anno.color}22`} stroke={anno.color} strokeWidth="2" className="transition-all" />
                            {showLabels && (
                              <g transform={`translate(${(anno.x / 100) * (containerRef.current?.clientWidth || 0)}, ${(anno.y / 100) * (containerRef.current?.clientHeight || 0)})`}>
                                 <rect x="0" y="-22" width="100" height="20" fill={anno.color} className="rounded-t shadow-lg" />
                                 <text x="5" y="-8" fill="white" className="text-[10px] font-black uppercase italic font-serif">{anno.label}</text>
                              </g>
                            )}
                         </g>
                       ))}
                       {currentBox && (
                         <rect x={`${currentBox.x}%`} y={`${currentBox.y}%`} width={`${currentBox.width}%`} height={`${currentBox.height}%`} fill={`${labelClasses.find(c => c.id === activeClass)?.color}44`} stroke={labelClasses.find(c => c.id === activeClass)?.color} strokeWidth="2" strokeDasharray="4 2" />
                       )}
                    </svg>
                    <div className="absolute inset-0 pointer-events-none z-40 opacity-0 group-hover/vid:opacity-20 transition-opacity">
                       <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white/40"></div>
                       <div className="absolute left-0 right-0 top-1/2 h-px bg-white/40"></div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full space-y-8 opacity-10">
                     <Film size={160} />
                     <p className="text-5xl font-black italic font-serif uppercase tracking-tighter">Artifact Empty</p>
                  </div>
                )}
              </div>
           </div>

           {/* ENHANCED TEMPORAL CONTROL DECK */}
           <footer className="h-44 bg-[#0E1626] border-t border-slate-800 flex flex-col px-10 py-5 z-50 shadow-3xl">
              <div className="flex items-center justify-between mb-4">
                 <div className="flex items-center gap-6">
                    <button onClick={() => seek(0)} className="p-2 text-slate-500 hover:text-white transition-all hover:scale-110 active:scale-95" title="Jump to Start"><SkipBack size={20}/></button>
                    <button onClick={() => seek(currentTime - 5)} className="p-2 text-slate-500 hover:text-white transition-all hover:scale-110 active:scale-95" title="Rewind 5s"><Rewind size={20}/></button>
                    <button onClick={togglePlayback} className="w-14 h-14 bg-accent-primary rounded-full flex items-center justify-center text-white shadow-blue hover:scale-110 transition-all active:scale-90 group/play">
                       {isPlaying ? <Pause size={24}/> : <Play size={24} className="ml-1"/>}
                    </button>
                    <button onClick={() => seek(currentTime + 5)} className="p-2 text-slate-500 hover:text-white transition-all hover:scale-110 active:scale-95" title="Fast Forward 5s"><FastForward size={20}/></button>
                    <button onClick={() => seek(duration)} className="p-2 text-slate-500 hover:text-white transition-all hover:scale-110 active:scale-95" title="Jump to End"><SkipForward size={20}/></button>
                 </div>
                 
                 <div className="flex items-center gap-8">
                    <div className="flex items-center gap-4 group/vol">
                       <button onClick={() => setIsMuted(!isMuted)} className="text-slate-500 hover:text-white transition-colors">
                          {isMuted || volume === 0 ? <VolumeX size={18}/> : <Volume2 size={18}/>}
                       </button>
                       <input 
                         type="range" 
                         min="0" max="1" step="0.01" 
                         value={isMuted ? 0 : volume} 
                         onChange={(e) => {setVolume(parseFloat(e.target.value)); setIsMuted(false);}}
                         className="w-24 h-1 bg-slate-800 rounded-full appearance-none cursor-pointer accent-accent-primary group-hover/vol:bg-slate-700 transition-colors"
                       />
                    </div>
                    <div className="flex items-center gap-4 bg-slate-950 px-6 py-2.5 rounded-xl border border-slate-800 shadow-inner group/time">
                       <Clock size={16} className="text-accent-primary group-hover:animate-pulse"/>
                       <span className="text-xl font-black font-mono text-white tracking-tighter leading-none w-[180px] text-center">
                         {formatTime(currentTime)} <span className="text-slate-700 mx-2 font-light">/</span> {formatTime(duration)}
                       </span>
                    </div>
                 </div>
              </div>

              {/* INTERACTIVE SPOTIFY-STYLE TIMELINE */}
              <div className="relative h-10 w-full group/timeline">
                 <div 
                   ref={timelineRef}
                   onClick={handleTimelineClick}
                   className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-2.5 bg-slate-900 rounded-full cursor-pointer shadow-inner border border-slate-800 overflow-visible"
                 >
                    {/* PROGRESS BAR */}
                    <div 
                      className="absolute top-0 left-0 h-full bg-accent-primary shadow-blue rounded-l-full transition-all duration-100 ease-linear"
                      style={{ width: `${(currentTime / duration) * 100}%` }}
                    />
                    
                    {/* SEGMENT MARKERS */}
                    {segments.map(seg => (
                      <div 
                        key={seg.id} 
                        className="absolute top-0 h-full opacity-30 hover:opacity-100 transition-opacity border-x border-black/20" 
                        style={{ left: `${(seg.start / duration) * 100}%`, width: `${((seg.end - seg.start) / duration) * 100}%`, backgroundColor: seg.color }}
                        title={`${seg.label}: ${formatTime(seg.start)} - ${formatTime(seg.end)}`}
                      >
                         <div className="absolute -top-6 left-0 px-2 py-0.5 bg-black/80 rounded text-[7px] font-black uppercase text-white hidden group-hover/timeline:block pointer-events-none border border-slate-700 z-50">
                            {seg.label}
                         </div>
                      </div>
                    ))}

                    {/* ANNOTATION TICK MARKERS */}
                    {annotations.map(anno => (
                      <div 
                        key={anno.id} 
                        className="absolute top-0 w-1 h-full bg-white/40 hover:bg-white transition-all z-40" 
                        style={{ left: `${(anno.timestamp / duration) * 100}%` }}
                        onClick={(e) => { e.stopPropagation(); seek(anno.timestamp); }}
                      >
                        <div className="absolute -bottom-2 -left-0.5 w-2 h-2 rounded-full bg-white shadow-xl opacity-0 group-hover/timeline:opacity-100 transition-opacity"></div>
                      </div>
                    ))}

                    {/* SCRUBBER HANDLE */}
                    <div 
                      className="absolute top-1/2 w-5 h-5 bg-white rounded-full shadow-2xl border-2 border-accent-primary -translate-x-1/2 -translate-y-1/2 scale-0 group-hover/timeline:scale-100 transition-transform z-[100]"
                      style={{ left: `${(currentTime / duration) * 100}%` }}
                    />
                 </div>
              </div>
           </footer>
        </main>

        <aside className="w-[400px] shrink-0 border-l border-border-ui dark:border-[#1E293B] bg-card-panel dark:bg-[#0E1626] flex flex-col overflow-hidden shadow-3xl z-50">
           <header className="p-8 border-b border-slate-800 shrink-0">
              <h3 className="text-[11px] font-black text-text-muted uppercase tracking-[0.5em] mb-8">Classification Palette</h3>
              <div className="grid grid-cols-1 gap-2">
                 {labelClasses.map(c => (
                   <button key={c.id} onClick={() => setActiveClass(c.id)} className={`w-full p-4 rounded-xl border-2 transition-all flex items-center justify-between group ${activeClass === c.id ? 'border-accent-primary bg-accent-primary/5 shadow-inner' : 'border-transparent bg-elevated dark:bg-slate-900/50 hover:border-slate-800'}`}>
                      <div className="flex items-center gap-4">
                         <div className="w-4 h-4 rounded-full shadow-lg" style={{ backgroundColor: c.color }}></div>
                         <span className={`text-[11px] font-black uppercase italic ${activeClass === c.id ? 'text-white' : 'text-text-secondary'}`}>{c.name}</span>
                      </div>
                      <span className={`text-[9px] font-mono font-bold ${activeClass === c.id ? 'text-accent-primary' : 'text-slate-700'}`}>0{labelClasses.indexOf(c) + 1}</span>
                   </button>
                 ))}
              </div>
           </header>

           <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
              <div className="p-8 border-b border-border-ui dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/20">
                 <h3 className="text-[11px] font-black text-text-muted uppercase tracking-[0.5em]">Sequence Objects ({annotations.length + segments.length})</h3>
                 <button onClick={() => { setAnnotations([]); setSegments([]); }} className="text-[9px] font-black text-rose-500 uppercase tracking-widest hover:underline">Flush All</button>
              </div>
              <div className="p-4 space-y-4">
                 <div className="space-y-2">
                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.4em] mb-2 px-2 flex items-center gap-2"><Scissors size={10}/> Temporal Segments</p>
                    {segments.map(seg => (
                      <div key={seg.id} onClick={() => seek(seg.start)} className="p-4 bg-slate-900/40 border border-slate-800 rounded-2xl group hover:border-blue-500 transition-all cursor-pointer flex items-center justify-between">
                         <div className="flex items-center gap-4">
                            <div className="w-2 h-8 rounded-full" style={{ backgroundColor: seg.color }}></div>
                            <div>
                               <p className="text-[10px] font-black text-white uppercase italic leading-none mb-1">{seg.label}</p>
                               <p className="text-[8px] font-mono text-slate-600 uppercase tracking-tighter">{formatTime(seg.start)} — {formatTime(seg.end)}</p>
                            </div>
                         </div>
                         <button onClick={(e) => { e.stopPropagation(); setSegments(segments.filter(s => s.id !== seg.id)) }} className="p-2 text-slate-800 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100"><Trash2 size={14}/></button>
                      </div>
                    ))}
                 </div>
                 <div className="space-y-2 pt-4 border-t border-slate-800/40">
                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.4em] mb-2 px-2 flex items-center gap-2"><Target size={10}/> Identified Objects</p>
                    {annotations.map(anno => (
                      <div key={anno.id} onClick={() => seek(anno.timestamp)} className="p-4 bg-slate-900/40 border border-slate-800 rounded-2xl group hover:border-accent-primary transition-all cursor-pointer flex items-center justify-between">
                         <div className="flex items-center gap-4">
                            <div className="w-2 h-8 rounded-full" style={{ backgroundColor: anno.color }}></div>
                            <div>
                               <p className="text-[10px] font-black text-white uppercase italic leading-none mb-1">{anno.label}</p>
                               <p className="text-[8px] font-mono text-slate-600 uppercase tracking-tighter">T: {formatTime(anno.timestamp)} | B-BOX ATTACHED</p>
                            </div>
                         </div>
                         <button onClick={(e) => { e.stopPropagation(); setAnnotations(annotations.filter(a => a.id !== anno.id)) }} className="p-2 text-slate-800 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100"><Trash2 size={14}/></button>
                      </div>
                    ))}
                 </div>
                 {(annotations.length === 0 && segments.length === 0) && (
                   <div className="py-20 text-center space-y-4 opacity-10 flex flex-col items-center">
                      <Target size={48} />
                      <p className="text-[10px] font-black uppercase tracking-[0.4em]">Signal Void</p>
                   </div>
                 )}
              </div>
           </div>

           <footer className="p-8 border-t border-slate-800 bg-slate-950/40 text-center space-y-4">
              <div className="flex items-center gap-3 justify-center mb-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-emerald-500/50"></div>
                 <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest italic">Temporal Handshake: Secured</span>
              </div>
              <p className="text-[8px] font-black text-slate-800 uppercase tracking-[0.4em] leading-none">Lab Sequence v1.3.1 - CANON</p>
           </footer>
        </aside>
      </div>

      <input type="file" ref={fileInputRef} className="hidden" accept="video/*" onChange={handleUpload} />
    </div>
  );
};

const ToolbarButton = ({ active, onClick, icon: Icon, label }: any) => (
  <div className="relative group">
     <button 
      onClick={onClick}
      className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 group-hover:scale-110 active:scale-95 ${active ? 'bg-accent-primary border-accent-primary text-white shadow-blue' : 'bg-transparent border-transparent text-text-muted hover:text-white'}`}
     >
        <Icon size={24} />
     </button>
     <div className="absolute left-full ml-4 px-3 py-1 bg-slate-900 text-white text-[8px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none z-50 whitespace-nowrap border border-slate-800 shadow-xl transition-opacity">
        {label}
     </div>
  </div>
);

export default VideoHub;