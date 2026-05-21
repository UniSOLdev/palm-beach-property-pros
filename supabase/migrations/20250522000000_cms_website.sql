-- PBPP Website Manager — modular CMS tables (service role / admin API only; RLS enabled, no anon policies).

-- ---------------------------------------------------------------------------
-- Singleton configuration rows (id = 1)
-- ---------------------------------------------------------------------------
create table if not exists public.cms_homepage (
  id smallint primary key default 1,
  constraint cms_homepage_singleton check (id = 1),
  draft_sections jsonb not null default '[]'::jsonb,
  published_sections jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

create table if not exists public.cms_site_shell (
  id smallint primary key default 1,
  constraint cms_site_shell_singleton check (id = 1),
  draft jsonb not null default '{}'::jsonb,
  published jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

create table if not exists public.cms_theme (
  id smallint primary key default 1,
  constraint cms_theme_singleton check (id = 1),
  draft jsonb not null default '{}'::jsonb,
  published jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

create table if not exists public.cms_seo (
  id smallint primary key default 1,
  constraint cms_seo_singleton check (id = 1),
  draft jsonb not null default '{}'::jsonb,
  published jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

insert into public.cms_homepage (id, draft_sections, published_sections)
values (1, '[]'::jsonb, '[]'::jsonb)
on conflict (id) do nothing;

insert into public.cms_site_shell (id, draft, published)
values (1, '{}'::jsonb, '{}'::jsonb)
on conflict (id) do nothing;

insert into public.cms_theme (id, draft, published)
values (1, '{}'::jsonb, '{}'::jsonb)
on conflict (id) do nothing;

insert into public.cms_seo (id, draft, published)
values (1, '{}'::jsonb, '{}'::jsonb)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Media library (Supabase Storage bucket website-media)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'website-media',
  'website-media',
  true,
  52428800,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
on conflict (id) do update set public = excluded.public;

create table if not exists public.cms_media_assets (
  id uuid primary key default gen_random_uuid(),
  bucket_id text not null default 'website-media',
  storage_path text not null unique,
  public_url text not null,
  mime_type text,
  byte_size bigint,
  alt_text text,
  title text,
  tags text[] not null default '{}'::text[],
  category text not null default 'general',
  featured boolean not null default false,
  status text not null default 'published' check (status in ('draft', 'published', 'archived')),
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cms_media_assets_category_idx on public.cms_media_assets (category);
create index if not exists cms_media_assets_status_idx on public.cms_media_assets (status);
create index if not exists cms_media_assets_featured_idx on public.cms_media_assets (featured) where featured = true;

-- ---------------------------------------------------------------------------
-- Projects / case studies
-- ---------------------------------------------------------------------------
create table if not exists public.cms_projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  client_type text,
  service_category text,
  summary text,
  challenge text,
  work_completed text,
  before_asset_id uuid references public.cms_media_assets (id) on delete set null,
  after_asset_id uuid references public.cms_media_assets (id) on delete set null,
  testimonial_text text,
  completed_on date,
  featured boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  seo jsonb not null default '{}'::jsonb,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cms_projects_status_idx on public.cms_projects (status);
create index if not exists cms_projects_featured_idx on public.cms_projects (featured) where featured = true;

-- ---------------------------------------------------------------------------
-- Gallery (before/after, optional project link)
-- ---------------------------------------------------------------------------
create table if not exists public.cms_gallery_items (
  id uuid primary key default gen_random_uuid(),
  title text,
  caption text,
  before_asset_id uuid references public.cms_media_assets (id) on delete set null,
  after_asset_id uuid references public.cms_media_assets (id) on delete set null,
  service_tags text[] not null default '{}'::text[],
  project_id uuid references public.cms_projects (id) on delete set null,
  sort_order integer not null default 0,
  featured boolean not null default false,
  location_tag text,
  status text not null default 'published' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cms_gallery_items_sort_idx on public.cms_gallery_items (sort_order);
create index if not exists cms_gallery_items_status_idx on public.cms_gallery_items (status);

-- ---------------------------------------------------------------------------
-- Reviews / testimonials
-- ---------------------------------------------------------------------------
create table if not exists public.cms_reviews (
  id uuid primary key default gen_random_uuid(),
  author_name text not null,
  rating smallint not null check (rating >= 1 and rating <= 5),
  body text,
  source text,
  service_slugs text[] not null default '{}'::text[],
  featured boolean not null default false,
  show_on_homepage boolean not null default false,
  status text not null default 'published' check (status in ('draft', 'published', 'archived')),
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cms_reviews_status_idx on public.cms_reviews (status);
create index if not exists cms_reviews_home_idx on public.cms_reviews (show_on_homepage) where show_on_homepage = true;

-- ---------------------------------------------------------------------------
-- Service area landing content (future /locations/[slug] routes)
-- ---------------------------------------------------------------------------
create table if not exists public.cms_service_areas (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  city_name text not null,
  headline text,
  body jsonb not null default '{}'::jsonb,
  featured_service_slugs text[] not null default '{}'::text[],
  featured boolean not null default false,
  cta_label text,
  cta_href text,
  hero_asset_id uuid references public.cms_media_assets (id) on delete set null,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  seo jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cms_service_areas_status_idx on public.cms_service_areas (status);

-- ---------------------------------------------------------------------------
-- Centralized CTAs + nav links (published rows drive the live site when shell is empty)
-- ---------------------------------------------------------------------------
create table if not exists public.cms_ctas (
  id uuid primary key default gen_random_uuid(),
  cta_key text unique,
  label text not null,
  href text not null,
  variant text not null default 'primary',
  open_new_tab boolean not null default false,
  sticky_mobile boolean not null default false,
  sort_order integer not null default 0,
  status text not null default 'published' check (status in ('draft', 'published', 'archived')),
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cms_ctas_status_idx on public.cms_ctas (status);

create table if not exists public.cms_nav_links (
  id uuid primary key default gen_random_uuid(),
  placement text not null check (placement in ('header', 'footer')),
  label text not null,
  href text not null,
  sort_order integer not null default 0,
  status text not null default 'published' check (status in ('draft', 'published', 'archived')),
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cms_nav_links_placement_idx on public.cms_nav_links (placement, sort_order);

-- ---------------------------------------------------------------------------
-- Service content overlays (slug matches lib/services.ts)
-- ---------------------------------------------------------------------------
create table if not exists public.cms_service_overrides (
  slug text primary key,
  draft jsonb not null default '{}'::jsonb,
  published jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

-- ---------------------------------------------------------------------------
-- RLS (deny direct client access; server uses service role)
-- ---------------------------------------------------------------------------
alter table public.cms_homepage enable row level security;
alter table public.cms_site_shell enable row level security;
alter table public.cms_theme enable row level security;
alter table public.cms_seo enable row level security;
alter table public.cms_media_assets enable row level security;
alter table public.cms_projects enable row level security;
alter table public.cms_gallery_items enable row level security;
alter table public.cms_reviews enable row level security;
alter table public.cms_service_areas enable row level security;
alter table public.cms_ctas enable row level security;
alter table public.cms_nav_links enable row level security;
alter table public.cms_service_overrides enable row level security;

-- Public read for marketing images (optional; keeps public URLs working without service role)
drop policy if exists "Public read website media objects" on storage.objects;
create policy "Public read website media objects"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'website-media');
