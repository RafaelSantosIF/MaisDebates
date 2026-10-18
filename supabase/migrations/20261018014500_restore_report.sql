-- A mediator may reverse a hide decision, preserving the original audit record.
create function public.restore_report(p_actor uuid,p_report_id uuid,p_reason text,p_expected_version integer) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare r public.reports%rowtype; d public.debates%rowtype;
begin
  if length(btrim(coalesce(p_reason,''))) not between 1 and 1000 then
    return jsonb_build_object('code','VALIDATION_ERROR');
  end if;
  select * into r from public.reports where id=p_report_id for update;
  if not found then return jsonb_build_object('code','NOT_A_MEMBER'); end if;
  select * into d from public.debates where id=r.debate_id;
  if not exists (select 1 from public.space_memberships m join public.spaces s on s.id=m.space_id
    where m.space_id=d.space_id and m.user_id=p_actor and m.role='mediator' and m.status='active' and s.status='active') then
    return jsonb_build_object('code','NOT_A_MEDIATOR');
  end if;
  if r.status<>'hidden' or r.version<>p_expected_version then return jsonb_build_object('code','VERSION_CONFLICT'); end if;
  if exists (select 1 from public.reports other
    where other.id<>r.id and other.target_type=r.target_type and other.target_id=r.target_id and other.status='hidden') then
    return jsonb_build_object('code','VERSION_CONFLICT');
  end if;
  if r.target_type='position' then
    update public.positions set visibility='visible',moderation_reason=null,updated_at=now()
      where id=r.target_id and debate_id=r.debate_id and visibility='hidden';
  else
    update public.replies set visibility='visible',moderation_reason=null,updated_at=now()
      where id=r.target_id and debate_id=r.debate_id and visibility='hidden';
  end if;
  if not found then return jsonb_build_object('code','VERSION_CONFLICT'); end if;
  update public.reports set status='restored',version=version+1,resolved_at=now() where id=r.id;
  insert into public.moderation_actions(report_id,moderator_user_id,decision,reason)
    values (r.id,p_actor,'restore',btrim(p_reason));
  return jsonb_build_object('code','OK','status','restored');
end;
$$;
revoke all on function public.restore_report(uuid,uuid,text,integer) from public,anon,authenticated;
grant execute on function public.restore_report(uuid,uuid,text,integer) to service_role;
