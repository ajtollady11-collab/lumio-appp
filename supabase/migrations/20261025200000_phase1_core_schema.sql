-- Lumio Phase 1 core schema.
--
-- Security model
-- * Every user-owned row carries user_id and row-level security limits access to
--   (select auth.uid()). Child tables reference their parent through a composite
--   (parent_id, user_id) foreign key, so a row can never be attached to another
--   user's parent even if a client sends someone else's id.
-- * Records a student must not be able to forge or erase (tutor messages and usage,
--   quiz scores) have no direct insert/update/delete grant. They are written only by
--   the SECURITY DEFINER functions at the end of this file, which check auth.uid().
-- * Supabase grants broad default privileges on public tables; this migration revokes
--   them and grants back only what each table needs.

-- ---------------------------------------------------------------------------
-- Shared helpers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 50),
  education_level text check (
    education_level in ('secondary', 'sixth_form_college', 'university', 'other')
  ),
  education_level_other text check (char_length(education_level_other) <= 60),
  goals text[] not null default '{}' check (
    cardinality(goals) <= 6
    and goals <@ array[
      'understand_topics', 'prepare_exams', 'improve_grades',
      'revision_routine', 'remember_more', 'stay_organised'
    ]::text[]
  ),
  learning_preference text check (
    learning_preference in ('step_by_step', 'examples', 'practice', 'visual', 'mixed')
  ),
  onboarding_step smallint not null default 0 check (onboarding_step between 0 and 6),
  onboarding_completed_at timestamptz,
  timezone text not null default 'Europe/London' check (char_length(timezone) between 1 and 64),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- A profile is created for every new auth user. Only the display name chosen at
-- sign-up is copied; nothing else from the auth record is duplicated.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_name text := nullif(btrim(new.raw_user_meta_data ->> 'display_name'), '');
begin
  insert into public.profiles (id, display_name)
  values (new.id, left(coalesce(requested_name, 'Student'), 50));
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Subjects and topics
-- ---------------------------------------------------------------------------
create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  level text check (char_length(level) <= 80),
  qualification text check (char_length(qualification) <= 80),
  exam_board text check (char_length(exam_board) <= 80),
  exam_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);
create unique index subjects_user_name_key on public.subjects (user_id, lower(btrim(name)));
create trigger subjects_set_updated_at before update on public.subjects
  for each row execute function public.set_updated_at();

