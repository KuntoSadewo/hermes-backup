#!/bin/bash
# Backup Hermes + All Bots to GitHub (full VPS migration ready)
set -e

BACKUP_DIR="/tmp/hermes-github-backup"
rm -rf "$BACKUP_DIR"
mkdir -p "$BACKUP_DIR"

echo "📦 Preparing backup..."

# ─── Hermes Core ───
echo "  → Hermes core"
cp ~/.hermes/SOUL.md "$BACKUP_DIR/" 2>/dev/null || true
cp ~/.hermes/.env "$BACKUP_DIR/" 2>/dev/null || true
cp ~/.hermes/config.yaml "$BACKUP_DIR/" 2>/dev/null || true
cp -r ~/.hermes/memories/ "$BACKUP_DIR/memories/" 2>/dev/null || true
cp -r ~/.hermes/hooks/ "$BACKUP_DIR/hooks/" 2>/dev/null || true
cp -r ~/.hermes/cron/ "$BACKUP_DIR/cron/" 2>/dev/null || true

# ─── Skills (md only) ───
echo "  → Skills"
mkdir -p "$BACKUP_DIR/skills"
for skill_dir in ~/.hermes/skills/*/; do
    skill_name=$(basename "$skill_dir")
    mkdir -p "$BACKUP_DIR/skills/$skill_name"
    find "$skill_dir" -name "*.md" -exec cp {} "$BACKUP_DIR/skills/$skill_name/" \; 2>/dev/null
done

# ─── ITLG Bot ───
echo "  → ITLG bot"
mkdir -p "$BACKUP_DIR/itlg-claim"
cp ~/itlg-claim/config.json "$BACKUP_DIR/itlg-claim/" 2>/dev/null || true
cp ~/itlg-claim/token.json "$BACKUP_DIR/itlg-claim/" 2>/dev/null || true
cp ~/itlg-claim/token-backup.json "$BACKUP_DIR/itlg-claim/" 2>/dev/null || true
cp ~/itlg-claim/claim_state.json "$BACKUP_DIR/itlg-claim/" 2>/dev/null || true
cp ~/itlg-claim/selfie.jpg "$BACKUP_DIR/itlg-claim/" 2>/dev/null || true
cp ~/itlg-claim/bot_v2_2.py "$BACKUP_DIR/itlg-claim/" 2>/dev/null || true
cp ~/itlg-claim/bot.py "$BACKUP_DIR/itlg-claim/" 2>/dev/null || true
cp ~/itlg-claim/tg_gateway.py "$BACKUP_DIR/itlg-claim/" 2>/dev/null || true
cp ~/itlg-claim/requirements.txt "$BACKUP_DIR/itlg-claim/" 2>/dev/null || true

# ─── Gram Network VPS (fixed version with smart claim) ───
echo "  → Gram Network VPS"
mkdir -p "$BACKUP_DIR/gram-network-vps"
cp ~/gram-network-vps/grammine.js "$BACKUP_DIR/gram-network-vps/" 2>/dev/null || true
cp ~/gram-network-vps/do-tasks.js "$BACKUP_DIR/gram-network-vps/" 2>/dev/null || true
cp -r ~/gram-network-vps/config/ "$BACKUP_DIR/gram-network-vps/" 2>/dev/null || true

# ─── Gram Network Bot (proxy worker) ───
echo "  → Gram Network proxy"
mkdir -p "$BACKUP_DIR/gram-network-bot"
cp -r ~/gram-network-bot/proxy/ "$BACKUP_DIR/gram-network-bot/" 2>/dev/null || true

# ─── Systemd Services ───
echo "  → Systemd services"
mkdir -p "$BACKUP_DIR/systemd"
sudo cp /etc/systemd/system/gram-miner.service "$BACKUP_DIR/systemd/" 2>/dev/null || true
sudo cp /etc/systemd/system/itlg-claim.service "$BACKUP_DIR/systemd/" 2>/dev/null || true
sudo chown ubuntu:ubuntu "$BACKUP_DIR/systemd/"*.service 2>/dev/null || true

# ─── Helper Scripts ───
echo "  → Helper scripts"
cp ~/backup-to-github.sh "$BACKUP_DIR/" 2>/dev/null || true
cp ~/update-gram-init.sh "$BACKUP_DIR/" 2>/dev/null || true
cp ~/.hermes/scripts/check-tasks.sh "$BACKUP_DIR/" 2>/dev/null || true

# ─── .gitignore ───
cat > "$BACKUP_DIR/.gitignore" << 'EOF'
*.log
*.pyc
__pycache__/
venv/
node_modules/
.DS_Store
EOF

# ─── Push to GitHub ───
echo "📤 Pushing to GitHub..."
cd "$BACKUP_DIR"
git init
git add .
git commit -m "Hermes backup $(date '+%Y-%m-%d %H:%M:%S WIB')"
git branch -M main
git remote add origin https://github.com/KuntoSadewo/hermes-backup.git 2>/dev/null || true
git push -f origin main

echo ""
echo "✅ Backup complete!"
echo "📁 Repo: https://github.com/KuntoSadewo/hermes-backup"
echo "🔒 Private: Yes"
