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
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          restaurant_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          restaurant_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          restaurant_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "categories_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
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
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          kind: string
          max_discount: number | null
          min_order_amount: number | null
          value: number
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          kind: string
          max_discount?: number | null
          min_order_amount?: number | null
          value: number
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          kind?: string
          max_discount?: number | null
          min_order_amount?: number | null
          value?: number
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
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
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
      orders: {
        Row: {
          corkage_fee: number | null
          covers: number | null
          created_at: string
          customer_id: string | null
          customer_name: string
          customer_phone: string
          delivery_address: string | null
          delivery_fee: number
          delivery_type: Database["public"]["Enums"]["delivery_type"]
          external_drinks_count: number | null
          id: string
          items: Json
          notes: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status: Database["public"]["Enums"]["payment_status"]
          restaurant_id: string
          service_fee: number | null
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
          delivery_address?: string | null
          delivery_fee?: number
          delivery_type?: Database["public"]["Enums"]["delivery_type"]
          external_drinks_count?: number | null
          id?: string
          items: Json
          notes?: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          restaurant_id: string
          service_fee?: number | null
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
          delivery_address?: string | null
          delivery_fee?: number
          delivery_type?: Database["public"]["Enums"]["delivery_type"]
          external_drinks_count?: number | null
          id?: string
          items?: Json
          notes?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          restaurant_id?: string
          service_fee?: number | null
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
          payer_msisdn: string | null
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
          payer_msisdn?: string | null
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
          payer_msisdn?: string | null
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
            referencedRelation: "restaurants"
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
      products: {
        Row: {
          allergens: Json | null
          calories: number | null
          category_id: string | null
          compare_at_price: number | null
          created_at: string
          description: string | null
          dine_in_price: number | null
          id: string
          image_url: string | null
          is_available: boolean
          is_dine_in_only: boolean | null
          is_gluten_free: boolean | null
          is_halal: boolean | null
          is_no_delivery: boolean | null
          is_vegan: boolean | null
          name: string
          options: Json | null
          prep_time: number | null
          price: number
          restaurant_id: string
          sort_order: number
          tags: Json | null
          updated_at: string
        }
        Insert: {
          allergens?: Json | null
          calories?: number | null
          category_id?: string | null
          compare_at_price?: number | null
          created_at?: string
          description?: string | null
          dine_in_price?: number | null
          id?: string
          image_url?: string | null
          is_available?: boolean
          is_dine_in_only?: boolean | null
          is_gluten_free?: boolean | null
          is_halal?: boolean | null
          is_no_delivery?: boolean | null
          is_vegan?: boolean | null
          name: string
          options?: Json | null
          prep_time?: number | null
          price: number
          restaurant_id: string
          sort_order?: number
          tags?: Json | null
          updated_at?: string
        }
        Update: {
          allergens?: Json | null
          calories?: number | null
          category_id?: string | null
          compare_at_price?: number | null
          created_at?: string
          description?: string | null
          dine_in_price?: number | null
          id?: string
          image_url?: string | null
          is_available?: boolean
          is_dine_in_only?: boolean | null
          is_gluten_free?: boolean | null
          is_halal?: boolean | null
          is_no_delivery?: boolean | null
          is_vegan?: boolean | null
          name?: string
          options?: Json | null
          prep_time?: number | null
          price?: number
          restaurant_id?: string
          sort_order?: number
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
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          cancellation_reason: string | null
          confirmed_at: string | null
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
          party_size: number
          pre_order_id: string | null
          restaurant_id: string
          seated_at: string | null
          special_requests: string | null
          status: string | null
          table_id: string | null
          time: string
          updated_at: string | null
          zone_preference: string | null
        }
        Insert: {
          cancellation_reason?: string | null
          confirmed_at?: string | null
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
          party_size: number
          pre_order_id?: string | null
          restaurant_id: string
          seated_at?: string | null
          special_requests?: string | null
          status?: string | null
          table_id?: string | null
          time: string
          updated_at?: string | null
          zone_preference?: string | null
        }
        Update: {
          cancellation_reason?: string | null
          confirmed_at?: string | null
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
          party_size?: number
          pre_order_id?: string | null
          restaurant_id?: string
          seated_at?: string | null
          special_requests?: string | null
          status?: string | null
          table_id?: string | null
          time?: string
          updated_at?: string | null
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
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "restaurant_tables"
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
          delivery_base_fee: number | null
          delivery_per_km_fee: number | null
          delivery_zones: Json | null
          description: string | null
          dine_in_service_fee: number | null
          email: string | null
          geohash: string | null
          has_dine_in: boolean | null
          has_reservations: boolean | null
          id: string
          is_premium: boolean | null
          is_published: boolean
          is_sponsored: boolean | null
          is_verified: boolean | null
          lat: number | null
          lng: number | null
          logo_url: string | null
          max_delivery_radius_km: number | null
          min_order_amount: number
          name: string
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
          reservation_cancel_notice_minutes: number | null
          reservation_cancel_policy: string | null
          reservation_cancellation_fee_amount: number | null
          review_count: number | null
          saas_plan_id: string | null
          slug: string
          sms_notifications_enabled: boolean | null
          sponsored_rank: number | null
          sponsored_until: string | null
          total_tables: number | null
          updated_at: string
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
          delivery_base_fee?: number | null
          delivery_per_km_fee?: number | null
          delivery_zones?: Json | null
          description?: string | null
          dine_in_service_fee?: number | null
          email?: string | null
          geohash?: string | null
          has_dine_in?: boolean | null
          has_reservations?: boolean | null
          id?: string
          is_premium?: boolean | null
          is_published?: boolean
          is_sponsored?: boolean | null
          is_verified?: boolean | null
          lat?: number | null
          lng?: number | null
          logo_url?: string | null
          max_delivery_radius_km?: number | null
          min_order_amount?: number
          name: string
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
          reservation_cancel_notice_minutes?: number | null
          reservation_cancel_policy?: string | null
          reservation_cancellation_fee_amount?: number | null
          review_count?: number | null
          saas_plan_id?: string | null
          slug: string
          sms_notifications_enabled?: boolean | null
          sponsored_rank?: number | null
          sponsored_until?: string | null
          total_tables?: number | null
          updated_at?: string
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
          delivery_base_fee?: number | null
          delivery_per_km_fee?: number | null
          delivery_zones?: Json | null
          description?: string | null
          dine_in_service_fee?: number | null
          email?: string | null
          geohash?: string | null
          has_dine_in?: boolean | null
          has_reservations?: boolean | null
          id?: string
          is_published?: boolean
          is_sponsored?: boolean | null
          is_verified?: boolean | null
          lat?: number | null
          lng?: number | null
          logo_url?: string | null
          max_delivery_radius_km?: number | null
          min_order_amount?: number
          name?: string
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
          reservation_cancel_notice_minutes?: number | null
          reservation_cancel_policy?: string | null
          reservation_cancellation_fee_amount?: number | null
          review_count?: number | null
          saas_plan_id?: string | null
          slug?: string
          sms_notifications_enabled?: boolean | null
          sponsored_rank?: number | null
          sponsored_until?: string | null
          total_tables?: number | null
          updated_at?: string
        }
        Relationships: [
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
          comment: string | null
          created_at: string
          customer_id: string
          id: string
          order_id: string
          rating: number
          restaurant_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          customer_id: string
          id?: string
          order_id: string
          rating: number
          restaurant_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          order_id?: string
          rating?: number
          restaurant_id?: string
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
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
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
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          description: string
          id: string
          order_id: string | null
          priority: string | null
          reporter_id: string | null
          reporter_type: string
          resolved_at: string | null
          restaurant_id: string | null
          status: string | null
          subject: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          description: string
          id?: string
          order_id?: string | null
          priority?: string | null
          reporter_id?: string | null
          reporter_type?: string
          resolved_at?: string | null
          restaurant_id?: string | null
          status?: string | null
          subject: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          description?: string
          id?: string
          order_id?: string | null
          priority?: string | null
          reporter_id?: string | null
          reporter_type?: string
          resolved_at?: string | null
          restaurant_id?: string | null
          status?: string | null
          subject?: string
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
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      table_zones: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          restaurant_id: string
          sort_order: number | null
          type: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          restaurant_id: string
          sort_order?: number | null
          type?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          restaurant_id?: string
          sort_order?: number | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "table_zones_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
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
          role: Database["public"]["Enums"]["user_role"]
          theme_preference: string | null
          updated_at: string
          wallet_balance: number
          restaurant_id: string | null
        }
        Insert: {
          admin_role?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
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
          role?: Database["public"]["Enums"]["user_role"]
          theme_preference?: string | null
          updated_at?: string
          wallet_balance?: number
          restaurant_id?: string | null
        }
        Update: {
          admin_role?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
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
          role?: Database["public"]["Enums"]["user_role"]
          theme_preference?: string | null
          updated_at?: string
          wallet_balance?: number
          restaurant_id?: string | null
        }
        Relationships: []
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
      [_ in never]: never
    }
    Functions: {
      increment_referral_stats: {
        Args: { input_user_id: string; reward_amount: number }
        Returns: undefined
      }
      increment_wallet_balance: {
        Args: { amount: number; input_user_id: string }
        Returns: undefined
      }
      slugify: { Args: { text: string }; Returns: string }
    }
    Enums: {
      delivery_type: "delivery" | "pickup" | "dine_in"
      order_status:
        | "pending"
        | "accepted"
        | "preparing"
        | "ready"
        | "completed"
        | "cancelled"
      payment_method: "mobile_money_mtn" | "mobile_money_orange" | "cash"
      payment_status: "pending" | "paid" | "failed" | "refunded"
      payout_status: "pending" | "paid" | "failed"
      user_role: "merchant" | "customer" | "admin" | "support"
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
        "pending",
        "accepted",
        "preparing",
        "ready",
        "completed",
        "cancelled",
      ],
      payment_method: ["mobile_money_mtn", "mobile_money_orange", "cash"],
      payment_status: ["pending", "paid", "failed", "refunded"],
      payout_status: ["pending", "paid", "failed"],
      user_role: ["merchant", "customer", "admin", "support"],
    },
  },
} as const;

