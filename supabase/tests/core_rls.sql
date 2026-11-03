-- Run against a disposable local Supabase database: psql -v ON_ERROR_STOP=1 -f supabase/tests/core_rls.sql
begin;

insert into auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,created_at,updated_at)
values
 ('00000000-0000-0000-0000-000000000000','10000000-0000-0000-0000-000000000001','authenticated','authenticated','participant-a@example.test','',now(),now(),now()),
 ('00000000-0000-0000-0000-000000000000','10000000-0000-0000-0000-000000000002','authenticated','authenticated','mediator-a@example.test','',now(),now(),now()),
 ('00000000-0000-0000-0000-000000000000','10000000-0000-0000-0000-000000000003','authenticated','authenticated','participant-b@example.test','',now(),now(),now()),
 ('00000000-0000-0000-0000-000000000000','10000000-0000-0000-0000-000000000004','authenticated','authenticated','mediator-b@example.test','',now(),now(),now()),
 ('00000000-0000-0000-0000-000000000000','10000000-0000-0000-0000-000000000005','authenticated','authenticated','visitor@example.test','',now(),now(),now()),
 ('00000000-0000-0000-0000-000000000000','10000000-0000-0000-0000-000000000006','authenticated','authenticated','visitor-two@example.test','',now(),now(),now());

insert into public.spaces(id,title,created_by) values
 ('20000000-0000-0000-0000-000000000001','Grupo A','10000000-0000-0000-0000-000000000002'),
 ('20000000-0000-0000-0000-000000000002','Grupo B','10000000-0000-0000-0000-000000000004');
insert into public.space_memberships(space_id,user_id,role,display_name) values
 ('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','participant','Ana'),
 ('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000002','mediator','Marina'),
 ('20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000003','participant','Bia'),
 ('20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000004','mediator','Caio');
insert into public.debates(id,space_id,question,context,status,created_by) values
 ('30000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','Pergunta A?','Contexto A','open','10000000-0000-0000-0000-000000000002'),
 ('30000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000002','Pergunta B?','Contexto B','open','10000000-0000-0000-0000-000000000004'),
 ('30000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000001','Rascunho A','','draft','10000000-0000-0000-0000-000000000002');
insert into public.positions(id,debate_id,author_user_id,stance,rationale,visibility) values
 ('40000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000002','favoravel','Visível A','visible'),
 ('40000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','em_parte','Oculta A','hidden'),
 ('40000000-0000-0000-0000-000000000003','30000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000003','contrario','Visível B','visible');
insert into public.replies(id,debate_id,position_id,author_user_id,kind,body) values
 ('50000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','question','Pergunta A'),
 ('50000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000002','40000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000004','reply','Resposta B');
insert into public.agreements(position_id,user_id) values ('40000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001');
insert into public.reports(id,debate_id,reporter_user_id,target_type,target_id,reason) values
 ('60000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','position','40000000-0000-0000-0000-000000000001','personal_attack'),
 ('60000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000003','reply','50000000-0000-0000-0000-000000000002','spam_other');

set role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000001',true);
do $$ begin
  if (select count(*) from public.spaces) <> 1 then raise exception 'participant A must see only space A'; end if;
  if (select count(*) from public.space_memberships) <> 2 then raise exception 'participant A must see only A members'; end if;
  if (select count(*) from public.debates) <> 1 then raise exception 'participant A must not see B or draft A'; end if;
  if (select count(*) from public.positions) <> 2 then raise exception 'participant A sees own hidden and visible A'; end if;
  if (select count(*) from public.replies) <> 1 then raise exception 'participant A sees only A replies'; end if;
  if (select count(*) from public.agreements) <> 1 then raise exception 'participant A sees own agreement'; end if;
  if (select count(*) from public.reports) <> 1 then raise exception 'participant A sees own report only'; end if;
  if (select count(*) from public.moderation_actions) <> 0 then raise exception 'participant A sees moderation audit'; end if;
  if (select count(*) from public.invitations) <> 0 then raise exception 'participant A must not see invitations'; end if;
  if has_table_privilege('authenticated','public.positions','INSERT') then raise exception 'client insert grant leaked'; end if;
  if has_function_privilege('authenticated','public.redeem_invite(uuid,text,text)','EXECUTE') then raise exception 'client RPC grant leaked'; end if;
  if has_function_privilege('authenticated','public.update_member_name(uuid,uuid,text)','EXECUTE') then raise exception 'profile RPC grant leaked'; end if;
  if has_table_privilege('authenticated','public.member_profiles','INSERT,UPDATE,DELETE') then raise exception 'profile write grant leaked'; end if;
  if has_function_privilege('authenticated','public.restore_report(uuid,uuid,text,integer)','EXECUTE') then raise exception 'restore RPC grant leaked'; end if;
