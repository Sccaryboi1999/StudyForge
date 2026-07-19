-- The built-in networking demo lives in src/lib/demo.ts and needs no database.
-- This seed creates useful presets for the first existing auth user, if present.
do $$
declare uid uuid;
begin
  select id into uid from auth.users order by created_at limit 1;
  if uid is not null then
    insert into public.quiz_presets(user_id, name, settings_json) values
      (uid, 'Ten-question quick review', '{"questionCount":10,"difficulty":"mixed","mode":"practice","timerMinutes":0,"shuffleQuestions":true}'),
      (uid, 'Timed final exam practice', '{"questionCount":20,"difficulty":"hard","mode":"exam","timerMinutes":30,"shuffleQuestions":true}')
    on conflict do nothing;
  end if;
end $$;
