create extension if not exists pgcrypto;

create type public.app_role as enum (
  'student',
  'super_admin',
  'content_manager',
  'question_reviewer',
  'test_manager',
  'student_support'
);
create type public.document_status as enum ('queued', 'processing', 'needs_ocr', 'completed', 'failed');
create type public.review_status as enum ('pending', 'approved', 'rejected');
create type public.test_attempt_status as enum ('in_progress', 'submitted');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  education_level text,
  board text,
  exam_goal text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null default 'student',
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  primary key (user_id, role)
);

create table public.education_levels (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.education_boards (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  education_level_id uuid references public.education_levels(id) on delete set null,
  board_id uuid references public.education_boards(id) on delete set null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (name, education_level_id, board_id)
);

create table public.chapters (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects(id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (subject_id, name)
);

create table public.topics (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.chapters(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (chapter_id, name)
);

create table public.pdf_documents (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  storage_path text not null unique,
  file_size bigint not null check (file_size > 0 and file_size <= 26214400),
  status public.document_status not null default 'queued',
  uploaded_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.pdf_processing_jobs (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null unique references public.pdf_documents(id) on delete cascade,
  status public.document_status not null default 'queued',
  current_page integer not null default 0 check (current_page >= 0),
  total_pages integer check (total_pages is null or total_pages >= 0),
  retry_count integer not null default 0 check (retry_count >= 0),
  error_details text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.extracted_questions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.pdf_documents(id) on delete cascade,
  page_number integer check (page_number is null or page_number > 0),
  prompt text not null,
  question_type text not null default 'multiple_choice',
  options jsonb not null default '[]'::jsonb check (jsonb_typeof(options) = 'array'),
  answer_label text,
  explanation text,
  subject text,
  topic text,
  difficulty text check (difficulty is null or difficulty in ('easy', 'medium', 'hard')),
  extraction_confidence numeric(4,3) check (extraction_confidence is null or extraction_confidence between 0 and 1),
  source_fingerprint text not null unique,
  review_status public.review_status not null default 'pending',
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  prompt text not null,
  question_type text not null default 'multiple_choice',
  subject text,
  chapter text,
  topic text,
  difficulty text check (difficulty is null or difficulty in ('easy', 'medium', 'hard')),
  explanation text,
  source_document_id uuid references public.pdf_documents(id) on delete set null,
  source_page integer check (source_page is null or source_page > 0),
  content_fingerprint text not null unique,
  status text not null default 'approved' check (status in ('approved', 'archived')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  label text not null,
  content text not null,
  is_correct boolean not null default false,
  sort_order integer not null default 0,
  unique (question_id, label)
);

create table public.tests (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subject text not null,
  mode text not null check (mode in ('practice', 'exam')),
  duration_minutes integer check (duration_minutes is null or duration_minutes between 1 and 180),
  marks_per_question numeric(6,2) not null default 1,
  negative_marks numeric(6,2) not null default 0,
  generated_by uuid not null references auth.users(id),
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.test_questions (
  test_id uuid not null references public.tests(id) on delete cascade,
  question_id uuid not null references public.questions(id),
  position integer not null check (position > 0),
  primary key (test_id, question_id),
  unique (test_id, position)
);

create table public.test_attempts (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references public.tests(id),
  user_id uuid not null references auth.users(id) on delete cascade,
  status public.test_attempt_status not null default 'in_progress',
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  score numeric(8,2),
  max_score numeric(8,2) not null,
  correct_count integer,
  incorrect_count integer,
  unanswered_count integer,
  unique (id, user_id),
  check ((status = 'in_progress' and submitted_at is null) or (status = 'submitted' and submitted_at is not null))
);

create table public.student_answers (
  attempt_id uuid not null references public.test_attempts(id) on delete cascade,
  question_id uuid not null references public.questions(id),
  option_id uuid not null references public.question_options(id),
  updated_at timestamptz not null default now(),
  primary key (attempt_id, question_id)
);

create table public.saved_questions (
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, question_id)
);

create table public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.api_rate_limits (
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  window_start timestamptz not null,
  request_count integer not null check (request_count > 0),
  primary key (user_id, action)
);

create index profiles_education_level_idx on public.profiles (education_level);
create index subjects_active_idx on public.subjects (active, name);
create index chapters_subject_idx on public.chapters (subject_id, sort_order);
create index topics_chapter_idx on public.topics (chapter_id);
create index pdf_documents_uploader_idx on public.pdf_documents (uploaded_by, created_at desc);
create index pdf_jobs_status_idx on public.pdf_processing_jobs (status, updated_at);
create index extracted_review_idx on public.extracted_questions (review_status, created_at desc);
create index extracted_source_idx on public.extracted_questions (document_id, page_number);
create index extracted_source_fingerprint_idx on public.extracted_questions (source_fingerprint);
create index questions_subject_difficulty_idx on public.questions (lower(subject), difficulty) where status = 'approved';
create index question_options_question_idx on public.question_options (question_id, sort_order);
create index test_attempts_user_idx on public.test_attempts (user_id, submitted_at desc);
create index student_answers_attempt_idx on public.student_answers (attempt_id);

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();
create trigger pdf_documents_touch before update on public.pdf_documents for each row execute function public.touch_updated_at();
create trigger pdf_jobs_touch before update on public.pdf_processing_jobs for each row execute function public.touch_updated_at();
create trigger extracted_questions_touch before update on public.extracted_questions for each row execute function public.touch_updated_at();
create trigger questions_touch before update on public.questions for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  ) on conflict (id) do nothing;
  insert into public.user_roles (user_id, role) values (new.id, 'student') on conflict do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid()
      and role in ('super_admin', 'content_manager', 'question_reviewer', 'test_manager', 'student_support')
  );
$$;

create or replace function public.is_super_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = 'super_admin'
  );
$$;

create or replace function public.can_manage_documents()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role in ('super_admin', 'content_manager')
  );
$$;

create or replace function public.can_review_questions()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role in ('super_admin', 'content_manager', 'question_reviewer')
  );
