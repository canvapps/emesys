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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      app_users: {
        Row: {
          avatar: string | null
          created_at: string | null
          email: string
          email_verified: boolean | null
          id: string
          is_active: boolean | null
          name: string
          password_hash: string
          role: string | null
          updated_at: string | null
        }
        Insert: {
          avatar?: string | null
          created_at?: string | null
          email: string
          email_verified?: boolean | null
          id?: string
          is_active?: boolean | null
          name: string
          password_hash: string
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar?: string | null
          created_at?: string | null
          email?: string
          email_verified?: boolean | null
          id?: string
          is_active?: boolean | null
          name?: string
          password_hash?: string
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      password_reset_tokens: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          token: string
          used: boolean | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          token: string
          used?: boolean | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          token?: string
          used?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "password_reset_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sessions: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          session_token: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          session_token: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          session_token?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      wedding_contact_info: {
        Row: {
          created_at: string | null
          email_address: string | null
          email_text: string
          help_description: string | null
          help_title: string
          id: string
          is_visible: boolean | null
          updated_at: string | null
          whatsapp_number: string | null
          whatsapp_text: string
        }
        Insert: {
          created_at?: string | null
          email_address?: string | null
          email_text?: string
          help_description?: string | null
          help_title: string
          id?: string
          is_visible?: boolean | null
          updated_at?: string | null
          whatsapp_number?: string | null
          whatsapp_text?: string
        }
        Update: {
          created_at?: string | null
          email_address?: string | null
          email_text?: string
          help_description?: string | null
          help_title?: string
          id?: string
          is_visible?: boolean | null
          updated_at?: string | null
          whatsapp_number?: string | null
          whatsapp_text?: string
        }
        Relationships: []
      }
      wedding_couple_info: {
        Row: {
          bride_description: string | null
          bride_education: string | null
          bride_full_name: string
          bride_hobbies: string | null
          bride_image_url: string | null
          bride_name: string
          bride_parents: string
          bride_profession: string | null
          created_at: string | null
          groom_description: string | null
          groom_education: string | null
          groom_full_name: string
          groom_hobbies: string | null
          groom_image_url: string | null
          groom_name: string
          groom_parents: string
          groom_profession: string | null
          id: string
          is_active: boolean | null
          updated_at: string | null
        }
        Insert: {
          bride_description?: string | null
          bride_education?: string | null
          bride_full_name: string
          bride_hobbies?: string | null
          bride_image_url?: string | null
          bride_name: string
          bride_parents: string
          bride_profession?: string | null
          created_at?: string | null
          groom_description?: string | null
          groom_education?: string | null
          groom_full_name: string
          groom_hobbies?: string | null
          groom_image_url?: string | null
          groom_name: string
          groom_parents: string
          groom_profession?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
        }
        Update: {
          bride_description?: string | null
          bride_education?: string | null
          bride_full_name?: string
          bride_hobbies?: string | null
          bride_image_url?: string | null
          bride_name?: string
          bride_parents?: string
          bride_profession?: string | null
          created_at?: string | null
          groom_description?: string | null
          groom_education?: string | null
          groom_full_name?: string
          groom_hobbies?: string | null
          groom_image_url?: string | null
          groom_name?: string
          groom_parents?: string
          groom_profession?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      wedding_footer_content: {
        Row: {
          contact_address: string | null
          contact_email: string | null
          contact_phone: string | null
          copyright_text: string | null
          couple_names: string
          created_at: string | null
          footer_description: string | null
          id: string
          is_visible: boolean | null
          social_buttons: Json | null
          thank_you_message: string | null
          thank_you_title: string
          updated_at: string | null
          wedding_date: string
        }
        Insert: {
          contact_address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          copyright_text?: string | null
          couple_names: string
          created_at?: string | null
          footer_description?: string | null
          id?: string
          is_visible?: boolean | null
          social_buttons?: Json | null
          thank_you_message?: string | null
          thank_you_title?: string
          updated_at?: string | null
          wedding_date: string
        }
        Update: {
          contact_address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          copyright_text?: string | null
          couple_names?: string
          created_at?: string | null
          footer_description?: string | null
          id?: string
          is_visible?: boolean | null
          social_buttons?: Json | null
          thank_you_message?: string | null
          thank_you_title?: string
          updated_at?: string | null
          wedding_date?: string
        }
        Relationships: []
      }
      wedding_hero_settings: {
        Row: {
          bride_name: string
          ceremony_venue_address: string
          ceremony_venue_name: string
          countdown_enabled: boolean | null
          created_at: string | null
          groom_name: string
          hero_background_image: string | null
          hero_description: string | null
          hero_subtitle: string | null
          id: string
          is_active: boolean | null
          reception_venue_address: string | null
          reception_venue_name: string | null
          updated_at: string | null
          wedding_date: string
          wedding_time: string
        }
        Insert: {
          bride_name: string
          ceremony_venue_address: string
          ceremony_venue_name: string
          countdown_enabled?: boolean | null
          created_at?: string | null
          groom_name: string
          hero_background_image?: string | null
          hero_description?: string | null
          hero_subtitle?: string | null
          id?: string
          is_active?: boolean | null
          reception_venue_address?: string | null
          reception_venue_name?: string | null
          updated_at?: string | null
          wedding_date: string
          wedding_time: string
        }
        Update: {
          bride_name?: string
          ceremony_venue_address?: string
          ceremony_venue_name?: string
          countdown_enabled?: boolean | null
          created_at?: string | null
          groom_name?: string
          hero_background_image?: string | null
          hero_description?: string | null
          hero_subtitle?: string | null
          id?: string
          is_active?: boolean | null
          reception_venue_address?: string | null
          reception_venue_name?: string | null
          updated_at?: string | null
          wedding_date?: string
          wedding_time?: string
        }
        Relationships: []
      }
      wedding_important_info: {
        Row: {
          additional_info: Json | null
          created_at: string | null
          dress_code_description: string | null
          dress_code_title: string
          download_invitation_enabled: boolean | null
          download_invitation_text: string
          health_protocol_description: string | null
          health_protocol_title: string
          id: string
          is_visible: boolean | null
          title: string
          updated_at: string | null
        }
        Insert: {
          additional_info?: Json | null
          created_at?: string | null
          dress_code_description?: string | null
          dress_code_title?: string
          download_invitation_enabled?: boolean | null
          download_invitation_text?: string
          health_protocol_description?: string | null
          health_protocol_title?: string
          id?: string
          is_visible?: boolean | null
          title?: string
          updated_at?: string | null
        }
        Update: {
          additional_info?: Json | null
          created_at?: string | null
          dress_code_description?: string | null
          dress_code_title?: string
          download_invitation_enabled?: boolean | null
          download_invitation_text?: string
          health_protocol_description?: string | null
          health_protocol_title?: string
          id?: string
          is_visible?: boolean | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      wedding_love_story: {
        Row: {
          created_at: string | null
          description: string | null
          full_story: string | null
          id: string
          is_visible: boolean | null
          subtitle: string | null
          timeline_items: Json | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          full_story?: string | null
          id?: string
          is_visible?: boolean | null
          subtitle?: string | null
          timeline_items?: Json | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          full_story?: string | null
          id?: string
          is_visible?: boolean | null
          subtitle?: string | null
          timeline_items?: Json | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const