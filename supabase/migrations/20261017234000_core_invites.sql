-- Fase 1: espaços privados, convites individuais e leitura inicial de debates.
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create table public.spaces (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(btrim(title)) between 2 and 100),
  status text not null default 'active' check (status in ('active','archived')),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.space_memberships (
  space_id uuid not null references public.spaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('participant','mediator')),
  display_name text not null check (length(btrim(display_name)) between 2 and 60),
  status text not null default 'active' check (status in ('active','removed')),
  joined_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (space_id, user_id)
);

create table public.debates (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces(id) on delete cascade,
  question text not null default '' check (length(question) <= 300),
  context text not null default '' check (length(context) <= 12000),
  status text not null default 'draft' check (status in ('draft','open','closed')),
  opens_at timestamptz,
  closes_at timestamptz,
  created_by uuid not null references auth.users(id),
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint open_debate_content check (status = 'draft' or (length(btrim(question)) > 0 and length(btrim(context)) > 0))
);
create index debates_space_status_closes on public.debates(space_id,status,closes_at);

create table public.debate_sources (
  id uuid primary key default gen_random_uuid(),
  debate_id uuid not null references public.debates(id) on delete cascade,
  title text not null check (length(btrim(title)) between 2 and 200),
  publisher text not null check (length(btrim(publisher)) between 2 and 120),
  url text not null check (url ~ '^https://[^[:space:]]+$' and length(url) <= 2000),
  published_at date,
  why_read text not null check (length(btrim(why_read)) between 2 and 1000),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index debate_sources_order on public.debate_sources(debate_id,sort_order,id);

create table public.debate_terms (
  id uuid primary key default gen_random_uuid(),
  debate_id uuid not null references public.debates(id) on delete cascade,
  term text not null check (length(btrim(term)) between 2 and 100),
  definition text not null check (length(btrim(definition)) between 2 and 1000),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces(id) on delete cascade,
  debate_id uuid references public.debates(id) on delete set null,
  token_hash text not null unique,
  expires_at timestamptz not null,
  max_uses integer not null default 1 check (max_uses = 1),
  uses integer not null default 0 check (uses between 0 and 1),
  revoked_at timestamptz,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  used_at timestamptz,
  used_by uuid references auth.users(id),
  constraint invitation_time check (expires_at > created_at)
);
create index invitations_space on public.invitations(space_id,created_at desc);

create table public.invite_attempts (
  actor_user_id uuid not null references auth.users(id) on delete cascade,
  attempted_at timestamptz not null default now()
);
create index invite_attempts_limit on public.invite_attempts(actor_user_id,attempted_at desc);

-- SECURITY DEFINER helpers avoid recursive membership policies. No client can mutate roles.
create function public.is_space_member(p_space_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.space_memberships m
    join public.spaces s on s.id = m.space_id
    where m.space_id = p_space_id and m.user_id = auth.uid()
      and m.status = 'active' and s.status = 'active'
  );
$$;

create function public.is_space_mediator(p_space_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.space_memberships m
    join public.spaces s on s.id = m.space_id
    where m.space_id = p_space_id and m.user_id = auth.uid()
      and m.role = 'mediator' and m.status = 'active' and s.status = 'active'
  );
$$;

alter table public.spaces enable row level security;
alter table public.space_memberships enable row level security;
alter table public.debates enable row level security;
alter table public.debate_sources enable row level security;
alter table public.debate_terms enable row level security;
alter table public.invitations enable row level security;
alter table public.invite_attempts enable row level security;

create policy spaces_read on public.spaces for select to authenticated using (public.is_space_member(id));
create policy memberships_read on public.space_memberships for select to authenticated using (public.is_space_member(space_id));
create policy debates_read on public.debates for select to authenticated
  using (public.is_space_member(space_id) and (status <> 'draft' or public.is_space_mediator(space_id)));
create policy sources_read on public.debate_sources for select to authenticated
  using (exists (select 1 from public.debates d where d.id = debate_id));
create policy terms_read on public.debate_terms for select to authenticated
  using (exists (select 1 from public.debates d where d.id = debate_id));
create policy invitations_mediator_read on public.invitations for select to authenticated
  using (public.is_space_mediator(space_id));

revoke all on public.spaces, public.space_memberships, public.debates,
  public.debate_sources, public.debate_terms, public.invitations, public.invite_attempts from anon, authenticated;
grant select on public.spaces, public.space_memberships, public.debates,
  public.debate_sources, public.debate_terms to authenticated;
grant select (id,space_id,debate_id,expires_at,uses,revoked_at,created_by,created_at,used_at,used_by)
  on public.invitations to authenticated;
revoke all on function public.is_space_member(uuid), public.is_space_mediator(uuid) from public, anon;
grant execute on function public.is_space_member(uuid), public.is_space_mediator(uuid) to authenticated;

-- Edge Functions call these operations after verifying the caller's JWT.
-- They are executable only by the backend role and run as one database transaction.
create function public.preview_invite(p_token text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare inv public.invitations%rowtype; result jsonb;
begin
  if p_token !~ '^[0-9a-f]{64}$' then return jsonb_build_object('code','INVITE_INVALID'); end if;
  select * into inv from public.invitations where token_hash = encode(extensions.digest(p_token,'sha256'),'hex');
  if not found then return jsonb_build_object('code','INVITE_INVALID'); end if;
  if inv.revoked_at is not null then return jsonb_build_object('code','INVITE_REVOKED'); end if;
  if inv.uses >= inv.max_uses then return jsonb_build_object('code','INVITE_USED'); end if;
  if inv.expires_at <= now() then return jsonb_build_object('code','INVITE_EXPIRED'); end if;
  select jsonb_build_object('code','OK','space_title',s.title,'question',d.question,'expires_at',inv.expires_at)
    into result from public.spaces s left join public.debates d on d.id = inv.debate_id
    where s.id = inv.space_id and s.status = 'active';
  return coalesce(result,jsonb_build_object('code','INVITE_INVALID'));
end;
$$;

create function public.redeem_invite(p_actor uuid, p_token text, p_display_name text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare inv public.invitations%rowtype; attempts integer;
begin
  if p_actor is null or not exists (select 1 from auth.users where id = p_actor) then
    return jsonb_build_object('code','NOT_AUTHENTICATED');
  end if;
  if length(btrim(p_display_name)) not between 2 and 60 then
    return jsonb_build_object('code','VALIDATION_ERROR');
  end if;
  -- Serialize attempts per actor, including invalid tokens.
  perform 1 from auth.users where id = p_actor for update;
  select count(*) into attempts from public.invite_attempts
    where actor_user_id = p_actor and attempted_at > now() - interval '10 minutes';
  if attempts >= 10 then return jsonb_build_object('code','RATE_LIMITED'); end if;
  insert into public.invite_attempts(actor_user_id) values (p_actor);
  if p_token !~ '^[0-9a-f]{64}$' then return jsonb_build_object('code','INVITE_INVALID'); end if;
  select * into inv from public.invitations
    where token_hash = encode(extensions.digest(p_token,'sha256'),'hex') for update;
  if not found then return jsonb_build_object('code','INVITE_INVALID'); end if;
  if inv.revoked_at is not null then return jsonb_build_object('code','INVITE_REVOKED'); end if;
  if inv.uses >= inv.max_uses then return jsonb_build_object('code','INVITE_USED'); end if;
  if inv.expires_at <= now() then return jsonb_build_object('code','INVITE_EXPIRED'); end if;
  if not exists (select 1 from public.spaces where id = inv.space_id and status = 'active') then
    return jsonb_build_object('code','INVITE_INVALID');
  end if;
  if exists (select 1 from public.space_memberships where space_id = inv.space_id and user_id = p_actor) then
    return jsonb_build_object('code','ALREADY_A_MEMBER');
  end if;
  insert into public.space_memberships(space_id,user_id,role,display_name)
    values (inv.space_id,p_actor,'participant',btrim(p_display_name));
  update public.invitations set uses = 1, used_at = now(), used_by = p_actor where id = inv.id;
  return jsonb_build_object('code','OK','space_id',inv.space_id,'debate_id',inv.debate_id);
end;
$$;

create function public.issue_invite(p_actor uuid, p_space_id uuid, p_debate_id uuid, p_expires_at timestamptz) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare token text; inv_id uuid;
begin
  if not exists (select 1 from public.space_memberships m join public.spaces s on s.id=m.space_id
    where m.space_id=p_space_id and m.user_id=p_actor and m.role='mediator' and m.status='active' and s.status='active') then
    return jsonb_build_object('code','NOT_A_MEDIATOR');
  end if;
  if p_expires_at <= now() or p_expires_at > now() + interval '30 days' then
    return jsonb_build_object('code','VALIDATION_ERROR');
  end if;
  if p_debate_id is not null and not exists (select 1 from public.debates where id=p_debate_id and space_id=p_space_id) then
    return jsonb_build_object('code','VALIDATION_ERROR');
  end if;
  token := encode(extensions.gen_random_bytes(32),'hex');
  insert into public.invitations(space_id,debate_id,token_hash,expires_at,created_by)
    values (p_space_id,p_debate_id,encode(extensions.digest(token,'sha256'),'hex'),p_expires_at,p_actor)
    returning id into inv_id;
  return jsonb_build_object('code','OK','id',inv_id,'token',token);
end;
$$;

revoke all on function public.preview_invite(text), public.redeem_invite(uuid,text,text),
  public.issue_invite(uuid,uuid,uuid,timestamptz) from public, anon, authenticated;
grant execute on function public.preview_invite(text), public.redeem_invite(uuid,text,text),
  public.issue_invite(uuid,uuid,uuid,timestamptz) to service_role;