$$;

create or replace function public.can_manage_tests()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role in ('super_admin', 'test_manager')
  );
$$;

create or replace function public.write_admin_audit(
  p_action text, p_entity_type text, p_entity_id uuid, p_details jsonb default '{}'::jsonb
)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null then
    insert into public.admin_audit_logs(actor_id, action, entity_type, entity_id, details)
    values (auth.uid(), p_action, p_entity_type, p_entity_id, coalesce(p_details, '{}'::jsonb));
  end if;
end;
$$;

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.education_levels enable row level security;
alter table public.education_boards enable row level security;
alter table public.subjects enable row level security;
alter table public.chapters enable row level security;
alter table public.topics enable row level security;
alter table public.pdf_documents enable row level security;
alter table public.pdf_processing_jobs enable row level security;
alter table public.extracted_questions enable row level security;
alter table public.questions enable row level security;
alter table public.question_options enable row level security;
alter table public.tests enable row level security;
alter table public.test_questions enable row level security;
alter table public.test_attempts enable row level security;
alter table public.student_answers enable row level security;
alter table public.saved_questions enable row level security;
alter table public.admin_audit_logs enable row level security;
alter table public.api_rate_limits enable row level security;

create policy "Profiles are visible to their owner and admins" on public.profiles
for select to authenticated using (id = auth.uid() or public.is_admin());
create policy "Learners can create their own profile" on public.profiles
for insert to authenticated with check (id = auth.uid());
create policy "Learners can update their own profile" on public.profiles
for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "Admins can manage profiles" on public.profiles
for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "Users can view their own roles; admins can view all" on public.user_roles
for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "Only super admins can assign roles" on public.user_roles
for insert to authenticated with check (public.is_super_admin());
create policy "Only super admins can change roles" on public.user_roles
for update to authenticated using (public.is_super_admin()) with check (public.is_super_admin());
create policy "Only super admins can remove roles" on public.user_roles
for delete to authenticated using (public.is_super_admin());

