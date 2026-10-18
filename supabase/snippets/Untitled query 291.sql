with new_space as (
  insert into public.spaces(title, created_by)
  values ('Turma de exemplo', '38b9975e-1c00-4874-874c-5569ca614b26'::uuid)
  returning id
)
insert into public.space_memberships(space_id, user_id, role, display_name)
select id, '38b9975e-1c00-4874-874c-5569ca614b26'::uuid, 'mediator', 'Mediação de exemplo'
from new_space;