end $$;
reset role;

set role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000002',true);
do $$ begin
  if (select count(*) from public.positions) <> 2 then raise exception 'mediator A must not see B'; end if;
  if (select count(*) from public.debates) <> 2 then raise exception 'mediator A sees own draft'; end if;
  if (select count(*) from public.reports) <> 1 then raise exception 'mediator A sees another group report'; end if;
end $$;
reset role;

set role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000003',true);
do $$ begin
  if (select count(*) from public.spaces) <> 1 then raise exception 'participant B must see only B'; end if;
  if (select count(*) from public.positions) <> 1 then raise exception 'participant B must see only B positions'; end if;
  if (select count(*) from public.replies) <> 1 then raise exception 'participant B must see only B replies'; end if;
  if (select count(*) from public.reports) <> 1 then raise exception 'participant B sees another reporter'; end if;
end $$;
reset role;

set role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000005',true);
do $$ begin
  if (select count(*) from public.spaces) <> 0 then raise exception 'visitor can see a space'; end if;
  if (select count(*) from public.debates) <> 0 then raise exception 'visitor can see a debate'; end if;
  if (select count(*) from public.positions) <> 0 then raise exception 'visitor can see a position'; end if;
  if (select count(*) from public.replies) <> 0 then raise exception 'visitor can see a reply'; end if;
  if (select count(*) from public.reports) <> 0 then raise exception 'visitor can see a report'; end if;
end $$;
reset role;

-- Only server role can issue and consume a token. Capture it in a temporary table,
-- never emit it in test output or versioned fixtures.
insert into public.space_memberships(space_id,user_id,role,display_name) values
 ('20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','participant','Ana antiga');
create temp table test_invite_token(token text) on commit drop;
create temp table test_open_invite_token(token text) on commit drop;
grant select, insert on test_invite_token to service_role;
grant select, insert on test_open_invite_token to service_role;
set role service_role;
do $$ declare issued jsonb; result jsonb; begin
  issued := public.issue_invite('10000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001',now()+interval '1 day');
  if issued->>'code' <> 'OK' then raise exception 'mediator A cannot issue invite'; end if;
  insert into test_invite_token(token) values (issued->>'token');
  issued := public.issue_invite('10000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000001',null,now()+interval '7 days',true);
  if issued->>'code' <> 'OK' then raise exception 'mediator A cannot issue open invite'; end if;
  insert into test_open_invite_token(token) values (issued->>'token');
  result := public.issue_invite('10000000-0000-0000-0000-000000000004','20000000-0000-0000-0000-000000000001',null,now()+interval '1 day');
  if result->>'code' <> 'NOT_A_MEDIATOR' then raise exception 'mediator B issued A invite'; end if;
end $$;
reset role;

set role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000002',true);
do $$ begin
  if (select count(*) from public.invitations) <> 2 then raise exception 'mediator A cannot see both A invites'; end if;
end $$;
reset role;