// --- Types helpers raccourcis ---

export type User = Tables<"users">;
export type Restaurant = Tables<"restaurants">;
export type Category = Tables<"categories">;
export type Product = Tables<"products">;
export type Order = Tables<"orders">;
export type Review = Tables<"reviews">;
export type Payout = Tables<"payouts">;
export type TableZone = Tables<"table_zones">;
export type RestaurantTable = Tables<"restaurant_tables">;
export type Reservation = Tables<"reservations">;
export type Coupon = Tables<"coupons">;

// --- Marketing types (if not in main Tables) ---

export type AdCampaignPackage = "basic" | "premium" | "elite";
export type AdCampaignStatus = "pending" | "active" | "completed" | "cancelled";

export interface AdCampaign {
  id: string;
  restaurant_id: string;
  package: AdCampaignPackage;
  status: AdCampaignStatus;
  starts_at: string;
  ends_at: string;
  budget: number;
  include_push: boolean;
  push_sent: boolean;
  push_message: string | null;
  impressions: number;
  clicks: number;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
}

// --- Common Enums ---

export type OrderStatus = Enums<"order_status"> | "delivering" | "delivered";
export type UserRole = Enums<"user_role">;
export type PayoutStatus = Enums<"payout_status">;
export type PaymentMethod = Enums<"payment_method">;
export type PaymentStatus = Enums<"payment_status">;
export type DeliveryType = Enums<"delivery_type">;
