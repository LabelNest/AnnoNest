import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  FileAudio, UploadCloud, Play, Pause, Music, Brain, Sparkles, 
  ArrowLeft, Mic, Volume2, Activity, Zap, History, Database,
  SkipBack, SkipForward, Rewind, FastForward, Trash2, UserPlus,
  ShieldCheck, Clock, Target, Plus, X, ChevronRight, AudioWaveform,
  List, Settings, Scissors, Speaker, Loader2, VolumeX
} from 'lucide-react';
import { geminiService } from '../services/geminiService';

interface AudioSegment {
  id: string;
  speakerId: string;
  label: string;
  start: number; // seconds
  end: number; // seconds
  color: string;
}

interface SpeakerClass {
  id: string;
  name: string;
  color: string;
}

interface Props {
  onNavigate: () => void;
  projectName?: string;
  predefinedSpeakers?: SpeakerClass[];
}

const DEFAULT_SPEAKERS: SpeakerClass[] = [
  { id: 'SPK_A', name: 'Speaker A (Interviewer)', color: '#3B82F6' },
  { id: 'SPK_B', name: 'Speaker B (Subject)', color: '#10B981' },
  { id: 'AMBIENT', name: 'Ambient Noise', color: '#64748B' },
  { id: 'OVERLAP', name: 'Overlapping Speech', color: '#F59E0B' }
];

