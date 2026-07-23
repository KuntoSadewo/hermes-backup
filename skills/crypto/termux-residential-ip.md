# Termux — Running Claim Bots on Android (Residential IP)

## Why Termux?
Some APIs (Gram Network, etc.) use Cloudflare WAF that blocks datacenter/VPS IPs.
Residential IPs (home WiFi, mobile data) pass Cloudflare without challenge.
**Termux = Linux terminal on Android = residential IP for free.**

## Install
- **Recommended:** F-Droid version (https://f-droid.org/packages/com.termux/)
- Play Store version may be outdated
- Also install **Termux:Boot** from F-Droid for auto-start on reboot

## Setup
```bash
pkg update && pkg upgrade
pkg install nodejs git
```

## Quick Install (Gram Network Node.js)
```bash
pkg update -y && pkg install -y nodejs git
git clone https://github.com/exgun007/gramnetwork-bot.git ~/gram-network-bot
cd ~/gram-network-bot
node grammine.js   # menu → option 9 → add account
```

## Quick Install (Gram Network Python)
```bash
pkg update -y && pkg install -y python git
git clone https://github.com/exgun007/gramnetwork-bot.git ~/gram-network-bot
cd ~/gram-network-bot
# (but may need: pip install requests)
```

## Commands
```bash
node grammine.js              # interactive menu
node grammine.js run full     # full run (mine+claim+task)
node grammine.js loop         # loop forever (background mining)
```

## Auto-Start on Reboot (Termux:Boot)
1. Install Termux:Boot from F-Droid
2. Create boot script:
```bash
mkdir -p ~/.termux/boot
cat > ~/.termux/boot/start-gram.sh << 'EOF'
#!/data/data/com.termux/files/usr/bin/bash
cd ~/gram-network-bot && node grammine.js loop
EOF
chmod +x ~/.termux/boot/start-gram.sh
```
3. Open Termux:Boot once to register it as a boot receiver

## Background Running
```bash
# Option 1: Just close Termux (notification stays)
node grammine.js loop

# Option 2: Termux background (Ctrl+A, D to detach if using screen)
pkg install screen
screen -S gram
node grammine.js loop
# Ctrl+A, D to detach
# screen -r gram to reattach
```

## Pitfalls
- **initData expires ~24h** — need to refresh manually from Telegram app
- **Termux battery optimization** — Android may kill Termux in background
  - Settings → Battery → Termux → Unrestricted
- **Storage permission** — `termux-setup-storage` to access shared storage
- **Node.js version** — `pkg install nodejs` gives LTS, should be fine
- **Don't use Play Store Termux** — may be outdated, use F-Droid

## Multi-Account
```bash
# Add multiple accounts
node grammine.js add account1 "initData_string_1"
node grammine.js add account2 "initData_string_2"
node grammine.js accounts  # list all
```

## Alias (convenience)
```bash
echo 'alias gram="cd ~/gram-network-bot && node grammine.js"' >> ~/.bashrc
source ~/.bashrc
gram  # now just type 'gram' to open
```
