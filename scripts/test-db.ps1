$ErrorActionPreference = 'Stop'
$container = "maisdebates-sql-test-$PID"
$root = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$mount = "type=bind,source=$root,target=/workspace,readonly"

try {
  docker run --rm -d --network none --name $container --env POSTGRES_HOST_AUTH_METHOD=trust --mount $mount postgres:17-alpine | Out-Null
  if ($LASTEXITCODE -ne 0) { throw 'Could not start disposable PostgreSQL container.' }
  $ready = $false
  for ($attempt = 0; $attempt -lt 30; $attempt++) {
    docker exec $container pg_isready -U postgres | Out-Null
    if ($LASTEXITCODE -eq 0) { $ready = $true; break }
    Start-Sleep -Seconds 1
  }
  if (-not $ready) { throw 'PostgreSQL did not become ready.' }
  # The image briefly accepts connections during initdb, then restarts its final server.
  Start-Sleep -Seconds 2
  $files = @(
    '/workspace/supabase/tests/bootstrap_standalone.sql',
    '/workspace/supabase/migrations/20261017234000_core_invites.sql',
    '/workspace/supabase/migrations/20261017235500_positions.sql',
    '/workspace/supabase/migrations/20261018001000_dialogue_moderation.sql',
    '/workspace/supabase/migrations/20261018003500_mediation_summaries.sql',
    '/workspace/supabase/migrations/20261018010000_edit_draft.sql',
    '/workspace/supabase/migrations/20261018011500_member_profile.sql',
    '/workspace/supabase/migrations/20261018013000_invite_attribution.sql',
    '/workspace/supabase/migrations/20261018014500_restore_report.sql',
    '/workspace/supabase/migrations/20261103090000_shared_profile_and_open_invites.sql',
    '/workspace/supabase/tests/core_rls.sql'
  )
  foreach ($file in $files) {
    $result = docker exec $container psql -U postgres -d postgres -v ON_ERROR_STOP=1 -f $file 2>&1
    if ($LASTEXITCODE -ne 0) { throw "SQL failed: $file`n$result" }
  }
  Write-Output 'All SQL migrations and two-group RLS assertions passed.'
} finally {
  docker stop $container | Out-Null
}
