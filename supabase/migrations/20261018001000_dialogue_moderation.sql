-- Fase 3: respostas, concordância reversível, denúncias e decisão humana auditada.
alter table public.positions add constraint positions_id_debate_unique unique (id,debate_id);
alter table public.positions add column moderation_reason text;

create table public.replies (
  id uuid primary key default gen_random_uuid(),
  debate_id uuid not null,
  position_id uuid not null,
  author_user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('reply','question')),
  body text not null check (length(btrim(body)) between 1 and 2000),
  visibility text not null default 'visible' check (visibility in ('visible','hidden')),
  moderation_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (position_id,debate_id) references public.positions(id,debate_id) on delete cascade
);
create index replies_position_cursor on public.replies(position_id,created_at,id);

create table public.agreements (
  position_id uuid not null references public.positions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (position_id,user_id)
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  debate_id uuid not null references public.debates(id) on delete cascade,
  reporter_user_id uuid not null references auth.users(id) on delete cascade,
  target_type text not null check (target_type in ('position','reply')),
  target_id uuid not null,
  reason text not null check (reason in ('personal_attack','discrimination','personal_info','spam_other')),
  details text check (details is null or length(details) <= 1000),
  status text not null default 'pending' check (status in ('pending','kept','hidden','restored')),
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  unique (reporter_user_id,target_type,target_id)
);
create index reports_queue on public.reports(debate_id,status,created_at);

create table public.moderation_actions (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id),
  moderator_user_id uuid not null references auth.users(id),
  decision text not null check (decision in ('keep','hide','restore')),
  reason text not null check (length(btrim(reason)) between 1 and 1000),
  created_at timestamptz not null default now()
);

alter table public.replies enable row level security;
alter table public.agreements enable row level security;
alter table public.reports enable row level security;
alter table public.moderation_actions enable row level security;
create policy replies_read on public.replies for select to authenticated using (
  exists (select 1 from public.debates d where d.id=debate_id and public.is_space_member(d.space_id)
    and (visibility='visible' or author_user_id=auth.uid() or public.is_space_mediator(d.space_id)))
);
create policy agreements_own_read on public.agreements for select to authenticated using (
  user_id=auth.uid() and exists (select 1 from public.positions p join public.debates d on d.id=p.debate_id
    where p.id=position_id and public.is_space_member(d.space_id))
);
create policy reports_read on public.reports for select to authenticated using (
  reporter_user_id=auth.uid() or exists (select 1 from public.debates d where d.id=debate_id and public.is_space_mediator(d.space_id))
);
create policy moderation_actions_mediator_read on public.moderation_actions for select to authenticated using (
  exists (select 1 from public.reports r join public.debates d on d.id=r.debate_id
    where r.id=report_id and public.is_space_mediator(d.space_id))
);
revoke all on public.replies,public.agreements,public.reports,public.moderation_actions from anon,authenticated;
grant select on public.replies,public.agreements,public.reports,public.moderation_actions to authenticated;

