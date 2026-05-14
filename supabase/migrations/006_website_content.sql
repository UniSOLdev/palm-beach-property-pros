-- Website / marketing content for PBPP admin Website Manager.
-- URL-based assets until Supabase Storage is wired.

create table if not exists website_gallery_items (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived boolean not null default false,
  image_url text not null,
  before_image_url text,
  after_image_url text,
  caption text,
  service_type text,
  location text,
  job_name text,
  featured boolean not null default false,
  sort_order int not null default 0
);

create table if not exists website_projects (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived boolean not null default false,
  title text not null,
  service_type text,
  city text,
  short_description text,
  before_image_urls text[] not null default '{}',
  after_image_urls text[] not null default '{}',
  featured_image_url text,
  client_name text,
  date_completed date,
  featured boolean not null default false,
  show_on_homepage boolean not null default false,
  sort_order int not null default 0
);

create table if not exists website_reviews (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived boolean not null default false,
  customer_name text not null,
  rating int not null default 5,
  review_text text,
  service_type text,
  city text,
  source text,
  featured boolean not null default false,
  sort_order int not null default 0,
  constraint website_reviews_rating_chk check (rating >= 1 and rating <= 5)
);

create table if not exists website_homepage_content (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  hero_eyebrow text,
  hero_headline text,
  hero_subheadline text,
  primary_cta_text text,
  primary_cta_link text,
  secondary_cta_text text,
  secondary_cta_link text,
  trust_badges text[] not null default '{}',
  featured_service_slugs text[] not null default '{}',
  featured_gallery_ids uuid[] not null default '{}',
  featured_review_ids uuid[] not null default '{}'
);

create table if not exists website_services (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived boolean not null default false,
  name text not null,
  slug text not null unique,
  short_description text,
  full_description text,
  starting_price numeric,
  price_note text,
  hero_image_url text,
  gallery_image_urls text[] not null default '{}',
  active boolean not null default true,
  featured boolean not null default false,
  sort_order int not null default 0,
  cta_text text,
  cta_link text
);

create table if not exists website_service_areas (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived boolean not null default false,
  area_name text not null,
  slug text not null unique,
  short_description text,
  active boolean not null default true,
  featured boolean not null default false,
  sort_order int not null default 0
);

create table if not exists website_media (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived boolean not null default false,
  image_url text not null,
  title text,
  alt_text text,
  category text,
  service_type text,
  tags text[] not null default '{}'
);

create index if not exists website_gallery_items_featured_idx on website_gallery_items (featured, sort_order) where archived = false;
create index if not exists website_reviews_featured_idx on website_reviews (featured, sort_order) where archived = false;
