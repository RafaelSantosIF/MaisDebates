-- Fase 4: abertura/encerramento e síntese humana com revisões preservadas.
create table public.summaries (
  id uuid primary key default gen_random_uuid(),
  debate_id uuid not null references public.debates(id) on delete cascade,
  revision integer not null check (revision > 0),
  overview text not null default '' check (length(overview) <= 5000),
  arguments text not null default '' check (length(arguments) <= 5000),
  agreements_text text not null default '' check (length(agreements_text) <= 5000),
  divergences text not null default '' check (length(divergences) <= 5000),
  open_questions text not null default '' check (length(open_questions) <= 5000),
  status text not null default 'draft' check (status in ('draft','published')),
  created_by uuid not null references auth.users(id),
  reviewed_by uuid references auth.users(id),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  unique (debate_id,revision),
  constraint publication_review check (status='draft' or (reviewed_by is not null and published_at is not null))
);
create index summaries_publication on public.summaries(debate_id,status,revision desc);
alter table public.summaries enable row level security;
create policy summaries_read on public.summaries for select to authenticated using (
  exists (select 1 from public.debates d where d.id=debate_id and public.is_space_member(d.space_id)
    and (public.summaries.status='published' or public.is_space_mediator(d.space_id)))
);
revoke all on public.summaries from anon,authenticated;
grant select on public.summaries to authenticated;

