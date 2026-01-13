
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { 
  Share2, Network, Search, Plus, Target, Zap, Users, Landmark, 
  Briefcase, Activity, Box, Filter, Layers, X, Info, ExternalLink, 
  ChevronRight, ShieldCheck, Globe, Clock, TrendingUp, MessageSquare,
  UserPlus, Link2, TriangleAlert, ThumbsUp, ThumbsDown, GitBranch, ArrowRight,
  Loader2, CircleCheck, CircleAlert, UserRound
} from 'lucide-react';
import * as d3 from 'd3';
import { EntityType, Entity, UserRole } from '../types';
import { supabaseService } from '../services/supabaseService';

const RELATIONSHIP_TYPES = [
  'Managing Partner', 'Founder', 'Board Observer', 'Legal Counsel', 
  'Lender', 'Invested In', 'Limited Partner', 'Co-Investor', 
  'Acquired By', 'Auditor', 'Custodian'
];

const ContactGraph: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredLink, setHoveredLink] = useState<any>(null);
  // Re-integrated 'Contact' into the primary focus
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set(['GP', 'LP', 'Fund', 'PortCo', 'Contact', 'Service Provider']));
  const [viewMode, setViewMode] = useState<'RELATIONSHIP' | 'SIGNAL'>('RELATIONSHIP');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isBuildingLink, setIsBuildingLink] = useState(false);
  const [newLink, setNewLink] = useState({ sourceId: '', targetId: '', type: RELATIONSHIP_TYPES[0] });
  const [searchSource, setSearchSource] = useState('');
  const [searchTarget, setSearchTarget] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [dbEntities, dbLinks] = await Promise.all([
        supabaseService.fetchEntities('LABELNEST', UserRole.SUPER_ADMIN),
        supabaseService.fetchEntityRelationships()
      ]);
      setEntities(dbEntities || []);
      setLinks(dbLinks || []);
    } catch (err) {
      console.error("Graph Sync Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredData = useMemo(() => {
    const nodes = entities.filter(n => 
      activeFilters.has(n.type) && 
      n.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const nodeIds = new Set(nodes.map(n => n.id));
    const activeLinks = links.filter(l => 
      nodeIds.has(typeof l.source === 'string' ? l.source : l.source.id) && 
      nodeIds.has(typeof l.target === 'string' ? l.target : l.target.id) &&
      (viewMode === 'SIGNAL' || l.status === 'VERIFIED')
    );
    return { nodes, links: activeLinks };
  }, [entities, links, activeFilters, viewMode, searchQuery]);

  const selectedNode = useMemo(() => 
    entities.find(e => e.id === selectedNodeId),
    [entities, selectedNodeId]
  );

  useEffect(() => {
    if (!svgRef.current || loading) return;

    const width = 1000;
    const height = 800;
    const svg = d3.select(svgRef.current).attr('viewBox', `0 0 ${width} ${height}`);
    svg.selectAll("*").remove();

    const g = svg.append('g');
    const zoom = d3.zoom().scaleExtent([0.1, 4]).on('zoom', (event) => g.attr('transform', event.transform));
    svg.call(zoom as any);

    const simulation = d3.forceSimulation(filteredData.nodes as any)
      .force('link', d3.forceLink(filteredData.links).id((d: any) => d.id).distance(220))
      .force('charge', d3.forceManyBody().strength(-900))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(90))
      .velocityDecay(0.4);

    const link = g.append('g')
      .selectAll('line')
      .data(filteredData.links)
      .enter().append('line')
      .attr('stroke', (d: any) => d.status === 'VERIFIED' ? '#334155' : '#3b82f6')
      .attr('stroke-width', 2.5)
      .attr('stroke-dasharray', (d: any) => d.status === 'VERIFIED' ? '0' : '6 4')
      .style('cursor', 'pointer')
      .on('mouseenter', (event, d) => setHoveredLink(d))
      .on('mouseleave', () => setHoveredLink(null));

    const node = g.append('g')
      .selectAll('g')
      .data(filteredData.nodes)
      .enter().append('g')
      .style('cursor', 'pointer')
      .on('click', (event, d: any) => {
        setSelectedNodeId(d.id === selectedNodeId ? null : d.id);
        svg.transition().duration(750).call(
          zoom.transform as any,
          d3.zoomIdentity.translate(width / 2, height / 2).scale(1).translate(-d.x, -d.y)
        );
      })
      .call(d3.drag<any, any>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended) as any);

    node.append('circle')
      .attr('r', (d: any) => selectedNodeId === d.id ? 26 : 18)
      .attr('fill', (d: any) => {
        switch (d.type) {
          case EntityType.CONTACT: return '#10b981';
          case EntityType.GP: return '#f97316';
          case EntityType.LP: return '#a855f7';
          case EntityType.PORTCO: return '#f43f5e';
          case EntityType.FUND: return '#3b82f6';
          case EntityType.SERVICE_PROVIDER: return '#eab308';
          default: return '#64748b';
        }
      })
      .attr('stroke', '#0f172a')
      .attr('stroke-width', 3)
      .attr('filter', 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))');

    node.append('text')
      .text((d: any) => d.name)
      .attr('dx', 34)
      .attr('dy', 5)
      .attr('fill', '#f8fafc')
      .attr('font-size', (d: any) => selectedNodeId === d.id ? '15px' : '12px')
      .attr('font-weight', '800')
      .attr('class', 'font-sans uppercase tracking-tighter italic font-serif')
      .style('pointer-events', 'none')
      .style('text-shadow', '0 2px 8px rgba(0,0,0,0.8)');

    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);

      if (selectedNodeId) {
        node.style('opacity', (d: any) => {
          const isSelected = d.id === selectedNodeId;
          const isConnected = filteredData.links.some(l => 
            ((l.source as any).id === selectedNodeId && (l.target as any).id === d.id) ||
            ((l.target as any).id === selectedNodeId && (l.source as any).id === d.id)
          );
          return isSelected || isConnected ? 1 : 0.08;
        });
        link.style('opacity', (d: any) => {
          return (d.source as any).id === selectedNodeId || (d.target as any).id === selectedNodeId ? 1 : 0.01;
        });
      } else {
        node.style('opacity', 1);
        link.style('opacity', 1);
      }
    });

    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.1).restart();
      d.fx = d.x; d.fy = d.y;
    }
    function dragged(event: any, d: any) {
      d.fx = event.x; d.fy = event.y;
    }
    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null; d.fy = null;
    }

    return () => simulation.stop();
  }, [filteredData, selectedNodeId, viewMode, loading]);

  const toggleFilter = (type: string) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const handleAddLink = async () => {
    if (!newLink.sourceId || !newLink.targetId) return;
    setLoading(true);
    const res = await supabaseService.upsertRelationship({
      source: newLink.sourceId,
      target: newLink.targetId,
      type: newLink.type,
      tenant_id: 'LABELNEST',
      profileId: 'SYSTEM'
    });
    
    if (res.success) {
      await loadData();
      setIsBuildingLink(false);
      setNewLink({ sourceId: '', targetId: '', type: RELATIONSHIP_TYPES[0] });
      setSearchSource('');
      setSearchTarget('');
    } else {
      alert("Protocol Failure: Error building relationship edge.");
    }
    setLoading(false);
  };

  const sourceSuggestions = entities.filter(e => e.name.toLowerCase().includes(searchSource.toLowerCase())).slice(0, 5);
  const targetSuggestions = entities.filter(e => e.name.toLowerCase().includes(searchTarget.toLowerCase())).slice(0, 5);

  return (
    <div className="h-full flex flex-col gap-8 animate-in fade-in duration-500 max-w-[1600px] mx-auto pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-slate-800 pb-10">
        <div>
          <h1 className="text-6xl font-black flex items-center gap-6 text-white tracking-tighter uppercase italic font-serif">
            <Network className="text-blue-500" size={60} />
            Network Graph
          </h1>
          <p className="text-slate-400 mt-4 font-medium flex items-center gap-3">
            <Users size={18} className="text-emerald-500" />
            Institutional & Individual Mapping — <span className="text-blue-400 font-black uppercase text-[10px] tracking-[0.3em] bg-blue-400/10 px-4 py-1.5 rounded-full shadow-xl">Handshake Analytics</span>
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsBuildingLink(true)}
            className="px-8 py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl flex items-center gap-3 hover:-translate-y-1 transition-all"
          >
            <GitBranch size={16} /> Construct Relation
          </button>
          <div className="flex bg-slate-900 border border-slate-800 rounded-2xl p-1.5 ring-1 ring-slate-700">
             <button onClick={() => setViewMode('RELATIONSHIP')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${viewMode === 'RELATIONSHIP' ? 'bg-emerald-600 text-white shadow-xl' : 'text-slate-500 hover:text-white'}`}>Verified</button>
             <button onClick={() => setViewMode('SIGNAL')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${viewMode === 'SIGNAL' ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-500 hover:text-white'}`}>Signal Layer</button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {[
          { label: 'GPs', type: 'GP', icon: Landmark, color: 'orange' },
          { label: 'LPs', type: 'LP', icon: Briefcase, color: 'purple' },
          { label: 'Funds', type: 'Fund', icon: Globe, color: 'blue' },
          { label: 'Portfolios', type: 'PortCo', icon: Activity, color: 'rose' },
          { label: 'Service Providers', type: 'Service Provider', icon: Box, color: 'amber' },
          { label: 'People (Contacts)', type: 'Contact', icon: UserRound, color: 'emerald' },
        ].map(filter => (
          <button
            key={filter.type}
            onClick={() => toggleFilter(filter.type)}
            className={`flex items-center gap-3 px-6 py-3 rounded-2xl border transition-all text-[10px] font-black uppercase tracking-widest ${
              activeFilters.has(filter.type) 
                ? `bg-${filter.color}-500/10 border-${filter.color}-500/50 text-${filter.color}-400` 
                : 'bg-slate-900 border-slate-800 text-slate-500 opacity-40 grayscale'
            }`}
          >
            <filter.icon size={14} /> {filter.label}
          </button>
        ))}
        <div className="flex-1"></div>
        <div className="relative group max-w-xs w-full">
           <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-400" size={18} />
           <input 
             type="text" 
             placeholder="Search graph nodes..." 
             className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-14 pr-6 py-3 text-xs text-white outline-none focus:ring-2 focus:ring-blue-500/30 font-serif italic"
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
           />
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-10 min-h-[700px]">
        <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-[3rem] relative overflow-hidden flex flex-col shadow-3xl">
          {loading && (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-sm">
               <Loader2 className="animate-spin text-blue-500 mb-4" size={48} />
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Simulating Gravity...</span>
            </div>
          )}
          <div className="flex-1 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:40px_40px]">
            <svg ref={svgRef} className="w-full h-full cursor-move"></svg>
          </div>
          <div className="p-8 border-t border-slate-800 bg-slate-950/40 flex justify-between items-center text-[10px] font-mono text-slate-700 uppercase tracking-widest">
            <span>NODES: {filteredData.nodes.length} // EDGES: {filteredData.links.length}</span>
            <span className="italic">Mapping institutional & individual handshake density...</span>
          </div>
        </div>

        <div className="space-y-8 h-full flex flex-col">
          <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-10 shadow-3xl flex-1 flex flex-col overflow-hidden relative">
            {selectedNode ? (
              <div className="flex flex-col h-full animate-in slide-in-from-right">
                 <div className="space-y-6 mb-10 border-b border-slate-800 pb-10">
                    <div className="w-20 h-20 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-4xl text-blue-400 italic font-serif uppercase">
                      {selectedNode.name[0]}
                    </div>
                    <h3 className="text-3xl font-black text-white italic font-serif leading-tight">{selectedNode.name}</h3>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-[9px] font-black px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg uppercase tracking-widest">{selectedNode.type}</span>
                      <span className="text-[9px] font-black px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg uppercase tracking-widest">ACTIVE_NODE</span>
                    </div>
                 </div>
                 <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 space-y-8">
                    <section>
                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2"><Link2 size={14} className="text-blue-500" /> Relationship Edges</h4>
                      <div className="flex flex-col gap-3">
                        {filteredData.links
                          .filter(l => (l.source as any).id === selectedNodeId || (l.target as any).id === selectedNodeId)
                          .map((l, i) => {
                             const target = (l.source as any).id === selectedNodeId ? (l.target as any) : (l.source as any);
                             return (
                               <div key={i} className="flex items-center justify-between p-4 bg-slate-800/30 rounded-2xl border border-slate-800/50 hover:border-blue-500/30 transition-all">
                                  <div className="flex items-center gap-4">
                                     <div className="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center font-black text-slate-500 uppercase italic font-serif">{target.name[0]}</div>
                                     <div>
                                        <p className="text-[11px] font-black text-white leading-none uppercase tracking-tight">{target.name}</p>
                                        <p className="text-[9px] font-bold text-blue-500 uppercase mt-1.5 italic">{l.type}</p>
                                     </div>
                                  </div>
                                  <ArrowRight size={14} className="text-slate-700" />
                               </div>
                             );
                          })}
                        {filteredData.links.filter(l => (l.source as any).id === selectedNodeId || (l.target as any).id === selectedNodeId).length === 0 && (
                          <div className="p-10 text-center border-2 border-dashed border-slate-800 rounded-3xl opacity-40">
                             <CircleAlert size={24} className="mx-auto mb-3" />
                             <p className="text-[10px] font-black uppercase tracking-widest">No verified relations</p>
                          </div>
                        )}
                      </div>
                    </section>
                 </div>
              </div>
            ) : (
              <div className="flex flex-col h-full items-center justify-center text-center space-y-6">
                <div className="p-6 bg-blue-600/10 rounded-3xl text-blue-500 shadow-inner">
                   <Info size={40} />
                </div>
                <div>
                   <h3 className="text-xl font-black text-white italic font-serif uppercase tracking-tight">Handshake Intelligence</h3>
                   <p className="text-sm text-slate-500 italic mt-3 leading-relaxed">Select any firm or individual in the graph to inspect verified relationships and institutional gravity.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {isBuildingLink && (
        <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-10 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-16 max-w-4xl w-full shadow-3xl relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-2 bg-blue-600"></div>
             <button onClick={() => setIsBuildingLink(false)} className="absolute top-10 right-10 text-slate-500 hover:text-white transition-all"><X size={32} /></button>
             <h2 className="text-4xl font-black text-white italic font-serif uppercase tracking-tight mb-12 flex items-center gap-6"><GitBranch className="text-blue-500" size={40} /> Construct Relationship Edge</h2>
             <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-12">
                <div className="space-y-4">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Source Node</label>
                   <input type="text" placeholder="Search registry..." className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-5 text-white font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all italic" value={searchSource} onChange={(e) => setSearchSource(e.target.value)} />
                   <div className="space-y-1 mt-4 max-h-32 overflow-y-auto custom-scrollbar">
                     {sourceSuggestions.map(e => <button key={e.id} onClick={() => { setNewLink({...newLink, sourceId: e.id}); setSearchSource(e.name); }} className={`w-full p-3 text-left text-[11px] font-black uppercase rounded-xl transition-all ${newLink.sourceId === e.id ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-900 border border-slate-800 text-slate-500 hover:text-white'}`}>{e.name}</button>)}
                   </div>
                </div>
                <div className="flex flex-col items-center gap-4">
                   <span className="text-center italic text-slate-600 uppercase text-[9px] font-black tracking-[0.3em]">Relationship Type</span>
                   <select 
                     value={newLink.type}
                     onChange={(e) => setNewLink({...newLink, type: e.target.value})}
                     className="bg-slate-950 border border-slate-800 text-blue-500 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer appearance-none text-center min-w-full"
                   >
                     {RELATIONSHIP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                   </select>
                   <ArrowRight size={20} className="text-blue-500 animate-pulse" />
                </div>
                <div className="space-y-4">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Target Node</label>
                   <input type="text" placeholder="Search registry..." className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-5 text-white font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all italic" value={searchTarget} onChange={(e) => setSearchTarget(e.target.value)} />
                   <div className="space-y-1 mt-4 max-h-32 overflow-y-auto custom-scrollbar">
                     {targetSuggestions.map(e => <button key={e.id} onClick={() => { setNewLink({...newLink, targetId: e.id}); setSearchTarget(e.name); }} className={`w-full p-3 text-left text-[11px] font-black uppercase rounded-xl transition-all ${newLink.targetId === e.id ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-900 border border-slate-800 text-slate-500 hover:text-white'}`}>{e.name}</button>)}
                   </div>
                </div>
             </div>
             <button 
               onClick={handleAddLink} 
               disabled={!newLink.sourceId || !newLink.targetId || loading} 
               className="w-full mt-16 py-8 bg-emerald-600 text-white rounded-[2rem] font-black uppercase text-base tracking-[0.3em] shadow-2xl shadow-emerald-600/30 hover:bg-emerald-500 transition-all flex items-center justify-center gap-6 active:scale-95 disabled:opacity-30"
             >
                {loading ? <Loader2 className="animate-spin" size={24} /> : <>Commit Handshake <CircleCheck size={24} /></>}
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactGraph;