set role service_role;
do $$ declare token text; open_token text; result jsonb; begin
  select t.token into token from test_invite_token t;
  select t.token into open_token from test_open_invite_token t;
  result := public.update_member_name('10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','Ana L.');
  if result->>'code' <> 'OK' then raise exception 'participant A cannot rename herself'; end if;
  result := public.update_member_profile('10000000-0000-0000-0000-000000000001','Ana compartilhada');
  if result->>'code' <> 'OK' then raise exception 'participant A cannot update shared profile'; end if;
  result := public.preview_invite(token);
  if result->>'code' <> 'OK' then raise exception 'preview failed'; end if;
  if result->>'mediator_name' <> 'Marina' then raise exception 'invite omitted mediator attribution'; end if;
  result := public.redeem_invite('10000000-0000-0000-0000-000000000005',token,'Visitante');
  if result->>'code' <> 'OK' then raise exception 'redeem failed'; end if;
  result := public.redeem_invite('10000000-0000-0000-0000-000000000003',token,'Bia');
  if result->>'code' <> 'INVITE_USED' then raise exception 'reused invite succeeded'; end if;
  result := public.redeem_invite('10000000-0000-0000-0000-000000000003',open_token,'Bia');
  if result->>'code' <> 'OK' then raise exception 'first open invite use failed'; end if;
  result := public.redeem_invite('10000000-0000-0000-0000-000000000006',open_token,'Visitante 2');
  if result->>'code' <> 'OK' then raise exception 'second open invite use failed'; end if;
  result := public.save_position('10000000-0000-0000-0000-000000000005','30000000-0000-0000-0000-000000000002','em_parte','Cross group',null,0,'test-cross-group-001');
  if result->>'code' <> 'NOT_A_MEMBER' then raise exception 'cross group write succeeded'; end if;
  result := public.save_position('10000000-0000-0000-0000-000000000005','30000000-0000-0000-0000-000000000001','em_parte','Minha razão',null,0,'test-position-write-001');
  if result->>'code' <> 'OK' then raise exception 'position write failed'; end if;
  if (public.save_position('10000000-0000-0000-0000-000000000005','30000000-0000-0000-0000-000000000001','em_parte','Minha razão',null,0,'test-position-write-001')->>'revision')::int <> 1 then
    raise exception 'idempotent retry changed revision';
  end if;
  result := public.create_reply('10000000-0000-0000-0000-000000000005','40000000-0000-0000-0000-000000000003','question','Outra turma','test-cross-reply-001');
  if result->>'code' <> 'NOT_A_MEMBER' then raise exception 'cross group reply succeeded'; end if;
  result := public.set_agreement('10000000-0000-0000-0000-000000000005','40000000-0000-0000-0000-000000000003',true);
  if result->>'code' <> 'NOT_A_MEMBER' then raise exception 'cross group agreement succeeded'; end if;
  result := public.create_report('10000000-0000-0000-0000-000000000005','position','40000000-0000-0000-0000-000000000003','personal_attack',null);
  if result->>'code' <> 'NOT_A_MEMBER' then raise exception 'cross group report succeeded'; end if;
  result := public.resolve_report('10000000-0000-0000-0000-000000000004','60000000-0000-0000-0000-000000000001','hide','Motivo',1);
  if result->>'code' <> 'NOT_A_MEDIATOR' then raise exception 'mediator B moderated A'; end if;
  result := public.resolve_report('10000000-0000-0000-0000-000000000002','60000000-0000-0000-0000-000000000001','hide','Ataque pessoal',1);
  if result->>'code' <> 'OK' then raise exception 'mediator A could not hide'; end if;
end $$;
reset role;

do $$ begin
  if (select count(*) from public.space_memberships where user_id='10000000-0000-0000-0000-000000000001' and display_name='Ana compartilhada') <> 2 then raise exception 'shared name was not propagated to both groups'; end if;
  if (select display_name from public.member_profiles where user_id='10000000-0000-0000-0000-000000000001') <> 'Ana compartilhada' then raise exception 'shared profile not stored'; end if;
end $$;

set role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000004',true);
do $$ begin
  if (select count(*) from public.member_profiles where user_id in ('10000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000003')) <> 2 then raise exception 'group B cannot see shared profiles from its group'; end if;
  if exists (select 1 from public.member_profiles where user_id='10000000-0000-0000-0000-000000000005') then raise exception 'group B can see a profile from group A'; end if;
end $$;
reset role;
-- Restore the original two-group fixture for the remaining isolation assertions.
delete from public.space_memberships where user_id='10000000-0000-0000-0000-000000000001' and space_id='20000000-0000-0000-0000-000000000002';
delete from public.space_memberships where user_id='10000000-0000-0000-0000-000000000003' and space_id='20000000-0000-0000-0000-000000000001';

set role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000001',true);
do $$ begin
  if (select count(*) from public.positions where id='40000000-0000-0000-0000-000000000001') <> 0 then raise exception 'hidden position leaked to participant A'; end if;
  if (select count(*) from public.moderation_actions) <> 0 then raise exception 'audit leaked to participant A'; end if;
end $$;
reset role;

set role service_role;
do $$ declare result jsonb; begin
  result := public.restore_report('10000000-0000-0000-0000-000000000004','60000000-0000-0000-0000-000000000001','Revisão fictícia',2);
  if result->>'code'<>'NOT_A_MEDIATOR' then raise exception 'mediator B restored A'; end if;
  result := public.restore_report('10000000-0000-0000-0000-000000000002','60000000-0000-0000-0000-000000000001','Revisão fictícia',2);
  if result->>'code'<>'OK' then raise exception 'mediator A could not restore A'; end if;
  result := public.restore_report('10000000-0000-0000-0000-000000000002','60000000-0000-0000-0000-000000000001','Revisão repetida',2);
  if result->>'code'<>'VERSION_CONFLICT' then raise exception 'restoration was repeated'; end if;
