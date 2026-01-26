
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { 
  Network, Search, Target, Zap, Landmark, 
  Activity, Filter, Layers, X, Info, ExternalLink, 
  ChevronRight, ShieldCheck, Globe, Clock, 
  GitBranch, ArrowRight, Loader2, CircleCheck, 
  ZoomIn, ZoomOut, Focus, Compass, GitMerge, Fingerprint, Eye, 
  AlertTriangle, History, Users, Briefcase, Database, Share2,
  RefreshCw, LayoutList, GitFork, TreePine, Building2, Coins,
  UserCheck, Box, ArrowUpRight, ChevronDown, ListTree, Share
} from 'lucide-react';
import { 
  select, 
  zoom as d3Zoom, 
  zoomIdentity, 
  forceSimulation, 
  forceLink, 
  forceManyBody, 
  forceCenter, 
  forceCollide, 
  drag as d3Drag,
  SimulationNodeDatum,
  SimulationLinkDatum,
  tree as d3Tree,
  hierarchy as d3Hierarchy
} from 'd3';
import { EntityType, Entity, UserProfile } from '../types';
import { supabaseService } from '../services/supabaseService';

// --- GRAPH TYPES ---
interface NetworkNode extends SimulationNodeDatum {
  id: string;
  name: string;
  type: string; 
  confidence: number;
  val: number; // For scaling size
  children?: NetworkNode[];
}

interface NetworkLink extends SimulationLinkDatum<NetworkNode> {
  id: string;
  type: string;
  source: any;
  target: any;
  strength: number;
}

const VIEW_MODES = {
  FORCE: 'FORCE_WEB',
  HIERARCHY: 'HIERARCHY_TREE'
} as const;
type ViewMode = typeof VIEW_MODES[keyof typeof VIEW_MODES];

