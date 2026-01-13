
export const TENANT_NAME = "LabelNest";

export enum EntityType {
  LP = 'LP',
  GP = 'GP',
  FUND = 'Fund',
  PORTCO = 'PortCo',
  SERVICE_PROVIDER = 'Service Provider',
  CONTACT = 'Contact',
  DEAL = 'Deal'
}

export enum ProjectType {
  DOC = 'DOC',
  IMAGE = 'IMAGE',
  AUDIO = 'AUDIO',
  VIDEO = 'VIDEO',
  TEXT = 'TEXT',
  TRANSLATION = 'TRANSLATION',
  TRANSCRIPTION = 'TRANSCRIPTION'
}

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  RESEARCHER = 'researcher',
  VIEWER = 'viewer',
  QA_SPECIALIST = 'qa_specialist'
}

export type UserStatus = 'pending' | 'active' | 'disabled';
export type EntityStatus = 'intake' | 'active' | 'rejected' | 'Pending' | 'Stale' | 'QA_PENDING';

export type LocationRole = 'operating' | 'focus' | 'office' | 'mandate';

export interface EntityLocationMap {
  entity_type: EntityType;
  entity_id: string;
  location_id: string;
  role: LocationRole;
}

// Added missing LocationRecord type
export interface LocationRecord {
  id: string;
  name: string;
  type: 'country' | 'state' | 'city';
  parent_id?: string;
}

export interface Project {
  id: string;
  name: string;
  tenant_id: string;
  status: string;
  created_at: string;
  project_type: ProjectType;
  project_instructions: string;
  schema_config?: Record<string, any>;
}

export interface AnnotationValue {
  field_id: string;
  label: string;
  ai_value: any;
  human_value: any;
  final_value: any;
  confidence: number;
  metadata?: any;
}

export interface AnnotationTask {
  id: string;
  signalId: string;
  projectId: string;
  tenant_id: string;
  type: 'ENTITY_EXTRACTION' | 'VERIFICATION' | 'ENRICHMENT' | 'QA_CORRECTION' | 'DISPUTE_RESOLUTION';
  data: {
    asset_url?: string;
    content?: string;
    source_text?: string;
    target_lang?: string;
    audio_segments?: any[];
    [key: string]: any;
  };
  annotations: AnnotationValue[];
  status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'DISPUTED';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  assigned_to?: string;
  suggestedOutput?: any[];
}

// Added missing ExtractionSignal type
export interface ExtractionSignal {
  id: string;
  content: string;
  source: string;
  type: string;
  aiConfidence: number;
  timestamp: string;
}

export interface Entity {
  id: string;
  tenant_id: string;
  project_id: string;
  city_id?: string;
  state_id?: string;
  country_id?: string;
  type: EntityType;
  name: string;
  details: Record<string, any>;
  lastVerified: string;
  status: EntityStatus;
  tags: string[];
  source?: 'outreach' | 'news' | 'manual' | 'ai' | 'import';
  confidence?: ConfidenceScore;
  coverage?: EntityLocationMap[];
}

export interface EntitySignalLink {
  id: string;
  entity_id: string;
  news_id: string;
  linked_at: string;
  linked_by: string; // References UserProfile.id
  relevance_summary?: string;
}

export interface EntityAuditLog {
  id: string;
  entity_id: string;
  user_id: string; // References UserProfile.id
  action: 'create' | 'update' | 'verify' | 'link_signal' | 'promote' | 'reject';
  change_summary: string;
  timestamp: string;
}

export interface ConfidenceScore {
  object_type: 'field' | 'record' | 'entity' | 'dataset' | 'portfolio';
  object_id: string;
  coverage: number;
  accuracy: number;
  risk_factor: number;
  freshness_factor: number;
  score: number;
  last_verified_at: string;
}

export interface UserPermission {
  id?: string;
  profile_id: string; // Pivoted from user_id to profile_id
  tenant_name: string;
  project_id: string;
  module: string;
  can_read: boolean;
  can_write: boolean;
}

export interface UserProfile {
  id: string; // Real Person ID (Source of Truth)
  user_id: string | null; // Auth Link (Optional for shadow users)
  email: string;
  name: string;
  role: UserRole;
  tenant_name: string;
  tenant_id: string;
  status: UserStatus;
  permissions: UserPermission[];
  created_at?: string;
}

export interface UserClearance {
  id: string; // Email
  auth_user_id: string | null;
  email: string;
  full_name: string;
  tenant_name: string;
  tenant_id?: string;
  status: 'pending' | 'approved' | 'rejected';
  requested_at: string;
}

export interface QAItem {
  id: string;
  tenant_id: string | null;
  project_id: string;
  module: string;
  entity_type: string;
  entity_id: string;
  analyst_id: string; // References UserProfile.id
  status: QAStatus;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  sampled_at: string;
}

export interface QAResult {
  id: string;
  qa_item_id: string;
  field_name: string;
  ai_value: any;
  analyst_value: any;
  qa_value: any;
  status: 'PASS' | 'FAIL' | 'EDIT_PASS';
  weight: number;
  comment?: string;
}

export type QAStatus = 'PENDING' | 'PASSED' | 'FAILED' | 'PARTIAL';
export type NewsStatus = 'PENDING' | 'COVERED' | 'REJECTED' | 'PUBLISHED' | 'UNPROCESSED';
export type EventType = 'DEAL' | 'FUNDRAISE' | 'M&A' | 'FUND_LAUNCH' | 'REGULATION' | 'HIRING' | 'FINANCIALS';

export interface NewsArticle {
  id: string;
  headline: string;
  publish_date: string;
  url: string;
  source_name: string;
  status?: NewsStatus;
  relevance?: boolean;
  relevance_score?: number;
  duplicate_group_id?: string;
  event_type?: EventType;
  assigned_to?: string; // References UserProfile.id
  raw_text?: string;
}

// Added missing Outreach types
export type OutreachStatus = 'new' | 'sent' | 'replied' | 'follow-up' | 'closed';

export interface OutreachTarget {
  id: string;
  firm_name: string;
  contact_name?: string;
  email: string;
  trigger: string;
  recipient_type: 'Individual' | 'Firm';
  confidence: number;
  status: OutreachStatus;
  last_contact_date?: string;
  tenant_id: string;
}

export interface OutreachTemplate {
  id: string;
  name: string;
  subject: string;
  header: string;
  body: string;
  footer: string;
  signature: string;
}

export interface OutreachIdentity {
  id: string;
  tenant_id: string;
  name: string;
  email: string;
  provider: 'Outlook' | 'Gmail';
  status: 'active' | 'inactive';
}

export const CANONICAL_MODULES = {
  DATA_DOMAINS: ['entities_gp', 'entities_lp', 'entities_fund', 'entities_portfolio_company', 'entities_contacts', 'entities_service_provider', 'entities_deals'],
  DATA_PRODUCTION: ['annotations', 'news_review', 'extraction_signals']
};
