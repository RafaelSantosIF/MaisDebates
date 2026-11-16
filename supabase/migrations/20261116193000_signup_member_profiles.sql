create or replace function public.create_member_profile_for_auth_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare display_name text;
begin
  display_name := nullif(btrim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), '');
  if display_name is null or length(display_name) not between 2 and 60 then
    display_name := 'Participante';
  end if;
  insert into public.member_profiles(user_id, display_name)
    values (new.id, display_name)
    on conflict (user_id) do nothing;
  return new;
end;
$$;
revoke all on function public.create_member_profile_for_auth_user() from public, anon, authenticated;

create trigger create_member_profile_after_auth_signup
after insert on auth.users
for each row execute function public.create_member_profile_for_auth_user();

insert into public.member_profiles(user_id, display_name)
select id,
  case
    when length(btrim(coalesce(raw_user_meta_data ->> 'display_name', ''))) between 2 and 60
      then btrim(raw_user_meta_data ->> 'display_name')
    else 'Participante'
  end
from auth.users
on conflict (user_id) do nothing;

create or replace function public.update_member_profile(p_actor uuid,p_display_name text) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  if p_actor is null or not exists (select 1 from auth.users where id=p_actor) then
    return jsonb_build_object('code','NOT_AUTHENTICATED');
  end if;
  if length(btrim(coalesce(p_display_name,''))) not between 2 and 60 then
    return jsonb_build_object('code','VALIDATION_ERROR');
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
