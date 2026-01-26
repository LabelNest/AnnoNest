import { createClient } from '@supabase/supabase-js';
import { 
  TenantSession, Task, EntityType, Entity,
  UserRole, QAFieldDefinition, QAReview, QACostLedger, QAScoreSnapshot,
  ExtractionSignal, AnnotationTask, NewsArticle, RegistryIntakeItem,
  Person, ContactLink, Project, DropdownValue, UserFootprint
} from '../types';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://your-project-id.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

const IS_MOCK_MODE = SUPABASE_URL.includes('your-project-id') || !SUPABASE_URL;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const supabaseService = {
  // --- AUTH & TENANT ---
  async getTenantSessions(): Promise<TenantSession[]> {
    if (IS_MOCK_MODE) {
      return [{
        tenant_user_id: 'mock-user-1', tenant_id: 'mock-tenant-1', tenant_name: 'AnnoNest Global Sandbox',
        email: 'founder@annonest.io', full_name: 'Founder Canon', roles: ['super_admin'], 
        managers: [], status: 'active', user_id: 'mock-uid-1', role: 'super_admin',
        permissions: {
          dashboard: { read: true, write: true, assign: true, delete: true },
          datanest: { read: true, write: true, assign: true, delete: true },
          news: { read: true, write: true, assign: true, delete: true },
          extraction: { read: true, write: true, assign: true, delete: true },
          execution: { read: true, write: true, assign: true, delete: true },
          qa: { read: true, write: true, assign: true, delete: true },
          governance: { read: true, write: true, assign: true, delete: true },
          ledger: { read: true, write: true, assign: true, delete: true },
          sales: { read: true, write: true, assign: true, delete: true },
          firm_intel: { read: true, write: true, assign: true, delete: true },
          timelines: { read: true, write: true, assign: true, delete: true },
          radar: { read: true, write: true, assign: true, delete: true }
        }
      }];
    }
    return [];
  },

  async createTenant(payload: { name: string }) {
    if (IS_MOCK_MODE) return { data: { id: 'new-tenant-' + Date.now(), ...payload }, error: null };
    return await supabase.from('tenants').insert(payload).select().single();
  },

  async fetchAllTenants() {
    if (IS_MOCK_MODE) return [{ id: 'mock-tenant-1', name: 'AnnoNest Global Sandbox' }, { id: 'mock-tenant-2', name: 'Alpha Strategic partners' }];
    const { data } = await supabase.from('tenants').select('id, name');
    return data || [];
  },

  async signOut() { if (IS_MOCK_MODE) return; await supabase.auth.signOut(); },
  async updatePassword(password: string) { if (IS_MOCK_MODE) return { error: null }; return await supabase.auth.updateUser({ password }); },

  // --- TRACE PROTOCOL (FOOTPRINTS) ---
  async fetchUserFootprints(tenantId: string | null, userId: string | null, days: number): Promise<UserFootprint[]> {
    if (IS_MOCK_MODE) {
      const now = new Date();
      const mockFootprints: UserFootprint[] = [
        {
          id: 'foot-1', user_id: 'mock-user-1', full_name: 'Founder Canon', email: 'founder@annonest.io',
          tenant_id: 'mock-tenant-1', tenant_name: 'AnnoNest Global Sandbox',
          login_at: new Date(now.getTime() - 2 * 3600000).toISOString(),
          logout_at: null, duration_minutes: 120,
          navigation_path: ['dashboard', 'datanest', 'news', 'task_cockpit'],
          ip_address: '192.168.1.1', device_signature: 'Chrome / macOS', status: 'online'
        },
        {
          id: 'foot-2', user_id: 'analyst-1', full_name: 'Rahul Mehta', email: 'rahul@alpha.com',
          tenant_id: 'mock-tenant-1', tenant_name: 'AnnoNest Global Sandbox',
          login_at: new Date(now.getTime() - 24 * 3600000).toISOString(),
          logout_at: new Date(now.getTime() - 16 * 3600000).toISOString(),
          duration_minutes: 480,
          navigation_path: ['task_cockpit', 'annotate', 'qa_dashboard'],
          ip_address: '10.0.0.45', device_signature: 'Safari / iPadOS', status: 'offline'
        }
      ];
      
      let filtered = mockFootprints;
      if (tenantId) filtered = filtered.filter(f => f.tenant_id === tenantId);
      if (userId) filtered = filtered.filter(f => f.user_id === userId);
      return filtered;
    }
    
    // Real logic: Fetch from a 'user_sessions' or similar audit table
    let query = supabase.from('user_footprints').select('*').order('login_at', { ascending: false });
    if (tenantId) query = query.eq('tenant_id', tenantId);
    if (userId) query = query.eq('user_id', userId);
    
    const { data } = await query;
    return data || [];
  },

  // --- BULK OPERATIONS ---
  async bulkInsertEntities(entities: any[]) {
    if (IS_MOCK_MODE) {
      console.log("Bulk Inserting Firm Nodes:", entities);
      return { count: entities.length, error: null };
    }
    return await supabase.from('entities').insert(entities);
  },

  async bulkInsertNews(articles: any[]) {
    if (IS_MOCK_MODE) {
      console.log("Bulk Inserting News Signals:", articles);
      return { count: articles.length, error: null };
    }
    return await supabase.from('news').insert(articles);
  },

  async bulkInsertTasks(tasks: any[]) {
    if (IS_MOCK_MODE) {
      console.log("Bulk Inserting Tasks:", tasks);
      return { count: tasks.length, error: null };
    }
    return await supabase.from('tasks').insert(tasks);
  },

  // --- QA COMMAND (FOUNDER CANON PROTOCOL) ---
  async fetchQAReviews(tenantId: string, projectId: string): Promise<QAReview[]> {
    if (IS_MOCK_MODE) return [
      {
        id: 'qa-rev-1', module: 'DataNest', dataset: 'GP', entity_id: 'mock-e1', 
        record_id: 'task-123', qc_by: 'mock-user-1', qc_role: 'super_admin',
        qc_status: 'Assigned', review_json: {}, overall_score: null, accuracy_percent: null,
        remarks: null, reviewed_at: new Date().toISOString(), tenant_id: tenantId, project_id: projectId
      }
    ];
    const { data } = await supabase.from('qa_reviews').select('*').eq('tenant_id', tenantId).eq('project_id', projectId);
    return data || [];
  },

  async fetchQAFieldDefinitions(module?: string, dataset?: string): Promise<QAFieldDefinition[]> {
    if (IS_MOCK_MODE) return [
      { id: 'fd-1', module: 'DataNest', dataset: 'GP', field_key: 'legal_name', field_label: 'Canonical Legal Name', required: true, allow_na: false, qc_weight: 1.5, active: true, created_at: '' },
      { id: 'fd-2', module: 'DataNest', dataset: 'GP', field_key: 'hq_city', field_label: 'HQ Jurisdiction', required: true, allow_na: true, qc_weight: 1.0, active: true, created_at: '' }
    ];
    let query = supabase.from('qa_field_definitions').select('*');
    if (module) query = query.eq('module', module);
    if (dataset) query = query.eq('dataset', dataset);
    const { data } = await query;
    return data || [];
  },

  async fetchQACostLedger(tenantId: string, projectId: string): Promise<QACostLedger[]> {
    if (IS_MOCK_MODE) return [
      { id: 'cl-1', module: 'DataNest', dataset_type: 'GP', entity_id: 'mock-e1', qa_review_id: 'qa-rev-1', reviewer_id: 'mock-user-1', time_spent_minutes: 12, cost_per_minute: 4.5, total_cost: 54.0, created_at: new Date().toISOString() }
    ];
    const { data } = await supabase.from('qa_cost_ledger').select('*').eq('tenant_id', tenantId);
    return data || [];
  },

  async fetchQAScoreSnapshots(tenantId: string): Promise<QAScoreSnapshot[]> {
    if (IS_MOCK_MODE) return [
      { id: 'snap-1', module: 'DataNest', dataset_type: 'GP', entity_id: null, user_id: 'user-x', team_id: 'team-alpha', period_type: 'WEEKLY', period_start: '2025-05-01', period_end: '2025-05-07', total_fields_checked: 140, correct_count: 135, incorrect_count: 5, not_applicable_count: 0, final_score: 96.4, disputed_count: 1, created_at: '' }
    ];
    const { data } = await supabase.from('qa_score_snapshots').select('*');
    return data || [];
  },

  async completeQAReview(reviewId: string, reviewJson: any, remarks: string, minutes: number) {
    if (IS_MOCK_MODE) return { success: true, accuracy: 98.4, status: 'Passed' };
    const { data, error } = await supabase.from('qa_reviews').update({ 
      review_json: reviewJson, 
      remarks, 
      qc_status: 'Completed',
      reviewed_at: new Date().toISOString()
    }).eq('id', reviewId);
    return { success: !error };
  },

  async assignQAReviewByTaskId(taskId: string, userId: string) {
    if (IS_MOCK_MODE) return { success: true };
    return await supabase.from('qa_reviews').update({ qc_by: userId, qc_status: 'Assigned' }).eq('record_id', taskId);
  },

  async fetchStaleAuditBacklog(tenantId: string): Promise<Entity[]> {
    if (IS_MOCK_MODE) return [{ id: 'mock-e2', name: 'Zeta Venture Fund', type: EntityType.FUND, status: 'active', tenant_id: tenantId, confidence_score: 95, updated_at: new Date(Date.now() - 95 * 24 * 3600 * 1000).toISOString(), created_at: '' }];
    const { data } = await supabase.from('entities').select('*').eq('tenant_id', tenantId).order('updated_at', { ascending: true }).limit(50);
    return data || [];
  },

  // --- DATA NEST ---
  async fetchDataNestRegistry(tenantId: string, type: EntityType): Promise<any[]> {
    if (IS_MOCK_MODE) return [{ id: 'mock-e1', name: 'Alpha Capital Partners', type, status: 'active', tenant_id: tenantId, confidence_score: 98, updated_at: new Date(Date.now() - 40 * 24 * 3600 * 1000).toISOString() }];
    const { data } = await supabase.from('entities').select('*').eq('tenant_id', tenantId).eq('type', type).order('name', { ascending: true });
    return data || [];
  },

  async fetchEntities(tenantId: string): Promise<Entity[]> {
    if (IS_MOCK_MODE) return [{ id: 'mock-e1', name: 'Alpha Capital Partners', type: EntityType.GP, status: 'active', tenant_id: tenantId, confidence_score: 98, updated_at: new Date(Date.now() - 40 * 24 * 3600 * 1000).toISOString(), created_at: new Date().toISOString() }];
    const { data } = await supabase.from('entities').select('*').eq('tenant_id', tenantId);
    return data || [];
  },

  async fetchDataNestStats(tenantId: string) {
    if (IS_MOCK_MODE) return { entities_total: 1240, integrity_index: 94.8 };
    const { count } = await supabase.from('entities').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId);
    return { entities_total: count || 0, integrity_index: 94.8 };
  },

  async createEntity(payload: any) {
    if (IS_MOCK_MODE) return { data: { ...payload, id: 'mock-' + Date.now() }, error: null };
    return await supabase.from('entities').insert(payload).select().single();
  },

  async searchDataNest(tenantId: string, query: string): Promise<any[]> {
    if (IS_MOCK_MODE) return [{ id: 'mock-e1', name: 'Alpha Capital Partners', type: EntityType.GP }];
    const { data } = await supabase.from('entities').select('*').eq('tenant_id', tenantId).ilike('name', `%${query}%`);
    return data || [];
  },

  // --- OTHERS ---
  async fetchTasks(tenantId: string, projectId: string): Promise<Task[]> {
    if (IS_MOCK_MODE) return [{ id: 'task-123', tenant_id: tenantId, project_id: projectId, task_type: 'ENTITY_EXTRACTION', task_category: 'annotation', status: 'submitted', assigned_to: 'mock-user-1', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), name: 'Extraction: Alpha Capital' }];
    const { data } = await supabase.from('tasks').select('*').eq('tenant_id', tenantId).eq('project_id', projectId);
    return data || [];
  },
  
  async fetchProjects(tenantId: string): Promise<Project[]> {
    if (IS_MOCK_MODE) return [{ id: 'mock-p1', name: 'Global GP Audit 2025', tenant_id: tenantId, status: 'active', description: 'Primary extraction project', created_at: '' }];
    const { data } = await supabase.from('projects').select('*').eq('tenant_id', tenantId);
    return data || [];
  },

  async fetchTenantMembers(tenantId: string) {
    if (IS_MOCK_MODE) return [{ id: 'mock-user-1', tenant_user_id: 'mock-user-1', user_id: 'mock-uid-1', full_name: 'Sandbox Analyst', email: 'analyst@annonest.io', status: 'active', role: 'analyst' }];
    const { data } = await supabase.from('tenant_users').select('*').eq('tenant_id', tenantId);
    return data || [];
  },

  async fetchRegistryIntakeQueue(tenantId: string) { return []; },
  async fetchPulseActivityMetrics(tid: string, pid: string) { return { firmsUpdated: 12, newsProcessed: 45, firmsReachedOut: 8, contactsEngaged: 15, annotationsCompleted: 22, qaReviewsCompleted: 10 }; },
  async fetchNews(tid: string) { return []; },
  async updateTableRecord(table: string, id: string, p: any) { return { data: p, error: null }; },
  async fetchContactRegistry(tid: string) { return []; },
  async fetchEntityRelationships(tid: string) { return []; },
  async fetchExtractionKPIs(tid: string) { return { total_urls: 100, changes: 5, tasks: 12, failed: 1 }; },
  async fetchExtractionQueue(tid: string) { return []; },
  async fetchExtractionRuns(tid: string) { return []; },
  async fetchDropdownValues(tid: string, ds: string, fk: string) { return []; },
  async fetchPersonInferenceProvenance(pid: string) { return []; },
  async fetchPersonProfile(pid: string) { return null; },
  async fetchPersonRoleHistory(pid: string) { return []; },
  async fetchAnnotatorTasks(tid: string, uid: string, pid: string) { return []; },
  fetchSchemaCatalog() { return { 'DataNest': [{ key: 'legal_name', label: 'Legal Name' }, { key: 'hq_city', label: 'HQ City' }, { key: 'website', label: 'Website' }] }; },
  async fetchSignals(): Promise<ExtractionSignal[]> { return []; },
  async updateSignalStatus(id: string, status: string) { return { success: true }; },
  async fetchEntityHistory(id: string): Promise<any[]> { return []; },
  async fetchDocumentIntelligence(docId: string): Promise<any[]> { return []; },
  async fetchAllDropdownValues(tenantId: string): Promise<DropdownValue[]> { return []; },
  async updateMemberStatus(id: string, status: string) { return { error: null }; },
  async upsertDropdownValue(val: any) { return { error: null }; },
  async createEntityShell(payload: any) { return { success: true }; },
  async commitNewsReview(newsId: string, payload: any) { return { success: true }; },
  async signIn(e: string, p: string) { return { error: null }; },
  async signUp(e: string, p: string, n: string, tid: string) { return { data: {}, error: null }; },
  async resetPassword(e: string) { return { error: null }; },
  async fetchOutreachTargets(tid: string) { return []; },
  async fetchOutreachTemplates() { return []; },
  async fetchOutreachIdentities(tid: string) { return []; },
  async fetchOutreachHistory(tid: string) { return []; },
  async fetchOutreachAssets(tid: string) { return []; },
  async fetchOutreachSignatures(tid: string) { return []; },
  async pushToIntake(payload: any) { return { success: true }; },
  async createOutreachRecord(payload: any) { return { data: payload, error: null }; },
  async commitIntakeDecision(item: any, res: string, uid: string, re: string, p: any) { return { success: true }; },
  async retryExtraction(id: string) { return { success: true }; },
  async fetchExtractedVersions(urlId: string): Promise<any[]> { return []; },
  async fetchFirmIntelligence(tid: string): Promise<any[]> { return []; },
  async fetchVerifiableURLs(tid: string): Promise<any[]> { return []; },
  async updateFirmURLStatus(id: string, p: any) { return { success: true }; },
  async bulkUpdateFirmURLs(ids: string[], p: any) { return { success: true }; },
  async fetchDocuments(tid: string): Promise<any[]> { return []; },
  async fetchApprovalQueue(tid: string): Promise<any[]> { return []; },
  async approveIntelligence(id: string, uid: string, tid: string) { return { success: true }; },
  async rejectIntelligence(id: string, uid: string, re: string) { return { success: true }; },
  async fetchSchedulerJobs(tid: string): Promise<any[]> { return []; },
  async createSchedulerJob(p: any) { return { data: p, error: null }; },
  async fetchUsageLedger(tid: string): Promise<any[]> { return []; },
  async fetchFilingTimeline(eid: string) { return []; },
  async fetchDocumentById(id: string): Promise<any> { return null; },
  async fetchDocumentVersions(id: string): Promise<any[]> { return []; },
  async fetchDocumentDiffs(id: string): Promise<any[]> { return []; },
  async fetchFirmUrls(id: string): Promise<any[]> { return []; },
  async fetchEntityFilings(id: string): Promise<any[]> { return []; },
  async fetchLatestDocument(sid: string): Promise<any> { return null; },
  async createExtractionQueueItem(p: any) { return { data: p, error: null }; },
  async processApproval(id: string, iid: string, uid: string, act: string, re: string) { return { success: true }; },
  async addFirmUrl(p: any) { return { success: true }; },
  async addEntityFiling(p: any) { return { data: p, error: null }; },
  async triggerManualExtraction(jid: string, tid: string) { return { success: true }; },
  async fetchIntelligenceForReview(tid: string) { return []; },
  async createTask(p: any) { return { data: { ...p, id: 'task-' + Date.now() }, error: null }; },
  async upsertQAFieldDefinition(p: any) { return { data: p, error: null }; },
  async fetchAllQAFieldDefinitions(): Promise<QAFieldDefinition[]> {
     return this.fetchQAFieldDefinitions();
  }
};
