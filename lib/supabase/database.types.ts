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
      business_settings: {
        Row: {
          address: string | null
          brand_accent: string | null
          brand_primary: string | null
          business_name: string
          default_invoice_terms: string | null
          default_quote_terms: string | null
          email: string | null
          google_review_url: string | null
          id: string
          logo_url: string | null
          payment_methods_accepted: string[] | null
          phone: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          brand_accent?: string | null
          brand_primary?: string | null
          business_name?: string
          default_invoice_terms?: string | null
          default_quote_terms?: string | null
          email?: string | null
          google_review_url?: string | null
          id?: string
          logo_url?: string | null
          payment_methods_accepted?: string[] | null
          phone?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          brand_accent?: string | null
          brand_primary?: string | null
          business_name?: string
          default_invoice_terms?: string | null
          default_quote_terms?: string | null
          email?: string | null
          google_review_url?: string | null
          id?: string
          logo_url?: string | null
          payment_methods_accepted?: string[] | null
          phone?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      change_order_items: {
        Row: {
          change_order_id: string
          created_at: string
          description: string
          id: string
          line_total: number
          quantity: number
          sort_order: number
          unit_price: number
        }
        Insert: {
          change_order_id: string
          created_at?: string
          description: string
          id?: string
          line_total?: number
          quantity?: number
          sort_order?: number
          unit_price?: number
        }
        Update: {
          change_order_id?: string
          created_at?: string
          description?: string
          id?: string
          line_total?: number
          quantity?: number
          sort_order?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "change_order_items_change_order_id_fkey"
            columns: ["change_order_id"]
            isOneToOne: false
            referencedRelation: "change_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      change_orders: {
        Row: {
          approval_ip: string | null
          approval_signature_name: string | null
          approval_signature_text: string | null
          approval_snapshot_json: Json | null
          approval_terms_version: string | null
          approval_user_agent: string | null
          approved_at: string | null
          archived: boolean
          change_order_number: string
          client_email: string | null
          client_id: string
          client_name: string | null
          client_phone: string | null
          created_at: string
          created_by: string | null
          decline_reason: string | null
          declined_at: string | null
          id: string
          invoice_id: string | null
          job_id: string
          notes: string | null
          public_id: string
          scope_change_reason: string | null
          sent_at: string | null
          status: string
          subtotal: number
          tax_amount: number
          tax_rate: number
          title: string
          total: number
          updated_at: string
        }
        Insert: {
          approval_ip?: string | null
          approval_signature_name?: string | null
          approval_signature_text?: string | null
          approval_snapshot_json?: Json | null
          approval_terms_version?: string | null
          approval_user_agent?: string | null
          approved_at?: string | null
          archived?: boolean
          change_order_number: string
          client_email?: string | null
          client_id: string
          client_name?: string | null
          client_phone?: string | null
          created_at?: string
          created_by?: string | null
          decline_reason?: string | null
          declined_at?: string | null
          id?: string
          invoice_id?: string | null
          job_id: string
          notes?: string | null
          public_id: string
          scope_change_reason?: string | null
          sent_at?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          tax_rate?: number
          title?: string
          total?: number
          updated_at?: string
        }
        Update: {
          approval_ip?: string | null
          approval_signature_name?: string | null
          approval_signature_text?: string | null
          approval_snapshot_json?: Json | null
          approval_terms_version?: string | null
          approval_user_agent?: string | null
          approved_at?: string | null
          archived?: boolean
          change_order_number?: string
          client_email?: string | null
          client_id?: string
          client_name?: string | null
          client_phone?: string | null
          created_at?: string
          created_by?: string | null
          decline_reason?: string | null
          declined_at?: string | null
          id?: string
          invoice_id?: string | null
          job_id?: string
          notes?: string | null
          public_id?: string
          scope_change_reason?: string | null
          sent_at?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          tax_rate?: number
          title?: string
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "change_orders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "change_orders_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "change_orders_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          archived: boolean
          client_type: string
          created_at: string
          email: string | null
          follow_up_date: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          referral_source: string | null
          review_status: string
        }
        Insert: {
          address?: string | null
          archived?: boolean
          client_type: string
          created_at?: string
          email?: string | null
          follow_up_date?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          referral_source?: string | null
          review_status?: string
        }
        Update: {
          address?: string | null
          archived?: boolean
          client_type?: string
          created_at?: string
          email?: string | null
          follow_up_date?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          referral_source?: string | null
          review_status?: string
        }
        Relationships: []
      }
      cms_navigation: {
        Row: {
          href: string
          id: string
          is_visible: boolean
          label: string
          sort_order: number
        }
        Insert: {
          href: string
          id?: string
          is_visible?: boolean
          label: string
          sort_order?: number
        }
        Update: {
          href?: string
          id?: string
          is_visible?: boolean
          label?: string
          sort_order?: number
        }
        Relationships: []
      }
      cms_sections: {
        Row: {
          content: Json
          id: string
          is_visible: boolean
          page_key: string
          section_key: string
          sort_order: number
          title: string | null
          updated_at: string
        }
        Insert: {
          content?: Json
          id?: string
          is_visible?: boolean
          page_key: string
          section_key: string
          sort_order?: number
          title?: string | null
          updated_at?: string
        }
        Update: {
          content?: Json
          id?: string
          is_visible?: boolean
          page_key?: string
          section_key?: string
          sort_order?: number
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      cms_seo: {
        Row: {
          description: string | null
          id: string
          og_image_url: string | null
          page_key: string
          title: string | null
          updated_at: string
        }
        Insert: {
          description?: string | null
          id?: string
          og_image_url?: string | null
          page_key: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          description?: string | null
          id?: string
          og_image_url?: string | null
          page_key?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      crew_members: {
        Row: {
          archived: boolean
          created_at: string
          default_pay_rate: number
          id: string
          name: string
          notes: string | null
          pay_rate_unit: string
          phone: string | null
          role: string | null
        }
        Insert: {
          archived?: boolean
          created_at?: string
          default_pay_rate?: number
          id?: string
          name: string
          notes?: string | null
          pay_rate_unit?: string
          phone?: string | null
          role?: string | null
        }
        Update: {
          archived?: boolean
          created_at?: string
          default_pay_rate?: number
          id?: string
          name?: string
          notes?: string | null
          pay_rate_unit?: string
          phone?: string | null
          role?: string | null
        }
        Relationships: []
      }
      crew_payouts: {
        Row: {
          calculated_total: number
          created_at: string
          crew_member_ids: string[]
          flat_amount: number | null
          hours: number | null
          id: string
          job_id: string
          pay_type: string
          percent: number | null
        }
        Insert: {
          calculated_total?: number
          created_at?: string
          crew_member_ids: string[]
          flat_amount?: number | null
          hours?: number | null
          id?: string
          job_id: string
          pay_type: string
          percent?: number | null
        }
        Update: {
          calculated_total?: number
          created_at?: string
          crew_member_ids?: string[]
          flat_amount?: number | null
          hours?: number | null
          id?: string
          job_id?: string
          pay_type?: string
          percent?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "crew_payouts_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          archived: boolean
          category: string
          created_at: string
          crew_member_id: string | null
          description: string
          expense_date: string
          expense_type: string
          id: string
          is_recurring: boolean
          job_id: string | null
          notes: string | null
          payment_method: string
          receipt_url: string | null
          recurring_interval: string | null
          reimbursable: boolean
          reimbursed: boolean
          vendor: string
        }
        Insert: {
          amount: number
          archived?: boolean
          category: string
          created_at?: string
          crew_member_id?: string | null
          description: string
          expense_date: string
          expense_type: string
          id?: string
          is_recurring?: boolean
          job_id?: string | null
          notes?: string | null
          payment_method: string
          receipt_url?: string | null
          recurring_interval?: string | null
          reimbursable?: boolean
          reimbursed?: boolean
          vendor: string
        }
        Update: {
          amount?: number
          archived?: boolean
          category?: string
          created_at?: string
          crew_member_id?: string | null
          description?: string
          expense_date?: string
          expense_type?: string
          id?: string
          is_recurring?: boolean
          job_id?: string | null
          notes?: string | null
          payment_method?: string
          receipt_url?: string | null
          recurring_interval?: string | null
          reimbursable?: boolean
          reimbursed?: boolean
          vendor?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_crew_member_id_fkey"
            columns: ["crew_member_id"]
            isOneToOne: false
            referencedRelation: "crew_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          description: string
          id: string
          invoice_id: string
          quantity: number
          sort_order: number
          unit_price: number
        }
        Insert: {
          description: string
          id?: string
          invoice_id: string
          quantity?: number
          sort_order?: number
          unit_price?: number
        }
        Update: {
          description?: string
          id?: string
          invoice_id?: string
          quantity?: number
          sort_order?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          archived: boolean
          client_id: string
          created_at: string
          deposit_paid: number
          discount: number
          document_status: string
          due_date: string | null
          id: string
          invoice_number: string
          job_id: string | null
          notes: string | null
          paid_date: string | null
          payment_method: string | null
          payment_status: string
          public_id: string
          quote_id: string | null
          review_request_status: string
          terms: string | null
        }
        Insert: {
          archived?: boolean
          client_id: string
          created_at?: string
          deposit_paid?: number
          discount?: number
          document_status?: string
          due_date?: string | null
          id?: string
          invoice_number: string
          job_id?: string | null
          notes?: string | null
          paid_date?: string | null
          payment_method?: string | null
          payment_status: string
          public_id: string
          quote_id?: string | null
          review_request_status?: string
          terms?: string | null
        }
        Update: {
          archived?: boolean
          client_id?: string
          created_at?: string
          deposit_paid?: number
          discount?: number
          document_status?: string
          due_date?: string | null
          id?: string
          invoice_number?: string
          job_id?: string | null
          notes?: string | null
          paid_date?: string | null
          payment_method?: string | null
          payment_status?: string
          public_id?: string
          quote_id?: string | null
          review_request_status?: string
          terms?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      job_photos: {
        Row: {
          category: string
          created_at: string
          file_url: string
          id: string
          job_id: string
          storage_path: string
        }
        Insert: {
          category: string
          created_at?: string
          file_url: string
          id?: string
          job_id: string
          storage_path: string
        }
        Update: {
          category?: string
          created_at?: string
          file_url?: string
          id?: string
          job_id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_photos_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          address: string
          after_photo_urls: string[] | null
          archived: boolean
          assigned_crew_ids: string[] | null
          before_photo_urls: string[] | null
          client_id: string
          created_at: string
          dump_fee_cost: number
          end_time: string | null
          equipment_cost: number
          estimated_labor_cost: number
          estimated_materials_cost: number
          fuel_cost: number
          id: string
          internal_notes: string | null
          invoice_id: string | null
          job_date: string
          job_expense_total: number
          job_notes: string | null
          payment_method: string | null
          quote_id: string | null
          referral_source: string | null
          revenue: number
          review_requested: boolean
          service_type: string
          start_time: string | null
          status: string
          truck_rental_cost: number
        }
        Insert: {
          address: string
          after_photo_urls?: string[] | null
          archived?: boolean
          assigned_crew_ids?: string[] | null
          before_photo_urls?: string[] | null
          client_id: string
          created_at?: string
          dump_fee_cost?: number
          end_time?: string | null
          equipment_cost?: number
          estimated_labor_cost?: number
          estimated_materials_cost?: number
          fuel_cost?: number
          id?: string
          internal_notes?: string | null
          invoice_id?: string | null
          job_date: string
          job_expense_total?: number
          job_notes?: string | null
          payment_method?: string | null
          quote_id?: string | null
          referral_source?: string | null
          revenue?: number
          review_requested?: boolean
          service_type: string
          start_time?: string | null
          status: string
          truck_rental_cost?: number
        }
        Update: {
          address?: string
          after_photo_urls?: string[] | null
          archived?: boolean
          assigned_crew_ids?: string[] | null
          before_photo_urls?: string[] | null
          client_id?: string
          created_at?: string
          dump_fee_cost?: number
          end_time?: string | null
          equipment_cost?: number
          estimated_labor_cost?: number
          estimated_materials_cost?: number
          fuel_cost?: number
          id?: string
          internal_notes?: string | null
          invoice_id?: string | null
          job_date?: string
          job_expense_total?: number
          job_notes?: string | null
          payment_method?: string | null
          quote_id?: string | null
          referral_source?: string | null
          revenue?: number
          review_requested?: boolean
          service_type?: string
          start_time?: string | null
          status?: string
          truck_rental_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "jobs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      media_assets: {
        Row: {
          before_after_group: string | null
          before_after_role: string | null
          created_at: string
          file_type: string
          file_url: string
          folder_id: string | null
          id: string
          is_featured: boolean
          sort_order: number
          storage_path: string | null
          tags: string[]
          title: string | null
        }
        Insert: {
          before_after_group?: string | null
          before_after_role?: string | null
          created_at?: string
          file_type?: string
          file_url: string
          folder_id?: string | null
          id?: string
          is_featured?: boolean
          sort_order?: number
          storage_path?: string | null
          tags?: string[]
          title?: string | null
        }
        Update: {
          before_after_group?: string | null
          before_after_role?: string | null
          created_at?: string
          file_type?: string
          file_url?: string
          folder_id?: string | null
          id?: string
          is_featured?: boolean
          sort_order?: number
          storage_path?: string | null
          tags?: string[]
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "media_assets_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "media_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      media_folders: {
        Row: {
          id: string
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          id?: string
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      quote_items: {
        Row: {
          description: string
          id: string
          is_addon: boolean
          quantity: number
          quote_id: string
          sort_order: number
          unit_price: number
        }
        Insert: {
          description: string
          id?: string
          is_addon?: boolean
          quantity?: number
          quote_id: string
          sort_order?: number
          unit_price?: number
        }
        Update: {
          description?: string
          id?: string
          is_addon?: boolean
          quantity?: number
          quote_id?: string
          sort_order?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "quote_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_request_activity: {
        Row: {
          activity_type: string
          body: string | null
          created_at: string
          created_by: string | null
          id: string
          metadata: Json | null
          quote_request_id: string
        }
        Insert: {
          activity_type: string
          body?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          metadata?: Json | null
          quote_request_id: string
        }
        Update: {
          activity_type?: string
          body?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          metadata?: Json | null
          quote_request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_request_activity_quote_request_id_fkey"
            columns: ["quote_request_id"]
            isOneToOne: false
            referencedRelation: "quote_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_requests: {
        Row: {
          address: string
          archived: boolean
          city: string | null
          client_id: string | null
          created_at: string
          email: string | null
          id: string
          internal_notes: string | null
          invoice_id: string | null
          message: string | null
          name: string
          phone: string
          photo_urls: Json
          preferred_contact: string | null
          preferred_date: string | null
          preferred_time: string | null
          property_type: string | null
          quote_id: string | null
          referrer: string | null
          service_requested: string
          source: string
          status: string
          updated_at: string
        }
        Insert: {
          address: string
          archived?: boolean
          city?: string | null
          client_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          internal_notes?: string | null
          invoice_id?: string | null
          message?: string | null
          name: string
          phone: string
          photo_urls?: Json
          preferred_contact?: string | null
          preferred_date?: string | null
          preferred_time?: string | null
          property_type?: string | null
          quote_id?: string | null
          referrer?: string | null
          service_requested: string
          source?: string
          status?: string
          updated_at?: string
        }
        Update: {
          address?: string
          archived?: boolean
          city?: string | null
          client_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          internal_notes?: string | null
          invoice_id?: string | null
          message?: string | null
          name?: string
          phone?: string
          photo_urls?: Json
          preferred_contact?: string | null
          preferred_date?: string | null
          preferred_time?: string | null
          property_type?: string | null
          quote_id?: string | null
          referrer?: string | null
          service_requested?: string
          source?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_requests_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_requests_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_requests_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          archived: boolean
          client_id: string
          created_at: string
          deposit_amount: number
          deposit_required: boolean
          expiration_date: string | null
          id: string
          internal_notes: string | null
          invoice_id: string | null
          job_address: string
          notes: string | null
          public_id: string
          quote_number: string
          service_type: string
          status: string
          terms: string | null
        }
        Insert: {
          archived?: boolean
          client_id: string
          created_at?: string
          deposit_amount?: number
          deposit_required?: boolean
          expiration_date?: string | null
          id?: string
          internal_notes?: string | null
          invoice_id?: string | null
          job_address: string
          notes?: string | null
          public_id: string
          quote_number: string
          service_type: string
          status: string
          terms?: string | null
        }
        Update: {
          archived?: boolean
          client_id?: string
          created_at?: string
          deposit_amount?: number
          deposit_required?: boolean
          expiration_date?: string | null
          id?: string
          internal_notes?: string | null
          invoice_id?: string | null
          job_address?: string
          notes?: string | null
          public_id?: string
          quote_number?: string
          service_type?: string
          status?: string
          terms?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      signing_requests: {
        Row: {
          audit_json: Json | null
          created_at: string
          created_by: string | null
          document_id: string | null
          document_public_id: string
          document_type: string
          expires_at: string | null
          id: string
          signature_data: string | null
          signature_type: string | null
          signed_at: string | null
          signer_ip: string | null
          signer_name: string | null
          signer_user_agent: string | null
          status: string
          title: string
          token: string
          updated_at: string
        }
        Insert: {
          audit_json?: Json | null
          created_at?: string
          created_by?: string | null
          document_id?: string | null
          document_public_id: string
          document_type: string
          expires_at?: string | null
          id?: string
          signature_data?: string | null
          signature_type?: string | null
          signed_at?: string | null
          signer_ip?: string | null
          signer_name?: string | null
          signer_user_agent?: string | null
          status?: string
          title?: string
          token: string
          updated_at?: string
        }
        Update: {
          audit_json?: Json | null
          created_at?: string
          created_by?: string | null
          document_id?: string | null
          document_public_id?: string
          document_type?: string
          expires_at?: string | null
          id?: string
          signature_data?: string | null
          signature_type?: string | null
          signed_at?: string | null
          signer_ip?: string | null
          signer_name?: string | null
          signer_user_agent?: string | null
          status?: string
          title?: string
          token?: string
          updated_at?: string
        }
        Relationships: []
      }
      sop_checklists: {
        Row: {
          id: string
          items: Json
          section: string
          sop_template_id: string
          sort_order: number
        }
        Insert: {
          id?: string
          items?: Json
          section: string
          sop_template_id: string
          sort_order?: number
        }
        Update: {
          id?: string
          items?: Json
          section?: string
          sop_template_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "sop_checklists_sop_template_id_fkey"
            columns: ["sop_template_id"]
            isOneToOne: false
            referencedRelation: "sop_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      sop_templates: {
        Row: {
          created_at: string
          crew_roles: Json
          estimated_minutes: number
          id: string
          slug: string
          supplies_needed: Json
          title: string
        }
        Insert: {
          created_at?: string
          crew_roles?: Json
          estimated_minutes?: number
          id?: string
          slug: string
          supplies_needed?: Json
          title: string
        }
        Update: {
          created_at?: string
          crew_roles?: Json
          estimated_minutes?: number
          id?: string
          slug?: string
          supplies_needed?: Json
          title?: string
        }
        Relationships: []
      }
      supplies: {
        Row: {
          archived: boolean
          category: string
          cost: number
          created_at: string
          expense_id: string | null
          id: string
          is_reusable: boolean
          name: string
          notes: string | null
          quantity: number
          reorder_level: number
          storage_location: string | null
          unit: string
          updated_at: string
          vendor: string | null
        }
        Insert: {
          archived?: boolean
          category: string
          cost?: number
          created_at?: string
          expense_id?: string | null
          id?: string
          is_reusable?: boolean
          name: string
          notes?: string | null
          quantity?: number
          reorder_level?: number
          storage_location?: string | null
          unit: string
          updated_at?: string
          vendor?: string | null
        }
        Update: {
          archived?: boolean
          category?: string
          cost?: number
          created_at?: string
          expense_id?: string | null
          id?: string
          is_reusable?: boolean
          name?: string
          notes?: string | null
          quantity?: number
          reorder_level?: number
          storage_location?: string | null
          unit?: string
          updated_at?: string
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplies_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
        ]
      }
      supply_job_usage: {
        Row: {
          created_at: string
          id: string
          job_id: string
          notes: string | null
          quantity_used: number
          supply_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_id: string
          notes?: string | null
          quantity_used?: number
          supply_id: string
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string
          notes?: string | null
          quantity_used?: number
          supply_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supply_job_usage_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supply_job_usage_supply_id_fkey"
            columns: ["supply_id"]
            isOneToOne: false
            referencedRelation: "supplies"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          archived: boolean
          assigned_crew_ids: string[]
          assigned_crew_member_id: string | null
          category: string | null
          change_order_id: string | null
          client_id: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          expense_id: string | null
          id: string
          invoice_id: string | null
          job_id: string | null
          priority: string
          recurring_parent_id: string | null
          recurring_rule: string | null
          sort_order: number
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          archived?: boolean
          assigned_crew_ids?: string[]
          assigned_crew_member_id?: string | null
          category?: string | null
          change_order_id?: string | null
          client_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          expense_id?: string | null
          id?: string
          invoice_id?: string | null
          job_id?: string | null
          priority?: string
          recurring_parent_id?: string | null
          recurring_rule?: string | null
          sort_order?: number
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          archived?: boolean
          assigned_crew_ids?: string[]
          assigned_crew_member_id?: string | null
          category?: string | null
          change_order_id?: string | null
          client_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          expense_id?: string | null
          id?: string
          invoice_id?: string | null
          job_id?: string | null
          priority?: string
          recurring_parent_id?: string | null
          recurring_rule?: string | null
          sort_order?: number
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_crew_member_id_fkey"
            columns: ["assigned_crew_member_id"]
            isOneToOne: false
            referencedRelation: "crew_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_change_order_id_fkey"
            columns: ["change_order_id"]
            isOneToOne: false
            referencedRelation: "change_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_recurring_parent_id_fkey"
            columns: ["recurring_parent_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      submit_change_order_approval: {
        Args: {
          p_action: string
          p_decline_reason?: string
          p_ip?: string
          p_public_id: string
          p_signature_name?: string
          p_user_agent?: string
        }
        Returns: Json
      }
      submit_public_quote_request: {
        Args: {
          p_address: string
          p_city?: string
          p_email: string
          p_message?: string
          p_name: string
          p_phone: string
          p_preferred_contact?: string
          p_preferred_date?: string
          p_preferred_time?: string
          p_property_type?: string
          p_referrer?: string
          p_service_requested: string
          p_source?: string
        }
        Returns: string
      }
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
