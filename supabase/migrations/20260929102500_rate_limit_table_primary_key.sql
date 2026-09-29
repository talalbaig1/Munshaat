-- Add a primary key to the private API rate-limit table.
alter table private.monshaat_api_rate_limits
  add column if not exists id bigint generated always as identity;

create unique index if not exists monshaat_api_rate_limits_pkey_idx
  on private.monshaat_api_rate_limits(id);

alter table private.monshaat_api_rate_limits
  add constraint monshaat_api_rate_limits_pkey primary key using index monshaat_api_rate_limits_pkey_idx;
