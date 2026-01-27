export enum EntityType {
  LP = 'LP',
  GP = 'GP',
  FUND = 'FUND',
  PORTCO = 'PORTCO',
  SERVICE_PROVIDER = 'SERVICE_PROVIDER',
  DEAL = 'DEAL',
  CONTACT = 'CONTACT',
  AGRITECH = 'AGRITECH',
  HEALTHCARE = 'HEALTHCARE',
  BLOCKCHAIN = 'BLOCKCHAIN',
  PUBLIC_MARKET = 'PUBLIC_MARKET',
  OTHER = 'OTHER'
}


export type UserRole = 'super_admin' | 'tenant_admin' | 'manager' | 'analyst' | 'qa' | 'viewer';

export interface ModuleAccess {
  read: boolean;
  write: boolean;
  assign: boolean;
  delete: boolean;
}

export interface PermissionMatrix {
  dashboard: ModuleAccess;
  datanest: ModuleAccess;
  news: ModuleAccess;
  extraction: ModuleAccess;
  execution: ModuleAccess;
  qa: ModuleAccess;
  governance: ModuleAccess;
  ledger: ModuleAccess;
  sales: ModuleAccess;
  firm_intel: ModuleAccess;
  timelines: ModuleAccess;
  radar: ModuleAccess;
}

export interface TenantSession {
  tenant_user_id: string; 
  tenant_id: string;
  tenant_name: string;
  email: string;
  full_name: string;
  roles: UserRole[]; 
  managers: string[]; 
  status: string;
  permissions: PermissionMatrix;
  user_id: string; 
  role: UserRole; 
  is_first_login?: boolean;
}

export type UserProfile = TenantSession;

export interface Project {
  id: string;
  tenant_id: string;
  name: string;
  description: string;
  status: 'active' | 'archived' | 'completed';
  created_at: string;
}

export interface Entity {
  id: string;
  name: string;
  type: EntityType;
  status: string;
  tenant_id: string;
  country?: string;
  hq_city?: string;
  last_updated_by?: string;
  confidence_score: number;
  updated_at: string;
  created_at: string;
}

export interface Task {
  id: string;
  tenant_id: string;
  project_id: string;
  task_type: string;
  task_category: string;
  status: string;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  metadata?: any;
  name?: string;
  priority?: string;
  created_by?: string;
  entity_type?: EntityType;
  entity_id?: string | null;
  input_type?: string;
  input_url?: string | null;
  due_date?: string;
}

// --- QA COMMAND SCHEMA (V2.0 PROMPT ALIGNED) ---

export interface QACostLedger {
  id: string;
  module: string;
  dataset_type: string | null;
  entity_id: string | null;
  qa_review_id: string | null;
  reviewer_id: string;
  time_spent_minutes: number;
  cost_per_minute: number;
  total_cost: number | null;
  created_at: string;
}

export interface QAFieldDefinition {
  id: string;
  module: string;
  dataset: string | null;
  field_key: string;
  field_label: string;
  required: boolean;
  allow_na: boolean;
  qc_weight: number;
  active: boolean;
  created_at: string;
}

export interface QAReview {
  id: string;
  module: string;
  dataset: string | null;
  entity_id: string | null;
  record_id: string | null; // Often the Task ID
  qc_by: string | null;
  qc_role: string | null;
  qc_status: 'Pending' | 'Assigned' | 'Completed' | 'Passed' | 'Failed' | 'Disputed';
  review_json: Record<string, 'CORRECT' | 'INCORRECT' | 'N/A' | 'DISPUTED'>;
  overall_score: number | null;
  accuracy_percent: number | null;
  remarks: string | null;
  reviewed_at: string;
  tenant_id: string;
  project_id: string;
}

export interface QAScoreSnapshot {
  id: string;
  module: string;
  dataset_type: string | null;
  entity_id: string | null;
  user_id: string | null;
  team_id: string | null;
  period_type: string;
  period_start: string;
  period_end: string;
  total_fields_checked: number;
  correct_count: number;
  incorrect_count: number;
  not_applicable_count: number;
  final_score: number;
  disputed_count: number;
  created_at: string;
}

