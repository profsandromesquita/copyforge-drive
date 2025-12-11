export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ai_characteristics: {
        Row: {
          ai_instruction: string | null
          category: string
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          label: string
          updated_at: string | null
          value: string
        }
        Insert: {
          ai_instruction?: string | null
          category: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          label: string
          updated_at?: string | null
          value: string
        }
        Update: {
          ai_instruction?: string | null
          category?: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          label?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      ai_generation_history: {
        Row: {
          audience_segment: Json | null
          copy_id: string
          copy_type: string | null
          created_at: string
          created_by: string
          credits_debited: number | null
          generation_category: string | null
          generation_type: string | null
          id: string
          input_tokens: number | null
          model_used: string | null
          multiplier_snapshot: number | null
          offer: Json | null
          original_content: Json | null
          output_tokens: number | null
          parameters: Json | null
          project_identity: Json | null
          prompt: string
          sessions: Json
          system_instruction: Json | null
          system_prompt_model: string | null
          total_tokens: number | null
          tpc_snapshot: number | null
          was_auto_routed: boolean | null
          workspace_id: string
        }
        Insert: {
          audience_segment?: Json | null
          copy_id: string
          copy_type?: string | null
          created_at?: string
          created_by: string
          credits_debited?: number | null
          generation_category?: string | null
          generation_type?: string | null
          id?: string
          input_tokens?: number | null
          model_used?: string | null
          multiplier_snapshot?: number | null
          offer?: Json | null
          original_content?: Json | null
          output_tokens?: number | null
          parameters?: Json | null
          project_identity?: Json | null
          prompt: string
          sessions: Json
          system_instruction?: Json | null
          system_prompt_model?: string | null
          total_tokens?: number | null
          tpc_snapshot?: number | null
          was_auto_routed?: boolean | null
          workspace_id: string
        }
        Update: {
          audience_segment?: Json | null
          copy_id?: string
          copy_type?: string | null
          created_at?: string
          created_by?: string
          credits_debited?: number | null
          generation_category?: string | null
          generation_type?: string | null
          id?: string
          input_tokens?: number | null
          model_used?: string | null
          multiplier_snapshot?: number | null
          offer?: Json | null
          original_content?: Json | null
          output_tokens?: number | null
          parameters?: Json | null
          project_identity?: Json | null
          prompt?: string
          sessions?: Json
          system_instruction?: Json | null
          system_prompt_model?: string | null
          total_tokens?: number | null
          tpc_snapshot?: number | null
          was_auto_routed?: boolean | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_generation_history_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_copy"
            columns: ["copy_id"]
            isOneToOne: false
            referencedRelation: "copies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_copy"
            columns: ["copy_id"]
            isOneToOne: false
            referencedRelation: "public_copies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_gen_history_copy"
            columns: ["copy_id"]
            isOneToOne: false
            referencedRelation: "copies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_gen_history_copy"
            columns: ["copy_id"]
            isOneToOne: false
            referencedRelation: "public_copies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_gen_history_creator"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_gen_history_workspace"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_workspace"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_prompt_history: {
        Row: {
          change_reason: string | null
          created_at: string | null
          id: string
          modified_by: string | null
          new_prompt: string
          old_prompt: string | null
          prompt_key: string
          template_id: string | null
        }
        Insert: {
          change_reason?: string | null
          created_at?: string | null
          id?: string
          modified_by?: string | null
          new_prompt: string
          old_prompt?: string | null
          prompt_key: string
          template_id?: string | null
        }
        Update: {
          change_reason?: string | null
          created_at?: string | null
          id?: string
          modified_by?: string | null
          new_prompt?: string
          old_prompt?: string | null
          prompt_key?: string
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_prompt_history_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "ai_prompt_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_prompt_history_template"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "ai_prompt_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_prompt_templates: {
        Row: {
          category: string
          created_at: string | null
          current_prompt: string
          default_prompt: string
          description: string
          id: string
          is_active: boolean | null
          is_user_customizable: boolean | null
          last_modified_by: string | null
          name: string
          prompt_key: string
          purpose: string
          system_instructions: string | null
          updated_at: string | null
          user_editable_prompt: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          current_prompt: string
          default_prompt: string
          description: string
          id?: string
          is_active?: boolean | null
          is_user_customizable?: boolean | null
          last_modified_by?: string | null
          name: string
          prompt_key: string
          purpose: string
          system_instructions?: string | null
          updated_at?: string | null
          user_editable_prompt?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          current_prompt?: string
          default_prompt?: string
          description?: string
          id?: string
          is_active?: boolean | null
          is_user_customizable?: boolean | null
          last_modified_by?: string | null
          name?: string
          prompt_key?: string
          purpose?: string
          system_instructions?: string | null
          updated_at?: string | null
          user_editable_prompt?: string | null
        }
        Relationships: []
      }
      copies: {
        Row: {
          copy_count: number | null
          copy_emotional_focus: string | null
          copy_framework: string | null
          copy_objective: string | null
          copy_styles: string[] | null
          copy_type: string | null
          created_at: string
          created_by: string
          folder_id: string | null
          generated_system_prompt: string | null
          id: string
          is_public: boolean | null
          is_template: boolean | null
          likes_count: number | null
          platform: string | null
          project_id: string | null
          public_password: string | null
          selected_audience_id: string | null
          selected_methodology_id: string | null
          selected_offer_id: string | null
          sessions: Json
          show_in_discover: boolean | null
          status: string | null
          system_instruction: Json | null
          system_prompt_context_hash: string | null
          system_prompt_generated_at: string | null
          system_prompt_model: string | null
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          copy_count?: number | null
          copy_emotional_focus?: string | null
          copy_framework?: string | null
          copy_objective?: string | null
          copy_styles?: string[] | null
          copy_type?: string | null
          created_at?: string
          created_by: string
          folder_id?: string | null
          generated_system_prompt?: string | null
          id?: string
          is_public?: boolean | null
          is_template?: boolean | null
          likes_count?: number | null
          platform?: string | null
          project_id?: string | null
          public_password?: string | null
          selected_audience_id?: string | null
          selected_methodology_id?: string | null
          selected_offer_id?: string | null
          sessions?: Json
          show_in_discover?: boolean | null
          status?: string | null
          system_instruction?: Json | null
          system_prompt_context_hash?: string | null
          system_prompt_generated_at?: string | null
          system_prompt_model?: string | null
          title?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          copy_count?: number | null
          copy_emotional_focus?: string | null
          copy_framework?: string | null
          copy_objective?: string | null
          copy_styles?: string[] | null
          copy_type?: string | null
          created_at?: string
          created_by?: string
          folder_id?: string | null
          generated_system_prompt?: string | null
          id?: string
          is_public?: boolean | null
          is_template?: boolean | null
          likes_count?: number | null
          platform?: string | null
          project_id?: string | null
          public_password?: string | null
          selected_audience_id?: string | null
          selected_methodology_id?: string | null
          selected_offer_id?: string | null
          sessions?: Json
          show_in_discover?: boolean | null
          status?: string | null
          system_instruction?: Json | null
          system_prompt_context_hash?: string | null
          system_prompt_generated_at?: string | null
          system_prompt_model?: string | null
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "copies_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "copies_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "copies_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "copies_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_copies_creator"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_copies_folder"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_copies_workspace"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      copy_chat_messages: {
        Row: {
          content: string
          copy_id: string
          created_at: string
          id: string
          metadata: Json | null
          role: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          content: string
          copy_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role: string
          user_id: string
          workspace_id: string
        }
        Update: {
          content?: string
          copy_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "copy_chat_messages_copy_id_fkey"
            columns: ["copy_id"]
            isOneToOne: false
            referencedRelation: "copies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "copy_chat_messages_copy_id_fkey"
            columns: ["copy_id"]
            isOneToOne: false
            referencedRelation: "public_copies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "copy_chat_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "copy_chat_messages_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_chat_messages_copy"
            columns: ["copy_id"]
            isOneToOne: false
            referencedRelation: "copies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_chat_messages_copy"
            columns: ["copy_id"]
            isOneToOne: false
            referencedRelation: "public_copies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_chat_messages_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_chat_messages_workspace"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      copy_likes: {
        Row: {
          copy_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          copy_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          copy_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "copy_likes_copy_id_fkey"
            columns: ["copy_id"]
            isOneToOne: false
            referencedRelation: "copies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "copy_likes_copy_id_fkey"
            columns: ["copy_id"]
            isOneToOne: false
            referencedRelation: "public_copies"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_config: {
        Row: {
          base_tpc_gemini: number
          cost_limit_pct: number
          id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          base_tpc_gemini?: number
          cost_limit_pct?: number
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          base_tpc_gemini?: number
          cost_limit_pct?: number
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "credit_config_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_credit_config_updater"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_config_history: {
        Row: {
          changed_by: string
          cost_limit_pct_new: number
          cost_limit_pct_old: number
          created_at: string
          id: string
        }
        Insert: {
          changed_by: string
          cost_limit_pct_new: number
          cost_limit_pct_old: number
          created_at?: string
          id?: string
        }
        Update: {
          changed_by?: string
          cost_limit_pct_new?: number
          cost_limit_pct_old?: number
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_config_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_config_history_changer"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_rollover_history: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          original_credits: number
          rolled_credits: number
          rollover_percentage: number
          subscription_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          original_credits: number
          rolled_credits: number
          rollover_percentage: number
          subscription_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          original_credits?: number
          rolled_credits?: number
          rollover_percentage?: number
          subscription_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_rollover_history_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "workspace_subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_rollover_history_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_rollover_subscription"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "workspace_subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_rollover_workspace"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_transactions: {
        Row: {
          amount: number
          balance_after: number
          balance_before: number
          cost_limit_snapshot: number | null
          created_at: string
          description: string | null
          generation_id: string | null
          id: string
          input_tokens: number | null
          model_used: string | null
          multiplier_snapshot: number | null
          output_tokens: number | null
          tokens_used: number | null
          tpc_snapshot: number | null
          transaction_type: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          balance_before: number
          cost_limit_snapshot?: number | null
          created_at?: string
          description?: string | null
          generation_id?: string | null
          id?: string
          input_tokens?: number | null
          model_used?: string | null
          multiplier_snapshot?: number | null
          output_tokens?: number | null
          tokens_used?: number | null
          tpc_snapshot?: number | null
          transaction_type: string
          user_id: string
          workspace_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          balance_before?: number
          cost_limit_snapshot?: number | null
          created_at?: string
          description?: string | null
          generation_id?: string | null
          id?: string
          input_tokens?: number | null
          model_used?: string | null
          multiplier_snapshot?: number | null
          output_tokens?: number | null
          tokens_used?: number | null
          tpc_snapshot?: number | null
          transaction_type?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_generation_id_fkey"
            columns: ["generation_id"]
            isOneToOne: false
            referencedRelation: "ai_generation_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_transactions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_transactions_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_transactions_workspace"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      folders: {
        Row: {
          created_at: string | null
          created_by: string
          id: string
          name: string
          parent_id: string | null
          project_id: string | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          created_by: string
          id?: string
          name: string
          parent_id?: string | null
          project_id?: string | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string
          id?: string
          name?: string
          parent_id?: string | null
          project_id?: string | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_folders_creator"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_folders_parent"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_folders_workspace"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "folders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "folders_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations: {
        Row: {
          config: Json | null
          created_at: string | null
          description: string | null
          icon_url: string | null
          id: string
          is_enabled: boolean
          metadata: Json | null
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          description?: string | null
          icon_url?: string | null
          id?: string
          is_enabled?: boolean
          metadata?: Json | null
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          description?: string | null
          icon_url?: string | null
          id?: string
          is_enabled?: boolean
          metadata?: Json | null
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      model_multipliers: {
        Row: {
          display_name: string
          id: string
          is_baseline: boolean
          model_name: string
          multiplier: number
          updated_at: string
        }
        Insert: {
          display_name: string
          id?: string
          is_baseline?: boolean
          model_name: string
          multiplier?: number
          updated_at?: string
        }
        Update: {
          display_name?: string
          id?: string
          is_baseline?: boolean
          model_name?: string
          multiplier?: number
          updated_at?: string
        }
        Relationships: []
      }
      model_routing_config: {
        Row: {
          available_models: string[]
          copy_type: string
          copy_type_label: string
          created_at: string
          default_model: string
          description: string | null
          id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          available_models?: string[]
          copy_type: string
          copy_type_label: string
          created_at?: string
          default_model: string
          description?: string | null
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          available_models?: string[]
          copy_type?: string
          copy_type_label?: string
          created_at?: string
          default_model?: string
          description?: string | null
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_routing_config_updater"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "model_routing_config_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      model_routing_history: {
        Row: {
          changed_at: string
          changed_by: string | null
          copy_type: string
          id: string
          new_model: string
          old_model: string
          reason: string | null
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          copy_type: string
          id?: string
          new_model: string
          old_model: string
          reason?: string | null
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          copy_type?: string
          id?: string
          new_model?: string
          old_model?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_routing_history_changer"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "model_routing_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_gateways: {
        Row: {
          config: Json
          created_at: string
          id: string
          integration_id: string
          is_active: boolean
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          config?: Json
          created_at?: string
          id?: string
          integration_id: string
          is_active?: boolean
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          integration_id?: string
          is_active?: boolean
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_gateways_integration"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_gateways_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_gateways_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_offers: {
        Row: {
          billing_period_unit: string
          billing_period_value: number
          checkout_url: string
          created_at: string | null
          display_order: number | null
          gateway_offer_id: string
          id: string
          is_active: boolean | null
          name: string
          payment_gateway_id: string
          plan_id: string
          price: number
          updated_at: string | null
        }
        Insert: {
          billing_period_unit: string
          billing_period_value: number
          checkout_url: string
          created_at?: string | null
          display_order?: number | null
          gateway_offer_id: string
          id?: string
          is_active?: boolean | null
          name: string
          payment_gateway_id: string
          plan_id: string
          price: number
          updated_at?: string | null
        }
        Update: {
          billing_period_unit?: string
          billing_period_value?: number
          checkout_url?: string
          created_at?: string | null
          display_order?: number | null
          gateway_offer_id?: string
          id?: string
          is_active?: boolean | null
          name?: string
          payment_gateway_id?: string
          plan_id?: string
          price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_offers_gateway"
            columns: ["payment_gateway_id"]
            isOneToOne: false
            referencedRelation: "payment_gateways"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_offers_plan"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_offers_payment_gateway_id_fkey"
            columns: ["payment_gateway_id"]
            isOneToOne: false
            referencedRelation: "payment_gateways"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_offers_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          cep: string | null
          city: string | null
          complement: string | null
          cpf: string | null
          created_at: string
          email: string
          id: string
          name: string
          neighborhood: string | null
          number: string | null
          occupation: string | null
          onboarding_completed: boolean | null
          onboarding_current_step: number | null
          onboarding_custom_occupation: string | null
          onboarding_project_data: Json | null
          onboarding_project_id: string | null
          phone: string | null
          state: string | null
          street: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          cep?: string | null
          city?: string | null
          complement?: string | null
          cpf?: string | null
          created_at?: string
          email: string
          id: string
          name: string
          neighborhood?: string | null
          number?: string | null
          occupation?: string | null
          onboarding_completed?: boolean | null
          onboarding_current_step?: number | null
          onboarding_custom_occupation?: string | null
          onboarding_project_data?: Json | null
          onboarding_project_id?: string | null
          phone?: string | null
          state?: string | null
          street?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          cep?: string | null
          city?: string | null
          complement?: string | null
          cpf?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          neighborhood?: string | null
          number?: string | null
          occupation?: string | null
          onboarding_completed?: boolean | null
          onboarding_current_step?: number | null
          onboarding_custom_occupation?: string | null
          onboarding_project_data?: Json | null
          onboarding_project_id?: string | null
          phone?: string | null
          state?: string | null
          street?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          audience_segments: Json | null
          brand_name: string | null
          brand_personality: string[] | null
          central_purpose: string | null
          color_palette: Json | null
          created_at: string | null
          created_by: string
          id: string
          imagery_style: string | null
          keywords: string[] | null
          methodology: Json | null
          name: string
          offers: Json | null
          sector: string | null
          updated_at: string | null
          visual_style: string[] | null
          voice_tones: string[] | null
          workspace_id: string
        }
        Insert: {
          audience_segments?: Json | null
          brand_name?: string | null
          brand_personality?: string[] | null
          central_purpose?: string | null
          color_palette?: Json | null
          created_at?: string | null
          created_by: string
          id?: string
          imagery_style?: string | null
          keywords?: string[] | null
          methodology?: Json | null
          name: string
          offers?: Json | null
          sector?: string | null
          updated_at?: string | null
          visual_style?: string[] | null
          voice_tones?: string[] | null
          workspace_id: string
        }
        Update: {
          audience_segments?: Json | null
          brand_name?: string | null
          brand_personality?: string[] | null
          central_purpose?: string | null
          color_palette?: Json | null
          created_at?: string | null
          created_by?: string
          id?: string
          imagery_style?: string | null
          keywords?: string[] | null
          methodology?: Json | null
          name?: string
          offers?: Json | null
          sector?: string | null
          updated_at?: string | null
          visual_style?: string[] | null
          voice_tones?: string[] | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_projects_creator"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_projects_workspace"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      signup_errors: {
        Row: {
          created_at: string | null
          error_detail: string | null
          error_message: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          error_detail?: string | null
          error_message?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          error_detail?: string | null
          error_message?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          annual_price: number
          checkout_url_annual: string | null
          checkout_url_monthly: string | null
          copy_ai_enabled: boolean | null
          created_at: string | null
          credits_per_month: number
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          max_copies: number | null
          max_projects: number | null
          monthly_price: number
          name: string
          payment_gateway_id: string | null
          rollover_days: number | null
          rollover_enabled: boolean | null
          rollover_percentage: number | null
          slug: string
          updated_at: string | null
          uses_legacy_pricing: boolean | null
        }
        Insert: {
          annual_price?: number
          checkout_url_annual?: string | null
          checkout_url_monthly?: string | null
          copy_ai_enabled?: boolean | null
          created_at?: string | null
          credits_per_month?: number
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          max_copies?: number | null
          max_projects?: number | null
          monthly_price?: number
          name: string
          payment_gateway_id?: string | null
          rollover_days?: number | null
          rollover_enabled?: boolean | null
          rollover_percentage?: number | null
          slug: string
          updated_at?: string | null
          uses_legacy_pricing?: boolean | null
        }
        Update: {
          annual_price?: number
          checkout_url_annual?: string | null
          checkout_url_monthly?: string | null
          copy_ai_enabled?: boolean | null
          created_at?: string | null
          credits_per_month?: number
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          max_copies?: number | null
          max_projects?: number | null
          monthly_price?: number
          name?: string
          payment_gateway_id?: string | null
          rollover_days?: number | null
          rollover_enabled?: boolean | null
          rollover_percentage?: number | null
          slug?: string
          updated_at?: string | null
          uses_legacy_pricing?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_plans_payment_gateway_id_fkey"
            columns: ["payment_gateway_id"]
            isOneToOne: false
            referencedRelation: "payment_gateways"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          created_at: string | null
          disable_signup: boolean
          favicon_url: string | null
          id: string
          logo_dark_url: string | null
          logo_light_url: string | null
          maintenance_mode: boolean
          max_free_workspaces_per_user: number
          system_description: string | null
          system_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          disable_signup?: boolean
          favicon_url?: string | null
          id?: string
          logo_dark_url?: string | null
          logo_light_url?: string | null
          maintenance_mode?: boolean
          max_free_workspaces_per_user?: number
          system_description?: string | null
          system_name?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          disable_signup?: boolean
          favicon_url?: string | null
          id?: string
          logo_dark_url?: string | null
          logo_light_url?: string | null
          maintenance_mode?: boolean
          max_free_workspaces_per_user?: number
          system_description?: string | null
          system_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_prompt_customizations: {
        Row: {
          created_at: string | null
          custom_prompt: string
          id: string
          is_active: boolean | null
          prompt_key: string
          updated_at: string | null
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          custom_prompt: string
          id?: string
          is_active?: boolean | null
          prompt_key: string
          updated_at?: string | null
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          custom_prompt?: string
          id?: string
          is_active?: boolean | null
          prompt_key?: string
          updated_at?: string | null
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_prompt_custom_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_prompt_custom_workspace"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_prompt_customizations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["system_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["system_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["system_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_roles_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_logs: {
        Row: {
          created_at: string
          error_message: string | null
          event_category: string | null
          event_type: string
          headers: Json | null
          id: string
          integration_slug: string
          payload: Json
          processed_at: string | null
          status: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          event_category?: string | null
          event_type: string
          headers?: Json | null
          id?: string
          integration_slug: string
          payload: Json
          processed_at?: string | null
          status: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          event_category?: string | null
          event_type?: string
          headers?: Json | null
          id?: string
          integration_slug?: string
          payload?: Json
          processed_at?: string | null
          status?: string
        }
        Relationships: []
      }
      workspace_credits: {
        Row: {
          balance: number
          created_at: string
          id: string
          low_credit_alert_shown: boolean | null
          low_credit_threshold: number | null
          total_added: number
          total_used: number
          updated_at: string
          workspace_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          low_credit_alert_shown?: boolean | null
          low_credit_threshold?: number | null
          total_added?: number
          total_used?: number
          updated_at?: string
          workspace_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          low_credit_alert_shown?: boolean | null
          low_credit_threshold?: number | null
          total_added?: number
          total_used?: number
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_credits_workspace"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_credits_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_invitations: {
        Row: {
          created_at: string | null
          email: string
          expires_at: string | null
          id: string
          invited_by: string
          role: Database["public"]["Enums"]["workspace_role"]
          status: string | null
          token: string
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          expires_at?: string | null
          id?: string
          invited_by: string
          role: Database["public"]["Enums"]["workspace_role"]
          status?: string | null
          token?: string
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          email?: string
          expires_at?: string | null
          id?: string
          invited_by?: string
          role?: Database["public"]["Enums"]["workspace_role"]
          status?: string | null
          token?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_invitations_inviter"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_invitations_workspace"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_invitations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_invoices: {
        Row: {
          amount: number
          billing_period_end: string
          billing_period_start: string
          created_at: string
          currency: string
          due_date: string
          external_payment_id: string | null
          id: string
          invoice_number: string
          line_items: Json
          metadata: Json | null
          paid_at: string | null
          payment_id: string | null
          payment_method: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          subscription_id: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          amount: number
          billing_period_end: string
          billing_period_start: string
          created_at?: string
          currency?: string
          due_date: string
          external_payment_id?: string | null
          id?: string
          invoice_number: string
          line_items?: Json
          metadata?: Json | null
          paid_at?: string | null
          payment_id?: string | null
          payment_method?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subscription_id?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          amount?: number
          billing_period_end?: string
          billing_period_start?: string
          created_at?: string
          currency?: string
          due_date?: string
          external_payment_id?: string | null
          id?: string
          invoice_number?: string
          line_items?: Json
          metadata?: Json | null
          paid_at?: string | null
          payment_id?: string | null
          payment_method?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subscription_id?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_invoices_subscription"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "workspace_subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_invoices_workspace"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_invoices_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "workspace_subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_invoices_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          id: string
          invited_at: string
          invited_by: string | null
          role: Database["public"]["Enums"]["workspace_role"]
          user_id: string
          workspace_id: string
        }
        Insert: {
          id?: string
          invited_at?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["workspace_role"]
          user_id: string
          workspace_id: string
        }
        Update: {
          id?: string
          invited_at?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["workspace_role"]
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_members_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_members_workspace"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_subscriptions: {
        Row: {
          billing_cycle: Database["public"]["Enums"]["billing_cycle_type"]
          cancelled_at: string | null
          copies_count: number | null
          created_at: string | null
          current_copy_ai_enabled: boolean | null
          current_max_copies: number | null
          current_max_projects: number | null
          current_period_end: string | null
          current_period_start: string | null
          external_subscription_id: string | null
          id: string
          payment_gateway: string | null
          plan_id: string
          plan_offer_id: string | null
          projects_count: number | null
          started_at: string | null
          status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          billing_cycle: Database["public"]["Enums"]["billing_cycle_type"]
          cancelled_at?: string | null
          copies_count?: number | null
          created_at?: string | null
          current_copy_ai_enabled?: boolean | null
          current_max_copies?: number | null
          current_max_projects?: number | null
          current_period_end?: string | null
          current_period_start?: string | null
          external_subscription_id?: string | null
          id?: string
          payment_gateway?: string | null
          plan_id: string
          plan_offer_id?: string | null
          projects_count?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          billing_cycle?: Database["public"]["Enums"]["billing_cycle_type"]
          cancelled_at?: string | null
          copies_count?: number | null
          created_at?: string | null
          current_copy_ai_enabled?: boolean | null
          current_max_copies?: number | null
          current_max_projects?: number | null
          current_period_end?: string | null
          current_period_start?: string | null
          external_subscription_id?: string | null
          id?: string
          payment_gateway?: string | null
          plan_id?: string
          plan_offer_id?: string | null
          projects_count?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_subscriptions_offer"
            columns: ["plan_offer_id"]
            isOneToOne: false
            referencedRelation: "plan_offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_subscriptions_offer"
            columns: ["plan_offer_id"]
            isOneToOne: false
            referencedRelation: "public_plan_offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_subscriptions_plan"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_subscriptions_workspace"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_subscriptions_plan_offer_id_fkey"
            columns: ["plan_offer_id"]
            isOneToOne: false
            referencedRelation: "plan_offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_subscriptions_plan_offer_id_fkey"
            columns: ["plan_offer_id"]
            isOneToOne: false
            referencedRelation: "public_plan_offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_subscriptions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          avatar_url: string | null
          created_at: string
          created_by: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          created_by: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          created_by?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_workspaces_creator"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspaces_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      public_copies: {
        Row: {
          copy_count: number | null
          copy_type: string | null
          created_at: string | null
          created_by: string | null
          creator_avatar_url: string | null
          creator_name: string | null
          id: string | null
          is_public: boolean | null
          likes_count: number | null
          public_password: string | null
          sessions: Json | null
          show_in_discover: boolean | null
          title: string | null
        }
        Relationships: [
          {
            foreignKeyName: "copies_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_copies_creator"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      public_plan_offers: {
        Row: {
          billing_period_unit: string | null
          billing_period_value: number | null
          checkout_url: string | null
          display_order: number | null
          id: string | null
          is_active: boolean | null
          name: string | null
          plan_id: string | null
          price: number | null
        }
        Insert: {
          billing_period_unit?: string | null
          billing_period_value?: number | null
          checkout_url?: string | null
          display_order?: number | null
          id?: string | null
          is_active?: boolean | null
          name?: string | null
          plan_id?: string | null
          price?: number | null
        }
        Update: {
          billing_period_unit?: string | null
          billing_period_value?: number | null
          checkout_url?: string | null
          display_order?: number | null
          id?: string | null
          is_active?: boolean | null
          name?: string | null
          plan_id?: string | null
          price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_offers_plan"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_offers_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      public_system_settings: {
        Row: {
          disable_signup: boolean | null
          maintenance_mode: boolean | null
        }
        Relationships: []
      }
      webhook_events_summary: {
        Row: {
          event_category: string | null
          event_type: string | null
          failed_events: number | null
          integration_slug: string | null
          last_event_at: string | null
          status: string | null
          successful_events: number | null
          total_events: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      accept_invite_by_token: { Args: { p_token: string }; Returns: Json }
      activate_workspace_after_payment: {
        Args: { p_workspace_id: string }
        Returns: Json
      }
      add_workspace_credits: {
        Args: { amount: number; description?: string; p_workspace_id: string }
        Returns: Json
      }
      admin_sync_all_workspace_limits: { Args: never; Returns: Json }
      auto_fix_orphaned_users: {
        Args: never
        Returns: {
          details: Json
          error_count: number
          fixed_count: number
        }[]
      }
      calculate_credit_debit: {
        Args: { p_model_name: string; tokens_used: number }
        Returns: number
      }
      calculate_tpc_gemini: {
        Args: { cost_limit_pct: number }
        Returns: number
      }
      calculate_tpc_model: {
        Args: { cost_limit_pct: number; p_model_name: string }
        Returns: number
      }
      can_create_free_workspace: { Args: { _user_id: string }; Returns: Json }
      change_workspace_plan: {
        Args: {
          p_payment_id?: string
          p_plan_offer_id: string
          p_workspace_id: string
        }
        Returns: Json
      }
      check_plan_limit: {
        Args: { p_limit_type: string; p_workspace_id: string }
        Returns: Json
      }
      check_workspace_credits: {
        Args: {
          estimated_tokens?: number
          p_model_name?: string
          p_workspace_id: string
        }
        Returns: Json
      }
      create_super_admin: { Args: { user_email: string }; Returns: Json }
      debit_workspace_credits: {
        Args: {
          generation_id: string
          p_input_tokens: number
          p_model_name: string
          p_output_tokens: number
          p_user_id?: string
          p_workspace_id: string
          tokens_used: number
        }
        Returns: Json
      }
      decline_invite_by_token: { Args: { p_token: string }; Returns: Json }
      delete_user_admin: { Args: { p_user_id: string }; Returns: Json }
      delete_workspace_admin: {
        Args: { p_workspace_id: string }
        Returns: Json
      }
      fix_orphaned_users: {
        Args: never
        Returns: {
          action_taken: string
          error_message: string
          success: boolean
          user_email: string
          user_id: string
        }[]
      }
      generate_invoice_number: { Args: never; Returns: string }
      get_workspace_role: {
        Args: { _user_id: string; _workspace_id: string }
        Returns: Database["public"]["Enums"]["workspace_role"]
      }
      has_system_role: {
        Args: {
          _role: Database["public"]["Enums"]["system_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_workspace_role: {
        Args: {
          _role: Database["public"]["Enums"]["workspace_role"]
          _user_id: string
          _workspace_id: string
        }
        Returns: boolean
      }
      has_workspace_role_in: {
        Args: {
          _role: Database["public"]["Enums"]["workspace_role"]
          _user_id: string
          _workspace_id: string
        }
        Returns: boolean
      }
      is_workspace_admin: {
        Args: { _user_id: string; _workspace_id: string }
        Returns: boolean
      }
      is_workspace_member: {
        Args: { _user_id: string; _workspace_id: string }
        Returns: boolean
      }
      process_credit_rollover: {
        Args: { p_workspace_id: string }
        Returns: Json
      }
      sync_workspace_plan_limits: {
        Args: { p_workspace_id?: string }
        Returns: Json
      }
      test_ticto_connection: {
        Args: { p_validation_token: string }
        Returns: Json
      }
      validate_invite_token: { Args: { p_token: string }; Returns: Json }
    }
    Enums: {
      billing_cycle_type: "monthly" | "annual" | "free"
      invoice_status: "pending" | "paid" | "failed" | "cancelled" | "refunded"
      subscription_status:
        | "active"
        | "cancelled"
        | "expired"
        | "past_due"
        | "pending_payment"
      system_role: "super_admin" | "admin"
      workspace_role: "owner" | "admin" | "editor"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      billing_cycle_type: ["monthly", "annual", "free"],
      invoice_status: ["pending", "paid", "failed", "cancelled", "refunded"],
      subscription_status: [
        "active",
        "cancelled",
        "expired",
        "past_due",
        "pending_payment",
      ],
      system_role: ["super_admin", "admin"],
      workspace_role: ["owner", "admin", "editor"],
    },
  },
} as const
