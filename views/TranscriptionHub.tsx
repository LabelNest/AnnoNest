
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Mic, UploadCloud, Loader2, Sparkles, ArrowLeft, 
  Play, Pause, Music, FileVideo, ShieldCheck, 
  Trash2, Brain, Fingerprint, History, Database, Target,
  Download, FileText, FileCode, Type, Settings, 
  Volume2, FastForward, Rewind, Edit3, User, 
  ChevronDown, Check, X, FileOutput, Scissors, Search,
  Clock, SkipBack, SkipForward, VolumeX, AlertCircle,
  MessageSquare, Gavel, Terminal, Plus, Languages, Globe
} from 'lucide-react';
import { geminiService } from '../services/geminiService';
import { supabaseService } from '../services/supabaseService';
import { TenantSession } from '../types';

interface TranscriptTurn {
  id: string;
  speaker: string;
  text: string;
  startTime: number;
  endTime: number;
}

interface Props {
  userProfile: TenantSession;
  onNavigate: () => void;
}

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB Threshold

const SCRIPT_OPTIONS = [
  { id: 'Latin', label: 'English (Latin)', desc: 'Standard Western script' },
  { id: 'Devanagari', label: 'Devanagari', desc: 'Hindi, Marathi, Sanskrit' },
  { id: 'Arabic', label: 'Arabic', desc: 'Modern Standard & Dialects' },
  { id: 'Cyrillic', label: 'Cyrillic', desc: 'Russian, Ukrainian, Bulgarian' },
  { id: 'Hanzi', label: 'Chinese (Hanzi)', desc: 'Simplified Mandarin' },
  { id: 'Hangul', label: 'Korean (Hangul)', desc: 'Standard Korean script' },
  { id: 'Braille', label: 'Braille Pattern', desc: 'Linguistic tactile nodes' }
];

