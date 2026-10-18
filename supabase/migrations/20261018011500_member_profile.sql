-- A member may change only their own display name within an active space.
create function public.update_member_name(p_actor uuid,p_space_id uuid,p_display_name text) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  if length(btrim(coalesce(p_display_name,''))) not between 2 and 60 then
    return jsonb_build_object('code','VALIDATION_ERROR');
  end if;
  if not exists (select 1 from public.space_memberships m join public.spaces s on s.id=m.space_id
    where m.user_id=p_actor and m.space_id=p_space_id and m.status='active' and s.status='active') then
    return jsonb_build_object('code','NOT_A_MEMBER');
  end if;
  update public.space_memberships set display_name=btrim(p_display_name),updated_at=now()
    where user_id=p_actor and space_id=p_space_id;
  return jsonb_build_object('code','OK','display_name',btrim(p_display_name));
end;
$$;
revoke all on function public.update_member_name(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.update_member_name(uuid,uuid,text) to service_role;
