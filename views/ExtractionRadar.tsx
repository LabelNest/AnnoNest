
import React, { useState, useEffect } from 'react';
import { Radar, RefreshCw, Search, Zap, ArrowRight, FolderOpen, AlertCircle, Signal, Loader2 } from 'lucide-react';
import { geminiService, AIError } from '../services/geminiService';
import { supabaseService } from '../services/supabaseService';
import { AnnotationTask, ExtractionSignal, Project, UserProfile } from '../types';

interface Props {
  userProfile: UserProfile;
  addTask: (task: AnnotationTask) => void;
}

const ExtractionRadar: React.FC<Props> = ({ userProfile, addTask }) => {
  const [signals, setSignals] = useState<ExtractionSignal[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [loading, setLoading] = useState<string | null>(null);
  const [processed, setProcessed] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchInitialData = async () => {
    setRefreshing(true);
    setError(null);
    try {
      // Fixed: user_id is the correct property for profile
      const [signalData, projectData] = await Promise.all([
        supabaseService.fetchSignals(),
        supabaseService.fetchProjects(userProfile.user_id, userProfile.tenant_id, userProfile.role)
      ]);
      setSignals(signalData);
      setProjects(projectData);
      if (projectData.length > 0 && !selectedProjectId) {
        setSelectedProjectId(projectData[0].id);
      }
    } catch (error: any) {
      console.error("Radar: Data fetch failed", error);
      setError("Network error fetching radar signals: " + (error.message || "Unknown error"));
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleRunAI = async (signal: ExtractionSignal) => {
    if (!selectedProjectId) {
      setError("Operational Error: A target Project must be selected to route this signal.");
      return;
    }

    setLoading(signal.id);
    setError(null);
    try {
      const extracted = await geminiService.extractEntities(signal.content);
      const project = projects.find(p => p.id === selectedProjectId);

      // Added missing annotations array to match AnnotationTask interface
      const newTask: AnnotationTask = {
        id: `TASK-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        signalId: signal.id,
        projectId: selectedProjectId,
        tenant_id: project?.tenant_id || 'LABELNEST',
        type: 'ENTITY_EXTRACTION',
        status: 'TODO',
        data: { 
          originalText: signal.content, 
          source: signal.source,
          projectName: project?.name || 'Default Project'
        },
        annotations: [], // Initializing with empty annotations
        suggestedOutput: extracted
      };

      addTask(newTask);
      setProcessed(prev => new Set(prev).add(signal.id));
    } catch (e: any) {
      if (e instanceof AIError && e.status === 429) {
        setError(e.message);
      } else {
        setError("AI Extraction failed: " + (e.message || "Unknown error"));
      }
      console.error("AI Extraction Pipeline failed", e);
    } finally {
      setLoading(null);
    }
  };

  const filteredSignals = signals.filter(s => 
    s.content.toLowerCase().includes(filter.toLowerCase()) || 
    s.source.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3 text-white">
            <Radar className="text-blue-500" />
            Extraction Radar
          </h1>
          <p className="text-slate-400 mt-1">Real-time signal ingestion from the Global News Feed.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 shadow-inner">
            <FolderOpen size={16} className="text-blue-400" />
            <select 
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-transparent text-sm font-bold text-slate-200 outline-none cursor-pointer min-w-[140px]"
            >
              {projects.length === 0 && <option value="">No Active Projects</option>}
              {projects.map(p => (
                <option key={p.id} value={p.id} className="bg-slate-900">{p.name}</option>
              ))}
            </select>
          </div>
          <button 
            onClick={fetchInitialData}
            className={`p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition-all ${refreshing ? 'animate-spin' : ''}`}
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-between gap-3 text-red-500 text-sm animate-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <AlertCircle size={18} />
            {error}
          </div>
          <button onClick={() => setError(null)} className="text-[10px] font-bold uppercase tracking-widest hover:text-white">Dismiss</button>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
        <input 
          type="text" 
          placeholder="Filter ingested signals..." 
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-200 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
        />
      </div>

      {!selectedProjectId && !refreshing && !error && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-3 text-amber-500 text-sm">
          <AlertCircle size={18} />
          Warning: Signal-to-Task routing requires an active project context.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {filteredSignals.length === 0 && !refreshing && (
          <div className="p-20 text-center border-2 border-dashed border-slate-800 rounded-2xl text-slate-600">
            No unlinked signals found in the radar sweep.
          </div>
        )}
        
        {filteredSignals.map(signal => (
          <div key={signal.id} className={`bg-slate-900 border ${processed.has(signal.id) ? 'border-blue-900/30 opacity-60' : (error?.includes("Quota") ? 'border-red-900/20' : 'border-slate-800')} rounded-xl overflow-hidden hover:border-slate-700 transition-all group relative`}>
            {processed.has(signal.id) && (
              <div className="absolute top-4 right-4 px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[10px] font-bold rounded border border-blue-500/20 z-10 font-mono">
                CONVERTED_TO_TASK
              </div>
            )}
            
            <div className="p-6 flex items-start gap-5">
              <div className={`p-3 rounded-xl ${loading === signal.id ? 'bg-blue-500/20 text-blue-400 animate-pulse' : 'bg-slate-800 text-slate-500'} transition-colors`}>
                <Signal size={24} />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">{signal.type}</span>
                    <h3 className="text-slate-100 font-bold text-xl mt-1">{signal.source}</h3>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] text-slate-500 font-mono mb-1">AI_CONFIDENCE</span>
                    <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500" style={{ width: `${signal.aiConfidence * 100}%` }}></div>
                    </div>
                  </div>
                </div>
                <p className="text-slate-300 mt-4 text-sm font-serif italic border-l-2 border-blue-500/30 pl-6 py-2 leading-relaxed bg-slate-950/30 rounded-r-lg">
                  "{signal.content}"
                </p>
              </div>
            </div>

            <div className="bg-slate-900/50 px-6 py-4 border-t border-slate-800 flex justify-between items-center">
              <span className="text-[10px] text-slate-500 font-mono uppercase tracking-tight">
                TIMESTAMP: {new Date(signal.timestamp).toISOString()}
              </span>
              <div className="flex gap-3">
                <button 
                  onClick={() => handleRunAI(signal)}
                  disabled={loading === signal.id || processed.has(signal.id) || !selectedProjectId}
                  className={`px-6 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 shadow-lg ${
                    processed.has(signal.id) 
                    ? 'bg-slate-800 text-slate-600 border border-slate-700' 
                    : (error?.includes("Quota") ? 'bg-red-900/40 text-red-400 border border-red-500/20 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-600/10')
                  }`}
                >
                  {loading === signal.id ? 'Analyzing Kernel...' : processed.has(signal.id) ? 'Queued in Workbench' : (error?.includes("Quota") ? 'Rate Limited' : 'Generate Annotation Task')}
                  <Zap size={14} className={loading === signal.id ? "animate-spin" : ""} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExtractionRadar;
