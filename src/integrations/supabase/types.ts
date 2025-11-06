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
          total_tokens: number | null
          tpc_snapshot: number | null
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
          total_tokens?: number | null
          tpc_snapshot?: number | null
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
          total_tokens?: number | null
          tpc_snapshot?: number | null
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
            foreignKeyName: "fk_workspace"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      copies: {
        Row: {
          copy_count: number | null
          copy_type: string | null
          created_at: string
          created_by: string
          folder_id: string | null
          id: string
          is_public: boolean | null
          is_template: boolean | null
          project_id: string | null
          public_password: string | null
          sessions: Json
          show_in_discover: boolean | null
          status: string | null
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          copy_count?: number | null
          copy_type?: string | null
          created_at?: string
          created_by: string
          folder_id?: string | null
          id?: string
          is_public?: boolean | null
          is_template?: boolean | null
          project_id?: string | null
          public_password?: string | null
          sessions?: Json
          show_in_discover?: boolean | null
          status?: string | null
          title?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          copy_count?: number | null
          copy_type?: string | null
          created_at?: string
          created_by?: string
          folder_id?: string | null
          id?: string
          is_public?: boolean | null
          is_template?: boolean | null
          project_id?: string | null
          public_password?: string | null
          sessions?: Json
          show_in_discover?: boolean | null
          status?: string | null
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
          created_at: string | null
          created_by: string
          id: string
          keywords: string[] | null
          name: string
          offers: Json | null
          sector: string | null
          updated_at: string | null
          voice_tones: string[] | null
          workspace_id: string
        }
        Insert: {
          audience_segments?: Json | null
          brand_name?: string | null
          brand_personality?: string[] | null
          central_purpose?: string | null
          created_at?: string | null
          created_by: string
          id?: string
          keywords?: string[] | null
          name: string
          offers?: Json | null
          sector?: string | null
          updated_at?: string | null
          voice_tones?: string[] | null
          workspace_id: string
        }
        Update: {
          audience_segments?: Json | null
          brand_name?: string | null
          brand_personality?: string[] | null
          central_purpose?: string | null
          created_at?: string | null
          created_by?: string
          id?: string
          keywords?: string[] | null
          name?: string
          offers?: Json | null
          sector?: string | null
          updated_at?: string | null
          voice_tones?: string[] | null
          workspace_id?: string
        }
        Relationships: [
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
      system_settings: {
        Row: {
          created_at: string | null
          disable_signup: boolean
          favicon_url: string | null
          id: string
          logo_dark_url: string | null
          logo_light_url: string | null
          maintenance_mode: boolean
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
          system_description?: string | null
          system_name?: string
          updated_at?: string | null
        }
        Relationships: []
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
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_credits: {
        Row: {
          balance: number
          created_at: string
          id: string
          total_added: number
          total_used: number
          updated_at: string
          workspace_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          total_added?: number
          total_used?: number
          updated_at?: string
          workspace_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          total_added?: number
          total_used?: number
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
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
      workspaces: {
        Row: {
          avatar_url: string | null
          created_at: string
          created_by: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          created_by: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
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
      [_ in never]: never
    }
    Functions: {
      add_workspace_credits: {
        Args: { amount: number; description?: string; p_workspace_id: string }
        Returns: Json
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
    }
    Enums: {
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
      system_role: ["super_admin", "admin"],
      workspace_role: ["owner", "admin", "editor"],
    },
  },
} as const
