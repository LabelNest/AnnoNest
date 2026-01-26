
import React, { useState, useRef, useEffect } from 'react';
import { 
  Languages, ArrowLeft, Loader2, Sparkles, RefreshCw, 
  Clipboard, Download, Brain, Globe, ShieldCheck, Database, Search,
  FileText, UploadCloud, Trash2, Check, X, FileOutput, ChevronDown,
  Info, Zap, AlignLeft, Type, History, MessageSquare, AlertCircle
} from 'lucide-react';
import { geminiService } from '../services/geminiService';

const MAX_CHARS = 10000;

const LANGUAGES = [
  'Auto-Detect', 'English', 'Spanish', 'French', 'German', 'Chinese (Simplified)', 
  'Chinese (Traditional)', 'Japanese', 'Korean', 'Arabic', 'Portuguese (Portugal)', 
  'Portuguese (Brazil)', 'Hindi', 'Russian', 'Italian', 'Dutch', 'Greek', 'Hebrew', 
  'Turkish', 'Bengali', 'Vietnamese', 'Thai', 'Polish', 'Indonesian', 'Malay', 
  'Ukrainian', 'Czech', 'Romanian', 'Hungarian', 'Swedish', 'Danish', 'Finnish', 
  'Norwegian', 'Swahili', 'Urdu', 'Persian', 'Catalan', 'Filipino'
];

type ViewState = 'TEXT' | 'DOCUMENT';

