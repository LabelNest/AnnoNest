
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  ImageIcon, UploadCloud, Sparkles, ShieldCheck, Trash2, ArrowLeft, 
  MousePointer2, Box, Zap, Brain, Loader2, Target, Layers, 
  Maximize, Minus, Plus, Settings, Save, Layout, Crosshair,
  ChevronRight, Info, Eye, EyeOff, Terminal, Edit3, Wheat, Leaf
} from 'lucide-react';
import { geminiService } from '../services/geminiService';

interface Annotation {
  id: string;
  label: string;
  x: number; // percentage
  y: number; // percentage
  width: number; // percentage
  height: number; // percentage
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

type DomainPreset = 'GENERAL' | 'AGRITECH' | 'INDUSTRIAL' | 'MEDICAL';

const PRESETS: Record<DomainPreset, LabelClass[]> = {
  GENERAL: [
    { id: 'STRUCTURAL', name: 'Structural Node', color: '#2F6BFF' },
    { id: 'SIGNAGE', name: 'Signage / Logo', color: '#E84C88' },
    { id: 'PERSONNEL', name: 'Personnel', color: '#10B981' },
    { id: 'VEHICLE', name: 'Logistics Asset', color: '#F59E0B' },
    { id: 'DOCUMENT', name: 'Textual Artifact', color: '#8B5CF6' }
  ],
  AGRITECH: [
    { id: 'CROP_HEALTH', name: 'Crop (Healthy)', color: '#10B981' },
    { id: 'CROP_STRESS', name: 'Crop (Stressed)', color: '#F43F5E' },
    { id: 'PEST_NODE', name: 'Pest Infestation', color: '#E84C88' },
    { id: 'WEED_SIGNAL', name: 'Weed / Invasive', color: '#F59E0B' },
    { id: 'EQUIPMENT', name: 'Agri-Machinery', color: '#3B82F6' },
    { id: 'IRRIGATION', name: 'Irrigation Node', color: '#06B6D4' }
  ],
  INDUSTRIAL: [],
  MEDICAL: []
};

const ImageHub: React.FC<Props> = ({ onNavigate, projectName, predefinedClasses }) => {
  const [image, setImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [domain, setDomain] = useState<DomainPreset>('GENERAL');
  const [activeTool, setActiveTool] = useState<'SELECT' | 'BBOX' | 'POINT'>('BBOX');
  
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [currentBox, setCurrentBox] = useState<Partial<Annotation> | null>(null);
  const [labelClasses, setLabelClasses] = useState<LabelClass[]>(predefinedClasses || PRESETS.GENERAL);
  const [activeClass, setActiveClass] = useState<string>(labelClasses[0]?.id);

  useEffect(() => {
    const nextClasses = predefinedClasses || PRESETS[domain];
    setLabelClasses(nextClasses);
    setActiveClass(nextClasses[0]?.id);
  }, [domain, predefinedClasses]);

  const canvasRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImage(reader.result as string);
      setAnnotations([]);
      setZoom(1);
    };
    reader.readAsDataURL(file);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (activeTool !== 'BBOX' || !image || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setIsDrawing(true);
    setCurrentBox({ id: Date.now().toString(), x, y, width: 0, height: 0, label: activeClass });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !currentBox || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setCurrentBox({ ...currentBox, width: x - (currentBox.x || 0), height: y - (currentBox.y || 0) });
  };

  const handleMouseUp = () => {
    if (isDrawing && currentBox) {
      const selectedClass = labelClasses.find(c => c.id === activeClass);
      const finalBox: Annotation = {
        ...currentBox,
        color: selectedClass?.color || '#FFFFFF',
        label: selectedClass?.name || 'Unknown'
      } as Annotation;
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
    if (!image) return;
    setIsProcessing(true);
    try {
      const prompt = domain === 'AGRITECH' 
        ? `Perform high-precision agricultural analysis. Identify crops, weed signals, and equipment nodes. Suggest 5 specialized b-box annotations.`
        : `Identify technical nodes in this image and suggest 5 b-box labels. Output reasoning only.`;
        
      await geminiService.askRefinery(prompt, { image_hint: true, domain_context: domain });
      
      const aiLabels: Annotation[] = [
        { id: `ai-${Date.now()}`, label: domain === 'AGRITECH' ? 'CROP_CLUSTER_ALPHA' : 'AI_NODE', x: 25, y: 30, width: 20, height: 20, color: domain === 'AGRITECH' ? '#10B981' : '#F59E0B' }
      ];
      setAnnotations([...annotations, ...aiLabels]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-app-bg dark:bg-app-bg-dark text-text-primary dark:text-white transition-colors overflow-hidden">
      
      <header className="h-20 px-10 border-b border-border-ui dark:border-border-ui flex items-center justify-between shrink-0 bg-card-panel/80 dark:bg-card-panel-dark/80 backdrop-blur-2xl z-[150] shadow-xl">
        <div className="flex items-center gap-8">
           <button onClick={onNavigate} className="p-3 bg-elevated dark:bg-slate-900 border border-border-ui dark:border-slate-800 rounded-xl text-text-muted hover:text-white transition-all active:scale-90">
             <ArrowLeft size={20}/>
           </button>
           <div>
              <div className="flex items-center gap-3 mb-1">
                 <span className="text-[9px] font-black text-accent-primary uppercase tracking-[0.4em] bg-accent-primary/10 px-2 py-0.5 rounded border border-accent-primary/20 italic">Hub Mode: Vision Matrix</span>
                 <p className="text-[9px] font-mono text-text-muted uppercase tracking-widest">{projectName || 'Artifact Sequence'}</p>
              </div>
              <h1 className="text-2xl font-black italic font-serif leading-none tracking-tighter uppercase">Vision Matrix v1.4</h1>
           </div>
        </div>

        <div className="flex items-center gap-6">
           <div className="flex bg-slate-900 border border-slate-800 rounded-2xl p-1 shadow-inner">
              <button onClick={() => setDomain('GENERAL')} className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${domain === 'GENERAL' ? 'bg-accent-primary text-white shadow-blue' : 'text-slate-500 hover:text-white'}`}>Standard</button>
              <button onClick={() => setDomain('AGRITECH')} className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${domain === 'AGRITECH' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}><Wheat size={10}/> AgriTech</button>
           </div>
           
           <div className="h-8 w-px bg-slate-800"></div>

           <div className="flex items-center gap-2 bg-elevated dark:bg-slate-950 border border-border-ui dark:border-slate-800 px-4 py-2 rounded-xl">
              <button onClick={() => setZoom(Math.max(0.5, zoom - 0.1))} className="p-1 hover:text-accent-primary"><Minus size={14}/></button>
              <span className="text-[10px] font-black w-12 text-center uppercase tracking-tighter">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom(Math.min(3, zoom + 0.1))} className="p-1 hover:text-accent-primary"><Plus size={14}/></button>
           </div>
           
           <button 
             onClick={runAISynthesis} 
             disabled={isProcessing || !image}
             className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-blue hover:brightness-110 active:scale-95 transition-all flex items-center gap-3"
           >
             {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Brain size={16} />} Use AI Synthesis
           </button>

           <button onClick={() => fileInputRef.current?.click()} className="px-6 py-2.5 bg-accent-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-blue hover:brightness-110 active:scale-95 transition-all flex items-center gap-3">
             <UploadCloud size={16} /> Deploy Artifact
           </button>
           <button disabled={annotations.length === 0} className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg hover:bg-emerald-500 disabled:opacity-20 transition-all flex items-center gap-3">
             <ShieldCheck size={16} /> Commit Ledger
           </button>
        </div>
      </header>
      {/* ... Rest of component remains same ... */}
      <main className="flex-1 relative bg-[#020617] overflow-hidden group">
           <div className="absolute inset-0 pointer-events-none z-40 opacity-0 group-hover:opacity-40 transition-opacity">
              <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white/20 -translate-x-1/2"></div>
              <div className="absolute left-0 right-0 top-1/2 h-px bg-white/20 -translate-y-1/2"></div>
           </div>

           <div className="w-full h-full flex items-center justify-center overflow-auto custom-scrollbar">
              <div 
                ref={canvasRef}
                className="relative cursor-crosshair shadow-4xl transition-transform duration-200"
                style={{ transform: `scale(${zoom})`, width: imgRef.current?.naturalWidth ? `${imgRef.current.naturalWidth}px` : 'auto', maxHeight: '90%' }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
              >
                {image ? (
                  <>
                    <img ref={imgRef} src={image} alt="Refinery Artifact" className="max-w-none block pointer-events-none rounded-sm select-none" onLoad={() => setZoom(1)} />
                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-30">
                       {annotations.map(anno => (
                         <g key={anno.id}>
                            <rect x={`${anno.x}%`} y={`${anno.y}%`} width={`${anno.width}%`} height={`${anno.height}%`} fill={`${anno.color}22`} stroke={anno.color} strokeWidth="2" className="transition-all" />
                            {showLabels && (
                              <text x={`${anno.x}%`} y={`${anno.y}%`} dy="-6" fill={anno.color} className="text-[11px] font-black uppercase italic font-serif" style={{ filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.8))' }}>{anno.label}</text>
                            )}
                         </g>
                       ))}
                       {currentBox && (
                         <rect x={`${currentBox.x}%`} y={`${currentBox.y}%`} width={`${currentBox.width}%`} height={`${currentBox.height}%`} fill={`${labelClasses.find(c => c.id === activeClass)?.color}44`} stroke={labelClasses.find(c => c.id === activeClass)?.color} strokeWidth="2" strokeDasharray="4 2" />
                       )}
                    </svg>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center p-40 space-y-8 opacity-10">
                     <ImageIcon size={160} />
                     <p className="text-5xl font-black italic font-serif uppercase tracking-tighter">Horizon Idle</p>
                  </div>
                )}
              </div>
           </div>
        </main>

        <aside className="w-[380px] shrink-0 border-l border-border-ui dark:border-border-ui bg-card-panel dark:bg-card-panel-dark flex flex-col overflow-hidden shadow-3xl z-50">
           <header className="p-8 border-b border-slate-800 shrink-0">
              <div className="flex justify-between items-center mb-8">
                 <h3 className="text-[11px] font-black text-text-muted uppercase tracking-[0.5em]">{domain} Palette</h3>
                 {domain === 'AGRITECH' && <Wheat size={16} className="text-emerald-500" />}
              </div>
              <div className="grid grid-cols-1 gap-2">
                 {labelClasses.map(c => (
                   <button key={c.id} onClick={() => setActiveClass(c.id)} className={`w-full p-4 rounded-xl border-2 transition-all flex items-center justify-between group ${activeClass === c.id ? 'border-accent-primary bg-accent-primary/5 shadow-inner' : 'border-transparent bg-elevated dark:bg-slate-900/50 hover:border-slate-700'}`}>
                      <div className="flex items-center gap-4">
                         <div className="w-4 h-4 rounded-full shadow-lg" style={{ backgroundColor: c.color }}></div>
                         <span className={`text-[11px] font-black uppercase italic ${activeClass === c.id ? 'text-white' : 'text-text-secondary'}`}>{c.name}</span>
                      </div>
                      <span className={`text-[9px] font-mono font-bold ${activeClass === c.id ? 'text-accent-primary' : 'text-slate-700'}`}>0{labelClasses.indexOf(c) + 1}</span>
                   </button>
                 ))}
                 <button className="w-full py-3 border border-dashed border-slate-800 rounded-xl text-[9px] font-black uppercase text-slate-700 hover:text-white transition-all mt-2 flex items-center justify-center gap-2">
                    <Plus size={12}/> Extend Palette
                 </button>
              </div>
           </header>

           <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
              <div className="p-8 border-b border-border-ui dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/20">
                 <h3 className="text-[11px] font-black text-text-muted uppercase tracking-[0.5em]">Active Objects ({annotations.length})</h3>
                 <button onClick={() => setAnnotations([])} className="text-[9px] font-black text-rose-500 uppercase tracking-widest hover:underline">Purge All</button>
              </div>
              
              <div className="p-4 space-y-2">
                 {annotations.map(anno => (
                   <div key={anno.id} className="p-4 bg-elevated dark:bg-slate-900/40 border border-border-ui dark:border-slate-800 rounded-2xl group hover:border-accent-primary transition-all flex items-center justify-between">
                      <div className="flex items-center gap-4">
                         <div className="w-2 h-8 rounded-full" style={{ backgroundColor: anno.color }}></div>
                         <div>
                            <p className="text-[10px] font-black text-white uppercase italic tracking-tight leading-none mb-1">{anno.label}</p>
                            <p className="text-[8px] font-mono text-slate-600 uppercase tracking-tighter">POS: {Math.round(anno.x)}, {Math.round(anno.y)} | SCALE: {Math.round(anno.width)}x{Math.round(anno.height)}</p>
                         </div>
                      </div>
                      <button onClick={() => setAnnotations(annotations.filter(a => a.id !== anno.id))} className="p-2 text-slate-800 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100"><Trash2 size={14}/></button>
                   </div>
                 ))}
                 {annotations.length === 0 && (
                   <div className="py-20 text-center space-y-4 opacity-10 flex flex-col items-center">
                      <Crosshair size={48} />
                      <p className="text-[10px] font-black uppercase tracking-[0.4em]">Zero Domain Signals</p>
                   </div>
                 )}
              </div>
           </div>

           <footer className="p-8 border-t border-border-ui dark:border-slate-800 bg-slate-950/40 text-center space-y-4">
              <div className="flex items-center gap-3 justify-center mb-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                 <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest italic">Matrix State: Synchronized</span>
              </div>
              <p className="text-[8px] font-black text-slate-800 uppercase tracking-[0.4em] leading-none">Vision Matrix Hub v1.4.2</p>
           </footer>
        </aside>
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleUpload} />
    </div>
  );
};

const ToolbarButton = ({ active, onClick, icon: Icon, label }: any) => (
  <div className="relative group">
     <button onClick={onClick} className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 group-hover:scale-110 active:scale-95 ${active ? 'bg-accent-primary border-accent-primary text-white shadow-blue' : 'bg-transparent border-transparent text-text-muted hover:text-white'}`}>
        <Icon size={24} />
     </button>
     <div className="absolute left-full ml-4 px-3 py-1 bg-slate-900 text-white text-[8px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none z-50 whitespace-nowrap border border-slate-800 shadow-xl transition-opacity">{label}</div>
  </div>
);

export default ImageHub;
