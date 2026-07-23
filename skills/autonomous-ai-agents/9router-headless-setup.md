# 9Router Headless VPS Setup

## Problem
9Router CLI (`9router`) uses a system tray icon (systray2). On headless VPS:
1. CLI detects no TTY → forces tray mode
2. Tray init fails or parent process exits
3. Server starts ("Ready in 0ms") then immediately exits

Symptoms:
```text
✓ Ready in 0ms
[DB] Driver: better-sqlite3
Exiting...
Exiting...
```

## Solution: Run Next.js Server Directly

### Step 1: Install
```bash
npm install -g 9router
9router --version  # verify install
```

### Step 2: Start Virtual Display
```bash
# Install Xvfb if needed
apt-get install -y xvfb

# Start virtual display
Xvfb :99 -screen 0 1024x768x24 &
```

### Step 3: Run Server Directly
```bash
cd $(npm root -g)/9router/app
PORT=20128 HOSTNAME=127.0.0.1 DISPLAY=:99 \
  node --max-old-space-size=4096 custom-server.js
```

**Important:** This process may also exit silently. Use background mode with watch patterns:
```bash
# In Hermes terminal:
background=true, watch_patterns=["Ready in", "listening", "started"]
```

If process dies immediately:
1. Check Xvfb is running: `ps aux | grep Xvfb`
2. Check port not in use: `lsof -i :20128`
3. Check memory: `free -h` (needs ~4GB)
4. Try running with `DISPLAY=:99` explicitly

### Step 4: Verify
```bash
curl -s http://localhost:20128/v1/models | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(f'Models: {len(d.get(\"data\", []))}')
"
```

## Hermes Settings API

9Router has a built-in API for configuring Hermes directly:

```bash
# Read current Hermes config
curl -s http://localhost:20128/api/cli-tools/hermes-settings

# Write new config
curl -X POST http://localhost:20128/api/cli-tools/hermes-settings \
  -H "Content-Type: application/json" \
  -d '{
    "baseUrl": "http://127.0.0.1:20128/v1",
    "model": "xiaomi-mimo/mimo-v2.5-pro"
  }'
```

This writes directly to `~/.hermes/config.yaml`. **Backup config first!**

## SQLite Provider Configuration

### Database Location
```text
~/.9router/db/data.sqlite
```

### Key Tables
```sql
-- Provider connections
providerConnections (
  id TEXT PRIMARY KEY,
  provider TEXT,        -- 'openai-compatible', 'anthropic', 'openai', etc.
  authType TEXT,        -- 'api-key', 'oauth'
  name TEXT,            -- display name
  priority INTEGER,
  isActive INTEGER,     -- 1 = active
  data TEXT,            -- JSON with baseUrl, apiKey, models
  createdAt TEXT,
  updatedAt TEXT
)

-- Settings (password, config)
settings (id INTEGER, data TEXT)

-- Usage tracking
usageHistory, usageDaily, requestDetails
```

### Add Provider via Python
```python
import sqlite3, json, time, uuid

db = sqlite3.connect(os.path.expanduser('~/.9router/db/data.sqlite'))
cursor = db.cursor()

conn_id = str(uuid.uuid4())
now = time.strftime('%Y-%m-%dT%H:%M:%SZ')
data = json.dumps({
    'baseUrl': 'https://api.example.com/v1',
    'apiKey': 'sk-xxxxx',
    'models': ['model-1', 'model-2']
})

cursor.execute('''
    INSERT INTO providerConnections 
    (id, provider, authType, name, priority, isActive, data, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
''', (conn_id, 'openai-compatible', 'api-key', 'My Provider', 1, 1, data, now, now))

db.commit()
db.close()
```

### Default Password
When no password is set, default is `123456`.
Login: `POST /api/auth/login` with `{"password": "123456"}`

### Change Password
Via dashboard: Settings → Change Password
Via DB: `settings` table, data JSON contains `{"requireLogin": true, "password": "hashed"}`

## Free Tier Providers

MiMo Code Free and OpenCode Free show as "Ready" in the dashboard but require **OAuth login via browser**:
1. Open `http://VPS_IP:20128` in local browser
2. Go to Providers → Free Tier Providers
3. Click on provider → Login with OAuth
4. After auth, provider becomes active

This cannot be done headless — must expose port and use local browser.

## Model Routing

9Router routes by model ID prefix:
```text
xiaomi-mimo/mimo-v2.5-pro  → routes to xiaomi-mimo provider
opencode-go/mimo-v2.5-pro  → routes to opencode-go provider
deepseek/deepseek-chat      → routes to deepseek provider
gpt-4.1                     → routes to openai provider
```

Custom providers need unique prefixes that don't clash with built-in ones.

### Available MiMo Models (as of Jul 2026)
```text
xiaomi-mimo/mimo-v2.5-pro
xiaomi-mimo/mimo-v2.5
xiaomi-mimo/mimo-v2-omni
xiaomi-mimo/mimo-v2-flash
xiaomi-tokenplan/mimo-v2.5-pro
xiaomi-tokenplan/mimo-v2.5
opencode-go/mimo-v2.5       (free)
opencode-go/mimo-v2.5-pro   (free)
mmf/mimo-auto
clinepass/cline-pass/mimo-v2.5
clinepass/cline-pass/mimo-v2.5-pro
```

## Restart Required After Provider Changes

After adding providers via SQLite or dashboard, 9Router must be restarted:
```bash
# Kill existing process
pkill -f "custom-server.js"

# Restart
cd $(npm root -g)/9router/app
PORT=20128 HOSTNAME=127.0.0.1 DISPLAY=:99 \
  node --max-old-space-size=4096 custom-server.js
```

`/v1/models` returns empty list until restart.

## Hermes Dashboard Integration

9Router has built-in Hermes configuration:
1. Open dashboard → CLI Tools
2. Click "Hermes Agent"
3. Select endpoint (default: `http://127.0.0.1:20128/v1`)
4. Set default model (e.g. `xiaomi-mimo/mimo-v2.5-pro`)
5. Click "Apply"

This writes directly to `~/.hermes/config.yaml`:
```yaml
model:
  default: "xiaomi-mimo/mimo-v2.5-pro"
  provider: "custom"
  base_url: "http://127.0.0.1:20128/v1"
```

**⚠️ WARNING:** This OVERWRITES the existing model section. Backup config first:
```bash
cp ~/.hermes/config.yaml ~/.hermes/config.yaml.bak.$(date +%Y%m%d_%H%M%S)
```
