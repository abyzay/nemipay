export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type ChargeStatus =
  | 'CREATING'
  | 'AWAITING_PAYMENT'
  | 'CONFIRMED'
  | 'EXPIRED'
  | 'FAILED'
  | 'CANCELLED'
  | 'UNDER_REVIEW';

export type SplitMode = 'EQUAL' | 'CUSTOM' | 'FREE';

export type BillStatus = 'OPEN' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED' | 'EXPIRED';

export interface Database {
  public: {
    Tables: {
      merchants: {
        Row: {
          id: string;
          name: string;
          owner_name: string | null;
          phone: string | null;
          clabe: string | null;
          bank_name: string | null;
          notifications_enabled: boolean;
          voice_announcements_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          owner_name?: string | null;
          phone?: string | null;
          clabe?: string | null;
          bank_name?: string | null;
          notifications_enabled?: boolean;
          voice_announcements_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          owner_name?: string | null;
          phone?: string | null;
          clabe?: string | null;
          bank_name?: string | null;
          notifications_enabled?: boolean;
          voice_announcements_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          merchant_id: string;
          name: string;
          description: string | null;
          image_url: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          merchant_id: string;
          name: string;
          description?: string | null;
          image_url?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          merchant_id?: string;
          name?: string;
          description?: string | null;
          image_url?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'categories_merchant_id_fkey';
            columns: ['merchant_id'];
            isOneToOne: false;
            referencedRelation: 'merchants';
            referencedColumns: ['id'];
          },
        ];
      };
      products: {
        Row: {
          id: string;
          merchant_id: string;
          name: string;
          price_cents: number;
          description: string | null;
          category: string;
          category_id: string | null;
          image_url: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          merchant_id: string;
          name: string;
          price_cents: number;
          description?: string | null;
          category?: string;
          category_id?: string | null;
          image_url?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          merchant_id?: string;
          name?: string;
          price_cents?: number;
          description?: string | null;
          category?: string;
          category_id?: string | null;
          image_url?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'products_merchant_id_fkey';
            columns: ['merchant_id'];
            isOneToOne: false;
            referencedRelation: 'merchants';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'products_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
        ];
      };
      charges: {
        Row: {
          id: string;
          merchant_id: string;
          amount_cents: number;
          currency: string;
          concept: string;
          items: Json | null;
          status: ChargeStatus;
          idempotency_key: string;
          request_hash: string;
          pey_reference: string | null;
          pey_transaction_id: string | null;
          qr_payload: string | null;
          expires_at: string;
          paid_at: string | null;
          paid_after_expiry: boolean;
          failure_reason: string | null;
          last_checked_at: string | null;
          bill_id: string | null;
          participant_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          merchant_id: string;
          amount_cents: number;
          currency?: string;
          concept: string;
          items?: Json | null;
          status?: ChargeStatus;
          idempotency_key: string;
          request_hash: string;
          pey_reference?: string | null;
          pey_transaction_id?: string | null;
          qr_payload?: string | null;
          expires_at: string;
          paid_at?: string | null;
          paid_after_expiry?: boolean;
          failure_reason?: string | null;
          last_checked_at?: string | null;
          bill_id?: string | null;
          participant_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          merchant_id?: string;
          amount_cents?: number;
          currency?: string;
          concept?: string;
          items?: Json | null;
          status?: ChargeStatus;
          idempotency_key?: string;
          request_hash?: string;
          pey_reference?: string | null;
          pey_transaction_id?: string | null;
          qr_payload?: string | null;
          expires_at?: string;
          paid_at?: string | null;
          paid_after_expiry?: boolean;
          failure_reason?: string | null;
          last_checked_at?: string | null;
          bill_id?: string | null;
          participant_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'charges_merchant_id_fkey';
            columns: ['merchant_id'];
            isOneToOne: false;
            referencedRelation: 'merchants';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'charges_bill_id_fkey';
            columns: ['bill_id'];
            isOneToOne: false;
            referencedRelation: 'bills';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'charges_participant_id_fkey';
            columns: ['participant_id'];
            isOneToOne: false;
            referencedRelation: 'bill_participants';
            referencedColumns: ['id'];
          },
        ];
      };
      bills: {
        Row: {
          id: string;
          merchant_id: string;
          concept: string;
          items: Json | null;
          total_cents: number;
          split_mode: SplitMode;
          status: BillStatus;
          idempotency_key: string;
          request_hash: string;
          collected_cents: number;
          overpaid_cents: number;
          expires_at: string;
          closed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          merchant_id: string;
          concept: string;
          items?: Json | null;
          total_cents: number;
          split_mode: SplitMode;
          status?: BillStatus;
          idempotency_key: string;
          request_hash: string;
          collected_cents?: number;
          overpaid_cents?: number;
          expires_at: string;
          closed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          merchant_id?: string;
          concept?: string;
          items?: Json | null;
          total_cents?: number;
          split_mode?: SplitMode;
          status?: BillStatus;
          idempotency_key?: string;
          request_hash?: string;
          collected_cents?: number;
          overpaid_cents?: number;
          expires_at?: string;
          closed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'bills_merchant_id_fkey';
            columns: ['merchant_id'];
            isOneToOne: false;
            referencedRelation: 'merchants';
            referencedColumns: ['id'];
          },
        ];
      };
      bill_participants: {
        Row: {
          id: string;
          bill_id: string;
          position: number;
          label: string;
          share_cents: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          bill_id: string;
          position: number;
          label?: string;
          share_cents?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          bill_id?: string;
          position?: number;
          label?: string;
          share_cents?: number | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'bill_participants_bill_id_fkey';
            columns: ['bill_id'];
            isOneToOne: false;
            referencedRelation: 'bills';
            referencedColumns: ['id'];
          },
        ];
      };
      webhook_events: {
        Row: {
          id: string;
          webhook_id: string;
          type: string | null;
          payload: Json;
          received_at: string;
          processed_at: string | null;
          error: string | null;
        };
        Insert: {
          id?: string;
          webhook_id: string;
          type?: string | null;
          payload: Json;
          received_at?: string;
          processed_at?: string | null;
          error?: string | null;
        };
        Update: {
          id?: string;
          webhook_id?: string;
          type?: string | null;
          payload?: Json;
          received_at?: string;
          processed_at?: string | null;
          error?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      apply_charge_transition: {
        Args: {
          p_charge_id: string;
          p_to: ChargeStatus;
          p_pey_reference?: string | null;
          p_pey_transaction_id?: string | null;
          p_qr_payload?: string | null;
          p_paid_at?: string | null;
          p_failure_reason?: string | null;
        };
        Returns: Database['public']['Tables']['charges']['Row'];
      };
      charges_today: {
        Args: Record<string, never>;
        Returns: Database['public']['Tables']['charges']['Row'][];
      };
      daily_summary: {
        Args: Record<string, never>;
        Returns: {
          total_confirmed_cents: number;
          count_confirmed: number;
        }[];
      };
      get_bill_detail: {
        Args: {
          p_bill_id: string;
        };
        Returns: Json;
      };
    };
    Enums: {
      charge_status: ChargeStatus;
      split_mode: SplitMode;
      bill_status: BillStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}
