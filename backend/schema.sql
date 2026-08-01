-- run this script in the supabase sql editor to initialize the database schema

/*
  storage setup:
  in the supabase dashboard under storage, create a new public bucket named 'images'.
  this bucket stores uploaded animal intrusion detection snapshots.
  ensure public read access is enabled so web and mobile clients can load detection photos.
*/

-- users table (mirrors supabase auth users)
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique not null,
  password_hash text,
  created_at timestamptz default now()
);

-- farms table
create table if not exists farms (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  name text not null,
  location text,
  created_at timestamptz default now()
);

-- cameras table
create table if not exists cameras (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references farms(id) on delete cascade,
  name text not null,
  zone text,
  status boolean not null default true,
  created_at timestamptz default now()
);

-- detections table
create table if not exists detections (
  id uuid primary key default gen_random_uuid(),
  camera_id uuid not null references cameras(id) on delete cascade,
  animal text not null,
  confidence double precision not null,
  image_url text,
  detected_at timestamptz not null default now()
);

-- notifications table
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  detection_id uuid references detections(id) on delete set null,
  title text not null,
  body text not null,
  sent_at timestamptz not null default now(),
  read boolean not null default false
);

-- fcm_tokens table for push notification device registration
create table if not exists fcm_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  token text not null unique,
  created_at timestamptz default now()
);

-- indexes for history filtering and timeline performance
create index if not exists idx_detections_detected_at on detections (detected_at desc);
create index if not exists idx_detections_camera_id on detections (camera_id);
create index if not exists idx_fcm_tokens_user_id on fcm_tokens (user_id);