create function public.create_reply(p_actor uuid,p_position_id uuid,p_kind text,p_body text,p_idempotency_key text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare p public.positions%rowtype; d public.debates%rowtype; prior jsonb; result jsonb; new_id uuid;
begin
  if p_kind not in ('reply','question') or length(btrim(p_body)) not between 1 and 2000
    or length(p_idempotency_key) not between 16 and 100 then return jsonb_build_object('code','VALIDATION_ERROR'); end if;
  perform 1 from auth.users where id=p_actor for update;
  if not found then return jsonb_build_object('code','NOT_AUTHENTICATED'); end if;
  select wr.result into prior from public.write_requests wr
    where wr.actor_user_id=p_actor and wr.operation='create_reply' and wr.idempotency_key=p_idempotency_key;
  if found then return prior; end if;
  select * into p from public.positions where id=p_position_id;
  if not found then return jsonb_build_object('code','NOT_A_MEMBER'); end if;
  select * into d from public.debates where id=p.debate_id for update;
  if not exists (select 1 from public.space_memberships where space_id=d.space_id and user_id=p_actor and status='active') then
    return jsonb_build_object('code','NOT_A_MEMBER');
  end if;
  if d.status<>'open' or (d.closes_at is not null and d.closes_at<=now()) then
    return jsonb_build_object('code','DEBATE_CLOSED');
  end if;
  if p.visibility<>'visible' then return jsonb_build_object('code','TARGET_HIDDEN'); end if;
  insert into public.replies(debate_id,position_id,author_user_id,kind,body)
    values (p.debate_id,p.id,p_actor,p_kind,btrim(p_body)) returning id into new_id;
  result := jsonb_build_object('code','OK','id',new_id);
  insert into public.write_requests(actor_user_id,operation,idempotency_key,result)
    values (p_actor,'create_reply',p_idempotency_key,result);
  return result;
end;
$$;

create function public.set_agreement(p_actor uuid,p_position_id uuid,p_agree boolean) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare p public.positions%rowtype; d public.debates%rowtype;
begin
  select * into p from public.positions where id=p_position_id for update;
  if not found then return jsonb_build_object('code','NOT_A_MEMBER'); end if;
  select * into d from public.debates where id=p.debate_id;
  if not exists (select 1 from public.space_memberships where space_id=d.space_id and user_id=p_actor and status='active') then
    return jsonb_build_object('code','NOT_A_MEMBER');
  end if;
  if d.status<>'open' or (d.closes_at is not null and d.closes_at<=now()) then return jsonb_build_object('code','DEBATE_CLOSED'); end if;
  if p.visibility<>'visible' then return jsonb_build_object('code','TARGET_HIDDEN'); end if;
  if p.author_user_id=p_actor then return jsonb_build_object('code','VALIDATION_ERROR'); end if;
  if p_agree then
    insert into public.agreements(position_id,user_id) values (p_position_id,p_actor) on conflict do nothing;
  else
    delete from public.agreements where position_id=p_position_id and user_id=p_actor;
  end if;
  return jsonb_build_object('code','OK','agreed',p_agree);
end;
$$;

create function public.create_report(p_actor uuid,p_target_type text,p_target_id uuid,p_reason text,p_details text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare target_debate uuid; target_author uuid; d public.debates%rowtype; new_id uuid;
begin
  if p_target_type not in ('position','reply') or p_reason not in ('personal_attack','discrimination','personal_info','spam_other')
    or length(coalesce(p_details,''))>1000 then return jsonb_build_object('code','VALIDATION_ERROR'); end if;
  if p_target_type='position' then
    select debate_id,author_user_id into target_debate,target_author from public.positions where id=p_target_id and visibility='visible';
  else
    select debate_id,author_user_id into target_debate,target_author from public.replies where id=p_target_id and visibility='visible';
  end if;
  if target_debate is null then return jsonb_build_object('code','NOT_A_MEMBER'); end if;
  select * into d from public.debates where id=target_debate;
  if not exists (select 1 from public.space_memberships where space_id=d.space_id and user_id=p_actor and status='active') then
    return jsonb_build_object('code','NOT_A_MEMBER');
  end if;
  if target_author=p_actor then return jsonb_build_object('code','VALIDATION_ERROR'); end if;
  insert into public.reports(debate_id,reporter_user_id,target_type,target_id,reason,details)
    values (target_debate,p_actor,p_target_type,p_target_id,p_reason,nullif(btrim(p_details),''))
    on conflict (reporter_user_id,target_type,target_id) do update set id=public.reports.id
    returning id into new_id;
  return jsonb_build_object('code','OK','id',new_id);
end;
$$;

create function public.resolve_report(p_actor uuid,p_report_id uuid,p_decision text,p_reason text,p_expected_version integer) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare r public.reports%rowtype; d public.debates%rowtype;
begin
  if p_decision not in ('keep','hide') or length(btrim(p_reason)) not between 1 and 1000 then
    return jsonb_build_object('code','VALIDATION_ERROR');
  end if;
  select * into r from public.reports where id=p_report_id for update;
  if not found then return jsonb_build_object('code','NOT_A_MEMBER'); end if;
  select * into d from public.debates where id=r.debate_id;
  if not exists (select 1 from public.space_memberships
    where space_id=d.space_id and user_id=p_actor and role='mediator' and status='active') then
    return jsonb_build_object('code','NOT_A_MEDIATOR');
  end if;
  if r.status<>'pending' or r.version<>p_expected_version then return jsonb_build_object('code','VERSION_CONFLICT'); end if;
  if p_decision='hide' and r.target_type='position' then
    update public.positions set visibility='hidden',moderation_reason=btrim(p_reason),updated_at=now()
      where id=r.target_id and debate_id=r.debate_id;
  elsif p_decision='hide' then
    update public.replies set visibility='hidden',moderation_reason=btrim(p_reason),updated_at=now()
      where id=r.target_id and debate_id=r.debate_id;
  end if;
  update public.reports set status=case when p_decision='hide' then 'hidden' else 'kept' end,
    version=version+1,resolved_at=now() where id=r.id;
  insert into public.moderation_actions(report_id,moderator_user_id,decision,reason)
    values (r.id,p_actor,p_decision,btrim(p_reason));
  return jsonb_build_object('code','OK','status',case when p_decision='hide' then 'hidden' else 'kept' end);
end;
$$;

revoke all on function public.create_reply(uuid,uuid,text,text,text), public.set_agreement(uuid,uuid,boolean),
  public.create_report(uuid,text,uuid,text,text), public.resolve_report(uuid,uuid,text,text,integer) from public,anon,authenticated;
grant execute on function public.create_reply(uuid,uuid,text,text,text), public.set_agreement(uuid,uuid,boolean),
  public.create_report(uuid,text,uuid,text,text), public.resolve_report(uuid,uuid,text,text,integer) to service_role;
