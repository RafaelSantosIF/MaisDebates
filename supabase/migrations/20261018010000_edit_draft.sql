-- Mediators may resume an incomplete debate draft before it opens.
create function public.update_debate_draft(
  p_actor uuid, p_debate_id uuid, p_expected_version integer,
  p_question text, p_context text, p_closes_at timestamptz,
  p_sources jsonb, p_terms jsonb
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare d public.debates%rowtype; source_item jsonb; term_item jsonb; ord integer;
begin
  if length(coalesce(p_question,''))>300 or length(coalesce(p_context,''))>12000
    or jsonb_typeof(p_sources)<>'array' or jsonb_typeof(p_terms)<>'array'
    or jsonb_array_length(p_sources)>20 or jsonb_array_length(p_terms)>30
    or (p_closes_at is not null and p_closes_at<=now()) then
    return jsonb_build_object('code','VALIDATION_ERROR');
  end if;
  select * into d from public.debates where id=p_debate_id for update;
  if not found then return jsonb_build_object('code','NOT_A_MEMBER'); end if;
  if not exists (select 1 from public.space_memberships m join public.spaces s on s.id=m.space_id
    where m.space_id=d.space_id and m.user_id=p_actor and m.role='mediator' and m.status='active' and s.status='active') then
    return jsonb_build_object('code','NOT_A_MEDIATOR');
  end if;
  if d.status<>'draft' or d.version<>p_expected_version then return jsonb_build_object('code','VERSION_CONFLICT'); end if;
  update public.debates set question=btrim(coalesce(p_question,'')),context=btrim(coalesce(p_context,'')),
    closes_at=p_closes_at,version=d.version+1,updated_at=now() where id=d.id;
  delete from public.debate_sources where debate_id=d.id;
  ord := 0;
  for source_item in select value from jsonb_array_elements(p_sources) loop
    insert into public.debate_sources(debate_id,title,publisher,url,why_read,sort_order)
      values (d.id,source_item->>'title',source_item->>'publisher',source_item->>'url',source_item->>'whyRead',ord);
    ord := ord+1;
  end loop;
  delete from public.debate_terms where debate_id=d.id;
  ord := 0;
  for term_item in select value from jsonb_array_elements(p_terms) loop
    insert into public.debate_terms(debate_id,term,definition,sort_order)
      values (d.id,term_item->>'term',term_item->>'definition',ord);
    ord := ord+1;
  end loop;
  return jsonb_build_object('code','OK','id',d.id,'version',d.version+1);
end;
$$;

revoke all on function public.update_debate_draft(uuid,uuid,integer,text,text,timestamptz,jsonb,jsonb)
  from public,anon,authenticated;
grant execute on function public.update_debate_draft(uuid,uuid,integer,text,text,timestamptz,jsonb,jsonb)
  to service_role;
