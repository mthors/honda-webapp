export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type MotorcycleStatus = 'draft' | 'published' | 'archived';
export type VariantStatus = 'active' | 'inactive';
export type PriceType = 'otr' | 'cash' | 'promo';
export type PromotionStatus = 'draft' | 'published' | 'archived';
export type BannerStatus = 'draft' | 'published' | 'archived';
export type ImageRole = 'hero' | 'card' | 'gallery' | 'color';
export type StaffRole = 'admin';
export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'follow_up'
  | 'converted'
  | 'not_interested'
  | 'unreachable'
  | 'duplicate'
  | 'invalid';

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      motorcycle_models: {
        Row: {
          id: string;
          category_id: string;
          name: string;
          slug: string;
          short_description: string | null;
          description: string | null;
          engine_cc: number | null;
          transmission: string | null;
          key_specs: Record<string, Json>;
          is_featured: boolean;
          is_new: boolean;
          status: MotorcycleStatus;
          seo_title: string | null;
          seo_description: string | null;
          created_at: string;
          updated_at: string;
          published_at: string | null;
        };
        Insert: {
          id?: string;
          category_id: string;
          name: string;
          slug: string;
          short_description?: string | null;
          description?: string | null;
          engine_cc?: number | null;
          transmission?: string | null;
          key_specs?: Record<string, Json>;
          is_featured?: boolean;
          is_new?: boolean;
          status?: MotorcycleStatus;
          seo_title?: string | null;
          seo_description?: string | null;
          created_at?: string;
          updated_at?: string;
          published_at?: string | null;
        };
        Update: {
          id?: string;
          category_id?: string;
          name?: string;
          slug?: string;
          short_description?: string | null;
          description?: string | null;
          engine_cc?: number | null;
          transmission?: string | null;
          key_specs?: Record<string, Json>;
          is_featured?: boolean;
          is_new?: boolean;
          status?: MotorcycleStatus;
          seo_title?: string | null;
          seo_description?: string | null;
          created_at?: string;
          updated_at?: string;
          published_at?: string | null;
        };
      };
      motorcycle_variants: {
        Row: {
          id: string;
          model_id: string;
          name: string;
          code: string | null;
          description: string | null;
          sort_order: number;
          status: VariantStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          model_id: string;
          name: string;
          code?: string | null;
          description?: string | null;
          sort_order?: number;
          status?: VariantStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          model_id?: string;
          name?: string;
          code?: string | null;
          description?: string | null;
          sort_order?: number;
          status?: VariantStatus;
          created_at?: string;
          updated_at?: string;
        };
      };
      colors: {
        Row: {
          id: string;
          name: string;
          slug: string;
          hex_code: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          hex_code?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          hex_code?: string | null;
          created_at?: string;
        };
      };
      variant_colors: {
        Row: {
          id: string;
          variant_id: string;
          color_id: string;
          image_path: string | null;
          is_available: boolean;
          sort_order: number;
        };
        Insert: {
          id?: string;
          variant_id: string;
          color_id: string;
          image_path?: string | null;
          is_available?: boolean;
          sort_order?: number;
        };
        Update: {
          id?: string;
          variant_id?: string;
          color_id?: string;
          image_path?: string | null;
          is_available?: boolean;
          sort_order?: number;
        };
      };
      model_images: {
        Row: {
          id: string;
          model_id: string;
          variant_id: string | null;
          color_id: string | null;
          storage_path: string;
          alt_text: string;
          image_role: ImageRole;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          model_id: string;
          variant_id?: string | null;
          color_id?: string | null;
          storage_path: string;
          alt_text: string;
          image_role?: ImageRole;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          model_id?: string;
          variant_id?: string | null;
          color_id?: string | null;
          storage_path?: string;
          alt_text?: string;
          image_role?: ImageRole;
          sort_order?: number;
          created_at?: string;
        };
      };
      price_entries: {
        Row: {
          id: string;
          variant_id: string;
          city: string | null;
          branch_id: string | null;
          price_type: PriceType;
          amount_idr: number;
          valid_from: string;
          valid_until: string | null;
          is_published: boolean;
          source_note: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          variant_id: string;
          city?: string | null;
          branch_id?: string | null;
          price_type?: PriceType;
          amount_idr: number;
          valid_from: string;
          valid_until?: string | null;
          is_published?: boolean;
          source_note?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          variant_id?: string;
          city?: string | null;
          branch_id?: string | null;
          price_type?: PriceType;
          amount_idr?: number;
          valid_from?: string;
          valid_until?: string | null;
          is_published?: boolean;
          source_note?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      promotions: {
        Row: {
          id: string;
          title: string;
          slug: string;
          summary: string;
          details: string | null;
          image_path: string | null;
          starts_at: string;
          ends_at: string;
          terms: string | null;
          status: PromotionStatus;
          cta_label: string | null;
          cta_url: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          summary: string;
          details?: string | null;
          image_path?: string | null;
          starts_at: string;
          ends_at: string;
          terms?: string | null;
          status?: PromotionStatus;
          cta_label?: string | null;
          cta_url?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          summary?: string;
          details?: string | null;
          image_path?: string | null;
          starts_at?: string;
          ends_at?: string;
          terms?: string | null;
          status?: PromotionStatus;
          cta_label?: string | null;
          cta_url?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      promotion_models: {
        Row: {
          promotion_id: string;
          model_id: string;
        };
        Insert: {
          promotion_id: string;
          model_id: string;
        };
        Update: {
          promotion_id?: string;
          model_id?: string;
        };
      };
      hero_banners: {
        Row: {
          id: string;
          title: string;
          subtitle: string | null;
          desktop_image_path: string;
          mobile_image_path: string | null;
          alt_text: string;
          cta_label: string | null;
          cta_url: string | null;
          starts_at: string | null;
          ends_at: string | null;
          sort_order: number;
          status: BannerStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          subtitle?: string | null;
          desktop_image_path: string;
          mobile_image_path?: string | null;
          alt_text: string;
          cta_label?: string | null;
          cta_url?: string | null;
          starts_at?: string | null;
          ends_at?: string | null;
          sort_order?: number;
          status?: BannerStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          subtitle?: string | null;
          desktop_image_path?: string;
          mobile_image_path?: string | null;
          alt_text?: string;
          cta_label?: string | null;
          cta_url?: string | null;
          starts_at?: string | null;
          ends_at?: string | null;
          sort_order?: number;
          status?: BannerStatus;
          created_at?: string;
          updated_at?: string;
        };
      };
      leads: {
        Row: {
          id: string;
          lead_reference: string;
          full_name: string;
          whatsapp_number: string;
          email: string | null;
          city: string;
          district: string | null;
          model_id: string | null;
          variant_id: string | null;
          color_id: string | null;
          model_name_snapshot: string | null;
          variant_name_snapshot: string | null;
          color_name_snapshot: string | null;
          price_snapshot_idr: number | null;
          credit_down_payment_idr: number | null;
          credit_tenor_months: number | null;
          credit_estimated_installment_idr: number | null;
          credit_config_snapshot: Record<string, Json> | null;
          message: string | null;
          source_page: string | null;
          source_campaign: string | null;
          consent_privacy_at: string;
          status: LeadStatus;
          assigned_to: string | null;
          created_at: string;
          updated_at: string;
          closed_at: string | null;
        };
        Insert: {
          id?: string;
          lead_reference: string;
          full_name: string;
          whatsapp_number: string;
          email?: string | null;
          city: string;
          district?: string | null;
          model_id?: string | null;
          variant_id?: string | null;
          color_id?: string | null;
          model_name_snapshot?: string | null;
          variant_name_snapshot?: string | null;
          color_name_snapshot?: string | null;
          price_snapshot_idr?: number | null;
          credit_down_payment_idr?: number | null;
          credit_tenor_months?: number | null;
          credit_estimated_installment_idr?: number | null;
          credit_config_snapshot?: Record<string, Json> | null;
          message?: string | null;
          source_page?: string | null;
          source_campaign?: string | null;
          consent_privacy_at: string;
          status?: LeadStatus;
          assigned_to?: string | null;
          created_at?: string;
          updated_at?: string;
          closed_at?: string | null;
        };
        Update: {
          id?: string;
          lead_reference?: string;
          full_name?: string;
          whatsapp_number?: string;
          email?: string | null;
          city?: string;
          district?: string | null;
          model_id?: string | null;
          variant_id?: string | null;
          color_id?: string | null;
          model_name_snapshot?: string | null;
          variant_name_snapshot?: string | null;
          color_name_snapshot?: string | null;
          price_snapshot_idr?: number | null;
          credit_down_payment_idr?: number | null;
          credit_tenor_months?: number | null;
          credit_estimated_installment_idr?: number | null;
          credit_config_snapshot?: Record<string, Json> | null;
          message?: string | null;
          source_page?: string | null;
          source_campaign?: string | null;
          consent_privacy_at?: string;
          status?: LeadStatus;
          assigned_to?: string | null;
          created_at?: string;
          updated_at?: string;
          closed_at?: string | null;
        };
      };
      staff_profiles: {
        Row: {
          user_id: string;
          display_name: string;
          role: StaffRole;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          display_name: string;
          role?: StaffRole;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          display_name?: string;
          role?: StaffRole;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      site_settings: {
        Row: {
          id: string;
          dealer_name: string;
          logo_path: string | null;
          address: string | null;
          city: string | null;
          phone: string | null;
          whatsapp_number: string;
          public_email: string | null;
          opening_hours: Record<string, Json>;
          social_links: Record<string, Json>;
          privacy_notice: string;
          updated_by: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          dealer_name: string;
          logo_path?: string | null;
          address?: string | null;
          city?: string | null;
          phone?: string | null;
          whatsapp_number: string;
          public_email?: string | null;
          opening_hours?: Record<string, Json>;
          social_links?: Record<string, Json>;
          privacy_notice: string;
          updated_by?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          dealer_name?: string;
          logo_path?: string | null;
          address?: string | null;
          city?: string | null;
          phone?: string | null;
          whatsapp_number?: string;
          public_email?: string | null;
          opening_hours?: Record<string, Json>;
          social_links?: Record<string, Json>;
          privacy_notice?: string;
          updated_by?: string | null;
          updated_at?: string;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          actor_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          summary: string;
          metadata: Record<string, Json>;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          summary: string;
          metadata?: Record<string, Json>;
          created_at?: string;
        };
        Update: {
          id?: string;
          actor_id?: string | null;
          action?: string;
          entity_type?: string;
          entity_id?: string | null;
          summary?: string;
          metadata?: Record<string, Json>;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      admin_upsert_price_entry: {
        Args: {
          p_id: string | null;
          p_variant_id: string;
          p_city: string | null;
          p_price_type: string;
          p_amount_idr: number;
          p_valid_from: string;
          p_valid_until: string | null;
          p_is_published: boolean;
          p_source_note: string | null;
          p_summary: string;
        };
        Returns: Database['public']['Tables']['price_entries']['Row'];
      };
      admin_upsert_promotion: {
        Args: {
          p_id: string | null;
          p_title: string;
          p_slug: string;
          p_summary: string;
          p_details: string | null;
          p_image_path: string | null;
          p_starts_at: string;
          p_ends_at: string;
          p_terms: string | null;
          p_status: string;
          p_cta_label: string | null;
          p_cta_url: string | null;
          p_model_ids: string[];
          p_audit_summary: string;
        };
        Returns: Database['public']['Tables']['promotions']['Row'];
      };
      admin_upsert_hero_banner: {
        Args: {
          p_id: string | null;
          p_title: string;
          p_subtitle: string | null;
          p_desktop_image_path: string;
          p_mobile_image_path: string | null;
          p_alt_text: string;
          p_cta_label: string | null;
          p_cta_url: string | null;
          p_starts_at: string | null;
          p_ends_at: string | null;
          p_sort_order: number;
          p_status: string;
          p_audit_summary: string;
        };
        Returns: Database['public']['Tables']['hero_banners']['Row'];
      };
    };
  };
}
