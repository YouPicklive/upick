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
      businesses: {
        Row: {
          active: boolean | null
          category: string
          city: string | null
          created_at: string
          description: string | null
          energy: string | null
          id: string
          is_outdoor: boolean | null
          latitude: number | null
          longitude: number | null
          name: string
          neighborhood: string | null
          owner_user_id: string | null
          photo_url: string | null
          price_level: string | null
          rating: number | null
          smoking_friendly: boolean | null
          state: string | null
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          category?: string
          city?: string | null
          created_at?: string
          description?: string | null
          energy?: string | null
          id?: string
          is_outdoor?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name: string
          neighborhood?: string | null
          owner_user_id?: string | null
          photo_url?: string | null
          price_level?: string | null
          rating?: number | null
          smoking_friendly?: boolean | null
          state?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          category?: string
          city?: string | null
          created_at?: string
          description?: string | null
          energy?: string | null
          id?: string
          is_outdoor?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          neighborhood?: string | null
          owner_user_id?: string | null
          photo_url?: string | null
          price_level?: string | null
          rating?: number | null
          smoking_friendly?: boolean | null
          state?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      card_decks: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          price_cents: number | null
          tier: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id: string
          is_active?: boolean
          name: string
          price_cents?: number | null
          tier?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          price_cents?: number | null
          tier?: string
        }
        Relationships: []
      }
      cities: {
        Row: {
          country: string
          created_at: string
          id: string
          is_popular: boolean
          lat: number
          lng: number
          name: string
          state: string | null
          timezone: string | null
        }
        Insert: {
          country?: string
          created_at?: string
          id?: string
          is_popular?: boolean
          lat: number
          lng: number
          name: string
          state?: string | null
          timezone?: string | null
        }
        Update: {
          country?: string
          created_at?: string
          id?: string
          is_popular?: boolean
          lat?: number
          lng?: number
          name?: string
          state?: string | null
          timezone?: string | null
        }
        Relationships: []
      }
      deck_cards: {
        Row: {
          action_text: string
          arcana: string
          card_name: string
          card_number: number | null
          category: string | null
          created_at: string
          deck_id: string
          id: string
          image_url: string | null
          is_active: boolean
          suit: string | null
          vibe_tag: string | null
        }
        Insert: {
          action_text: string
          arcana?: string
          card_name: string
          card_number?: number | null
          category?: string | null
          created_at?: string
          deck_id: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          suit?: string | null
          vibe_tag?: string | null
        }
        Update: {
          action_text?: string
          arcana?: string
          card_name?: string
          card_number?: number | null
          category?: string | null
          created_at?: string
          deck_id?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          suit?: string | null
          vibe_tag?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deck_cards_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "card_decks"
            referencedColumns: ["id"]
          },
        ]
      }
      event_logs: {
        Row: {
          created_at: string
          event_name: string
          id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_name: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_name?: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "bot_profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_posts: {
        Row: {
          body: string | null
          bot_avatar_url: string | null
          bot_display_name: string | null
          city: string | null
          city_id: string | null
          created_at: string
          expires_at: string | null
          id: string
          is_anonymous: boolean
          is_bot: boolean
          lat: number | null
          lng: number | null
          metadata: Json | null
          post_subtype: string | null
          post_type: string
          region: string | null
          result_address: string | null
          result_category: string | null
          result_name: string
          result_place_id: string | null
          title: string
          user_id: string | null
          visibility: string
        }
        Insert: {
          body?: string | null
          bot_avatar_url?: string | null
          bot_display_name?: string | null
          city?: string | null
          city_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_anonymous?: boolean
          is_bot?: boolean
          lat?: number | null
          lng?: number | null
          metadata?: Json | null
          post_subtype?: string | null
          post_type: string
          region?: string | null
          result_address?: string | null
          result_category?: string | null
          result_name: string
          result_place_id?: string | null
          title: string
          user_id?: string | null
          visibility?: string
        }
        Update: {
          body?: string | null
          bot_avatar_url?: string | null
          bot_display_name?: string | null
          city?: string | null
          city_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_anonymous?: boolean
          is_bot?: boolean
          lat?: number | null
          lng?: number | null
          metadata?: Json | null
          post_subtype?: string | null
          post_type?: string
          region?: string | null
          result_address?: string | null
          result_category?: string | null
          result_name?: string
          result_place_id?: string | null
          title?: string
          user_id?: string | null
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_posts_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      fortunes: {
        Row: {
          active: boolean
          created_at: string
          id: string
          pack_key: string | null
          tags: string[] | null
          text: string
          tier: Database["public"]["Enums"]["fortune_tier"]
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          pack_key?: string | null
          tags?: string[] | null
          text: string
          tier?: Database["public"]["Enums"]["fortune_tier"]
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          pack_key?: string | null
          tags?: string[] | null
          text?: string
          tier?: Database["public"]["Enums"]["fortune_tier"]
        }
        Relationships: []
      }
      mile_marker_transactions: {
        Row: {
          created_at: string
          id: string
          metadata: Json
          points: number
          reason: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json
          points: number
          reason: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json
          points?: number
          reason?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mile_marker_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "bot_profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mile_marker_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mile_marker_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      mile_markers: {
        Row: {
          last_daily_award_date: string | null
          lifetime_points: number
          points_balance: number
          updated_at: string
          user_id: string
        }
        Insert: {
          last_daily_award_date?: string | null
          lifetime_points?: number
          points_balance?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          last_daily_award_date?: string | null
          lifetime_points?: number
          points_balance?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mile_markers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "bot_profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mile_markers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mile_markers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      place_photos: {
        Row: {
          id: string
          photo_urls: string[]
          place_id: string
          updated_at: string
        }
        Insert: {
          id?: string
          photo_urls?: string[]
          place_id: string
          updated_at?: string
        }
        Update: {
          id?: string
          photo_urls?: string[]
          place_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      place_reviews: {
        Row: {
          content: string | null
          created_at: string
          id: string
          is_public: boolean
          note: string | null
          place_id: string | null
          place_name: string
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          is_public?: boolean
          note?: string | null
          place_id?: string | null
          place_name: string
          rating?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          is_public?: boolean
          note?: string | null
          place_id?: string | null
          place_name?: string
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          city: string | null
          content: string | null
          created_at: string
          event_ends_at: string | null
          event_starts_at: string | null
          id: string
          latitude: number | null
          longitude: number | null
          place_category: string | null
          place_id: string | null
          place_name: string | null
          type: string
          user_id: string
        }
        Insert: {
          city?: string | null
          content?: string | null
          created_at?: string
          event_ends_at?: string | null
          event_starts_at?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          place_category?: string | null
          place_id?: string | null
          place_name?: string | null
          type: string
          user_id: string
        }
        Update: {
          city?: string | null
          content?: string | null
          created_at?: string
          event_ends_at?: string | null
          event_starts_at?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          place_category?: string | null
          place_id?: string | null
          place_name?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          alignment_streak_count: number
          avatar_url: string | null
          bio: string | null
          bot_slug: string | null
          city: string | null
          created_at: string
          default_post_privacy: string
          display_name: string | null
          experiences_completed_count: number
          id: string
          is_bot: boolean
          last_spin_date: string | null
          region: string | null
          selected_city_id: string | null
          timezone: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          alignment_streak_count?: number
          avatar_url?: string | null
          bio?: string | null
          bot_slug?: string | null
          city?: string | null
          created_at?: string
          default_post_privacy?: string
          display_name?: string | null
          experiences_completed_count?: number
          id: string
          is_bot?: boolean
          last_spin_date?: string | null
          region?: string | null
          selected_city_id?: string | null
          timezone?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          alignment_streak_count?: number
          avatar_url?: string | null
          bio?: string | null
          bot_slug?: string | null
          city?: string | null
          created_at?: string
          default_post_privacy?: string
          display_name?: string | null
          experiences_completed_count?: number
          id?: string
          is_bot?: boolean
          last_spin_date?: string | null
          region?: string | null
          selected_city_id?: string | null
          timezone?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_selected_city_id_fkey"
            columns: ["selected_city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      reward_redemptions: {
        Row: {
          created_at: string
          id: string
          points_spent: number
          redemption_code: string
          request_id: string
          reward_id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          points_spent: number
          redemption_code: string
          request_id: string
          reward_id: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          points_spent?: number
          redemption_code?: string
          request_id?: string
          reward_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reward_redemptions_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reward_redemptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "bot_profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reward_redemptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reward_redemptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      rewards: {
        Row: {
          active: boolean
          created_at: string
          description: string
          expires_at: string | null
          id: string
          partner_business_id: string | null
          points_cost: number
          quantity_available: number
          reward_type: string
          title: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description: string
          expires_at?: string | null
          id?: string
          partner_business_id?: string | null
          points_cost: number
          quantity_available?: number
          reward_type: string
          title: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string
          expires_at?: string | null
          id?: string
          partner_business_id?: string | null
          points_cost?: number
          quantity_available?: number
          reward_type?: string
          title?: string
        }
        Relationships: []
      }
      saved_activities: {
        Row: {
          activity_type: string
          address: string | null
          category: string | null
          created_at: string
          description: string | null
          event_date: string | null
          event_time: string | null
          feed_post_id: string | null
          id: string
          latitude: number | null
          longitude: number | null
          note: string | null
          place_name: string | null
          source_url: string | null
          title: string
          user_id: string
          venue: string | null
        }
        Insert: {
          activity_type: string
          address?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          event_date?: string | null
          event_time?: string | null
          feed_post_id?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          note?: string | null
          place_name?: string | null
          source_url?: string | null
          title: string
          user_id: string
          venue?: string | null
        }
        Update: {
          activity_type?: string
          address?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          event_date?: string | null
          event_time?: string | null
          feed_post_id?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          note?: string | null
          place_name?: string | null
          source_url?: string | null
          title?: string
          user_id?: string
          venue?: string | null
        }
        Relationships: []
      }
      saved_card_draws: {
        Row: {
          action_text: string
          card_id: string
          card_name: string
          category: string | null
          created_at: string
          deck_id: string
          id: string
          spin_id: string | null
          user_id: string
          vibe_tag: string | null
        }
        Insert: {
          action_text: string
          card_id: string
          card_name: string
          category?: string | null
          created_at?: string
          deck_id: string
          id?: string
          spin_id?: string | null
          user_id: string
          vibe_tag?: string | null
        }
        Update: {
          action_text?: string
          card_id?: string
          card_name?: string
          category?: string | null
          created_at?: string
          deck_id?: string
          id?: string
          spin_id?: string | null
          user_id?: string
          vibe_tag?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saved_card_draws_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "deck_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_card_draws_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "card_decks"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_fortunes: {
        Row: {
          context: Json
          created_at: string
          fortune_pack_id: string | null
          fortune_text: string
          id: string
          user_id: string
        }
        Insert: {
          context?: Json
          created_at?: string
          fortune_pack_id?: string | null
          fortune_text: string
          id?: string
          user_id: string
        }
        Update: {
          context?: Json
          created_at?: string
          fortune_pack_id?: string | null
          fortune_text?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_spins: {
        Row: {
          address: string | null
          category: string | null
          created_at: string
          fortune_pack: string | null
          fortune_text: string | null
          id: string
          latitude: number | null
          longitude: number | null
          note: string | null
          photo_url: string | null
          place_id: string | null
          place_name: string
          user_id: string
        }
        Insert: {
          address?: string | null
          category?: string | null
          created_at?: string
          fortune_pack?: string | null
          fortune_text?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          note?: string | null
          photo_url?: string | null
          place_id?: string | null
          place_name: string
          user_id: string
        }
        Update: {
          address?: string | null
          category?: string | null
          created_at?: string
          fortune_pack?: string | null
          fortune_text?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          note?: string | null
          photo_url?: string | null
          place_id?: string | null
          place_name?: string
          user_id?: string
        }
        Relationships: []
      }
      social_shares: {
        Row: {
          approved_at: string | null
          caption: string | null
          created_at: string
          id: string
          lat: number | null
          lng: number | null
          place_id: string | null
          place_name: string | null
          platform: string
          post_url: string
          status: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          caption?: string | null
          created_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          place_id?: string | null
          place_name?: string | null
          platform: string
          post_url: string
          status?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          caption?: string | null
          created_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          place_id?: string | null
          place_name?: string | null
          platform?: string
          post_url?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      spin_events: {
        Row: {
          caption: string | null
          category: string | null
          city: string | null
          created_at: string
          id: string
          lat: number | null
          lng: number | null
          place_id: string | null
          place_name: string
          posted_to_feed_at: string | null
          region: string | null
          should_post_to_feed: boolean
          user_id: string
        }
        Insert: {
          caption?: string | null
          category?: string | null
          city?: string | null
          created_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          place_id?: string | null
          place_name: string
          posted_to_feed_at?: string | null
          region?: string | null
          should_post_to_feed?: boolean
          user_id: string
        }
        Update: {
          caption?: string | null
          category?: string | null
          city?: string | null
          created_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          place_id?: string | null
          place_name?: string
          posted_to_feed_at?: string | null
          region?: string | null
          should_post_to_feed?: boolean
          user_id?: string
        }
        Relationships: []
      }
      stripe_customers: {
        Row: {
          created_at: string
          stripe_customer_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          stripe_customer_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          stripe_customer_id?: string
          user_id?: string
        }
        Relationships: []
      }
      stripe_subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          current_period_end: string | null
          price_id: string | null
          status: string
          stripe_subscription_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          current_period_end?: string | null
          price_id?: string | null
          status: string
          stripe_subscription_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean
          current_period_end?: string | null
          price_id?: string | null
          status?: string
          stripe_subscription_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_deck_ownership: {
        Row: {
          created_at: string
          deck_id: string
          source: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deck_id: string
          source?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deck_id?: string
          source?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_deck_ownership_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "card_decks"
            referencedColumns: ["id"]
          },
        ]
      }
      user_entitlements: {
        Row: {
          can_save_fortunes: boolean
          created_at: string
          free_spin_limit_per_day: number
          id: string
          owned_packs: string[] | null
          plus_active: boolean
          spins_reset_date: string
          spins_used_today: number
          tier: string
          unlimited_spins: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          can_save_fortunes?: boolean
          created_at?: string
          free_spin_limit_per_day?: number
          id?: string
          owned_packs?: string[] | null
          plus_active?: boolean
          spins_reset_date?: string
          spins_used_today?: number
          tier?: string
          unlimited_spins?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          can_save_fortunes?: boolean
          created_at?: string
          free_spin_limit_per_day?: number
          id?: string
          owned_packs?: string[] | null
          plus_active?: boolean
          spins_reset_date?: string
          spins_used_today?: number
          tier?: string
          unlimited_spins?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      bot_profiles_public: {
        Row: {
          avatar_url: string | null
          bot_slug: string | null
          city: string | null
          display_name: string | null
          id: string | null
          is_bot: boolean | null
          region: string | null
          timezone: string | null
        }
        Insert: {
          avatar_url?: string | null
          bot_slug?: string | null
          city?: string | null
          display_name?: string | null
          id?: string | null
          is_bot?: boolean | null
          region?: string | null
          timezone?: string | null
        }
        Update: {
          avatar_url?: string | null
          bot_slug?: string | null
          city?: string | null
          display_name?: string | null
          id?: string | null
          is_bot?: boolean | null
          region?: string | null
          timezone?: string | null
        }
        Relationships: []
      }
      place_reviews_public: {
        Row: {
          content: string | null
          created_at: string | null
          id: string | null
          is_public: boolean | null
          place_id: string | null
          place_name: string | null
          rating: number | null
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string | null
          is_public?: boolean | null
          place_id?: string | null
          place_name?: string | null
          rating?: number | null
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string | null
          is_public?: boolean | null
          place_id?: string | null
          place_name?: string | null
          rating?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles_public: {
        Row: {
          avatar_url: string | null
          bio: string | null
          city: string | null
          created_at: string | null
          default_post_privacy: string | null
          display_name: string | null
          id: string | null
          region: string | null
          selected_city_id: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string | null
          default_post_privacy?: string | null
          display_name?: string | null
          id?: string | null
          region?: string | null
          selected_city_id?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string | null
          default_post_privacy?: string | null
          display_name?: string | null
          id?: string | null
          region?: string | null
          selected_city_id?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_selected_city_id_fkey"
            columns: ["selected_city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      award_mile_markers: {
        Args: {
          p_metadata?: Json
          p_points: number
          p_reason: string
          p_user_id: string
        }
        Returns: Json
      }
      check_and_consume_spin: { Args: { p_user_id: string }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      mark_experience_tried: { Args: { p_user_id: string }; Returns: Json }
      redeem_mile_marker_reward: {
        Args: { p_request_id: string; p_reward_id: string; p_user_id: string }
        Returns: Json
      }
      update_alignment_streak: { Args: { p_user_id: string }; Returns: Json }
      user_has_plus: { Args: { check_user_id: string }; Returns: boolean }
      user_owns_pack: {
        Args: { check_user_id: string; pack_key: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      fortune_tier: "free" | "plus" | "pack"
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
      app_role: ["admin", "moderator", "user"],
      fortune_tier: ["free", "plus", "pack"],
    },
  },
} as const