export interface NewsArticle {
  id: string;
  headline: string;
  source_name: string;
  url: string;
  created_at: string;
  processing_status?: string;
  assigned_to_profile_id?: string;
  raw_text?: string;
  clean_text?: string;
}

export interface RegistryIntakeItem {
  id: string;
  suggested_entity_name: string;
  suggested_entity_type: EntityType;
  source_type: string;
  trigger_reference: string;
  confidence_score: number;
  tenant_id: string;
  assigned_to: string | null;
  created_at: string;
  payload_context?: any;
}

export type ActionType = 'NO_NEW_INFO' | 'ADDED_SHELL' | 'UPDATED_EXISTING';
export type EventType = 'FUNDRAISING' | 'DEAL_INVESTMENT' | 'MERGER_ACQUISITION' | 'PEOPLE_MOVE' | 'EXIT' | 'FUND_OPERATIONS' | 'REGULATORY_LEGAL' | 'FINANCIAL_PERFORMANCE' | 'STRATEGY_BUSINESS' | 'ESG_IMPACT' | 'PARTNERSHIPS' | 'OPERATIONAL' | 'OTHER';
export type URLType = 'TEAM_PAGE' | 'BIO_PAGE' | 'PORTFOLIO_PAGE' | 'FIRM_WEBSITE' | 'NEWS_WIRE' | 'PERSONAL_WEBSITE' | 'PARENT' | 'CHILD' | 'TEAM' | 'ABOUT' | 'PORTFOLIO' | 'FUNDS' | 'FILINGS' | 'NEWS' | 'CONTACT' | 'CAREERS' | 'ESG' | 'STRATEGY' | 'PHILOSOPHY' | 'OTHER';
export type ExtractionStatus = 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'DONE' | 'CONVERTED';
export type AnnotationModuleType = 'Image' | 'Video' | 'Audio' | 'Transcription' | 'Translation';
export type IntakeResolutionType = 'LINK_EXISTING' | 'CREATE_NEW' | 'IGNORE_SIGNAL';

export interface ExtractionSignal {
  id: string;
  type: string;
  source: string;
  content: string;
  aiConfidence: number;
  timestamp: string;
  status: string;
}

export interface AnnotationTask extends Task {
  label_project_id: string;
  asset_id: string;
  data: any;
  annotations: any[];
  suggestedOutput: any;
  module: AnnotationModuleType;
  asset_type: string;
  asset_url: string;
  payload: any;
}

export interface Person {
  id: string;
  tenant_id: string;
  full_name: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone_number?: string;
  phone_extension?: string;
  linkedin_url?: string;
  gender?: string;
  contact_priority?: string;
  verification_status?: string;
  firm_id?: string;
  confidence_score: number;
  current_firm?: string;
  current_title?: string;
  last_seen?: string;
}

export interface ContactLink {
  id: string;
  contact_id: string;
  entity_id: string;
  entity_type: string;
  role_title: string;
  is_active: boolean;
  start_date?: string;
  is_primary_contact?: boolean;
  department?: string;
  asset_classes?: string[];
  decision_maker?: boolean;
  signatory?: boolean;
  link_source?: string;
  link_confidence_score?: number;
}

export interface PersonInference {
  id: string;
  insight: string;
  insight_type?: string;
}