create policy "Active education levels are public" on public.education_levels
for select to anon, authenticated using (active or public.is_admin());
create policy "Admins manage education levels" on public.education_levels
for all to authenticated using (public.can_manage_documents()) with check (public.can_manage_documents());
create policy "Active boards are public" on public.education_boards
for select to anon, authenticated using (active or public.is_admin());
create policy "Admins manage boards" on public.education_boards
for all to authenticated using (public.can_manage_documents()) with check (public.can_manage_documents());
create policy "Active subjects are public" on public.subjects
for select to anon, authenticated using (active or public.is_admin());
create policy "Admins manage subjects" on public.subjects
for all to authenticated using (public.can_manage_documents()) with check (public.can_manage_documents());
create policy "Chapters are visible to signed-in users" on public.chapters
for select to authenticated using (true);
create policy "Admins manage chapters" on public.chapters
for all to authenticated using (public.can_manage_documents()) with check (public.can_manage_documents());
create policy "Topics are visible to signed-in users" on public.topics
for select to authenticated using (true);
create policy "Admins manage topics" on public.topics
for all to authenticated using (public.can_manage_documents()) with check (public.can_manage_documents());

create policy "Admins can view source PDFs" on public.pdf_documents
for select to authenticated using (public.is_admin());
create policy "Admins can upload source PDFs" on public.pdf_documents
for insert to authenticated with check (public.can_manage_documents() and uploaded_by = auth.uid());
create policy "Admins can update source PDFs" on public.pdf_documents
for update to authenticated using (public.can_manage_documents()) with check (public.can_manage_documents());
create policy "Admins can delete source PDFs" on public.pdf_documents
for delete to authenticated using (public.can_manage_documents());
create policy "Admins manage processing jobs" on public.pdf_processing_jobs
for all to authenticated using (public.can_manage_documents()) with check (public.can_manage_documents());
create policy "Admins view extracted questions" on public.extracted_questions
for select to authenticated using (public.is_admin());
create policy "Reviewers manage extracted questions" on public.extracted_questions
for all to authenticated using (public.can_review_questions()) with check (public.can_review_questions());

-- Answer keys and options are never directly selectable by students. Student question
-- delivery and scoring use narrowly scoped security-definer functions below.
create policy "Authorized admins view questions" on public.questions
for select to authenticated using (public.can_review_questions() or public.can_manage_tests());
create policy "Reviewers manage questions" on public.questions
for all to authenticated using (public.can_review_questions()) with check (public.can_review_questions());
create policy "Authorized admins view question options" on public.question_options
for select to authenticated using (public.can_review_questions() or public.can_manage_tests());
create policy "Reviewers manage question options" on public.question_options
for all to authenticated using (public.can_review_questions()) with check (public.can_review_questions());
create policy "Admins manage tests" on public.tests
for all to authenticated using (public.can_manage_tests()) with check (public.can_manage_tests());
create policy "Admins manage test questions" on public.test_questions
for all to authenticated using (public.can_manage_tests()) with check (public.can_manage_tests());
create policy "Learners can read their own attempts" on public.test_attempts
for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "Learners can read their own answers" on public.student_answers
for select to authenticated using (exists (
  select 1 from public.test_attempts a where a.id = attempt_id and a.user_id = auth.uid()
) or public.is_admin());
create policy "Learners view their saved questions" on public.saved_questions
for select to authenticated using (user_id = auth.uid());
create policy "Learners remove their saved questions" on public.saved_questions
for delete to authenticated using (user_id = auth.uid());
create policy "Only admins can read audit logs" on public.admin_audit_logs
for select to authenticated using (public.is_admin());

create or replace function public.consume_api_rate_limit(p_action text)
returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_user_id uuid := auth.uid();
  v_limit integer;
  v_window_seconds integer;
  v_window_start timestamptz;
  v_request_count integer;
