-- One display profile belongs to a person and is reused in every space.
create table public.member_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (length(btrim(display_name)) between 2 and 60),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.member_profiles(user_id, display_name)
select user_id, (array_agg(display_name order by joined_at))[1]
from public.space_memberships
group by user_id
on conflict (user_id) do nothing;

update public.space_memberships memberships
set display_name = profiles.display_name
from public.member_profiles profiles
where profiles.user_id = memberships.user_id;

alter table public.member_profiles enable row level security;
create policy member_profiles_read on public.member_profiles for select to authenticated
using (user_id = auth.uid() or exists (
  select 1 from public.space_memberships mine
  join public.space_memberships theirs on theirs.space_id = mine.space_id
  join public.spaces active_space on active_space.id = mine.space_id and active_space.status = 'active'
  where mine.user_id = auth.uid() and mine.status = 'active'
    and theirs.user_id = member_profiles.user_id and theirs.status = 'active'
));
revoke all on public.member_profiles from anon, authenticated;
grant select on public.member_profiles to authenticated;

create function public.update_member_profile(p_actor uuid,p_display_name text) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  if p_actor is null or not exists (select 1 from auth.users where id=p_actor) then
    return jsonb_build_object('code','NOT_AUTHENTICATED');
  end if;
  if length(btrim(coalesce(p_display_name,''))) not between 2 and 60 then
    return jsonb_build_object('code','VALIDATION_ERROR');
  end if;
  if not exists (select 1 from public.space_memberships where user_id=p_actor and status='active') then
    return jsonb_build_object('code','NOT_A_MEMBER');
  end if;
  insert into public.member_profiles(user_id,display_name,updated_at)
    values (p_actor,btrim(p_display_name),now())
    on conflict (user_id) do update set display_name=excluded.display_name,updated_at=now();
  update public.space_memberships set display_name=btrim(p_display_name),updated_at=now()
    where user_id=p_actor and status='active';
  return jsonb_build_object('code','OK','display_name',btrim(p_display_name));
end;
$$;
revoke all on function public.update_member_profile(uuid,text) from public,anon,authenticated;
grant execute on function public.update_member_profile(uuid,text) to service_role;

alter table public.invitations drop constraint invitations_max_uses_check;
alter table public.invitations alter column max_uses drop not null;
alter table public.invitations drop constraint invitations_uses_check;
alter table public.invitations add constraint invitation_use_limits
  check ((max_uses is null and uses >= 0) or (max_uses = 1 and uses between 0 and 1));

create or replace function public.redeem_invite(p_actor uuid, p_token text, p_display_name text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare inv public.invitations%rowtype; attempts integer;
begin
  if p_actor is null or not exists (select 1 from auth.users where id = p_actor) then
    return jsonb_build_object('code','NOT_AUTHENTICATED');
  end if;
  if length(btrim(p_display_name)) not between 2 and 60 then return jsonb_build_object('code','VALIDATION_ERROR'); end if;
  perform 1 from auth.users where id = p_actor for update;
  select count(*) into attempts from public.invite_attempts where actor_user_id = p_actor and attempted_at > now() - interval '10 minutes';
  if attempts >= 10 then return jsonb_build_object('code','RATE_LIMITED'); end if;
  insert into public.invite_attempts(actor_user_id) values (p_actor);
  if p_token !~ '^[0-9a-f]{64}$' then return jsonb_build_object('code','INVITE_INVALID'); end if;
  select * into inv from public.invitations where token_hash = encode(extensions.digest(p_token,'sha256'),'hex') for update;
  if not found then return jsonb_build_object('code','INVITE_INVALID'); end if;
  if inv.revoked_at is not null then return jsonb_build_object('code','INVITE_REVOKED'); end if;
  if inv.max_uses is not null and inv.uses >= inv.max_uses then return jsonb_build_object('code','INVITE_USED'); end if;
  if inv.expires_at <= now() then return jsonb_build_object('code','INVITE_EXPIRED'); end if;
  if not exists (select 1 from public.spaces where id=inv.space_id and status='active') then return jsonb_build_object('code','INVITE_INVALID'); end if;
  if exists (select 1 from public.space_memberships where space_id=inv.space_id and user_id=p_actor) then return jsonb_build_object('code','ALREADY_A_MEMBER'); end if;
  insert into public.member_profiles(user_id,display_name) values (p_actor,btrim(p_display_name))
    on conflict (user_id) do update set display_name=excluded.display_name,updated_at=now();
  insert into public.space_memberships(space_id,user_id,role,display_name) values (inv.space_id,p_actor,'participant',btrim(p_display_name));
  update public.invitations set uses=uses+1,used_at=now(),used_by=p_actor where id=inv.id;
  return jsonb_build_object('code','OK','space_id',inv.space_id,'debate_id',inv.debate_id);
end;
$$;

create or replace function public.issue_invite(p_actor uuid,p_space_id uuid,p_debate_id uuid,p_expires_at timestamptz,p_open boolean) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare token text; inv_id uuid;
begin
  if p_actor is null or not exists (
    select 1 from public.space_memberships m join public.spaces s on s.id=m.space_id
    where m.space_id=p_space_id and m.user_id=p_actor and m.role='mediator' and m.status='active' and s.status='active'
  ) then return jsonb_build_object('code','NOT_A_MEDIATOR'); end if;
  if p_expires_at <= now() or p_expires_at > now()+interval '30 days' then return jsonb_build_object('code','VALIDATION_ERROR'); end if;
  if p_debate_id is not null and not exists (select 1 from public.debates where id=p_debate_id and space_id=p_space_id) then return jsonb_build_object('code','VALIDATION_ERROR'); end if;
  token := encode(extensions.gen_random_bytes(32),'hex');
  insert into public.invitations(space_id,debate_id,token_hash,expires_at,max_uses,created_by)
    values (p_space_id,p_debate_id,encode(extensions.digest(token,'sha256'),'hex'),p_expires_at,case when p_open then null else 1 end,p_actor)
    returning id into inv_id;
  return jsonb_build_object('code','OK','id',inv_id,'token',token);
end;
$$;
revoke all on function public.issue_invite(uuid,uuid,uuid,timestamptz,boolean) from public,anon,authenticated;
grant execute on function public.issue_invite(uuid,uuid,uuid,timestamptz,boolean) to service_role;
