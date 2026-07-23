#!/bin/bash
# Update Gram Network initData
# Usage: ./update-gram-init.sh "PASTE_INIT_DATA_HERE"

CONFIG="/home/ubuntu/gram-network-vps/config/accounts/ardhisadewo.json"

if [ -z "$1" ]; then
  echo "❌ Usage: $0 '<initData>'"
  echo ""
  echo "Cara ambil initData:"
  echo "1. Buka Gram Network Mini App di Telegram"
  echo "2. Klik ⋮ → Open in Browser / Web View"
  echo "3. Buka DevTools (F12) → Network tab"
  echo "4. Refresh, cari request ke get_user_data.php"
  echo "5. Copy nilai 'initData' dari request body/params"
  exit 1
fi

NEW_INIT="$1"

# Backup dulu
cp "$CONFIG" "${CONFIG}.bak.$(date +%Y%m%d%H%M%S)"

# Update initData di JSON
node -e "
const fs = require('fs');
const cfg = JSON.parse(fs.readFileSync('$CONFIG', 'utf8'));
cfg.initData = '$NEW_INIT';
fs.writeFileSync('$CONFIG', JSON.stringify(cfg, null, 2));
console.log('✅ initData updated!');
console.log('Auth date:', decodeURIComponent('$NEW_INIT').match(/auth_date=(\d+)/)?.[1] || 'unknown');
"

# Restart miner
sudo systemctl restart gram-miner.service
echo "✅ Miner restarted!"

# Check status
sleep 2
sudo systemctl status gram-miner.service --no-pager | head -5