begin
  if v_user_id is null then return false; end if;
  case p_action
    when 'test_generate' then v_limit := 10; v_window_seconds := 60;
    when 'answer_save' then v_limit := 180; v_window_seconds := 60;
    when 'test_submit' then v_limit := 15; v_window_seconds := 60;
    when 'question_save' then v_limit := 30; v_window_seconds := 60;
    when 'profile_update' then v_limit := 20; v_window_seconds := 3600;
    when 'pdf_upload' then v_limit := 20; v_window_seconds := 3600;
    when 'pdf_process' then v_limit := 30; v_window_seconds := 3600;
    when 'pdf_delete' then v_limit := 10; v_window_seconds := 3600;
    when 'question_review' then v_limit := 100; v_window_seconds := 3600;
    when 'education_change' then v_limit := 50; v_window_seconds := 3600;
    when 'pdf_preview' then v_limit := 60; v_window_seconds := 60;
    else return false;
  end case;

  v_window_start := to_timestamp(
    floor(extract(epoch from clock_timestamp()) / v_window_seconds) * v_window_seconds
  );
  insert into public.api_rate_limits(user_id, action, window_start, request_count)
  values (v_user_id, p_action, v_window_start, 1)
  on conflict (user_id, action) do update set
    request_count = case
      when public.api_rate_limits.window_start = excluded.window_start
        then public.api_rate_limits.request_count + 1
      else 1
    end,
    window_start = excluded.window_start
  returning request_count into v_request_count;
  return v_request_count <= v_limit;
end;
$$;

create or replace function public.generate_test_attempt(
  p_subject text,
  p_question_count integer,
  p_duration_minutes integer,
  p_difficulty text,
  p_mode text
)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_user_id uuid := auth.uid();
  v_test_id uuid;
  v_attempt_id uuid;
  v_available integer;
begin
  if v_user_id is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_question_count < 1 or p_question_count > 100 then raise exception 'INVALID_QUESTION_COUNT'; end if;
  if p_duration_minutes < 0 or p_duration_minutes > 180 then raise exception 'INVALID_DURATION'; end if;
  if p_difficulty not in ('any', 'easy', 'medium', 'hard') then raise exception 'INVALID_DIFFICULTY'; end if;
  if p_mode not in ('practice', 'exam') then raise exception 'INVALID_MODE'; end if;

  select count(*) into v_available
  from public.questions q
  where q.status = 'approved'
    and lower(q.subject) = lower(trim(p_subject))
    and (p_difficulty = 'any' or q.difficulty = p_difficulty)
    and q.question_type = 'multiple_choice'
    and exists (select 1 from public.question_options o where o.question_id = q.id and o.is_correct);

  if v_available < p_question_count then raise exception 'INSUFFICIENT_QUESTIONS'; end if;

  insert into public.tests(title, subject, mode, duration_minutes, generated_by)
  values ('Practice: ' || trim(p_subject), trim(p_subject), p_mode,
    nullif(p_duration_minutes, 0), v_user_id)
  returning id into v_test_id;

  insert into public.test_questions(test_id, question_id, position)
  select v_test_id, chosen.id, row_number() over ()
  from (
    select q.id from public.questions q
    where q.status = 'approved'
      and lower(q.subject) = lower(trim(p_subject))
      and (p_difficulty = 'any' or q.difficulty = p_difficulty)
      and q.question_type = 'multiple_choice'
      and exists (select 1 from public.question_options o where o.question_id = q.id and o.is_correct)
    order by random()
    limit p_question_count
  ) chosen;

  insert into public.test_attempts(test_id, user_id, max_score)
  values (v_test_id, v_user_id, p_question_count)
  returning id into v_attempt_id;
  return v_attempt_id;
end;
$$;

create or replace function public.get_attempt_for_student(p_attempt_id uuid)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_user_id uuid := auth.uid();
  v_result jsonb;