const AudioHub: React.FC<Props> = ({ onNavigate, projectName, predefinedSpeakers }) => {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeSpeaker, setActiveSpeaker] = useState<string>(predefinedSpeakers?.[0]?.id || DEFAULT_SPEAKERS[0].id);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  
  const [segments, setSegments] = useState<AudioSegment[]>([]);
  const [speakers, setSpeakers] = useState<SpeakerClass[]>(predefinedSpeakers || DEFAULT_SPEAKERS);
  const [isBrushing, setIsBrushing] = useState(false);
  const [brushStart, setBrushStart] = useState<number | null>(null);
  const [brushEnd, setBrushEnd] = useState<number | null>(null);

  const audioRef = useRef<HTMLAudioElement>(null);
  const waveformRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      setSegments([]);
      setCurrentTime(0);
    }
  };

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTimeUpdate = () => setCurrentTime(a.currentTime);
    const onLoadedMetadata = () => setDuration(a.duration);
    const onEnded = () => setIsPlaying(false);
    a.addEventListener('timeupdate', onTimeUpdate);
    a.addEventListener('loadedmetadata', onLoadedMetadata);
    a.addEventListener('ended', onEnded);
    return () => {
      a.removeEventListener('timeupdate', onTimeUpdate);
      a.removeEventListener('loadedmetadata', onLoadedMetadata);
      a.removeEventListener('ended', onEnded);
    };
  }, [audioUrl]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const togglePlayback = () => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play();
    setIsPlaying(!isPlaying);
  };

  const seek = (time: number) => {
    if (!audioRef.current) return;
    const newTime = Math.max(0, Math.min(time, duration));
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    const ms = Math.floor((time % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!audioUrl || !waveformRef.current) return;
    const rect = waveformRef.current.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const time = pos * duration;
    
    // Shift key enables jumping like Spotify
    if (!e.shiftKey) {
        setIsBrushing(true);
        setBrushStart(time);
        setBrushEnd(time);
    } else {
        seek(time);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isBrushing || !waveformRef.current) return;
    const rect = waveformRef.current.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    setBrushEnd(pos * duration);
  };

  const handleMouseUp = () => {
    if (isBrushing && brushStart !== null && brushEnd !== null) {
      const start = Math.min(brushStart, brushEnd);
      const end = Math.max(brushStart, brushEnd);
      if (end - start > 0.1) {
        const selectedSpeaker = speakers.find(s => s.id === activeSpeaker);
        const newSeg: AudioSegment = {
          id: Date.now().toString(),
          speakerId: activeSpeaker,
          label: selectedSpeaker?.name || 'Unknown',
          start, end, color: selectedSpeaker?.color || '#FFFFFF'
        };
        setSegments([...segments, newSeg].sort((a, b) => a.start - b.start));
      } else {
          // If no significant movement, just seek to point
          seek(brushStart);
      }
    }
    setIsBrushing(false);
    setBrushStart(null);
    setBrushEnd(null);
  };

  const runAISynthesis = async () => {
    if (!audioUrl) return;
    setIsProcessing(true);
    try {
      await geminiService.askRefinery(`Perform audio diarization. Identify speaker transitions.`, { audio_hint: true });
      setTimeout(() => {
        const aiSegs: AudioSegment[] = [
          { id: `ai-${Date.now()}`, speakerId: 'SPK_A', label: 'Speaker A (Interviewer)', start: 0, end: duration * 0.2, color: '#3B82F6' },
          { id: `ai-${Date.now()+1}`, speakerId: 'SPK_B', label: 'Speaker B (Subject)', start: duration * 0.25, end: duration * 0.6, color: '#10B981' }
        ];
        setSegments([...segments, ...aiSegs]);
        setIsProcessing(false);
      }, 1500);
    } catch (e) {
      console.error(e);
      setIsProcessing(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-app-bg dark:bg-[#070B14] text-text-primary dark:text-white transition-colors overflow-hidden font-sans selection:bg-accent-primary/30">
      
      {/* HUD HEADER */}
      <header className="h-20 px-10 border-b border-border-ui dark:border-[#1E293B] flex items-center justify-between shrink-0 bg-card-panel/80 dark:bg-[#0E1626]/80 backdrop-blur-2xl z-[150] shadow-xl">
        <div className="flex items-center gap-8">
           <button onClick={onNavigate} className="p-3 bg-elevated dark:bg-slate-900 border border-border-ui dark:border-slate-800 rounded-xl text-text-muted hover:text-white transition-all active:scale-90 shadow-lg group">
             <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform"/>
           </button>
           <div>
              <div className="flex items-center gap-3 mb-1">
                 <span className="text-[9px] font-black text-accent-primary uppercase tracking-[0.4em] bg-accent-primary/10 px-2 py-0.5 rounded border border-accent-primary/20 italic">Hub Mode: Diarization</span>
                 <p className="text-[9px] font-mono text-text-muted uppercase tracking-widest">{projectName || 'Acoustic Signal Sequence'}</p>
              </div>
              <h1 className="text-2xl font-black italic font-serif leading-none tracking-tighter uppercase">Sonic Lab v1.4</h1>
           </div>
        </div>

        <div className="flex items-center gap-4">
           <button 
             onClick={runAISynthesis}
             disabled={isProcessing || !audioUrl}
             className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-blue hover:brightness-110 active:scale-95 transition-all flex items-center gap-3"
           >
             {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Brain size={16} />} Use AI Synthesis
           </button>

           <button 
             onClick={() => fileInputRef.current?.click()} 
             className="px-6 py-2.5 bg-accent-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-blue hover:brightness-110 active:scale-95 transition-all flex items-center gap-3"
           >
             <UploadCloud size={16} /> Deploy Artifact
           </button>
           <button 
             disabled={segments.length === 0}
             className="px-8 py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-emerald-900/40 hover:bg-emerald-500 disabled:opacity-20 transition-all flex items-center gap-3"
           >
             <ShieldCheck size={16} /> Commit Ledger
           </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-20 shrink-0 border-r border-border-ui dark:border-[#1C2A44] bg-card-panel dark:bg-[#0E1626] flex flex-col items-center py-10 gap-6 z-50">
           <ToolbarButton active={true} onClick={() => {}} icon={Mic} label="Diarizer" />
           <ToolbarButton active={false} onClick={() => {}} icon={Scissors} label="Trim Node" />
           <ToolbarButton active={false} onClick={() => {}} icon={AudioWaveform} label="Spectral" />
           <div className="h-px w-8 bg-slate-800 my-2"></div>
           <div className="mt-auto">
              <ToolbarButton active={false} onClick={() => {}} icon={Settings} label="Engine Config" />
           </div>
        </aside>

        <main className="flex-1 relative bg-black overflow-hidden group flex flex-col">
           <div className="flex-1 relative flex flex-col items-center justify-center p-20 bg-[radial-gradient(#1C2A44_1px,transparent_1px)] [background-size:40px_40px] bg-opacity-5">
              {audioUrl ? (
                <div className="w-full max-w-6xl space-y-16 animate-in fade-in duration-700">
                   <div className="flex items-center justify-between px-4">
                      <div className="flex items-center gap-6">
                         <div className="p-5 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-blue-500 animate-pulse shadow-inner">
                            <Volume2 size={32} />
                         </div>
                         <div>
                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">Active Signal Node</p>
                            <p className="text-3xl font-black text-white italic font-serif uppercase tracking-tight">Spectrum_Alpha_Node.wav</p>
                         </div>
                      </div>

                      <div className="flex items-center gap-10">
                          <div className="flex items-center gap-4 group/vol">
                             <button onClick={() => setIsMuted(!isMuted)} className="text-slate-500 hover:text-white transition-colors">
                                {isMuted || volume === 0 ? <VolumeX size={20}/> : <Volume2 size={20}/>}
                             </button>
                             <input type="range" min="0" max="1" step="0.01" value={isMuted ? 0 : volume} onChange={(e) => {setVolume(parseFloat(e.target.value)); setIsMuted(false);}} className="w-24 h-1 bg-slate-800 rounded-full appearance-none cursor-pointer accent-accent-primary" />
                          </div>
                          <div className="flex items-center gap-4 bg-slate-950 px-8 py-3 rounded-xl border border-slate-800 shadow-3xl">
                            <Clock size={16} className="text-accent-primary"/>
                            <span className="text-2xl font-black font-mono text-white tracking-tighter leading-none w-[200px] text-center">{formatTime(currentTime)} <span className="text-slate-700 mx-2 font-light">/</span> {formatTime(duration)}</span>
                          </div>
                      </div>
                   </div>

                   {/* INTERACTIVE WAVEFORM TIMELINE */}
                   <div className="relative h-64 w-full bg-slate-950/50 rounded-[4rem] border border-slate-800 shadow-4xl overflow-hidden group/wave transition-all hover:border-slate-700">
                      <div className="absolute inset-0 flex items-center justify-center opacity-[0.05] pointer-events-none">
                         <div className="text-[14rem] font-black italic font-serif uppercase tracking-tighter text-white">SONIC</div>
                      </div>
                      <div 
                        ref={waveformRef}
                        className="absolute inset-0 cursor-crosshair flex items-center justify-center px-10 z-10"
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                      >
                         <div className="w-full h-40 flex items-center gap-1 opacity-20">
                            {[...Array(180)].map((_, i) => {
                              const h = 20 + Math.sin(i * 0.15) * 40 + Math.random() * 40;
                              return (
                                <div key={i} className="flex-1 bg-accent-primary/60 rounded-full" style={{ height: `${h}%` }}></div>
                              );
                            })}
                         </div>

                         {/* PERSISTED SEGMENTS */}
                         {segments.map(seg => (
                           <div key={seg.id} className="absolute top-0 bottom-0 border-x transition-all group/seg z-20" style={{ left: `${(seg.start / duration) * 100}%`, width: `${((seg.end - seg.start) / duration) * 100}%`, backgroundColor: `${seg.color}22`, borderColor: seg.color }}>
                              <div className="absolute top-6 left-3 px-3 py-1 bg-black/80 rounded-lg text-[8px] font-black uppercase text-white shadow-xl border border-white/10 hidden group-hover/wave:block pointer-events-none">
                                 {seg.label}
                              </div>
                              <button onClick={(e) => { e.stopPropagation(); setSegments(segments.filter(s => s.id !== seg.id)); }} className="absolute top-4 right-4 p-2 bg-black/60 text-white rounded-xl hover:bg-rose-600 opacity-0 group-hover/seg:opacity-100 transition-all scale-75 group-hover/seg:scale-100"><X size={14}/></button>
                           </div>
                         ))}

                         {/* ACTIVE BRUSH */}
                         {brushStart !== null && brushEnd !== null && (
                           <div className="absolute top-0 bottom-0 bg-accent-primary/40 border-x-2 border-accent-primary z-30 shadow-blue" style={{ left: `${(Math.min(brushStart, brushEnd) / duration) * 100}%`, width: `${(Math.abs(brushEnd - brushStart) / duration) * 100}%` }} />
                         )}

                         {/* PLAYHEAD / SCRUBBER */}
                         <div 
                           className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_20px_rgba(255,255,255,0.9)] z-40 pointer-events-none transition-all duration-100 ease-linear" 
                           style={{ left: `${(currentTime / duration) * 100}%` }}
                         >
                            <div className="absolute top-0 -left-2 w-4 h-4 bg-white rounded-full border-4 border-accent-primary shadow-blue"></div>
                            <div className="absolute bottom-0 -left-2 w-4 h-4 bg-white rounded-full border-4 border-accent-primary shadow-blue"></div>
                         </div>
                      </div>
                   </div>

                   {/* PLAYBACK CONTROL HUB */}
                   <div className="flex items-center justify-center gap-12">
                      <button onClick={() => seek(0)} className="p-3 text-slate-500 hover:text-white transition-all hover:scale-110 active:scale-95" title="Jump to Start"><SkipBack size={32}/></button>
                      <button onClick={() => seek(currentTime - 5)} className="p-3 text-slate-500 hover:text-white transition-all hover:scale-110 active:scale-95" title="Rewind 5s"><Rewind size={32}/></button>
                      
                      <button onClick={togglePlayback} className="w-28 h-28 bg-accent-primary rounded-[3rem] flex items-center justify-center text-white shadow-blue hover:scale-105 active:scale-90 transition-all group/play relative overflow-hidden">
                         <div className="absolute inset-0 bg-white/20 scale-0 group-hover/play:scale-100 rounded-full transition-transform duration-500"></div>
                         {isPlaying ? <Pause size={48} className="relative z-10"/> : <Play size={48} className="ml-2 relative z-10"/>}
                      </button>

                      <button onClick={() => seek(currentTime + 5)} className="p-3 text-slate-500 hover:text-white transition-all hover:scale-110 active:scale-95" title="Fast Forward 5s"><FastForward size={32}/></button>
                      <button onClick={() => seek(duration)} className="p-3 text-slate-500 hover:text-white transition-all hover:scale-110 active:scale-95" title="Jump to End"><SkipForward size={32}/></button>
                   </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center space-y-8 opacity-10">
                   <Mic size={160} />
                   <p className="text-5xl font-black italic font-serif uppercase tracking-tighter">Sonic Void</p>
                </div>
              )}
           </div>
        </main>

        <aside className="w-[400px] shrink-0 border-l border-border-ui dark:border-[#1E293B] bg-card-panel dark:bg-[#0E1626] flex flex-col overflow-hidden shadow-3xl z-50">
           <header className="p-8 border-b border-slate-800 shrink-0">
              <h3 className="text-[11px] font-black text-text-muted uppercase tracking-[0.5em] mb-8">Personnel Matrix</h3>
              <div className="grid grid-cols-1 gap-2">
                 {speakers.map(s => (
                   <button key={s.id} onClick={() => setActiveSpeaker(s.id)} className={`w-full p-4 rounded-xl border-2 transition-all flex items-center justify-between group ${activeSpeaker === s.id ? 'border-accent-primary bg-accent-primary/5 shadow-inner' : 'border-transparent bg-elevated dark:bg-slate-900/50 hover:border-slate-800'}`}>
                      <div className="flex items-center gap-4">
                         <div className="w-4 h-4 rounded-full shadow-lg" style={{ backgroundColor: s.color }}></div>
                         <span className={`text-[11px] font-black uppercase italic ${activeSpeaker === s.id ? 'text-white' : 'text-text-secondary'}`}>{s.name}</span>
                      </div>
                      <span className={`text-[9px] font-mono font-bold ${activeSpeaker === s.id ? 'text-accent-primary' : 'text-slate-700'}`}>0{speakers.indexOf(s) + 1}</span>
                   </button>
                 ))}
                 <button className="w-full py-4 border border-dashed border-slate-800 rounded-xl text-[9px] font-black uppercase text-slate-700 hover:text-white transition-all mt-4 flex items-center justify-center gap-2"><UserPlus size={14}/> Define Speaker Node</button>
              </div>
           </header>

           <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
              <div className="p-8 border-b border-border-ui dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/20">
                 <h3 className="text-[11px] font-black text-text-muted uppercase tracking-[0.5em]">Acoustic Ledger ({segments.length})</h3>
                 <button onClick={() => setSegments([])} className="text-[9px] font-black text-rose-500 uppercase tracking-widest hover:underline transition-colors">Purge All</button>
              </div>
              <div className="p-4 space-y-2">
                 {segments.map(seg => (
                   <div key={seg.id} onClick={() => seek(seg.start)} className="p-4 bg-slate-900/40 border border-slate-800 rounded-2xl group hover:border-accent-primary transition-all cursor-pointer flex items-center justify-between">
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
                 {segments.length === 0 && (
                   <div className="py-20 text-center space-y-4 opacity-10 flex flex-col items-center">
                      <AudioWaveform size={48} />
                      <p className="text-[10px] font-black uppercase tracking-[0.4em]">Zero Signals Mapped</p>
                   </div>
                 )}
              </div>
           </div>

           <footer className="p-8 border-t border-border-ui dark:border-slate-800 bg-slate-950/40 text-center space-y-4">
              <div className="flex items-center gap-3 justify-center mb-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-blue"></div>
                 <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest italic">Acoustic Handshake: Persistent</span>
              </div>
              <p className="text-[8px] font-black text-slate-800 uppercase tracking-[0.4em] leading-none">Sonic Refinery v1.3.2 - CANON</p>
           </footer>
        </aside>
      </div>

      <input type="file" ref={fileInputRef} className="hidden" accept="audio/*" onChange={handleUpload} />
      <audio ref={audioRef} className="hidden" src={audioUrl || ''} />
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

export default AudioHub;