end $$;
reset role;

set role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000001',true);
do $$ begin
  if (select count(*) from public.positions where id='40000000-0000-0000-0000-000000000001') <> 1 then raise exception 'restored position stayed hidden'; end if;
end $$;
reset role;

set role service_role;
do $$ declare result jsonb; summary_id uuid; draft_id uuid; begin
  result := public.create_debate('10000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000001','Rascunho novo?','',null,'[]'::jsonb,'[]'::jsonb,'test-new-debate-001');
  if result->>'code'<>'OK' then raise exception 'mediator cannot create draft'; end if;
  draft_id := (result->>'id')::uuid;
  result := public.open_debate('10000000-0000-0000-0000-000000000002',draft_id,1);
  if result->>'code'<>'VALIDATION_ERROR' then raise exception 'opened incomplete debate'; end if;
  result := public.update_debate_draft('10000000-0000-0000-0000-000000000004',draft_id,1,'Pergunta completa?','Contexto completo',null,
    '[{"title":"Fonte exemplo","publisher":"Publicação exemplo","url":"https://example.test/fonte","whyRead":"Contexto documentado"}]'::jsonb,'[]'::jsonb);
  if result->>'code'<>'NOT_A_MEDIATOR' then raise exception 'mediator B edited draft A'; end if;
  result := public.update_debate_draft('10000000-0000-0000-0000-000000000002',draft_id,1,'Pergunta completa?','Contexto completo',null,
    '[{"title":"Fonte exemplo","publisher":"Publicação exemplo","url":"https://example.test/fonte","whyRead":"Contexto documentado"}]'::jsonb,'[]'::jsonb);
  if result->>'code'<>'OK' or result->>'version'<>'2' then raise exception 'mediator cannot edit own draft'; end if;
  result := public.update_debate_draft('10000000-0000-0000-0000-000000000002',draft_id,1,'Versão antiga','Contexto',null,'[]'::jsonb,'[]'::jsonb);
  if result->>'code'<>'VERSION_CONFLICT' then raise exception 'stale edit overwrote draft'; end if;
  result := public.open_debate('10000000-0000-0000-0000-000000000002',draft_id,2);
  if result->>'code'<>'OK' then raise exception 'completed draft did not open'; end if;
  result := public.close_debate('10000000-0000-0000-0000-000000000004','30000000-0000-0000-0000-000000000001',1);
  if result->>'code'<>'NOT_A_MEDIATOR' then raise exception 'mediator B closed A'; end if;
  result := public.close_debate('10000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000001',1);
  if result->>'code'<>'OK' then raise exception 'mediator A cannot close A'; end if;
  result := public.save_position('10000000-0000-0000-0000-000000000005','30000000-0000-0000-0000-000000000001','em_parte','Depois de fechar',null,1,'test-closed-position-001');
  if result->>'code'<>'DEBATE_CLOSED' then raise exception 'position changed after close'; end if;
  result := public.save_summary('10000000-0000-0000-0000-000000000004','30000000-0000-0000-0000-000000000001','Panorama','Argumentos','Encontros','Divergências','Perguntas',0);
  if result->>'code'<>'NOT_A_MEDIATOR' then raise exception 'mediator B drafted A summary'; end if;
  result := public.save_summary('10000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000001','Panorama','Argumentos','Encontros','Divergências','Perguntas',0);
  if result->>'code'<>'OK' then raise exception 'summary draft failed'; end if;
  summary_id := (result->>'id')::uuid;
  result := public.publish_summary('10000000-0000-0000-0000-000000000002',summary_id,1,false);
  if result->>'code'<>'VALIDATION_ERROR' then raise exception 'summary published without review'; end if;
  result := public.publish_summary('10000000-0000-0000-0000-000000000002',summary_id,1,true);
  if result->>'code'<>'OK' then raise exception 'summary publication failed'; end if;
end $$;
reset role;

set role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000003',true);
do $$ begin
  if (select count(*) from public.summaries) <> 0 then raise exception 'B saw A summary'; end if;
end $$;
reset role;

set role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000001',true);
do $$ begin
  if (select count(*) from public.summaries) <> 1 then raise exception 'A cannot see published summary'; end if;
  if (select count(*) from public.debates where status='draft') <> 0 then raise exception 'A saw draft'; end if;
end $$;
reset role;

rollback;
