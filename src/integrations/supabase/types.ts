export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string
          email: string
          id: string
          is_admin_root: boolean | null
          password_hash: string
          updated_at: string
          user_type: Database["public"]["Enums"]["admin_user_type"]
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_admin_root?: boolean | null
          password_hash: string
          updated_at?: string
          user_type?: Database["public"]["Enums"]["admin_user_type"]
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_admin_root?: boolean | null
          password_hash?: string
          updated_at?: string
          user_type?: Database["public"]["Enums"]["admin_user_type"]
        }
        Relationships: []
      }
      alert_logs: {
        Row: {
          alert_type: string
          created_at: string
          id: string
          message: string
          recipient: string
          recipient_type: string
          status: string | null
          triggered_by_id: string | null
        }
        Insert: {
          alert_type: string
          created_at?: string
          id?: string
          message: string
          recipient: string
          recipient_type: string
          status?: string | null
          triggered_by_id?: string | null
        }
        Update: {
          alert_type?: string
          created_at?: string
          id?: string
          message?: string
          recipient?: string
          recipient_type?: string
          status?: string | null
          triggered_by_id?: string | null
        }
        Relationships: []
      }
      coupon_codes: {
        Row: {
          category_id: string | null
          code: string
          created_at: string
          description: string | null
          discount_type: string | null
          discount_value: number | null
          id: string
          is_active: boolean | null
          updated_at: string
          usage_limit: number | null
          used_count: number | null
        }
        Insert: {
          category_id?: string | null
          code: string
          created_at?: string
          description?: string | null
          discount_type?: string | null
          discount_value?: number | null
          id?: string
          is_active?: boolean | null
          updated_at?: string
          usage_limit?: number | null
          used_count?: number | null
        }
        Update: {
          category_id?: string | null
          code?: string
          created_at?: string
          description?: string | null
          discount_type?: string | null
          discount_value?: number | null
          id?: string
          is_active?: boolean | null
          updated_at?: string
          usage_limit?: number | null
          used_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "coupon_codes_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "registration_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      cursos: {
        Row: {
          created_at: string
          id: string
          nome_curso: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome_curso: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          nome_curso?: string
          updated_at?: string
        }
        Relationships: []
      }
      event_registrations: {
        Row: {
          amount_paid: number | null
          batch_id: string | null
          card_brand: string | null
          category_id: string | null
          coupon_code: string | null
          created_at: string
          currency: string | null
          curso_id: string | null
          email: string
          full_name: string
          id: string
          installments: number | null
          participant_type: string | null
          payment_method: string | null
          payment_status: string | null
          payment_type: string | null
          stripe_session_id: string | null
          turma_id: string | null
          updated_at: string
        }
        Insert: {
          amount_paid?: number | null
          batch_id?: string | null
          card_brand?: string | null
          category_id?: string | null
          coupon_code?: string | null
          created_at?: string
          currency?: string | null
          curso_id?: string | null
          email: string
          full_name: string
          id?: string
          installments?: number | null
          participant_type?: string | null
          payment_method?: string | null
          payment_status?: string | null
          payment_type?: string | null
          stripe_session_id?: string | null
          turma_id?: string | null
          updated_at?: string
        }
        Update: {
          amount_paid?: number | null
          batch_id?: string | null
          card_brand?: string | null
          category_id?: string | null
          coupon_code?: string | null
          created_at?: string
          currency?: string | null
          curso_id?: string | null
          email?: string
          full_name?: string
          id?: string
          installments?: number | null
          participant_type?: string | null
          payment_method?: string | null
          payment_status?: string | null
          payment_type?: string | null
          stripe_session_id?: string | null
          turma_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "registration_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "registration_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_turma_id_fkey"
            columns: ["turma_id"]
            isOneToOne: false
            referencedRelation: "turmas"
            referencedColumns: ["id"]
          },
        ]
      }
      login_attempts: {
        Row: {
          attempted_at: string
          email: string
          id: string
          ip_address: string | null
          success: boolean
        }
        Insert: {
          attempted_at?: string
          email: string
          id?: string
          ip_address?: string | null
          success?: boolean
        }
        Update: {
          attempted_at?: string
          email?: string
          id?: string
          ip_address?: string | null
          success?: boolean
        }
        Relationships: []
      }
      partners: {
        Row: {
          created_at: string | null
          id: string
          logo: string
          name: string
          sort_order: number | null
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          logo: string
          name: string
          sort_order?: number | null
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          logo?: string
          name?: string
          sort_order?: number | null
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      registration_batches: {
        Row: {
          batch_number: number
          created_at: string
          end_date: string
          id: string
          start_date: string
          updated_at: string
        }
        Insert: {
          batch_number: number
          created_at?: string
          end_date: string
          id?: string
          start_date: string
          updated_at?: string
        }
        Update: {
          batch_number?: number
          created_at?: string
          end_date?: string
          id?: string
          start_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      registration_categories: {
        Row: {
          batch_id: string | null
          category_name: string
          created_at: string
          id: string
          is_exempt: boolean | null
          price_brl: number
          requires_proof: boolean | null
          updated_at: string
        }
        Insert: {
          batch_id?: string | null
          category_name: string
          created_at?: string
          id?: string
          is_exempt?: boolean | null
          price_brl: number
          requires_proof?: boolean | null
          updated_at?: string
        }
        Update: {
          batch_id?: string | null
          category_name?: string
          created_at?: string
          id?: string
          is_exempt?: boolean | null
          price_brl?: number
          requires_proof?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "registration_categories_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "registration_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      registrations: {
        Row: {
          batch_id: string | null
          category_id: string | null
          coupon_code: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          payment_status: string | null
          stripe_session_id: string | null
          updated_at: string
        }
        Insert: {
          batch_id?: string | null
          category_id?: string | null
          coupon_code?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          payment_status?: string | null
          stripe_session_id?: string | null
          updated_at?: string
        }
        Update: {
          batch_id?: string | null
          category_id?: string | null
          coupon_code?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          payment_status?: string | null
          stripe_session_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "registrations_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "registration_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registrations_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "registration_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      schedules: {
        Row: {
          category: string
          created_at: string
          date: string
          description: string | null
          end_time: string
          id: string
          is_published: boolean | null
          is_recorded: boolean | null
          location: string | null
          platform: string | null
          recording_url: string | null
          speaker_name: string | null
          speaker_photo_url: string | null
          start_time: string
          title: string
          type: string
          updated_at: string
          virtual_link: string | null
        }
        Insert: {
          category: string
          created_at?: string
          date: string
          description?: string | null
          end_time: string
          id?: string
          is_published?: boolean | null
          is_recorded?: boolean | null
          location?: string | null
          platform?: string | null
          recording_url?: string | null
          speaker_name?: string | null
          speaker_photo_url?: string | null
          start_time: string
          title: string
          type: string
          updated_at?: string
          virtual_link?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          date?: string
          description?: string | null
          end_time?: string
          id?: string
          is_published?: boolean | null
          is_recorded?: boolean | null
          location?: string | null
          platform?: string | null
          recording_url?: string | null
          speaker_name?: string | null
          speaker_photo_url?: string | null
          start_time?: string
          title?: string
          type?: string
          updated_at?: string
          virtual_link?: string | null
        }
        Relationships: []
      }
      turmas: {
        Row: {
          created_at: string
          id: string
          id_curso: string
          nome_turma: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          id_curso: string
          nome_turma: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          id_curso?: string
          nome_turma?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "turmas_id_curso_fkey"
            columns: ["id_curso"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_user_permission: {
        Args: { user_email: string; permission_type: string; resource: string }
        Returns: boolean
      }
      create_admin_user: {
        Args: {
          user_email: string
          user_password: string
          user_type?: Database["public"]["Enums"]["admin_user_type"]
        }
        Returns: Json
      }
      delete_admin_user: {
        Args: { user_id: string }
        Returns: Json
      }
      generate_daily_report: {
        Args: { report_date?: string }
        Returns: Json
      }
      is_admin_root_user: {
        Args: { user_email: string }
        Returns: boolean
      }
      list_admin_users: {
        Args: Record<PropertyKey, never>
        Returns: {
          user_id: string
          email: string
          user_type: Database["public"]["Enums"]["admin_user_type"]
          is_admin_root: boolean
          created_at: string
        }[]
      }
      request_password_reset: {
        Args: { user_email: string }
        Returns: boolean
      }
      update_admin_user_type: {
        Args: {
          user_id: string
          new_user_type: Database["public"]["Enums"]["admin_user_type"]
        }
        Returns: Json
      }
      validate_coupon: {
        Args: { coupon_code: string }
        Returns: Json
      }
      verify_admin_login: {
        Args: { user_email: string; user_password: string }
        Returns: {
          user_id: string
          email: string
          user_type: Database["public"]["Enums"]["admin_user_type"]
        }[]
      }
    }
    Enums: {
      admin_user_type: "admin" | "editor" | "viewer" | "design" | "admin_root"
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
      admin_user_type: ["admin", "editor", "viewer", "design", "admin_root"],
    },
  },
} as const
