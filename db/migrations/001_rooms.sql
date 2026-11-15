-- The Library: rooms for everyone.
-- Every statement is safe to run again. The server reaches the database with the
-- service connection only; row level security stays on with no public policies.

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists sessions (
  token_hash text primary key,
  user_id uuid not null references users (id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists sessions_user_idx on sessions (user_id);

create table if not exists profiles (
  id uuid primary key,
  handle text not null unique,
  display_name text not null,
  bio text,
  visibility text not null default 'private',
  claimed boolean not null default true,
  created_at timestamptz not null default now(),
  constraint profiles_handle_shape check (handle ~ '^[a-z0-9][a-z0-9-]{1,29}$'),
  constraint profiles_visibility check (visibility in ('private', 'unlisted', 'public'))
);

create table if not exists books (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  title text not null,
  author text not null,
  cover_url text,
  synopsis text,
  genre text not null,
  format text not null default 'physical',
  rating numeric(2, 1),
  review text,
  isbn text,
  status text not null default 'available',
  created_at timestamptz not null default now()
);

alter table books add column if not exists shelves text[] not null default '{}';
alter table books add column if not exists subgenres text[] not null default '{}';
alter table books add column if not exists reading_status text not null default 'owned';
alter table books add column if not exists started_at date;
alter table books add column if not exists finished_at date;
alter table books add column if not exists source text not null default 'manual';
alter table books add column if not exists enriched boolean not null default true;
alter table books add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'books_reading_status') then
    alter table books add constraint books_reading_status check (reading_status in ('owned', 'reading', 'read', 'to-read'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'books_rating_range') then
    alter table books add constraint books_rating_range check (rating is null or (rating >= 0 and rating <= 5));
  end if;
end $$;

create index if not exists books_owner_idx on books (owner_id);
create index if not exists books_owner_reading_idx on books (owner_id, reading_status);
create index if not exists books_unenriched_idx on books (owner_id) where enriched = false;

create table if not exists borrow_requests (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  book_id uuid not null references books (id) on delete cascade,
  requester_name text not null,
  requester_contact text not null,
  message text,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);
create index if not exists borrow_requests_owner_idx on borrow_requests (owner_id);

alter table users enable row level security;
alter table sessions enable row level security;
alter table profiles enable row level security;
alter table books enable row level security;
alter table borrow_requests enable row level security;
