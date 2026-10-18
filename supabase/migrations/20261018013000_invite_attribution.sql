-- A valid individual invite may show the group's mediator display name.
create or replace function public.preview_invite(p_token text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare inv public.invitations%rowtype; result jsonb;
begin
  if p_token !~ '^[0-9a-f]{64}$' then return jsonb_build_object('code','INVITE_INVALID'); end if;
  select * into inv from public.invitations where token_hash=encode(extensions.digest(p_token,'sha256'),'hex');
  if not found then return jsonb_build_object('code','INVITE_INVALID'); end if;
  if inv.revoked_at is not null then return jsonb_build_object('code','INVITE_REVOKED'); end if;
  if inv.uses>=inv.max_uses then return jsonb_build_object('code','INVITE_USED'); end if;
  if inv.expires_at<=now() then return jsonb_build_object('code','INVITE_EXPIRED'); end if;
  select jsonb_build_object('code','OK','space_title',s.title,'question',d.question,
    'expires_at',inv.expires_at,'mediator_name',(
      select m.display_name from public.space_memberships m
      where m.space_id=s.id and m.role='mediator' and m.status='active'
      order by m.joined_at,m.user_id limit 1))
    into result from public.spaces s left join public.debates d on d.id=inv.debate_id
    where s.id=inv.space_id and s.status='active';
  return coalesce(result,jsonb_build_object('code','INVITE_INVALID'));
end;
$$;
