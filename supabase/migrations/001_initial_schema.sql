-- StudyForge AI initial schema. Run through `supabase db push` or the SQL editor.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  email text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.study_guides (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  subject text,
  original_file_name text,
  file_type text not null,
  extracted_text text not null,
  processed_sections_json jsonb not null default '[]',
  detected_topics_json jsonb not null default '[]',
  word_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create table if not exists public.quizzes (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  study_guide_id text references public.study_guides(id) on delete cascade,
  title text not null,
  mode text not null,
  difficulty text not null,
  settings_json jsonb not null,
  questions_json jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.quiz_attempts (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  quiz_id text references public.quizzes(id) on delete set null,
  status text not null check (status in ('in_progress','completed')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  score numeric not null default 0,
  possible_score numeric not null default 0,
  percentage numeric not null default 0,
  time_spent_seconds integer not null default 0,
  answers_json jsonb not null default '{}',
  performance_summary_json jsonb not null default '{}'
);

create table if not exists public.topic_performance (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  study_guide_id text references public.study_guides(id) on delete cascade,
  topic text not null,
  questions_attempted integer not null default 0,
  questions_correct integer not null default 0,
  accuracy numeric not null default 0,
  average_response_time numeric not null default 0,
  mastery_level text not null default 'new',
  last_practiced_at timestamptz,
  unique(user_id, study_guide_id, topic)
);

create table if not exists public.quiz_presets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  settings_json jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists study_guides_user_created_idx on public.study_guides(user_id, created_at desc);
create index if not exists quizzes_user_created_idx on public.quizzes(user_id, created_at desc);
create index if not exists quiz_attempts_user_completed_idx on public.quiz_attempts(user_id, completed_at desc);
create index if not exists topic_performance_user_accuracy_idx on public.topic_performance(user_id, accuracy);

alter table public.profiles enable row level security;
alter table public.study_guides enable row level security;
alter table public.quizzes enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.topic_performance enable row level security;
alter table public.quiz_presets enable row level security;

create policy "profiles_own_rows" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "study_guides_own_rows" on public.study_guides for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "quizzes_own_rows" on public.quizzes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "quiz_attempts_own_rows" on public.quiz_attempts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "topic_performance_own_rows" on public.topic_performance for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "quiz_presets_own_rows" on public.quiz_presets for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id, email, display_name) values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)));
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

create or replace function public.delete_my_studyforge_data() returns void language plpgsql security definer set search_path = '' as $$
begin
  delete from auth.users where id = auth.uid();
end; $$;
grant execute on function public.delete_my_studyforge_data() to authenticated;