begin
  select jsonb_build_object(
    'attempt', jsonb_build_object(
      'id', a.id,
      'duration_minutes', t.duration_minutes,
      'started_at', a.started_at,
      'status', a.status
    ),
    'questions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', q.id,
        'prompt', q.prompt,
        'options', (
          select coalesce(jsonb_agg(jsonb_build_object(
            'id', o.id, 'label', o.label, 'content', o.content
          ) order by o.sort_order), '[]'::jsonb)
          from public.question_options o where o.question_id = q.id
        )
      ) order by tq.position)
      from public.test_questions tq
      join public.questions q on q.id = tq.question_id
      where tq.test_id = t.id
    ), '[]'::jsonb),
    'answers', coalesce((
      select jsonb_object_agg(sa.question_id::text, sa.option_id::text)
      from public.student_answers sa where sa.attempt_id = a.id
    ), '{}'::jsonb)
  ) into v_result
  from public.test_attempts a
  join public.tests t on t.id = a.test_id
  where a.id = p_attempt_id and a.user_id = v_user_id and a.status = 'in_progress';

  if v_result is null then raise exception 'ATTEMPT_NOT_FOUND_OR_SUBMITTED'; end if;
  return v_result;
end;
$$;

create or replace function public.save_attempt_answer(
  p_attempt_id uuid, p_question_id uuid, p_option_id uuid
)
returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then raise exception 'AUTH_REQUIRED'; end if;
  perform 1 from public.test_attempts a
  join public.tests t on t.id = a.test_id
  where a.id = p_attempt_id and a.user_id = v_user_id and a.status = 'in_progress'
    and (t.duration_minutes is null or a.started_at + make_interval(mins => t.duration_minutes) > now())
  for update of a;
  if not found then raise exception 'INVALID_OR_CLOSED_ATTEMPT'; end if;
  if not exists (
    select 1 from public.test_questions tq
    join public.question_options o on o.question_id = tq.question_id
    where tq.test_id = (select test_id from public.test_attempts where id = p_attempt_id)
      and tq.question_id = p_question_id and o.id = p_option_id
  ) then raise exception 'INVALID_ANSWER_OPTION'; end if;
  insert into public.student_answers(attempt_id, question_id, option_id)
  values (p_attempt_id, p_question_id, p_option_id)
  on conflict (attempt_id, question_id) do update
  set option_id = excluded.option_id, updated_at = now();
  return true;
end;
$$;

create or replace function public.submit_test_attempt(p_attempt_id uuid)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_user_id uuid := auth.uid();
  v_attempt public.test_attempts%rowtype;
  v_total integer;
  v_correct integer;
  v_answered integer;
  v_score numeric(8,2);
begin
  if v_user_id is null then raise exception 'AUTH_REQUIRED'; end if;
  select * into v_attempt from public.test_attempts
  where id = p_attempt_id and user_id = v_user_id
  for update;
  if not found then raise exception 'ATTEMPT_NOT_FOUND'; end if;
  if v_attempt.status = 'submitted' then
    return jsonb_build_object(
      'score', v_attempt.score, 'max_score', v_attempt.max_score,
      'correct_count', v_attempt.correct_count, 'incorrect_count', v_attempt.incorrect_count,
      'unanswered_count', v_attempt.unanswered_count
    );
  end if;

  select count(*) into v_total from public.test_questions tq
  where tq.test_id = v_attempt.test_id;
  select count(*) into v_answered
  from public.student_answers sa
  join public.test_questions tq on tq.test_id = v_attempt.test_id and tq.question_id = sa.question_id
  where sa.attempt_id = p_attempt_id;
  select count(*) into v_correct
  from public.student_answers sa
  join public.question_options o on o.id = sa.option_id
  where sa.attempt_id = p_attempt_id and o.is_correct;
  v_score := v_correct;

  update public.test_attempts set
    status = 'submitted',
    submitted_at = now(),
    score = v_score,
    max_score = v_total,
    correct_count = v_correct,
    incorrect_count = greatest(v_answered - v_correct, 0),
    unanswered_count = greatest(v_total - v_answered, 0)
  where id = p_attempt_id;

  return jsonb_build_object(
    'score', v_score, 'max_score', v_total, 'correct_count', v_correct,
    'incorrect_count', greatest(v_answered - v_correct, 0),
    'unanswered_count', greatest(v_total - v_answered, 0)
  );
end;
$$;