export interface DropdownValue {
  id: string;
  tenant_id: string;
  dataset: string;
  field_key: string;
  value: string;
  label: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

/** Fix: Added missing VelocityBand type */
export type VelocityBand = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

/** Fix: Added missing FirmIntelligenceMetric interface */
export interface FirmIntelligenceMetric {
  entity_id: string;
  entity_name: string;
  entity_type: string;
  activity_status: 'ACTIVE' | 'DORMANT' | 'INACTIVE';
  velocity_band: VelocityBand;
  last_activity_date: string;
  last_activity_type: string;
  website_changes_total: number;
  website_changes_30d: number;
  website_changes_90d: number;
  filings_total: number;
  countries_covered: string[];
  change_velocity_score: number;
  source_reliability_score: number;
  confirmation_rate: number;
  most_active_country: string;
  most_changed_url_type: string;
  least_changed_url_type: string;
  filings_by_year: Record<string, number>;
  avg_days_between_filings: number;
  latest_filing_date: string;
  latest_filing_year: number;
  /** Fix: Added missing days_since_last_update property */
  days_since_last_update: number;
}

/** Fix: Added missing FirmURL interface */
export interface FirmURL {
  id: string;
  entity_id: string;
  url: string;
  url_type: URLType;
  verification_status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  verified_at?: string;
  verified_by?: string;
  tenant_id: string;
  /** Fix: Added missing source_type property */
  source_type: 'AUTO' | 'MANUAL';
}

/** Fix: Added missing EntityFiling interface */
export interface EntityFiling {
  id: string;
  entity_id: string;
  filing_authority: string;
  filing_type: string;
  filing_unique_id: string;
  filing_year: number;
  filing_url: string;
  status: string;
  tenant_id: string;
}

/** Fix: Added missing ExtractionQueueItem interface */
export interface ExtractionQueueItem {
  id: string;
  entity_id: string;
  entity_name: string;
  entity_type: EntityType;
  url: string;
  url_type: string;
  status: ExtractionStatus;
  completed_at?: string;
  change_detected?: boolean;
  tenant_id: string;
}

/** Fix: Added missing ExtractionRun interface */
export interface ExtractionRun {
  id: string;
  batch_id: string;
  started_at: string;
  completed_at?: string;
  status: string;
  tenant_id: string;
}

/** Fix: Added missing ExtractedDataVersion interface */
export interface ExtractedDataVersion {
  id: string;
  version_number: number;
  is_current: boolean;
  extracted_at: string;
  confidence_score: number;
  change_summary?: string;
  payload: any;
}

/** Fix: Added missing EntityDocument interface */
export interface EntityDocument {
  id: string;
  source_name: string;
  source_url: string;
  document_type: string;
  ingestion_method: 'AUTO' | 'MANUAL';
  page_count: number;
  last_updated: string;
  current_hash?: string;
  extracted_text?: string;
  version_number?: number;
  tenant_id: string;
}

/** Fix: Added missing EntityDocumentVersion interface */
export interface EntityDocumentVersion {
  id: string;
  document_id: string;
  content_hash: string;
  created_at: string;
  version_number: number;
}

/** Fix: Added missing EntityDocumentDiff interface */
export interface EntityDocumentDiff {
  id: string;
  document_id: string;
  change_summary: string;
  created_at: string;
  added_text?: string;
  removed_text?: string;
}

/** Fix: Added missing EntityDocumentIntelligence interface */
export interface EntityDocumentIntelligence {
  id: string;
  document_id: string;
  insight_type: string;
  insight: string;
  insight_text?: string;
  confidence_score: number;
  created_at: string;
  approval_status: 'PENDING' | 'APPROVED' | 'REJECTED';
  status?: string; 
  diff_id?: string;
}

/** Fix: Added missing ApprovalQueueItem interface */
export interface ApprovalQueueItem extends EntityDocumentIntelligence {
  diff_preview?: string;
}

/** Fix: Added missing SchedulerJob interface */
export interface SchedulerJob {
  id: string;
  entity_id: string;
  source_url: string;
  document_type: 'WEBSITE' | 'PDF' | 'FILING';
  frequency_minutes: number;
  is_active: boolean;
  job_name?: string;
  tenant_id: string;
}

/** Fix: Added missing UsageLedger interface */
export interface UsageLedger {
  id: string;
  usage_type: string;
  units: number;
  unit_type: string;
  document_id?: string;
  created_at: string;
  tenant_id: string;
}

// --- TRACE PROTOCOL (FOOTPRINT) ---

export interface UserFootprint {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  tenant_id: string;
  tenant_name: string;
  login_at: string;
  logout_at: string | null;
  duration_minutes: number | null;
  navigation_path: string[]; // List of views visited
  ip_address: string;
  device_signature: string;
  status: 'online' | 'offline';
}