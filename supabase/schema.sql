-- PolicyWatch Database Schema v1.0

-- 법안
create table if not exists bills (
  id              bigserial primary key,
  bill_no         varchar(20) unique not null,
  bill_name       text not null,
  proposer        text not null,
  propose_dt      date not null,
  proc_result     varchar(50) not null default '접수',
  committee       varchar(100),
  assembly_age    varchar(10),
  detail_link     text,
  full_text       text,
  ai_summary      text,
  ai_impact       jsonb,
  ai_stakeholders jsonb,
  ai_issues       text[],
  ai_confidence   varchar(10) check (ai_confidence in ('high', 'medium', 'low')),
  created_at      timestamptz default now()
);

create index if not exists bills_propose_dt_idx on bills (propose_dt desc);
create index if not exists bills_proc_result_idx on bills (proc_result);
create index if not exists bills_committee_idx on bills (committee);

-- 의원 (Phase 2)
create table if not exists legislators (
  id              bigserial primary key,
  name            varchar(50) not null,
  party           varchar(50),
  district        varchar(100),
  term_no         int,
  total_bills     int default 0,
  attendance_rate float,
  created_at      timestamptz default now()
);

-- 사용자
create table if not exists users (
  id              uuid primary key default gen_random_uuid(),
  email           text unique not null,
  keywords        text[] default '{}',
  telegram_id     bigint,
  subscribed_at   timestamptz default now(),
  premium_until   timestamptz,
  is_active       boolean default true
);

create index if not exists users_email_idx on users (email);
create index if not exists users_telegram_id_idx on users (telegram_id);

-- 알림 로그
create table if not exists notifications (
  id        bigserial primary key,
  user_id   uuid references users (id) on delete cascade,
  bill_id   bigint references bills (id) on delete cascade,
  channel   varchar(20) check (channel in ('email', 'telegram', 'web')),
  sent_at   timestamptz default now(),
  opened_at timestamptz
);

create index if not exists notifications_user_id_idx on notifications (user_id);
create index if not exists notifications_sent_at_idx on notifications (sent_at desc);
