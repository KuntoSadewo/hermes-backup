#!/usr/bin/env node
const fs = require('fs');
const https = require('https');

const acc = JSON.parse(fs.readFileSync('/home/ubuntu/gram-network-vps/config/accounts/ardhisadewo.json'));
const BASE = 'https://gram-proxy.sadewo.workers.dev';
const TG_CHAT_ID = '480316338';

// Read proxy key from wrangler
const wf = fs.readFileSync('/home/ubuntu/gram-network-bot/proxy/wrangler.toml', 'utf8');
const m = wf.match(/SECRET\s*=\s*"([^"]+)"/);
const PXKEY = m ? m[1] : '';

// Read tg token
const ic = JSON.parse(fs.readFileSync('/home/ubuntu/itlg-claim/config.json', 'utf8'));
const TGKEY = ic.tgBotToken || '';

console.log('Proxy key len:', PXKEY.length, '| TG key len:', TGKEY.length);

function postForm(ep, init, extra) {
  const params = new URLSearchParams({ initData: init, ...(extra||{}) });
  const body = params.toString();
  return new Promise((resolve, reject) => {
    const u = new URL(BASE + ep);
    const req = https.request({
      method: 'POST', hostname: u.hostname, path: u.pathname,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
        'Authorization': 'Bearer ' + PXKEY,
        'User-Agent': 'Mozilla/5.0 (Linux; Android 13) GramNetworkBot/1.0',
        'Origin': 'https://app.gramnetwork.online',
      }, timeout: 20000,
    }, (res) => {
      let buf = ''; res.on('data', c => buf += c);
      res.on('end', () => { try { resolve(JSON.parse(buf)); } catch { resolve({raw: buf}); } });
    });
    req.on('error', reject); req.on('timeout', () => req.destroy(new Error('timeout')));
    req.write(body); req.end();
  });
}

function getJson(ep, init) {
  return new Promise((resolve, reject) => {
    const url = BASE + ep + '?initData=' + encodeURIComponent(init);
    const u = new URL(url);
    const req = https.request({
      method: 'GET', hostname: u.hostname, path: u.pathname + u.search,
      headers: {
        'Authorization': 'Bearer ' + PXKEY,
        'User-Agent': 'Mozilla/5.0 (Linux; Android 13) GramNetworkBot/1.0',
        'Origin': 'https://app.gramnetwork.online',
      }, timeout: 20000,
    }, (res) => {
      let buf = ''; res.on('data', c => buf += c);
      res.on('end', () => { try { resolve(JSON.parse(buf)); } catch { resolve({raw: buf}); } });
    });
    req.on('error', reject); req.on('timeout', () => req.destroy(new Error('timeout')));
    req.end();
  });
}

async function tgSend(msg) {
  return new Promise((resolve) => {
    const data = JSON.stringify({ chat_id: TG_CHAT_ID, text: msg, parse_mode: 'HTML' });
    const u = new URL('https://api.telegram.org/bot' + TGKEY + '/sendMessage');
    const req = https.request({ method: 'POST', hostname: u.hostname, path: u.pathname, headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }, timeout: 10000 }, (res) => { let b=''; res.on('data',c=>b+=c); res.on('end',()=>{console.log('  TG:', res.statusCode); resolve(true);}); });
    req.on('error', (e) => { console.log('  TG err:', e.message); resolve(false); });
    req.write(data); req.end();
  });
}

const sleep = ms => new Promise(r => setTimeout(r, ms));
const TASK_DELAY = 20000; // 20 detik antar task (server rate limit)

async function main() {
  console.log('\n=== Getting Tasks ===');
  const tasks = await getJson('/api/get_tasks.php', acc.initData);
  console.log(JSON.stringify(tasks, null, 2));
  
  if (tasks.success && tasks.tasks) {
    const pending = tasks.tasks.filter(t => !t.completed);
    console.log('\nPending: ' + pending.length + ' tasks');
    
    let done = 0;
    let totalReward = 0;
    
    for (const t of pending) {
      const title = t.title || t.name || t.id || 'Unknown';
      const reward = t.reward || 0;
      const ttype = t.type || '?';
      console.log('\n-> [' + ttype + '] ' + title + ' | +' + reward + ' GRM');
      
      const result = await postForm('/api/complete_task.php', acc.initData, { task_id: t.id });
      console.log('   Status: ' + JSON.stringify(result).slice(0, 150));
      
      if (result.success !== false) {
        done++;
        totalReward += reward;
      }
      
      await sleep(TASK_DELAY);
    }
    
    if (done > 0) {
      await tgSend('<b>Gram Tasks Done!</b>\n' + done + ' tasks\n+' + totalReward + ' GRM');
    }
  } else {
    console.log('No tasks or failed to load');
  }
  
  // Final status
  const status = await getJson('/api/get_user_data.php', acc.initData);
  console.log('\n=== Final Status ===');
  console.log(JSON.stringify(status, null, 2));
  
  if (status.success) {
    const u = status.user || {};
    await tgSend('<b>Gram Status</b>\n@' + (u.username || '?') + '\nBalance: ' + (u.balance || 0) + ' GRM\nMining: ' + (u.mining_active ? 'Active' : 'Inactive'));
  }
}

main().catch(e => console.error('FATAL:', e));
