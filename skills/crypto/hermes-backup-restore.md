# Hermes Ecosystem Backup & Restore

## Backup Script Pattern

Create `~/backup-hermes-itlg.sh`:

```bash
#!/bin/bash
set -e
BACKUP_DIR="/tmp/hermes-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Hermes Core Config
cp -r ~/.hermes/SOUL.md "$BACKUP_DIR/"
cp -r ~/.hermes/.env "$BACKUP_DIR/"
cp -r ~/.hermes/config.yaml "$BACKUP_DIR/"

# Memories
cp -r ~/.hermes/memories/ "$BACKUP_DIR/memories/"

# Skills
cp -r ~/.hermes/skills/ "$BACKUP_DIR/skills/"

# Cron Jobs
cp -r ~/.hermes/cron/ "$BACKUP_DIR/cron/" 2>/dev/null || true

# Hooks
cp -r ~/.hermes/hooks/ "$BACKUP_DIR/hooks/" 2>/dev/null || true

# Session DB
cp -r ~/.hermes/sessions/ "$BACKUP_DIR/sessions/" 2>/dev/null || true

# Bot configs (add more as needed)
mkdir -p "$BACKUP_DIR/itlg-claim"
cp ~/itlg-claim/config.json "$BACKUP_DIR/itlg-claim/" 2>/dev/null || true
cp ~/itlg-claim/token*.json "$BACKUP_DIR/itlg-claim/" 2>/dev/null || true
cp ~/itlg-claim/claim_state.json "$BACKUP_DIR/itlg-claim/" 2>/dev/null || true
cp ~/itlg-claim/selfie.jpg "$BACKUP_DIR/itlg-claim/" 2>/dev/null || true
cp ~/itlg-claim/bot*.py "$BACKUP_DIR/itlg-claim/" 2>/dev/null || true

# Compress
tar czf ~/backup-hermes-itlg.tar.gz -C "$BACKUP_DIR" .
rm -rf "$BACKUP_DIR"

echo "✅ Backup: ~/backup-hermes-itlg.tar.gz ($(du -h ~/backup-hermes-itlg.tar.gz | cut -f1))"
```

## Typical Size
- Without sessions: ~2-3 MB
- With sessions: ~6-7 MB
- Exclude `hermes-agent/` (2.7 GB — binaries, reinstall instead)
- Exclude `node/` (247 MB — reinstall instead)

## Restore on New VPS
```bash
# 1. Install Hermes first (official installer)
# 2. Restore backup
tar xzf backup-hermes-itlg.tar.gz -C ~/.hermes/

# 3. Restore bots
mkdir -p ~/itlg-claim
cp ~/.hermes/itlg-claim/* ~/itlg-claim/
cd ~/itlg-claim && python3 -m venv venv && source venv/bin/activate && pip install requests

# 4. Restore cron jobs (may need manual re-enable)
hermes cron list
```

## What to Exclude from Backup
- `~/.hermes/hermes-agent/` — 2.7 GB, reinstall via official installer
- `~/.hermes/node/` — 247 MB, reinstall via hermes setup
- `~/.hermes/lsp/` — 37 MB, auto-regenerates
- `~/.hermes/bin/` — 12 MB, auto-regenerates
- `*/venv/` — bot virtualenvs, recreate with `python3 -m venv venv`

---

## GitHub Backup (Private Repo)

Push full ecosystem to private GitHub repo for offsite backup.

### Setup
```bash
# 1. User generates GitHub PAT (Personal Access Token)
#    Settings → Developer Settings → Tokens (classic) → scope: repo

# 2. Save token securely
mkdir -p ~/.hermes/secrets
echo "ghp_XXXX" > ~/.hermes/secrets/github_token.txt
chmod 600 ~/.hermes/secrets/github_token.txt

# 3. Configure git
TOKEN=$(cat ~/.hermes/secrets/github_token.txt)
git config --global credential.helper store
echo "https://USERNAME:${TOKEN}@github.com" > ~/.git-credentials
chmod 600 ~/.git-credentials
git config --global user.name "USERNAME"
git config --global user.email "email@example.com"

# 4. Create private repo via API
curl -s -X POST \
  -H "Authorization: token ${TOKEN}" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/user/repos \
  -d '{"name":"hermes-backup","private":true,"auto_init":true}'
```

### Backup Script (`~/backup-to-github.sh`)
```bash
#!/bin/bash
set -e
BACKUP_DIR="/tmp/hermes-github-backup"
rm -rf "$BACKUP_DIR" && mkdir -p "$BACKUP_DIR"

# Copy critical files (same as tar backup, but exclude binaries)
cp ~/.hermes/SOUL.md "$BACKUP_DIR/"
cp ~/.hermes/.env "$BACKUP_DIR/" 2>/dev/null || true
cp ~/.hermes/config.yaml "$BACKUP_DIR/" 2>/dev/null || true
cp -r ~/.hermes/memories/ "$BACKUP_DIR/memories/"
cp -r ~/.hermes/cron/ "$BACKUP_DIR/cron/" 2>/dev/null || true

# Skills (only .md files, skip binaries/venv)
mkdir -p "$BACKUP_DIR/skills"
for skill_dir in ~/.hermes/skills/*/; do
    name=$(basename "$skill_dir")
    mkdir -p "$BACKUP_DIR/skills/$name"
    find "$skill_dir" -name "*.md" -exec cp {} "$BACKUP_DIR/skills/$name/" \; 2>/dev/null
done

# Bot configs
mkdir -p "$BACKUP_DIR/itlg-claim"
cp ~/itlg-claim/{config.json,token*.json,claim_state.json,selfie.jpg,bot*.py,tg_gateway.py} "$BACKUP_DIR/itlg-claim/" 2>/dev/null || true

# SUPERAGENT tools
mkdir -p "$BACKUP_DIR/superagent-tools"
cp ~/.hermes/skills/superagent-tools/*.py "$BACKUP_DIR/superagent-tools/" 2>/dev/null || true

# Git push
cd "$BACKUP_DIR"
git init && git add . && git commit -m "Hermes backup $(date '+%Y-%m-%d %H:%M:%S')"
git branch -M main
git remote add origin https://github.com/USERNAME/hermes-backup.git
git push -f origin main

rm -rf "$BACKUP_DIR"
echo "✅ Pushed to https://github.com/USERNAME/hermes-backup"
```

### Restore from GitHub
```bash
git clone https://github.com/USERNAME/hermes-backup.git ~/.hermes-backup
cp -r ~/.hermes-backup/* ~/.hermes/
cp -r ~/.hermes-backup/itlg-claim ~/itlg-claim
```

**Pitfall:** GitHub PAT expires — user needs to regenerate if backup fails with 401.
**Pitfall:** `.env` contains secrets — repo MUST be private.
**Pitfall:** Don't commit `venv/`, `node_modules/`, or `hermes-agent/` — too large, reinstall instead.
