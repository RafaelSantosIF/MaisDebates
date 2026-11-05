with new_space as (
  insert into public.spaces(title, created_by)
  values ('Turma da ADM', 'efac1573-7aab-4cee-8c25-f15ae2100922'::uuid)
  returning id
)
insert into public.space_memberships(space_id, user_id, role, display_name)
select id, 'efac1573-7aab-4cee-8c25-f15ae2100922'::uuid, 'mediator', 'Debate Adm'
from new_space;