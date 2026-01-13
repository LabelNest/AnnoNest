import { createClient } from '@supabase/supabase-js';
import { 
  Entity, AnnotationTask, ExtractionSignal, EntityType, NewsArticle, 
  Project, UserProfile, UserRole, UserPermission, LocationRecord, 
  QAItem, QAResult, ConfidenceScore, QAStatus, UserStatus,
  EntityStatus, TENANT_NAME, EntityLocationMap, EntityAuditLog,
  UserClearance, OutreachTarget, OutreachTemplate, OutreachIdentity
} from '../types';

const SUPABASE_URL = 'https://evugaodpzepyjonlrptn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2dWdhb2RwemVweWpvbmxycHRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NDQwMjYsImV4cCI6MjA4MTAyMDAyNn0.n-ipz8mUvOyTfDOMMc5pjSNmNEKmVg2R5OhTsHU_rYI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Fixed: Using dynamic origin with /access_token suffix as requested to fix redirect issues
const REDIRECT_URL = `${window.location.origin}/access_token`;
const PRIMARY_TENANT_ID = 'b650b699-16be-43bc-9119-0250cea2e44b';

export interface TenantRecord {
  id: string;
  name: string;
  created_at: string;
  status: 'active' | 'suspended';
}

export type Organization = TenantRecord;

const formatError = (err: any): string => {
  if (!err) return "Unknown Error";
  if (typeof err === 'string') return err;
  
  let msg = "Database Protocol Alert";
  if (err.message) {
    msg = err.message;
    if (msg.includes('23505') || msg.includes('duplicate key')) return "Identity Conflict: This record or email already exists in the registry.";
    if (msg.includes('Database error saving new user')) return "Identity Shadow Conflict: A registry profile for this email already exists. Please contact an administrator to clear the pre-registered profile or use 'Forgot Password' if you have already verified your account.";
    if (msg.includes('2BP01') || msg.includes('depends on it')) {
      return "Relational Lock: Other tables depend on this record. Run the Cascading PK-Swap SQL in Diagnostics.";
    }
    if (msg.includes('42P16') || msg.includes('primary key')) {
      return "Schema Lock: Primary key constraint violation. Review Diagnostics script.";
    }
    return msg;
  }
  
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
};

const getBaselinePermissions = (profileId: string, tenantName: string = TENANT_NAME): UserPermission[] => {
  const modules = ['annotations', 'news', 'entities', 'qa', 'extractions', 'outreach', 'news_review', 'extraction_signals'];
  return modules.map(mod => ({
    profile_id: profileId,
    tenant_name: tenantName,
    project_id: 'BASELINE',
    module: mod,
    can_read: true,
    can_write: true 
  }));
};