const ContactGraph: React.FC<{ userProfile: UserProfile }> = ({ userProfile }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Data State
  const [entities, setEntities] = useState<any[]>([]);
  const [relationships, setRelationships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // HUD State
  const [activeView, setActiveView] = useState<ViewMode>(VIEW_MODES.FORCE);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [depth, setDepth] = useState<number>(2);
  const [isBuildingLink, setIsBuildingLink] = useState(false);
  
  const loadData = async () => {
    setLoading(true);
    try {
      // Pull global tenant data for the knowledge graph
      const [dbEntities, dbPersons, dbRels] = await Promise.all([
        supabaseService.fetchEntities(userProfile.tenant_id),
        supabaseService.fetchContactRegistry(userProfile.tenant_id),
        supabaseService.fetchEntityRelationships(userProfile.tenant_id)
      ]);
      
      const allNodes = [
        ...dbEntities.map(e => ({ ...e, nodeType: 'ENTITY' })),
        ...dbPersons.map(p => ({ ...p, name: p.full_name, type: 'CONTACT', nodeType: 'CONTACT' }))
      ];
      
      setEntities(allNodes);
      setRelationships(dbRels || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [userProfile.tenant_id]);

  // --- GRAPH DATA PREPARATION (3-LAYER TRAVERSAL) ---
  const graphData = useMemo(() => {
    if (entities.length === 0) return { nodes: [], links: [] };

    let seedNodes = selectedNodeId ? [selectedNodeId] : entities.slice(0, 10).map(e => e.id);
    const visitedNodes = new Set<string>(seedNodes);
    const visibleLinks: any[] = [];
    
    let frontier = seedNodes;
    for (let i = 0; i < depth; i++) {
      const nextFrontier: string[] = [];
      relationships.forEach(rel => {
        const sId = rel.source_id;
        const tId = rel.target_id;

        if (frontier.includes(sId) || frontier.includes(tId)) {
          visibleLinks.push(rel);
          const other = frontier.includes(sId) ? tId : sId;
          if (!visitedNodes.has(other)) {
            visitedNodes.add(other);
            nextFrontier.push(other);
          }
        }
      });
      frontier = nextFrontier;
    }

    const nodes: NetworkNode[] = Array.from(visitedNodes).map(id => {
      const e = entities.find(ent => ent.id === id);
      const connectionCount = visibleLinks.filter(l => l.source_id === id || l.target_id === id).length;
      return {
        id,
        name: e?.name || 'Unknown',
        type: e?.type || 'FIRM',
        confidence: e?.confidence_score || 85,
        val: 10 + (connectionCount * 5)
      };
    });

    const links: NetworkLink[] = visibleLinks.map((l, i) => ({
      id: `link-${i}`,
      source: l.source_id,
      target: l.target_id,
      type: l.relationship_type || 'ASSOCIATED',
      strength: 1
    }));

    return { nodes, links };
  }, [entities, relationships, selectedNodeId, depth]);

  // --- D3 RENDERING ---
  useEffect(() => {
    if (!svgRef.current || loading || graphData.nodes.length === 0) return;

    const width = containerRef.current?.clientWidth || 1200;
    const height = containerRef.current?.clientHeight || 800;
    
    const svg = select(svgRef.current).attr('viewBox', `0 0 ${width} ${height}`);
    svg.selectAll("*").remove();

    const g = svg.append('g');
    const zoom = d3Zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => g.attr('transform', event.transform));
    svg.call(zoom);

    if (activeView === VIEW_MODES.FORCE) {
      renderForceLayout(g, width, height, svg, zoom);
    } else {
      renderHierarchyLayout(g, width, height);
    }

  }, [graphData, loading, activeView]);

  const renderForceLayout = (g: any, width: number, height: number, svg: any, zoom: any) => {
    const simulation = forceSimulation(graphData.nodes as any)
      .force('link', forceLink(graphData.links).id((d: any) => d.id).distance(200))
      .force('charge', forceManyBody().strength(-1500))
      .force('center', forceCenter(width / 2, height / 2))
      .force('collide', forceCollide().radius((d: any) => d.val * 2 + 40));

    const link = g.append('g')
      .selectAll('line')
      .data(graphData.links)
      .enter().append('line')
      .attr('stroke', '#2F6BFF')
      .attr('stroke-width', 2)
      .attr('opacity', 0.4)
      .attr('stroke-dasharray', (d: any) => d.type === 'SIGNAL' ? '5,5' : '0');

    const node = g.append('g')
      .selectAll('g')
      .data(graphData.nodes)
      .enter().append('g')
      .style('cursor', 'pointer')
      .on('click', (event: any, d: any) => setSelectedNodeId(d.id))
      .call(d3Drag<any, any>()
        .on('start', (e, d) => { if (!e.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
        .on('drag', (e, d) => { d.fx = e.x; d.fy = e.y; })
        .on('end', (e, d) => { if (!e.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; }));

    // Dynamic Node Shapes
    node.each(function(d: any) {
        const el = select(this);
        if (d.type === 'GP' || d.type === 'LP') {
            // Hexagon for Firms
            el.append('path')
              .attr('d', `M 0,-${d.val*1.5} L ${d.val*1.3},-${d.val*0.75} L ${d.val*1.3},${d.val*0.75} L 0,${d.val*1.5} L -${d.val*1.3},${d.val*0.75} L -${d.val*1.3},-${d.val*0.75} Z`)
              .attr('fill', '#0E1626')
              .attr('stroke', d.id === selectedNodeId ? '#2F6BFF' : '#1C2A44')
              .attr('stroke-width', 3);
        } else if (d.type === 'Deal') {
            // Diamond for Deals
            el.append('rect')
              .attr('width', d.val * 2)
              .attr('height', d.val * 2)
              .attr('transform', 'rotate(45)')
              .attr('x', -d.val)
              .attr('y', -d.val)
              .attr('fill', '#0E1626')
              .attr('stroke', '#F59E0B')
              .attr('stroke-width', 3);
        } else {
            // Circle for Funds and Contacts
            el.append('circle')
              .attr('r', d.val)
              .attr('fill', '#0E1626')
              .attr('stroke', d.type === 'CONTACT' ? '#E84C88' : '#10B981')
              .attr('stroke-width', 3);
        }
    });

    node.append('text')
      .text((d: any) => d.name)
      .attr('dy', (d: any) => d.val + 20)
      .attr('text-anchor', 'middle')
      .attr('fill', 'white')
      .attr('class', 'text-[10px] font-black uppercase italic tracking-tighter pointer-events-none font-serif');

    simulation.on('tick', () => {
      link.attr('x1', d => (d.source as any).x).attr('y1', d => (d.source as any).y)
          .attr('x2', d => (d.target as any).x).attr('y2', d => (d.target as any).y);
      node.attr('transform', d => `translate(${(d as any).x},${(d as any).y})`);
    });
  };

  const renderHierarchyLayout = (g: any, width: number, height: number) => {
    if (!selectedNodeId) return;
    
    // Convert current graph data to a tree starting from selection
    const buildTree = (nodeId: string, visited = new Set()): any => {
      if (visited.has(nodeId)) return null;
      visited.add(nodeId);
      const node = graphData.nodes.find(n => n.id === nodeId);
      if (!node) return null;
      
      const children = graphData.links
        .filter(l => (typeof l.source === 'string' ? l.source : l.source.id) === nodeId)
        .map(l => buildTree(typeof l.target === 'string' ? l.target : l.target.id, visited))
        .filter(Boolean);
        
      return { ...node, children };
    };

    const rootData = buildTree(selectedNodeId);
    if (!rootData) return;

    const root = d3Hierarchy(rootData);
    const tree = d3Tree().size([height - 200, width - 400]);
    tree(root as any);

    const link = g.append('g')
      .selectAll('path')
      .data(root.links())
      .enter().append('path')
      .attr('d', (d: any) => `M${d.source.y},${d.source.x}C${(d.source.y + d.target.y) / 2},${d.source.x} ${(d.source.y + d.target.y) / 2},${d.target.x} ${d.target.y},${d.target.x}`)
      .attr('fill', 'none')
      .attr('stroke', '#1C2A44')
      .attr('stroke-width', 2);

    const node = g.append('g')
      .selectAll('g')
      .data(root.descendants())
      .enter().append('g')
      .attr('transform', (d: any) => `translate(${d.y},${d.x})`)
      .on('click', (e: any, d: any) => setSelectedNodeId(d.data.id));

    node.append('circle')
      .attr('r', 30)
      .attr('fill', '#0E1626')
      .attr('stroke', (d: any) => d.data.id === selectedNodeId ? '#2F6BFF' : '#1C2A44')
      .attr('stroke-width', 3);

    node.append('text')
      .text((d: any) => d.data.name)
      .attr('dy', 45)
      .attr('text-anchor', 'middle')
      .attr('fill', 'white')
      .attr('class', 'text-[10px] font-black uppercase italic');
  };

  const activeNode = useMemo(() => entities.find(n => n.id === selectedNodeId), [entities, selectedNodeId]);

  return (
    <div className="h-full flex flex-col bg-[#020617] animate-in fade-in duration-700 overflow-hidden">
      
      {/* HUD: NAVIGATION & CONTROL */}
      <header className="h-24 border-b border-slate-800 bg-[#0E1626]/80 backdrop-blur-2xl px-10 flex items-center justify-between shrink-0 z-50">
        <div className="flex items-center gap-10">
           <div className="flex items-center gap-6">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-blue"><Network size={28}/></div>
              <div>
                 <h1 className="text-3xl font-black text-white italic font-serif leading-none tracking-tighter uppercase">Network Graph</h1>
                 <p className="text-[10px] font-black text-accent-primary uppercase tracking-[0.4em] mt-1 italic">3-Layer Traversal Engine</p>
              </div>
           </div>
           <div className="h-10 w-px bg-slate-800"></div>
           <div className="flex bg-slate-900 border border-slate-800 rounded-2xl p-1.5 shadow-inner">
              <button onClick={() => setActiveView(VIEW_MODES.FORCE)} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeView === VIEW_MODES.FORCE ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}><Compass size={14}/> Force Web</button>
              <button onClick={() => setActiveView(VIEW_MODES.HIERARCHY)} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeView === VIEW_MODES.HIERARCHY ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}><ListTree size={14}/> Hierarchy</button>
           </div>
        </div>

        <div className="flex items-center gap-6">
           <div className="flex flex-col gap-1">
              <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest ml-1">Discovery depth</span>
              <div className="flex bg-slate-900 rounded-xl p-1 border border-slate-800">
                 {[1, 2, 3].map(d => (
                   <button key={d} onClick={() => setDepth(d)} className={`px-5 py-1.5 rounded-lg text-[9px] font-black transition-all ${depth === d ? 'bg-accent-primary text-white shadow-blue' : 'text-slate-600 hover:text-white'}`}>{d}L</button>
                 ))}
              </div>
           </div>
           <button onClick={loadData} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-slate-500 hover:text-white transition-all shadow-xl active:scale-95"><RefreshCw size={24} className={loading ? 'animate-spin' : ''}/></button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* GRAPH CANVAS */}
        <main ref={containerRef} className="flex-1 relative bg-[#020617] overflow-hidden">
           {loading && (
             <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-md">
                <Loader2 className="animate-spin text-accent-primary" size={64} />
                <span className="text-[12px] font-black uppercase tracking-[0.6em] animate-pulse mt-6 text-white">Traversing Institutional Vertices...</span>
             </div>
           )}
           <div className="absolute inset-0 bg-[radial-gradient(#1C2A44_1px,transparent_1px)] [background-size:60px_60px] opacity-[0.07]"></div>
           <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing"></svg>
           
           {/* LEGEND HUD */}
           <div className="absolute bottom-10 left-10 p-8 bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-[2.5rem] flex items-center gap-12 shadow-3xl">
              <div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-blue-600"></div><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">GP / Firm</span></div>
              <div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-emerald-600"></div><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fund</span></div>
              <div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-amber-600"></div><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Deal Node</span></div>
              <div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-rose-600"></div><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Personnel</span></div>
           </div>
        </main>

        {/* DETAILS SIDEBAR */}
        <aside className="w-[450px] bg-[#0E1626] border-l border-slate-800 flex flex-col shadow-4xl animate-in slide-in-from-right duration-500 overflow-hidden">
           {activeNode ? (
             <div className="flex flex-col h-full">
                <header className="p-10 border-b border-slate-800 space-y-6 bg-slate-950/20">
                   <div className="flex justify-between items-start">
                      <div className="w-16 h-16 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center text-3xl font-black text-blue-500 italic font-serif shadow-inner">{activeNode.name[0]}</div>
                      <button onClick={() => setSelectedNodeId(null)} className="p-2 text-slate-600 hover:text-white transition-all"><X size={28}/></button>
                   </div>
                   <div>
                      <h3 className="text-3xl font-black text-white italic font-serif uppercase tracking-tight leading-none">{activeNode.name}</h3>
                      <div className="flex items-center gap-4 mt-3">
                         <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] bg-blue-500/10 px-3 py-1 rounded-lg border border-blue-500/20 italic">{activeNode.type || 'Institutional Node'}</span>
                         <span className="text-[10px] font-mono text-slate-600">ID: {activeNode.id.slice(0, 16).toUpperCase()}</span>
                      </div>
                   </div>
                </header>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-12">
                   <section className="grid grid-cols-2 gap-4">
                      <div className="p-6 bg-slate-950 border border-slate-900 rounded-[2rem] shadow-inner">
                         <p className="text-[9px] font-black text-slate-600 uppercase mb-2 italic">Network Degree</p>
                         <p className="text-4xl font-black text-white italic font-serif">{graphData.links.filter(l => l.source === activeNode.id || l.target === activeNode.id).length}</p>
                      </div>
                      <div className="p-6 bg-slate-950 border border-slate-900 rounded-[2rem] shadow-inner">
                         <p className="text-[9px] font-black text-slate-600 uppercase mb-2 italic">Confidence score</p>
                         <p className="text-4xl font-black text-emerald-500 italic font-serif">{activeNode.confidence_score || 85}%</p>
                      </div>
                   </section>

                   <section className="space-y-6">
                      <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] flex items-center gap-3"><Share size={16} className="text-accent-primary"/> Linked Registry Nodes</h4>
                      <div className="space-y-2">
                         {graphData.links.filter(l => l.source === activeNode.id || l.target === activeNode.id).map((l, i) => {
                            const otherId = l.source === activeNode.id || (typeof l.source === 'object' && l.source.id === activeNode.id) 
                                ? (typeof l.target === 'object' ? l.target.id : l.target) 
                                : (typeof l.source === 'object' ? l.source.id : l.source);
                            const other = entities.find(e => e.id === otherId);
                            return (
                               <button key={i} onClick={() => setSelectedNodeId(otherId)} className="w-full p-5 bg-slate-900/40 border border-slate-800 rounded-[2rem] flex items-center justify-between group hover:border-blue-500/40 transition-all text-left">
                                  <div className="flex items-center gap-5">
                                     <div className="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center text-blue-500 shadow-inner italic font-black font-serif group-hover:scale-110 transition-transform">{other?.name?.[0] || 'U'}</div>
                                     <div>
                                        <p className="text-sm font-black text-white italic font-serif uppercase leading-none mb-1 group-hover:text-blue-400 transition-colors">{other?.name || 'Unknown'}</p>
                                        <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">{l.type?.replace('_', ' ') || 'ASSOCIATED'}</p>
                                     </div>
                                  </div>
                                  <ArrowUpRight size={18} className="text-slate-800 group-hover:text-blue-500 transition-all"/>
                               </button>
                            );
                         })}
                      </div>
                   </section>
                </div>

                <footer className="p-10 border-t border-slate-800 bg-slate-950/20">
                   <button onClick={() => setIsBuildingLink(true)} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs tracking-[0.3em] shadow-blue hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-4">
                      Construct Relationship <GitBranch size={20}/>
                   </button>
                </footer>
             </div>
           ) : (
             <div className="flex-1 flex flex-col items-center justify-center p-20 text-center space-y-10 opacity-30">
                <div className="w-32 h-32 bg-slate-900 border border-slate-800 rounded-[3rem] flex items-center justify-center text-slate-700 shadow-inner">
                   <TreePine size={64}/>
                </div>
                <div className="space-y-4 text-white">
                   <h3 className="text-3xl font-black italic font-serif uppercase tracking-tight">Intelligence Matrix</h3>
                   <p className="text-lg text-slate-500 italic font-medium leading-relaxed">Select a focal node in the network field to begin strategic pathfinding and handshake discovery.</p>
                </div>
             </div>
           )}
        </aside>
      </div>

      {/* RELATION CONSTRUCTION MODAL */}
      {isBuildingLink && (
        <div className="fixed inset-0 z-[500] bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center p-10 animate-in zoom-in-95">
           <div className="bg-[#0E1626] border border-slate-800 rounded-[4rem] p-20 max-w-4xl w-full shadow-4xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-blue-600 shadow-blue"></div>
              <button onClick={() => setIsBuildingLink(false)} className="absolute top-12 right-12 text-slate-500 hover:text-white transition-all"><X size={40}/></button>
              
              <div className="mb-16">
                 <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.5em] mb-4">Strategic Constructor</p>
                 <h2 className="text-6xl font-black text-white italic font-serif uppercase tracking-tighter">Construct Relationship</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-12">
                 <div className="space-y-4">
                    <label className="text-[11px] font-black text-slate-600 uppercase tracking-widest ml-1">Source Node</label>
                    <select className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-6 text-white font-bold outline-none focus:ring-4 focus:ring-blue-500/20 transition-all italic font-serif appearance-none">
                       {entities.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </select>
                 </div>
                 <div className="flex flex-col items-center gap-6">
                    <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest italic">Predicate</span>
                    <select className="bg-slate-900 border border-slate-800 text-blue-500 px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl outline-none appearance-none cursor-pointer">
                       <option value="parent_of">Parent Of</option>
                       <option value="invested_in">Invested In</option>
                       <option value="gp_of">GP Of</option>
                       <option value="employed_at">Employed At</option>
                       <option value="co_investor">Co-Investor</option>
                    </select>
                    <div className="h-px w-20 bg-blue-500/20 shadow-blue"></div>
                 </div>
                 <div className="space-y-4">
                    <label className="text-[11px] font-black text-slate-600 uppercase tracking-widest ml-1">Target Node</label>
                    <select className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-6 text-white font-bold outline-none focus:ring-4 focus:ring-blue-500/20 transition-all italic font-serif appearance-none">
                       {entities.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </select>
                 </div>
              </div>

              <button 
                onClick={() => setIsBuildingLink(false)}
                className="w-full mt-12 py-10 bg-blue-600 text-white rounded-[3rem] font-black uppercase text-base tracking-[0.4em] shadow-blue hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-10"
              >
                 Commit Relationship Edge <GitFork size={32}/>
              </button>
           </div>
        </div>
      )}

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

export default ContactGraph;
