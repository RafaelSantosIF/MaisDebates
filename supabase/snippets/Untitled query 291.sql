with new_space as (
  insert into public.spaces(title, created_by)
  values ('Turma da ADM', 'a947e25d-25f3-4042-811b-6fb33962716a'::uuid)
  returning id
)
insert into public.space_memberships(space_id, user_id, role, display_name)
select id, 'a947e25d-25f3-4042-811b-6fb33962716a'::uuid, 'mediator', 'Debate Adm'
from new_space;