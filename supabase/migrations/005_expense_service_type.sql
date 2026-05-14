-- Optional service type label on expenses (e.g. when not tied to a job, or override).

alter table expenses add column if not exists service_type text;
