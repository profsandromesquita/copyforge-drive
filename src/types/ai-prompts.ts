export interface AIPromptTemplate {
  id: string;
  prompt_key: string;
  category: 'generate_copy' | 'optimize_copy' | 'analyze_audience';
  name: string;
  description: string;
  purpose: string;
  default_prompt: string;
  current_prompt: string;
  is_active: boolean;
  last_modified_by?: string;
  created_at: string;
  updated_at: string;
}

export interface AIPromptHistory {
  id: string;
  template_id: string;
  prompt_key: string;
  old_prompt?: string;
  new_prompt: string;
  modified_by?: string;
  change_reason?: string;
  created_at: string;
}

export interface UpdatePromptParams {
  id: string;
  current_prompt: string;
  change_reason?: string;
}
