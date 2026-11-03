-- The Library, phase 1.
-- One keeper for now. owner_id is on every table so rooms can be split later
-- without a migration of the columns themselves.

create extension if not exists pgcrypto;

create table if not exists books (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  title text not null,
  author text not null,
  cover_url text,
  synopsis text,
  genre text not null,
  format text not null check (format in ('physical', 'epub')),
  rating numeric(2, 1) check (rating is null or (rating >= 0 and rating <= 5)),
  review text,
  isbn text,
  status text not null default 'available' check (status in ('available', 'lent')),
  created_at timestamptz not null default now()
);

create table if not exists borrow_requests (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  book_id uuid not null references books (id) on delete cascade,
  requester_name text not null,
  requester_contact text not null,
  message text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'declined')),
  created_at timestamptz not null default now()
);

create index if not exists books_owner_idx on books (owner_id);
create index if not exists books_genre_idx on books (genre);
create index if not exists borrow_requests_owner_idx on borrow_requests (owner_id);
create index if not exists borrow_requests_book_idx on borrow_requests (book_id);
create index if not exists borrow_requests_status_idx on borrow_requests (status);

alter table books enable row level security;
alter table borrow_requests enable row level security;

drop policy if exists books_public_read on books;
create policy books_public_read on books
  for select
  using (true);

-- Writes go through the server with the service role, which bypasses RLS.
-- Borrow requests are never readable by the public role.
