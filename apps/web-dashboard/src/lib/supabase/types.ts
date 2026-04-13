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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ad_campaigns: {
        Row: {
          budget: number
          clicks: number | null
          created_at: string | null
          ends_at: string
          id: string
          impressions: number | null
          include_push: boolean | null
          notes: string | null
          package: string
          push_message: string | null
          push_sent: boolean | null
          restaurant_id: string
          starts_at: string
          status: string
          updated_at: string | null
        }
        Insert: {
          budget?: number
          clicks?: number | null
          created_at?: string | null
          ends_at: string
          id?: string
          impressions?: number | null
          include_push?: boolean | null
          notes?: string | null
          package?: string
          push_message?: string | null
          push_sent?: boolean | null
          restaurant_id: string
          starts_at: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          budget?: number
          clicks?: number | null
          created_at?: string | null
          ends_at?: string
          id?: string
          impressions?: number | null
          include_push?: boolean | null
          notes?: string | null
          package?: string
          push_message?: string | null
          push_sent?: boolean | null
          restaurant_id?: string
          starts_at?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_campaigns_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "daily_revenue_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "ad_campaigns_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "ad_campaigns_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      addresses: {
        Row: {
          address: string
          city: string
          created_at: string | null
          id: string
          instructions: string | null
          is_default: boolean | null
          label: string | null
          lat: number | null
          lng: number | null
          location: unknown
          postal_code: string | null
          user_id: string
        }
        Insert: {
          address: string
          city: string
          created_at?: string | null
          id?: string
          instructions?: string | null
          is_default?: boolean | null
          label?: string | null
          lat?: number | null
          lng?: number | null
          location?: unknown
          postal_code?: string | null
          user_id: string
        }
        Update: {
          address?: string
          city?: string
          created_at?: string | null
          id?: string
          instructions?: string | null
          is_default?: boolean | null
          label?: string | null
          lat?: number | null
          lng?: number | null
          location?: unknown
          postal_code?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "addresses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_audit_log: {
        Row: {
          action: string
          admin_id: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: string | null
          target_id: string
          target_type: string
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_id: string
          target_type: string
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_id?: string
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_audit_log_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_broadcasts: {
        Row: {
          body: string
          id: string
          sent_at: string
          sent_by: string | null
          target_type: string
          target_value: string | null
          template: string
          title: string
          tokens_sent: number
        }
        Insert: {
          body: string
          id?: string
          sent_at?: string
          sent_by?: string | null
          target_type?: string
          target_value?: string | null
          template?: string
          title: string
          tokens_sent?: number
        }
        Update: {
          body?: string
          id?: string
          sent_at?: string
          sent_by?: string | null
          target_type?: string
          target_value?: string | null
          template?: string
          title?: string
          tokens_sent?: number
        }
        Relationships: []
      }
      admin_notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string | null
          target_url: string | null
          title: string
          type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          target_url?: string | null
          title: string
          type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          target_url?: string | null
          title?: string
          type?: string
        }
        Relationships: []
      }
      admin_reminders: {
        Row: {
          email: string | null
          id: string
          message: string | null
          restaurant_id: string
          sent_at: string
          sent_by: string | null
          type: string
        }
        Insert: {
          email?: string | null
          id?: string
          message?: string | null
          restaurant_id: string
          sent_at?: string
          sent_by?: string | null
          type?: string
        }
        Update: {
          email?: string | null
          id?: string
          message?: string | null
          restaurant_id?: string
          sent_at?: string
          sent_by?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_reminders_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "daily_revenue_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "admin_reminders_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "admin_reminders_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_usage_logs: {
        Row: {
          created_at: string
          feature: string
          id: string
          restaurant_id: string | null
          tokens_used: number | null
        }
        Insert: {
          created_at?: string
          feature: string
          id?: string
          restaurant_id?: string | null
          tokens_used?: number | null
        }
        Update: {
          created_at?: string
          feature?: string
          id?: string
          restaurant_id?: string | null
          tokens_used?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_logs_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "daily_revenue_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "ai_usage_logs_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "ai_usage_logs_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      capital_applications: {
        Row: {
          bank_partner: string
          bank_reference: string | null
          created_at: string
          id: string
          notes: string | null
          requested_amount: number
          restaurant_id: string
          reviewed_at: string | null
          reviewer_id: string | null
          risk_grade: string
          score: number
          score_breakdown: Json
          status: string
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          bank_partner?: string
          bank_reference?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          requested_amount: number
          restaurant_id: string
          reviewed_at?: string | null
          reviewer_id?: string | null
          risk_grade: string
          score: number
          score_breakdown: Json
          status?: string
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          bank_partner?: string
          bank_reference?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          requested_amount?: number
          restaurant_id?: string
          reviewed_at?: string | null
          reviewer_id?: string | null
          risk_grade?: string
          score?: number
          score_breakdown?: Json
          status?: string
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "capital_applications_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "daily_revenue_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "capital_applications_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "capital_applications_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "capital_applications_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_movements: {
        Row: {
          amount: number
          created_at: string
          id: string
          note: string | null
          operator_member_id: string | null
          order_id: string | null
          restaurant_id: string
          session_id: string
          type: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          note?: string | null
          operator_member_id?: string | null
          order_id?: string | null
          restaurant_id: string
          session_id: string
          type: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          note?: string | null
          operator_member_id?: string | null
          order_id?: string | null
          restaurant_id?: string
          session_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_movements_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_movements_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "daily_revenue_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "cash_movements_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "cash_movements_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_movements_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "cash_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_sessions: {
        Row: {
          closed_at: string | null
          closing_amount: number | null
          discrepancy: number | null
          expected_amount: number | null
          id: string
          notes: string | null
          opened_at: string
          opening_amount: number
          operator_member_id: string | null
          restaurant_id: string
        }
        Insert: {
          closed_at?: string | null
          closing_amount?: number | null
          discrepancy?: number | null
          expected_amount?: number | null
          id?: string
          notes?: string | null
          opened_at?: string
          opening_amount?: number
          operator_member_id?: string | null
          restaurant_id: string
        }
        Update: {
          closed_at?: string | null
          closing_amount?: number | null
          discrepancy?: number | null
          expected_amount?: number | null
          id?: string
          notes?: string | null
          opened_at?: string
          opening_amount?: number
          operator_member_id?: string | null
          restaurant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_sessions_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "daily_revenue_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "cash_sessions_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "cash_sessions_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_packs: {
        Row: {
          categories: Json
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          products: Json
          slug: string
          updated_at: string | null
        }
        Insert: {
          categories?: Json
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          products?: Json
          slug: string
          updated_at?: string | null
        }
        Update: {
          categories?: Json
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          products?: Json
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          description_i18n: Json | null
          id: string
          is_active: boolean
          name: string
          name_i18n: Json
          restaurant_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          description_i18n?: Json | null
          id?: string
          is_active?: boolean
          name: string
          name_i18n?: Json
          restaurant_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          description_i18n?: Json | null
          id?: string
          is_active?: boolean
          name?: string
          name_i18n?: Json
          restaurant_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "categories_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "daily_revenue_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "categories_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "categories_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      client_notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          is_read: boolean
          order_id: string | null
          reservation_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          is_read?: boolean
          order_id?: string | null
          reservation_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_read?: boolean
          order_id?: string | null
          reservation_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_notifications_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_notifications_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          id: string
          joined_at: string | null
          role: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          joined_at?: string | null
          role?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          joined_at?: string | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string | null
          id: string
          metadata: Json | null
          order_id: string | null
          restaurant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          order_id?: string | null
          restaurant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          order_id?: string | null
          restaurant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "daily_revenue_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "conversations_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "conversations_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      coupon_uses: {
        Row: {
          coupon_id: string
          customer_id: string
          id: string
          order_id: string | null
          used_at: string | null
        }
        Insert: {
          coupon_id: string
          customer_id: string
          id?: string
          order_id?: string | null
          used_at?: string | null
        }
        Update: {
          coupon_id?: string
          customer_id?: string
          id?: string
          order_id?: string | null
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coupon_uses_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_uses_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_uses_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          applies_to: string
          code: string
          created_at: string | null
          current_uses: number
          description: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          kind: string
          max_discount: number | null
          max_uses: number | null
          max_uses_per_customer: number
          min_order: number
          min_order_amount: number | null
          name: string
          restaurant_id: string | null
          starts_at: string | null
          updated_at: string | null
          value: number
        }
        Insert: {
          applies_to?: string
          code: string
          created_at?: string | null
          current_uses?: number
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          kind: string
          max_discount?: number | null
          max_uses?: number | null
          max_uses_per_customer?: number
          min_order?: number
          min_order_amount?: number | null
          name?: string
          restaurant_id?: string | null
          starts_at?: string | null
          updated_at?: string | null
          value: number
        }
        Update: {
          applies_to?: string
          code?: string
          created_at?: string | null
          current_uses?: number
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          kind?: string
          max_discount?: number | null
          max_uses?: number | null
          max_uses_per_customer?: number
          min_order?: number
          min_order_amount?: number | null
          name?: string
          restaurant_id?: string | null
          starts_at?: string | null
          updated_at?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "coupons_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "daily_revenue_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "coupons_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "coupons_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      cuisine_categories: {
        Row: {
          created_at: string
          icon: string
          id: string
          is_active: boolean
          label: string
          sort_order: number
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          icon: string
          id?: string
          is_active?: boolean
          label: string
          sort_order?: number
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          icon?: string
          id?: string
          is_active?: boolean
          label?: string
          sort_order?: number
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      deliveries: {
        Row: {
          courier_id: string | null
          current_location: unknown
          estimated_arrival_at: string | null
          id: string
          last_updated_at: string | null
          metadata: Json | null
          order_id: string | null
          status: string | null
        }
        Insert: {
          courier_id?: string | null
          current_location?: unknown
          estimated_arrival_at?: string | null
          id?: string
          last_updated_at?: string | null
          metadata?: Json | null
          order_id?: string | null
          status?: string | null
        }
        Update: {
          courier_id?: string | null
          current_location?: unknown
          estimated_arrival_at?: string | null
          id?: string
          last_updated_at?: string | null
          metadata?: Json | null
          order_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deliveries_courier_id_fkey"
            columns: ["courier_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_tracking: {
        Row: {
          client_address: string | null
          client_lat: number | null
          client_lng: number | null
          completed_at: string | null
          created_at: string
          deliverer_lat: number | null
          deliverer_lng: number | null
          deliverer_name: string | null
          id: string
          order_id: string
          restaurant_id: string
          started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          client_address?: string | null
          client_lat?: number | null
          client_lng?: number | null
          completed_at?: string | null
          created_at?: string
          deliverer_lat?: number | null
          deliverer_lng?: number | null
          deliverer_name?: string | null
          id?: string
          order_id: string
          restaurant_id: string
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          client_address?: string | null
          client_lat?: number | null
          client_lng?: number | null
          completed_at?: string | null
          created_at?: string
          deliverer_lat?: number | null
          deliverer_lng?: number | null
          deliverer_name?: string | null
          id?: string
          order_id?: string
          restaurant_id?: string
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_tracking_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_tracking_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "daily_revenue_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "delivery_tracking_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "delivery_tracking_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      gift_card_movements: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          gift_card_id: string
          id: string
          note: string | null
          order_id: string | null
          type: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          gift_card_id: string
          id?: string
          note?: string | null
          order_id?: string | null
          type: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          gift_card_id?: string
          id?: string
          note?: string | null
          order_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "gift_card_movements_gift_card_id_fkey"
            columns: ["gift_card_id"]
            isOneToOne: false
            referencedRelation: "gift_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gift_card_movements_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      gift_cards: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          current_balance: number
          expires_at: string | null
          id: string
          initial_balance: number
          is_active: boolean
          issued_to: string | null
          note: string | null
          restaurant_id: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          current_balance: number
          expires_at?: string | null
          id?: string
          initial_balance: number
          is_active?: boolean
          issued_to?: string | null
          note?: string | null
          restaurant_id: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          current_balance?: number
          expires_at?: string | null
          id?: string
          initial_balance?: number
          is_active?: boolean
          issued_to?: string | null
          note?: string | null
          restaurant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gift_cards_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gift_cards_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "daily_revenue_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "gift_cards_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "gift_cards_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      homepage_sections: {
        Row: {
          auto_rule: string | null
          created_at: string
          display_style: string
          ends_at: string | null
          id: string
          is_active: boolean
          restaurant_ids: string[] | null
          sort_order: number
          starts_at: string | null
          subtitle: string | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          auto_rule?: string | null
          created_at?: string
          display_style?: string
          ends_at?: string | null
          id?: string
          is_active?: boolean
          restaurant_ids?: string[] | null
          sort_order?: number
          starts_at?: string | null
          subtitle?: string | null
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          auto_rule?: string | null
          created_at?: string
          display_style?: string
          ends_at?: string | null
          id?: string
          is_active?: boolean
          restaurant_ids?: string[] | null
          sort_order?: number
          starts_at?: string | null
          subtitle?: string | null
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      ledger_entries: {
        Row: {
          amount: number
          created_at: string
          currency: string
          description: string | null
          direction: string
          entry_type: string
          id: string
          metadata: Json | null
          order_id: string | null
          payment_transaction_id: string | null
          restaurant_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          description?: string | null
          direction: string
          entry_type: string
          id?: string
          metadata?: Json | null
          order_id?: string | null
          payment_transaction_id?: string | null
          restaurant_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          description?: string | null
          direction?: string
          entry_type?: string
          id?: string
          metadata?: Json | null
          order_id?: string | null
          payment_transaction_id?: string | null
          restaurant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ledger_entries_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_payment_transaction_id_fkey"
            columns: ["payment_transaction_id"]
            isOneToOne: false
            referencedRelation: "payment_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "daily_revenue_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "ledger_entries_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "ledger_entries_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_purchases: {
        Row: {
          admin_id: string | null
          amount_paid: number
          created_at: string
          expires_at: string | null
          id: string
          notes: string | null
          restaurant_id: string
          service_id: string
          starts_at: string
          status: string
        }
        Insert: {
          admin_id?: string | null
          amount_paid?: number
          created_at?: string
          expires_at?: string | null
          id?: string
          notes?: string | null
          restaurant_id: string
          service_id: string
          starts_at?: string
          status?: string
        }
        Update: {
          admin_id?: string | null
          amount_paid?: number
          created_at?: string
          expires_at?: string | null
          id?: string
          notes?: string | null
          restaurant_id?: string
          service_id?: string
          starts_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_purchases_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_purchases_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "daily_revenue_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "marketplace_purchases_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "marketplace_purchases_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_purchases_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "marketplace_services"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_services: {
        Row: {
          category: string
          created_at: string
          description: string | null
          duration_days: number | null
          features: Json | null
          icon: string | null
          id: string
          is_active: boolean
          name: string
          price: number
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          duration_days?: number | null
          features?: Json | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          price?: number
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          duration_days?: number | null
          features?: Json | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      menu_item_option_values: {
        Row: {
          id: string
          is_default: boolean | null
          name: string
          option_id: string
          price_adjustment: number | null
          sort_order: number | null
        }
        Insert: {
          id?: string
          is_default?: boolean | null
          name: string
          option_id: string
          price_adjustment?: number | null
          sort_order?: number | null
        }
        Update: {
          id?: string
          is_default?: boolean | null
          name?: string
          option_id?: string
          price_adjustment?: number | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "menu_item_option_values_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "menu_item_options"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_item_options: {
        Row: {
          id: string
          is_required: boolean | null
          max_selections: number | null
          name: string
          product_id: string
          sort_order: number | null
          type: string | null
        }
        Insert: {
          id?: string
          is_required?: boolean | null
          max_selections?: number | null
          name: string
          product_id: string
          sort_order?: number | null
          type?: string | null
        }
        Update: {
          id?: string
          is_required?: boolean | null
          max_selections?: number | null
          name?: string
          product_id?: string
          sort_order?: number | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "menu_item_options_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_presets_categories: {
        Row: {
          description: string | null
          icon_url: string | null
          id: string
          name: string
          sort_order: number | null
        }
        Insert: {
          description?: string | null
          icon_url?: string | null
          id?: string
          name: string
          sort_order?: number | null
        }
        Update: {
          description?: string | null
          icon_url?: string | null
          id?: string
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      menu_presets_option_values: {
        Row: {
          id: string
          name: string
          preset_option_id: string | null
          price_adjustment: number | null
        }
        Insert: {
          id?: string
          name: string
          preset_option_id?: string | null
          price_adjustment?: number | null
        }
        Update: {
          id?: string
          name?: string
          preset_option_id?: string | null
          price_adjustment?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "menu_presets_option_values_preset_option_id_fkey"
            columns: ["preset_option_id"]
            isOneToOne: false
            referencedRelation: "menu_presets_options"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_presets_options: {
        Row: {
          id: string
          is_required: boolean | null
          max_selections: number | null
          name: string
          preset_product_id: string | null
          type: string | null
        }
        Insert: {
          id?: string
          is_required?: boolean | null
          max_selections?: number | null
          name: string
          preset_product_id?: string | null
          type?: string | null
        }
        Update: {
          id?: string
          is_required?: boolean | null
          max_selections?: number | null
          name?: string
          preset_product_id?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "menu_presets_options_preset_product_id_fkey"
            columns: ["preset_product_id"]
            isOneToOne: false
            referencedRelation: "menu_presets_products"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_presets_products: {
        Row: {
          allergens: Json | null
          available_from: string | null
          available_to: string | null
          base_price: number | null
          description: string | null
          id: string
          image_url: string | null
          is_alcoholic: boolean | null
          is_bundle: boolean | null
          is_halal: boolean | null
          name: string
          prep_time: number | null
          preset_category_id: string | null
          tags: Json | null
        }
        Insert: {
          allergens?: Json | null
          available_from?: string | null
          available_to?: string | null
          base_price?: number | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_alcoholic?: boolean | null
          is_bundle?: boolean | null
          is_halal?: boolean | null
          name: string
          prep_time?: number | null
          preset_category_id?: string | null
          tags?: Json | null
        }
        Update: {
          allergens?: Json | null
          available_from?: string | null
          available_to?: string | null
          base_price?: number | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_alcoholic?: boolean | null
          is_bundle?: boolean | null
          is_halal?: boolean | null
          name?: string
          prep_time?: number | null
          preset_category_id?: string | null
          tags?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "menu_presets_products_preset_category_id_fkey"
            columns: ["preset_category_id"]
            isOneToOne: false
            referencedRelation: "menu_presets_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          content_type: string
          conversation_id: string
          created_at: string | null
          id: string
          is_read: boolean | null
          sender_id: string
        }
        Insert: {
          content: string
          content_type?: string
          conversation_id: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          sender_id: string
        }
        Update: {
          content?: string
          content_type?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      opening_hours: {
        Row: {
          close_time: string
          day_of_week: number
          id: string
          is_closed: boolean | null
          open_time: string
          restaurant_id: string
        }
        Insert: {
          close_time: string
          day_of_week: number
          id?: string
          is_closed?: boolean | null
          open_time: string
          restaurant_id: string
        }
        Update: {
          close_time?: string
          day_of_week?: number
          id?: string
          is_closed?: boolean | null
          open_time?: string
          restaurant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "opening_hours_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "daily_revenue_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "opening_hours_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "opening_hours_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      order_item_options: {
        Row: {
          created_at: string | null
          id: string
          name: string
          option_id: string | null
          order_item_id: string
          price_adjustment: number
          value: string
          value_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          option_id?: string | null
          order_item_id: string
          price_adjustment?: number
          value: string
          value_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          option_id?: string | null
          order_item_id?: string
          price_adjustment?: number
          value?: string
          value_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_item_options_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "menu_item_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_item_options_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_item_options_value_id_fkey"
            columns: ["value_id"]
            isOneToOne: false
            referencedRelation: "menu_item_option_values"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          metadata: Json | null
          name: string
          order_id: string
          price: number
          product_id: string | null
          quantity: number
          subtotal: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          name: string
          order_id: string
          price: number
          product_id?: string | null
          quantity?: number
          subtotal: number
        }
        Update: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          order_id?: string
          price?: number
          product_id?: string | null
          quantity?: number
          subtotal?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_payment_splits: {
        Row: {
          amount: number
          created_at: string
          id: string
          label: string
          order_id: string
          payer_name: string | null
          payer_phone: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status: Database["public"]["Enums"]["payment_status"]
          payment_transaction_id: string | null
          restaurant_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          label?: string
          order_id: string
          payer_name?: string | null
          payer_phone?: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          payment_transaction_id?: string | null
          restaurant_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          label?: string
          order_id?: string
          payer_name?: string | null
          payer_phone?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          payment_transaction_id?: string | null
          restaurant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_payment_splits_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_payment_splits_payment_transaction_id_fkey"
            columns: ["payment_transaction_id"]
            isOneToOne: false
            referencedRelation: "payment_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_payment_splits_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "daily_revenue_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "order_payment_splits_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "order_payment_splits_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          corkage_fee: number | null
          covers: number | null
          created_at: string
          customer_id: string | null
          customer_name: string
          customer_phone: string
          delivered_at: string | null
          delivered_by: string | null
          delivery_address: string | null
          delivery_code: string | null
          delivery_fee: number
          delivery_note: string | null
          delivery_type: Database["public"]["Enums"]["delivery_type"]
          draft_label: string | null
          driver_id: string | null
          external_drinks_count: number | null
          gift_card_amount: number | null
          gift_card_id: string | null
          id: string
          invoice_number: string | null
          items: Json
          loyalty_points_earned: number | null
          notes: string | null
          operator_member_id: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status: Database["public"]["Enums"]["payment_status"]
          preparation_time_minutes: number | null
          restaurant_id: string
          scheduled_for: string | null
          service_fee: number | null
          split_payment_mode: string | null
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          table_id: string | null
          table_number: string | null
          tip_amount: number | null
          total: number
          updated_at: string
        }
        Insert: {
          corkage_fee?: number | null
          covers?: number | null
          created_at?: string
          customer_id?: string | null
          customer_name: string
          customer_phone: string
          delivered_at?: string | null
          delivered_by?: string | null
          delivery_address?: string | null
          delivery_code?: string | null
          delivery_fee?: number
          delivery_note?: string | null
          delivery_type?: Database["public"]["Enums"]["delivery_type"]
          draft_label?: string | null
          driver_id?: string | null
          external_drinks_count?: number | null
          gift_card_amount?: number | null
          gift_card_id?: string | null
          id?: string
          invoice_number?: string | null
          items: Json
          loyalty_points_earned?: number | null
          notes?: string | null
          operator_member_id?: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          preparation_time_minutes?: number | null
          restaurant_id: string
          scheduled_for?: string | null
          service_fee?: number | null
          split_payment_mode?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal: number
          table_id?: string | null
          table_number?: string | null
          tip_amount?: number | null
          total: number
          updated_at?: string
        }
        Update: {
          corkage_fee?: number | null
          covers?: number | null
          created_at?: string
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string
          delivered_at?: string | null
          delivered_by?: string | null
          delivery_address?: string | null
          delivery_code?: string | null
          delivery_fee?: number
          delivery_note?: string | null
          delivery_type?: Database["public"]["Enums"]["delivery_type"]
          draft_label?: string | null
          driver_id?: string | null
          external_drinks_count?: number | null
          gift_card_amount?: number | null
          gift_card_id?: string | null
          id?: string
          invoice_number?: string | null
          items?: Json
          loyalty_points_earned?: number | null
          notes?: string | null
          operator_member_id?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          preparation_time_minutes?: number | null
          restaurant_id?: string
          scheduled_for?: string | null
          service_fee?: number | null
          split_payment_mode?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          table_id?: string | null
          table_number?: string | null
          tip_amount?: number | null
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_gift_card_id_fkey"
            columns: ["gift_card_id"]
            isOneToOne: false
            referencedRelation: "gift_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "daily_revenue_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "orders_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "orders_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "reservation_analytics"
            referencedColumns: ["table_id"]
          },
          {
            foreignKeyName: "orders_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "restaurant_tables"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_transactions: {
        Row: {
          amount: number
          completed_at: string | null
          created_at: string
          currency: string
          external_id: string | null
          failed_reason: string | null
          id: string
          order_id: string | null
          payee_msisdn: string | null
          payer_msisdn: string | null
          payment_flow: string | null
          provider: string
          provider_response: Json | null
          provider_status: string | null
          reference_id: string
          requested_at: string
          restaurant_id: string
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          completed_at?: string | null
          created_at?: string
          currency?: string
          external_id?: string | null
          failed_reason?: string | null
          id?: string
          order_id?: string | null
          payee_msisdn?: string | null
          payer_msisdn?: string | null
          payment_flow?: string | null
          provider: string
          provider_response?: Json | null
          provider_status?: string | null
          reference_id: string
          requested_at?: string
          restaurant_id: string
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          completed_at?: string | null
          created_at?: string
          currency?: string
          external_id?: string | null
          failed_reason?: string | null
          id?: string
          order_id?: string | null
          payee_msisdn?: string | null
          payer_msisdn?: string | null
          payment_flow?: string | null
          provider?: string
          provider_response?: Json | null
          provider_status?: string | null
          reference_id?: string
          requested_at?: string
          restaurant_id?: string
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "daily_revenue_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "payment_transactions_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "payment_transactions_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      payout_items: {
        Row: {
          created_at: string
          currency: string
          gross_amount: number
          id: string
          net_amount: number
          order_id: string | null
          payment_transaction_id: string | null
          payout_id: string
          platform_fee_amount: number
          psp_fee_amount: number
          restaurant_id: string
        }
        Insert: {
          created_at?: string
          currency?: string
          gross_amount?: number
          id?: string
          net_amount?: number
          order_id?: string | null
          payment_transaction_id?: string | null
          payout_id: string
          platform_fee_amount?: number
          psp_fee_amount?: number
          restaurant_id: string
        }
        Update: {
          created_at?: string
          currency?: string
          gross_amount?: number
          id?: string
          net_amount?: number
          order_id?: string | null
          payment_transaction_id?: string | null
          payout_id?: string
          platform_fee_amount?: number
          psp_fee_amount?: number
          restaurant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payout_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payout_items_payment_transaction_id_fkey"
            columns: ["payment_transaction_id"]
            isOneToOne: false
            referencedRelation: "payment_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payout_items_payout_id_fkey"
            columns: ["payout_id"]
            isOneToOne: false
            referencedRelation: "payouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payout_items_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "daily_revenue_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "payout_items_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "payout_items_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      payouts: {
        Row: {
          amount: number
          created_at: string
          id: string
          paid_at: string | null
          period_end: string
          period_start: string
          restaurant_id: string
          status: Database["public"]["Enums"]["payout_status"]
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          paid_at?: string | null
          period_end: string
          period_start: string
          restaurant_id: string
          status?: Database["public"]["Enums"]["payout_status"]
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          paid_at?: string | null
          period_end?: string
          period_start?: string
          restaurant_id?: string
          status?: Database["public"]["Enums"]["payout_status"]
        }
        Relationships: [
          {
            foreignKeyName: "payouts_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "daily_revenue_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "payouts_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "payouts_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_integrations: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          docs_url: string | null
          id: string
          is_secret: boolean | null
          key_name: string
          key_value: string | null
          label: string
          placeholder: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          category?: string
          created_at?: string | null
          description?: string | null
          docs_url?: string | null
          id?: string
          is_secret?: boolean | null
          key_name: string
          key_value?: string | null
          label?: string
          placeholder?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          docs_url?: string | null
          id?: string
          is_secret?: boolean | null
          key_name?: string
          key_value?: string | null
          label?: string
          placeholder?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_integrations_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_invoices: {
        Row: {
          amount_ht: number
          amount_ttc: number
          cancelled_at: string | null
          created_at: string
          description: string
          due_at: string | null
          id: string
          invoice_number: string
          invoice_type: string
          issued_at: string | null
          kbouffe_niu: string | null
          kbouffe_rccm: string | null
          line_items: Json | null
          paid_at: string | null
          period_end: string | null
          period_start: string | null
          reference_id: string | null
          reference_type: string | null
          restaurant_address: string | null
          restaurant_id: string
          restaurant_name: string | null
          restaurant_niu: string | null
          restaurant_rccm: string | null
          status: string
          tva_amount: number
          tva_rate: number
          updated_at: string
        }
        Insert: {
          amount_ht: number
          amount_ttc: number
          cancelled_at?: string | null
          created_at?: string
          description: string
          due_at?: string | null
          id?: string
          invoice_number: string
          invoice_type: string
          issued_at?: string | null
          kbouffe_niu?: string | null
          kbouffe_rccm?: string | null
          line_items?: Json | null
          paid_at?: string | null
          period_end?: string | null
          period_start?: string | null
          reference_id?: string | null
          reference_type?: string | null
          restaurant_address?: string | null
          restaurant_id: string
          restaurant_name?: string | null
          restaurant_niu?: string | null
          restaurant_rccm?: string | null
          status?: string
          tva_amount: number
          tva_rate?: number
          updated_at?: string
        }
        Update: {
          amount_ht?: number
          amount_ttc?: number
          cancelled_at?: string | null
          created_at?: string
          description?: string
          due_at?: string | null
          id?: string
          invoice_number?: string
          invoice_type?: string
          issued_at?: string | null
          kbouffe_niu?: string | null
          kbouffe_rccm?: string | null
          line_items?: Json | null
          paid_at?: string | null
          period_end?: string | null
          period_start?: string | null
          reference_id?: string | null
          reference_type?: string | null
          restaurant_address?: string | null
          restaurant_id?: string
          restaurant_name?: string | null
          restaurant_niu?: string | null
          restaurant_rccm?: string | null
          status?: string
          tva_amount?: number
          tva_rate?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_invoices_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "daily_revenue_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "platform_invoices_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "platform_invoices_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "platform_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      product_favorites: {
        Row: {
          created_at: string | null
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_favorites_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          created_at: string
          display_order: number
          id: string
          product_id: string
          url: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          product_id: string
          url: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          product_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_reviews: {
        Row: {
          comment: string | null
          created_at: string
          customer_id: string
          id: string
          is_visible: boolean
          product_id: string
          rating: number
          response: string | null
          restaurant_id: string
          updated_at: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          customer_id: string
          id?: string
          is_visible?: boolean
          product_id: string
          rating: number
          response?: string | null
          restaurant_id: string
          updated_at?: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          is_visible?: boolean
          product_id?: string
          rating?: number
          response?: string | null
          restaurant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_reviews_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_reviews_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "daily_revenue_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "product_reviews_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "product_reviews_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          allergens: Json | null
          available_from: string | null
          available_to: string | null
          available_until: string | null
          calories: number | null
          category_id: string | null
          compare_at_price: number | null
          created_at: string
          description: string | null
          description_i18n: Json | null
          dine_in_price: number | null
          fts: unknown
          id: string
          image_url: string | null
          is_alcoholic: boolean | null
          is_available: boolean
          is_bundle: boolean | null
          is_dine_in_only: boolean | null
          is_featured: boolean
          is_gluten_free: boolean | null
          is_halal: boolean | null
          is_limited_edition: boolean
          is_no_delivery: boolean | null
          is_vegan: boolean | null
          name: string
          name_i18n: Json
          options: Json | null
          prep_time: number | null
          price: number
          restaurant_id: string
          sort_order: number
          stock_quantity: number | null
          tags: Json | null
          updated_at: string
        }
        Insert: {
          allergens?: Json | null
          available_from?: string | null
          available_to?: string | null
          available_until?: string | null
          calories?: number | null
          category_id?: string | null
          compare_at_price?: number | null
          created_at?: string
          description?: string | null
          description_i18n?: Json | null
          dine_in_price?: number | null
          fts?: unknown
          id?: string
          image_url?: string | null
          is_alcoholic?: boolean | null
          is_available?: boolean
          is_bundle?: boolean | null
          is_dine_in_only?: boolean | null
          is_featured?: boolean
          is_gluten_free?: boolean | null
          is_halal?: boolean | null
          is_limited_edition?: boolean
          is_no_delivery?: boolean | null
          is_vegan?: boolean | null
          name: string
          name_i18n?: Json
          options?: Json | null
          prep_time?: number | null
          price: number
          restaurant_id: string
          sort_order?: number
          stock_quantity?: number | null
          tags?: Json | null
          updated_at?: string
        }
        Update: {
          allergens?: Json | null
          available_from?: string | null
          available_to?: string | null
          available_until?: string | null
          calories?: number | null
          category_id?: string | null
          compare_at_price?: number | null
          created_at?: string
          description?: string | null
          description_i18n?: Json | null
          dine_in_price?: number | null
          fts?: unknown
          id?: string
          image_url?: string | null
          is_alcoholic?: boolean | null
          is_available?: boolean
          is_bundle?: boolean | null
          is_dine_in_only?: boolean | null
          is_featured?: boolean
          is_gluten_free?: boolean | null
          is_halal?: boolean | null
          is_limited_edition?: boolean
          is_no_delivery?: boolean | null
          is_vegan?: boolean | null
          name?: string
          name_i18n?: Json
          options?: Json | null
          prep_time?: number | null
          price?: number
          restaurant_id?: string
          sort_order?: number
          stock_quantity?: number | null
          tags?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "daily_revenue_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "products_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "products_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      push_tokens: {
        Row: {
          created_at: string
          device_info: string | null
          id: string
          last_used_at: string
          platform: string
          token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_info?: string | null
          id?: string
          last_used_at?: string
          platform?: string
          token: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_info?: string | null
          id?: string
          last_used_at?: string
          platform?: string
          token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          byob_requested: boolean
          cancellation_reason: string | null
          confirmed_at: string | null
          corkage_fee_acknowledged: boolean
          corkage_fee_amount: number | null
          created_at: string | null
          customer_email: string | null
          customer_id: string | null
          customer_name: string
          customer_phone: string | null
          date: string
          deposit_amount: number | null
          deposit_paid: boolean | null
          duration: number | null
          id: string
          occasion: string | null
          party_size: number
          pre_order_id: string | null
          restaurant_id: string
          seated_at: string | null
          special_requests: string | null
          status: string | null
          table_id: string | null
          time: string
          updated_at: string | null
          zone_id: string | null
          zone_preference: string | null
        }
        Insert: {
          byob_requested?: boolean
          cancellation_reason?: string | null
          confirmed_at?: string | null
          corkage_fee_acknowledged?: boolean
          corkage_fee_amount?: number | null
          created_at?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name: string
          customer_phone?: string | null
          date: string
          deposit_amount?: number | null
          deposit_paid?: boolean | null
          duration?: number | null
          id?: string
          occasion?: string | null
          party_size: number
          pre_order_id?: string | null
          restaurant_id: string
          seated_at?: string | null
          special_requests?: string | null
          status?: string | null
          table_id?: string | null
          time: string
          updated_at?: string | null
          zone_id?: string | null
          zone_preference?: string | null
        }
        Update: {
          byob_requested?: boolean
          cancellation_reason?: string | null
          confirmed_at?: string | null
          corkage_fee_acknowledged?: boolean
          corkage_fee_amount?: number | null
          created_at?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string | null
          date?: string
          deposit_amount?: number | null
          deposit_paid?: boolean | null
          duration?: number | null
          id?: string
          occasion?: string | null
          party_size?: number
          pre_order_id?: string | null
          restaurant_id?: string
          seated_at?: string | null
          special_requests?: string | null
          status?: string | null
          table_id?: string | null
          time?: string
          updated_at?: string | null
          zone_id?: string | null
          zone_preference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reservations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_pre_order_id_fkey"
            columns: ["pre_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "daily_revenue_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "reservations_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "reservations_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "reservation_analytics"
            referencedColumns: ["table_id"]
          },
          {
            foreignKeyName: "reservations_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "restaurant_tables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "table_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_brands: {
        Row: {
          brand_name: string
          created_at: string
          cuisine_type: string
          description: string | null
          id: string
          is_active: boolean
          legal_declaration: boolean
          licence_sanitaire: string | null
          logo_url: string | null
          restaurant_id: string
          updated_at: string
        }
        Insert: {
          brand_name: string
          created_at?: string
          cuisine_type: string
          description?: string | null
          id?: string
          is_active?: boolean
          legal_declaration?: boolean
          licence_sanitaire?: string | null
          logo_url?: string | null
          restaurant_id: string
          updated_at?: string
        }
        Update: {
          brand_name?: string
          created_at?: string
          cuisine_type?: string
          description?: string | null
          id?: string
          is_active?: boolean
          legal_declaration?: boolean
          licence_sanitaire?: string | null
          logo_url?: string | null
          restaurant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_brands_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "daily_revenue_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "restaurant_brands_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "restaurant_brands_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_customers: {
        Row: {
          created_at: string | null
          customer_id: string
          id: string
          internal_notes: string | null
          last_order_at: string | null
          loyalty_points: number | null
          loyalty_tier: string | null
          orders_count: number | null
          restaurant_id: string
          segment: string | null
          tags: string[] | null
          total_spent: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          id?: string
          internal_notes?: string | null
          last_order_at?: string | null
          loyalty_points?: number | null
          loyalty_tier?: string | null
          orders_count?: number | null
          restaurant_id: string
          segment?: string | null
          tags?: string[] | null
          total_spent?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          id?: string
          internal_notes?: string | null
          last_order_at?: string | null
          loyalty_points?: number | null
          loyalty_tier?: string | null
          orders_count?: number | null
          restaurant_id?: string
          segment?: string | null
          tags?: string[] | null
          total_spent?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_customers_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_customers_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "daily_revenue_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "restaurant_customers_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "restaurant_customers_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_favorites: {
        Row: {
          created_at: string | null
          id: string
          restaurant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          restaurant_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          restaurant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_favorites_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "daily_revenue_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "restaurant_favorites_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "restaurant_favorites_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_galleries: {
        Row: {
          created_at: string
          id: string
          max_photos: number
          restaurant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          max_photos?: number
          restaurant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          max_photos?: number
          restaurant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_galleries_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: true
            referencedRelation: "daily_revenue_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "restaurant_galleries_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: true
            referencedRelation: "restaurant_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "restaurant_galleries_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: true
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_members: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          id: string
          invited_by: string | null
          pin_hash: string | null
          pin_set_at: string | null
          restaurant_id: string
          role: string
          status: string
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          id?: string
          invited_by?: string | null
          pin_hash?: string | null
          pin_set_at?: string | null
          restaurant_id: string
          role?: string
          status?: string
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          id?: string
          invited_by?: string | null
          pin_hash?: string | null
          pin_set_at?: string | null
          restaurant_id?: string
          role?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_members_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "daily_revenue_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "restaurant_members_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "restaurant_members_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_modules: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          module_id: string
          restaurant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          module_id: string
          restaurant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          module_id?: string
          restaurant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_modules_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "daily_revenue_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "restaurant_modules_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "restaurant_modules_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          is_read: boolean
          payload: Json
          restaurant_id: string
          title: string
          type: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          is_read?: boolean
          payload?: Json
          restaurant_id: string
          title: string
          type?: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_read?: boolean
          payload?: Json
          restaurant_id?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_notifications_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "daily_revenue_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "restaurant_notifications_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "restaurant_notifications_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_photos: {
        Row: {
          alt_text: string | null
          created_at: string
          display_order: number
          id: string
          is_featured: boolean
          photo_url: string
          restaurant_id: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          display_order?: number
          id?: string
          is_featured?: boolean
          photo_url: string
          restaurant_id: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          display_order?: number
          id?: string
          is_featured?: boolean
          photo_url?: string
          restaurant_id?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_photos_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "daily_revenue_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "restaurant_photos_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "restaurant_photos_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_photos_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_tables: {
        Row: {
          capacity: number
          created_at: string | null
          id: string
          is_active: boolean | null
          number: string
          qr_code: string | null
          restaurant_id: string
          sort_order: number | null
          status: string | null
          updated_at: string | null
          zone_id: string | null
        }
        Insert: {
          capacity?: number
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          number: string
          qr_code?: string | null
          restaurant_id: string
          sort_order?: number | null
          status?: string | null
          updated_at?: string | null
          zone_id?: string | null
        }
        Update: {
          capacity?: number
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          number?: string
          qr_code?: string | null
          restaurant_id?: string
          sort_order?: number | null
          status?: string | null
          updated_at?: string | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_tables_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "daily_revenue_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "restaurant_tables_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "restaurant_tables_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_tables_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "table_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurants: {
        Row: {
          address: string | null
          banner_url: string | null
          city: string | null
          commission_rate: number | null
          corkage_fee_amount: number | null
          country: string | null
          created_at: string
          cuisine_type: string | null
          cuisine_types: string[] | null
          daily_report_enabled: boolean | null
          delivery_base_fee: number | null
          delivery_fee: number
          delivery_per_km_fee: number | null
          delivery_zones: Json | null
          description: string | null
          description_i18n: Json | null
          dine_in_service_fee: number | null
          email: string | null
          estimated_delivery_time: number | null
          free_delivery_threshold: number | null
          fts: unknown
          geohash: string | null
          google_analytics_id: string | null
          has_dine_in: boolean | null
          has_reservations: boolean | null
          id: string
          is_dark_kitchen: boolean
          is_premium: boolean | null
          is_published: boolean
          is_sponsored: boolean | null
          is_verified: boolean | null
          kyc_ai_score: number | null
          kyc_ai_scored_at: string | null
          kyc_ai_summary: string | null
          kyc_id_url: string | null
          kyc_niu: string | null
          kyc_niu_url: string | null
          kyc_notes: string | null
          kyc_rccm: string | null
          kyc_rccm_url: string | null
          kyc_rejection_reason: string | null
          kyc_reviewed_at: string | null
          kyc_reviewer_id: string | null
          kyc_status: string | null
          kyc_submitted_at: string | null
          lat: number | null
          licence_sanitaire: string | null
          lng: number | null
          location: unknown
          logo_url: string | null
          loyalty_enabled: boolean | null
          loyalty_min_redeem_points: number | null
          loyalty_point_value: number | null
          loyalty_points_per_order: number | null
          loyalty_reward_tiers: Json | null
          max_delivery_radius_km: number | null
          meta_pixel_id: string | null
          min_order_amount: number
          name: string
          nif: string | null
          notification_channels: Json | null
          notification_info: Json | null
          opening_hours: Json | null
          order_cancel_notice_minutes: number | null
          order_cancel_policy: string | null
          order_cancellation_fee_amount: number | null
          order_count: number | null
          owner_id: string
          payment_account_id: string | null
          payment_credentials: Json | null
          payment_methods: Json | null
          payment_provider: string | null
          phone: string | null
          postal_code: string | null
          price_range: number | null
          primary_color: string
          rating: number | null
          rccm: string | null
          reservation_cancel_notice_minutes: number | null
          reservation_cancel_policy: string | null
          reservation_cancellation_fee_amount: number | null
          reservation_close_time: string | null
          reservation_open_time: string | null
          reservation_slot_duration: number | null
          reservation_slot_interval: number | null
          review_count: number | null
          reviews_enabled: boolean | null
          saas_plan_id: string | null
          slug: string
          sms_notifications_enabled: boolean | null
          social_links: Json | null
          sponsored_rank: number | null
          sponsored_until: string | null
          theme_layout: string
          total_tables: number | null
          updated_at: string
          wait_alert_threshold_minutes: number | null
          welcome_message: string | null
        }
        Insert: {
          address?: string | null
          banner_url?: string | null
          city?: string | null
          commission_rate?: number | null
          corkage_fee_amount?: number | null
          country?: string | null
          created_at?: string
          cuisine_type?: string | null
          cuisine_types?: string[] | null
          daily_report_enabled?: boolean | null
          delivery_base_fee?: number | null
          delivery_fee?: number
          delivery_per_km_fee?: number | null
          delivery_zones?: Json | null
          description?: string | null
          description_i18n?: Json | null
          dine_in_service_fee?: number | null
          email?: string | null
          estimated_delivery_time?: number | null
          free_delivery_threshold?: number | null
          fts?: unknown
          geohash?: string | null
          google_analytics_id?: string | null
          has_dine_in?: boolean | null
          has_reservations?: boolean | null
          id?: string
          is_dark_kitchen?: boolean
          is_premium?: boolean | null
          is_published?: boolean
          is_sponsored?: boolean | null
          is_verified?: boolean | null
          kyc_ai_score?: number | null
          kyc_ai_scored_at?: string | null
          kyc_ai_summary?: string | null
          kyc_id_url?: string | null
          kyc_niu?: string | null
          kyc_niu_url?: string | null
          kyc_notes?: string | null
          kyc_rccm?: string | null
          kyc_rccm_url?: string | null
          kyc_rejection_reason?: string | null
          kyc_reviewed_at?: string | null
          kyc_reviewer_id?: string | null
          kyc_status?: string | null
          kyc_submitted_at?: string | null
          lat?: number | null
          licence_sanitaire?: string | null
          lng?: number | null
          location?: unknown
          logo_url?: string | null
          loyalty_enabled?: boolean | null
          loyalty_min_redeem_points?: number | null
          loyalty_point_value?: number | null
          loyalty_points_per_order?: number | null
          loyalty_reward_tiers?: Json | null
          max_delivery_radius_km?: number | null
          meta_pixel_id?: string | null
          min_order_amount?: number
          name: string
          nif?: string | null
          notification_channels?: Json | null
          notification_info?: Json | null
          opening_hours?: Json | null
          order_cancel_notice_minutes?: number | null
          order_cancel_policy?: string | null
          order_cancellation_fee_amount?: number | null
          order_count?: number | null
          owner_id: string
          payment_account_id?: string | null
          payment_credentials?: Json | null
          payment_methods?: Json | null
          payment_provider?: string | null
          phone?: string | null
          postal_code?: string | null
          price_range?: number | null
          primary_color?: string
          rating?: number | null
          rccm?: string | null
          reservation_cancel_notice_minutes?: number | null
          reservation_cancel_policy?: string | null
          reservation_cancellation_fee_amount?: number | null
          reservation_close_time?: string | null
          reservation_open_time?: string | null
          reservation_slot_duration?: number | null
          reservation_slot_interval?: number | null
          review_count?: number | null
          reviews_enabled?: boolean | null
          saas_plan_id?: string | null
          slug: string
          sms_notifications_enabled?: boolean | null
          social_links?: Json | null
          sponsored_rank?: number | null
          sponsored_until?: string | null
          theme_layout?: string
          total_tables?: number | null
          updated_at?: string
          wait_alert_threshold_minutes?: number | null
          welcome_message?: string | null
        }
        Update: {
          address?: string | null
          banner_url?: string | null
          city?: string | null
          commission_rate?: number | null
          corkage_fee_amount?: number | null
          country?: string | null
          created_at?: string
          cuisine_type?: string | null
          cuisine_types?: string[] | null
          daily_report_enabled?: boolean | null
          delivery_base_fee?: number | null
          delivery_fee?: number
          delivery_per_km_fee?: number | null
          delivery_zones?: Json | null
          description?: string | null
          description_i18n?: Json | null
          dine_in_service_fee?: number | null
          email?: string | null
          estimated_delivery_time?: number | null
          free_delivery_threshold?: number | null
          fts?: unknown
          geohash?: string | null
          google_analytics_id?: string | null
          has_dine_in?: boolean | null
          has_reservations?: boolean | null
          id?: string
          is_dark_kitchen?: boolean
          is_premium?: boolean | null
          is_published?: boolean
          is_sponsored?: boolean | null
          is_verified?: boolean | null
          kyc_ai_score?: number | null
          kyc_ai_scored_at?: string | null
          kyc_ai_summary?: string | null
          kyc_id_url?: string | null
          kyc_niu?: string | null
          kyc_niu_url?: string | null
          kyc_notes?: string | null
          kyc_rccm?: string | null
          kyc_rccm_url?: string | null
          kyc_rejection_reason?: string | null
          kyc_reviewed_at?: string | null
          kyc_reviewer_id?: string | null
          kyc_status?: string | null
          kyc_submitted_at?: string | null
          lat?: number | null
          licence_sanitaire?: string | null
          lng?: number | null
          location?: unknown
          logo_url?: string | null
          loyalty_enabled?: boolean | null
          loyalty_min_redeem_points?: number | null
          loyalty_point_value?: number | null
          loyalty_points_per_order?: number | null
          loyalty_reward_tiers?: Json | null
          max_delivery_radius_km?: number | null
          meta_pixel_id?: string | null
          min_order_amount?: number
          name?: string
          nif?: string | null
          notification_channels?: Json | null
          notification_info?: Json | null
          opening_hours?: Json | null
          order_cancel_notice_minutes?: number | null
          order_cancel_policy?: string | null
          order_cancellation_fee_amount?: number | null
          order_count?: number | null
          owner_id?: string
          payment_account_id?: string | null
          payment_credentials?: Json | null
          payment_methods?: Json | null
          payment_provider?: string | null
          phone?: string | null
          postal_code?: string | null
          price_range?: number | null
          primary_color?: string
          rating?: number | null
          rccm?: string | null
          reservation_cancel_notice_minutes?: number | null
          reservation_cancel_policy?: string | null
          reservation_cancellation_fee_amount?: number | null
          reservation_close_time?: string | null
          reservation_open_time?: string | null
          reservation_slot_duration?: number | null
          reservation_slot_interval?: number | null
          review_count?: number | null
          reviews_enabled?: boolean | null
          saas_plan_id?: string | null
          slug?: string
          sms_notifications_enabled?: boolean | null
          social_links?: Json | null
          sponsored_rank?: number | null
          sponsored_until?: string | null
          theme_layout?: string
          total_tables?: number | null
          updated_at?: string
          wait_alert_threshold_minutes?: number | null
          welcome_message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "restaurants_kyc_reviewer_id_fkey"
            columns: ["kyc_reviewer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurants_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          ai_flags: string[] | null
          ai_moderated: boolean | null
          ai_moderated_at: string | null
          ai_score: number | null
          comment: string | null
          created_at: string
          customer_id: string
          id: string
          is_visible: boolean | null
          order_id: string | null
          rating: number
          response: string | null
          restaurant_id: string
          updated_at: string | null
        }
        Insert: {
          ai_flags?: string[] | null
          ai_moderated?: boolean | null
          ai_moderated_at?: string | null
          ai_score?: number | null
          comment?: string | null
          created_at?: string
          customer_id: string
          id?: string
          is_visible?: boolean | null
          order_id?: string | null
          rating: number
          response?: string | null
          restaurant_id: string
          updated_at?: string | null
        }
        Update: {
          ai_flags?: string[] | null
          ai_moderated?: boolean | null
          ai_moderated_at?: string | null
          ai_score?: number | null
          comment?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          is_visible?: boolean | null
          order_id?: string | null
          rating?: number
          response?: string | null
          restaurant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "daily_revenue_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "reviews_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "reviews_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      saas_plans: {
        Row: {
          billing_cycle: string
          commission: number
          created_at: string | null
          features: Json | null
          id: string
          name: string
          price: number
          price_ht: number
          price_ttc: number | null
          tva_rate: number
        }
        Insert: {
          billing_cycle?: string
          commission?: number
          created_at?: string | null
          features?: Json | null
          id: string
          name: string
          price: number
          price_ht?: number
          price_ttc?: number | null
          tva_rate?: number
        }
        Update: {
          billing_cycle?: string
          commission?: number
          created_at?: string | null
          features?: Json | null
          id?: string
          name?: string
          price?: number
          price_ht?: number
          price_ttc?: number | null
          tva_rate?: number
        }
        Relationships: []
      }
      settings: {
        Row: {
          config: Json
          id: string
          restaurant_id: string
          updated_at: string | null
        }
        Insert: {
          config?: Json
          id?: string
          restaurant_id: string
          updated_at?: string | null
        }
        Update: {
          config?: Json
          id?: string
          restaurant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "settings_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: true
            referencedRelation: "daily_revenue_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "settings_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: true
            referencedRelation: "restaurant_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "settings_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: true
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      showcase_sections: {
        Row: {
          content: Json | null
          created_at: string
          display_order: number
          id: string
          is_visible: boolean
          restaurant_id: string
          section_type: string
          settings: Json | null
          subtitle: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          content?: Json | null
          created_at?: string
          display_order?: number
          id?: string
          is_visible?: boolean
          restaurant_id: string
          section_type: string
          settings?: Json | null
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          content?: Json | null
          created_at?: string
          display_order?: number
          id?: string
          is_visible?: boolean
          restaurant_id?: string
          section_type?: string
          settings?: Json | null
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "showcase_sections_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "daily_revenue_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "showcase_sections_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "showcase_sections_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      social_accounts: {
        Row: {
          access_token: string | null
          account_name: string | null
          chat_id: string | null
          connected_at: string | null
          created_at: string
          expires_at: string | null
          id: string
          is_connected: boolean
          page_id: string | null
          platform: string
          refresh_token: string | null
          restaurant_id: string
          updated_at: string
        }
        Insert: {
          access_token?: string | null
          account_name?: string | null
          chat_id?: string | null
          connected_at?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_connected?: boolean
          page_id?: string | null
          platform: string
          refresh_token?: string | null
          restaurant_id: string
          updated_at?: string
        }
        Update: {
          access_token?: string | null
          account_name?: string | null
          chat_id?: string | null
          connected_at?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_connected?: boolean
          page_id?: string | null
          platform?: string
          refresh_token?: string | null
          restaurant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_accounts_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "daily_revenue_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "social_accounts_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "social_accounts_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      social_posts: {
        Row: {
          content: string
          created_at: string
          error_message: string | null
          external_id: string | null
          id: string
          image_url: string | null
          metadata: Json | null
          platform: string
          product_id: string | null
          published_at: string | null
          restaurant_id: string
          scheduled_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          error_message?: string | null
          external_id?: string | null
          id?: string
          image_url?: string | null
          metadata?: Json | null
          platform: string
          product_id?: string | null
          published_at?: string | null
          restaurant_id: string
          scheduled_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          error_message?: string | null
          external_id?: string | null
          id?: string
          image_url?: string | null
          metadata?: Json | null
          platform?: string
          product_id?: string | null
          published_at?: string | null
          restaurant_id?: string
          scheduled_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_posts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_posts_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "daily_revenue_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "social_posts_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "social_posts_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_payouts: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          member_id: string
          notes: string | null
          paid_at: string | null
          payment_method: string | null
          payment_proof_url: string | null
          restaurant_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          member_id: string
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          payment_proof_url?: string | null
          restaurant_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          member_id?: string
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          payment_proof_url?: string | null
          restaurant_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_payouts_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "restaurant_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_payouts_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "daily_revenue_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "staff_payouts_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "staff_payouts_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      stock: {
        Row: {
          id: string
          low_stock_threshold: number | null
          product_id: string
          quantity: number | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          low_stock_threshold?: number | null
          product_id: string
          quantity?: number | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          low_stock_threshold?: number | null
          product_id?: string
          quantity?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      store_announcements: {
        Row: {
          color: string | null
          created_at: string
          ends_at: string | null
          id: string
          is_active: boolean
          message: string
          restaurant_id: string
          starts_at: string | null
          type: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          ends_at?: string | null
          id?: string
          is_active?: boolean
          message: string
          restaurant_id: string
          starts_at?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          ends_at?: string | null
          id?: string
          is_active?: boolean
          message?: string
          restaurant_id?: string
          starts_at?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_announcements_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "daily_revenue_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "store_announcements_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "store_announcements_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      store_modules: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          module_id: string
          restaurant_id: string
          settings: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          module_id: string
          restaurant_id: string
          settings?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          module_id?: string
          restaurant_id?: string
          settings?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_modules_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "daily_revenue_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "store_modules_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "store_modules_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          message_type: string
          product_id: string | null
          quantity: number | null
          replied_at: string | null
          reply_body: string | null
          requested_date: string | null
          restaurant_id: string
          status: string
          subject: string | null
          supplier_id: string
          unit: string | null
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          message_type?: string
          product_id?: string | null
          quantity?: number | null
          replied_at?: string | null
          reply_body?: string | null
          requested_date?: string | null
          restaurant_id: string
          status?: string
          subject?: string | null
          supplier_id: string
          unit?: string | null
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          message_type?: string
          product_id?: string | null
          quantity?: number | null
          replied_at?: string | null
          reply_body?: string | null
          requested_date?: string | null
          restaurant_id?: string
          status?: string
          subject?: string | null
          supplier_id?: string
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_messages_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "supplier_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_messages_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "daily_revenue_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "supplier_messages_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "supplier_messages_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_messages_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_order_traces: {
        Row: {
          actual_delivery_date: string | null
          created_at: string
          delivery_status: string
          dispute_reason: string | null
          expected_delivery_date: string | null
          harvest_date: string | null
          id: string
          lot_number: string | null
          notes: string | null
          platform_fee: number
          platform_fee_tva: number
          product_id: string
          quantity: number
          restaurant_id: string
          supplier_id: string
          total_price: number
          unit: string
          unit_price: number
          updated_at: string
        }
        Insert: {
          actual_delivery_date?: string | null
          created_at?: string
          delivery_status?: string
          dispute_reason?: string | null
          expected_delivery_date?: string | null
          harvest_date?: string | null
          id?: string
          lot_number?: string | null
          notes?: string | null
          platform_fee?: number
          platform_fee_tva?: number
          product_id: string
          quantity: number
          restaurant_id: string
          supplier_id: string
          total_price: number
          unit: string
          unit_price: number
          updated_at?: string
        }
        Update: {
          actual_delivery_date?: string | null
          created_at?: string
          delivery_status?: string
          dispute_reason?: string | null
          expected_delivery_date?: string | null
          harvest_date?: string | null
          id?: string
          lot_number?: string | null
          notes?: string | null
          platform_fee?: number
          platform_fee_tva?: number
          product_id?: string
          quantity?: number
          restaurant_id?: string
          supplier_id?: string
          total_price?: number
          unit?: string
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_order_traces_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "supplier_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_order_traces_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "daily_revenue_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "supplier_order_traces_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "supplier_order_traces_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_order_traces_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_products: {
        Row: {
          allergens: Json
          available_quantity: number | null
          category: string
          created_at: string
          description: string | null
          harvest_date: string | null
          id: string
          is_active: boolean
          is_certified_minader: boolean
          is_organic: boolean
          lot_number: string | null
          min_order_quantity: number
          name: string
          origin_region: string | null
          photos: Json
          phytosanitary_note: string | null
          price_per_unit: number
          supplier_id: string
          unit: string
          updated_at: string
        }
        Insert: {
          allergens?: Json
          available_quantity?: number | null
          category: string
          created_at?: string
          description?: string | null
          harvest_date?: string | null
          id?: string
          is_active?: boolean
          is_certified_minader?: boolean
          is_organic?: boolean
          lot_number?: string | null
          min_order_quantity?: number
          name: string
          origin_region?: string | null
          photos?: Json
          phytosanitary_note?: string | null
          price_per_unit: number
          supplier_id: string
          unit: string
          updated_at?: string
        }
        Update: {
          allergens?: Json
          available_quantity?: number | null
          category?: string
          created_at?: string
          description?: string | null
          harvest_date?: string | null
          id?: string
          is_active?: boolean
          is_certified_minader?: boolean
          is_organic?: boolean
          lot_number?: string | null
          min_order_quantity?: number
          name?: string
          origin_region?: string | null
          photos?: Json
          phytosanitary_note?: string | null
          price_per_unit?: number
          supplier_id?: string
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          contact_name: string
          cooperative_number: string | null
          cover_url: string | null
          created_at: string
          delivery_delay_days: number | null
          delivery_zones: string[] | null
          description: string | null
          email: string | null
          gallery: Json
          gps_lat: number | null
          gps_lng: number | null
          id: string
          identity_doc_url: string | null
          is_active: boolean
          is_featured: boolean
          kyc_confidence: string | null
          kyc_face_score: number | null
          kyc_face_verified: boolean | null
          kyc_name_match: boolean | null
          kyc_rejection_reason: string | null
          kyc_status: string
          kyc_verified_at: string | null
          kyc_verified_by: string | null
          last_inspection_date: string | null
          listing_tier: string
          locality: string
          logo_url: string | null
          minader_cert_url: string | null
          name: string
          nif: string | null
          payment_methods: string[] | null
          phone: string
          phytosanitary_declaration: string | null
          processing_delay_days: number | null
          rccm: string | null
          region: string
          social_links: Json | null
          specialties: string[] | null
          type: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          contact_name: string
          cooperative_number?: string | null
          cover_url?: string | null
          created_at?: string
          delivery_delay_days?: number | null
          delivery_zones?: string[] | null
          description?: string | null
          email?: string | null
          gallery?: Json
          gps_lat?: number | null
          gps_lng?: number | null
          id?: string
          identity_doc_url?: string | null
          is_active?: boolean
          is_featured?: boolean
          kyc_confidence?: string | null
          kyc_face_score?: number | null
          kyc_face_verified?: boolean | null
          kyc_name_match?: boolean | null
          kyc_rejection_reason?: string | null
          kyc_status?: string
          kyc_verified_at?: string | null
          kyc_verified_by?: string | null
          last_inspection_date?: string | null
          listing_tier?: string
          locality: string
          logo_url?: string | null
          minader_cert_url?: string | null
          name: string
          nif?: string | null
          payment_methods?: string[] | null
          phone: string
          phytosanitary_declaration?: string | null
          processing_delay_days?: number | null
          rccm?: string | null
          region: string
          social_links?: Json | null
          specialties?: string[] | null
          type?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          contact_name?: string
          cooperative_number?: string | null
          cover_url?: string | null
          created_at?: string
          delivery_delay_days?: number | null
          delivery_zones?: string[] | null
          description?: string | null
          email?: string | null
          gallery?: Json
          gps_lat?: number | null
          gps_lng?: number | null
          id?: string
          identity_doc_url?: string | null
          is_active?: boolean
          is_featured?: boolean
          kyc_confidence?: string | null
          kyc_face_score?: number | null
          kyc_face_verified?: boolean | null
          kyc_name_match?: boolean | null
          kyc_rejection_reason?: string | null
          kyc_status?: string
          kyc_verified_at?: string | null
          kyc_verified_by?: string | null
          last_inspection_date?: string | null
          listing_tier?: string
          locality?: string
          logo_url?: string | null
          minader_cert_url?: string | null
          name?: string
          nif?: string | null
          payment_methods?: string[] | null
          phone?: string
          phytosanitary_declaration?: string | null
          processing_delay_days?: number | null
          rccm?: string | null
          region?: string
          social_links?: Json | null
          specialties?: string[] | null
          type?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_kyc_verified_by_fkey"
            columns: ["kyc_verified_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      support_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_read: boolean | null
          sender_id: string
          sender_type: string
          ticket_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          sender_id: string
          sender_type: string
          ticket_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          sender_id?: string
          sender_type?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          ai_category: string | null
          ai_priority: string | null
          ai_summary: string | null
          ai_triaged_at: string | null
          assigned_to: string | null
          created_at: string | null
          description: string
          id: string
          last_replied_at: string | null
          order_id: string | null
          priority: string | null
          reporter_id: string | null
          reporter_type: string
          resolved_at: string | null
          restaurant_id: string | null
          status: string | null
          subject: string
          unread_admin: number | null
          unread_reporter: number | null
        }
        Insert: {
          ai_category?: string | null
          ai_priority?: string | null
          ai_summary?: string | null
          ai_triaged_at?: string | null
          assigned_to?: string | null
          created_at?: string | null
          description: string
          id?: string
          last_replied_at?: string | null
          order_id?: string | null
          priority?: string | null
          reporter_id?: string | null
          reporter_type?: string
          resolved_at?: string | null
          restaurant_id?: string | null
          status?: string | null
          subject: string
          unread_admin?: number | null
          unread_reporter?: number | null
        }
        Update: {
          ai_category?: string | null
          ai_priority?: string | null
          ai_summary?: string | null
          ai_triaged_at?: string | null
          assigned_to?: string | null
          created_at?: string | null
          description?: string
          id?: string
          last_replied_at?: string | null
          order_id?: string | null
          priority?: string | null
          reporter_id?: string | null
          reporter_type?: string
          resolved_at?: string | null
          restaurant_id?: string | null
          status?: string | null
          subject?: string
          unread_admin?: number | null
          unread_reporter?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "daily_revenue_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "support_tickets_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "support_tickets_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      table_zones: {
        Row: {
          amenities: string[] | null
          capacity: number | null
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          image_urls: string[] | null
          is_active: boolean | null
          min_party_size: number | null
          name: string
          pricing_note: string | null
          restaurant_id: string
          sort_order: number | null
          type: string | null
        }
        Insert: {
          amenities?: string[] | null
          capacity?: number | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          image_urls?: string[] | null
          is_active?: boolean | null
          min_party_size?: number | null
          name: string
          pricing_note?: string | null
          restaurant_id: string
          sort_order?: number | null
          type?: string | null
        }
        Update: {
          amenities?: string[] | null
          capacity?: number | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          image_urls?: string[] | null
          is_active?: boolean | null
          min_party_size?: number | null
          name?: string
          pricing_note?: string | null
          restaurant_id?: string
          sort_order?: number | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "table_zones_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "daily_revenue_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "table_zones_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "table_zones_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      technical_logs: {
        Row: {
          created_at: string | null
          id: string
          level: string | null
          message: string
          metadata: Json | null
          restaurant_id: string | null
          stack_trace: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          level?: string | null
          message: string
          metadata?: Json | null
          restaurant_id?: string | null
          stack_trace?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          level?: string | null
          message?: string
          metadata?: Json | null
          restaurant_id?: string | null
          stack_trace?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "technical_logs_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "daily_revenue_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "technical_logs_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "technical_logs_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technical_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tva_declarations: {
        Row: {
          created_at: string
          dgi_reference: string | null
          filed_at: string | null
          id: string
          invoice_count: number
          paid_at: string | null
          period_end: string
          period_label: string
          period_start: string
          period_type: string
          status: string
          total_ht: number
          total_ttc: number
          total_tva: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          dgi_reference?: string | null
          filed_at?: string | null
          id?: string
          invoice_count?: number
          paid_at?: string | null
          period_end: string
          period_label: string
          period_start: string
          period_type?: string
          status?: string
          total_ht?: number
          total_ttc?: number
          total_tva?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          dgi_reference?: string | null
          filed_at?: string | null
          id?: string
          invoice_count?: number
          paid_at?: string | null
          period_end?: string
          period_label?: string
          period_start?: string
          period_type?: string
          status?: string
          total_ht?: number
          total_ttc?: number
          total_tva?: number
          updated_at?: string
        }
        Relationships: []
      }
      upsell_rules: {
        Row: {
          created_at: string
          custom_message: string | null
          discount_percent: number | null
          id: string
          is_active: boolean
          max_suggestions: number
          position: string
          priority: number
          restaurant_id: string
          suggested_product_id: string
          trigger_category_id: string | null
          trigger_min_cart: number | null
          trigger_product_id: string | null
          trigger_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          custom_message?: string | null
          discount_percent?: number | null
          id?: string
          is_active?: boolean
          max_suggestions?: number
          position?: string
          priority?: number
          restaurant_id: string
          suggested_product_id: string
          trigger_category_id?: string | null
          trigger_min_cart?: number | null
          trigger_product_id?: string | null
          trigger_type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          custom_message?: string | null
          discount_percent?: number | null
          id?: string
          is_active?: boolean
          max_suggestions?: number
          position?: string
          priority?: number
          restaurant_id?: string
          suggested_product_id?: string
          trigger_category_id?: string | null
          trigger_min_cart?: number | null
          trigger_product_id?: string | null
          trigger_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "upsell_rules_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "daily_revenue_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "upsell_rules_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "upsell_rules_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "upsell_rules_suggested_product_id_fkey"
            columns: ["suggested_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "upsell_rules_trigger_category_id_fkey"
            columns: ["trigger_category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "upsell_rules_trigger_product_id_fkey"
            columns: ["trigger_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          admin_role: string | null
          avatar_url: string | null
          created_at: string
          email: string | null
          fcm_token: string | null
          full_name: string
          id: string
          notifications_enabled: boolean | null
          onboarding_completed: boolean | null
          phone: string | null
          preferences: Json | null
          preferred_lang: string | null
          referral_code: string | null
          referral_invites: number | null
          referral_rewards: number | null
          restaurant_id: string | null
          role: Database["public"]["Enums"]["user_role"]
          theme_preference: string | null
          updated_at: string
          wallet_balance: number
        }
        Insert: {
          admin_role?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          fcm_token?: string | null
          full_name?: string
          id: string
          notifications_enabled?: boolean | null
          onboarding_completed?: boolean | null
          phone?: string | null
          preferences?: Json | null
          preferred_lang?: string | null
          referral_code?: string | null
          referral_invites?: number | null
          referral_rewards?: number | null
          restaurant_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          theme_preference?: string | null
          updated_at?: string
          wallet_balance?: number
        }
        Update: {
          admin_role?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          fcm_token?: string | null
          full_name?: string
          id?: string
          notifications_enabled?: boolean | null
          onboarding_completed?: boolean | null
          phone?: string | null
          preferences?: Json | null
          preferred_lang?: string | null
          referral_code?: string | null
          referral_invites?: number | null
          referral_rewards?: number | null
          restaurant_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          theme_preference?: string | null
          updated_at?: string
          wallet_balance?: number
        }
        Relationships: [
          {
            foreignKeyName: "users_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "daily_revenue_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "users_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "users_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_movements: {
        Row: {
          amount: number
          created_at: string | null
          currency: string
          description: string | null
          id: string
          order_id: string | null
          reason: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string
          description?: string | null
          id?: string
          order_id?: string | null
          reason: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string
          description?: string | null
          id?: string
          order_id?: string | null
          reason?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_movements_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_movements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      daily_revenue_stats: {
        Row: {
          deposit_revenue: number | null
          last_updated: string | null
          order_count: number | null
          order_revenue: number | null
          report_date: string | null
          reservation_count: number | null
          restaurant_id: string | null
          total_gross_revenue: number | null
          total_paid_out: number | null
        }
        Relationships: []
      }
      platform_global_metrics: {
        Row: {
          active_restaurants: number | null
          refreshed_at: string | null
          total_clients: number | null
          total_gmv: number | null
          total_merchants: number | null
          total_orders: number | null
          total_restaurants: number | null
          total_unique_customers: number | null
          total_users: number | null
        }
        Relationships: []
      }
      popular_products: {
        Row: {
          order_count: number | null
          popularity_rank: number | null
          product_id: string | null
          restaurant_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "daily_revenue_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "products_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "products_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      product_co_occurrence: {
        Row: {
          frequency: number | null
          product_a: string | null
          product_b: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_a"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_b"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      reservation_analytics: {
        Row: {
          avg_party_size: number | null
          cancelled_count: number | null
          completed_reservations: number | null
          last_updated: string | null
          no_show_count: number | null
          no_show_rate_percent: number | null
          restaurant_id: string | null
          table_id: string | null
          table_number: string | null
          total_occupied_minutes: number | null
          zone_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_tables_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "daily_revenue_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "restaurant_tables_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "restaurant_tables_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_stats: {
        Row: {
          avg_order_value: number | null
          last_updated: string | null
          restaurant_id: string | null
          restaurant_name: string | null
          top_category: string | null
          total_orders: number | null
          total_revenue: number | null
        }
        Relationships: []
      }
      user_category_affinity: {
        Row: {
          category_id: string | null
          customer_id: string | null
          last_ordered_at: string | null
          order_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      auth_is_restaurant_member: {
        Args: { p_restaurant_id: string }
        Returns: boolean
      }
      auth_is_restaurant_owner: {
        Args: { p_restaurant_id: string }
        Returns: boolean
      }
      cleanup_stale_push_tokens: { Args: never; Returns: undefined }
      decrement_total_tables: { Args: { rid: string }; Returns: undefined }
      fn_auto_close_stale_tickets: { Args: never; Returns: undefined }
      fn_auto_create_weekly_payouts: { Args: never; Returns: undefined }
      fn_get_webhook_secret: { Args: never; Returns: string }
      generate_daily_restaurant_reports: { Args: never; Returns: undefined }
      generate_delivery_code: { Args: never; Returns: string }
      generate_invoice_number: { Args: never; Returns: string }
      generate_monthly_payouts: { Args: never; Returns: undefined }
      get_delivery_estimate: {
        Args: { _address_id: string; _restaurant_id: string }
        Returns: {
          delivery_fee_calculated: number
          distance_km: number
          estimated_delivery_minutes: number
        }[]
      }
      get_financial_report: {
        Args: { _end_date: string; _restaurant_id: string; _start_date: string }
        Returns: {
          order_count: number
          pending_payouts: number
          period_deposits: number
          period_payouts: number
          period_revenue: number
          period_total: number
        }[]
      }
      get_nearby_restaurants: {
        Args: { _radius_meters?: number; _user_lat: number; _user_lng: number }
        Returns: {
          address: string
          distance_meters: number
          id: string
          name: string
        }[]
      }
      get_personalized_recommendations: {
        Args: { _limit?: number; _restaurant_id: string; _user_id: string }
        Returns: {
          description: string
          image_url: string
          name: string
          price: number
          product_id: string
          reason: string
          score: number
        }[]
      }
      get_restaurant_menu: { Args: { _restaurant_id: string }; Returns: Json }
      get_restaurant_occupancy: {
        Args: { _restaurant_id: string; _target_date?: string }
        Returns: {
          occupancy_rate: number
          occupied_tables: number
          total_tables: number
          zone_name: string
        }[]
      }
      import_menu_presets: {
        Args: { _preset_category_ids: string[]; _target_restaurant_id: string }
        Returns: undefined
      }
      increment_referral_stats: {
        Args: { input_user_id: string; reward_amount: number }
        Returns: undefined
      }
      increment_total_tables: { Args: { rid: string }; Returns: undefined }
      increment_wallet_balance: {
        Args: { amount: number; input_user_id: string }
        Returns: undefined
      }
      is_admin: { Args: never; Returns: boolean }
      recalculate_order_payment_status: {
        Args: { p_order_id: string }
        Returns: undefined
      }
      search_products: {
        Args: { query_text: string }
        Returns: {
          description: string
          id: string
          image_url: string
          name: string
          price: number
          rank: number
          restaurant_id: string
        }[]
      }
      search_restaurants: {
        Args: { query_text: string }
        Returns: {
          address: string
          cuisine_type: string
          description: string
          id: string
          name: string
          rank: number
        }[]
      }
      send_reengagement_emails: { Args: never; Returns: undefined }
      send_reservation_reminders: { Args: never; Returns: undefined }
      slugify: { Args: { text: string }; Returns: string }
      to_bilingual_tsquery: { Args: { query_text: string }; Returns: unknown }
      update_reservation_atomic: {
        Args: {
          p_res_id: string
          p_status: string
          p_table_id?: string
          p_update_table_id?: boolean
        }
        Returns: undefined
      }
      validate_and_use_coupon: {
        Args: {
          p_code: string
          p_customer_id: string
          p_delivery_type: string
          p_order_subtotal: number
          p_restaurant_id: string
        }
        Returns: Json
      }
    }
    Enums: {
      delivery_type: "delivery" | "pickup" | "dine_in"
      order_status:
        | "draft"
        | "pending"
        | "accepted"
        | "preparing"
        | "ready"
        | "completed"
        | "cancelled"
        | "delivering"
        | "delivered"
        | "out_for_delivery"
      payment_method:
        | "mobile_money_mtn"
        | "mobile_money_orange"
        | "cash"
        | "gift_card"
        | "mixed"
      payment_status: "pending" | "paid" | "failed" | "refunded"
      payout_status: "pending" | "paid" | "failed"
      user_role: "merchant" | "customer" | "admin" | "support" | "supplier"
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
      delivery_type: ["delivery", "pickup", "dine_in"],
      order_status: [
        "draft",
        "pending",
        "accepted",
        "preparing",
        "ready",
        "completed",
        "cancelled",
        "delivering",
        "delivered",
        "out_for_delivery",
      ],
      payment_method: [
        "mobile_money_mtn",
        "mobile_money_orange",
        "cash",
        "gift_card",
        "mixed",
      ],
      payment_status: ["pending", "paid", "failed", "refunded"],
      payout_status: ["pending", "paid", "failed"],
      user_role: ["merchant", "customer", "admin", "support", "supplier"],
    },
  },
} as const
