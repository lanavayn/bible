param(
  [string]$Message = "UAT: make book details popup scrollable on mobile and wrap long text"
)

# Ensure we're in a git repo
git rev-parse --is-inside-work-tree *> $null
if ($LASTEXITCODE -ne 0) { Write-Error "Not inside a git repo."; exit 1 }

# Switch to uat if not already on it
$branch = (git rev-parse --abbrev-ref HEAD).Trim()
if ($branch -ne "uat") {
  Write-Host "Switching from '$branch' to 'uat'..."
  git switch uat
  if ($LASTEXITCODE -ne 0) { Write-Error "Couldn't switch to 'uat'. Aborting."; exit 1 }
}

# Stage your files
git add js/book-dates.js style.css

# Commit only if something is staged
git diff --cached --quiet
if ($LASTEXITCODE -eq 0) {
  Write-Host "No staged changes to commit."
} else {
  git commit -m $Message
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

# Push to uat
git push origin uat