create or replace function public.get_attempt_result(p_attempt_id uuid)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_result jsonb;
begin
  select jsonb_build_object(
    'score', a.score,
    'max_score', a.max_score,
    'correct_count', a.correct_count,
    'incorrect_count', a.incorrect_count,
    'unanswered_count', a.unanswered_count,
    'submitted_at', a.submitted_at,
    'questions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'prompt', q.prompt,
        'explanation', q.explanation,
        'source_document_id', q.source_document_id,
        'source_page', q.source_page,
        'student_option_id', sa.option_id,
        'options', (
          select coalesce(jsonb_agg(jsonb_build_object(
            'id', o.id, 'label', o.label, 'content', o.content, 'is_correct', o.is_correct
          ) order by o.sort_order), '[]'::jsonb)
          from public.question_options o where o.question_id = q.id
        )
      ) order by tq.position)
      from public.test_questions tq
      join public.questions q on q.id = tq.question_id
      left join public.student_answers sa on sa.attempt_id = a.id and sa.question_id = q.id
      where tq.test_id = a.test_id
    ), '[]'::jsonb)
  ) into v_result
  from public.test_attempts a
  where a.id = p_attempt_id and a.user_id = auth.uid() and a.status = 'submitted';
  if v_result is null then raise exception 'RESULT_NOT_FOUND'; end if;
  return v_result;
end;
$$;

create or replace function public.save_question_for_later(p_attempt_id uuid, p_question_id uuid)
returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if auth.uid() is null or not exists (
    select 1 from public.test_attempts a
    join public.test_questions tq on tq.test_id = a.test_id
    where a.id = p_attempt_id and a.user_id = auth.uid() and tq.question_id = p_question_id
  ) then raise exception 'QUESTION_NOT_IN_OWN_ATTEMPT'; end if;
  insert into public.saved_questions(user_id, question_id)
  values (auth.uid(), p_question_id)
  on conflict (user_id, question_id) do nothing;
  return true;
end;
$$;

create or replace function public.get_saved_questions()
returns jsonb language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'question_id', q.id,
    'prompt', q.prompt,
    'subject', q.subject,
    'chapter', q.chapter,
    'topic', q.topic,
    'created_at', sq.created_at
  ) order by sq.created_at desc), '[]'::jsonb)
  from public.saved_questions sq
  join public.questions q on q.id = sq.question_id
  where sq.user_id = auth.uid() and q.status = 'approved';
$$;

create or replace function public.get_my_attempts()
returns jsonb language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', a.id,
    'status', a.status,
    'started_at', a.started_at,
    'submitted_at', a.submitted_at,
    'score', a.score,
    'max_score', a.max_score,
    'title', t.title,
    'subject', t.subject
  ) order by a.started_at desc), '[]'::jsonb)
  from public.test_attempts a
  join public.tests t on t.id = a.test_id
  where a.user_id = auth.uid();
$$;

create or replace function public.get_my_learning_stats()
returns jsonb language sql stable security definer set search_path = public, pg_temp as $$
  with attempts as (
    select * from public.test_attempts
    where user_id = auth.uid() and status = 'submitted'
  )
  select jsonb_build_object(
    'tests_completed', count(*),
    'questions_solved', coalesce(sum(correct_count + incorrect_count), 0),
    'correct_answers', coalesce(sum(correct_count), 0),
    'accuracy', case when coalesce(sum(correct_count + incorrect_count), 0) = 0 then null
      else round(sum(correct_count)::numeric * 100 / sum(correct_count + incorrect_count), 1) end,
    'average_score', round(avg(score), 1),
    'best_score', max(score),
    'study_time_seconds', coalesce(sum(extract(epoch from (submitted_at - started_at))), 0)
  )
  from attempts;
$$;

