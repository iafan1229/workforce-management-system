insert into public.task_types (code, label)
values
  ('wash', '세척'),
  ('linehaul_unload', '간선하차'),
  ('signaler', '신호수'),
  ('feeding', '피딩'),
  ('sorting_mover', '소분_무버'),
  ('sorting_unload', '소분_하차'),
  ('sorting_load', '소분_적재'),
  ('sorting_reject', '소분_리젝'),
  ('sorting_overflow', '소분_오버플로우'),
  ('sorting_irregular', '소분_이형'),
  ('sorting_large', '소분_대분류'),
  ('sorting_small', '소분_소분류'),
  ('sorting_pb_support', '소분_PB지원'),
  ('unloading', '언로딩')
on conflict (code) do update set label = excluded.label;
