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
      departments: {
        Row: {
          id: string;
          key: string;
          label: string;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          label: string;
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          key?: string;
          label?: string;
          active?: boolean;
          created_at?: string;
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
          department_id: string | null;
          avatar_url: string | null;
          preferred_language: string | null;
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
          department_id?: string | null;
          avatar_url?: string | null;
          preferred_language?: string | null;
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
          department_id?: string | null;
          avatar_url?: string | null;
          preferred_language?: string | null;
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
      app_roles: {
        Row: {
          key: string;
          label: string;
          created_at: string;
        };
        Insert: {
          key: string;
          label: string;
          created_at?: string;
        };
        Update: {
          key?: string;
          label?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      approval_requests: {
        Row: {
          id: string;
          department_key: string;
          action_type: string;
          entity_type: string;
          entity_id: string;
          requested_by: string;
          requested_at: string;
          payload_snapshot: Json;
          reason: string | null;
          status: "pending" | "approved" | "rejected" | "expired";
          approved_by: string | null;
          approved_at: string | null;
          rejected_at: string | null;
          rejection_reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          department_key: string;
          action_type: string;
          entity_type: string;
          entity_id: string;
          requested_by: string;
          requested_at?: string;
          payload_snapshot?: Json;
          reason?: string | null;
          status?: "pending" | "approved" | "rejected" | "expired";
          approved_by?: string | null;
          approved_at?: string | null;
          rejected_at?: string | null;
          rejection_reason?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          department_key?: string;
          action_type?: string;
          entity_type?: string;
          entity_id?: string;
          requested_by?: string;
          requested_at?: string;
          payload_snapshot?: Json;
          reason?: string | null;
          status?: "pending" | "approved" | "rejected" | "expired";
          approved_by?: string | null;
          approved_at?: string | null;
          rejected_at?: string | null;
          rejection_reason?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      governance_alerts: {
        Row: {
          id: string;
          type: string;
          severity: "low" | "medium" | "high" | "critical";
          department_key: string | null;
          title: string;
          description: string;
          entity_type: string | null;
          entity_id: string | null;
          triggered_by: string | null;
          status: "unread" | "acknowledged" | "resolved";
          metadata: Json;
          created_at: string;
          resolved_at: string | null;
        };
        Insert: {
          id?: string;
          type: string;
          severity: "low" | "medium" | "high" | "critical";
          department_key?: string | null;
          title: string;
          description: string;
          entity_type?: string | null;
          entity_id?: string | null;
          triggered_by?: string | null;
          status?: "unread" | "acknowledged" | "resolved";
          metadata?: Json;
          created_at?: string;
          resolved_at?: string | null;
        };
        Update: {
          id?: string;
          type?: string;
          severity?: "low" | "medium" | "high" | "critical";
          department_key?: string | null;
          title?: string;
          description?: string;
          entity_type?: string | null;
          entity_id?: string | null;
          triggered_by?: string | null;
          status?: "unread" | "acknowledged" | "resolved";
          metadata?: Json;
          created_at?: string;
          resolved_at?: string | null;
        };
        Relationships: [];
      };
      governance_audit_events: {
        Row: {
          id: string;
          category:
            | "authentication"
            | "approval"
            | "mutation"
            | "archive"
            | "invitation"
            | "governance"
            | "security"
            | "system";
          severity: "informational" | "warning" | "critical" | "security";
          department_key: string | null;
          actor_user_id: string | null;
          actor_role: string | null;
          action_type: string;
          entity_type: string | null;
          entity_id: string | null;
          before_snapshot: Json | null;
          after_snapshot: Json | null;
          metadata: Json;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          category:
            | "authentication"
            | "approval"
            | "mutation"
            | "archive"
            | "invitation"
            | "governance"
            | "security"
            | "system";
          severity: "informational" | "warning" | "critical" | "security";
          department_key?: string | null;
          actor_user_id?: string | null;
          actor_role?: string | null;
          action_type: string;
          entity_type?: string | null;
          entity_id?: string | null;
          before_snapshot?: Json | null;
          after_snapshot?: Json | null;
          metadata?: Json;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          category?:
            | "authentication"
            | "approval"
            | "mutation"
            | "archive"
            | "invitation"
            | "governance"
            | "security"
            | "system";
          severity?: "informational" | "warning" | "critical" | "security";
          department_key?: string | null;
          actor_user_id?: string | null;
          actor_role?: string | null;
          action_type?: string;
          entity_type?: string | null;
          entity_id?: string | null;
          before_snapshot?: Json | null;
          after_snapshot?: Json | null;
          metadata?: Json;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      rh_leave_requests: {
        Row: {
          id: string;
          employee_id: string;
          leave_type: "paid" | "sick" | "exceptional";
          start_date: string;
          end_date: string;
          reason: string;
          status: "pending" | "approved" | "rejected" | "cancelled";
          approval_request_id: string | null;
          requested_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          employee_id: string;
          leave_type: "paid" | "sick" | "exceptional";
          start_date: string;
          end_date: string;
          reason: string;
          status?: "pending" | "approved" | "rejected" | "cancelled";
          approval_request_id?: string | null;
          requested_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          employee_id?: string;
          leave_type?: "paid" | "sick" | "exceptional";
          start_date?: string;
          end_date?: string;
          reason?: string;
          status?: "pending" | "approved" | "rejected" | "cancelled";
          approval_request_id?: string | null;
          requested_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      rh_attendance_events: {
        Row: {
          id: string;
          employee_id: string;
          event_type: "check_in" | "check_out" | "manual";
          event_at: string;
          source: "erp" | "admin" | "import";
          notes: string | null;
          recorded_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          employee_id: string;
          event_type: "check_in" | "check_out" | "manual";
          event_at?: string;
          source?: "erp" | "admin" | "import";
          notes?: string | null;
          recorded_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          employee_id?: string;
          event_type?: "check_in" | "check_out" | "manual";
          event_at?: string;
          source?: "erp" | "admin" | "import";
          notes?: string | null;
          recorded_by?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      rh_employee_documents: {
        Row: {
          id: string;
          employee_id: string;
          uploaded_by: string;
          document_type: string;
          file_name: string;
          storage_path: string;
          mime_type: string | null;
          file_size_bytes: number | null;
          metadata: Json;
          created_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          employee_id: string;
          uploaded_by: string;
          document_type: string;
          file_name: string;
          storage_path: string;
          mime_type?: string | null;
          file_size_bytes?: number | null;
          metadata?: Json;
          created_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          employee_id?: string;
          uploaded_by?: string;
          document_type?: string;
          file_name?: string;
          storage_path?: string;
          mime_type?: string | null;
          file_size_bytes?: number | null;
          metadata?: Json;
          created_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      rh_employee_history: {
        Row: {
          id: string;
          employee_id: string;
          event_type: string;
          event_label: string;
          payload: Json;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          employee_id: string;
          event_type: string;
          event_label: string;
          payload?: Json;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          employee_id?: string;
          event_type?: string;
          event_label?: string;
          payload?: Json;
          created_by?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      rh_employee_hierarchy: {
        Row: {
          id: string;
          employee_id: string;
          manager_id: string | null;
          department_key: string | null;
          title: string | null;
          active: boolean;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          employee_id: string;
          manager_id?: string | null;
          department_key?: string | null;
          title?: string | null;
          active?: boolean;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          employee_id?: string;
          manager_id?: string | null;
          department_key?: string | null;
          title?: string | null;
          active?: boolean;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      rh_employee_contracts: {
        Row: {
          id: string;
          employee_id: string;
          contract_type: "cdi" | "cdd" | "internship" | "consulting" | "temporary";
          status: "draft" | "pending_approval" | "active" | "expired" | "terminated" | "renewal_due";
          start_date: string;
          end_date: string | null;
          salary_gnf: number | null;
          title: string | null;
          renewal_window_days: number;
          notes: string | null;
          approval_request_id: string | null;
          created_by: string;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          employee_id: string;
          contract_type: "cdi" | "cdd" | "internship" | "consulting" | "temporary";
          status?: "draft" | "pending_approval" | "active" | "expired" | "terminated" | "renewal_due";
          start_date: string;
          end_date?: string | null;
          salary_gnf?: number | null;
          title?: string | null;
          renewal_window_days?: number;
          notes?: string | null;
          approval_request_id?: string | null;
          created_by: string;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          employee_id?: string;
          contract_type?: "cdi" | "cdd" | "internship" | "consulting" | "temporary";
          status?: "draft" | "pending_approval" | "active" | "expired" | "terminated" | "renewal_due";
          start_date?: string;
          end_date?: string | null;
          salary_gnf?: number | null;
          title?: string | null;
          renewal_window_days?: number;
          notes?: string | null;
          approval_request_id?: string | null;
          created_by?: string;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      rh_contract_documents: {
        Row: {
          id: string;
          contract_id: string;
          uploaded_by: string;
          document_type: string;
          file_name: string;
          storage_path: string;
          mime_type: string | null;
          file_size_bytes: number | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          contract_id: string;
          uploaded_by: string;
          document_type: string;
          file_name: string;
          storage_path: string;
          mime_type?: string | null;
          file_size_bytes?: number | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          contract_id?: string;
          uploaded_by?: string;
          document_type?: string;
          file_name?: string;
          storage_path?: string;
          mime_type?: string | null;
          file_size_bytes?: number | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      rh_contract_history: {
        Row: {
          id: string;
          contract_id: string;
          event_type: string;
          event_label: string;
          payload: Json;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          contract_id: string;
          event_type: string;
          event_label: string;
          payload?: Json;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          contract_id?: string;
          event_type?: string;
          event_label?: string;
          payload?: Json;
          created_by?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      rh_recruitment_candidates: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          phone: string | null;
          job_title: string;
          department_key: string | null;
          pipeline_stage:
            | "sourced"
            | "screening"
            | "interview"
            | "offer"
            | "pending_hire_approval"
            | "hired"
            | "rejected"
            | "withdrawn";
          source_channel: "direct" | "referral" | "agency" | "website" | "other";
          notes: string | null;
          hire_approval_request_id: string | null;
          hired_profile_id: string | null;
          hired_contract_id: string | null;
          created_by: string;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          full_name: string;
          email: string;
          phone?: string | null;
          job_title: string;
          department_key?: string | null;
          pipeline_stage?:
            | "sourced"
            | "screening"
            | "interview"
            | "offer"
            | "pending_hire_approval"
            | "hired"
            | "rejected"
            | "withdrawn";
          source_channel?: "direct" | "referral" | "agency" | "website" | "other";
          notes?: string | null;
          hire_approval_request_id?: string | null;
          hired_profile_id?: string | null;
          hired_contract_id?: string | null;
          created_by: string;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string;
          phone?: string | null;
          job_title?: string;
          department_key?: string | null;
          pipeline_stage?:
            | "sourced"
            | "screening"
            | "interview"
            | "offer"
            | "pending_hire_approval"
            | "hired"
            | "rejected"
            | "withdrawn";
          source_channel?: "direct" | "referral" | "agency" | "website" | "other";
          notes?: string | null;
          hire_approval_request_id?: string | null;
          hired_profile_id?: string | null;
          hired_contract_id?: string | null;
          created_by?: string;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      rh_recruitment_interviews: {
        Row: {
          id: string;
          candidate_id: string;
          interview_type: "phone" | "technical" | "hr" | "panel" | "other";
          scheduled_at: string;
          duration_minutes: number;
          location_note: string | null;
          status: "scheduled" | "completed" | "cancelled" | "no_show";
          notes: string | null;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          candidate_id: string;
          interview_type?: "phone" | "technical" | "hr" | "panel" | "other";
          scheduled_at: string;
          duration_minutes?: number;
          location_note?: string | null;
          status?: "scheduled" | "completed" | "cancelled" | "no_show";
          notes?: string | null;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          candidate_id?: string;
          interview_type?: "phone" | "technical" | "hr" | "panel" | "other";
          scheduled_at?: string;
          duration_minutes?: number;
          location_note?: string | null;
          status?: "scheduled" | "completed" | "cancelled" | "no_show";
          notes?: string | null;
          created_by?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      rh_recruitment_evaluations: {
        Row: {
          id: string;
          candidate_id: string;
          evaluator_user_id: string;
          score: number | null;
          recommendation: "hire" | "hold" | "no_hire";
          comments: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          candidate_id: string;
          evaluator_user_id: string;
          score?: number | null;
          recommendation: "hire" | "hold" | "no_hire";
          comments?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          candidate_id?: string;
          evaluator_user_id?: string;
          score?: number | null;
          recommendation?: "hire" | "hold" | "no_hire";
          comments?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      rh_recruitment_documents: {
        Row: {
          id: string;
          candidate_id: string;
          uploaded_by: string;
          document_type: string;
          file_name: string;
          storage_path: string;
          mime_type: string | null;
          file_size_bytes: number | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          candidate_id: string;
          uploaded_by: string;
          document_type: string;
          file_name: string;
          storage_path: string;
          mime_type?: string | null;
          file_size_bytes?: number | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          candidate_id?: string;
          uploaded_by?: string;
          document_type?: string;
          file_name?: string;
          storage_path?: string;
          mime_type?: string | null;
          file_size_bytes?: number | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      rh_recruitment_history: {
        Row: {
          id: string;
          candidate_id: string;
          event_type: string;
          event_label: string;
          payload: Json;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          candidate_id: string;
          event_type: string;
          event_label: string;
          payload?: Json;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          candidate_id?: string;
          event_type?: string;
          event_label?: string;
          payload?: Json;
          created_by?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      rh_recruitment_onboarding: {
        Row: {
          id: string;
          candidate_id: string;
          status: "not_started" | "in_progress" | "completed";
          checklist: Json;
          linked_profile_id: string | null;
          linked_contract_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          candidate_id: string;
          status?: "not_started" | "in_progress" | "completed";
          checklist?: Json;
          linked_profile_id?: string | null;
          linked_contract_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          candidate_id?: string;
          status?: "not_started" | "in_progress" | "completed";
          checklist?: Json;
          linked_profile_id?: string | null;
          linked_contract_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      erp_infrastructure_jobs: {
        Row: {
          id: string;
          queue_key: string;
          domain_key: string;
          job_type: string;
          payload: Json;
          idempotency_key: string | null;
          status: "pending" | "processing" | "completed" | "failed" | "cancelled";
          priority: number;
          run_after: string;
          attempts: number;
          max_attempts: number;
          last_error: string | null;
          locked_at: string | null;
          locked_by: string | null;
          completed_at: string | null;
          tenant_id: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          queue_key: string;
          domain_key: string;
          job_type: string;
          payload?: Json;
          idempotency_key?: string | null;
          status?: "pending" | "processing" | "completed" | "failed" | "cancelled";
          priority?: number;
          run_after?: string;
          attempts?: number;
          max_attempts?: number;
          last_error?: string | null;
          locked_at?: string | null;
          locked_by?: string | null;
          completed_at?: string | null;
          tenant_id?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          queue_key?: string;
          domain_key?: string;
          job_type?: string;
          payload?: Json;
          idempotency_key?: string | null;
          status?: "pending" | "processing" | "completed" | "failed" | "cancelled";
          priority?: number;
          run_after?: string;
          attempts?: number;
          max_attempts?: number;
          last_error?: string | null;
          locked_at?: string | null;
          locked_by?: string | null;
          completed_at?: string | null;
          tenant_id?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "erp_infrastructure_jobs_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "erp_tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      erp_tenant_analytics_snapshots: {
        Row: {
          tenant_id: string;
          scope_key: string;
          payload: Json;
          computed_at: string;
        };
        Insert: {
          tenant_id: string;
          scope_key: string;
          payload?: Json;
          computed_at?: string;
        };
        Update: {
          tenant_id?: string;
          scope_key?: string;
          payload?: Json;
          computed_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "erp_tenant_analytics_snapshots_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "erp_tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      erp_tenant_billing_accounts: {
        Row: {
          tenant_id: string;
          billing_external_ref: string | null;
          currency_code: string;
          metadata: Json;
          updated_at: string;
        };
        Insert: {
          tenant_id: string;
          billing_external_ref?: string | null;
          currency_code?: string;
          metadata?: Json;
          updated_at?: string;
        };
        Update: {
          tenant_id?: string;
          billing_external_ref?: string | null;
          currency_code?: string;
          metadata?: Json;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "erp_tenant_billing_accounts_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: true;
            referencedRelation: "erp_tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      erp_tenant_compliance_profiles: {
        Row: {
          tenant_id: string;
          isolation_profile_key: string;
          retention_policy_ref: string | null;
          metadata: Json;
          updated_at: string;
        };
        Insert: {
          tenant_id: string;
          isolation_profile_key?: string;
          retention_policy_ref?: string | null;
          metadata?: Json;
          updated_at?: string;
        };
        Update: {
          tenant_id?: string;
          isolation_profile_key?: string;
          retention_policy_ref?: string | null;
          metadata?: Json;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "erp_tenant_compliance_profiles_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: true;
            referencedRelation: "erp_tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      erp_tenant_memberships: {
        Row: {
          tenant_id: string;
          user_id: string;
          membership_role: "owner" | "admin" | "member" | "billing" | "readonly";
          is_primary: boolean;
          created_at: string;
        };
        Insert: {
          tenant_id: string;
          user_id: string;
          membership_role?: "owner" | "admin" | "member" | "billing" | "readonly";
          is_primary?: boolean;
          created_at?: string;
        };
        Update: {
          tenant_id?: string;
          user_id?: string;
          membership_role?: "owner" | "admin" | "member" | "billing" | "readonly";
          is_primary?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "erp_tenant_memberships_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "erp_tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      erp_tenant_orchestration_events: {
        Row: {
          id: string;
          tenant_id: string;
          event_kind: string;
          payload: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          event_kind: string;
          payload?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          event_kind?: string;
          payload?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "erp_tenant_orchestration_events_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "erp_tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      erp_tenant_quotas: {
        Row: {
          tenant_id: string;
          quota_key: string;
          limit_value: number;
          period: "daily" | "monthly" | "all_time";
          metadata: Json;
          updated_at: string;
        };
        Insert: {
          tenant_id: string;
          quota_key: string;
          limit_value: number;
          period?: "daily" | "monthly" | "all_time";
          metadata?: Json;
          updated_at?: string;
        };
        Update: {
          tenant_id?: string;
          quota_key?: string;
          limit_value?: number;
          period?: "daily" | "monthly" | "all_time";
          metadata?: Json;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "erp_tenant_quotas_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "erp_tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      erp_tenant_recovery_checkpoints: {
        Row: {
          tenant_id: string;
          state: Json;
          updated_at: string;
        };
        Insert: {
          tenant_id: string;
          state?: Json;
          updated_at?: string;
        };
        Update: {
          tenant_id?: string;
          state?: Json;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "erp_tenant_recovery_checkpoints_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: true;
            referencedRelation: "erp_tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      erp_tenant_sla_policies: {
        Row: {
          id: string;
          tenant_id: string;
          policy_key: string;
          target_availability_pct: number;
          measurement_window_hours: number;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          policy_key: string;
          target_availability_pct?: number;
          measurement_window_hours?: number;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          policy_key?: string;
          target_availability_pct?: number;
          measurement_window_hours?: number;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "erp_tenant_sla_policies_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "erp_tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      erp_tenants: {
        Row: {
          id: string;
          slug: string;
          display_name: string;
          region_key: string;
          status: "active" | "suspended" | "provisioning" | "archived";
          plan_key: string;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          display_name: string;
          region_key?: string;
          status?: "active" | "suspended" | "provisioning" | "archived";
          plan_key?: string;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          display_name?: string;
          region_key?: string;
          status?: "active" | "suspended" | "provisioning" | "archived";
          plan_key?: string;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      erp_platform_catalog_plugins: {
        Row: {
          id: string;
          plugin_key: string;
          display_name: string;
          kind: "plugin" | "integration" | "workflow_connector" | "sdk_bundle";
          publisher_key: string;
          manifest: Json;
          is_listed: boolean;
          risk_tier: "low" | "medium" | "high";
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          plugin_key: string;
          display_name: string;
          kind?: "plugin" | "integration" | "workflow_connector" | "sdk_bundle";
          publisher_key?: string;
          manifest?: Json;
          is_listed?: boolean;
          risk_tier?: "low" | "medium" | "high";
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          plugin_key?: string;
          display_name?: string;
          kind?: "plugin" | "integration" | "workflow_connector" | "sdk_bundle";
          publisher_key?: string;
          manifest?: Json;
          is_listed?: boolean;
          risk_tier?: "low" | "medium" | "high";
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      erp_platform_external_event_outbox: {
        Row: {
          id: string;
          tenant_id: string | null;
          topic_key: string;
          payload: Json;
          correlation_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id?: string | null;
          topic_key: string;
          payload?: Json;
          correlation_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string | null;
          topic_key?: string;
          payload?: Json;
          correlation_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "erp_platform_external_event_outbox_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "erp_tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      erp_platform_partner_connections: {
        Row: {
          id: string;
          tenant_id: string;
          connection_key: string;
          integration_kind: "api_oauth_stub" | "webhook" | "exchange" | "custom";
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          connection_key: string;
          integration_kind?: "api_oauth_stub" | "webhook" | "exchange" | "custom";
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          connection_key?: string;
          integration_kind?: "api_oauth_stub" | "webhook" | "exchange" | "custom";
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "erp_platform_partner_connections_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "erp_tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      erp_platform_plugin_installations: {
        Row: {
          id: string;
          tenant_id: string;
          plugin_id: string;
          installed_version: string;
          status: "pending" | "active" | "suspended";
          config: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          plugin_id: string;
          installed_version?: string;
          status?: "pending" | "active" | "suspended";
          config?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          plugin_id?: string;
          installed_version?: string;
          status?: "pending" | "active" | "suspended";
          config?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "erp_platform_plugin_installations_plugin_id_fkey";
            columns: ["plugin_id"];
            isOneToOne: false;
            referencedRelation: "erp_platform_catalog_plugins";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "erp_platform_plugin_installations_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "erp_tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      erp_ecosystem_certifications: {
        Row: {
          id: string;
          partner_id: string;
          certification_key: string;
          status: "pending" | "certified" | "revoked" | "expired";
          issued_at: string | null;
          expires_at: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          partner_id: string;
          certification_key: string;
          status?: "pending" | "certified" | "revoked" | "expired";
          issued_at?: string | null;
          expires_at?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          partner_id?: string;
          certification_key?: string;
          status?: "pending" | "certified" | "revoked" | "expired";
          issued_at?: string | null;
          expires_at?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      erp_ecosystem_connector_routes: {
        Row: {
          id: string;
          tenant_id: string | null;
          connector_key: string;
          route_key: string;
          priority: number;
          enabled: boolean;
          config: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id?: string | null;
          connector_key: string;
          route_key: string;
          priority?: number;
          enabled?: boolean;
          config?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string | null;
          connector_key?: string;
          route_key?: string;
          priority?: number;
          enabled?: boolean;
          config?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      erp_ecosystem_federation_events: {
        Row: {
          id: string;
          tenant_id: string | null;
          partner_id: string | null;
          event_kind: string;
          payload: Json;
          correlation_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id?: string | null;
          partner_id?: string | null;
          event_kind: string;
          payload?: Json;
          correlation_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string | null;
          partner_id?: string | null;
          event_kind?: string;
          payload?: Json;
          correlation_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      erp_ecosystem_partner_sla_policies: {
        Row: {
          id: string;
          partner_id: string;
          policy_key: string;
          target_availability_pct: number;
          measurement_window_hours: number;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          partner_id: string;
          policy_key: string;
          target_availability_pct?: number;
          measurement_window_hours?: number;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          partner_id?: string;
          policy_key?: string;
          target_availability_pct?: number;
          measurement_window_hours?: number;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      erp_ecosystem_partner_tenant_links: {
        Row: {
          id: string;
          tenant_id: string;
          partner_id: string;
          relationship_kind: "technology" | "reseller" | "integrator" | "strategic";
          status: "pending" | "active" | "suspended";
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          partner_id: string;
          relationship_kind?: "technology" | "reseller" | "integrator" | "strategic";
          status?: "pending" | "active" | "suspended";
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          partner_id?: string;
          relationship_kind?: "technology" | "reseller" | "integrator" | "strategic";
          status?: "pending" | "active" | "suspended";
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      erp_ecosystem_partners: {
        Row: {
          id: string;
          partner_key: string;
          display_name: string;
          tier: "global" | "certified" | "premier";
          status: "active" | "onboarding" | "suspended";
          headquarters_region: string;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          partner_key: string;
          display_name: string;
          tier?: "global" | "certified" | "premier";
          status?: "active" | "onboarding" | "suspended";
          headquarters_region?: string;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          partner_key?: string;
          display_name?: string;
          tier?: "global" | "certified" | "premier";
          status?: "active" | "onboarding" | "suspended";
          headquarters_region?: string;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      erp_automation_escalations: {
        Row: {
          id: string;
          workflow_run_id: string;
          status: "pending" | "acknowledged" | "resolved";
          escalation_level: number;
          governance_alert_id: string | null;
          metadata: Json;
          created_at: string;
          resolved_at: string | null;
        };
        Insert: {
          id?: string;
          workflow_run_id: string;
          status?: "pending" | "acknowledged" | "resolved";
          escalation_level?: number;
          governance_alert_id?: string | null;
          metadata?: Json;
          created_at?: string;
          resolved_at?: string | null;
        };
        Update: {
          id?: string;
          workflow_run_id?: string;
          status?: "pending" | "acknowledged" | "resolved";
          escalation_level?: number;
          governance_alert_id?: string | null;
          metadata?: Json;
          created_at?: string;
          resolved_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "erp_automation_escalations_governance_alert_id_fkey";
            columns: ["governance_alert_id"];
            isOneToOne: false;
            referencedRelation: "governance_alerts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "erp_automation_escalations_workflow_run_id_fkey";
            columns: ["workflow_run_id"];
            isOneToOne: false;
            referencedRelation: "erp_automation_workflow_runs";
            referencedColumns: ["id"];
          },
        ];
      };
      erp_automation_events: {
        Row: {
          id: string;
          event_key: string;
          domain_key: string;
          aggregate_type: string | null;
          aggregate_id: string | null;
          correlation_id: string | null;
          payload: Json;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_key: string;
          domain_key: string;
          aggregate_type?: string | null;
          aggregate_id?: string | null;
          correlation_id?: string | null;
          payload?: Json;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_key?: string;
          domain_key?: string;
          aggregate_type?: string | null;
          aggregate_id?: string | null;
          correlation_id?: string | null;
          payload?: Json;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      erp_automation_sla_policies: {
        Row: {
          id: string;
          workflow_key: string;
          max_duration_minutes: number;
          escalate_department_key: string | null;
          is_active: boolean;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workflow_key: string;
          max_duration_minutes: number;
          escalate_department_key?: string | null;
          is_active?: boolean;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workflow_key?: string;
          max_duration_minutes?: number;
          escalate_department_key?: string | null;
          is_active?: boolean;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "erp_automation_sla_policies_workflow_key_fkey";
            columns: ["workflow_key"];
            isOneToOne: false;
            referencedRelation: "erp_automation_workflow_definitions";
            referencedColumns: ["workflow_key"];
          },
        ];
      };
      erp_automation_schedules: {
        Row: {
          id: string;
          workflow_key: string;
          cron_expression: string | null;
          timezone: string;
          next_run_at: string;
          payload_template: Json;
          is_active: boolean;
          last_run_at: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workflow_key: string;
          cron_expression?: string | null;
          timezone?: string;
          next_run_at: string;
          payload_template?: Json;
          is_active?: boolean;
          last_run_at?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workflow_key?: string;
          cron_expression?: string | null;
          timezone?: string;
          next_run_at?: string;
          payload_template?: Json;
          is_active?: boolean;
          last_run_at?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "erp_automation_schedules_workflow_key_fkey";
            columns: ["workflow_key"];
            isOneToOne: false;
            referencedRelation: "erp_automation_workflow_definitions";
            referencedColumns: ["workflow_key"];
          },
        ];
      };
      erp_automation_workflow_definitions: {
        Row: {
          workflow_key: string;
          domain_key: string;
          label: string;
          description: string | null;
          definition: Json;
          version: number;
          is_active: boolean;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          workflow_key: string;
          domain_key: string;
          label: string;
          description?: string | null;
          definition?: Json;
          version?: number;
          is_active?: boolean;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          workflow_key?: string;
          domain_key?: string;
          label?: string;
          description?: string | null;
          definition?: Json;
          version?: number;
          is_active?: boolean;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      erp_automation_workflow_runs: {
        Row: {
          id: string;
          workflow_key: string;
          status:
            | "pending"
            | "running"
            | "waiting_approval"
            | "completed"
            | "failed"
            | "cancelled";
          context: Json;
          current_step: number;
          approval_request_id: string | null;
          sla_deadline_at: string | null;
          escalated_at: string | null;
          last_error: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workflow_key: string;
          status?:
            | "pending"
            | "running"
            | "waiting_approval"
            | "completed"
            | "failed"
            | "cancelled";
          context?: Json;
          current_step?: number;
          approval_request_id?: string | null;
          sla_deadline_at?: string | null;
          escalated_at?: string | null;
          last_error?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workflow_key?: string;
          status?:
            | "pending"
            | "running"
            | "waiting_approval"
            | "completed"
            | "failed"
            | "cancelled";
          context?: Json;
          current_step?: number;
          approval_request_id?: string | null;
          sla_deadline_at?: string | null;
          escalated_at?: string | null;
          last_error?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "erp_automation_workflow_runs_approval_request_id_fkey";
            columns: ["approval_request_id"];
            isOneToOne: false;
            referencedRelation: "approval_requests";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "erp_automation_workflow_runs_workflow_key_fkey";
            columns: ["workflow_key"];
            isOneToOne: false;
            referencedRelation: "erp_automation_workflow_definitions";
            referencedColumns: ["workflow_key"];
          },
        ];
      };
      erp_cloud_edge_services: {
        Row: {
          id: string;
          region_id: string;
          service_key: string;
          endpoint_stub: string;
          status: "active" | "degraded" | "offline";
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          region_id: string;
          service_key: string;
          endpoint_stub?: string;
          status?: "active" | "degraded" | "offline";
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          region_id?: string;
          service_key?: string;
          endpoint_stub?: string;
          status?: "active" | "degraded" | "offline";
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "erp_cloud_edge_services_region_id_fkey";
            columns: ["region_id"];
            isOneToOne: false;
            referencedRelation: "erp_cloud_regions";
            referencedColumns: ["id"];
          },
        ];
      };
      erp_cloud_operations_events: {
        Row: {
          id: string;
          tenant_id: string | null;
          region_id: string | null;
          event_kind: string;
          payload: Json;
          correlation_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id?: string | null;
          region_id?: string | null;
          event_kind: string;
          payload?: Json;
          correlation_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string | null;
          region_id?: string | null;
          event_kind?: string;
          payload?: Json;
          correlation_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "erp_cloud_operations_events_region_id_fkey";
            columns: ["region_id"];
            isOneToOne: false;
            referencedRelation: "erp_cloud_regions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "erp_cloud_operations_events_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "erp_tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      erp_cloud_recovery_checkpoints: {
        Row: {
          id: string;
          tenant_id: string;
          region_id: string;
          checkpoint_key: string;
          payload: Json;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          region_id: string;
          checkpoint_key?: string;
          payload?: Json;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          region_id?: string;
          checkpoint_key?: string;
          payload?: Json;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "erp_cloud_recovery_checkpoints_region_id_fkey";
            columns: ["region_id"];
            isOneToOne: false;
            referencedRelation: "erp_cloud_regions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "erp_cloud_recovery_checkpoints_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "erp_tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      erp_cloud_regions: {
        Row: {
          id: string;
          region_key: string;
          display_name: string;
          provider_stub: string;
          status: "active" | "maintenance" | "sunset";
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          region_key: string;
          display_name: string;
          provider_stub?: string;
          status?: "active" | "maintenance" | "sunset";
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          region_key?: string;
          display_name?: string;
          provider_stub?: string;
          status?: "active" | "maintenance" | "sunset";
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      erp_cloud_tenant_region_profiles: {
        Row: {
          tenant_id: string;
          primary_region_id: string;
          secondary_region_id: string | null;
          metadata: Json;
          updated_at: string;
        };
        Insert: {
          tenant_id: string;
          primary_region_id: string;
          secondary_region_id?: string | null;
          metadata?: Json;
          updated_at?: string;
        };
        Update: {
          tenant_id?: string;
          primary_region_id?: string;
          secondary_region_id?: string | null;
          metadata?: Json;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "erp_cloud_tenant_region_profiles_primary_region_id_fkey";
            columns: ["primary_region_id"];
            isOneToOne: false;
            referencedRelation: "erp_cloud_regions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "erp_cloud_tenant_region_profiles_secondary_region_id_fkey";
            columns: ["secondary_region_id"];
            isOneToOne: false;
            referencedRelation: "erp_cloud_regions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "erp_cloud_tenant_region_profiles_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: true;
            referencedRelation: "erp_tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      erp_cloud_workload_policies: {
        Row: {
          id: string;
          tenant_id: string | null;
          region_id: string;
          policy_key: string;
          priority: number;
          enabled: boolean;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id?: string | null;
          region_id: string;
          policy_key: string;
          priority?: number;
          enabled?: boolean;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string | null;
          region_id?: string;
          policy_key?: string;
          priority?: number;
          enabled?: boolean;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "erp_cloud_workload_policies_region_id_fkey";
            columns: ["region_id"];
            isOneToOne: false;
            referencedRelation: "erp_cloud_regions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "erp_cloud_workload_policies_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "erp_tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      erp_governance_architecture_decisions: {
        Row: {
          id: string;
          tenant_id: string | null;
          adr_key: string;
          title: string;
          decision_status: "proposed" | "accepted" | "deprecated" | "superseded";
          summary: string;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id?: string | null;
          adr_key: string;
          title: string;
          decision_status?: "proposed" | "accepted" | "deprecated" | "superseded";
          summary?: string;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string | null;
          adr_key?: string;
          title?: string;
          decision_status?: "proposed" | "accepted" | "deprecated" | "superseded";
          summary?: string;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "erp_governance_architecture_decisions_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "erp_tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      erp_governance_board_topics: {
        Row: {
          id: string;
          tenant_id: string | null;
          topic_key: string;
          title: string;
          status: "open" | "in_review" | "accepted" | "parked";
          priority: number;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id?: string | null;
          topic_key: string;
          title: string;
          status?: "open" | "in_review" | "accepted" | "parked";
          priority?: number;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string | null;
          topic_key?: string;
          title?: string;
          status?: "open" | "in_review" | "accepted" | "parked";
          priority?: number;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "erp_governance_board_topics_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "erp_tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      erp_governance_maturity_snapshots: {
        Row: {
          id: string;
          tenant_id: string | null;
          dimension_key: string;
          score: number;
          measured_at: string;
          metadata: Json;
        };
        Insert: {
          id?: string;
          tenant_id?: string | null;
          dimension_key: string;
          score: number;
          measured_at?: string;
          metadata?: Json;
        };
        Update: {
          id?: string;
          tenant_id?: string | null;
          dimension_key?: string;
          score?: number;
          measured_at?: string;
          metadata?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "erp_governance_maturity_snapshots_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "erp_tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      erp_governance_platform_operations_events: {
        Row: {
          id: string;
          tenant_id: string | null;
          event_kind: string;
          payload: Json;
          correlation_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id?: string | null;
          event_kind: string;
          payload?: Json;
          correlation_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string | null;
          event_kind?: string;
          payload?: Json;
          correlation_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "erp_governance_platform_operations_events_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "erp_tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      erp_governance_standards_registry: {
        Row: {
          id: string;
          tenant_id: string | null;
          standard_key: string;
          title: string;
          category: string;
          enforcement_level: "advisory" | "mandatory" | "certification";
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id?: string | null;
          standard_key: string;
          title: string;
          category?: string;
          enforcement_level?: "advisory" | "mandatory" | "certification";
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string | null;
          standard_key?: string;
          title?: string;
          category?: string;
          enforcement_level?: "advisory" | "mandatory" | "certification";
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "erp_governance_standards_registry_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "erp_tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      erp_governance_technical_debt_entries: {
        Row: {
          id: string;
          tenant_id: string | null;
          debt_key: string;
          title: string;
          severity: "low" | "medium" | "high" | "critical";
          status: "open" | "acknowledged" | "remediated";
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id?: string | null;
          debt_key: string;
          title: string;
          severity?: "low" | "medium" | "high" | "critical";
          status?: "open" | "acknowledged" | "remediated";
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string | null;
          debt_key?: string;
          title?: string;
          severity?: "low" | "medium" | "high" | "critical";
          status?: "open" | "acknowledged" | "remediated";
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "erp_governance_technical_debt_entries_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "erp_tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      erp_resilience_metric_snapshots: {
        Row: {
          id: string;
          tenant_id: string | null;
          metric_key: string;
          value: number;
          captured_at: string;
          metadata: Json;
        };
        Insert: {
          id?: string;
          tenant_id?: string | null;
          metric_key: string;
          value: number;
          captured_at?: string;
          metadata?: Json;
        };
        Update: {
          id?: string;
          tenant_id?: string | null;
          metric_key?: string;
          value?: number;
          captured_at?: string;
          metadata?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "erp_resilience_metric_snapshots_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "erp_tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      erp_resilience_platform_operations_events: {
        Row: {
          id: string;
          tenant_id: string | null;
          event_kind: string;
          payload: Json;
          correlation_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id?: string | null;
          event_kind: string;
          payload?: Json;
          correlation_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string | null;
          event_kind?: string;
          payload?: Json;
          correlation_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "erp_resilience_platform_operations_events_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "erp_tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      erp_resilience_scenarios: {
        Row: {
          id: string;
          tenant_id: string | null;
          scenario_key: string;
          category:
            | "chaos"
            | "load"
            | "failover"
            | "realtime"
            | "queue"
            | "orchestration"
            | "ai"
            | "tenant"
            | "ecosystem"
            | "recovery"
            | "sla"
            | "governance";
          enabled: boolean;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id?: string | null;
          scenario_key: string;
          category:
            | "chaos"
            | "load"
            | "failover"
            | "realtime"
            | "queue"
            | "orchestration"
            | "ai"
            | "tenant"
            | "ecosystem"
            | "recovery"
            | "sla"
            | "governance";
          enabled?: boolean;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string | null;
          scenario_key?: string;
          category?:
            | "chaos"
            | "load"
            | "failover"
            | "realtime"
            | "queue"
            | "orchestration"
            | "ai"
            | "tenant"
            | "ecosystem"
            | "recovery"
            | "sla"
            | "governance";
          enabled?: boolean;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "erp_resilience_scenarios_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "erp_tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      erp_resilience_validation_runs: {
        Row: {
          id: string;
          tenant_id: string | null;
          scenario_id: string | null;
          run_kind: string;
          status: "pending" | "running" | "passed" | "failed" | "skipped" | "cancelled";
          payload: Json;
          correlation_id: string | null;
          started_at: string;
          finished_at: string | null;
        };
        Insert: {
          id?: string;
          tenant_id?: string | null;
          scenario_id?: string | null;
          run_kind: string;
          status?: "pending" | "running" | "passed" | "failed" | "skipped" | "cancelled";
          payload?: Json;
          correlation_id?: string | null;
          started_at?: string;
          finished_at?: string | null;
        };
        Update: {
          id?: string;
          tenant_id?: string | null;
          scenario_id?: string | null;
          run_kind?: string;
          status?: "pending" | "running" | "passed" | "failed" | "skipped" | "cancelled";
          payload?: Json;
          correlation_id?: string | null;
          started_at?: string;
          finished_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "erp_resilience_validation_runs_scenario_id_fkey";
            columns: ["scenario_id"];
            isOneToOne: false;
            referencedRelation: "erp_resilience_scenarios";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "erp_resilience_validation_runs_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "erp_tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      erp_compliance_accounting_periods: {
        Row: {
          id: string;
          legal_entity_key: string;
          label: string;
          period_start: string;
          period_end: string;
          fiscal_year: number;
          fiscal_month: number | null;
          status: "open" | "closed" | "locked" | "archived";
          metadata: Json;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          legal_entity_key?: string;
          label?: string;
          period_start: string;
          period_end: string;
          fiscal_year: number;
          fiscal_month?: number | null;
          status?: "open" | "closed" | "locked" | "archived";
          metadata?: Json;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          legal_entity_key?: string;
          label?: string;
          period_start?: string;
          period_end?: string;
          fiscal_year?: number;
          fiscal_month?: number | null;
          status?: "open" | "closed" | "locked" | "archived";
          metadata?: Json;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      erp_compliance_export_manifests: {
        Row: {
          id: string;
          export_kind: string;
          domain_key: string;
          idempotency_key: string | null;
          legal_hold: boolean;
          requested_by: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          export_kind: string;
          domain_key: string;
          idempotency_key?: string | null;
          legal_hold?: boolean;
          requested_by: string;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          export_kind?: string;
          domain_key?: string;
          idempotency_key?: string | null;
          legal_hold?: boolean;
          requested_by?: string;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      erp_compliance_fiscal_locks: {
        Row: {
          legal_entity_key: string;
          fiscal_year: number;
          journal_locked: boolean;
          metadata: Json;
          locked_at: string | null;
          locked_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          legal_entity_key?: string;
          fiscal_year: number;
          journal_locked?: boolean;
          metadata?: Json;
          locked_at?: string | null;
          locked_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          legal_entity_key?: string;
          fiscal_year?: number;
          journal_locked?: boolean;
          metadata?: Json;
          locked_at?: string | null;
          locked_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      erp_compliance_legal_traces: {
        Row: {
          id: string;
          trace_key: string;
          source_domain: string;
          reference_table: string;
          reference_id: string;
          payload_hash: string;
          previous_hash: string | null;
          metadata: Json;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          trace_key: string;
          source_domain: string;
          reference_table: string;
          reference_id: string;
          payload_hash: string;
          previous_hash?: string | null;
          metadata?: Json;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          trace_key?: string;
          source_domain?: string;
          reference_table?: string;
          reference_id?: string;
          payload_hash?: string;
          previous_hash?: string | null;
          metadata?: Json;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      erp_compliance_retention_policies: {
        Row: {
          id: string;
          domain_key: string;
          retention_days: number;
          legal_basis: string;
          applies_to_entity_types: string[];
          is_active: boolean;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          domain_key: string;
          retention_days: number;
          legal_basis?: string;
          applies_to_entity_types?: string[];
          is_active?: boolean;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          domain_key?: string;
          retention_days?: number;
          legal_basis?: string;
          applies_to_entity_types?: string[];
          is_active?: boolean;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      erp_compliance_risk_signals: {
        Row: {
          id: string;
          rule_key: string;
          severity: "low" | "medium" | "high" | "critical";
          domain_key: string;
          entity_type: string | null;
          entity_id: string | null;
          status: "open" | "acknowledged" | "resolved";
          metadata: Json;
          detected_at: string;
          resolved_at: string | null;
        };
        Insert: {
          id?: string;
          rule_key: string;
          severity?: "low" | "medium" | "high" | "critical";
          domain_key?: string;
          entity_type?: string | null;
          entity_id?: string | null;
          status?: "open" | "acknowledged" | "resolved";
          metadata?: Json;
          detected_at?: string;
          resolved_at?: string | null;
        };
        Update: {
          id?: string;
          rule_key?: string;
          severity?: "low" | "medium" | "high" | "critical";
          domain_key?: string;
          entity_type?: string | null;
          entity_id?: string | null;
          status?: "open" | "acknowledged" | "resolved";
          metadata?: Json;
          detected_at?: string;
          resolved_at?: string | null;
        };
        Relationships: [];
      };
      erp_compliance_snapshots: {
        Row: {
          id: string;
          snapshot_key: string;
          domain_key: string;
          fiscal_year: number | null;
          payload: Json;
          content_hash: string;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          snapshot_key: string;
          domain_key: string;
          fiscal_year?: number | null;
          payload?: Json;
          content_hash?: string;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          snapshot_key?: string;
          domain_key?: string;
          fiscal_year?: number | null;
          payload?: Json;
          content_hash?: string;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      erp_compliance_sod_rules: {
        Row: {
          id: string;
          rule_key: string;
          scope_module: string;
          description: string;
          forbidden_role_pairs: Json;
          enforcement: "policy" | "blocking";
          is_active: boolean;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          rule_key: string;
          scope_module: string;
          description: string;
          forbidden_role_pairs?: Json;
          enforcement?: "policy" | "blocking";
          is_active?: boolean;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          rule_key?: string;
          scope_module?: string;
          description?: string;
          forbidden_role_pairs?: Json;
          enforcement?: "policy" | "blocking";
          is_active?: boolean;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      erp_observability_anomalies: {
        Row: {
          id: string;
          rule_key: string;
          domain_key: string;
          severity: "low" | "medium" | "high" | "critical";
          entity_type: string | null;
          entity_id: string | null;
          anomaly_score: number;
          status: "open" | "acknowledged" | "resolved";
          incident_id: string | null;
          metadata: Json;
          detected_at: string;
          resolved_at: string | null;
        };
        Insert: {
          id?: string;
          rule_key: string;
          domain_key?: string;
          severity?: "low" | "medium" | "high" | "critical";
          entity_type?: string | null;
          entity_id?: string | null;
          anomaly_score?: number;
          status?: "open" | "acknowledged" | "resolved";
          incident_id?: string | null;
          metadata?: Json;
          detected_at?: string;
          resolved_at?: string | null;
        };
        Update: {
          id?: string;
          rule_key?: string;
          domain_key?: string;
          severity?: "low" | "medium" | "high" | "critical";
          entity_type?: string | null;
          entity_id?: string | null;
          anomaly_score?: number;
          status?: "open" | "acknowledged" | "resolved";
          incident_id?: string | null;
          metadata?: Json;
          detected_at?: string;
          resolved_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "erp_observability_anomalies_incident_id_fkey";
            columns: ["incident_id"];
            isOneToOne: false;
            referencedRelation: "erp_observability_incidents";
            referencedColumns: ["id"];
          },
        ];
      };
      erp_observability_correlations: {
        Row: {
          id: string;
          incident_id: string;
          source_kind: string;
          source_id: string;
          weight: number;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          incident_id: string;
          source_kind: string;
          source_id: string;
          weight?: number;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          incident_id?: string;
          source_kind?: string;
          source_id?: string;
          weight?: number;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "erp_observability_correlations_incident_id_fkey";
            columns: ["incident_id"];
            isOneToOne: false;
            referencedRelation: "erp_observability_incidents";
            referencedColumns: ["id"];
          },
        ];
      };
      erp_observability_health_snapshots: {
        Row: {
          id: string;
          scope_key: string;
          health_score: number;
          signal_breakdown: Json;
          predictive_hint: Json;
          computed_at: string;
        };
        Insert: {
          id?: string;
          scope_key: string;
          health_score: number;
          signal_breakdown?: Json;
          predictive_hint?: Json;
          computed_at?: string;
        };
        Update: {
          id?: string;
          scope_key?: string;
          health_score?: number;
          signal_breakdown?: Json;
          predictive_hint?: Json;
          computed_at?: string;
        };
        Relationships: [];
      };
      erp_observability_incidents: {
        Row: {
          id: string;
          incident_key: string;
          title: string;
          severity: "low" | "medium" | "high" | "critical";
          status: "open" | "investigating" | "resolved" | "closed";
          correlated_refs: Json;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          incident_key: string;
          title: string;
          severity?: "low" | "medium" | "high" | "critical";
          status?: "open" | "investigating" | "resolved" | "closed";
          correlated_refs?: Json;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          incident_key?: string;
          title?: string;
          severity?: "low" | "medium" | "high" | "critical";
          status?: "open" | "investigating" | "resolved" | "closed";
          correlated_refs?: Json;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      erp_observability_predictions: {
        Row: {
          id: string;
          prediction_key: string;
          horizon_hours: number;
          scope_key: string;
          projected_risk: number;
          rationale: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          prediction_key: string;
          horizon_hours: number;
          scope_key: string;
          projected_risk?: number;
          rationale?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          prediction_key?: string;
          horizon_hours?: number;
          scope_key?: string;
          projected_risk?: number;
          rationale?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      erp_observability_trace_events: {
        Row: {
          id: string;
          trace_id: string;
          parent_span_id: string | null;
          domain_key: string;
          operation_key: string;
          duration_ms: number | null;
          payload: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          trace_id: string;
          parent_span_id?: string | null;
          domain_key: string;
          operation_key: string;
          duration_ms?: number | null;
          payload?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          trace_id?: string;
          parent_span_id?: string | null;
          domain_key?: string;
          operation_key?: string;
          duration_ms?: number | null;
          payload?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      erp_ai_assistant_events: {
        Row: {
          id: string;
          session_key: string;
          actor_user_id: string | null;
          event_kind: "user_intent" | "assistant_reply" | "system";
          payload: Json;
          safety_flags: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_key: string;
          actor_user_id?: string | null;
          event_kind: "user_intent" | "assistant_reply" | "system";
          payload?: Json;
          safety_flags?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_key?: string;
          actor_user_id?: string | null;
          event_kind?: "user_intent" | "assistant_reply" | "system";
          payload?: Json;
          safety_flags?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      erp_ai_forecast_artifacts: {
        Row: {
          id: string;
          artifact_key: string;
          domain_key: string;
          horizon_days: number;
          series_key: string;
          forecast_points: Json;
          method: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          artifact_key: string;
          domain_key: string;
          horizon_days: number;
          series_key: string;
          forecast_points?: Json;
          method?: string;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          artifact_key?: string;
          domain_key?: string;
          horizon_days?: number;
          series_key?: string;
          forecast_points?: Json;
          method?: string;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      erp_ai_insights: {
        Row: {
          id: string;
          insight_key: string;
          domain_key: string;
          title: string;
          summary: string;
          confidence: number;
          signal_refs: Json;
          pipeline_version: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          insight_key: string;
          domain_key: string;
          title: string;
          summary: string;
          confidence?: number;
          signal_refs?: Json;
          pipeline_version?: string;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          insight_key?: string;
          domain_key?: string;
          title?: string;
          summary?: string;
          confidence?: number;
          signal_refs?: Json;
          pipeline_version?: string;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      erp_ai_pipeline_runs: {
        Row: {
          id: string;
          pipeline_key: string;
          scope_key: string;
          status: "completed" | "failed";
          metrics: Json;
          error_message: string | null;
          started_at: string;
          finished_at: string;
        };
        Insert: {
          id?: string;
          pipeline_key: string;
          scope_key?: string;
          status: "completed" | "failed";
          metrics?: Json;
          error_message?: string | null;
          started_at?: string;
          finished_at?: string;
        };
        Update: {
          id?: string;
          pipeline_key?: string;
          scope_key?: string;
          status?: "completed" | "failed";
          metrics?: Json;
          error_message?: string | null;
          started_at?: string;
          finished_at?: string;
        };
        Relationships: [];
      };
      erp_ai_recommendations: {
        Row: {
          id: string;
          recommendation_key: string;
          domain_key: string;
          entity_type: string | null;
          entity_id: string | null;
          priority: number;
          title: string;
          action_hint: string;
          rationale: Json;
          status: "pending" | "applied" | "dismissed" | "expired";
          expires_at: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          recommendation_key: string;
          domain_key: string;
          entity_type?: string | null;
          entity_id?: string | null;
          priority?: number;
          title: string;
          action_hint?: string;
          rationale?: Json;
          status?: "pending" | "applied" | "dismissed" | "expired";
          expires_at?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          recommendation_key?: string;
          domain_key?: string;
          entity_type?: string | null;
          entity_id?: string | null;
          priority?: number;
          title?: string;
          action_hint?: string;
          rationale?: Json;
          status?: "pending" | "applied" | "dismissed" | "expired";
          expires_at?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      erp_analytics_snapshots: {
        Row: {
          scope_key: string;
          payload: Json;
          computed_at: string;
        };
        Insert: {
          scope_key: string;
          payload?: Json;
          computed_at?: string;
        };
        Update: {
          scope_key?: string;
          payload?: Json;
          computed_at?: string;
        };
        Relationships: [];
      };
      crm_activities: {
        Row: {
          id: string;
          activity_type: "call" | "meeting" | "task" | "email" | "note";
          subject: string;
          body: string | null;
          due_at: string | null;
          completed_at: string | null;
          related_kind: "lead" | "opportunity" | "client" | "quote" | "sale";
          related_id: string;
          owner_id: string | null;
          metadata: Json;
          created_by: string;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          activity_type: "call" | "meeting" | "task" | "email" | "note";
          subject?: string;
          body?: string | null;
          due_at?: string | null;
          completed_at?: string | null;
          related_kind: "lead" | "opportunity" | "client" | "quote" | "sale";
          related_id: string;
          owner_id?: string | null;
          metadata?: Json;
          created_by: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          activity_type?: "call" | "meeting" | "task" | "email" | "note";
          subject?: string;
          body?: string | null;
          due_at?: string | null;
          completed_at?: string | null;
          related_kind?: "lead" | "opportunity" | "client" | "quote" | "sale";
          related_id?: string;
          owner_id?: string | null;
          metadata?: Json;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      crm_forecast_snapshots: {
        Row: {
          id: string;
          period_start: string;
          grain: "weekly" | "monthly";
          owner_id: string | null;
          pipeline_raw_gnf: number;
          weighted_pipeline_gnf: number;
          closed_won_gnf: number;
          computed_at: string;
          metadata: Json;
        };
        Insert: {
          id?: string;
          period_start: string;
          grain?: "weekly" | "monthly";
          owner_id?: string | null;
          pipeline_raw_gnf?: number;
          weighted_pipeline_gnf?: number;
          closed_won_gnf?: number;
          computed_at?: string;
          metadata?: Json;
        };
        Update: {
          id?: string;
          period_start?: string;
          grain?: "weekly" | "monthly";
          owner_id?: string | null;
          pipeline_raw_gnf?: number;
          weighted_pipeline_gnf?: number;
          closed_won_gnf?: number;
          computed_at?: string;
          metadata?: Json;
        };
        Relationships: [];
      };
      crm_leads: {
        Row: {
          id: string;
          status: "new" | "contacted" | "qualified" | "converted" | "lost";
          source: string | null;
          company_name: string | null;
          contact_first_name: string | null;
          contact_last_name: string | null;
          email: string | null;
          phone: string | null;
          estimated_value_gnf: number;
          currency: "GNF" | "XOF" | "USD" | "EUR";
          owner_id: string | null;
          converted_client_id: string | null;
          notes: string | null;
          metadata: Json;
          lost_reason: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          status?: "new" | "contacted" | "qualified" | "converted" | "lost";
          source?: string | null;
          company_name?: string | null;
          contact_first_name?: string | null;
          contact_last_name?: string | null;
          email?: string | null;
          phone?: string | null;
          estimated_value_gnf?: number;
          currency?: "GNF" | "XOF" | "USD" | "EUR";
          owner_id?: string | null;
          converted_client_id?: string | null;
          notes?: string | null;
          metadata?: Json;
          lost_reason?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          status?: "new" | "contacted" | "qualified" | "converted" | "lost";
          source?: string | null;
          company_name?: string | null;
          contact_first_name?: string | null;
          contact_last_name?: string | null;
          email?: string | null;
          phone?: string | null;
          estimated_value_gnf?: number;
          currency?: "GNF" | "XOF" | "USD" | "EUR";
          owner_id?: string | null;
          converted_client_id?: string | null;
          notes?: string | null;
          metadata?: Json;
          lost_reason?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      crm_opportunities: {
        Row: {
          id: string;
          title: string;
          client_id: string | null;
          lead_id: string | null;
          stage_id: string;
          amount_estimated_gnf: number;
          probability_pct: number;
          expected_close_date: string | null;
          owner_id: string | null;
          approval_request_id: string | null;
          lost_reason: string | null;
          metadata: Json;
          created_by: string;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          client_id?: string | null;
          lead_id?: string | null;
          stage_id: string;
          amount_estimated_gnf?: number;
          probability_pct?: number;
          expected_close_date?: string | null;
          owner_id?: string | null;
          approval_request_id?: string | null;
          lost_reason?: string | null;
          metadata?: Json;
          created_by: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          client_id?: string | null;
          lead_id?: string | null;
          stage_id?: string;
          amount_estimated_gnf?: number;
          probability_pct?: number;
          expected_close_date?: string | null;
          owner_id?: string | null;
          approval_request_id?: string | null;
          lost_reason?: string | null;
          metadata?: Json;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "crm_opportunities_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_opportunities_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "crm_leads";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_opportunities_stage_id_fkey";
            columns: ["stage_id"];
            isOneToOne: false;
            referencedRelation: "crm_pipeline_stages";
            referencedColumns: ["id"];
          },
        ];
      };
      crm_pipeline_stages: {
        Row: {
          id: string;
          code: string;
          label: string;
          sort_order: number;
          is_active: boolean;
          probability_default: number;
          is_terminal_win: boolean;
          is_terminal_loss: boolean;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          label: string;
          sort_order?: number;
          is_active?: boolean;
          probability_default?: number;
          is_terminal_win?: boolean;
          is_terminal_loss?: boolean;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          label?: string;
          sort_order?: number;
          is_active?: boolean;
          probability_default?: number;
          is_terminal_win?: boolean;
          is_terminal_loss?: boolean;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      crm_quote_lines: {
        Row: {
          id: string;
          quote_id: string;
          line_order: number;
          product_id: string | null;
          description: string;
          quantity: number;
          unit_price_gnf: number;
          line_total_gnf: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          quote_id: string;
          line_order?: number;
          product_id?: string | null;
          description?: string;
          quantity: number;
          unit_price_gnf: number;
          line_total_gnf: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          quote_id?: string;
          line_order?: number;
          product_id?: string | null;
          description?: string;
          quantity?: number;
          unit_price_gnf?: number;
          line_total_gnf?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "crm_quote_lines_quote_id_fkey";
            columns: ["quote_id"];
            isOneToOne: false;
            referencedRelation: "crm_quotes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_quote_lines_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      crm_quotes: {
        Row: {
          id: string;
          quote_number: string;
          client_id: string;
          opportunity_id: string | null;
          status: "draft" | "sent" | "accepted" | "rejected" | "expired" | "converted";
          valid_until: string | null;
          currency: "GNF" | "XOF" | "USD" | "EUR";
          total_amount_gnf: number;
          notes: string | null;
          approval_request_id: string | null;
          sale_id: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          quote_number?: string;
          client_id: string;
          opportunity_id?: string | null;
          status?: "draft" | "sent" | "accepted" | "rejected" | "expired" | "converted";
          valid_until?: string | null;
          currency?: "GNF" | "XOF" | "USD" | "EUR";
          total_amount_gnf?: number;
          notes?: string | null;
          approval_request_id?: string | null;
          sale_id?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          quote_number?: string;
          client_id?: string;
          opportunity_id?: string | null;
          status?: "draft" | "sent" | "accepted" | "rejected" | "expired" | "converted";
          valid_until?: string | null;
          currency?: "GNF" | "XOF" | "USD" | "EUR";
          total_amount_gnf?: number;
          notes?: string | null;
          approval_request_id?: string | null;
          sale_id?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "crm_quotes_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_quotes_opportunity_id_fkey";
            columns: ["opportunity_id"];
            isOneToOne: false;
            referencedRelation: "crm_opportunities";
            referencedColumns: ["id"];
          },
        ];
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
          lifecycle_status: "validated" | "cancelled" | "archived";
          crm_opportunity_id: string | null;
          crm_quote_id: string | null;
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
          lifecycle_status?: "validated" | "cancelled" | "archived";
          crm_opportunity_id?: string | null;
          crm_quote_id?: string | null;
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
          lifecycle_status?: "validated" | "cancelled" | "archived";
          crm_opportunity_id?: string | null;
          crm_quote_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "sales_crm_opportunity_id_fkey";
            columns: ["crm_opportunity_id"];
            isOneToOne: false;
            referencedRelation: "crm_opportunities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sales_crm_quote_id_fkey";
            columns: ["crm_quote_id"];
            isOneToOne: false;
            referencedRelation: "crm_quotes";
            referencedColumns: ["id"];
          },
        ];
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
      currencies: {
        Row: {
          code: string;
          name: string;
          symbol: string | null;
          is_base: boolean;
          created_at: string;
        };
        Insert: {
          code: string;
          name: string;
          symbol?: string | null;
          is_base?: boolean;
          created_at?: string;
        };
        Update: {
          code?: string;
          name?: string;
          symbol?: string | null;
          is_base?: boolean;
          created_at?: string;
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
      finance_accounts: {
        Row: {
          id: string;
          code: string;
          label: string;
          account_type: "asset" | "liability" | "equity" | "revenue" | "expense";
          parent_account_id: string | null;
          is_active: boolean;
          sort_order: number;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          label: string;
          account_type: "asset" | "liability" | "equity" | "revenue" | "expense";
          parent_account_id?: string | null;
          is_active?: boolean;
          sort_order?: number;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          label?: string;
          account_type?: "asset" | "liability" | "equity" | "revenue" | "expense";
          parent_account_id?: string | null;
          is_active?: boolean;
          sort_order?: number;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      finance_ar_invoice_lines: {
        Row: {
          id: string;
          invoice_id: string;
          description: string;
          quantity: number;
          unit_price_gnf: number;
          tax_rate_percent: number;
          line_total_gnf: number;
          line_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          invoice_id: string;
          description: string;
          quantity?: number;
          unit_price_gnf: number;
          tax_rate_percent?: number;
          line_total_gnf?: number;
          line_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          invoice_id?: string;
          description?: string;
          quantity?: number;
          unit_price_gnf?: number;
          tax_rate_percent?: number;
          line_total_gnf?: number;
          line_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      finance_ar_invoices: {
        Row: {
          id: string;
          invoice_number: string;
          client_id: string | null;
          issue_date: string;
          due_date: string;
          status: "draft" | "sent" | "partially_paid" | "paid" | "voided" | "cancelled";
          currency: "GNF" | "XOF" | "USD" | "EUR";
          total_gnf: number;
          notes: string | null;
          approval_request_id: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          invoice_number: string;
          client_id?: string | null;
          issue_date: string;
          due_date: string;
          status?: "draft" | "sent" | "partially_paid" | "paid" | "voided" | "cancelled";
          currency?: "GNF" | "XOF" | "USD" | "EUR";
          total_gnf?: number;
          notes?: string | null;
          approval_request_id?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          invoice_number?: string;
          client_id?: string | null;
          issue_date?: string;
          due_date?: string;
          status?: "draft" | "sent" | "partially_paid" | "paid" | "voided" | "cancelled";
          currency?: "GNF" | "XOF" | "USD" | "EUR";
          total_gnf?: number;
          notes?: string | null;
          approval_request_id?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      finance_budget_lines: {
        Row: {
          id: string;
          budget_id: string;
          expense_category_id: string | null;
          account_id: string | null;
          period_start: string;
          period_end: string;
          planned_amount_gnf: number;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          budget_id: string;
          expense_category_id?: string | null;
          account_id?: string | null;
          period_start: string;
          period_end: string;
          planned_amount_gnf?: number;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          budget_id?: string;
          expense_category_id?: string | null;
          account_id?: string | null;
          period_start?: string;
          period_end?: string;
          planned_amount_gnf?: number;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      finance_budgets: {
        Row: {
          id: string;
          name: string;
          fiscal_year: number;
          department_key: string | null;
          status: "draft" | "active" | "closed";
          approval_request_id: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          fiscal_year: number;
          department_key?: string | null;
          status?: "draft" | "active" | "closed";
          approval_request_id?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          fiscal_year?: number;
          department_key?: string | null;
          status?: "draft" | "active" | "closed";
          approval_request_id?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      finance_cashflow_daily: {
        Row: {
          snapshot_date: string;
          opening_balance_gnf: number;
          inflow_gnf: number;
          outflow_gnf: number;
          closing_balance_gnf: number;
          metadata: Json;
          computed_at: string;
        };
        Insert: {
          snapshot_date: string;
          opening_balance_gnf?: number;
          inflow_gnf?: number;
          outflow_gnf?: number;
          closing_balance_gnf?: number;
          metadata?: Json;
          computed_at?: string;
        };
        Update: {
          snapshot_date?: string;
          opening_balance_gnf?: number;
          inflow_gnf?: number;
          outflow_gnf?: number;
          closing_balance_gnf?: number;
          metadata?: Json;
          computed_at?: string;
        };
        Relationships: [];
      };
      finance_journal_batches: {
        Row: {
          id: string;
          reference: string;
          booking_date: string;
          status: "draft" | "posted" | "voided";
          description: string | null;
          approval_request_id: string | null;
          posted_at: string | null;
          posted_by: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          reference?: string;
          booking_date?: string;
          status?: "draft" | "posted" | "voided";
          description?: string | null;
          approval_request_id?: string | null;
          posted_at?: string | null;
          posted_by?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          reference?: string;
          booking_date?: string;
          status?: "draft" | "posted" | "voided";
          description?: string | null;
          approval_request_id?: string | null;
          posted_at?: string | null;
          posted_by?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      finance_journal_lines: {
        Row: {
          id: string;
          batch_id: string;
          account_id: string;
          debit_credit: "D" | "C";
          amount_gnf: number;
          memo: string | null;
          line_order: number;
          source_module: string | null;
          source_entity_type: string | null;
          source_entity_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          batch_id: string;
          account_id: string;
          debit_credit: "D" | "C";
          amount_gnf: number;
          memo?: string | null;
          line_order?: number;
          source_module?: string | null;
          source_entity_type?: string | null;
          source_entity_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          batch_id?: string;
          account_id?: string;
          debit_credit?: "D" | "C";
          amount_gnf?: number;
          memo?: string | null;
          line_order?: number;
          source_module?: string | null;
          source_entity_type?: string | null;
          source_entity_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      finance_payment_allocations: {
        Row: {
          id: string;
          paid_at: string;
          amount_gnf: number;
          payment_method: "cash" | "mobile_money" | "bank_transfer" | "card" | "other";
          reference: string | null;
          financial_transaction_id: string | null;
          invoice_id: string | null;
          expense_id: string | null;
          notes: string | null;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          paid_at?: string;
          amount_gnf: number;
          payment_method?: "cash" | "mobile_money" | "bank_transfer" | "card" | "other";
          reference?: string | null;
          financial_transaction_id?: string | null;
          invoice_id?: string | null;
          expense_id?: string | null;
          notes?: string | null;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          paid_at?: string;
          amount_gnf?: number;
          payment_method?: "cash" | "mobile_money" | "bank_transfer" | "card" | "other";
          reference?: string | null;
          financial_transaction_id?: string | null;
          invoice_id?: string | null;
          expense_id?: string | null;
          notes?: string | null;
          created_by?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      logistics_delivery_lines: {
        Row: {
          id: string;
          delivery_id: string;
          product_id: string;
          qty_shipped: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          delivery_id: string;
          product_id: string;
          qty_shipped: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          delivery_id?: string;
          product_id?: string;
          qty_shipped?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      logistics_delivery_orders: {
        Row: {
          id: string;
          delivery_ref: string;
          warehouse_id: string;
          sale_id: string | null;
          status: "planned" | "picking" | "shipped" | "delivered" | "cancelled";
          ship_to: Json;
          tracking_ref: string | null;
          shipped_at: string | null;
          notes: string | null;
          approval_request_id: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          delivery_ref: string;
          warehouse_id: string;
          sale_id?: string | null;
          status?: "planned" | "picking" | "shipped" | "delivered" | "cancelled";
          ship_to?: Json;
          tracking_ref?: string | null;
          shipped_at?: string | null;
          notes?: string | null;
          approval_request_id?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          delivery_ref?: string;
          warehouse_id?: string;
          sale_id?: string | null;
          status?: "planned" | "picking" | "shipped" | "delivered" | "cancelled";
          ship_to?: Json;
          tracking_ref?: string | null;
          shipped_at?: string | null;
          notes?: string | null;
          approval_request_id?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      logistics_goods_receipt_lines: {
        Row: {
          id: string;
          receipt_id: string;
          product_id: string;
          qty_received: number;
          purchase_order_line_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          receipt_id: string;
          product_id: string;
          qty_received: number;
          purchase_order_line_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          receipt_id?: string;
          product_id?: string;
          qty_received?: number;
          purchase_order_line_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      logistics_goods_receipts: {
        Row: {
          id: string;
          receipt_ref: string;
          warehouse_id: string;
          purchase_order_id: string | null;
          received_at: string;
          notes: string | null;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          receipt_ref: string;
          warehouse_id: string;
          purchase_order_id?: string | null;
          received_at?: string;
          notes?: string | null;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          receipt_ref?: string;
          warehouse_id?: string;
          purchase_order_id?: string | null;
          received_at?: string;
          notes?: string | null;
          created_by?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      logistics_inventory_balances: {
        Row: {
          warehouse_id: string;
          product_id: string;
          qty_on_hand: number;
          updated_at: string;
        };
        Insert: {
          warehouse_id: string;
          product_id: string;
          qty_on_hand?: number;
          updated_at?: string;
        };
        Update: {
          warehouse_id?: string;
          product_id?: string;
          qty_on_hand?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "logistics_inventory_balances_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "logistics_inventory_balances_warehouse_id_fkey";
            columns: ["warehouse_id"];
            isOneToOne: false;
            referencedRelation: "logistics_warehouses";
            referencedColumns: ["id"];
          },
        ];
      };
      logistics_purchase_order_lines: {
        Row: {
          id: string;
          purchase_order_id: string;
          line_order: number;
          product_id: string;
          qty_ordered: number;
          qty_received: number;
          unit_cost_gnf: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          purchase_order_id: string;
          line_order?: number;
          product_id: string;
          qty_ordered: number;
          qty_received?: number;
          unit_cost_gnf?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          purchase_order_id?: string;
          line_order?: number;
          product_id?: string;
          qty_ordered?: number;
          qty_received?: number;
          unit_cost_gnf?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      logistics_purchase_orders: {
        Row: {
          id: string;
          po_number: string;
          supplier_id: string;
          warehouse_id: string;
          status: "draft" | "submitted" | "approved" | "partially_received" | "closed" | "cancelled";
          currency: "GNF" | "XOF" | "USD" | "EUR";
          total_estimated_gnf: number;
          notes: string | null;
          approval_request_id: string | null;
          expected_delivery_date: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          po_number: string;
          supplier_id: string;
          warehouse_id: string;
          status?: "draft" | "submitted" | "approved" | "partially_received" | "closed" | "cancelled";
          currency?: "GNF" | "XOF" | "USD" | "EUR";
          total_estimated_gnf?: number;
          notes?: string | null;
          approval_request_id?: string | null;
          expected_delivery_date?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          po_number?: string;
          supplier_id?: string;
          warehouse_id?: string;
          status?: "draft" | "submitted" | "approved" | "partially_received" | "closed" | "cancelled";
          currency?: "GNF" | "XOF" | "USD" | "EUR";
          total_estimated_gnf?: number;
          notes?: string | null;
          approval_request_id?: string | null;
          expected_delivery_date?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      logistics_stock_movements: {
        Row: {
          id: string;
          warehouse_id: string;
          product_id: string;
          movement_type:
            | "purchase_receipt"
            | "sale_shipment"
            | "adjustment"
            | "transfer_in"
            | "transfer_out"
            | "cycle_count"
            | "delivery_issue";
          qty_signed: number;
          reference_type: string;
          reference_id: string;
          metadata: Json;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          warehouse_id: string;
          product_id: string;
          movement_type:
            | "purchase_receipt"
            | "sale_shipment"
            | "adjustment"
            | "transfer_in"
            | "transfer_out"
            | "cycle_count"
            | "delivery_issue";
          qty_signed: number;
          reference_type: string;
          reference_id: string;
          metadata?: Json;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          warehouse_id?: string;
          product_id?: string;
          movement_type?:
            | "purchase_receipt"
            | "sale_shipment"
            | "adjustment"
            | "transfer_in"
            | "transfer_out"
            | "cycle_count"
            | "delivery_issue";
          qty_signed?: number;
          reference_type?: string;
          reference_id?: string;
          metadata?: Json;
          created_by?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      logistics_suppliers: {
        Row: {
          id: string;
          supplier_code: string;
          company_name: string;
          contact_email: string | null;
          phone: string | null;
          address: Json;
          metadata: Json;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          supplier_code: string;
          company_name: string;
          contact_email?: string | null;
          phone?: string | null;
          address?: Json;
          metadata?: Json;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          supplier_code?: string;
          company_name?: string;
          contact_email?: string | null;
          phone?: string | null;
          address?: Json;
          metadata?: Json;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      logistics_warehouses: {
        Row: {
          id: string;
          code: string;
          label: string;
          is_active: boolean;
          is_default: boolean;
          address: Json;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          label: string;
          is_active?: boolean;
          is_default?: boolean;
          address?: Json;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          label?: string;
          is_active?: boolean;
          is_default?: boolean;
          address?: Json;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      v_crm_pipeline_weighted: {
        Row: {
          opportunity_id: string;
          title: string;
          amount_estimated_gnf: number;
          probability_pct: number;
          weighted_amount_gnf: number;
          stage_code: string;
          stage_label: string;
          expected_close_date: string | null;
          owner_id: string | null;
          client_id: string | null;
          created_at: string;
        };
        Relationships: [];
      };
      v_finance_general_ledger: {
        Row: {
          line_id: string;
          batch_id: string;
          booking_date: string;
          batch_reference: string;
          batch_status: string;
          account_id: string;
          account_code: string;
          account_label: string;
          debit_credit: string;
          amount_gnf: number;
          memo: string | null;
          source_module: string | null;
          source_entity_type: string | null;
          source_entity_id: string | null;
          posted_at: string | null;
          line_created_at: string;
        };
        Relationships: [];
      };
      v_finance_trial_balance: {
        Row: {
          account_id: string;
          account_code: string;
          account_label: string;
          account_type: string;
          debit_total_gnf: number;
          credit_total_gnf: number;
        };
        Relationships: [];
      };
      v_logistics_stock_alerts: {
        Row: {
          warehouse_id: string;
          warehouse_code: string;
          product_id: string;
          sku: string;
          product_name: string;
          qty_on_hand: number;
          stock_threshold: number;
        };
        Relationships: [];
      };
    };
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
      admin_permanently_delete_archived_client: {
        Args: { p_client_id: string };
        Returns: undefined;
      };
      admin_permanently_delete_archived_product: {
        Args: { p_product_id: string };
        Returns: undefined;
      };
      claim_infrastructure_jobs: {
        Args: { p_batch_limit?: number };
        Returns: Database["public"]["Tables"]["erp_infrastructure_jobs"]["Row"][];
      };
      compliance_booking_date_permits_journal_post: {
        Args: { p_booking_date: string };
        Returns: boolean;
      };
      refresh_rh_dept_kpis_digest: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      post_finance_journal_batch: {
        Args: { p_batch_id: string };
        Returns: undefined;
      };
      refresh_finance_cashflow_daily: {
        Args: { p_date: string };
        Returns: undefined;
      };
    };
    Enums: {
      expense_payment_method: "cash" | "mobile_money" | "bank_transfer" | "other";
    };
    CompositeTypes: Record<string, never>;
  };
};