create or replace function public.get_my_performance()
returns jsonb language sql stable security definer set search_path = public, pg_temp as $$
  with days as (
    select generate_series((current_date - 6)::timestamp, current_date::timestamp, interval '1 day')::date as day
  ),
  weekly as (
    select d.day,
      count(a.id)::integer as tests,
      round(avg(a.score * 100 / nullif(a.max_score, 0)), 1) as average_percentage
    from days d
    left join public.test_attempts a on a.user_id = auth.uid()
      and a.status = 'submitted' and a.submitted_at::date = d.day
    group by d.day
  ),
  subjects as (
    select t.subject,
      count(a.id)::integer as attempts,
      round(avg(a.score * 100 / nullif(a.max_score, 0)), 1) as average_percentage
    from public.test_attempts a
    join public.tests t on t.id = a.test_id
    where a.user_id = auth.uid() and a.status = 'submitted'
    group by t.subject
  )
  select jsonb_build_object(
    'weekly', coalesce((select jsonb_agg(jsonb_build_object(
      'day', to_char(day, 'Dy'), 'tests', tests, 'average_percentage', average_percentage
    ) order by day) from weekly), '[]'::jsonb),
    'subjects', coalesce((select jsonb_agg(jsonb_build_object(
      'subject', subject, 'attempts', attempts, 'average_percentage', average_percentage
    ) order by attempts desc) from subjects), '[]'::jsonb)
  );
$$;

create or replace function public.review_extracted_question(
  p_question_id uuid,
  p_action text,
  p_prompt text default null,
  p_options jsonb default null,
  p_answer_label text default null,
  p_explanation text default null,
  p_subject text default null,
  p_topic text default null
)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_reviewer uuid := auth.uid();
  v_extracted public.extracted_questions%rowtype;
  v_question_id uuid;
  v_fingerprint text;
  v_option jsonb;
begin
  if v_reviewer is null or not public.can_review_questions() then raise exception 'QUESTION_REVIEW_ACCESS_REQUIRED'; end if;
  if p_action not in ('approve', 'reject') then raise exception 'INVALID_REVIEW_ACTION'; end if;
  select * into v_extracted from public.extracted_questions
  where id = p_question_id for update;
  if not found then raise exception 'QUESTION_NOT_FOUND'; end if;
  if v_extracted.review_status <> 'pending' then raise exception 'QUESTION_ALREADY_REVIEWED'; end if;

  if p_action = 'reject' then
    update public.extracted_questions set review_status = 'rejected',
      reviewed_by = v_reviewer, reviewed_at = now()
    where id = p_question_id;
    perform public.write_admin_audit('reject', 'extracted_question', p_question_id, '{}'::jsonb);
    return p_question_id;
  end if;

  update public.extracted_questions set
    prompt = coalesce(p_prompt, prompt),
    options = coalesce(p_options, options),
    answer_label = p_answer_label,
    explanation = p_explanation,
    subject = p_subject,
    topic = p_topic
  where id = p_question_id
  returning * into v_extracted;
  if v_extracted.answer_label is not null and not exists (
    select 1 from jsonb_array_elements(v_extracted.options) as entries(value)
    where upper(entries.value ->> 'label') = upper(v_extracted.answer_label)
  ) then raise exception 'ANSWER_NOT_IN_OPTIONS'; end if;

  v_fingerprint := md5(lower(regexp_replace(trim(v_extracted.prompt), '\s+', ' ', 'g')));
  insert into public.questions(
    prompt, question_type, subject, topic, difficulty, explanation, source_document_id, source_page,
    content_fingerprint, created_by
  ) values (
    trim(v_extracted.prompt), v_extracted.question_type, v_extracted.subject,
    v_extracted.topic, v_extracted.difficulty, v_extracted.explanation, v_extracted.document_id, v_extracted.page_number,
    v_fingerprint, v_reviewer
  ) on conflict (content_fingerprint) do update
    set source_document_id = coalesce(public.questions.source_document_id, excluded.source_document_id)
  returning id into v_question_id;

  if not exists (select 1 from public.question_options where question_id = v_question_id) then
    for v_option in select value from jsonb_array_elements(v_extracted.options)
    loop
      insert into public.question_options(question_id, label, content, is_correct, sort_order)
      values (
        v_question_id,
        left(coalesce(v_option ->> 'label', ''), 20),
        coalesce(v_option ->> 'content', ''),
        v_extracted.answer_label is not null
          and upper(coalesce(v_option ->> 'label', '')) = upper(v_extracted.answer_label),
        coalesce((v_option ->> 'sort_order')::integer, 0)
      ) on conflict (question_id, label) do nothing;
    end loop;
  end if;

  update public.extracted_questions set review_status = 'approved',
    reviewed_by = v_reviewer, reviewed_at = now()
  where id = p_question_id;
  perform public.write_admin_audit('approve', 'extracted_question', p_question_id,
    jsonb_build_object('question_id', v_question_id));
  return v_question_id;
