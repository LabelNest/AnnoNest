
import React, { useState, useEffect, useContext, useMemo } from 'react';
import { Database, Search, Download, Filter, Activity, Users, Globe, Briefcase, Landmark, MoreHorizontal, ShieldCheck, RefreshCw, Layers, Clock, X, ExternalLink, Shield, History, Save, Tag, Box, TrendingUp, DollarSign, MapPin, CircleAlert, Plus, ChevronDown, Check, Gauge, Target, Info, Flame, LifeBuoy, Loader2, Sparkles, Cpu, Handshake, Newspaper, GitMerge, FileText, CircleCheck, UserRound } from 'lucide-react';
import { EntityType, Entity, Project, UserProfile, LocationRecord, LocationRole, EntityLocationMap, ConfidenceScore, NewsArticle, EntityAuditLog } from '../types';
import { supabaseService } from '../services/supabaseService';
import { GeoContext } from '../App';

interface Props {
  userProfile: UserProfile;
  entities: Entity[];
}

const ConfidenceBadge: React.FC<{ score?: ConfidenceScore }> = ({ score }) => {
  if (!score) return (
    <div className="flex items-center gap-2 text-[9px] font-black text-slate-600 uppercase tracking-widest bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">
       <Gauge size={12} className="text-slate-700" /> Unverified
    </div>
  );

  const percent = (score.score * 100).toFixed(0);
  const colorClass = score.score > 0.9 ? 'text-amber-400 border-amber-400/20 bg-amber-400/10' :
                    score.score > 0.7 ? 'text-emerald-400 border-emerald-400/20 bg-emerald-400/10' :
                    score.score > 0.4 ? 'text-blue-400 border-blue-400/20 bg-blue-400/10' :
                    'text-rose-400 border-rose-400/20 bg-rose-400/10';

  return (
    <div className={`flex items-center gap-2 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border shadow-sm ${colorClass}`}>
       <Gauge size={12} /> {percent}% Conf.
    </div>
  );
};

