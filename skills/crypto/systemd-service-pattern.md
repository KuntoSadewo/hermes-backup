# systemd Service for Node.js/Python Bots

## When to Use
- Bot must survive VPS reboots
- Bot must auto-restart on crash
- Bot runs in loop mode (never exits normally)

## Quick Template (Node.js)

```ini
[Unit]
Description=<Bot Name>
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/<bot-dir>
ExecStart=<NODE_PATH> <SCRIPT_PATH> <ARGS>
Restart=always
RestartSec=30
Environment=NODE_ENV=production
Environment=PATH=/home/ubuntu/.local/bin:/usr/local/bin:/usr/bin:/bin

[Install]
WantedBy=multi-user.target
```

## Quick Template (Python)

```ini
[Unit]
Description=<Bot Name>
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/<bot-dir>
ExecStart=/home/ubuntu/<bot-dir>/venv/bin/python <SCRIPT_PATH>
Restart=always
RestartSec=30

[Install]
WantedBy=multi-user.target
```

## Setup Commands

```bash
# 1. Discover correct paths
which node      # e.g., /home/ubuntu/.local/bin/node
which python3   # e.g., /home/ubuntu/.hermes/hermes-agent/venv/bin/python3

# 2. Create service (sudo required)
sudo tee /etc/systemd/system/<name>.service > /dev/null << 'EOF'
... template above ...
EOF

# 3. Enable + start
sudo systemctl daemon-reload
sudo systemctl enable <name>
sudo systemctl start <name>

# 4. Verify
sudo systemctl status <name> --no-pager
```

## Common Pitfalls

| Symptom | Cause | Fix |
|---------|-------|-----|
| `exit-code 203/EXEC` | Wrong `ExecStart` path | Run `which node` / `which python3` to find actual path |
| Service starts then exits immediately | Script needs interactive input | Use CLI arg (`script.js loop`) or pipe (`echo "5" \| node script.js`) |
| `Failed to restart: Unit not found` | Typo in service name or forgot `daemon-reload` | Check name + run `sudo systemctl daemon-reload` |
| Service works but stops after SSH disconnect | Using `nohup` instead of systemd | Use systemd service, not nohup |

## Management Commands

```bash
sudo systemctl start <name>       # start
sudo systemctl stop <name>        # stop
sudo systemctl restart <name>     # restart
sudo systemctl status <name>      # status
sudo systemctl disable <name>     # remove from auto-start
sudo systemctl enable <name>      # add to auto-start

# Logs
journalctl -u <name> -f                    # live follow
journalctl -u <name> --since "1h ago"      # last hour
journalctl -u <name> -n 50                 # last 50 lines
```

## Verified Example: Gram Network Miner

```ini
[Unit]
Description=Gram Network Miner Bot
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/gram-network-vps
ExecStart=/home/ubuntu/.local/bin/node /home/ubuntu/gram-network-vps/grammine.js loop
Restart=always
RestartSec=30
Environment=NODE_ENV=production
Environment=PATH=/home/ubuntu/.local/bin:/usr/local/bin:/usr/bin:/bin

[Install]
WantedBy=multi-user.target
```

Key details:
- Node at `/home/ubuntu/.local/bin/node` (not `/usr/bin/node`)
- `grammine.js loop` = CLI shortcut for loop mode (avoids interactive menu)
- `RestartSec=30` = 30s cooldown before restart (prevents crash loops)
