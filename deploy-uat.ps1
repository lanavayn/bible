param(
  [string]$Branch = "uat",
  [string]$Message,
  [string]$BuildHookUrl = "",   # optional: Netlify Build Hook URL (if you have it)
  [string]$UatUrl = ""          # optional: your UAT site URL (e.g., https://my-uat-site.netlify.app)
)

# ---- Helpers ----
function Fail($msg){ Write-Error $msg; exit 1 }

# ---- Preflight ----
git rev-parse --is-inside-work-tree *> $null
if ($LASTEXITCODE -ne 0) { Fail "Not inside a git repo." }

# Validate JSON (prevents a broken deploy due to invalid JSON)
$bibJsonPath = "data\bible-books.json"
if (Test-Path $bibJsonPath) {
  try {
    Get-Content -Raw $bibJsonPath | ConvertFrom-Json | Out-Null
    Write-Host "JSON OK: $bibJsonPath"
  } catch {
    Fail "Invalid JSON in $bibJsonPath. Fix it and re-run. Details: $($_.Exception.Message)"
  }
} else {
  Write-Host "Note: $bibJsonPath not found (skipping JSON validation)."
}

# Switch to UAT branch if needed
$current = (git rev-parse --abbrev-ref HEAD).Trim()
if ($current -ne $Branch) {
  Write-Host "Switching from '$current' to '$Branch'..."
  git switch $Branch || Fail "Couldn't switch to branch '$Branch'."
}

# ---- Stage changes (exclude your local backups like *_old.*) ----
# Add everything except *_old.* under data/ and js/
git add -A `
  ':!data/*_old.*' `
  ':!js/*_old.*'

# If nothing staged, we still allow pushing or triggering a hook
git diff --cached --quiet
$stagedEmpty = ($LASTEXITCODE -eq 0)

# ---- Commit ----
if ($stagedEmpty) {
  Write-Host "No staged changes to commit."
} else {
  if (-not $Message -or $Message.Trim() -eq "") {
    $Message = "UAT deploy: $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
  }
  git commit -m $Message || Fail "Commit failed."
}

# ---- Push ----
git push origin $Branch || Fail "Push failed."

# ---- Optional: trigger Netlify build hook ----
if ($BuildHookUrl -and $BuildHookUrl.Trim() -ne "") {
  Write-Host "Triggering Netlify build hook..."
  try {
    Invoke-WebRequest -Method POST -Uri $BuildHookUrl -UseBasicParsing | Out-Null
    Write-Host "Build hook triggered."
  } catch {
    Write-Warning "Build hook call failed: $($_.Exception.Message)"
  }
}

# ---- Optional: open UAT site ----
if ($UatUrl -and $UatUrl.Trim() -ne "") {
  Start-Process $UatUrl
  Write-Host "Opened $UatUrl"
}

Write-Host "Done."