const MultiLocationPicker: React.FC<{
  label: string;
  role: LocationRole;
  selectedIds: string[];
  allLocations: LocationRecord[];
  type: 'country' | 'state' | 'city';
  onToggle: (id: string) => void;
  isEditing: boolean;
}> = ({ label, role, selectedIds, allLocations, type, onToggle, isEditing }) => {
  const [isOpen, setIsOpen] = useState(false);
  const filteredLocations = useMemo(() => Array.isArray(allLocations) ? allLocations.filter(l => l?.type === type) : [], [allLocations, type]);
  const selectedNames = useMemo(() => 
    selectedIds?.map(id => allLocations?.find(l => l?.id === id)?.name).filter(Boolean) || [],
    [selectedIds, allLocations]
  );

  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block mb-2 flex items-center gap-2">
        <Globe size={12} className="text-blue-500" /> {label} ({type}s)
      </label>
      <div className="relative">
        <div 
          onClick={() => isEditing && setIsOpen(!isOpen)}
          className={`w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 min-h-[50px] flex flex-wrap gap-2 items-center cursor-pointer transition-all ${isEditing ? 'hover:border-blue-500/50' : 'cursor-default opacity-80'}`}
        >
          {selectedNames.length === 0 && <span className="text-xs text-slate-600 italic">No selections</span>}
          {selectedNames.map(name => (
            <span key={name} className="px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded-md text-[10px] font-black text-blue-400 uppercase tracking-tighter flex items-center gap-1">
              {name} {isEditing && <X size={10} onClick={(e) => { e.stopPropagation(); onToggle(allLocations?.find(l => l?.name === name)?.id!); }} />}
            </span>
          ))}
          {isEditing && <ChevronDown size={14} className="ml-auto text-slate-600" />}
        </div>

        {isOpen && isEditing && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
            <div className="absolute top-full mt-2 left-0 w-full max-h-60 overflow-y-auto bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 p-2 custom-scrollbar">
              {filteredLocations.map(l => (
                <button
                  key={l.id}
                  onClick={() => onToggle(l.id)}
                  className={`w-full px-4 py-2.5 rounded-lg text-left text-xs font-bold transition-all flex items-center justify-between group ${selectedIds?.includes(l.id) ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                >
                  {l.name}
                  {selectedIds?.includes(l.id) && <Check size={14} />}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const DataNest: React.FC<Props> = ({ userProfile, entities: initialEntities }) => {
  const [entities, setEntities] = useState<Entity[]>(initialEntities || []);
  const [filter, setFilter] = useState('');
  const [activeType, setActiveType] = useState<EntityType | 'ALL'>('ALL');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Entity>>({});
  const [showCreateDropdown, setShowCreateDropdown] = useState(false);
  
  const [drawerTab, setDrawerTab] = useState<'ATTRIBUTES' | 'PULSE'>('ATTRIBUTES');
  const [trailLoading, setTrailLoading] = useState(false);
  const [intelTrail, setIntelTrail] = useState<{ signals: NewsArticle[], audit: EntityAuditLog[] }>({ signals: [], audit: [] });
  
  const { locations } = useContext(GeoContext);

  useEffect(() => {
    if (initialEntities && Array.isArray(initialEntities)) {
      setEntities(initialEntities);
    }
  }, [initialEntities]);

  const loadRegistryData = async () => {
    setLoading(true);
    try {
      const [e, p] = await Promise.all([
        supabaseService.fetchEntities(userProfile.tenant_id, userProfile.role),
        supabaseService.fetchProjects(userProfile.user_id || 'SYSTEM', userProfile.tenant_id, userProfile.role)
      ]);
      setEntities(Array.isArray(e) ? e : []);
      setProjects(Array.isArray(p) ? p : []);
    } catch (error) {
      console.error("Registry Sync Failure", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialEntities || initialEntities.length === 0) {
      loadRegistryData();
    }
  }, []);

  const filtered = useMemo(() => {
    if (!Array.isArray(entities)) return [];
    return entities.filter(e => {
      if (!e) return false;
      const searchString = `${e.name || ''} ${e.type || ''} ${e.status || ''}`.toLowerCase();
      const matchesFilter = searchString.includes(filter.toLowerCase());
      const matchesType = activeType === 'ALL' || e.type === activeType;
      return matchesFilter && matchesType;
    });
  }, [entities, filter, activeType]);

  const liveCount = useMemo(() => Array.isArray(entities) ? entities.filter(e => e?.source !== 'ai').length : 0, [entities]);

  const getLocationPath = (entity: Entity | Partial<Entity>) => {
    if (!entity || !Array.isArray(locations)) return 'unknown_location';
    const get = (id?: string) => locations.find(l => l?.id === id)?.name;
    const city = get(entity.city_id);
    const state = get(entity.state_id);
    const country = get(entity.country_id);
    const parts = [city, state, country].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'unknown_location';
  };

  const handleEntityClick = async (entity: Entity) => {
    if (loading || !entity) return;
    setLoading(true);
    setDrawerTab('ATTRIBUTES');
    try {
      const coverage = await supabaseService.fetchEntityCoverage(entity.id, entity.type);
      const fullEntity = { ...entity, coverage: Array.isArray(coverage) ? coverage : [] };
      setSelectedEntity(fullEntity);
      setEditForm({ ...fullEntity });
      setIsEditing(false);
      
      setTrailLoading(true);
      const trail = await supabaseService.fetchEntityIntelligenceTrail(entity.id);
      setIntelTrail(trail || { signals: [], audit: [] });
      setTrailLoading(false);
    } catch {
      setSelectedEntity(entity);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = (type: EntityType) => {
    const newEntity: Partial<Entity> = {
      id: `NEW-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
      name: '',
      type: type,
      tenant_id: userProfile.tenant_id || 'LABELNEST',
      status: 'Pending',
      details: {},
      tags: [type, 'NEW_RECORD'],
      project_id: projects[0]?.id || '',
      coverage: [],
      source: 'manual'
    };
    setSelectedEntity(newEntity as Entity);
    setEditForm(newEntity);
    setIsEditing(true);
    setShowCreateDropdown(false);
    setIntelTrail({ signals: [], audit: [] });
  };

  const handleSaveUpdate = async () => {
    if (!editForm.name || !editForm.type) return;
    setLoading(true);
    try {
      const updatedEntity = editForm as Entity;
      const res = await supabaseService.upsertEntity(updatedEntity, userProfile.user_id || 'SYSTEM');
      if (res.success) {
        setSelectedEntity(updatedEntity);
        setIsEditing(false);
        loadRegistryData();
      } else {
        alert("Persistence Failure: " + res.error);
      }
    } catch (e) {
      console.error("Failed to update entity", e);
    } finally {
      setLoading(false);
    }
  };

  const handleDetailChange = (key: string, value: any) => {
    setEditForm(prev => ({
      ...prev,
      details: {
        ...prev.details,
        [key]: value
      }
    }));
  };

  const handleToggleCoverage = (locationId: string, role: LocationRole) => {
    setEditForm(prev => {
      const current = prev.coverage || [];
      const exists = current.some(c => c.location_id === locationId && c.role === role);
      const next = exists 
        ? current.filter(c => !(c.location_id === locationId && c.role === role))
        : [...current, { entity_type: prev.type!, entity_id: prev.id!, location_id: locationId, role }];
      return { ...prev, coverage: next };
    });
  };

  const TypeBlock = ({ type, label, icon: Icon, color }: { type: EntityType | 'ALL', label: string, icon: any, color: string }) => {
    const count = !Array.isArray(entities) ? 0 : (type === 'ALL' 
      ? entities.length 
      : entities.filter(e => e?.type === type).length);
    const isActive = activeType === type;
    return (
      <button 
        onClick={() => setActiveType(isActive ? 'ALL' : (type as any))}
        className={`p-6 rounded-[2rem] border transition-all text-left flex flex-col justify-between h-44 group relative overflow-hidden ${
          isActive 
            ? `bg-${color}-500/10 border-${color}-500 shadow-2xl ring-2 ring-${color}-500/20` 
            : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:-translate-y-1'
        }`}
      >
        <div className="flex justify-between items-start w-full">
          <div className={`p-4 rounded-2xl ${isActive ? `bg-${color}-500 text-white` : `bg-slate-800 text-${color}-400 group-hover:bg-${color}-500 group-hover:text-white transition-all shadow-lg`}`}>
            <Icon size={24} />
          </div>
          {isActive && <div className={`w-2.5 h-2.5 rounded-full bg-${color}-500 animate-pulse`}></div>}
        </div>
        <div>
          <h3 className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isActive ? 'text-white' : 'text-slate-500'}`}>{label}</h3>
          <p className="text-3xl font-black text-white">
            {loading && entities.length === 0 ? '...' : count.toLocaleString()}
          </p>
        </div>
      </button>
    );
  };

  const renderGeographySelectors = () => {
    if (!Array.isArray(locations)) return null;
    const countries = locations.filter(l => l?.type === 'country');
    const states = locations.filter(l => l?.type === 'state' && l?.parent_id === editForm.country_id);
    const cities = locations.filter(l => l?.type === 'city' && l?.parent_id === editForm.state_id);

    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block mb-2 flex items-center gap-2">
              <Globe size={12} className="text-blue-500" /> Country
            </label>
            <select
              disabled={!isEditing}
              value={editForm.country_id || ''}
              onChange={(e) => setEditForm({...editForm, country_id: e.target.value, state_id: undefined, city_id: undefined})}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500 shadow-inner appearance-none cursor-pointer"
            >
              <option value="">-- Select --</option>
              {countries.map(l => (
                <option key={l.id} value={l.id} className="bg-slate-900">{l.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block mb-2 flex items-center gap-2">
              <Globe size={12} className="text-blue-500" /> State
            </label>
            <select
              disabled={!isEditing || !editForm.country_id}
              value={editForm.state_id || ''}
              onChange={(e) => setEditForm({...editForm, state_id: e.target.value, city_id: undefined})}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500 shadow-inner appearance-none cursor-pointer disabled:opacity-30"
            >
              <option value="">-- Select --</option>
              {states.map(l => (
                <option key={l.id} value={l.id} className="bg-slate-900">{l.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block mb-2 flex items-center gap-2">
              <Globe size={12} className="text-blue-500" /> City
            </label>
            <select
              disabled={!isEditing || !editForm.state_id}
              value={editForm.city_id || ''}
              onChange={(e) => setEditForm({...editForm, city_id: e.target.value})}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500 shadow-inner appearance-none cursor-pointer disabled:opacity-30"
            >
              <option value="">-- Select --</option>
              {cities.map(l => (
                <option key={l.id} value={l.id} className="bg-slate-900">{l.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800 space-y-6">
          <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2"><MapPin size={14} className="text-emerald-500" /> Coverage</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <MultiLocationPicker 
              label="Operating In"
              type="country"
              role="operating"
              isEditing={isEditing}
              allLocations={locations}
              selectedIds={editForm.coverage?.filter(c => c.role === 'operating').map(c => c.location_id) || []}
              onToggle={(id) => handleToggleCoverage(id, 'operating')}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderSpecializedFields = () => {
    if (!editForm.type || !editForm.details) return null;
    const fields: { key: string, label: string, icon: any, type: 'text' | 'number' }[] = [];
    
    if (editForm.type === EntityType.GP) {
      fields.push(
        { key: 'aum', label: 'Assets Under Management', icon: DollarSign, type: 'text' },
        { key: 'investment_strategy', label: 'Primary Strategy', icon: TrendingUp, type: 'text' }
      );
    } else if (editForm.type === EntityType.LP) {
      fields.push(
        { key: 'lp_type', label: 'LP Category', icon: Tag, type: 'text' },
        { key: 'allocation_range', label: 'Typical Allocation', icon: DollarSign, type: 'text' }
      );
    } else if (editForm.type === EntityType.PORTCO) {
      fields.push(
        { key: 'sector', label: 'Industry Vertical', icon: Globe, type: 'text' },
        { key: 'funding_stage', label: 'Current Maturity Stage', icon: Activity, type: 'text' },
        { key: 'valuation', label: 'Last Institutional Valuation', icon: DollarSign, type: 'text' },
        { key: 'burn_rate', label: 'Net Monthly Burn', icon: Flame, type: 'text' },
        { key: 'runway', label: 'Cash Runway (Months)', icon: LifeBuoy, type: 'number' }
      );
    } else if (editForm.type === EntityType.FUND) {
      fields.push(
        { key: 'target_size', label: 'Target Fund Size', icon: Target, type: 'text' },
        { key: 'vintage_year', icon: Clock, label: 'Vintage Year', type: 'text' }
      );
    } else if (editForm.type === EntityType.DEAL) {
      fields.push(
        { key: 'deal_size', label: 'Total Transaction Volume', icon: DollarSign, type: 'text' },
        { key: 'deal_type', label: 'Deal Classification', icon: Activity, type: 'text' },
        { key: 'closing_date', label: 'Estimated Closing', icon: Clock, type: 'text' }
      );
    }
    
    const internalKeys = ['id', 'created_at', 'updated_at', 'project_id', 'status', 'gp_name', 'lp_name', 'fund_name', 'company_name', 'contact_name', 'provider_name', 'deal_name', 'tenant_id', 'city_id', 'state_id', 'country_id'];
    const categorizedKeys = fields.map(f => f.key);
    const remainingKeys = Object.keys(editForm.details).filter(k => 
      !categorizedKeys.includes(k) && !internalKeys.includes(k)
    );

    return (
      <div className="space-y-8">
        {renderGeographySelectors()}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {fields.map(field => (
            <div key={field.key} className="col-span-1">
              <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block mb-2 flex items-center gap-2">
                <field.icon size={12} className="text-blue-500" /> {field.label}
              </label>
              <input 
                disabled={!isEditing}
                type={field.type}
                value={editForm.details?.[field.key] || ''}
                onChange={(e) => handleDetailChange(field.key, e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500 shadow-inner"
              />
            </div>
          ))}
        </div>
        {remainingKeys.length > 0 && (
          <div className="pt-6 border-t border-slate-800">
            <h5 className="text-[9px] font-black text-slate-700 uppercase tracking-[0.2em] mb-4">Metadata</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {remainingKeys.map(key => (
                <div key={key}>
                  <label className="text-[9px] font-bold text-slate-600 uppercase block mb-1">{key.replace(/_/g, ' ')}</label>
                  <input 
                    disabled={!isEditing}
                    type="text"
                    value={editForm.details?.[key] || ''}
                    onChange={(e) => handleDetailChange(key, e.target.value)}
                    className="w-full bg-slate-900/50 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 outline-none"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 max-w-[1600px] mx-auto pb-20 relative">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-800 pb-10">
        <div>
          <h1 className="text-5xl font-black flex items-center gap-6 text-white tracking-tighter uppercase italic">
            <Database className="text-emerald-500" size={54} />
            DataNest
          </h1>
          <div className="flex items-center gap-6 mt-4">
            <p className="text-slate-400 font-medium flex items-center gap-3">
              <ShieldCheck size={18} className="text-emerald-500" />
              Institutional Registry — <span className="text-emerald-500 font-black uppercase text-xs tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full italic shadow-xl">Master Nodes</span>
            </p>
          </div>
        </div>
        <div className="flex gap-4">
          <button onClick={loadRegistryData} className={`p-4 bg-slate-900 border border-slate-800 text-slate-400 rounded-2xl hover:text-white transition-all shadow-xl ${loading ? 'animate-spin' : ''}`}>
            <RefreshCw size={24} />
          </button>
          
          <div className="relative">
            <button 
              onClick={() => setShowCreateDropdown(!showCreateDropdown)}
              className="px-10 py-4 bg-blue-600 text-white rounded-[1.5rem] hover:bg-blue-500 transition-all flex items-center gap-4 text-sm font-black shadow-2xl uppercase tracking-widest"
            >
              <Plus size={20} /> New Profile
              <ChevronDown size={18} className={`transition-transform ${showCreateDropdown ? 'rotate-180' : ''}`} />
            </button>
            {showCreateDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowCreateDropdown(false)}></div>
                <div className="absolute top-full mt-4 right-0 w-72 bg-slate-900 border border-slate-800 rounded-[2rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden z-50 py-3 animate-in zoom-in-95 duration-200">
                  <div className="px-6 py-2 border-b border-slate-800 mb-2">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Select Class</span>
                  </div>
                  {Object.values(EntityType).map(type => (
                    <button 
                      key={type}
                      onClick={() => handleCreateNew(type)}
                      className="w-full px-8 py-4 text-left text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        <TypeBlock type={EntityType.GP} label="GP Registry" icon={Landmark} color="orange" />
        <TypeBlock type={EntityType.LP} label="LP Registry" icon={Briefcase} color="purple" />
        <TypeBlock type={EntityType.FUND} label="Funds" icon={Globe} color="blue" />
        <TypeBlock type={EntityType.PORTCO} label="Portfolios" icon={Activity} color="rose" />
        <TypeBlock type={EntityType.SERVICE_PROVIDER} label="Providers" icon={Box} color="amber" />
        <TypeBlock type={EntityType.DEAL} label="Deals" icon={Handshake} color="indigo" />
        <TypeBlock type={EntityType.CONTACT} label="Contacts" icon={UserRound} color="emerald" />
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-[3.5rem] overflow-hidden shadow-2xl relative min-h-[400px]">
        {loading && (
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm z-10 flex flex-col items-center justify-center gap-6">
             <Loader2 className="text-emerald-500 animate-spin" size={48} />
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Querying Registry...</span>
          </div>
        )}
        <div className="p-10 border-b border-slate-800 bg-slate-900/50 flex flex-col lg:flex-row gap-10 items-center justify-between">
          <div className="relative flex-1 max-w-3xl group">
            <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors" size={28} />
            <input 
              type="text" 
              placeholder={`Search registry records...`} 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-[2.5rem] pl-20 pr-10 py-6 text-xl text-slate-100 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all font-serif italic"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/30">
                <th className="px-12 py-8 text-[11px] font-black text-slate-500 uppercase tracking-[0.3em]">Identity Profile</th>
                <th className="px-12 py-8 text-[11px] font-black text-slate-500 uppercase tracking-[0.3em]">Geography</th>
                <th className="px-12 py-8 text-[11px] font-black text-slate-500 uppercase tracking-[0.3em]">Integrity Rank</th>
                <th className="px-12 py-8 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {filtered.map((entity) => {
                const geoPath = getLocationPath(entity);
                return (
                  <tr key={entity.id} onClick={() => handleEntityClick(entity)} className="hover:bg-slate-800/30 transition-all group border-l-[6px] border-transparent hover:border-emerald-500 cursor-pointer">
                    <td className="px-12 py-9">
                      <div className="flex items-center gap-8">
                        <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-3xl text-slate-400 group-hover:bg-emerald-600 group-hover:text-white shadow-xl uppercase italic font-serif">
                          {entity.name?.[0] || '?'}
                        </div>
                        <div>
                          <span className="font-black text-2xl text-white group-hover:text-emerald-400 leading-tight font-serif italic">{entity.name || 'Unnamed Record'}</span>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[9px] px-3 py-1 rounded-lg font-black uppercase border border-slate-800 text-slate-500 tracking-widest block w-fit">{entity.type}</span>
                            {entity.source === 'ai' && <span className="text-[8px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20 font-black uppercase">AI Match</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-12 py-9">
                      <div className={`flex items-center gap-2 text-xs font-bold ${geoPath === 'unknown_location' ? 'text-rose-500 italic' : 'text-slate-300'}`}>
                        <MapPin size={14} className={geoPath !== 'unknown_location' ? 'text-emerald-400' : 'text-rose-600'} /> 
                        {geoPath}
                      </div>
                    </td>
                    <td className="px-12 py-9">
                       <ConfidenceBadge score={entity.confidence} />
                    </td>
                    <td className="px-12 py-9 text-right">
                      <button className="p-5 text-slate-600 hover:text-white hover:bg-slate-800 rounded-[1.5rem] transition-all">
                        <MoreHorizontal size={28} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selectedEntity && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/80 backdrop-blur-sm animate-in fade-in" onClick={() => setSelectedEntity(null)}>
          <div 
            className="h-full w-full max-w-4xl bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-500"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  <Database size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight italic font-serif">Registry Node</h3>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">ID: {selectedEntity.id}</p>
                </div>
              </div>
              <button onClick={() => setSelectedEntity(null)} className="p-3 text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl transition-all"><X size={24} /></button>
            </div>

            <div className="flex bg-slate-950 border-b border-slate-800 p-2">
               <button onClick={() => setDrawerTab('ATTRIBUTES')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest rounded-xl ${drawerTab === 'ATTRIBUTES' ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-500 hover:text-white'}`}>Matrix</button>
               <button onClick={() => setDrawerTab('PULSE')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 ${drawerTab === 'PULSE' ? 'bg-emerald-600 text-white shadow-xl' : 'text-slate-500 hover:text-white'}`}>Intelligence</button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-12 custom-scrollbar">
              {drawerTab === 'ATTRIBUTES' ? (
                <>
                  <div className="bg-slate-950 border border-slate-800 rounded-[3.5rem] p-10 relative overflow-hidden shadow-2xl">
                    <div className="flex items-center gap-10">
                      <div className="w-24 h-24 rounded-[2.5rem] bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-5xl text-slate-500 italic font-serif">
                        {editForm.name?.[0] || '?'}
                      </div>
                      <div className="space-y-3 flex-1">
                        {isEditing ? (
                          <input className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 w-full text-2xl font-black text-white outline-none focus:ring-2 focus:ring-emerald-500 italic font-serif" value={editForm.name || ''} onChange={(e) => setEditForm({...editForm, name: e.target.value})} />
                        ) : (
                          <h2 className="text-4xl font-black text-white italic font-serif leading-tight">{selectedEntity.name || 'Unnamed Record'}</h2>
                        )}
                        <span className="text-[10px] font-black px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg uppercase tracking-widest w-fit block">{selectedEntity.type}</span>
                      </div>
                    </div>
                  </div>

                  <section className="space-y-8">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                       <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Tag size={14} className="text-emerald-500" /> Specialist Attributes</h4>
                       <button onClick={() => setIsEditing(!isEditing)} className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all ${isEditing ? 'bg-rose-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white'}`}>
                         {isEditing ? 'Abort' : 'Edit'}
                       </button>
                    </div>
                    {renderSpecializedFields()}
                  </section>
                </>
              ) : (
                <div className="space-y-12 animate-in slide-in-from-right-4 duration-300">
                   <section className="space-y-6">
                      <h4 className="text-[11px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-3 border-b border-slate-800 pb-5">
                         <Newspaper size={18} /> Verified Signals
                      </h4>
                      {trailLoading ? (
                        <div className="py-20 flex flex-col items-center justify-center gap-4 text-slate-600">
                           <Loader2 className="animate-spin" size={32} />
                        </div>
                      ) : intelTrail?.signals?.length === 0 ? (
                        <div className="p-10 text-center bg-slate-950 border border-slate-800 rounded-3xl opacity-50 italic">No news signals linked.</div>
                      ) : (
                        <div className="space-y-4">
                           {intelTrail?.signals?.map(s => (
                             <div key={s.id} className="p-6 bg-slate-950 border border-slate-800 rounded-2xl hover:border-emerald-500/50 transition-all">
                                <div className="flex justify-between items-start mb-3">
                                   <span className="text-[9px] font-black text-emerald-500 uppercase">{s.source_name}</span>
                                   <span className="text-[9px] font-mono text-slate-600">{s.publish_date ? new Date(s.publish_date).toLocaleDateString() : 'N/A'}</span>
                                </div>
                                <p className="text-lg font-black text-white italic font-serif leading-none">{s.headline}</p>
                             </div>
                           ))}
                        </div>
                      )}
                   </section>
                </div>
              )}
            </div>

            {isEditing && (
              <div className="p-10 bg-slate-900 border-t border-slate-800 flex justify-end gap-6 shadow-2xl">
                <button onClick={handleSaveUpdate} disabled={!editForm.name || loading} className="px-14 py-5 bg-emerald-600 text-white rounded-[1.5rem] font-black uppercase text-sm tracking-widest shadow-2xl flex items-center gap-4 active:scale-95 transition-all">
                  {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />} Commit Changes
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DataNest;
