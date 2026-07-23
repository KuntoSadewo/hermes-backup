#!/bin/bash
# Gram Network: check tasks + auto-claim non-TG tasks
# Silent if nothing new. Notifies if TG join needed or tasks claimed.

cd /home/ubuntu/gram-network-vps

RESULT=$(node -e "
const fs = require('fs');
const https = require('https');
const acc = JSON.parse(fs.readFileSync('config/accounts/ardhisadewo.json'));
const wf = fs.readFileSync('/home/ubuntu/gram-network-bot/proxy/wrangler.toml', 'utf8');
const m = wf.match(/SECRET\\\\s*=\\\\s*\"([^\"]+)\"/);
const PXKEY = m ? m[1] : '';
const BASE = 'https://gram-proxy.sadewo.workers.dev';

function getJson(ep, init) {
  return new Promise((resolve, reject) => {
    const url = BASE + ep + '?initData=' + encodeURIComponent(init);
    const u = new URL(url);
    const req = https.request({ method: 'GET', hostname: u.hostname, path: u.pathname + u.search, headers: { 'Authorization': 'Bearer ' + PXKEY, 'Origin': 'https://app.gramnetwork.online' }, timeout: 15000 }, (res) => { let b=''; res.on('data', c=>b+=c); res.on('end', ()=>{ try { resolve(JSON.parse(b)); } catch { resolve({raw:b}); } }); });
    req.on('error', reject);
    req.end();
  });
}

function postForm(ep, init, extra) {
  const params = new URLSearchParams({ initData: init, ...(extra||{}) });
  const body = params.toString();
  return new Promise((resolve, reject) => {
    const u = new URL(BASE + ep);
    const req = https.request({ method: 'POST', hostname: u.hostname, path: u.pathname, headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(body), 'Authorization': 'Bearer ' + PXKEY, 'Origin': 'https://app.gramnetwork.online' }, timeout: 15000 }, (res) => { let b=''; res.on('data', c=>b+=c); res.on('end', ()=>{ try { resolve(JSON.parse(b)); } catch { resolve({raw:b}); } }); });
    req.on('error', reject);
    req.write(body); req.end();
  });
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  const [tasksResp, statusResp] = await Promise.all([
    getJson('/api/get_tasks.php', acc.initData),
    getJson('/api/get_user_data.php', acc.initData)
  ]);
  
  const pending = (tasksResp.tasks || []).filter(t => !t.is_completed);
  const tgTasks = pending.filter(t => t.type === 'telegram_chat');
  const otherTasks = pending.filter(t => t.type !== 'telegram_chat');
  const u = statusResp.user || {};
  const msgs = [];
  
  // Auto-claim non-TG tasks
  if (otherTasks.length > 0) {
    let claimed = 0, earned = 0;
    for (const t of otherTasks) {
      const res = await postForm('/api/complete_task.php', acc.initData, { task_id: t.id });
      if (res.success) { claimed++; earned += parseFloat(t.reward); }
      await sleep(3000);
    }
    if (claimed > 0) msgs.push('Auto-claimed ' + claimed + ' tasks (+' + earned.toFixed(2) + ' GRM)');
  }
  
  // Notify about TG join tasks
  if (tgTasks.length > 0) {
    msgs.push('TG JOIN NEEDED (' + tgTasks.length + '):');
    tgTasks.forEach(t => msgs.push('• ' + t.title + ' +' + t.reward + ' GRM'));
    msgs.push(tgTasks.map(t => t.link).join('\\n'));
  }
  
  // Final balance
  const finalStatus = await getJson('/api/get_user_data.php', acc.initData);
  const fu = finalStatus.user || {};
  
  if (msgs.length > 0) {
    msgs.push('\\n💰 Balance: ' + (fu.total_balance||0) + ' GRM | Mining: ' + (fu.mining_status||'?') + ' | Left: ' + (fu.time_left||'?'));
    console.log(msgs.join('\\n'));
  }
  // Silent if nothing
}
main().catch(e => {});
" 2>/dev/null)

if [ -n "$RESULT" ]; then
  echo "$RESULT"
fi
