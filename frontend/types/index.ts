export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'SUPER_ADMIN' | 'EDITOR';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export interface Source {
  id: string;
  name: string;
  website_url: string;
  rss_url: string;
  provider_type: string;
  enabled: boolean;
  default_category_id?: string;
  usage_policy: 'METADATA_ONLY' | 'SUMMARY_ALLOWED' | 'LICENSED_REPUBLISH';
  image_policy: 'NOT_ALLOWED' | 'LICENSED' | 'OWNED';
  attribution_required: boolean;
  trust_level: 'MANUAL_REVIEW' | 'AUTO_PUBLISH';
  last_fetched_at?: string;
  last_error?: string;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface ImageAsset {
  id: string;
  filename?: string;
  storage_url: string;
  mime_type?: string;
  file_size?: number;
  width?: number;
  height?: number;
  alt_text?: string;
  caption?: string;
  credit?: string;
  original_source?: string;
  license_type: string;
  license_url?: string;
  created_at: string;
  updated_at?: string;
}

export interface MediaListResponse {
  items: ImageAsset[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  summary?: string;
  content?: string;
  source_id?: string;
  original_url?: string;
  url_hash?: string;
  external_id?: string;
  content_origin: 'ORIGINAL' | 'AGGREGATED' | 'AI_ASSISTED' | 'LICENSED';
  image_id?: string;
  author?: string;
  category_id: string;
  status: 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'REJECTED' | 'SCHEDULED' | 'ARCHIVED';
  published_at?: string;
  scheduled_at?: string;
  view_count: number;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  category?: Category;
  source?: Source;
  image?: ImageAsset;
  tags: Tag[];
}

export interface ArticleListResponse {
  items: Article[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface ProcessingJob {
  id: string;
  job_type: string;
  status: 'QUEUED' | 'RUNNING' | 'SUCCESS' | 'FAILED';
  source_id?: string;
  items_fetched: number;
  items_processed: number;
  items_skipped: number;
  error_message?: string;
  started_at: string;
  completed_at?: string;
  source?: Source;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details?: any;
  ip_address?: string;
  created_at: string;
}

export interface DashboardStats {
  total_articles: number;
  published_today: number;
  pending_review: number;
  drafts: number;
  scheduled: number;
  total_sources: number;
  failed_sources: number;
  articles_this_week: number;
  recent_activity: AuditLog[];
}

export interface HotNewsItem {
  id: string;
  article_id?: string;
  source_url: string;
  title: string;
  slug?: string;
  summary?: string;
  image_url?: string;
  category_slug?: string;
  source_name?: string;
  viral_score: number;
  source_count: number;
  published_at?: string;
  added_at: string;
  expires_at: string;
}

export interface HotNewsResponse {
  items: HotNewsItem[];
  count: number;
  max_items: number;
  remaining_slots: number;
  last_reset_at?: string;
  next_reset_at?: string;
}