create function public.create_debate(
  p_actor uuid,p_space_id uuid,p_question text,p_context text,p_closes_at timestamptz,
  p_sources jsonb,p_terms jsonb,p_idempotency_key text
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare prior jsonb; result jsonb; new_id uuid; source_item jsonb; term_item jsonb; ord integer;
begin
  if length(coalesce(p_question,''))>300 or length(coalesce(p_context,''))>12000
    or jsonb_typeof(p_sources)<>'array' or jsonb_typeof(p_terms)<>'array'
    or jsonb_array_length(p_sources)>20 or jsonb_array_length(p_terms)>30
    or length(p_idempotency_key) not between 16 and 100 then
    return jsonb_build_object('code','VALIDATION_ERROR');
  end if;
  perform 1 from auth.users where id=p_actor for update;
  if not found then return jsonb_build_object('code','NOT_AUTHENTICATED'); end if;
  select wr.result into prior from public.write_requests wr where wr.actor_user_id=p_actor and wr.operation='create_debate' and wr.idempotency_key=p_idempotency_key;
  if found then return prior; end if;
  if not exists (select 1 from public.space_memberships m join public.spaces s on s.id=m.space_id
    where m.space_id=p_space_id and m.user_id=p_actor and m.role='mediator' and m.status='active' and s.status='active') then
    return jsonb_build_object('code','NOT_A_MEDIATOR');
  end if;
  insert into public.debates(space_id,question,context,closes_at,created_by)
    values (p_space_id,btrim(p_question),btrim(p_context),p_closes_at,p_actor) returning id into new_id;
  ord := 0;
  for source_item in select value from jsonb_array_elements(p_sources) loop
    insert into public.debate_sources(debate_id,title,publisher,url,why_read,sort_order)
      values (new_id,source_item->>'title',source_item->>'publisher',source_item->>'url',source_item->>'whyRead',ord);
    ord := ord+1;
  end loop;
  ord := 0;
  for term_item in select value from jsonb_array_elements(p_terms) loop
    insert into public.debate_terms(debate_id,term,definition,sort_order)
      values (new_id,term_item->>'term',term_item->>'definition',ord);
    ord := ord+1;
  end loop;
  result := jsonb_build_object('code','OK','id',new_id,'version',1);
  insert into public.write_requests(actor_user_id,operation,idempotency_key,result)
    values (p_actor,'create_debate',p_idempotency_key,result);
  return result;
end;
$$;

create function public.open_debate(p_actor uuid,p_debate_id uuid,p_expected_version integer) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare d public.debates%rowtype;
begin
  select * into d from public.debates where id=p_debate_id for update;
  if not found then return jsonb_build_object('code','NOT_A_MEMBER'); end if;
  if not exists (select 1 from public.space_memberships where space_id=d.space_id and user_id=p_actor and role='mediator' and status='active') then
    return jsonb_build_object('code','NOT_A_MEDIATOR');
  end if;
  if d.version<>p_expected_version or d.status<>'draft' then return jsonb_build_object('code','VERSION_CONFLICT'); end if;
  if length(btrim(d.question))=0 or length(btrim(d.context))=0
    or not exists (select 1 from public.debate_sources where debate_id=d.id)
    or (d.closes_at is not null and d.closes_at<=now()) then
    return jsonb_build_object('code','VALIDATION_ERROR');
  end if;
  update public.debates set status='open',opens_at=now(),version=version+1,updated_at=now() where id=d.id;
  return jsonb_build_object('code','OK','version',d.version+1);
end;
$$;

create function public.close_debate(p_actor uuid,p_debate_id uuid,p_expected_version integer) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare d public.debates%rowtype;
begin
  select * into d from public.debates where id=p_debate_id for update;
  if not found then return jsonb_build_object('code','NOT_A_MEMBER'); end if;
  if not exists (select 1 from public.space_memberships where space_id=d.space_id and user_id=p_actor and role='mediator' and status='active') then
    return jsonb_build_object('code','NOT_A_MEDIATOR');
  end if;
  if d.version<>p_expected_version or d.status<>'open' then return jsonb_build_object('code','VERSION_CONFLICT'); end if;
  update public.debates set status='closed',version=version+1,updated_at=now() where id=d.id;
  return jsonb_build_object('code','OK','version',d.version+1);
end;
$$;

create function public.save_summary(
  p_actor uuid,p_debate_id uuid,p_overview text,p_arguments text,p_agreements_text text,
  p_divergences text,p_open_questions text,p_expected_revision integer
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare d public.debates%rowtype; last_revision integer; new_id uuid;
begin
  if greatest(length(coalesce(p_overview,'')),length(coalesce(p_arguments,'')),length(coalesce(p_agreements_text,'')),
    length(coalesce(p_divergences,'')),length(coalesce(p_open_questions,'')))>5000 then
    return jsonb_build_object('code','VALIDATION_ERROR');
  end if;
  select * into d from public.debates where id=p_debate_id for update;
  if not found then return jsonb_build_object('code','NOT_A_MEMBER'); end if;
  if not exists (select 1 from public.space_memberships where space_id=d.space_id and user_id=p_actor and role='mediator' and status='active') then
    return jsonb_build_object('code','NOT_A_MEDIATOR');
  end if;
  if d.status<>'closed' then return jsonb_build_object('code','DEBATE_NOT_CLOSED'); end if;
  select coalesce(max(revision),0) into last_revision from public.summaries where debate_id=d.id;
  if last_revision<>p_expected_revision then return jsonb_build_object('code','VERSION_CONFLICT'); end if;
  insert into public.summaries(debate_id,revision,overview,arguments,agreements_text,divergences,open_questions,created_by)
    values (d.id,last_revision+1,coalesce(btrim(p_overview),''),coalesce(btrim(p_arguments),''),
      coalesce(btrim(p_agreements_text),''),coalesce(btrim(p_divergences),''),coalesce(btrim(p_open_questions),''),p_actor)
    returning id into new_id;
  return jsonb_build_object('code','OK','id',new_id,'revision',last_revision+1);
end;
$$;

create function public.publish_summary(p_actor uuid,p_summary_id uuid,p_expected_revision integer,p_reviewed boolean) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare s public.summaries%rowtype; d public.debates%rowtype;
begin
  select * into s from public.summaries where id=p_summary_id for update;
  if not found then return jsonb_build_object('code','NOT_A_MEMBER'); end if;
  select * into d from public.debates where id=s.debate_id for update;
  if not exists (select 1 from public.space_memberships where space_id=d.space_id and user_id=p_actor and role='mediator' and status='active') then
    return jsonb_build_object('code','NOT_A_MEDIATOR');
  end if;
  if d.status<>'closed' then return jsonb_build_object('code','DEBATE_NOT_CLOSED'); end if;
  if s.revision<>p_expected_revision or s.status<>'draft'
    or s.revision<>(select max(revision) from public.summaries where debate_id=s.debate_id) then
    return jsonb_build_object('code','VERSION_CONFLICT');
  end if;
  if not p_reviewed or length(btrim(s.overview))=0 or length(btrim(s.arguments))=0
    or length(btrim(s.agreements_text))=0 or length(btrim(s.divergences))=0
    or length(btrim(s.open_questions))=0 then
    return jsonb_build_object('code','VALIDATION_ERROR');
  end if;
  update public.summaries set status='published',reviewed_by=p_actor,published_at=now() where id=s.id;
  return jsonb_build_object('code','OK','id',s.id,'revision',s.revision);
end;
$$;

revoke all on function public.create_debate(uuid,uuid,text,text,timestamptz,jsonb,jsonb,text),
  public.open_debate(uuid,uuid,integer),public.close_debate(uuid,uuid,integer),
  public.save_summary(uuid,uuid,text,text,text,text,text,integer),
  public.publish_summary(uuid,uuid,integer,boolean) from public,anon,authenticated;
grant execute on function public.create_debate(uuid,uuid,text,text,timestamptz,jsonb,jsonb,text),
  public.open_debate(uuid,uuid,integer),public.close_debate(uuid,uuid,integer),
  public.save_summary(uuid,uuid,text,text,text,text,text,integer),
  public.publish_summary(uuid,uuid,integer,boolean) to service_role;
