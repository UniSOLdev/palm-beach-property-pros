/** Reusable PostgREST select fragments — keep column lists in sync with database.types.ts */

export const CLIENT_LIST = "id, name, phone, email, address, client_type, referral_source, notes, review_status, follow_up_date, archived, created_at" as const;

export const CREW_LIST = "id, name, phone, role, default_pay_rate, pay_rate_unit, notes, archived, created_at" as const;

export const CREW_OPTIONS = "id, name" as const;

export const JOB_WITH_CLIENT = "*, clients(name)" as const;

export const JOB_WITH_CLIENT_FULL = "*, clients(name, phone, email, address)" as const;

export const QUOTE_WITH_CLIENT = "*, clients(name)" as const;

export const QUOTE_DETAIL = "*, clients(name, phone, email, address), quote_items(*)" as const;

export const INVOICE_WITH_CLIENT = "*, clients(name)" as const;

export const LEAD_LIST = "id, name, phone, email, service_requested, address, city, property_type, status, preferred_date, preferred_time, created_at, updated_at, quote_id, client_id, archived" as const;

export const EXPENSE_LIST = "id, expense_date, category, vendor, description, amount, payment_method, job_id, crew_member_id, receipt_url, notes, expense_type, reimbursable, reimbursed, is_recurring, archived, created_at" as const;

export const MEDIA_ASSET_LIST = "id, title, alt_text, caption, file_url, webp_url, file_type, folder_id, collection_id, tags, service_category, city, job_reference, before_after_group, before_after_role, is_featured, sort_order, file_size_bytes, optimization_status, optimization_error, storage_path, created_at" as const;

export const WEBSITE_PAGE_LIST = "id, slug, title, page_type, status, seo_title, meta_description, og_image_url, preview_token, published_at, updated_at" as const;