end;
$$;

revoke all on function public.generate_test_attempt(text, integer, integer, text, text) from public, anon;
revoke all on function public.get_attempt_for_student(uuid) from public, anon;
revoke all on function public.save_attempt_answer(uuid, uuid, uuid) from public, anon;
revoke all on function public.submit_test_attempt(uuid) from public, anon;
revoke all on function public.get_attempt_result(uuid) from public, anon;
revoke all on function public.save_question_for_later(uuid, uuid) from public, anon;
revoke all on function public.get_saved_questions() from public, anon;
revoke all on function public.get_my_attempts() from public, anon;
revoke all on function public.get_my_learning_stats() from public, anon;
revoke all on function public.get_my_performance() from public, anon;
revoke all on function public.consume_api_rate_limit(text) from public, anon;
revoke all on function public.write_admin_audit(text, text, uuid, jsonb) from public, anon, authenticated;
revoke all on function public.review_extracted_question(uuid, text, text, jsonb, text, text, text, text) from public, anon;
grant execute on function public.generate_test_attempt(text, integer, integer, text, text) to authenticated;
grant execute on function public.get_attempt_for_student(uuid) to authenticated;
grant execute on function public.save_attempt_answer(uuid, uuid, uuid) to authenticated;
grant execute on function public.submit_test_attempt(uuid) to authenticated;
grant execute on function public.get_attempt_result(uuid) to authenticated;
grant execute on function public.save_question_for_later(uuid, uuid) to authenticated;
grant execute on function public.get_saved_questions() to authenticated;
grant execute on function public.get_my_attempts() to authenticated;
grant execute on function public.get_my_learning_stats() to authenticated;
grant execute on function public.get_my_performance() to authenticated;
grant execute on function public.consume_api_rate_limit(text) to authenticated;
grant execute on function public.review_extracted_question(uuid, text, text, jsonb, text, text, text, text) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('pdf-documents', 'pdf-documents', false, 26214400, array['application/pdf']),
  ('question-images', 'question-images', false, 10485760, array['image/png', 'image/jpeg', 'image/webp']),
  ('student-uploads', 'student-uploads', false, 10485760, array['image/png', 'image/jpeg', 'application/pdf']),
  ('result-reports', 'result-reports', false, 10485760, array['application/pdf'])
on conflict (id) do update set public = false;

create policy "Admins read private PDF documents" on storage.objects
for select to authenticated using (bucket_id = 'pdf-documents' and (public.can_manage_documents() or public.can_review_questions()));
create policy "Admins upload private PDF documents" on storage.objects
for insert to authenticated with check (bucket_id = 'pdf-documents' and public.can_manage_documents());
create policy "Admins update private PDF documents" on storage.objects
for update to authenticated using (bucket_id = 'pdf-documents' and public.can_manage_documents())
with check (bucket_id = 'pdf-documents' and public.can_manage_documents());
create policy "Admins delete private PDF documents" on storage.objects
for delete to authenticated using (bucket_id = 'pdf-documents' and public.can_manage_documents());
create policy "Admins manage question images" on storage.objects
for all to authenticated using (bucket_id = 'question-images' and public.can_review_questions())
with check (bucket_id = 'question-images' and public.can_review_questions());
create policy "Owners access student uploads" on storage.objects
for all to authenticated using (bucket_id = 'student-uploads' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'student-uploads' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Owners access result reports" on storage.objects
for all to authenticated using (bucket_id = 'result-reports' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'result-reports' and (storage.foldername(name))[1] = auth.uid()::text);
