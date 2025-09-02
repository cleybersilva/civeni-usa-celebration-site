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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_sessions: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          token: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          token?: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          token?: string
        }
        Relationships: []
      }
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
      banner_slides: {
        Row: {
          bg_image: string
          button_link: string
          button_text: string
          created_at: string
          description: string
          id: string
          is_active: boolean
          order_index: number
          subtitle: string
          title: string
          updated_at: string
        }
        Insert: {
          bg_image: string
          button_link: string
          button_text: string
          created_at?: string
          description: string
          id?: string
          is_active?: boolean
          order_index?: number
          subtitle: string
          title: string
          updated_at?: string
        }
        Update: {
          bg_image?: string
          button_link?: string
          button_text?: string
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          order_index?: number
          subtitle?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      civeni_ii_2024_images: {
        Row: {
          alt_text_en: string
          alt_text_es: string
          alt_text_pt: string
          created_at: string
          id: string
          is_active: boolean
          order_index: number
          updated_at: string
          url: string
        }
        Insert: {
          alt_text_en: string
          alt_text_es: string
          alt_text_pt: string
          created_at?: string
          id?: string
          is_active?: boolean
          order_index?: number
          updated_at?: string
          url: string
        }
        Update: {
          alt_text_en?: string
          alt_text_es?: string
          alt_text_pt?: string
          created_at?: string
          id?: string
          is_active?: boolean
          order_index?: number
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      congresso_apresentacao: {
        Row: {
          created_at: string
          descricao_en: string | null
          descricao_es: string | null
          descricao_pt: string
          id: string
          imagem_destaque: string | null
          is_active: boolean
          tema_en: string | null
          tema_es: string | null
          tema_pt: string | null
          titulo_en: string | null
          titulo_es: string | null
          titulo_pt: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          created_at?: string
          descricao_en?: string | null
          descricao_es?: string | null
          descricao_pt: string
          id?: string
          imagem_destaque?: string | null
          is_active?: boolean
          tema_en?: string | null
          tema_es?: string | null
          tema_pt?: string | null
          titulo_en?: string | null
          titulo_es?: string | null
          titulo_pt: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          created_at?: string
          descricao_en?: string | null
          descricao_es?: string | null
          descricao_pt?: string
          id?: string
          imagem_destaque?: string | null
          is_active?: boolean
          tema_en?: string | null
          tema_es?: string | null
          tema_pt?: string | null
          titulo_en?: string | null
          titulo_es?: string | null
          titulo_pt?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      congresso_comite: {
        Row: {
          cargo_en: string | null
          cargo_es: string | null
          cargo_pt: string
          categoria: string
          created_at: string
          foto_url: string | null
          id: string
          instituicao: string
          is_active: boolean
          nome: string
          ordem: number
          updated_at: string
        }
        Insert: {
          cargo_en?: string | null
          cargo_es?: string | null
          cargo_pt: string
          categoria: string
          created_at?: string
          foto_url?: string | null
          id?: string
          instituicao: string
          is_active?: boolean
          nome: string
          ordem?: number
          updated_at?: string
        }
        Update: {
          cargo_en?: string | null
          cargo_es?: string | null
          cargo_pt?: string
          categoria?: string
          created_at?: string
          foto_url?: string | null
          id?: string
          instituicao?: string
          is_active?: boolean
          nome?: string
          ordem?: number
          updated_at?: string
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
      event_category: {
        Row: {
          available_from: string | null
          available_until: string | null
          created_at: string
          created_by: string | null
          currency: string
          description_en: string | null
          description_es: string | null
          description_pt: string | null
          description_tr: string | null
          event_id: string
          id: string
          is_active: boolean
          is_free: boolean
          is_promotional: boolean
          lot_id: string | null
          order_index: number
          price_cents: number | null
          quota_total: number | null
          slug: string
          stripe_price_id: string | null
          stripe_product_id: string | null
          sync_error: string | null
          sync_status: string | null
          title_en: string | null
          title_es: string | null
          title_pt: string
          title_tr: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          available_from?: string | null
          available_until?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          description_en?: string | null
          description_es?: string | null
          description_pt?: string | null
          description_tr?: string | null
          event_id: string
          id?: string
          is_active?: boolean
          is_free?: boolean
          is_promotional?: boolean
          lot_id?: string | null
          order_index?: number
          price_cents?: number | null
          quota_total?: number | null
          slug: string
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          sync_error?: string | null
          sync_status?: string | null
          title_en?: string | null
          title_es?: string | null
          title_pt: string
          title_tr?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          available_from?: string | null
          available_until?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          description_en?: string | null
          description_es?: string | null
          description_pt?: string | null
          description_tr?: string | null
          event_id?: string
          id?: string
          is_active?: boolean
          is_free?: boolean
          is_promotional?: boolean
          lot_id?: string | null
          order_index?: number
          price_cents?: number | null
          quota_total?: number | null
          slug?: string
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          sync_error?: string | null
          sync_status?: string | null
          title_en?: string | null
          title_es?: string | null
          title_pt?: string
          title_tr?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      event_category_audit: {
        Row: {
          action: string
          category_id: string
          changed_by: string | null
          created_at: string
          id: string
          new_data: Json | null
          old_data: Json | null
        }
        Insert: {
          action: string
          category_id: string
          changed_by?: string | null
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
        }
        Update: {
          action?: string
          category_id?: string
          changed_by?: string | null
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "event_category_audit_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "event_category"
            referencedColumns: ["id"]
          },
        ]
      }
      event_config: {
        Row: {
          created_at: string
          end_time: string | null
          event_city: string
          event_date: string
          event_location: string
          id: string
          start_time: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_time?: string | null
          event_city: string
          event_date: string
          event_location: string
          id?: string
          start_time?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_time?: string | null
          event_city?: string
          event_date?: string
          event_location?: string
          id?: string
          start_time?: string | null
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
            referencedRelation: "lotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "v_lote_atual"
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
      hybrid_format_config: {
        Row: {
          activity_type: string
          created_at: string
          description: string
          id: string
          image_url: string
          is_active: boolean
          order_index: number
          title: string
          updated_at: string
        }
        Insert: {
          activity_type: string
          created_at?: string
          description: string
          id?: string
          image_url: string
          is_active?: boolean
          order_index?: number
          title: string
          updated_at?: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          description?: string
          id?: string
          image_url?: string
          is_active?: boolean
          order_index?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
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
      lotes: {
        Row: {
          ativo: boolean
          created_at: string
          dt_fim: string
          dt_inicio: string
          id: string
          nome: string
          price_cents: number
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          dt_fim: string
          dt_inicio: string
          id?: string
          nome: string
          price_cents: number
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          dt_fim?: string
          dt_inicio?: string
          id?: string
          nome?: string
          price_cents?: number
          updated_at?: string
        }
        Relationships: []
      }
      media_assets: {
        Row: {
          alt_text_en: string | null
          alt_text_es: string | null
          alt_text_pt: string | null
          created_at: string | null
          height: number | null
          id: string
          path: string
          section: string
          updated_at: string | null
          width: number | null
        }
        Insert: {
          alt_text_en?: string | null
          alt_text_es?: string | null
          alt_text_pt?: string | null
          created_at?: string | null
          height?: number | null
          id?: string
          path: string
          section: string
          updated_at?: string | null
          width?: number | null
        }
        Update: {
          alt_text_en?: string | null
          alt_text_es?: string | null
          alt_text_pt?: string | null
          created_at?: string | null
          height?: number | null
          id?: string
          path?: string
          section?: string
          updated_at?: string | null
          width?: number | null
        }
        Relationships: []
      }
      participant_types: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          requires_course_selection: boolean
          type_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          requires_course_selection?: boolean
          type_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          requires_course_selection?: boolean
          type_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      partner_application_attempts: {
        Row: {
          attempt_count: number
          blocked_until: string | null
          email: string | null
          first_attempt_at: string
          id: string
          ip_address: unknown | null
          last_attempt_at: string
        }
        Insert: {
          attempt_count?: number
          blocked_until?: string | null
          email?: string | null
          first_attempt_at?: string
          id?: string
          ip_address?: unknown | null
          last_attempt_at?: string
        }
        Update: {
          attempt_count?: number
          blocked_until?: string | null
          email?: string | null
          first_attempt_at?: string
          id?: string
          ip_address?: unknown | null
          last_attempt_at?: string
        }
        Relationships: []
      }
      partner_applications: {
        Row: {
          company_name: string
          contact_name: string
          created_at: string
          email: string
          id: string
          message: string | null
          partnership_type: string
          phone: string | null
          status: string
          updated_at: string
          website: string | null
        }
        Insert: {
          company_name: string
          contact_name: string
          created_at?: string
          email: string
          id?: string
          message?: string | null
          partnership_type: string
          phone?: string | null
          status?: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          company_name?: string
          contact_name?: string
          created_at?: string
          email?: string
          id?: string
          message?: string | null
          partnership_type?: string
          phone?: string | null
          status?: string
          updated_at?: string
          website?: string | null
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
      registration_access_logs: {
        Row: {
          access_type: string
          accessed_by: string
          accessed_columns: string[] | null
          admin_user_type: string
          created_at: string
          id: string
          registration_id: string
        }
        Insert: {
          access_type: string
          accessed_by: string
          accessed_columns?: string[] | null
          admin_user_type: string
          created_at?: string
          id?: string
          registration_id: string
        }
        Update: {
          access_type?: string
          accessed_by?: string
          accessed_columns?: string[] | null
          admin_user_type?: string
          created_at?: string
          id?: string
          registration_id?: string
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
      site_config: {
        Row: {
          config_key: string
          config_value: string
          created_at: string | null
          description: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          config_key: string
          config_value: string
          created_at?: string | null
          description?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          config_key?: string
          config_value?: string
          created_at?: string | null
          description?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      transmissoes_live: {
        Row: {
          created_at: string
          data_hora_inicio: string | null
          descricao: string | null
          id: string
          status: string
          titulo: string
          updated_at: string
          url_embed: string
        }
        Insert: {
          created_at?: string
          data_hora_inicio?: string | null
          descricao?: string | null
          id?: string
          status?: string
          titulo: string
          updated_at?: string
          url_embed: string
        }
        Update: {
          created_at?: string
          data_hora_inicio?: string | null
          descricao?: string | null
          id?: string
          status?: string
          titulo?: string
          updated_at?: string
          url_embed?: string
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
      videos: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          order_index: number
          thumbnail: string
          title: string
          updated_at: string
          uploaded_video_url: string | null
          video_type: string
          youtube_url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          order_index?: number
          thumbnail: string
          title: string
          updated_at?: string
          uploaded_video_url?: string | null
          video_type: string
          youtube_url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          order_index?: number
          thumbnail?: string
          title?: string
          updated_at?: string
          uploaded_video_url?: string | null
          video_type?: string
          youtube_url?: string | null
        }
        Relationships: []
      }
      work_content: {
        Row: {
          content_en: string | null
          content_es: string | null
          content_pt: string | null
          content_type: string
          created_at: string
          created_by: string | null
          file_name: string | null
          file_url: string | null
          id: string
          is_active: boolean
          link_url: string | null
          order_index: number
          title_en: string | null
          title_es: string | null
          title_pt: string | null
          updated_at: string
          updated_by: string | null
          work_type: string
        }
        Insert: {
          content_en?: string | null
          content_es?: string | null
          content_pt?: string | null
          content_type: string
          created_at?: string
          created_by?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          is_active?: boolean
          link_url?: string | null
          order_index?: number
          title_en?: string | null
          title_es?: string | null
          title_pt?: string | null
          updated_at?: string
          updated_by?: string | null
          work_type: string
        }
        Update: {
          content_en?: string | null
          content_es?: string | null
          content_pt?: string | null
          content_type?: string
          created_at?: string
          created_by?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          is_active?: boolean
          link_url?: string | null
          order_index?: number
          title_en?: string | null
          title_es?: string | null
          title_pt?: string | null
          updated_at?: string
          updated_by?: string | null
          work_type?: string
        }
        Relationships: []
      }
      work_submissions: {
        Row: {
          abstract: string
          author_name: string
          created_at: string
          email: string
          file_name: string | null
          file_path: string | null
          id: string
          institution: string
          internal_notes: string | null
          keywords: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          thematic_area: string
          updated_at: string
          work_title: string
        }
        Insert: {
          abstract: string
          author_name: string
          created_at?: string
          email: string
          file_name?: string | null
          file_path?: string | null
          id?: string
          institution: string
          internal_notes?: string | null
          keywords: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          thematic_area: string
          updated_at?: string
          work_title: string
        }
        Update: {
          abstract?: string
          author_name?: string
          created_at?: string
          email?: string
          file_name?: string | null
          file_path?: string | null
          id?: string
          institution?: string
          internal_notes?: string | null
          keywords?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          thematic_area?: string
          updated_at?: string
          work_title?: string
        }
        Relationships: []
      }
    }
    Views: {
      v_lote_atual: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          dt_fim: string | null
          dt_inicio: string | null
          id: string | null
          nome: string | null
          price_cents: number | null
          updated_at: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_partner_application_rate_limit: {
        Args: { user_email: string; user_ip: unknown }
        Returns: boolean
      }
      check_user_permission: {
        Args: { permission_type: string; resource: string; user_email: string }
        Returns: boolean
      }
      cleanup_expired_sessions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_old_login_attempts: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_admin_user: {
        Args: {
          user_email: string
          user_password: string
          user_type?: Database["public"]["Enums"]["admin_user_type"]
        }
        Returns: Json
      }
      create_event_category_secure: {
        Args: { category: Json; session_token: string; user_email: string }
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
      get_current_admin_user_email: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_from_jwt: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_partner_applications_summary: {
        Args: Record<PropertyKey, never>
        Returns: {
          company_name: string
          contact_name_masked: string
          created_at: string
          email_masked: string
          id: string
          partnership_type: string
          status: string
          updated_at: string
        }[]
      }
      get_registration_details_secure: {
        Args: { registration_id: string }
        Returns: Json
      }
      get_registration_stats_secure: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_stable_asset_url: {
        Args: { bucket_name: string; file_path: string }
        Returns: string
      }
      is_admin_root_user: {
        Args: { user_email: string }
        Returns: boolean
      }
      is_current_user_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      list_admin_users: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          email: string
          is_admin_root: boolean
          user_id: string
          user_type: Database["public"]["Enums"]["admin_user_type"]
        }[]
      }
      request_password_reset: {
        Args: { user_email: string }
        Returns: boolean
      }
      revoke_admin_session: {
        Args: { session_token: string; user_email: string }
        Returns: Json
      }
      set_current_user_email_secure: {
        Args: { session_token: string; user_email: string }
        Returns: boolean
      }
      submit_partner_application_secure: {
        Args: { application_data: Json; user_ip?: string }
        Returns: Json
      }
      temp_admin_login_secure: {
        Args: { user_email: string; user_password: string }
        Returns: Json
      }
      update_admin_user_password: {
        Args: { new_password: string; user_id: string }
        Returns: Json
      }
      update_admin_user_type: {
        Args: {
          new_user_type: Database["public"]["Enums"]["admin_user_type"]
          user_id: string
        }
        Returns: Json
      }
      update_registration_secure: {
        Args: { registration_id: string; updates: Json }
        Returns: Json
      }
      validate_coupon: {
        Args: { coupon_code: string }
        Returns: Json
      }
      verify_admin_login_secure: {
        Args: { user_email: string; user_ip?: string; user_password: string }
        Returns: Json
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
