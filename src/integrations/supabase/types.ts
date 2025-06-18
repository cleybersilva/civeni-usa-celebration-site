export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
      coupon_codes: {
        Row: {
          category_id: string | null
          code: string
          created_at: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      request_password_reset: {
        Args: { user_email: string }
        Returns: boolean
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
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
