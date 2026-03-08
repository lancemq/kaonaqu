create table if not exists public.content_schools (
  id text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.content_policies (
  id text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.content_news (
  id text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

create index if not exists idx_content_schools_updated_at on public.content_schools (updated_at desc);
create index if not exists idx_content_policies_updated_at on public.content_policies (updated_at desc);
create index if not exists idx_content_news_updated_at on public.content_news (updated_at desc);
