-- Optional: run in the Supabase SQL editor to receive data as participants play.
-- Without Supabase, participants download their data file at the end instead.

create table if not exists decisions (
  id bigint generated always as identity primary key,
  created_at timestamptz default now(),
  participant_id text not null,
  condition text not null,
  has_explanation boolean,
  has_debrief boolean,
  framing text,
  flight int,
  event_index int,
  event_id text,
  phase text,
  aids_active boolean,
  explanation_shown boolean,
  aria_recommend text,
  aria_correct boolean,
  error_type text,
  severity text,
  action text,
  chosen_option text,
  correct_option text,
  choice_correct boolean,
  detected boolean,
  false_alarm boolean,
  verified boolean,
  panels_viewed text,
  first_verify_ms int,
  evidence_clicks int,
  response_ms int,
  timestamp timestamptz
);

create table if not exists sessions (
  id bigint generated always as identity primary key,
  created_at timestamptz default now(),
  participant_id text not null,
  condition text,
  framing text,
  study_version text,
  test_mode boolean,
  payload jsonb not null
);

-- Participants may insert rows but never read them.
alter table decisions enable row level security;
alter table sessions enable row level security;
create policy "insert only" on decisions for insert to anon with check (true);
create policy "insert only" on sessions for insert to anon with check (true);
