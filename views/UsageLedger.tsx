
import React, { useState, useEffect } from 'react';
import { 
  BarChart3, RefreshCw, Loader2, Database, Activity,
  ShieldCheck
} from 'lucide-react';
import { supabaseService } from '../services/supabaseService';
import { UsageLedger, UserProfile } from '../types';

interface Props {
  userProfile: UserProfile;
}

const UsageLedgerView: React.FC<Props> = ({ userProfile }) => {
  const [ledger, setLedger] = useState<UsageLedger[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const data = await supabaseService.fetchUsageLedger(userProfile.tenant_id);
    setLedger(data);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  if (loading) return (
    <div className="h-full flex items-center justify-center">
      <Loader2 className="animate-spin text-brand-primary" size={40} />
    </div>
  );

  return (
    <div className="space-y-12 animate-in fade-in duration-500 max-w-[1600px] mx-auto pb-40">
      <header className="flex justify-between items-end border-b border-border-ui dark:border-slate-800 pb-10">
        <div className="space-y-4">
          <h1 className="text-6xl font-black flex items-center gap-6 text-text-primary dark:text-white tracking-tighter uppercase italic font-serif leading-none">
            <BarChart3 className="text-brand-primary shrink-0" size={54} /> Usage Ledger
          </h1>
          <p className="text-text-secondary font-medium text-lg italic">Resource Utilization & Audit Plane</p>
        </div>
        <button onClick={loadData} className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-slate-500 hover:text-brand-primary transition-all shadow-lg">
          <RefreshCw size={24} />
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-slate-900 border border-slate-800 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
           <div className="absolute -right-4 -top-4 opacity-5 text-blue-500 group-hover:scale-110 transition-transform"><Activity size={140}/></div>
           <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-4">Cumulative Units</p>
           <p className="text-6xl font-black text-white italic font-serif tracking-tighter">{ledger.reduce((acc, c) => acc + c.units, 0).toLocaleString()}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
           <div className="absolute -right-4 -top-4 opacity-5 text-emerald-500 group-hover:scale-110 transition-transform"><Database size={140}/></div>
           <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-4">Registry Nodes</p>
           <p className="text-6xl font-black text-white italic font-serif tracking-tighter">{new Set(ledger.map(l => l.document_id)).size}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
           <div className="absolute -right-4 -top-4 opacity-5 text-indigo-500 group-hover:scale-110 transition-transform"><ShieldCheck size={140}/></div>
           <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-4">Operational Status</p>
           <p className="text-6xl font-black text-emerald-500 italic font-serif tracking-tighter uppercase">NOMINAL</p>
        </div>
      </div>

      <div className="bg-card-panel dark:bg-slate-900 border border-border-ui dark:border-slate-800 rounded-[3rem] overflow-hidden shadow-xl">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50/50 dark:bg-slate-950/40 border-b border-border-ui dark:border-slate-800">
            <tr className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
              <th className="px-10 py-8">Usage Context</th>
              <th className="px-8 py-8">Units Consumption</th>
              <th className="px-8 py-8">Unit Type</th>
              <th className="px-8 py-8">Document signature</th>
              <th className="px-10 py-8 text-right">Temporal Signature</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-ui dark:divide-slate-800/40">
            {ledger.map(entry => (
              <tr key={entry.id} className="hover:bg-brand-primary/5 transition-all group">
                <td className="px-10 py-8">
                  <span className="text-[10px] font-black uppercase text-blue-500 bg-blue-500/10 px-3 py-1 rounded-lg border border-blue-500/20 italic tracking-widest">{entry.usage_type}</span>
                </td>
                <td className="px-8 py-8">
                  <p className="text-2xl font-black text-white italic font-serif leading-none tracking-tight">{entry.units.toLocaleString()}</p>
                </td>
                <td className="px-8 py-8">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{entry.unit_type}</p>
                </td>
                <td className="px-8 py-8">
                   <p className="text-[10px] font-mono text-slate-600 uppercase italic truncate max-w-[150px]">ID_{entry.document_id?.slice(0, 12)}</p>
                </td>
                <td className="px-10 py-8 text-right">
                  <span className="text-[10px] font-mono text-slate-700 uppercase">{new Date(entry.created_at).toLocaleString()}</span>
                </td>
              </tr>
            ))}
            {ledger.length === 0 && (
              <tr>
                <td colSpan={5} className="py-40 text-center italic text-slate-600 font-serif text-xl opacity-20">No utilization records persisted in current horizon.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UsageLedgerView;
