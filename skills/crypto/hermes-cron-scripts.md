# Hermes Cron Job Script Patterns

## Script Path Rules
- Scripts must be in `~/.hermes/scripts/`
- Reference by **relative filename only**, NOT absolute path
- Copy or symlink project scripts to `~/.hermes/scripts/`

```bash
# ✅ Correct
script: "check-tasks.sh"

# ❌ Wrong — absolute path fails with "Script not found"
script: "/home/ubuntu/gram-network-vps/scripts/check-tasks.sh"
```

## Setup Pattern
```bash
# Copy project script to Hermes scripts dir
cp /home/ubuntu/project/scripts/my-script.sh ~/.hermes/scripts/
chmod +x ~/.hermes/scripts/my-script.sh
```

## Silent Output Pattern (Watchdog)
Script outputs nothing when nothing to report → cron stays silent (no notification spam):
```bash
#!/bin/bash
RESULT=$(node -e "..." 2>/dev/null)
if [ -n "$RESULT" ]; then
  echo "$RESULT"  # Only output when there's something to say
fi
# Empty output = silent = no notification
```

## Cron Creation Pattern
```python
cronjob(
    action='create',
    schedule='every 1h',
    name='my-checker',
    script='check-tasks.sh',       # relative to ~/.hermes/scripts/
    no_agent=True,                  # skip LLM, just run script
    deliver='origin'                # send output to current chat
)
```

## Auto-Claim + Notify Pattern
For tasks that mix auto-completable and manual-action items:
1. Auto-claim all "others" type tasks silently
2. Notify user about "telegram_chat" type tasks (need manual join)
3. Silent if nothing new

```javascript
// In script:
const otherTasks = pending.filter(t => t.type !== 'telegram_chat');
const tgTasks = pending.filter(t => t.type === 'telegram_chat');

// Auto-claim non-TG
for (const t of otherTasks) { await claim(t); }

// Notify about TG join needed
if (tgTasks.length > 0) {
  console.log('TG JOIN NEEDED:');
  tgTasks.forEach(t => console.log('• ' + t.title + ' | ' + t.link));
}
// No output = silent
```
