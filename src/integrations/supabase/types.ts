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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      applications: {
        Row: {
          applied_at: string | null
          created_at: string
          follow_up_date: string | null
          id: string
          interview_dates: string[] | null
          job_id: string
          notes: string | null
          offer_details: Json | null
          referral_contact: string | null
          response_at: string | null
          resume_id: string | null
          status: Database["public"]["Enums"]["application_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          applied_at?: string | null
          created_at?: string
          follow_up_date?: string | null
          id?: string
          interview_dates?: string[] | null
          job_id: string
          notes?: string | null
          offer_details?: Json | null
          referral_contact?: string | null
          response_at?: string | null
          resume_id?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          applied_at?: string | null
          created_at?: string
          follow_up_date?: string | null
          id?: string
          interview_dates?: string[] | null
          job_id?: string
          notes?: string | null
          offer_details?: Json | null
          referral_contact?: string | null
          response_at?: string | null
          resume_id?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "user_resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          benefits: Json | null
          company_size: string | null
          created_at: string
          culture_keywords: string[] | null
          description: string | null
          founded_year: number | null
          headquarters: string | null
          id: string
          industry: string | null
          is_featured: boolean | null
          is_verified: boolean | null
          logo_url: string | null
          name: string
          slug: string | null
          tech_stack: string[] | null
          updated_at: string
          website: string | null
        }
        Insert: {
          benefits?: Json | null
          company_size?: string | null
          created_at?: string
          culture_keywords?: string[] | null
          description?: string | null
          founded_year?: number | null
          headquarters?: string | null
          id?: string
          industry?: string | null
          is_featured?: boolean | null
          is_verified?: boolean | null
          logo_url?: string | null
          name: string
          slug?: string | null
          tech_stack?: string[] | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          benefits?: Json | null
          company_size?: string | null
          created_at?: string
          culture_keywords?: string[] | null
          description?: string | null
          founded_year?: number | null
          headquarters?: string | null
          id?: string
          industry?: string | null
          is_featured?: boolean | null
          is_verified?: boolean | null
          logo_url?: string | null
          name?: string
          slug?: string | null
          tech_stack?: string[] | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      company_logos: {
        Row: {
          company_name: string | null
          created_at: string
          domain: string
          favicon_url: string | null
          id: string
          logo_url: string | null
          source: string | null
          updated_at: string
          verified_at: string | null
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          domain: string
          favicon_url?: string | null
          id?: string
          logo_url?: string | null
          source?: string | null
          updated_at?: string
          verified_at?: string | null
        }
        Update: {
          company_name?: string | null
          created_at?: string
          domain?: string
          favicon_url?: string | null
          id?: string
          logo_url?: string | null
          source?: string | null
          updated_at?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      ingestion_logs: {
        Row: {
          completed_at: string | null
          created_at: string
          duration_ms: number | null
          error_details: Json | null
          error_message: string | null
          id: string
          jobs_deduplicated: number | null
          jobs_expired: number | null
          jobs_fetched: number | null
          jobs_new: number | null
          jobs_seen: number | null
          jobs_stale: number | null
          jobs_updated: number | null
          raw_response_sample: Json | null
          source_id: string | null
          started_at: string
          success: boolean | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          duration_ms?: number | null
          error_details?: Json | null
          error_message?: string | null
          id?: string
          jobs_deduplicated?: number | null
          jobs_expired?: number | null
          jobs_fetched?: number | null
          jobs_new?: number | null
          jobs_seen?: number | null
          jobs_stale?: number | null
          jobs_updated?: number | null
          raw_response_sample?: Json | null
          source_id?: string | null
          started_at?: string
          success?: boolean | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          duration_ms?: number | null
          error_details?: Json | null
          error_message?: string | null
          id?: string
          jobs_deduplicated?: number | null
          jobs_expired?: number | null
          jobs_fetched?: number | null
          jobs_new?: number | null
          jobs_seen?: number | null
          jobs_stale?: number | null
          jobs_updated?: number | null
          raw_response_sample?: Json | null
          source_id?: string | null
          started_at?: string
          success?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "ingestion_logs_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "job_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      ingestion_runs: {
        Row: {
          completed_at: string | null
          created_at: string
          duration_ms: number | null
          error_count: number | null
          error_message: string | null
          id: string
          jobs_deduplicated: number | null
          jobs_expired: number | null
          jobs_fetched: number | null
          jobs_new: number | null
          jobs_seen: number | null
          jobs_stale: number | null
          jobs_unchanged: number | null
          jobs_updated: number | null
          run_type: string
          sample_expired_job_ids: string[] | null
          sample_new_job_ids: string[] | null
          sample_updated_job_ids: string[] | null
          source_id: string | null
          started_at: string
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          duration_ms?: number | null
          error_count?: number | null
          error_message?: string | null
          id?: string
          jobs_deduplicated?: number | null
          jobs_expired?: number | null
          jobs_fetched?: number | null
          jobs_new?: number | null
          jobs_seen?: number | null
          jobs_stale?: number | null
          jobs_unchanged?: number | null
          jobs_updated?: number | null
          run_type?: string
          sample_expired_job_ids?: string[] | null
          sample_new_job_ids?: string[] | null
          sample_updated_job_ids?: string[] | null
          source_id?: string | null
          started_at?: string
          status?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          duration_ms?: number | null
          error_count?: number | null
          error_message?: string | null
          id?: string
          jobs_deduplicated?: number | null
          jobs_expired?: number | null
          jobs_fetched?: number | null
          jobs_new?: number | null
          jobs_seen?: number | null
          jobs_stale?: number | null
          jobs_unchanged?: number | null
          jobs_updated?: number | null
          run_type?: string
          sample_expired_job_ids?: string[] | null
          sample_new_job_ids?: string[] | null
          sample_updated_job_ids?: string[] | null
          source_id?: string | null
          started_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ingestion_runs_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "job_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      job_match_scores: {
        Row: {
          computed_at: string
          education_score: number | null
          experience_score: number | null
          gaps: string[] | null
          id: string
          job_id: string
          learning_roadmap: Json | null
          location_score: number | null
          offer_probability: number | null
          overall_score: number
          skill_score: number | null
          strengths: string[] | null
          user_id: string
          visa_score: number | null
        }
        Insert: {
          computed_at?: string
          education_score?: number | null
          experience_score?: number | null
          gaps?: string[] | null
          id?: string
          job_id: string
          learning_roadmap?: Json | null
          location_score?: number | null
          offer_probability?: number | null
          overall_score: number
          skill_score?: number | null
          strengths?: string[] | null
          user_id: string
          visa_score?: number | null
        }
        Update: {
          computed_at?: string
          education_score?: number | null
          experience_score?: number | null
          gaps?: string[] | null
          id?: string
          job_id?: string
          learning_roadmap?: Json | null
          location_score?: number | null
          offer_probability?: number | null
          overall_score?: number
          skill_score?: number | null
          strengths?: string[] | null
          user_id?: string
          visa_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "job_match_scores_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_sources: {
        Row: {
          active_job_count: number | null
          api_endpoint: string | null
          base_url: string
          company_name: string
          company_slug: string | null
          consecutive_failures: number | null
          created_at: string
          failure_count_24h: number | null
          id: string
          is_priority_source: boolean | null
          jobs_added_24h: number | null
          jobs_expired_24h: number | null
          jobs_seen_24h: number | null
          jobs_updated_24h: number | null
          last_error_message: string | null
          last_failure_at: string | null
          last_poll_at: string | null
          last_stats_computed_at: string | null
          last_success_at: string | null
          logo_url: string | null
          name: string
          next_poll_at: string | null
          poll_interval_minutes: number
          reliability_score: number | null
          source_type: Database["public"]["Enums"]["job_source_type"]
          status: Database["public"]["Enums"]["source_status"]
          success_count_24h: number | null
          tags: string[] | null
          total_jobs_ingested: number | null
          updated_at: string
        }
        Insert: {
          active_job_count?: number | null
          api_endpoint?: string | null
          base_url: string
          company_name: string
          company_slug?: string | null
          consecutive_failures?: number | null
          created_at?: string
          failure_count_24h?: number | null
          id?: string
          is_priority_source?: boolean | null
          jobs_added_24h?: number | null
          jobs_expired_24h?: number | null
          jobs_seen_24h?: number | null
          jobs_updated_24h?: number | null
          last_error_message?: string | null
          last_failure_at?: string | null
          last_poll_at?: string | null
          last_stats_computed_at?: string | null
          last_success_at?: string | null
          logo_url?: string | null
          name: string
          next_poll_at?: string | null
          poll_interval_minutes?: number
          reliability_score?: number | null
          source_type: Database["public"]["Enums"]["job_source_type"]
          status?: Database["public"]["Enums"]["source_status"]
          success_count_24h?: number | null
          tags?: string[] | null
          total_jobs_ingested?: number | null
          updated_at?: string
        }
        Update: {
          active_job_count?: number | null
          api_endpoint?: string | null
          base_url?: string
          company_name?: string
          company_slug?: string | null
          consecutive_failures?: number | null
          created_at?: string
          failure_count_24h?: number | null
          id?: string
          is_priority_source?: boolean | null
          jobs_added_24h?: number | null
          jobs_expired_24h?: number | null
          jobs_seen_24h?: number | null
          jobs_updated_24h?: number | null
          last_error_message?: string | null
          last_failure_at?: string | null
          last_poll_at?: string | null
          last_stats_computed_at?: string | null
          last_success_at?: string | null
          logo_url?: string | null
          name?: string
          next_poll_at?: string | null
          poll_interval_minutes?: number
          reliability_score?: number | null
          source_type?: Database["public"]["Enums"]["job_source_type"]
          status?: Database["public"]["Enums"]["source_status"]
          success_count_24h?: number | null
          tags?: string[] | null
          total_jobs_ingested?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      job_verifications: {
        Row: {
          apply_button_found: boolean | null
          created_at: string
          http_status: number | null
          id: string
          is_accessible: boolean | null
          job_closed_signal: boolean | null
          job_id: string
          notes: string | null
          page_title: string | null
          redirect_detected: boolean | null
          redirect_url: string | null
          verified_at: string
        }
        Insert: {
          apply_button_found?: boolean | null
          created_at?: string
          http_status?: number | null
          id?: string
          is_accessible?: boolean | null
          job_closed_signal?: boolean | null
          job_id: string
          notes?: string | null
          page_title?: string | null
          redirect_detected?: boolean | null
          redirect_url?: string | null
          verified_at?: string
        }
        Update: {
          apply_button_found?: boolean | null
          created_at?: string
          http_status?: number | null
          id?: string
          is_accessible?: boolean | null
          job_closed_signal?: boolean | null
          job_id?: string
          notes?: string | null
          page_title?: string | null
          redirect_detected?: boolean | null
          redirect_url?: string | null
          verified_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_verifications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          ai_benefits: string[] | null
          ai_classification_at: string | null
          ai_classification_done: boolean | null
          ai_enriched_at: string | null
          ai_qualifications: string[] | null
          ai_responsibilities: string[] | null
          ai_summary: string | null
          ai_tech_stack: string[] | null
          ai_visa_info: string | null
          application_count: number | null
          apply_url: string | null
          company: string
          company_domain: string | null
          company_logo_url: string | null
          competition_score: number | null
          created_at: string
          description: string
          description_raw: string | null
          description_text: string | null
          education_requirements: string | null
          experience_level_parsed: string | null
          external_job_id: string | null
          first_seen_at: string | null
          freshness_rank: number | null
          hiring_urgency_score: number | null
          id: string
          is_remote: boolean | null
          is_trending: boolean | null
          is_verified: boolean | null
          job_hash: string | null
          last_seen_at: string | null
          last_verified_at: string | null
          location: string
          logo_last_verified_at: string | null
          logo_source: string | null
          logo_storage_url: string | null
          logo_url: string | null
          overall_rank_score: number | null
          posted_date: string | null
          requirements: string[] | null
          role_type: Database["public"]["Enums"]["role_type"] | null
          salary_currency: string | null
          salary_max: number | null
          salary_min: number | null
          source: string | null
          source_id: string | null
          student_relevance_score: number | null
          tech_stack: string[] | null
          title: string
          updated_at: string
          verification_status:
            | Database["public"]["Enums"]["job_verification_status"]
            | null
          visa_sponsorship: boolean | null
          work_type: string
        }
        Insert: {
          ai_benefits?: string[] | null
          ai_classification_at?: string | null
          ai_classification_done?: boolean | null
          ai_enriched_at?: string | null
          ai_qualifications?: string[] | null
          ai_responsibilities?: string[] | null
          ai_summary?: string | null
          ai_tech_stack?: string[] | null
          ai_visa_info?: string | null
          application_count?: number | null
          apply_url?: string | null
          company: string
          company_domain?: string | null
          company_logo_url?: string | null
          competition_score?: number | null
          created_at?: string
          description: string
          description_raw?: string | null
          description_text?: string | null
          education_requirements?: string | null
          experience_level_parsed?: string | null
          external_job_id?: string | null
          first_seen_at?: string | null
          freshness_rank?: number | null
          hiring_urgency_score?: number | null
          id?: string
          is_remote?: boolean | null
          is_trending?: boolean | null
          is_verified?: boolean | null
          job_hash?: string | null
          last_seen_at?: string | null
          last_verified_at?: string | null
          location: string
          logo_last_verified_at?: string | null
          logo_source?: string | null
          logo_storage_url?: string | null
          logo_url?: string | null
          overall_rank_score?: number | null
          posted_date?: string | null
          requirements?: string[] | null
          role_type?: Database["public"]["Enums"]["role_type"] | null
          salary_currency?: string | null
          salary_max?: number | null
          salary_min?: number | null
          source?: string | null
          source_id?: string | null
          student_relevance_score?: number | null
          tech_stack?: string[] | null
          title: string
          updated_at?: string
          verification_status?:
            | Database["public"]["Enums"]["job_verification_status"]
            | null
          visa_sponsorship?: boolean | null
          work_type?: string
        }
        Update: {
          ai_benefits?: string[] | null
          ai_classification_at?: string | null
          ai_classification_done?: boolean | null
          ai_enriched_at?: string | null
          ai_qualifications?: string[] | null
          ai_responsibilities?: string[] | null
          ai_summary?: string | null
          ai_tech_stack?: string[] | null
          ai_visa_info?: string | null
          application_count?: number | null
          apply_url?: string | null
          company?: string
          company_domain?: string | null
          company_logo_url?: string | null
          competition_score?: number | null
          created_at?: string
          description?: string
          description_raw?: string | null
          description_text?: string | null
          education_requirements?: string | null
          experience_level_parsed?: string | null
          external_job_id?: string | null
          first_seen_at?: string | null
          freshness_rank?: number | null
          hiring_urgency_score?: number | null
          id?: string
          is_remote?: boolean | null
          is_trending?: boolean | null
          is_verified?: boolean | null
          job_hash?: string | null
          last_seen_at?: string | null
          last_verified_at?: string | null
          location?: string
          logo_last_verified_at?: string | null
          logo_source?: string | null
          logo_storage_url?: string | null
          logo_url?: string | null
          overall_rank_score?: number | null
          posted_date?: string | null
          requirements?: string[] | null
          role_type?: Database["public"]["Enums"]["role_type"] | null
          salary_currency?: string | null
          salary_max?: number | null
          salary_min?: number | null
          source?: string | null
          source_id?: string | null
          student_relevance_score?: number | null
          tech_stack?: string[] | null
          title?: string
          updated_at?: string
          verification_status?:
            | Database["public"]["Enums"]["job_verification_status"]
            | null
          visa_sponsorship?: boolean | null
          work_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "job_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string | null
          experience_level: string | null
          github_url: string | null
          graduation_date: string | null
          headline: string | null
          id: string
          is_open_to_work: boolean | null
          is_public: boolean | null
          last_active_at: string | null
          linkedin_url: string | null
          location: string | null
          name: string | null
          portfolio_url: string | null
          preferred_locations: string[] | null
          profile_completeness: number | null
          remote_preference: string | null
          salary_max: number | null
          salary_min: number | null
          salary_range: string | null
          skills: string[] | null
          title: string | null
          updated_at: string
          user_id: string
          visa_status: string | null
          work_authorization: string | null
          work_type: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          experience_level?: string | null
          github_url?: string | null
          graduation_date?: string | null
          headline?: string | null
          id?: string
          is_open_to_work?: boolean | null
          is_public?: boolean | null
          last_active_at?: string | null
          linkedin_url?: string | null
          location?: string | null
          name?: string | null
          portfolio_url?: string | null
          preferred_locations?: string[] | null
          profile_completeness?: number | null
          remote_preference?: string | null
          salary_max?: number | null
          salary_min?: number | null
          salary_range?: string | null
          skills?: string[] | null
          title?: string | null
          updated_at?: string
          user_id: string
          visa_status?: string | null
          work_authorization?: string | null
          work_type?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          experience_level?: string | null
          github_url?: string | null
          graduation_date?: string | null
          headline?: string | null
          id?: string
          is_open_to_work?: boolean | null
          is_public?: boolean | null
          last_active_at?: string | null
          linkedin_url?: string | null
          location?: string | null
          name?: string | null
          portfolio_url?: string | null
          preferred_locations?: string[] | null
          profile_completeness?: number | null
          remote_preference?: string | null
          salary_max?: number | null
          salary_min?: number | null
          salary_range?: string | null
          skills?: string[] | null
          title?: string | null
          updated_at?: string
          user_id?: string
          visa_status?: string | null
          work_authorization?: string | null
          work_type?: string | null
        }
        Relationships: []
      }
      recruiter_profiles: {
        Row: {
          avatar_url: string | null
          company_id: string | null
          created_at: string
          department: string | null
          email: string
          full_name: string
          hiring_for: string[] | null
          id: string
          is_primary_contact: boolean | null
          is_verified: boolean | null
          job_title: string | null
          linkedin_url: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string
          department?: string | null
          email: string
          full_name: string
          hiring_for?: string[] | null
          id?: string
          is_primary_contact?: boolean | null
          is_verified?: boolean | null
          job_title?: string | null
          linkedin_url?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string
          department?: string | null
          email?: string
          full_name?: string
          hiring_for?: string[] | null
          id?: string
          is_primary_contact?: boolean | null
          is_verified?: boolean | null
          job_title?: string | null
          linkedin_url?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recruiter_profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          features: Json
          id: string
          is_active: boolean
          limits: Json
          name: string
          price_monthly: number
          price_yearly: number | null
          role: Database["public"]["Enums"]["app_role"]
          slug: string
          stripe_price_id_monthly: string | null
          stripe_price_id_yearly: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          features?: Json
          id?: string
          is_active?: boolean
          limits?: Json
          name: string
          price_monthly?: number
          price_yearly?: number | null
          role: Database["public"]["Enums"]["app_role"]
          slug: string
          stripe_price_id_monthly?: string | null
          stripe_price_id_yearly?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          features?: Json
          id?: string
          is_active?: boolean
          limits?: Json
          name?: string
          price_monthly?: number
          price_yearly?: number | null
          role?: Database["public"]["Enums"]["app_role"]
          slug?: string
          stripe_price_id_monthly?: string | null
          stripe_price_id_yearly?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      usage_logs: {
        Row: {
          count: number
          created_at: string
          feature: string
          id: string
          metadata: Json | null
          period_end: string
          period_start: string
          user_id: string
        }
        Insert: {
          count?: number
          created_at?: string
          feature: string
          id?: string
          metadata?: Json | null
          period_end: string
          period_start: string
          user_id: string
        }
        Update: {
          count?: number
          created_at?: string
          feature?: string
          id?: string
          metadata?: Json | null
          period_end?: string
          period_start?: string
          user_id?: string
        }
        Relationships: []
      }
      user_job_interactions: {
        Row: {
          action: string
          created_at: string
          id: string
          job_id: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          job_id: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          job_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_job_interactions_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      user_projects: {
        Row: {
          architecture_diagram_url: string | null
          created_at: string
          demo_url: string | null
          description: string | null
          display_order: number | null
          end_date: string | null
          github_url: string | null
          id: string
          is_featured: boolean | null
          is_public: boolean | null
          performance_metrics: Json | null
          scale_metrics: Json | null
          start_date: string | null
          tech_stack: string[] | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          architecture_diagram_url?: string | null
          created_at?: string
          demo_url?: string | null
          description?: string | null
          display_order?: number | null
          end_date?: string | null
          github_url?: string | null
          id?: string
          is_featured?: boolean | null
          is_public?: boolean | null
          performance_metrics?: Json | null
          scale_metrics?: Json | null
          start_date?: string | null
          tech_stack?: string[] | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          architecture_diagram_url?: string | null
          created_at?: string
          demo_url?: string | null
          description?: string | null
          display_order?: number | null
          end_date?: string | null
          github_url?: string | null
          id?: string
          is_featured?: boolean | null
          is_public?: boolean | null
          performance_metrics?: Json | null
          scale_metrics?: Json | null
          start_date?: string | null
          tech_stack?: string[] | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_resumes: {
        Row: {
          ats_score: number | null
          created_at: string
          id: string
          improvement_suggestions: Json | null
          interview_count: number | null
          is_primary: boolean | null
          keyword_matches: string[] | null
          name: string
          offer_count: number | null
          original_file_url: string | null
          parsed_content: Json | null
          tailored_content: Json | null
          target_job_id: string | null
          updated_at: string
          user_id: string
          version: number | null
        }
        Insert: {
          ats_score?: number | null
          created_at?: string
          id?: string
          improvement_suggestions?: Json | null
          interview_count?: number | null
          is_primary?: boolean | null
          keyword_matches?: string[] | null
          name?: string
          offer_count?: number | null
          original_file_url?: string | null
          parsed_content?: Json | null
          tailored_content?: Json | null
          target_job_id?: string | null
          updated_at?: string
          user_id: string
          version?: number | null
        }
        Update: {
          ats_score?: number | null
          created_at?: string
          id?: string
          improvement_suggestions?: Json | null
          interview_count?: number | null
          is_primary?: boolean | null
          keyword_matches?: string[] | null
          name?: string
          offer_count?: number | null
          original_file_url?: string | null
          parsed_content?: Json | null
          tailored_content?: Json | null
          target_job_id?: string | null
          updated_at?: string
          user_id?: string
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_resumes_target_job_id_fkey"
            columns: ["target_job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          canceled_at: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_id: string
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_end: string | null
          trial_start: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id: string
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_freshness_rank: { Args: { posted: string }; Returns: number }
      compute_source_stats: { Args: never; Returns: undefined }
      generate_job_hash: {
        Args: {
          p_apply_url: string
          p_company: string
          p_location: string
          p_title: string
        }
        Returns: string
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "free" | "pro" | "power" | "recruiter" | "admin"
      application_status:
        | "saved"
        | "applied"
        | "screening"
        | "interview"
        | "offer"
        | "rejected"
        | "withdrawn"
        | "accepted"
      job_source_type:
        | "greenhouse"
        | "lever"
        | "ashby"
        | "workday"
        | "career_page"
        | "rss_feed"
        | "sitemap"
        | "manual"
      job_verification_status:
        | "pending"
        | "verified_active"
        | "stale"
        | "expired"
        | "removed"
      role_type:
        | "internship"
        | "new_grad"
        | "part_time"
        | "full_time"
        | "contract"
        | "unknown"
      source_status: "active" | "paused" | "failing" | "disabled"
      subscription_status:
        | "active"
        | "canceled"
        | "past_due"
        | "trialing"
        | "paused"
        | "incomplete"
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
      app_role: ["free", "pro", "power", "recruiter", "admin"],
      application_status: [
        "saved",
        "applied",
        "screening",
        "interview",
        "offer",
        "rejected",
        "withdrawn",
        "accepted",
      ],
      job_source_type: [
        "greenhouse",
        "lever",
        "ashby",
        "workday",
        "career_page",
        "rss_feed",
        "sitemap",
        "manual",
      ],
      job_verification_status: [
        "pending",
        "verified_active",
        "stale",
        "expired",
        "removed",
      ],
      role_type: [
        "internship",
        "new_grad",
        "part_time",
        "full_time",
        "contract",
        "unknown",
      ],
      source_status: ["active", "paused", "failing", "disabled"],
      subscription_status: [
        "active",
        "canceled",
        "past_due",
        "trialing",
        "paused",
        "incomplete",
      ],
    },
  },
} as const