export const supabaseService = {
  // --- AUTH & IDENTITY ANCHORING ---
  async signIn(email: string, pass: string) {
    return await supabase.auth.signInWithPassword({ email: (email || '').toLowerCase().trim(), password: pass });
  },

  async checkUserExists(email: string): Promise<boolean> {
    if (!email) return false;
    const { data } = await supabase.from('user_profiles').select('id').eq('email', email.toLowerCase().trim()).maybeSingle();
    return !!data;
  },

  async signUp(email: string, pass: string, name: string) {
    const cleanEmail = (email || '').toLowerCase().trim();
    
    const { data: shadowCheck } = await supabase.from('user_profiles').select('id, user_id').eq('email', cleanEmail).maybeSingle();
    
    const { data, error } = await supabase.auth.signUp({ 
      email: cleanEmail, 
      password: pass,
      options: { data: { name }, emailRedirectTo: REDIRECT_URL }
    });

    if (error) {
      if (shadowCheck && error.message.includes('Database error saving new user')) {
        return { data: null, error: new Error("Shadow Identity Conflict: This email is already pre-registered in our registry. Please contact your administrator to 'unlink' the profile so you can create a fresh authentication account.") };
      }
      return { data, error: new Error(formatError(error)) };
    }

    if (!error && data.user) {
      await this.createManualClearance(data.user.id, cleanEmail, name);
    }
    return { data, error };
  },

  async createManualClearance(userId: string | null, email: string, name: string) {
    try {
      const cleanEmail = (email || '').toLowerCase().trim();
      const { data: existing } = await supabase.from('user_profiles').select('*').eq('email', cleanEmail).maybeSingle();

      const payload: any = { email: cleanEmail, name: name || 'Institutional Researcher', tenant_id: PRIMARY_TENANT_ID };
      if (userId) payload.user_id = userId;

      if (existing) {
        const { data, error } = await supabase.from('user_profiles').update(payload).eq('id', existing.id).select().single();
        return { success: !error, error: formatError(error), data };
      } else {
        const { data, error } = await supabase.from('user_profiles').insert({ ...payload, status: 'pending', role: UserRole.RESEARCHER }).select().single();
        return { success: !error, error: formatError(error), data };
      }
    } catch (e) {
      return { success: false, error: formatError(e) };
    }
  },

  async repairShadowIdentity(email: string, name: string = 'Shadow Identity') {
    return await this.createManualClearance(null, email, name);
  },

  async initializeOwner(userId: string, email: string, name: string) {
    try {
      const { data: existingTenant } = await supabase.from('tenants').select('id').eq('id', PRIMARY_TENANT_ID).maybeSingle();
      if (!existingTenant) await supabase.from('tenants').insert({ id: PRIMARY_TENANT_ID, name: TENANT_NAME });
      
      const cleanEmail = (email || '').toLowerCase().trim();
      const { data: existingProfile } = await supabase.from('user_profiles').select('id').eq('email', cleanEmail).maybeSingle();
      
      const profilePayload = { user_id: userId, email: cleanEmail, name: name || 'System Owner', status: 'active', role: UserRole.SUPER_ADMIN, tenant_id: PRIMARY_TENANT_ID };

      let profile;
      if (existingProfile) {
        const { data } = await supabase.from('user_profiles').update(profilePayload).eq('id', existingProfile.id).select().single();
        profile = data;
      } else {
        const { data } = await supabase.from('user_profiles').insert(profilePayload).select().single();
        profile = data;
      }
      
      if (profile) {
        const baseline = getBaselinePermissions(profile.id, TENANT_NAME);
        for (const perm of baseline) {
            await supabase.from('user_permissions').upsert(perm, { onConflict: 'profile_id,module' });
        }
      }
      return { success: true };
    } catch (e: any) {
      return { success: false, error: formatError(e) };
    }
  },

  async signOut() { return await supabase.auth.signOut(); },

  async getUserProfile(userId: string): Promise<{ profile: UserProfile | null, isPending: boolean, error?: string }> {
    try {
      let { data: profile, error: pError } = await supabase.from('user_profiles').select('*').eq('user_id', userId).maybeSingle();
      
      if (!profile && !pError) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          const cleanEmail = user.email.toLowerCase();
          const { data: shadow } = await supabase.from('user_profiles').select('*').eq('email', cleanEmail).maybeSingle();
          if (shadow) {
            const { data: linked } = await supabase.from('user_profiles').update({ user_id: userId }).eq('id', shadow.id).select().single();
            profile = linked;
          }
        }
      }

      if (profile) {
        if (profile.status === 'pending') return { profile: null, isPending: true };
        const { data: perms } = await supabase.from('user_permissions').select('*').eq('profile_id', profile.id);
        return { isPending: false, profile: { ...profile, role: profile.role as UserRole, status: profile.status as UserStatus, tenant_name: TENANT_NAME, permissions: (perms || []) as UserPermission[] } };
      }
      return { profile: null, isPending: false };
    } catch (e: any) { 
      return { profile: null, isPending: false, error: formatError(e) }; 
    }
  },

  async fetchAllUserProfiles(tenantScope?: string): Promise<UserProfile[]> {
    try {
      let query = supabase.from('user_profiles').select('*');
      if (tenantScope && tenantScope !== 'ALL') query = query.eq('tenant_id', tenantScope);
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(p => ({ 
        ...p, 
        role: p.role as UserRole, 
        status: p.status as UserStatus, 
        tenant_name: TENANT_NAME, 
        permissions: [] 
      }));
    } catch (e: any) { 
      console.error("Registry Fetch Failure:", e);
      throw e; 
    }
  },

  async approveUser(clearance: UserClearance, adminId: string) {
    try {
      const cleanEmail = (clearance.email || '').toLowerCase().trim();
      const { data: profile } = await supabase.from('user_profiles').select('id').eq('email', cleanEmail).single();
      if (!profile) return { success: false, error: "Person Registry Record Not Found" };

      const { error: pError } = await supabase.from('user_profiles').update({ 
        status: 'active', 
        role: UserRole.RESEARCHER, 
        tenant_id: clearance.tenant_id || PRIMARY_TENANT_ID 
      }).eq('id', profile.id);
      
      if (pError) return { success: false, error: formatError(pError) };

      const baseline = getBaselinePermissions(profile.id, TENANT_NAME);
      for (const perm of baseline) {
          await supabase.from('user_permissions').upsert(perm, { onConflict: 'profile_id,module' });
      }
      return { success: true };
    } catch (e) {
      return { success: false, error: formatError(e) };
    }
  },

  async updateUserProfile(profileId: string, profile: Partial<UserProfile>) {
    const { id, user_id, tenant_name, permissions, ...cleanProfile } = profile as any;
    const { error } = await supabase.from('user_profiles').update(cleanProfile).eq('id', profileId);
    return { success: !error, error: formatError(error) };
  },

  async fetchModuleAccess(profileId: string, projectId: string): Promise<UserPermission[]> {
    const { data } = await supabase.from('user_permissions').select('*').eq('profile_id', profileId).eq('project_id', projectId);
    return (data || []) as UserPermission[];
  },

  async upsertModuleAccess(permission: UserPermission) {
    const { error } = await supabase.from('user_permissions').upsert(permission, { onConflict: 'profile_id,module' });
    return { success: !error, error: formatError(error) };
  },

  async fetchTenants(): Promise<TenantRecord[]> {
    const { data } = await supabase.from('tenants').select('*').order('name');
    return data || [];
  },

  async fetchEntityRelationships(tenantId?: string): Promise<any[]> {
    let query = supabase.from('entity_relationships').select('*');
    if (tenantId) query = query.eq('tenant_id', tenantId);
    const { data } = await query;
    return (data || []).map(r => ({ id: r.id, source: r.source_entity_id, target: r.target_entity_id, type: r.relationship_type, status: (r.confidence || 0) > 0.8 ? 'VERIFIED' : 'SIGNAL', source_ref: 'Institutional Network' }));
  },

  async upsertRelationship(rel: { source: string, target: string, type: string, tenant_id: string, profileId: string }) {
    const { error = null } = await supabase.from('entity_relationships').upsert({ source_entity_id: rel.source, target_entity_id: rel.target, relationship_type: rel.type, tenant_id: rel.tenant_id, verified_by: rel.profileId === 'SYSTEM' ? null : rel.profileId, confidence: 1.0 });
    return { success: !error, error: formatError(error) };
  },

  async fetchEntityIntelligenceTrail(entityId: string): Promise<{ signals: NewsArticle[], audit: EntityAuditLog[] }> {
    try {
      const [{ data: links }, { data: audit }] = await Promise.all([
        supabase.from('entity_signal_links').select('news_id').eq('entity_id', entityId),
        supabase.from('entity_audit_logs').select('*').eq('entity_id', entityId).order('timestamp', { ascending: false })
      ]);
      const signalIds = (links || []).map(l => l.news_id);
      let signals: NewsArticle[] = [];
      if (signalIds.length > 0) {
        const { data } = await supabase.from('news').select('*').in('id', signalIds);
        signals = data || [];
      }
      return { signals, audit: (audit || []) as EntityAuditLog[] };
    } catch { return { signals: [], audit: [] }; }
  },

  async logEntityChange(entityId: string, profileId: string, action: string, summary: string) {
    try {
      await supabase.from('entity_audit_logs').insert({ entity_id: entityId, user_id: profileId === 'SYSTEM' ? null : profileId, action, change_summary: summary, timestamp: new Date().toISOString() });
    } catch (e) { console.error("Audit log failed", e); }
  },

  async fetchEntities(tenantId: string | null, role: UserRole): Promise<Entity[]> {
    const tables = [
      { name: 'entities_gp', type: EntityType.GP, nameField: 'gp_name' },
      { name: 'entities_lp', type: EntityType.LP, nameField: 'lp_name' },
      { name: 'entities_fund', type: EntityType.FUND, nameField: 'fund_name' },
      { name: 'entities_portfolio_company', type: EntityType.PORTCO, nameField: 'company_name' },
      { name: 'entities_contacts', type: EntityType.CONTACT, nameField: 'contact_name' },
      { name: 'entities_service_provider', type: EntityType.SERVICE_PROVIDER, nameField: 'provider_name' },
      { name: 'entities_deals', type: EntityType.DEAL, nameField: 'deal_name' }
    ];

    const results = await Promise.all(tables.map(async table => {
      let query = supabase.from(table.name).select('*');
      if (tenantId && role !== UserRole.SUPER_ADMIN) query = query.eq('tenant_id', tenantId);
      const { data } = await query;
      return (data || []).map(item => ({ id: item.id, tenant_id: item.tenant_id, project_id: item.project_id || 'SYSTEM', type: table.type, name: item[table.nameField], status: item.status as EntityStatus, details: item, tags: item.tags || [], source: item.source, lastVerified: item.updated_at || item.created_at || new Date().toISOString() }));
    }));
    return results.flat();
  },

  async fetchEntityCoverage(entityId: string, type: EntityType): Promise<EntityLocationMap[]> {
    const { data } = await supabase.from('entity_location_maps').select('*').eq('entity_id', entityId).eq('entity_type', type);
    return (data || []) as EntityLocationMap[];
  },

  async saveNewsRefineryResult(newsId: string, result: any) {
    const { error } = await supabase.from('news_refinery_results').insert({ news_id: newsId, ...result, created_at: new Date().toISOString() });
    if (!error) await supabase.from('news').update({ status: 'COVERED' }).eq('id', newsId);
    return { success: !error, error: formatError(error) };
  },

  async createRegistryIntakeShell(shell: any) {
    const { error } = await supabase.from('entities_gp').insert({ ...shell, status: 'intake', created_at: new Date().toISOString() });
    return { success: !error, error: formatError(error) };
  },

  async fetchOutreachTargets(tenantId: string | null): Promise<OutreachTarget[]> {
    let query = supabase.from('outreach_targets').select('*');
    if (tenantId) query = query.eq('tenant_id', tenantId);
    const { data } = await query;
    return (data || []) as OutreachTarget[];
  },

  async fetchOutreachTemplates(): Promise<OutreachTemplate[]> {
    const { data } = await supabase.from('outreach_templates').select('*');
    return (data || []) as OutreachTemplate[];
  },

  async fetchOutreachIdentities(tenantId: string | null): Promise<OutreachIdentity[]> {
    let query = supabase.from('outreach_identities').select('*');
    if (tenantId) query = query.eq('tenant_id', tenantId);
    const { data } = await query;
    return (data || []) as OutreachIdentity[];
  },

  async logOutreach(log: any) {
    const { error = null } = await supabase.from('outreach_logs').insert(log);
    return { success: !error, error: formatError(error) };
  },

  async upsertEntity(entity: Entity, profileId: string = 'SYSTEM') {
    let tableName = ''; let nameField = '';
    switch (entity.type) {
      case EntityType.GP: tableName = 'entities_gp'; nameField = 'gp_name'; break;
      case EntityType.LP: tableName = 'entities_lp'; nameField = 'lp_name'; break;
      case EntityType.FUND: tableName = 'entities_fund'; nameField = 'fund_name'; break;
      case EntityType.PORTCO: tableName = 'entities_portfolio_company'; nameField = 'company_name'; break;
      case EntityType.CONTACT: tableName = 'entities_contacts'; nameField = 'contact_name'; break;
      case EntityType.SERVICE_PROVIDER: tableName = 'entities_service_provider'; nameField = 'provider_name'; break;
      case EntityType.DEAL: tableName = 'entities_deals'; nameField = 'deal_name'; break;
    }
    if (!tableName) return { success: false, error: 'Invalid entity type' };
    
    const { error } = await supabase.from(tableName).upsert({ ...entity.details, id: entity.id, [nameField]: entity.name, status: entity.status, updated_at: new Date().toISOString(), project_id: entity.project_id, tenant_id: entity.tenant_id, source: entity.source || 'manual' });
    if (!error) await this.logEntityChange(entity.id, profileId, 'update', `Updated registry record for ${entity.name}`);
    return { success: !error, error: formatError(error) };
  },

  async fetchSignals(): Promise<ExtractionSignal[]> {
    const { data } = await supabase.from('extraction_signals').select('*').order('created_at', { ascending: false });
    return (data || []).map(s => ({ ...s, aiConfidence: s.ai_confidence || 0.5, timestamp: s.created_at || new Date().toISOString() }));
  },

  async fetchProjects(profileId: string, tenantId: string | null, role: UserRole): Promise<Project[]> {
    const { data } = await supabase.from('projects').select('*');
    return (data || []) as Project[];
  },

  async fetchTasks(tenantId: string | null, role: UserRole): Promise<AnnotationTask[]> {
    const { data } = await supabase.from('annotation_tasks').select('*');
    return (data || []) as unknown as AnnotationTask[];
  },

  async fetchQAItems(tenantId: string | null, status: QAStatus | 'ALL'): Promise<QAItem[]> {
    let q = supabase.from('qa_items').select('*');
    if (status !== 'ALL') q = q.eq('status', status);
    const { data } = await q.order('sampled_at', { ascending: false });
    return (data || []) as QAItem[];
  },

  async submitQAResults(qaItemId: string, results: QAResult[], finalStatus: QAStatus) {
    const { error: rError } = await supabase.from('qa_results').insert(results);
    const { error: iError } = await supabase.from('qa_items').update({ status: finalStatus }).eq('id', qaItemId);
    return { success: !rError && !iError, error: formatError(rError || iError) };
  },

  async fetchNews(): Promise<NewsArticle[]> {
    const { data } = await supabase.from('news').select('*').order('publish_date', { ascending: false });
    return (data || []) as NewsArticle[];
  },

  async fetchIntakeQueue(tenantId?: string | null): Promise<Entity[]> {
    const { data } = await supabase.from('entities_gp').select('*').eq('status', 'intake');
    return (data || []).map(item => ({ ...item, type: EntityType.GP, status: 'intake' }));
  },

  async fetchLocations(): Promise<LocationRecord[]> {
    const { data } = await supabase.from('ref_locations').select('*');
    return (data || []) as LocationRecord[];
  },

  async updatePassword(password: string) { return await supabase.auth.updateUser({ password }); },
  async resetPassword(email: string) { return await supabase.auth.resetPasswordForEmail((email || '').toLowerCase().trim(), { redirectTo: REDIRECT_URL }); }
};
