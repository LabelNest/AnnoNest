
import React, { useState, useMemo } from 'react';
import { 
  ListTodo, Filter, Search, Clock, AlertCircle, CheckCircle2, 
  User, Calendar, ArrowRight, Layers, MoreVertical, 
  Zap, ShieldAlert, Cpu, PenTool, SearchCheck
} from 'lucide-react';
import { AnnotationTask, UserProfile, UserRole } from '../types';

interface Props {
  tasks: AnnotationTask[];
  userProfile: UserProfile;
  userMap: Record<string, string>;
}

const TaskCommand: React.FC<Props> = ({ tasks, userProfile, userMap }) => {
  const [filter, setFilter] = useState('');
  const [activeTab, setActiveTab] = useState<'TODO' | 'IN_PROGRESS' | 'DONE' | 'ALL'>('TODO');

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const matchStatus = activeTab === 'ALL' || t.status === activeTab;
      const matchSearch = t.id.toLowerCase().includes(filter.toLowerCase()) || 
                          t.task_type.toLowerCase().includes(filter.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [tasks, activeTab, filter]);

  const getPriorityColor = (p?: string) => {
    switch (p) {
      case 'CRITICAL': return 'text-rose-500 border-rose-500/20 bg-rose-500/10 shadow-[0_0_15px_rgba(244,63,94,0.2)]';
      case 'HIGH': return 'text-orange-500 border-orange-500/20 bg-orange-500/10';
      case 'MEDIUM': return 'text-blue-500 border-blue-500/20 bg-blue-500/10';
      default: return 'text-slate-500 border-slate-800 bg-slate-900';
    }
  };

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'ENTITY_EXTRACTION': return <Cpu size={16} />;
      case 'VERIFICATION': return <PenTool size={16} />;
      case 'QA_CORRECTION': return <SearchCheck size={16} />;
      case 'DISPUTE_RESOLUTION': return <ShieldAlert size={16} />;
      default: return <ListTodo size={16} />;
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 max-w-[1600px] mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-slate-800 pb-10">
        <div>
          <h1 className="text-5xl font-black flex items-center gap-6 text-white tracking-tighter uppercase italic font-serif">
            <ListTodo className="text-blue-500" size={54} />
            Task Command
          </h1>
          <p className="text-slate-400 mt-4 font-medium flex items-center gap-3">
            <Clock size={18} className="text-blue-400" />
            Operational Throughput — <span className="text-blue-400 font-black uppercase text-xs tracking-[0.2em] bg-blue-400/10 px-4 py-1.5 rounded-full italic shadow-xl">Real-time Pipeline Management</span>
          </p>
        </div>

        <div className="flex items-center gap-4">
           <div className="flex bg-slate-900 border border-slate-800 rounded-2xl p-1.5 shadow-2xl">
              {['TODO', 'IN_PROGRESS', 'DONE', 'ALL'].map(tab => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-500 hover:text-white'}`}
                >
                  {tab}
                </button>
              ))}
           </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-center justify-between">
          <div className="relative flex-1 max-w-2xl group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors" size={22} />
            <input 
              type="text" 
              placeholder="Filter tasks by ID, Type, or Project..." 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-[2rem] pl-16 pr-8 py-5 text-sm text-slate-100 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-serif italic"
            />
          </div>
          
          <div className="flex items-center gap-4">
             <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Pipeline Health:</span>
             <div className="h-2 w-48 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div className="h-full bg-emerald-500" style={{ width: '82%' }}></div>
             </div>
             <span className="text-xs font-mono font-bold text-emerald-500">82%</span>
          </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-[3.5rem] overflow-hidden shadow-3xl">
        <table className="w-full text-left border-collapse min-w-[1200px]">
          <thead>
            <tr className="bg-slate-950/40 border-b border-slate-800">
              <th className="px-10 py-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Task Identity</th>
              <th className="px-10 py-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Functional Type</th>
              <th className="px-10 py-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Priority</th>
              <th className="px-10 py-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Personnel Assignment</th>
              <th className="px-10 py-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Operational State</th>
              <th className="px-10 py-8"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40">
            {filteredTasks.map((task) => (
              <tr key={task.id} className="hover:bg-slate-800/30 transition-all group cursor-pointer border-l-[6px] border-transparent hover:border-blue-500">
                <td className="px-10 py-8">
                  <div className="flex items-center gap-5">
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-blue-500">
                      {getTaskIcon(task.task_type)}
                    </div>
                    <div>
                      <p className="text-sm font-black text-white italic font-serif leading-none mb-1.5 uppercase tracking-tight">PROT_{task.id.slice(-8)}</p>
                      <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Project Hub Context</p>
                    </div>
                  </div>
                </td>
                <td className="px-10 py-8">
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
                     {task.task_type.replace('_', ' ')}
                   </span>
                </td>
                <td className="px-10 py-8">
                   <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border italic ${getPriorityColor(task.priority || 'MEDIUM')}`}>
                     {task.priority || 'MEDIUM'}
                   </span>
                </td>
                <td className="px-10 py-8">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-500 uppercase italic font-serif">
                        {(userMap[task.assigned_to || ''] || 'U')[0]}
                      </div>
                      <span className="text-xs font-bold text-slate-400 italic uppercase">{userMap[task.assigned_to || ''] || 'Unassigned Node'}</span>
                   </div>
                </td>
                <td className="px-10 py-8">
                   <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
                     task.status === 'DONE' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                     task.status === 'IN_PROGRESS' ? 'bg-blue-600/10 border-blue-500/20 text-blue-400' :
                     'bg-amber-500/10 border-amber-500/20 text-amber-500'
                   }`}>
                     {task.status.replace('_', ' ')}
                   </span>
                </td>
                <td className="px-10 py-8 text-right">
                   <button className="p-4 text-slate-600 hover:text-white hover:bg-slate-800 rounded-2xl transition-all">
                      <MoreVertical size={20} />
                   </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TaskCommand;
