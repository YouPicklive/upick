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
      feed_posts: {
        Row: {
          body: string | null
          bot_avatar_url: string | null
          bot_display_name: string | null
          city: string | null
          created_at: string
          id: string
          is_anonymous: boolean
          is_bot: boolean
          lat: number | null
          lng: number | null
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
          created_at?: string
          id?: string
          is_anonymous?: boolean
          is_bot?: boolean
          lat?: number | null
          lng?: number | null
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
          created_at?: string
          id?: string
          is_anonymous?: boolean
          is_bot?: boolean
          lat?: number | null
          lng?: number | null
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
        Relationships: []
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
          avatar_url: string | null
          bio: string | null
          city: string | null
          created_at: string
          default_post_privacy: string
          display_name: string | null
          email: string
          id: string
          region: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          default_post_privacy?: string
          display_name?: string | null
          email: string
          id: string
          region?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          default_post_privacy?: string
          display_name?: string | null
          email?: string
          id?: string
          region?: string | null
          updated_at?: string
          username?: string | null
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
          place_name?: string | null
          source_url?: string | null
          title?: string
          user_id?: string
          venue?: string | null
        }
        Relationships: []
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
      [_ in never]: never
    }
    Functions: {
      check_and_consume_spin: { Args: { p_user_id: string }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
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
