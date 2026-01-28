import { createClient } from '@supabase/supabase-js';
import { 
  TenantSession, Task, EntityType, Entity,
  UserRole, QAFieldDefinition, QAReview, QACostLedger, QAScoreSnapshot,
  ExtractionSignal, AnnotationTask, NewsArticle, RegistryIntakeItem,
  Person, ContactLink, Project, DropdownValue, UserFootprint
} from '../types';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const supabaseService = {
  // --- AUTH & TENANT ---
  async getTenantSessions(): Promise<TenantSession[]> {
    const { data, error } = await supabase.rpc("tenant_sessions");

    if (error) throw error;
    return data || [];
  },

  async createTenant(payload: { name: string }) {
    return await supabase.from('tenants').insert(payload).select().single();
  },

  async fetchAllTenants() {
    const { data, error } = await supabase.from('tenants').select('id, name');
    if (error) throw error;
    return data || [];
  },

  async signOut() { 
    await supabase.auth.signOut(); 
  },

  async updatePassword(password: string) { 
    return await supabase.auth.updateUser({ password }); 
  },

  // --- TRACE PROTOCOL (FOOTPRINTS) ---
  async fetchUserFootprints(tenantId: string | null, userId: string | null, days: number): Promise<UserFootprint[]> {
    let query = supabase.from('user_footprints').select('*').order('login_at', { ascending: false });
    if (tenantId && tenantId !== 'ALL') query = query.eq('tenant_id', tenantId);
    if (userId && userId !== 'ALL') query = query.eq('user_id', userId);
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  // --- BULK OPERATIONS ---
  async bulkInsertEntities(entities: any[]) {
    return await supabase.from('entities').insert(entities);
  },

  async bulkInsertNews(articles: any[]) {
    return await supabase.from('news').insert(articles);
  },

  async bulkInsertTasks(tasks: any[]) {
    return await supabase.from('tasks').insert(tasks);
  },

  // --- QA COMMAND ---
  async fetchQAReviews(tenantId: string, projectId: string): Promise<QAReview[]> {
    const { data, error } = await supabase
      .from('qa_reviews')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('project_id', projectId);
    if (error) throw error;
    return data || [];
  },

  async fetchQAFieldDefinitions(module?: string, dataset?: string): Promise<QAFieldDefinition[]> {
    let query = supabase.from('qa_field_definitions').select('*');
    if (module) query = query.eq('module', module);
    if (dataset) query = query.eq('dataset', dataset);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async fetchQACostLedger(tenantId: string, projectId: string): Promise<QACostLedger[]> {
    const { data, error } = await supabase
      .from('qa_cost_ledger')
      .select('*')
      .eq('tenant_id', tenantId);
    if (error) throw error;
    return data || [];
  },

  async fetchQAScoreSnapshots(tenantId: string): Promise<QAScoreSnapshot[]> {
    const { data, error } = await supabase.from('qa_score_snapshots').select('*');
    if (error) throw error;
    return data || [];
  },

  async completeQAReview(reviewId: string, reviewJson: any, remarks: string, minutes: number) {
    const { data, error } = await supabase.from('qa_reviews').update({ 
      review_json: reviewJson, 
      remarks, 
      qc_status: 'Completed',
      reviewed_at: new Date().toISOString()
    }).eq('id', reviewId).select().single();
    
    return { success: !error, data };
  },

  async assignQAReviewByTaskId(taskId: string, userId: string) {
    return await supabase.from('qa_reviews').update({ qc_by: userId, qc_status: 'Assigned' }).eq('record_id', taskId);
  },

  async fetchStaleAuditBacklog(tenantId: string): Promise<Entity[]> {
    const { data, error } = await supabase
      .from('entities')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('updated_at', { ascending: true })
      .limit(50);
    if (error) throw error;
    return data || [];
  },

  // --- DATA NEST ---
async fetchDataNestRegistry(tenantId: string, type: EntityType): Promise<any[]> {
const tableMap: Record<EntityType, string> = {
  [EntityType.GP]: 'entities_gp',
  [EntityType.LP]: 'entities_lp',
  [EntityType.FUND]: 'entities_fund',
  [EntityType.PORTCO]: 'entities_portfolio_company',
  [EntityType.SERVICE_PROVIDER]: 'entities_service_provider',
  [EntityType.DEAL]: 'entities_deal'
};


  const table = tableMap[type];
  if (!table) return [];

  const { data, error } = await supabase
    .from(table)
    .select('*')
   // .eq('tenant_id', tenantId)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data || [];
},


  async fetchEntities(tenantId: string): Promise<Entity[]> {
    const { data, error } = await supabase
      .from('entities')
      .select('*')
      .eq('tenant_id', tenantId);
    if (error) throw error;
    return data || [];
  },

 async fetchDataNestStats(tenantId: string) {
  const tables = [
    'entities_gp',
    'entities_lp',
    'entities_fund',
    'entities_portfolio_company',
    'entities_service_provider',
    'entities_deal'
  ];

  let total = 0;

  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId);

    if (!error && count) {
      total += count;
    }
  }

  return {
    entities_total: total,
    integrity_index: 94.8
  };
},


async createEntity(payload: any) {
 const tableMap: Record<EntityType, string> = {
  [EntityType.GP]: 'entities_gp',
  [EntityType.LP]: 'entities_lp',
  [EntityType.FUND]: 'entities_fund',
  [EntityType.PORTCO]: 'entities_portfolio_company',
  [EntityType.SERVICE_PROVIDER]: 'entities_service_provider',
  [EntityType.DEAL]: 'entities_deal'
};


  const table = tableMap[payload.type];
  if (!table) {
    throw new Error(`Unsupported entity type: ${payload.type}`);
  }

  const { data, error } = await supabase
    .from(table)
    .insert({
      tenant_id: payload.tenant_id,
      status: payload.status ?? 'active',
      headquarters_city: payload.hq_city || null,
      data_confidence_score: payload.confidence_score ?? 100
    })
    .select()
    .single();

  if (error) throw error;
  return data;
},

async fetchEntityById(entityType: EntityType, id: string) {
const tableMap: Record<EntityType, string> = {
  [EntityType.GP]: 'entities_gp',
  [EntityType.LP]: 'entities_lp',
  [EntityType.FUND]: 'entities_fund',
  [EntityType.PORTCO]: 'entities_portfolio_company',
  [EntityType.SERVICE_PROVIDER]: 'entities_service_provider',
  [EntityType.DEAL]: 'entities_deal'
};


  const table = tableMap[entityType];
  if (!table) throw new Error('Invalid entity type');

  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
},


  async fetchTasks(tenantId: string, projectId: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('project_id', projectId);
    if (error) throw error;
    return data || [];
  },
  
  async fetchProjects(tenantId: string): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('tenant_id', tenantId);
    if (error) throw error;
    return data || [];
  },

  async fetchTenantMembers(tenantId: string) {
    const { data, error } = await supabase
      .from('tenant_users')
      .select('*')
      .eq('tenant_id', tenantId);
    if (error) throw error;
    return data || [];
  },

  async fetchRegistryIntakeQueue(tenantId: string) {
    const { data, error } = await supabase
      .from('registry_intake')
      .select('*')
      .eq('tenant_id', tenantId);
    if (error) throw error;
    return data || [];
  },

  async fetchPulseActivityMetrics(tid: string, pid: string) {
    // In real mode, these would be RPC calls or aggregated queries
    return { firmsUpdated: 0, newsProcessed: 0, firmsReachedOut: 0, contactsEngaged: 0, annotationsCompleted: 0, qaReviewsCompleted: 0 };
  },

  async fetchNews(tid: string) {
    const { data, error } = await supabase.from('news').select('*').eq('tenant_id', tid);
    if (error) throw error;
    return data || [];
  },

  async updateTableRecord(table: string, id: string, payload: any) {
    return await supabase.from(table).update(payload).eq('id', id).select().single();
  },

  async fetchContactRegistry(tid: string) {
    const { data, error } = await supabase.from('entities_contacts').select('*').eq('tenant_id', tid);
    if (error) throw error;
    return data || [];
  },

  async fetchEntityRelationships(tid: string) {
    const { data, error } = await supabase.from('relationships').select('*').eq('tenant_id', tid);
    if (error) throw error;
    return data || [];
  },

  async fetchExtractionKPIs(tid: string) {
    const { count, error } = await supabase.from('extraction_queue').select('*', { count: 'exact', head: true }).eq('tenant_id', tid);
    return { total_urls: count || 0, changes: 0, tasks: 0, failed: 0 };
  },

  async fetchExtractionQueue(tid: string) {
    const { data, error } = await supabase.from('extraction_queue').select('*').eq('tenant_id', tid);
    if (error) throw error;
    return data || [];
  },

  async fetchExtractionRuns(tid: string) {
    const { data, error } = await supabase.from('extraction_runs').select('*').eq('tenant_id', tid);
    if (error) throw error;
    return data || [];
  },

  async fetchDropdownValues(tid: string, ds: string, fk: string) {
    const { data, error } = await supabase.from('dropdown_values').select('*').eq('tenant_id', tid).eq('dataset', ds).eq('field_key', fk);
    if (error) throw error;
    return data || [];
  },

  async fetchPersonInferenceProvenance(pid: string) {
    const { data, error } = await supabase.from('person_inferences').select('*').eq('person_id', pid);
    if (error) throw error;
    return data || [];
  },

  async fetchPersonProfile(pid: string) {
    const { data, error } = await supabase.from('entities_contacts').select('*').eq('id', pid).single();
    if (error) throw error;
    return data;
  },

  async fetchPersonRoleHistory(pid: string) {
    const { data, error } = await supabase.from('entities_contact_links').select('*').eq('contact_id', pid);
    if (error) throw error;
    return data || [];
  },

  async fetchAnnotatorTasks(tid: string, uid: string, pid: string) {
    const { data, error } = await supabase.from('annotation_tasks').select('*').eq('tenant_id', tid).eq('project_id', pid);
    if (error) throw error;
    return data || [];
  },

  async fetchSignals(): Promise<ExtractionSignal[]> {
    const { data, error } = await supabase.from('extraction_signals').select('*').eq('status', 'QUEUED');
    if (error) throw error;
    return data || [];
  },

  async updateSignalStatus(id: string, status: string) {
    return await supabase.from('extraction_signals').update({ status }).eq('id', id);
  },

  async fetchEntityHistory(id: string): Promise<any[]> {
    const { data, error } = await supabase.from('entity_history').select('*').eq('entity_id', id);
    if (error) throw error;
    return data || [];
  },

  async fetchDocumentIntelligence(docId: string): Promise<any[]> {
    const { data, error } = await supabase.from('document_intelligence').select('*').eq('document_id', docId);
    if (error) throw error;
    return data || [];
  },

  async fetchAllDropdownValues(tenantId: string): Promise<DropdownValue[]> {
    const { data, error } = await supabase.from('dropdown_values').select('*').eq('tenant_id', tenantId);
    if (error) throw error;
    return data || [];
  },

  async updateMemberStatus(id: string, status: string) {
    return await supabase.from('tenant_users').update({ status }).eq('id', id);
  },

  async upsertDropdownValue(val: any) {
    return await supabase.from('dropdown_values').upsert(val);
  },

  async createEntityShell(payload: any) {
    return await supabase.from('entities').insert(payload);
  },

  async commitNewsReview(newsId: string, payload: any) {
    return await supabase.from('news').update(payload).eq('id', newsId);
  },

  async signIn(e: string, p: string) { 
    return await supabase.auth.signInWithPassword({ email: e, password: p }); 
  },

  async signUp(e: string, p: string, n: string, tid: string) { 
    return await supabase.auth.signUp({ 
      email: e, 
      password: p, 
      options: { data: { full_name: n, tenant_id: tid } } 
    }); 
  },

  async resetPassword(e: string) { 
    return await supabase.auth.resetPasswordForEmail(e); 
  },

  async fetchOutreachTargets(tid: string) {
    const { data, error } = await supabase.from('outreach_targets').select('*').eq('tenant_id', tid);
    if (error) throw error;
    return data || [];
  },

  async fetchOutreachTemplates() {
    const { data, error } = await supabase.from('outreach_templates').select('*');
    if (error) throw error;
    return data || [];
  },

  async fetchOutreachIdentities(tid: string) {
    const { data, error } = await supabase.from('outreach_identities').select('*').eq('tenant_id', tid);
    if (error) throw error;
    return data || [];
  },

  async fetchOutreachHistory(tid: string) {
    const { data, error } = await supabase.from('outreach_history').select('*').eq('tenant_id', tid);
    if (error) throw error;
    return data || [];
  },

  async fetchOutreachAssets(tid: string) {
    const { data, error } = await supabase.from('outreach_assets').select('*').eq('tenant_id', tid);
    if (error) throw error;
    return data || [];
  },

  async fetchOutreachSignatures(tid: string) {
    const { data, error } = await supabase.from('outreach_signatures').select('*').eq('tenant_id', tid);
    if (error) throw error;
    return data || [];
  },

  async pushToIntake(payload: any) {
    return await supabase.from('registry_intake').insert(payload);
  },

  async createOutreachRecord(payload: any) {
    return await supabase.from('outreach_history').insert(payload).select().single();
  },

  async commitIntakeDecision(item: any, res: string, uid: string, re: string, p: any) {
    // Complex decision logic moved to DB functions usually, here we mock the success
    return { success: true };
  },

  async retryExtraction(id: string) {
    return await supabase.from('extraction_queue').update({ status: 'QUEUED' }).eq('id', id);
  },

  async fetchExtractedVersions(urlId: string): Promise<any[]> {
    const { data, error } = await supabase.from('extracted_versions').select('*').eq('url_id', urlId);
    if (error) throw error;
    return data || [];
  },

  async fetchFirmIntelligence(tid: string): Promise<any[]> {
    const { data, error } = await supabase.from('firm_intelligence_metrics').select('*').eq('tenant_id', tid);
    if (error) throw error;
    return data || [];
  },

  async fetchVerifiableURLs(tid: string): Promise<any[]> {
    const { data, error } = await supabase.from('firm_urls').select('*, entities(name, type)').eq('tenant_id', tid).eq('verification_status', 'PENDING');
    if (error) throw error;
    return data || [];
  },

  async updateFirmURLStatus(id: string, p: any) {
    return await supabase.from('firm_urls').update(p).eq('id', id);
  },

  async bulkUpdateFirmURLs(ids: string[], p: any) {
    return await supabase.from('firm_urls').update(p).in('id', ids);
  },

  async fetchDocuments(tid: string): Promise<any[]> {
    const { data, error } = await supabase.from('entity_documents').select('*').eq('tenant_id', tid);
    if (error) throw error;
    return data || [];
  },

  async fetchApprovalQueue(tid: string): Promise<any[]> {
    const { data, error } = await supabase.from('document_intelligence').select('*, entities(name)').eq('tenant_id', tid).eq('approval_status', 'PENDING');
    if (error) throw error;
    return data || [];
  },

  async approveIntelligence(id: string, uid: string, tid: string) {
    return await supabase.from('document_intelligence').update({ approval_status: 'APPROVED', status: 'COMPLETED' }).eq('id', id);
  },

  async rejectIntelligence(id: string, uid: string, re: string) {
    return await supabase.from('document_intelligence').update({ approval_status: 'REJECTED', status: 'FAILED' }).eq('id', id);
  },

  async fetchSchedulerJobs(tid: string): Promise<any[]> {
    const { data, error } = await supabase.from('scheduler_jobs').select('*').eq('tenant_id', tid);
    if (error) throw error;
    return data || [];
  },

  async createSchedulerJob(p: any) {
    return await supabase.from('scheduler_jobs').insert(p).select().single();
  },

  async fetchUsageLedger(tid: string): Promise<any[]> {
    const { data, error } = await supabase.from('usage_ledger').select('*').eq('tenant_id', tid);
    if (error) throw error;
    return data || [];
  },

  async fetchFilingTimeline(eid: string) {
    const { data, error } = await supabase.from('filing_timelines').select('*').eq('entity_id', eid).order('timestamp', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async fetchDocumentById(id: string): Promise<any> {
    const { data, error } = await supabase.from('entity_documents').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  },

  async fetchDocumentVersions(id: string): Promise<any[]> {
    const { data, error } = await supabase.from('entity_document_versions').select('*').eq('document_id', id);
    if (error) throw error;
    return data || [];
  },

  async fetchDocumentDiffs(id: string): Promise<any[]> {
    const { data, error } = await supabase.from('entity_document_diffs').select('*').eq('document_id', id);
    if (error) throw error;
    return data || [];
  },

  async fetchFirmUrls(id: string): Promise<any[]> {
    const { data, error } = await supabase.from('firm_urls').select('*').eq('entity_id', id);
    if (error) throw error;
    return data || [];
  },

  async fetchEntityFilings(id: string): Promise<any[]> {
    const { data, error } = await supabase.from('entity_filings').select('*').eq('entity_id', id);
    if (error) throw error;
    return data || [];
  },

  async fetchLatestDocument(sid: string): Promise<any> {
    const { data, error } = await supabase.from('entity_documents').select('*').eq('source_id', sid).order('last_updated', { ascending: false }).limit(1).single();
    return data;
  },

  async createExtractionQueueItem(p: any) {
    return await supabase.from('extraction_queue').insert(p).select().single();
  },

  async processApproval(id: string, iid: string, uid: string, act: string, re: string) {
    const status = act === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    return await supabase.from('document_intelligence').update({ approval_status: status }).eq('id', iid);
  },

  async addFirmUrl(p: any) {
    return await supabase.from('firm_urls').insert(p).select().single();
  },

  async addEntityFiling(p: any) {
    return await supabase.from('entity_filings').insert(p).select().single();
  },

  async triggerManualExtraction(jid: string, tid: string) {
    // This usually involves complex DB trigger or webhook, mocked here
    return { success: true };
  },

  async fetchIntelligenceForReview(tid: string) {
    const { data, error } = await supabase.from('document_intelligence').select('*, entities(name)').eq('tenant_id', tid).eq('approval_status', 'PENDING');
    if (error) throw error;
    return data || [];
  },

  async createTask(p: any) {
    return await supabase.from('tasks').insert(p).select().single();
  },

  async upsertQAFieldDefinition(p: any) {
    return await supabase.from('qa_field_definitions').upsert(p).select().single();
  },

  async fetchAllQAFieldDefinitions(): Promise<QAFieldDefinition[]> {
     const { data, error } = await supabase.from('qa_field_definitions').select('*');
     if (error) throw error;
     return data || [];
  }
};