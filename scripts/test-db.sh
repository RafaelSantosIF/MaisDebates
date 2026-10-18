#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
container="maisdebates-sql-test-$$"
cleanup() { docker stop "$container" >/dev/null 2>&1 || true; }
trap cleanup EXIT

docker run --rm -d --network none --name "$container" \
  --env POSTGRES_HOST_AUTH_METHOD=trust \
  --mount "type=bind,source=$root,target=/workspace,readonly" postgres:17-alpine >/dev/null
for attempt in $(seq 1 30); do
  if docker exec "$container" pg_isready -U postgres >/dev/null 2>&1; then break; fi
  sleep 1
done
docker exec "$container" pg_isready -U postgres >/dev/null
# The image briefly accepts connections during initdb, then restarts its final server.
sleep 2

for file in \
  /workspace/supabase/tests/bootstrap_standalone.sql \
  /workspace/supabase/migrations/20261017234000_core_invites.sql \
  /workspace/supabase/migrations/20261017235500_positions.sql \
  /workspace/supabase/migrations/20261018001000_dialogue_moderation.sql \
  /workspace/supabase/migrations/20261018003500_mediation_summaries.sql \
  /workspace/supabase/migrations/20261018010000_edit_draft.sql \
  /workspace/supabase/migrations/20261018011500_member_profile.sql \
  /workspace/supabase/migrations/20261018013000_invite_attribution.sql \
  /workspace/supabase/migrations/20261018014500_restore_report.sql \
  /workspace/supabase/tests/core_rls.sql; do
  docker exec "$container" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -f "$file" >/dev/null
done
echo 'All SQL migrations and two-group RLS assertions passed.'
