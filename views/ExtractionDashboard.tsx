
import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, Search, RefreshCw, Loader2, ArrowRight, Database, 
  History, Filter, Eye, ChevronRight, Settings2
} from 'lucide-react';
import { supabaseService } from '../services/supabaseService';
import { EntityDocument, UserProfile } from '../types';

interface Props {
  userProfile: UserProfile;
  onNavigate: (view: string, id?: string) => void;
}

const ExtractionDashboard: React.FC<Props> = ({ userProfile, onNavigate }) => {
  const [documents, setDocuments] = useState<EntityDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const loadData = async () => {
    setLoading(true);
    // Fixed: fetchDocuments is now implemented in supabaseService
    const data = await supabaseService.fetchDocuments(userProfile.tenant_id);
    setDocuments(data);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const filtered = useMemo(() => {
    return documents.filter(d => {
      const matchSearch = d.source_name.toLowerCase().includes(search.toLowerCase()) || 
                          d.source_url.toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter === 'ALL' || d.document_type === typeFilter;
      return matchSearch && matchType;
    });
  }, [documents, search, typeFilter]);

  if (loading) return (
    <div className="h-full flex items-center justify-center">
      <Loader2 className="animate-spin text-brand-primary" size={40} />
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-[1600px] mx-auto pb-40">
      <header className="flex justify-between items-end border-b border-border-ui dark:border-slate-800 pb-10">
        <div className="space-y-4">
          <h1 className="text-6xl font-black flex items-center gap-6 text-text-primary dark:text-white tracking-tighter uppercase italic font-serif leading-none">
            <FileText className="text-brand-primary shrink-0" size={54} /> Documents
          </h1>
          <p className="text-text-secondary font-medium text-lg italic">Extraction Feed & Master Document Registry</p>
        </div>
        {/* Fixed: Corrected navigation target to 'extraction_settings' which corresponds to the Monitor view */}
        <button 
          onClick={() => onNavigate('extraction_settings')} 
          className="px-8 py-4 bg-brand-primary text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:brightness-110 active:scale-95 transition-all flex items-center gap-3"
        >
          <Settings2 size={18} /> Monitor Source
        </button>
      </header>

      <div className="flex gap-6 items-center bg-card-panel dark:bg-slate-900 border border-border-ui dark:border-slate-800 p-6 rounded-[2rem] shadow-sm">
        <div className="relative flex-1 group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600" size={20} />
          <input 
            type="text" 
            placeholder="Filter by Source, URL protocol, or Filing ID..." 
            className="w-full bg-app-bg dark:bg-[#020617] border border-border-ui dark:border-slate-800 rounded-2xl pl-16 pr-8 py-4 text-sm text-text-primary dark:text-white outline-none focus:ring-4 focus:ring-brand-primary/10 transition-all font-serif italic"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-4">
          <select 
            className="bg-app-bg dark:bg-[#020617] border border-border-ui dark:border-slate-800 rounded-2xl px-6 py-4 text-[10px] font-black uppercase text-slate-400 outline-none cursor-pointer"
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
          >
            <option value="ALL">All Formats</option>
            <option value="WEBSITE">Websites</option>
            <option value="PDF">PDF Artifacts</option>
            <option value="FILING">Filings</option>
          </select>
          <button onClick={loadData} className="p-4 bg-app-bg dark:bg-slate-950 border border-border-ui dark:border-slate-800 rounded-xl text-slate-500 hover:text-brand-primary transition-all shadow-sm">
            <RefreshCw size={20} />
          </button>
        </div>
      </div>

      <div className="bg-card-panel dark:bg-slate-900 border border-border-ui dark:border-slate-800 rounded-[3rem] overflow-hidden shadow-xl">
        <table className="w-full text-left border-collapse min-w-[1200px]">
          <thead className="bg-slate-50/50 dark:bg-slate-950/40 border-b border-border-ui dark:border-slate-800">
            <tr className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
              <th className="px-10 py-6">Source Signature</th>
              <th className="px-8 py-6">Format</th>
              <th className="px-8 py-6">Ingestion</th>
              <th className="px-8 py-6 text-center">Depth</th>
              <th className="px-8 py-6">Last Synchronized</th>
              <th className="px-10 py-6 text-right">Handshake</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-ui dark:divide-slate-800/40">
            {filtered.map(doc => (
              <tr key={doc.id} onClick={() => onNavigate('extraction_detail', doc.id)} className="hover:bg-brand-primary/5 transition-all group cursor-pointer">
                <td className="px-10 py-6">
                  <p className="text-sm font-black text-text-primary dark:text-white italic font-serif leading-none mb-1 uppercase">{doc.source_name}</p>
                  <p className="text-[9px] font-mono text-slate-600 uppercase truncate max-w-sm">{doc.source_url}</p>
                </td>
                <td className="px-8 py-6">
                  <span className="text-[10px] font-black uppercase text-slate-500 bg-slate-100 dark:bg-slate-950 px-2.5 py-1 rounded-lg border border-border-ui dark:border-slate-800">{doc.document_type}</span>
                </td>
                <td className="px-8 py-6">
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${doc.ingestion_method === 'AUTO' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                    {doc.ingestion_method}
                  </span>
                </td>
                <td className="px-8 py-6 text-center">
                  <span className="text-xs font-mono font-bold text-slate-400">{doc.page_count}p</span>
                </td>
                <td className="px-8 py-6">
                  <span className="text-[10px] font-mono text-slate-600 uppercase">{new Date(doc.last_updated).toLocaleString()}</span>
                </td>
                <td className="px-10 py-6 text-right">
                  <button className="p-2.5 bg-slate-950 border border-slate-800 text-slate-500 group-hover:text-white rounded-xl transition-all shadow-lg">
                    <ChevronRight size={18}/>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-40 text-center opacity-20">
            <Database size={64} className="mx-auto mb-6" />
            <p className="text-2xl font-black italic font-serif uppercase tracking-tight">No institutional nodes found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExtractionDashboard;
