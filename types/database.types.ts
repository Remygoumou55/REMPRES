export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      permissions: {
        Row: {
          id: string;
          role_key: string;
          module_key: string;
          can_create: boolean;
          can_read: boolean;
          can_update: boolean;
          can_delete: boolean;
          can_approve: boolean;
          can_export: boolean;
          can_assign: boolean;
          can_manage_users: boolean;
          can_manage_settings: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          role_key: string;
          module_key: string;
          can_create?: boolean;
          can_read?: boolean;
          can_update?: boolean;
          can_delete?: boolean;
          can_approve?: boolean;
          can_export?: boolean;
          can_assign?: boolean;
          can_manage_users?: boolean;
          can_manage_settings?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          role_key?: string;
          module_key?: string;
          can_create?: boolean;
          can_read?: boolean;
          can_update?: boolean;
          can_delete?: boolean;
          can_approve?: boolean;
          can_export?: boolean;
          can_assign?: boolean;
          can_manage_users?: boolean;
          can_manage_settings?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          first_name: string | null;
          last_name: string | null;
          email: string | null;
          role_key: string;
          department_key: string | null;
          avatar_url: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id: string;
          first_name?: string | null;
          last_name?: string | null;
          email?: string | null;
          role_key: string;
          department_key?: string | null;
          avatar_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          first_name?: string | null;
          last_name?: string | null;
          email?: string | null;
          role_key?: string;
          department_key?: string | null;
          avatar_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      activity_logs: {
        Row: {
          id: string;
          actor_user_id: string;
          module_key: string;
          action_key: string;
          target_table: string | null;
          target_id: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_user_id: string;
          module_key: string;
          action_key: string;
          target_table?: string | null;
          target_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          actor_user_id?: string;
          module_key?: string;
          action_key?: string;
          target_table?: string | null;
          target_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      clients: {
        Row: {
          id: string;
          client_type: "individual" | "company";
          first_name: string | null;
          last_name: string | null;
          company_name: string | null;
          email: string | null;
          phone: string | null;
          address: string | null;
          city: string | null;
          country: string | null;
          notes: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
          deleted_by: string | null;
        };
        Insert: {
          id?: string;
          client_type: "individual" | "company";
          first_name?: string | null;
          last_name?: string | null;
          company_name?: string | null;
          email?: string | null;
          phone?: string | null;
          address?: string | null;
          city?: string | null;
          country?: string | null;
          notes?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
        };
        Update: {
          id?: string;
          client_type?: "individual" | "company";
          first_name?: string | null;
          last_name?: string | null;
          company_name?: string | null;
          email?: string | null;
          phone?: string | null;
          address?: string | null;
          city?: string | null;
          country?: string | null;
          notes?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
        };
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          sku: string;
          name: string;
          description: string | null;
          image_url: string | null;
          unit: string;
          price_gnf: number;
          stock_quantity: number;
          stock_threshold: number;
          created_by: string;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
          deleted_by: string | null;
        };
        Insert: {
          id?: string;
          sku: string;
          name: string;
          description?: string | null;
          image_url?: string | null;
          unit?: string;
          price_gnf?: number;
          stock_quantity?: number;
          stock_threshold?: number;
          created_by: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
        };
        Update: {
          id?: string;
          sku?: string;
          name?: string;
          description?: string | null;
          image_url?: string | null;
          unit?: string;
          price_gnf?: number;
          stock_quantity?: number;
          stock_threshold?: number;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
        };
        Relationships: [];
      };
      stock_movements: {
        Row: {
          id: string;
          product_id: string;
          movement_type: "entry" | "exit" | "adjustment" | "return" | "loss";
          quantity: number;
          previous_stock: number;
          new_stock: number;
          reason: string | null;
          reference_id: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          movement_type: "entry" | "exit" | "adjustment" | "return" | "loss";
          quantity: number;
          previous_stock: number;
          new_stock: number;
          reason?: string | null;
          reference_id?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          movement_type?: "entry" | "exit" | "adjustment" | "return" | "loss";
          quantity?: number;
          previous_stock?: number;
          new_stock?: number;
          reason?: string | null;
          reference_id?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      sales: {
        Row: {
          id: string;
          reference: string | null;
          client_id: string | null;
          seller_id: string | null;
          subtotal: number;
          discount_percent: number;
          discount_amount: number;
          total_amount_gnf: number;
          display_currency: string;
          exchange_rate: number;
          payment_method:
            | "cash"
            | "mobile_money"
            | "orange_money"
            | "bank_transfer"
            | "credit"
            | "mixed"
            | null;
          payment_status: "pending" | "partial" | "paid" | "overdue" | "cancelled";
          amount_paid_gnf: number;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          reference?: string | null;
          client_id?: string | null;
          seller_id?: string | null;
          subtotal?: number;
          discount_percent?: number;
          discount_amount?: number;
          total_amount_gnf: number;
          display_currency?: string;
          exchange_rate?: number;
          payment_method?:
            | "cash"
            | "mobile_money"
            | "orange_money"
            | "bank_transfer"
            | "credit"
            | "mixed"
            | null;
          payment_status?: "pending" | "partial" | "paid" | "overdue" | "cancelled";
          amount_paid_gnf?: number;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          reference?: string | null;
          client_id?: string | null;
          seller_id?: string | null;
          subtotal?: number;
          discount_percent?: number;
          discount_amount?: number;
          total_amount_gnf?: number;
          display_currency?: string;
          exchange_rate?: number;
          payment_method?:
            | "cash"
            | "mobile_money"
            | "orange_money"
            | "bank_transfer"
            | "credit"
            | "mixed"
            | null;
          payment_status?: "pending" | "partial" | "paid" | "overdue" | "cancelled";
          amount_paid_gnf?: number;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      sales_archive: {
        Row: {
          id: string;
          original_sale_id: string;
          archived_by: string | null;
          client_id: string | null;
          total_amount_gnf: number | null;
          payment_status: string | null;
          created_at: string | null;
          archived_at: string;
          raw_data: Json;
        };
        Insert: {
          id?: string;
          original_sale_id: string;
          archived_by?: string | null;
          client_id?: string | null;
          total_amount_gnf?: number | null;
          payment_status?: string | null;
          created_at?: string | null;
          archived_at?: string;
          raw_data?: Json;
        };
        Update: {
          id?: string;
          original_sale_id?: string;
          archived_by?: string | null;
          client_id?: string | null;
          total_amount_gnf?: number | null;
          payment_status?: string | null;
          created_at?: string | null;
          archived_at?: string;
          raw_data?: Json;
        };
        Relationships: [];
      };
      sale_items: {
        Row: {
          id: string;
          sale_id: string;
          product_id: string | null;
          product_name: string;
          product_sku: string | null;
          quantity: number;
          unit_price_gnf: number;
          discount_percent: number;
          total_price_gnf: number;
        };
        Insert: {
          id?: string;
          sale_id: string;
          product_id?: string | null;
          product_name: string;
          product_sku?: string | null;
          quantity: number;
          unit_price_gnf: number;
          discount_percent?: number;
          total_price_gnf: number;
        };
        Update: {
          id?: string;
          sale_id?: string;
          product_id?: string | null;
          product_name?: string;
          product_sku?: string | null;
          quantity?: number;
          unit_price_gnf?: number;
          discount_percent?: number;
          total_price_gnf?: number;
        };
        Relationships: [];
      };
      currency_rates: {
        Row: {
          id: string;
          currency_code: string;
          rate_to_gnf: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          currency_code: string;
          rate_to_gnf: number;
          updated_at?: string;
        };
        Update: {
          id?: string;
          currency_code?: string;
          rate_to_gnf?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      expense_categories: {
        Row: {
          id: string;
          name: string;
          color: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          color?: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          color?: string;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      expenses: {
        Row: {
          id: string;
          category_id: string;
          description: string;
          amount_gnf: number;
          supplier: string | null;
          payment_method: "cash" | "mobile_money" | "bank_transfer" | "other" | null;
          expense_date: string;
          receipt_url: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          category_id: string;
          description: string;
          amount_gnf: number;
          supplier?: string | null;
          payment_method?: "cash" | "mobile_money" | "bank_transfer" | "other" | null;
          expense_date: string;
          receipt_url?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          category_id?: string;
          description?: string;
          amount_gnf?: number;
          supplier?: string | null;
          payment_method?: "cash" | "mobile_money" | "bank_transfer" | "other" | null;
          expense_date?: string;
          receipt_url?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      financial_transactions: {
        Row: {
          id: string;
          source_type: "sale" | "training" | "consultation" | "expense";
          source_id: string;
          client_id: string | null;
          created_by: string | null;
          amount_gnf: number;
          display_currency: "GNF" | "XOF" | "USD" | "EUR";
          display_amount: number;
          exchange_rate: number;
          status: "pending" | "paid" | "partial" | "cancelled";
          paid_at: string | null;
          amount_paid_gnf: number;
          description: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          source_type: "sale" | "training" | "consultation" | "expense";
          source_id: string;
          client_id?: string | null;
          created_by?: string | null;
          amount_gnf: number;
          display_currency?: "GNF" | "XOF" | "USD" | "EUR";
          display_amount?: number;
          exchange_rate?: number;
          status?: "pending" | "paid" | "partial" | "cancelled";
          paid_at?: string | null;
          amount_paid_gnf?: number;
          description?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          source_type?: "sale" | "training" | "consultation" | "expense";
          source_id?: string;
          client_id?: string | null;
          created_by?: string | null;
          amount_gnf?: number;
          display_currency?: "GNF" | "XOF" | "USD" | "EUR";
          display_amount?: number;
          exchange_rate?: number;
          status?: "pending" | "paid" | "partial" | "cancelled";
          paid_at?: string | null;
          amount_paid_gnf?: number;
          description?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      current_user_role: {
        Args: Record<PropertyKey, never>;
        Returns: string | null;
      };
      is_super_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      create_sale_transaction: {
        Args: {
          p_seller_id: string;
          p_created_by: string;
          p_items: Json;
          p_payment_method: string;
          p_client_id?: string | null;
          p_discount_percent?: number;
          p_display_currency?: string;
          p_exchange_rate?: number;
          p_notes?: string | null;
        };
        Returns: Json;
      };
      create_expense_transaction: {
        Args: {
          p_user_id: string;
          p_category_id: string;
          p_amount_gnf: number;
          p_description: string;
          p_expense_date: string;
          p_payment_method: "cash" | "mobile_money" | "bank_transfer" | "other";
          p_receipt_url?: string | null;
        };
        Returns: Json;
      };
      update_expense_transaction: {
        Args: {
          p_expense_id: string;
          p_user_id: string;
          p_category_id: string;
          p_amount_gnf: number;
          p_description: string;
          p_expense_date: string;
          p_payment_method: "cash" | "mobile_money" | "bank_transfer" | "other";
          p_receipt_url?: string | null;
        };
        Returns: Json;
      };
      delete_expense_transaction: {
        Args: {
          p_expense_id: string;
          p_user_id: string;
        };
        Returns: Json;
      };
      record_financial_transaction: {
        Args: {
          p_source_type: "sale" | "training" | "consultation" | "expense";
          p_source_id: string;
          p_client_id: string | null;
          p_created_by: string;
          p_amount_gnf: number;
          p_display_currency?: string;
          p_exchange_rate?: number;
          p_description?: string | null;
          p_status?: string;
        };
        Returns: string | null;
      };
      archive_and_soft_delete_sale: {
        Args: { p_sale_id: string };
        Returns: undefined;
      };
    };
    Enums: {
      expense_payment_method: "cash" | "mobile_money" | "bank_transfer" | "other";
    };
    CompositeTypes: Record<string, never>;
  };
};
