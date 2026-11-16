create function public.manage_space(
  p_actor uuid,
  p_space_id uuid,
  p_action text,
  p_target_user uuid,
  p_title text
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare active_mediators integer;
begin
  if p_actor is null or not exists (select 1 from auth.users where id = p_actor) then
    return jsonb_build_object('code','NOT_AUTHENTICATED');
  end if;

  perform 1 from public.spaces where id = p_space_id and status = 'active' for update;
  if not found then return jsonb_build_object('code','SPACE_NOT_FOUND'); end if;
  if not exists (
    select 1 from public.space_memberships
    where space_id = p_space_id and user_id = p_actor and role = 'mediator' and status = 'active'
  ) then return jsonb_build_object('code','NOT_A_MEDIATOR'); end if;

  if p_action = 'rename' then
    if length(btrim(coalesce(p_title, ''))) not between 2 and 100 then
      return jsonb_build_object('code','VALIDATION_ERROR');
    end if;
    update public.spaces set title = btrim(p_title), updated_at = now() where id = p_space_id;
  elsif p_action = 'remove_participant' then
    if p_target_user is null then return jsonb_build_object('code','VALIDATION_ERROR'); end if;
    update public.space_memberships set status = 'removed', updated_at = now()
    where space_id = p_space_id and user_id = p_target_user and role = 'participant' and status = 'active';
    if not found then return jsonb_build_object('code','PARTICIPANT_NOT_FOUND'); end if;
  elsif p_action = 'leave' then
    select count(*) into active_mediators from public.space_memberships
    where space_id = p_space_id and role = 'mediator' and status = 'active';
    if active_mediators <= 1 then return jsonb_build_object('code','LAST_MEDIATOR'); end if;
    update public.space_memberships set status = 'removed', updated_at = now()
    where space_id = p_space_id and user_id = p_actor and role = 'mediator' and status = 'active';
  else
    return jsonb_build_object('code','VALIDATION_ERROR');
  end if;
  return jsonb_build_object('code','OK');
end;
$$;
revoke all on function public.manage_space(uuid,uuid,text,uuid,text) from public, anon, authenticated;
grant execute on function public.manage_space(uuid,uuid,text,uuid,text) to service_role;
