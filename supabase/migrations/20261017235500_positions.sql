-- Fase 2: uma posição principal por pessoa e debate, com revisão e retry idempotente.
create table public.positions (
  id uuid primary key default gen_random_uuid(),
  debate_id uuid not null references public.debates(id) on delete cascade,
  author_user_id uuid not null references auth.users(id) on delete cascade,
  stance text not null check (stance in ('favoravel','contrario','em_parte','refletindo')),
  rationale text not null check (length(btrim(rationale)) between 1 and 3000),
  source_note text check (source_note is null or length(source_note) <= 500),
  revision integer not null default 1 check (revision > 0),
  edited_at timestamptz,
  visibility text not null default 'visible' check (visibility in ('visible','hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (debate_id,author_user_id)
);
create index positions_debate_cursor on public.positions(debate_id,created_at,id);

create table public.write_requests (
  actor_user_id uuid not null references auth.users(id) on delete cascade,
  operation text not null,
  idempotency_key text not null check (length(idempotency_key) between 16 and 100),
  result jsonb not null,
  created_at timestamptz not null default now(),
  primary key (actor_user_id,operation,idempotency_key)
);
create index write_requests_expiry on public.write_requests(created_at);

alter table public.positions enable row level security;
alter table public.write_requests enable row level security;
create policy positions_read on public.positions for select to authenticated using (
  exists (
    select 1 from public.debates d
    where d.id = debate_id and public.is_space_member(d.space_id)
      and (visibility = 'visible' or author_user_id = auth.uid() or public.is_space_mediator(d.space_id))
  )
);
revoke all on public.positions, public.write_requests from anon, authenticated;
grant select on public.positions to authenticated;

create function public.save_position(
  p_actor uuid, p_debate_id uuid, p_stance text, p_rationale text,
  p_source_note text, p_expected_revision integer, p_idempotency_key text
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare d public.debates%rowtype; existing public.positions%rowtype; prior jsonb; result jsonb;
begin
  if p_actor is null or length(p_idempotency_key) not between 16 and 100 then
    return jsonb_build_object('code','VALIDATION_ERROR');
  end if;
  if p_stance not in ('favoravel','contrario','em_parte','refletindo')
     or length(btrim(p_rationale)) not between 1 and 3000
     or length(coalesce(p_source_note,'')) > 500
     or p_expected_revision < 0 then
    return jsonb_build_object('code','VALIDATION_ERROR');
  end if;
  -- A row lock serializes retries for one author before reading the idempotency record.
  perform 1 from auth.users where id = p_actor for update;
  if not found then return jsonb_build_object('code','NOT_AUTHENTICATED'); end if;
  select wr.result into prior from public.write_requests wr
    where wr.actor_user_id = p_actor and wr.operation = 'save_position' and wr.idempotency_key = p_idempotency_key;
  if found then return prior; end if;
  select * into d from public.debates where id = p_debate_id for update;
  if not found then return jsonb_build_object('code','NOT_A_MEMBER'); end if;
  if not exists (select 1 from public.space_memberships m
    where m.space_id=d.space_id and m.user_id=p_actor and m.status='active') then
    return jsonb_build_object('code','NOT_A_MEMBER');
  end if;
  if d.status <> 'open' or (d.opens_at is not null and d.opens_at > now())
     or (d.closes_at is not null and d.closes_at <= now()) then
    return jsonb_build_object('code','DEBATE_CLOSED');
  end if;
  select * into existing from public.positions where debate_id=p_debate_id and author_user_id=p_actor for update;
  if found then
    if existing.revision <> p_expected_revision then return jsonb_build_object('code','VERSION_CONFLICT'); end if;
    update public.positions set stance=p_stance, rationale=btrim(p_rationale),
      source_note=nullif(btrim(p_source_note),''), revision=revision+1, edited_at=now(), updated_at=now()
      where id=existing.id returning * into existing;
  else
    if p_expected_revision <> 0 then return jsonb_build_object('code','VERSION_CONFLICT'); end if;
    insert into public.positions(debate_id,author_user_id,stance,rationale,source_note)
      values (p_debate_id,p_actor,p_stance,btrim(p_rationale),nullif(btrim(p_source_note),''))
      returning * into existing;
  end if;
  result := jsonb_build_object('code','OK','id',existing.id,'revision',existing.revision);
  insert into public.write_requests(actor_user_id,operation,idempotency_key,result)
    values (p_actor,'save_position',p_idempotency_key,result);
  return result;
end;
$$;
revoke all on function public.save_position(uuid,uuid,text,text,text,integer,text) from public, anon, authenticated;
grant execute on function public.save_position(uuid,uuid,text,text,text,integer,text) to service_role;
