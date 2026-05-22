export type UserRole = "admin" | "pm" | "developer" | "trainee";
export type PromptStatus = "active" | "draft" | "archived";
export type PlanType = "free" | "pro";
export type SubscriptionStatus = "active" | "cancelled" | "past_due";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: PlanType;
  stripe_customer_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  org_id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar_url: string | null;
  api_key: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  slug: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  prompt_count?: number;
}

export interface PromptCategory {
  id: string;
  org_id: string;
  project_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface Prompt {
  id: string;
  project_id: string;
  org_id: string;
  name: string;
  slug: string;
  description: string | null;
  content: string;
  category_id: string | null;
  status: PromptStatus;
  current_version: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  category?: PromptCategory;
}

export interface PromptVersion {
  id: string;
  prompt_id: string;
  version: number;
  content: string;
  change_note: string | null;
  created_by: string;
  created_at: string;
}

export interface PromptLog {
  id: string;
  org_id: string;
  prompt_id: string;
  prompt_slug: string;
  latency_ms: number;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
  status: "success" | "error";
  error_message: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface AbTest {
  id: string;
  org_id: string;
  project_id: string;
  name: string;
  prompt_a_id: string;
  prompt_b_id: string;
  weight_a: number;
  weight_b: number;
  active: boolean;
  created_at: string;
  updated_at: string;
  prompt_a?: Prompt;
  prompt_b?: Prompt;
}

export interface TeamInvitation {
  id: string;
  org_id: string;
  email: string;
  role: UserRole;
  token: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}