const TranscriptionHub: React.FC<Props> = ({ userProfile, onNavigate }) => {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'IDLE' | 'PROCESSING' | 'COMPLETED' | 'LIVE'>('IDLE');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // LOGIC INPUTS
  const [targetScript, setTargetScript] = useState('Latin');
  const [contextPrompt, setContextPrompt] = useState('');
  const [specialClauses, setSpecialClauses] = useState('{E} = English words, [INAUDIBLE] = noise');
  const [manualSpeakers, setManualSpeakers] = useState<string[]>(['Speaker A', 'Speaker B']);
  const [newSpeaker, setNewSpeaker] = useState('');

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [turns, setTurns] = useState<TranscriptTurn[]>([]);
  const [volume, setVolume] = useState(1);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.currentTarget.files?.[0];
    if (!selected) return;
    if (selected.size > MAX_FILE_SIZE) return alert("Artifact exceeds 500MB limit.");
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
    setTurns([]);
    setStatus('IDLE');
  };

  const initiateSynthesis = async () => {
    if (!file) return;
    setStatus('PROCESSING');
    
    // PERSISTENCE: Create background task immediately
    const taskRes = await supabaseService.createTask({
        tenant_id: userProfile.tenant_id,
        project_id: 'LINGUISTIC_REFINERY_INTERNAL',
        task_type: 'ENTITY_EXTRACTION',
        task_category: 'transcription',
        metadata: { 
            filename: file.name, 
            context: contextPrompt,
            target_script: targetScript,
            status: 'background_synthesis'
        },
        status: 'in_progress',
        assigned_to: userProfile.user_id,
        created_by: userProfile.user_id
    });

    const reader = new FileReader();
    reader.onload = async () => {
      const result = reader.result;
      if (typeof result !== 'string') return setStatus('IDLE');
      
      try {
        const rawTranscript = await geminiService.transcribeMedia(
            result, 
            file.type || 'audio/mpeg',
            contextPrompt,
            specialClauses,
            targetScript
        );
        
        const lines = rawTranscript.split('\n').filter(l => l.trim());
        const mappedTurns: TranscriptTurn[] = lines.map((line, i) => {
           const split = line.split(':');
           const speaker = split.length > 1 ? split[0].trim() : (manualSpeakers[0] || 'Speaker A');
           const text = split.length > 1 ? split.slice(1).join(':').trim() : line.trim();
           return { id: `turn-${i}`, speaker, text, startTime: i * 5, endTime: (i + 1) * 5 };
        });

        setTurns(mappedTurns);
        setStatus('COMPLETED');
        
        // Final Persistence Update
        if (taskRes.data) {
            await supabaseService.updateTableRecord('tasks', taskRes.data.id, { 
                status: 'submitted', 
                metadata: { ...taskRes.data.metadata, turns: mappedTurns, completed_at: new Date().toISOString() } 
            });
        }
      } catch (err) {
        setStatus('IDLE');
        alert("Linguistic Bridge Timeout. Handshake Failed.");
      }
    };
    reader.readAsDataURL(file);
  };

  const renameSpeaker = (oldName: string, newName: string) => {
    setTurns(prev => prev.map(t => t.speaker === oldName ? { ...t, speaker: newName } : t));
    setManualSpeakers(prev => prev.map(s => s === oldName ? newName : s));
  };

  const addSpeaker = () => {
    if (newSpeaker && !manualSpeakers.includes(newSpeaker)) {
        setManualSpeakers([...manualSpeakers, newSpeaker]);
        setNewSpeaker('');
    }
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const m = mediaRef.current;
    if (!m) return;
    const onTimeUpdate = () => setCurrentTime(m.currentTime);
    const onLoaded = () => setDuration(m.duration);
    m.addEventListener('timeupdate', onTimeUpdate);
    m.addEventListener('loadedmetadata', onLoaded);
    return () => { m.removeEventListener('timeupdate', onTimeUpdate); m.removeEventListener('loadedmetadata', onLoaded); };
  }, [previewUrl]);

  return (
    <div className="h-screen flex flex-col bg-[#05070A] text-white overflow-hidden font-sans">
      
      <header className="h-20 px-10 border-b border-slate-800 flex items-center justify-between shrink-0 bg-[#0C121D]/80 backdrop-blur-2xl z-[100] shadow-xl">
        <div className="flex items-center gap-8">
           <button onClick={onNavigate} className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-500 hover:text-white transition-all active:scale-90 shadow-lg">
             <ArrowLeft size={20}/>
           </button>
           <div>
              <div className="flex items-center gap-3 mb-1">
                 <span className="text-[9px] font-black text-accent-primary uppercase tracking-[0.4em] bg-accent-primary/10 px-2 py-0.5 rounded border border-accent-primary/20 italic">Hub Mode: Production Ingest</span>
                 <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Active Script: {targetScript}</p>
              </div>
              <h1 className="text-2xl font-black italic font-serif leading-none tracking-tighter uppercase">Sonic Refinery</h1>
           </div>
        </div>

        <div className="flex items-center gap-4">
           <div className="flex bg-slate-900 rounded-xl p-1 border border-slate-800 mr-4">
              <button onClick={() => setStatus('IDLE')} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${status !== 'LIVE' ? 'bg-accent-primary text-white' : 'text-slate-500'}`}>Artifact Ingest</button>
              <button onClick={() => setStatus('LIVE')} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${status === 'LIVE' ? 'bg-rose-600 text-white animate-pulse' : 'text-slate-500'}`}>Live Handshake</button>
           </div>

           <button 
             onClick={initiateSynthesis}
             disabled={!file || status === 'PROCESSING'}
             className="px-8 py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg hover:bg-emerald-500 transition-all flex items-center gap-3 disabled:opacity-30"
           >
             {status === 'PROCESSING' ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />} 
             {status === 'PROCESSING' ? 'Synthesizing...' : 'Initialize Refinery'}
           </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT: MEDIA & LOGIC PANEL */}
        <aside className="w-[450px] shrink-0 border-r border-slate-800 bg-[#0C121D] flex flex-col p-8 gap-8 overflow-y-auto custom-scrollbar z-50 shadow-2xl">
           <section className="space-y-6">
              <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.5em] flex items-center gap-3"><Database size={16} className="text-accent-primary"/> Artifact Core</h3>
              <div className="aspect-video bg-black rounded-[2.5rem] border border-slate-800 shadow-inner flex items-center justify-center relative overflow-hidden group">
                 {status === 'LIVE' ? (
                    <div className="text-center space-y-4 animate-pulse">
                       <Mic size={80} className="text-rose-500 mx-auto" />
                       <p className="text-[10px] font-black uppercase tracking-[0.4em] text-rose-500">Listening to Live Stream...</p>
                    </div>
                 ) : previewUrl ? (
                   <>
                     {file?.type.startsWith('video') ? (
                       <video ref={mediaRef as any} src={previewUrl} className="w-full h-full object-contain" />
                     ) : (
                       <Music size={80} className="text-accent-primary/20 animate-pulse" />
                     )}
                     <audio ref={file?.type.startsWith('video') ? undefined : (mediaRef as any)} src={previewUrl} />
                     <button onClick={() => { if(isPlaying){ mediaRef.current?.pause(); setIsPlaying(false); } else { mediaRef.current?.play(); setIsPlaying(true); } }} className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                        {isPlaying ? <Pause size={48} /> : <Play size={48} className="ml-2"/>}
                     </button>
                   </>
                 ) : (
                   <button onClick={() => fileInputRef.current?.click()} className="text-center opacity-10 hover:opacity-100 transition-opacity flex flex-col items-center gap-6">
                      <UploadCloud size={80} />
                      <p className="text-xl font-black italic uppercase tracking-tighter">Deploy Source</p>
                   </button>
                 )}
              </div>
              <div className="flex items-center justify-between px-2">
                 <span className="text-[10px] font-mono text-slate-600 uppercase">{formatTime(currentTime)} / {formatTime(duration)}</span>
                 <div className="flex items-center gap-3">
                    <Volume2 size={14} className="text-slate-600"/>
                    <input type="range" className="w-20 accent-accent-primary" value={volume} step="0.1" min="0" max="1" onChange={e => setVolume(parseFloat(e.target.value))} />
                 </div>
              </div>
           </section>

           <section className="space-y-6">
              <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.5em] flex items-center gap-3"><Type size={16} className="text-indigo-400"/> Script Selection (Lipi)</h3>
              <div className="grid grid-cols-1 gap-2">
                 {SCRIPT_OPTIONS.map(opt => (
                    <button key={opt.id} onClick={() => setTargetScript(opt.id)} className={`w-full p-4 rounded-2xl border-2 text-left transition-all group ${targetScript === opt.id ? 'bg-accent-primary border-accent-primary text-white shadow-lg' : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'}`}>
                       <p className="text-[11px] font-black uppercase italic tracking-tight">{opt.label}</p>
                       <p className="text-[8px] text-slate-600 group-hover:text-slate-400 italic mt-1">{opt.desc}</p>
                    </button>
                 ))}
              </div>
           </section>

           <section className="space-y-6">
              <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.5em] flex items-center gap-3"><Gavel size={16} className="text-emerald-400"/> Operational Context</h3>
              <div className="space-y-4">
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-4">Context Prompt (Linguistic Guidance)</label>
                    <textarea 
                       className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs text-white italic outline-none focus:ring-4 focus:ring-accent-primary/10 transition-all shadow-inner"
                       placeholder="e.g. This is a Hindi technical debate about blockchain. Auto-detect language."
                       rows={3}
                       value={contextPrompt}
                       onChange={e => setContextPrompt(e.target.value)}
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-4">Formatting Clauses</label>
                    <input 
                       className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-[10px] text-emerald-500 font-mono italic outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-inner"
                       placeholder="{E} = English, [INAUDIBLE] = noisy"
                       value={specialClauses}
                       onChange={e => setSpecialClauses(e.target.value)}
                    />
                 </div>
              </div>
           </section>
        </aside>

        {/* CENTER: TRANSCRIPT VIEWPORT */}
        <main className="flex-1 bg-[#020617] overflow-hidden flex flex-col p-12">
           <div className="flex-1 flex flex-col gap-10 max-w-4xl mx-auto w-full">
              <header className="flex justify-between items-center shrink-0">
                 <h2 className="text-[12px] font-black text-slate-500 uppercase tracking-[0.6em] flex items-center gap-4"><Sparkles size={20} className="text-accent-primary animate-pulse"/> Synthesis Transcript</h2>
                 <div className="flex items-center gap-6">
                    <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest italic">Buffer: Nominal</span>
                    <button className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-500 hover:text-white transition-all shadow-lg"><Search size={18}/></button>
                 </div>
              </header>

              <div className="flex-1 overflow-y-auto custom-scrollbar pr-6 space-y-12 pb-40">
                 {status === 'PROCESSING' && (
                    <div className="h-full flex flex-col items-center justify-center gap-10 animate-pulse opacity-40">
                       <Brain size={120} className="text-accent-primary" />
                       <p className="text-xl font-black uppercase tracking-[0.8em] italic">Synthesizing Linguistic Packet...</p>
                    </div>
                 )}

                 {status === 'LIVE' && (
                    <div className="space-y-8 animate-in fade-in">
                       <div className="p-12 bg-rose-600/5 border border-rose-500/20 rounded-[4rem] text-center italic">
                          <Mic size={48} className="text-rose-500 mx-auto mb-6" />
                          <p className="text-sm text-slate-400">Stream established. Detected packets will appear below.</p>
                       </div>
                    </div>
                 )}

                 {turns.map((turn, i) => (
                    <div key={turn.id} className="group flex gap-8 animate-in slide-in-from-bottom-4" style={{ animationDelay: `${i * 100}ms` }}>
                       <div className="w-32 shrink-0 text-right space-y-1 pt-2">
                          <span className="text-[9px] font-black text-accent-primary uppercase tracking-widest block truncate">{turn.speaker}</span>
                          <p className="text-[8px] font-mono text-slate-700">{formatTime(turn.startTime)}</p>
                       </div>
                       <div className="flex-1 p-8 bg-slate-900/40 border border-slate-800 rounded-[2.5rem] hover:border-accent-primary/20 transition-all shadow-xl group/turn relative">
                          <textarea 
                             className="w-full bg-transparent border-0 p-0 text-lg text-slate-300 italic font-serif leading-relaxed outline-none resize-none"
                             value={turn.text}
                             rows={Math.max(1, Math.ceil(turn.text.length / 50))}
                             onChange={e => setTurns(turns.map(t => t.id === turn.id ? { ...t, text: e.target.value } : t))}
                          />
                          <div className="absolute top-4 right-4 opacity-0 group-hover/turn:opacity-100 transition-opacity">
                             <Scissors size={14} className="text-slate-700 hover:text-white cursor-pointer" />
                          </div>
                       </div>
                    </div>
                 ))}

                 {status === 'IDLE' && !file && (
                    <div className="h-full flex flex-col items-center justify-center opacity-10">
                       <Terminal size={140} />
                       <p className="text-5xl font-black italic uppercase tracking-tighter text-center leading-none mt-10">Refinery <br/> Void</p>
                    </div>
                 )}
              </div>
           </div>
        </main>

        {/* RIGHT: PERSONNEL MATRIX */}
        <aside className="w-[380px] shrink-0 border-l border-slate-800 bg-[#0C121D] flex flex-col overflow-hidden z-50">
           <header className="p-8 border-b border-slate-800 shrink-0">
              <h3 className="text-[11px] font-black text-text-muted uppercase tracking-[0.5em] mb-8">Personnel Identifiers</h3>
              <div className="space-y-3">
                 {manualSpeakers.map((s, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 bg-slate-900 border border-slate-800 rounded-2xl group hover:border-accent-primary transition-all">
                       <div className="w-8 h-8 rounded-lg bg-slate-950 flex items-center justify-center text-accent-primary font-black italic shadow-inner">{s[0]}</div>
                       <input 
                         className="flex-1 bg-transparent border-0 p-0 text-[11px] font-black text-white italic outline-none focus:text-accent-primary"
                         value={s}
                         onChange={e => renameSpeaker(s, e.target.value)}
                       />
                       <Edit3 size={12} className="text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                 ))}
                 <div className="flex gap-2 pt-4">
                    <input 
                       className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-[10px] text-white outline-none focus:ring-2 focus:ring-accent-primary/20"
                       placeholder="Add signature..."
                       value={newSpeaker}
                       onChange={e => setNewSpeaker(e.target.value)}
                       onKeyDown={e => e.key === 'Enter' && addSpeaker()}
                    />
                    <button onClick={addSpeaker} className="p-3 bg-accent-primary text-white rounded-xl shadow-lg active:scale-90 transition-all"><Plus size={16}/></button>
                 </div>
              </div>
           </header>

           <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
              <h4 className="text-[10px] font-black text-slate-700 uppercase tracking-widest mb-6">Linguistic Distribution</h4>
              <div className="space-y-6">
                 {manualSpeakers.map(s => {
                    const count = turns.filter(t => t.speaker === s).length;
                    const total = turns.length || 1;
                    const perc = Math.round((count / total) * 100);
                    return (
                       <div key={s} className="space-y-2">
                          <div className="flex justify-between items-end"><span className="text-[10px] font-black uppercase italic text-slate-500">{s}</span><span className="text-[9px] font-mono text-slate-600">{count} turns</span></div>
                          <div className="h-1 bg-slate-950 rounded-full overflow-hidden shadow-inner"><div className="h-full bg-accent-primary" style={{ width: `${perc}%` }}></div></div>
                       </div>
                    );
                 })}
              </div>
           </div>

           <footer className="p-8 border-t border-slate-800 bg-slate-950/40 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                 <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest italic">Acoustic Sync: Nomimal</span>
              </div>
              <button disabled={turns.length === 0} className="w-full py-4 bg-slate-900 border border-slate-800 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:text-white transition-all shadow-xl">Flush Protocol</button>
           </footer>
        </aside>

      </div>
      <input type="file" ref={fileInputRef} className="hidden" accept="audio/*,video/*" onChange={handleFileChange} />
    </div>
  );
};

export default TranscriptionHub;
