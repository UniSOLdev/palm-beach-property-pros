-- Soft-delete / archive flags for operational tables.
-- Keeps historical reporting intact while hiding archived rows from default admin lists.

alter table clients add column if not exists archived boolean not null default false;
alter table jobs add column if not exists archived boolean not null default false;
alter table quotes add column if not exists archived boolean not null default false;
alter table invoices add column if not exists archived boolean not null default false;
alter table expenses add column if not exists archived boolean not null default false;
alter table supplies add column if not exists archived boolean not null default false;
alter table crew_members add column if not exists archived boolean not null default false;

create index if not exists clients_archived_idx on clients (archived);
create index if not exists jobs_archived_idx on jobs (archived);
create index if not exists quotes_archived_idx on quotes (archived);
create index if not exists invoices_archived_idx on invoices (archived);
create index if not exists expenses_archived_idx on expenses (archived);
create index if not exists supplies_archived_idx on supplies (archived);
create index if not exists crew_members_archived_idx on crew_members (archived);
