export type TimeEntryRow = {
  id: string;
  crew_member_id: string;
  job_id: string | null;
  clock_in: string;
  clock_out: string | null;
  notes: string | null;
  created_at: string;
};

export type CrewReferralRow = {
  id: string;
  crew_member_id: string;
  lead_id: string | null;
  job_id: string | null;
  contact_name: string;
  contact_phone: string | null;
  contact_email: string | null;
  service_requested: string | null;
  description: string | null;
  status: "pending" | "approved" | "paid" | "declined";
  incentive_amount: number | null;
  paid_at: string | null;
  created_at: string;
};

export type HubCrewMember = {
  id: string;
  name: string;
  referral_bonus_flat: number;
  referral_bonus_percent: number;
};

export type HubTaskPreview = {
  id: string;
  title: string;
  status: string;
  due_date: string | null;
  job_id: string | null;
};

export type HubJobPreview = {
  id: string;
  label: string;
  job_date: string;
  start_time: string | null;
};

export type HubSupplyPreview = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  reorder_level: number;
  storage_location: string | null;
};

export type HubSnapshot = {
  crew: HubCrewMember | null;
  openEntry: TimeEntryRow | null;
  todayTasks: HubTaskPreview[];
  todayJobs: HubJobPreview[];
  referrals: CrewReferralRow[];
  lowStock: HubSupplyPreview[];
  supplies: HubSupplyPreview[];
};
