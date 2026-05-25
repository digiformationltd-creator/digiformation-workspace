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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ad01_filings: {
        Row: {
          company_id: string | null
          created_at: string | null
          filed_date: string
          id: string
          notes: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          filed_date: string
          id?: string
          notes?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          filed_date?: string
          id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad01_filings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          ad01_filing_date: string | null
          address_match_status: string | null
          address_status: Database["public"]["Enums"]["address_status"] | null
          auth_code: string | null
          ch_address: string | null
          ch_company_profile: Json | null
          ch_company_status: string | null
          company_address: string | null
          company_name: string
          company_number: string
          created_at: string | null
          director_id: string | null
          id: string
          incorporation_date: string | null
          last_ch_sync: string | null
          sic_codes: string[] | null
          status: Database["public"]["Enums"]["company_status"] | null
          tags: string[] | null
          updated_at: string | null
          utr_number: string | null
        }
        Insert: {
          ad01_filing_date?: string | null
          address_match_status?: string | null
          address_status?: Database["public"]["Enums"]["address_status"] | null
          auth_code?: string | null
          ch_address?: string | null
          ch_company_profile?: Json | null
          ch_company_status?: string | null
          company_address?: string | null
          company_name: string
          company_number: string
          created_at?: string | null
          director_id?: string | null
          id?: string
          incorporation_date?: string | null
          last_ch_sync?: string | null
          sic_codes?: string[] | null
          status?: Database["public"]["Enums"]["company_status"] | null
          tags?: string[] | null
          updated_at?: string | null
          utr_number?: string | null
        }
        Update: {
          ad01_filing_date?: string | null
          address_match_status?: string | null
          address_status?: Database["public"]["Enums"]["address_status"] | null
          auth_code?: string | null
          ch_address?: string | null
          ch_company_profile?: Json | null
          ch_company_status?: string | null
          company_address?: string | null
          company_name?: string
          company_number?: string
          created_at?: string | null
          director_id?: string | null
          id?: string
          incorporation_date?: string | null
          last_ch_sync?: string | null
          sic_codes?: string[] | null
          status?: Database["public"]["Enums"]["company_status"] | null
          tags?: string[] | null
          updated_at?: string | null
          utr_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "companies_director_id_fkey"
            columns: ["director_id"]
            isOneToOne: false
            referencedRelation: "directors"
            referencedColumns: ["id"]
          },
        ]
      }
      company_status_logs: {
        Row: {
          changed_at: string | null
          changed_by: string | null
          company_id: string | null
          id: string
          new_status: Database["public"]["Enums"]["company_status"] | null
          old_status: Database["public"]["Enums"]["company_status"] | null
        }
        Insert: {
          changed_at?: string | null
          changed_by?: string | null
          company_id?: string | null
          id?: string
          new_status?: Database["public"]["Enums"]["company_status"] | null
          old_status?: Database["public"]["Enums"]["company_status"] | null
        }
        Update: {
          changed_at?: string | null
          changed_by?: string | null
          company_id?: string | null
          id?: string
          new_status?: Database["public"]["Enums"]["company_status"] | null
          old_status?: Database["public"]["Enums"]["company_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "company_status_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      directors: {
        Row: {
          created_at: string | null
          id: string
          name: string
          verification_status: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          verification_status?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          verification_status?: string | null
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
      address_status: "Default Address" | "Changed/Updated"
      company_status:
        | "Active"
        | "Available Company"
        | "Sold/Transferred"
        | "Strike Off Notice"
        | "Struck Off"
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
      address_status: ["Default Address", "Changed/Updated"],
      company_status: [
        "Active",
        "Available Company",
        "Sold/Transferred",
        "Strike Off Notice",
        "Struck Off",
      ],
    },
  },
} as const