const TranslationHub: React.FC<{ onNavigate: () => void }> = ({ onNavigate }) => {
  const [viewState, setViewState] = useState<ViewState>('TEXT');
  const [sourceText, setSourceText] = useState('');
  const [targetText, setTargetText] = useState('');
  const [sourceLang, setSourceLang] = useState('Auto-Detect');
  const [targetLang, setTargetLang] = useState('English');
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (selected.size > 20 * 1024 * 1024) {
        alert("Document exceeds standard 20MB threshold.");
        return;
      }
      setFile(selected);
      setViewState('DOCUMENT');
    }
  };

  const handleTranslate = async () => {
    if (!sourceText && !file) return;
    setIsSynthesizing(true);
    try {
      // Use the centralized geminiService to avoid "Illegal constructor" issues
      const contentToTranslate = sourceText || (file ? `Analyze and translate the uploaded document: ${file.name}` : '');
      const translated = await geminiService.translateText(contentToTranslate, targetLang, sourceLang);
      setTargetText(translated);
    } catch (e) {
      console.error(e);
      alert("Linguistic Bridge Fault: Kernel Timeout or Synthesis Error.");
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handleExport = (format: 'DOC' | 'TXT' | 'JSON') => {
    const filename = `Translation_Node_${targetLang}_v1`;
    let content = targetText;
    if (format === 'JSON') content = JSON.stringify({ sourceLang, targetLang, text: targetText }, null, 2);
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.${format.toLowerCase()}`;
    link.click();
    setShowExportMenu(false);
  };

  return (
    <div className="h-screen flex flex-col bg-app-bg dark:bg-[#070B14] text-white transition-colors overflow-hidden font-sans">
      
      {/* HUD HEADER */}
      <header className="h-20 px-10 border-b border-border-ui dark:border-[#1C2A44] flex items-center justify-between shrink-0 bg-card-panel/80 dark:bg-[#0E1626]/80 backdrop-blur-2xl z-[150] shadow-xl">
        <div className="flex items-center gap-8">
           <button onClick={onNavigate} className="p-3 bg-elevated dark:bg-slate-900 border border-border-ui dark:border-slate-800 rounded-xl text-text-muted hover:text-white transition-all active:scale-90 shadow-lg">
             <ArrowLeft size={20}/>
           </button>
           <div>
              <div className="flex items-center gap-3 mb-1">
                 <span className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.4em] bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 italic">Hub Mode: Linguistic Bridge</span>
                 <p className="text-[9px] font-mono text-text-muted uppercase tracking-widest">Protocol v1.4.1</p>
              </div>
              <h1 className="text-2xl font-black italic font-serif leading-none tracking-tighter uppercase">Linguistic Bridge</h1>
           </div>
        </div>

        <div className="flex items-center gap-4">
           {targetText && (
             <div className="relative">
                <button 
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="px-6 py-2.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 shadow-lg"
                >
                  <FileOutput size={16} /> Export Outcome <ChevronDown size={14} />
                </button>
                {showExportMenu && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-2xl shadow-3xl overflow-hidden z-[200] animate-in fade-in zoom-in-95">
                    {(['DOC', 'TXT', 'JSON'] as const).map(fmt => (
                      <button 
                        key={fmt}
                        onClick={() => handleExport(fmt)}
                        className="w-full px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-between border-b border-slate-800/50 last:border-0"
                      >
                        {fmt} Node <Download size={14} />
                      </button>
                    ))}
                  </div>
                )}
             </div>
           )}

           <button 
             onClick={() => fileInputRef.current?.click()} 
             className="px-6 py-2.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 shadow-lg"
           >
             <UploadCloud size={16} /> Upload Doc
           </button>
           
           <button 
             onClick={handleTranslate}
             disabled={isSynthesizing || (!sourceText && !file)}
             className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-indigo-900/40 hover:bg-indigo-500 disabled:opacity-20 transition-all flex items-center gap-3"
           >
             {isSynthesizing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />} 
             {isSynthesizing ? 'Synthesizing...' : 'Initialize Bridge'}
           </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        
        {/* SOURCE MATRIX (LEFT) */}
        <section className="flex-1 border-r border-slate-800 flex flex-col bg-[#020617] relative">
           <header className="px-10 py-6 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
              <div className="flex items-center gap-6">
                 <div className="flex flex-col gap-1">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Inbound Node</span>
                    <select 
                      value={sourceLang}
                      onChange={(e) => setSourceLang(e.target.value)}
                      className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-1.5 text-[10px] font-black text-indigo-400 uppercase outline-none cursor-pointer focus:border-indigo-500 transition-all"
                    >
                      {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                 </div>
                 <div className="h-8 w-px bg-slate-800"></div>
                 <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
                    <button onClick={() => setViewState('TEXT')} className={`px-4 py-1 rounded-lg text-[9px] font-black uppercase transition-all ${viewState === 'TEXT' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>Editor</button>
                    <button onClick={() => setViewState('DOCUMENT')} className={`px-4 py-1 rounded-lg text-[9px] font-black uppercase transition-all ${viewState === 'DOCUMENT' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>Doc Vault</button>
                 </div>
              </div>
              <button onClick={() => { setSourceText(''); setFile(null); }} className="p-2 text-slate-600 hover:text-rose-500 transition-all"><Trash2 size={18}/></button>
           </header>

           <div className="flex-1 p-10 overflow-y-auto custom-scrollbar">
              {viewState === 'TEXT' ? (
                <div className="h-full flex flex-col gap-6">
                   <div className="flex-1 relative group">
                      <textarea 
                        className="w-full h-full bg-slate-950/50 border border-slate-800 rounded-[2.5rem] p-10 text-xl text-slate-300 italic font-serif leading-relaxed outline-none focus:border-indigo-500/50 transition-all resize-none shadow-inner selection:bg-indigo-500/30"
                        placeholder="Insert institutional source sequence here..."
                        maxLength={MAX_CHARS}
                        value={sourceText}
                        onChange={e => setSourceText(e.target.value)}
                      />
                      <div className="absolute bottom-6 right-10 text-[10px] font-mono text-slate-700 uppercase tracking-widest">
                        {sourceText.length} / {MAX_CHARS} SIG_BLOCK
                      </div>
                   </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center">
                   {file ? (
                     <div className="bg-slate-900 border border-indigo-500/30 p-16 rounded-[4rem] text-center space-y-8 animate-in zoom-in-95 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-10 text-indigo-500/5 group-hover:scale-110 transition-transform"><Database size={240}/></div>
                        <div className="w-24 h-24 bg-indigo-600/10 border border-indigo-500/20 rounded-3xl flex items-center justify-center text-indigo-500 mx-auto shadow-inner">
                           <FileText size={48} />
                        </div>
                        <div className="space-y-2 relative z-10">
                           <h3 className="text-2xl font-black text-white italic font-serif uppercase tracking-tight truncate max-w-sm">{file.name}</h3>
                           <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Artifact Size: {(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                        </div>
                        <button onClick={() => setFile(null)} className="px-8 py-3 bg-rose-600/10 border border-rose-500/20 text-rose-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all">Detach Artifact</button>
                     </div>
                   ) : (
                     <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full max-w-xl aspect-square bg-slate-950 border-4 border-dashed border-slate-800 rounded-[4rem] flex flex-col items-center justify-center gap-8 cursor-pointer hover:border-indigo-500/40 transition-all group opacity-40 hover:opacity-100"
                     >
                        <div className="w-24 h-24 rounded-[2.5rem] bg-slate-900 flex items-center justify-center text-slate-700 group-hover:text-indigo-500 group-hover:scale-110 transition-all shadow-inner">
                           <UploadCloud size={48}/>
                        </div>
                        <div className="text-center space-y-2">
                           <h4 className="text-xl font-black text-slate-500 uppercase italic">Ingest Artifact</h4>
                           <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.4em]">PDF / DOCX Nodes Only</p>
                        </div>
                     </div>
                   )}
                </div>
              )}
           </div>
        </section>

        {/* TARGET OUTCOME (RIGHT) */}
        <section className="flex-1 flex flex-col bg-[#070B14] relative">
           <header className="px-10 py-6 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
              <div className="flex flex-col gap-1">
                 <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Target Node</span>
                 <select 
                    value={targetLang}
                    onChange={(e) => setTargetLang(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-1.5 text-[10px] font-black text-indigo-400 uppercase outline-none cursor-pointer focus:border-indigo-500 transition-all"
                 >
                    {LANGUAGES.slice(1).map(l => <option key={l} value={l}>{l}</option>)}
                 </select>
              </div>
              <div className="flex gap-3">
                 <button onClick={() => navigator.clipboard.writeText(targetText)} className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-600 hover:text-white transition-all shadow-lg"><Clipboard size={18}/></button>
              </div>
           </header>

           <div className="flex-1 p-10 overflow-y-auto custom-scrollbar flex flex-col gap-8">
              {isSynthesizing ? (
                <div className="h-full flex flex-col items-center justify-center gap-10 animate-pulse">
                   <div className="w-32 h-32 rounded-[3.5rem] bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 shadow-3xl">
                      <Brain size={64} className="animate-bounce"/>
                   </div>
                   <div className="text-center space-y-4">
                      <h3 className="text-4xl font-black text-white italic font-serif uppercase tracking-tight leading-none">Bridge Active</h3>
                      <p className="text-lg text-slate-500 italic font-medium">Gemini 3 Pro is currently mapping linguistic vertices.</p>
                   </div>
                </div>
              ) : targetText ? (
                <div className="h-full animate-in fade-in slide-in-from-right-4 duration-700">
                   <textarea 
                      className="w-full h-full bg-transparent border-0 p-0 text-xl text-white italic font-serif leading-relaxed outline-none resize-none selection:bg-indigo-500/30"
                      value={targetText}
                      onChange={e => setTargetText(e.target.value)}
                   />
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center opacity-10 space-y-8">
                   <Languages size={160} />
                   <p className="text-5xl font-black italic font-serif uppercase tracking-tighter text-center leading-none">Outcome <br/> Node Void</p>
                </div>
              )}
           </div>
        </section>
      </div>

      {/* FOOTER AUDIT LEDGER */}
      <footer className="h-14 bg-slate-950 border-t border-slate-900 px-10 flex items-center justify-between shrink-0 z-50">
         <div className="flex items-center gap-10">
            <div className="flex items-center gap-3">
               <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse shadow-blue"></div>
               <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest italic">Linguistic Sync: Nominal</span>
            </div>
            <div className="flex items-center gap-3">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-emerald-500/50"></div>
               <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest italic">Bridge State: Persistent</span>
            </div>
         </div>
         <p className="text-[8px] font-black text-slate-800 uppercase tracking-[0.4em] italic font-serif">AnnoNest Linguistic Bridge — v1.4.1 CANON</p>
      </footer>

      <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.doc,.docx" onChange={handleFileUpload} />
    </div>
  );
};

export default TranslationHub;