create table public.topics (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null,
  user_id uuid not null default auth.uid(),
  name text not null check (char_length(btrim(name)) between 1 and 120),
  description text check (char_length(description) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (subject_id, user_id) references public.subjects (id, user_id) on delete cascade
);
create unique index topics_subject_name_key on public.topics (subject_id, lower(btrim(name)));
create index topics_user_id_idx on public.topics (user_id);
create trigger topics_set_updated_at before update on public.topics
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Study planner
-- ---------------------------------------------------------------------------
create table public.study_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  subject_id uuid,
  title text not null check (char_length(btrim(title)) between 1 and 120),
  description text check (char_length(description) <= 2000),
  scheduled_date date not null,
  start_time time,
  duration_minutes smallint check (duration_minutes between 5 and 600),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  status text not null default 'planned' check (status in ('planned', 'completed')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((status = 'completed') = (completed_at is not null)),
  foreign key (subject_id, user_id) references public.subjects (id, user_id)
    on delete set null (subject_id)
);
create index study_tasks_user_date_idx on public.study_tasks (user_id, scheduled_date);
create index study_tasks_subject_idx on public.study_tasks (subject_id);
create trigger study_tasks_set_updated_at before update on public.study_tasks
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- AI tutor
-- ---------------------------------------------------------------------------
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  subject_id uuid,
  title text not null check (char_length(title) between 1 and 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  foreign key (subject_id, user_id) references public.subjects (id, user_id)
    on delete set null (subject_id)
);
create index conversations_user_recent_idx on public.conversations (user_id, updated_at desc);
create trigger conversations_set_updated_at before update on public.conversations
  for each row execute function public.set_updated_at();

create table public.messages (
  id bigint generated always as identity primary key,
  conversation_id uuid not null,
  user_id uuid not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null check (char_length(content) between 1 and 20000),
  model text check (char_length(model) <= 100),
  input_tokens integer check (input_tokens >= 0),
  output_tokens integer check (output_tokens >= 0),
  created_at timestamptz not null default now(),
  check (role <> 'user' or char_length(content) <= 4000),
  foreign key (conversation_id, user_id) references public.conversations (id, user_id)
    on delete cascade
);
create index messages_conversation_order_idx on public.messages (conversation_id, id);
create index messages_user_id_idx on public.messages (user_id);

-- One row per tutor request, used for rate limiting and cost tracking.
-- Students can read their own rows but cannot create, change or delete them.
create table public.ai_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  conversation_id uuid references public.conversations (id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed')),
  model text check (char_length(model) <= 100),
  input_tokens integer check (input_tokens >= 0),
  output_tokens integer check (output_tokens >= 0),
  error_code text check (char_length(error_code) <= 64),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
create index ai_requests_user_recent_idx on public.ai_requests (user_id, created_at desc);
create index ai_requests_conversation_idx on public.ai_requests (conversation_id);

-- ---------------------------------------------------------------------------
-- Revision: flashcards
-- ---------------------------------------------------------------------------
create table public.flashcard_collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  subject_id uuid,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  foreign key (subject_id, user_id) references public.subjects (id, user_id)
    on delete set null (subject_id)
);
create index flashcard_collections_user_idx on public.flashcard_collections (user_id, updated_at desc);
create index flashcard_collections_subject_idx on public.flashcard_collections (subject_id);
create trigger flashcard_collections_set_updated_at before update on public.flashcard_collections
  for each row execute function public.set_updated_at();

create table public.flashcards (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null,
  user_id uuid not null default auth.uid(),
  front text not null check (char_length(btrim(front)) between 1 and 1000),
  back text not null check (char_length(btrim(back)) between 1 and 2000),
  topic text check (char_length(topic) <= 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  foreign key (collection_id, user_id) references public.flashcard_collections (id, user_id)
    on delete cascade
);
create index flashcards_collection_idx on public.flashcards (collection_id, created_at);
create index flashcards_user_idx on public.flashcards (user_id);
create trigger flashcards_set_updated_at before update on public.flashcards
  for each row execute function public.set_updated_at();

-- Append-only record of each card a student marked as remembered or not.
create table public.flashcard_reviews (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid(),
  flashcard_id uuid not null,
  remembered boolean not null,
  reviewed_at timestamptz not null default now(),
  foreign key (flashcard_id, user_id) references public.flashcards (id, user_id) on delete cascade
);
create index flashcard_reviews_user_time_idx on public.flashcard_reviews (user_id, reviewed_at desc);
create index flashcard_reviews_card_idx on public.flashcard_reviews (flashcard_id);

-- ---------------------------------------------------------------------------
-- Revision: quizzes
-- ---------------------------------------------------------------------------
create table public.quizzes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  subject_id uuid,
  title text not null check (char_length(btrim(title)) between 1 and 120),
  description text check (char_length(description) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  foreign key (subject_id, user_id) references public.subjects (id, user_id)
    on delete set null (subject_id)
);
create index quizzes_user_idx on public.quizzes (user_id, updated_at desc);
create index quizzes_subject_idx on public.quizzes (subject_id);
create trigger quizzes_set_updated_at before update on public.quizzes
  for each row execute function public.set_updated_at();

create table public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null,
  user_id uuid not null default auth.uid(),
  position smallint not null check (position between 1 and 50),
  prompt text not null check (char_length(btrim(prompt)) between 1 and 1000),
  options text[] not null check (cardinality(options) between 2 and 6),
  correct_option smallint not null check (correct_option >= 0),
  explanation text check (char_length(explanation) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (correct_option < cardinality(options)),
  unique (quiz_id, position) deferrable initially deferred,
  foreign key (quiz_id, user_id) references public.quizzes (id, user_id) on delete cascade
);
create index quiz_questions_user_idx on public.quiz_questions (user_id);
create trigger quiz_questions_set_updated_at before update on public.quiz_questions
  for each row execute function public.set_updated_at();

-- Each option must be 1–300 characters (array element checks need a function).
create or replace function public.quiz_options_valid(opts text[])
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(bool_and(char_length(btrim(o)) between 1 and 300), false)
  from unnest(opts) as o;
$$;
alter table public.quiz_questions
  add constraint quiz_questions_options_valid check (public.quiz_options_valid(options));

-- Attempts keep a title snapshot so history survives if the quiz is deleted.
create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  quiz_id uuid,
  quiz_title text not null,
  score smallint not null check (score >= 0),
  total smallint not null check (total > 0),
  results jsonb not null,
  completed_at timestamptz not null default now(),
  check (score <= total),
  foreign key (quiz_id, user_id) references public.quizzes (id, user_id)
    on delete set null (quiz_id)
);
create index quiz_attempts_user_time_idx on public.quiz_attempts (user_id, completed_at desc);
create index quiz_attempts_quiz_idx on public.quiz_attempts (quiz_id);

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.subjects enable row level security;
alter table public.topics enable row level security;
alter table public.study_tasks enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.ai_requests enable row level security;
alter table public.flashcard_collections enable row level security;
alter table public.flashcards enable row level security;
alter table public.flashcard_reviews enable row level security;
alter table public.quizzes enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_attempts enable row level security;

-- Owner-only policies. `(select auth.uid())` is evaluated once per statement.
create policy "Profiles: owner can read" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "Profiles: owner can update" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

do $$
declare
  t text;
begin
  foreach t in array array[
    'subjects', 'topics', 'study_tasks', 'flashcard_collections', 'flashcards',
    'quizzes', 'quiz_questions'
  ] loop
    execute format(
      'create policy "%1$s: owner can read" on public.%1$I for select to authenticated using (user_id = (select auth.uid()))', t);
    execute format(
      'create policy "%1$s: owner can insert" on public.%1$I for insert to authenticated with check (user_id = (select auth.uid()))', t);
    execute format(
      'create policy "%1$s: owner can update" on public.%1$I for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))', t);
    execute format(
      'create policy "%1$s: owner can delete" on public.%1$I for delete to authenticated using (user_id = (select auth.uid()))', t);
  end loop;
end;
$$;

create policy "Conversations: owner can read" on public.conversations
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Conversations: owner can rename" on public.conversations
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "Conversations: owner can delete" on public.conversations
  for delete to authenticated using (user_id = (select auth.uid()));

create policy "Messages: owner can read" on public.messages
  for select to authenticated using (user_id = (select auth.uid()));
create policy "AI requests: owner can read" on public.ai_requests
  for select to authenticated using (user_id = (select auth.uid()));

create policy "Flashcard reviews: owner can read" on public.flashcard_reviews
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Flashcard reviews: owner can record" on public.flashcard_reviews
  for insert to authenticated with check (user_id = (select auth.uid()));

create policy "Quiz attempts: owner can read" on public.quiz_attempts
  for select to authenticated using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Privileges: start from nothing, grant back the minimum
-- ---------------------------------------------------------------------------
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

grant select on public.profiles to authenticated;
grant update (
  display_name, education_level, education_level_other, goals, learning_preference,
  onboarding_step, onboarding_completed_at, timezone
) on public.profiles to authenticated;

grant select, insert, delete on
  public.subjects, public.topics, public.study_tasks, public.flashcard_collections,
  public.flashcards, public.quizzes, public.quiz_questions
  to authenticated;
grant update (name, level, qualification, exam_board, exam_date) on public.subjects to authenticated;
grant update (name, description) on public.topics to authenticated;
grant update (
  subject_id, title, description, scheduled_date, start_time, duration_minutes,
  priority, status, completed_at
) on public.study_tasks to authenticated;
grant update (subject_id, name) on public.flashcard_collections to authenticated;
grant update (front, back, topic) on public.flashcards to authenticated;
grant update (subject_id, title, description) on public.quizzes to authenticated;
grant update (position, prompt, options, correct_option, explanation) on public.quiz_questions to authenticated;

grant select, delete on public.conversations to authenticated;
grant update (title) on public.conversations to authenticated;
grant select on public.messages, public.ai_requests, public.quiz_attempts to authenticated;
grant select, insert on public.flashcard_reviews to authenticated;

-- ---------------------------------------------------------------------------
-- Functions callable by signed-in students
-- ---------------------------------------------------------------------------
create or replace function public.require_user()
returns uuid
language plpgsql
stable
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  return uid;
end;
$$;

-- Reserves one tutor request if the student is within their limits.
-- Limits are deliberately conservative until real usage is measured (spec §14.5).
create or replace function public.reserve_tutor_request()
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := public.require_user();
  short_window_count integer;
  daily_count integer;
  request_id uuid;
begin
  perform pg_advisory_xact_lock(hashtextextended(uid::text, 42));

  select
    count(*) filter (where created_at > now() - interval '10 minutes'),
    count(*)
  into short_window_count, daily_count
  from public.ai_requests
  where user_id = uid and created_at > now() - interval '24 hours';

  if short_window_count >= 20 then
    raise exception 'rate_limited_short' using errcode = 'P0001';
  end if;
  if daily_count >= 150 then
    raise exception 'rate_limited_daily' using errcode = 'P0001';
  end if;

  insert into public.ai_requests (user_id) values (uid) returning id into request_id;
  return request_id;
end;
$$;

-- Stores a completed exchange atomically: creates the conversation when needed,
-- appends the student's message and the tutor's reply, and closes the request.
-- Nothing is written for a failed request, so history is never left half-saved.
create or replace function public.complete_tutor_request(
  p_request_id uuid,
  p_user_content text,
  p_assistant_content text,
  p_model text,
  p_input_tokens integer,
  p_output_tokens integer,
  p_conversation_id uuid default null,
  p_subject_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := public.require_user();
  conversation uuid := p_conversation_id;
  derived_title text;
begin
  perform 1 from public.ai_requests
  where id = p_request_id and user_id = uid and status = 'pending'
  for update;
  if not found then
    raise exception 'request_not_found' using errcode = 'P0002';
  end if;

  if conversation is null then
    derived_title := left(regexp_replace(btrim(p_user_content), '\s+', ' ', 'g'), 80);
    insert into public.conversations (user_id, subject_id, title)
    values (uid, p_subject_id, coalesce(nullif(derived_title, ''), 'New conversation'))
    returning id into conversation;
  else
    perform 1 from public.conversations where id = conversation and user_id = uid for update;
    if not found then
      raise exception 'conversation_not_found' using errcode = 'P0002';
    end if;
    update public.conversations set updated_at = now() where id = conversation;
  end if;

  insert into public.messages (conversation_id, user_id, role, content)
  values (conversation, uid, 'user', p_user_content);
  insert into public.messages (conversation_id, user_id, role, content, model, input_tokens, output_tokens)
  values (conversation, uid, 'assistant', p_assistant_content, p_model, p_input_tokens, p_output_tokens);

  update public.ai_requests
  set status = 'completed', conversation_id = conversation, model = p_model,
      input_tokens = p_input_tokens, output_tokens = p_output_tokens, completed_at = now()
  where id = p_request_id;

  return conversation;
end;
$$;

create or replace function public.fail_tutor_request(p_request_id uuid, p_error_code text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := public.require_user();
begin
  update public.ai_requests
  set status = 'failed', error_code = left(p_error_code, 64), completed_at = now()
  where id = p_request_id and user_id = uid and status = 'pending';
end;
$$;

-- Scores a quiz against the stored answer key and records the attempt.
-- p_answers maps question id -> selected option index; unanswered counts as incorrect.
create or replace function public.submit_quiz_attempt(p_quiz_id uuid, p_answers jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := public.require_user();
  quiz_title text;
  results jsonb;
  correct_count integer;
  question_count integer;
  attempt_id uuid;
begin
  if p_answers is null or jsonb_typeof(p_answers) <> 'object' then
    raise exception 'invalid_answers' using errcode = '22023';
  end if;

  select title into quiz_title from public.quizzes where id = p_quiz_id and user_id = uid;
  if not found then
    raise exception 'quiz_not_found' using errcode = 'P0002';
  end if;

  with graded as (
    select
      q.id,
      q.position,
      q.prompt,
      q.options,
      q.correct_option,
      q.explanation,
      case
        when jsonb_typeof(p_answers -> q.id::text) = 'number'
          then (p_answers ->> q.id::text)::smallint
        else null
      end as selected
    from public.quiz_questions q
    where q.quiz_id = p_quiz_id
  )
  select
    coalesce(jsonb_agg(jsonb_build_object(
      'question_id', id,
      'prompt', prompt,
      'options', to_jsonb(options),
      'selected', selected,
      'correct_option', correct_option,
      'is_correct', coalesce(selected = correct_option, false),
      'explanation', explanation
    ) order by position), '[]'::jsonb),
    count(*) filter (where selected = correct_option),
    count(*)
  into results, correct_count, question_count
  from graded;

  if question_count = 0 then
    raise exception 'quiz_empty' using errcode = 'P0001';
  end if;

  insert into public.quiz_attempts (user_id, quiz_id, quiz_title, score, total, results)
  values (uid, p_quiz_id, quiz_title, correct_count, question_count, results)
  returning id into attempt_id;

  return jsonb_build_object(
    'attempt_id', attempt_id,
    'score', correct_count,
    'total', question_count,
    'results', results
  );
end;
$$;

-- Permanently deletes the signed-in student's account. Every table above
-- references auth.users with ON DELETE CASCADE, so all of their data goes with it.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := public.require_user();
begin
  delete from auth.users where id = uid;
end;
$$;

-- Activity totals for the progress dashboard, computed from stored records only.
create or replace function public.get_progress_summary(p_timezone text default 'UTC')
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  uid uuid := public.require_user();
  tz text := case
    when exists (select 1 from pg_catalog.pg_timezone_names where name = p_timezone) then p_timezone
    else 'UTC'
  end;
  today date := (now() at time zone tz)::date;
  result jsonb;
begin
  with days as (
    select generate_series(today - 13, today, interval '1 day')::date as day
  ),
  activity as (
    select (completed_at at time zone tz)::date as day, 'task' as kind
      from public.study_tasks where user_id = uid and completed_at is not null
    union all
    select (reviewed_at at time zone tz)::date, 'card'
      from public.flashcard_reviews where user_id = uid
    union all
    select (completed_at at time zone tz)::date, 'quiz'
      from public.quiz_attempts where user_id = uid
    union all
    select (completed_at at time zone tz)::date, 'tutor'
      from public.ai_requests where user_id = uid and status = 'completed'
  )
  select jsonb_build_object(
    'tasks_completed', (select count(*) from public.study_tasks where user_id = uid and status = 'completed'),
    'tasks_total', (select count(*) from public.study_tasks where user_id = uid),
    'minutes_completed', (select coalesce(sum(duration_minutes), 0) from public.study_tasks where user_id = uid and status = 'completed'),
    'cards_reviewed', (select count(*) from public.flashcard_reviews where user_id = uid),
    'cards_remembered', (select count(*) from public.flashcard_reviews where user_id = uid and remembered),
    'quizzes_completed', (select count(*) from public.quiz_attempts where user_id = uid),
    'quiz_questions_answered', (select coalesce(sum(total), 0) from public.quiz_attempts where user_id = uid),
    'quiz_questions_correct', (select coalesce(sum(score), 0) from public.quiz_attempts where user_id = uid),
    'tutor_questions', (select count(*) from public.ai_requests where user_id = uid and status = 'completed'),
    'subjects', (select count(*) from public.subjects where user_id = uid),
    'flashcards', (select count(*) from public.flashcards where user_id = uid),
    'today', today,
    'daily', (
      select jsonb_agg(jsonb_build_object(
        'day', d.day,
        'tasks', (select count(*) from activity a where a.day = d.day and a.kind = 'task'),
        'cards', (select count(*) from activity a where a.day = d.day and a.kind = 'card'),
        'quizzes', (select count(*) from activity a where a.day = d.day and a.kind = 'quiz'),
        'tutor', (select count(*) from activity a where a.day = d.day and a.kind = 'tutor')
      ) order by d.day)
      from days d
    )
  ) into result;
  return result;
end;
$$;

-- Per-subject activity for My Learning and the dashboard.
create or replace function public.get_subject_overview()
returns table (
  subject_id uuid,
  topics bigint,
  tasks_total bigint,
  tasks_completed bigint,
  flashcards bigint,
  quiz_attempts bigint,
  last_activity_at timestamptz
)
language sql
stable
set search_path = ''
as $$
  select
    s.id,
    (select count(*) from public.topics t where t.subject_id = s.id),
    (select count(*) from public.study_tasks st where st.subject_id = s.id),
    (select count(*) from public.study_tasks st where st.subject_id = s.id and st.status = 'completed'),
    (select count(*) from public.flashcards f
       join public.flashcard_collections c on c.id = f.collection_id
       where c.subject_id = s.id),
    (select count(*) from public.quiz_attempts qa
       join public.quizzes q on q.id = qa.quiz_id
       where q.subject_id = s.id),
    greatest(
      (select max(st.completed_at) from public.study_tasks st where st.subject_id = s.id),
      (select max(qa.completed_at) from public.quiz_attempts qa
         join public.quizzes q on q.id = qa.quiz_id where q.subject_id = s.id),
      (select max(c.updated_at) from public.conversations c where c.subject_id = s.id)
    )
  from public.subjects s
  where s.user_id = (select public.require_user());
$$;

revoke all on function
  public.set_updated_at(), public.handle_new_user(), public.require_user(),
  public.quiz_options_valid(text[]),
  public.reserve_tutor_request(), public.complete_tutor_request(uuid, text, text, text, integer, integer, uuid, uuid),
  public.fail_tutor_request(uuid, text), public.submit_quiz_attempt(uuid, jsonb),
  public.delete_my_account(), public.get_progress_summary(text), public.get_subject_overview()
  from public, anon, authenticated;

grant execute on function
  public.require_user(), public.quiz_options_valid(text[]),
  public.reserve_tutor_request(), public.complete_tutor_request(uuid, text, text, text, integer, integer, uuid, uuid),
  public.fail_tutor_request(uuid, text), public.submit_quiz_attempt(uuid, jsonb),
  public.delete_my_account(), public.get_progress_summary(text), public.get_subject_overview()
  to authenticated;
