import type { ProspectStatus, ProspectType } from "@/lib/admin/outreach/constants";

export type OutreachProspectRow = {
  id: string;
  seed_key: string | null;
  company_name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  prospect_type: ProspectType;
  status: ProspectStatus;
  address: string | null;
  zip: string | null;
  pitch_notes: string | null;
  internal_notes: string | null;
  next_follow_up: string | null;
  sort_order: number;
  archived: boolean;
  created_at: string;
  updated_at: string;
};
