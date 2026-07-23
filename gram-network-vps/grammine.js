#!/usr/bin/env node
// Gram Network Mining Bot — Multi-account v2
// MODIFIED: Uses Cloudflare Worker Proxy + Telegram Notifications
// Base URL: https://gram-proxy.sadewo.workers.dev

const fs = require('fs');
const path = require('path');
const https = require('https');
const readline = require('readline');

// ── PROXY CONFIG ──
const BASE = 'https://gram-proxy.sadewo.workers.dev';
// Read PROXY_SECRET from wrangler.toml
const wranglerContent = fs.readFileSync('/home/ubuntu/gram-network-bot/proxy/wrangler.toml', 'utf8');
const secretMatch = wranglerContent.match(/SECRET\s*=\s*"([^"]+)"/);
const PROXY_SECRET = secretMatch ? secretMatch[1] : '';

// ── TELEGRAM NOTIF (shared dengan ITLG bot) ──
const itlgConfig = JSON.parse(fs.readFileSync('/home/ubuntu/itlg-claim/config.json', 'utf8'));
const TG_BOT_TOKEN = itlgConfig.tgBotToken || '';
const TG_CHAT_ID = itlgConfig.tgChatId || '480316338';

console.log(`[INIT] PROXY_SECRET: ${PROXY_SECRET ? '✅ loaded' : '❌ missing'}`);
console.log(`[INIT] TG_BOT_TOKEN: ${TG_BOT_TOKEN ? '✅ loaded' : '❌ missing'}`);
console.log(`[INIT] TG_CHAT_ID: ${TG_CHAT_ID}`);

const ROOT = __dirname;
const CFG_DIR = path.join(ROOT, 'config');
const ACC_DIR = path.join(CFG_DIR, 'accounts');
const SETTINGS_FILE = path.join(CFG_DIR, 'settings.json');
const STATE_FILE = path.join(CFG_DIR, 'state.json');
const LOG_DIR = path.join(ROOT, 'logs');

const DEFAULT_SETTINGS = {
  intervalMinutes: 240,
  jitterSeconds: 30,
  parallel: 1,
  delayBetweenAccountsMs: 2500,
  claimOnly: false,
  autoTaskOnFull: true,
  skipExternalTasks: false,
  skipJoinTasks: true,
  skipTaskTypes: [],
  taskCooldownHours: 0,
  dailyCooldownHours: 24,
  chainAfterClaim: true,
};

// ── Colors ──
const C = {
  reset: '\x1b[0m', bold: '\x1b[1m', dim: '\x1b[2m',
  red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m',
  blue: '\x1b[34m', magenta: '\x1b[35m', cyan: '\x1b[36m',
};
const ok = (s) => `${C.green}✔${C.reset} ${s}`;
const err = (s) => `${C.red}✘${C.reset} ${s}`;
const info = (s) => `${C.cyan}ℹ${C.reset} ${s}`;

function ts() { return toWIB(new Date()); }
function toWIB(date) {
  const d = date ? new Date(date) : new Date();
  if (isNaN(d.getTime())) return String(date || '');
  const wib = new Date(d.getTime() + 7 * 3600 * 1000);
  return wib.toISOString().slice(0, 19).replace('T', ' ');
}
function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

// ── Telegram Notification ──
async function sendTelegram(message) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      chat_id: TG_CHAT_ID,
      text: message,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    });
    
    const u = new URL(`https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`);
    const req = https.request({
      method: 'POST', hostname: u.hostname, path: u.pathname,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      }, timeout: 10000,
    }, (res) => {
      let buf = ''; res.on('data', c => buf += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(buf);
          if (json.ok) {
            console.log(info('Telegram sent'));
            resolve(true);
          } else {
            console.log(err(`Telegram failed: ${json.description}`));
            resolve(false);
          }
        } catch {
          resolve(false);
        }
      });
    });
    req.on('error', (e) => { console.log(err(`Telegram error: ${e.message}`)); resolve(false); });
    req.on('timeout', () => { req.destroy(); resolve(false); });
    req.write(data); req.end();
  });
}

function formatNotif(type, acc, data) {
  const time = ts() + ' WIB';
  switch (type) {
    case 'claim':
      return `⛏ <b>Gram Claimed!</b>\n👤 ${acc.name} (@${data.username || '?'})\n💰 +${data.amount || 0} GRM\n📊 Balance: ${data.total_balance || '?'} GRM\n⏰ ${time}`;
    case 'start':
      return `🚀 <b>Mining Started</b>\n👤 ${acc.name} (@${data.username || '?'})\n⏱ Duration: ${data.duration || '4h'}\n⏰ ${time}`;
    case 'daily':
      return `📅 <b>Daily Claimed!</b>\n👤 ${acc.name} (@${data.username || '?'})\n💰 +${data.amount || 0} GRM\n⏰ ${time}`;
    case 'task':
      return `✅ <b>Task Done!</b>\n👤 ${acc.name} (@${data.username || '?'})\n📋 ${data.task || '?'}\n💰 +${data.reward || 0} GRM\n⏰ ${time}`;
    case 'error':
      return `❌ <b>Gram Error</b>\n👤 ${acc.name}\n⚠️ ${data.error || 'Unknown'}\n⏰ ${time}`;
    case 'status':
      return `📊 <b>Gram Status</b>\n👤 ${acc.name} (@${data.username || '?'})\n💰 Balance: ${data.total_balance || 0} GRM\n⛏ Mining: ${data.mining ? 'Active' : 'Inactive'}\n⏰ ${time}`;
    default:
      return `ℹ️ <b>Gram ${type}</b>\n👤 ${acc.name}\n${JSON.stringify(data).slice(0, 200)}\n⏰ ${time}`;
  }
}

// ── Logger ──
function getLogFile(name) {
  if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
  return path.join(LOG_DIR, `${name}.log`);
}
function log(name, line, alsoConsole = true) {
  const line2 = `[${ts()}] ${line}`;
  fs.appendFileSync(getLogFile(name), line2 + '\n');
  if (alsoConsole) console.log(`[${ts()}] ${line}`);
}

// ── Config ──
function ensureDirs() {
  if (!fs.existsSync(ACC_DIR)) fs.mkdirSync(ACC_DIR, { recursive: true });
  if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
}
function loadSettings() {
  if (!fs.existsSync(SETTINGS_FILE)) {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(DEFAULT_SETTINGS, null, 2));
    return { ...DEFAULT_SETTINGS };
  }
  return { ...DEFAULT_SETTINGS, ...JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8')) };
}
function loadAccounts(onlyEnabled = true) {
  ensureDirs();
  const files = fs.readdirSync(ACC_DIR).filter((f) => f.endsWith('.json'));
  const accs = files.map((f) => {
    const p = path.join(ACC_DIR, f);
    try { return JSON.parse(fs.readFileSync(p, 'utf8')); }
    catch { return null; }
  }).filter(Boolean);
  if (onlyEnabled) return accs.filter((a) => a.enabled !== false);
  return accs;
}
function saveAccount(acc) {
  fs.writeFileSync(path.join(ACC_DIR, `${acc.name}.json`), JSON.stringify(acc, null, 2));
}

// ── State ──
function loadState() {
  if (!fs.existsSync(STATE_FILE)) return { accounts: {} };
  try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); }
  catch { return { accounts: {} }; }
}
function saveState(s) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(s, null, 2));
}
function getAccState(state, name) {
  if (!state || typeof state !== 'object') state = {};
  if (!state.accounts || typeof state.accounts !== 'object') state.accounts = {};
  if (!state.accounts[name] || typeof state.accounts[name] !== 'object') state.accounts[name] = {};
  return state.accounts[name];
}
function cooldownPassed(state, name, kind, hours) {
  const acc = getAccState(state, name);
  const last = acc[kind];
  if (!last) return true;
  const lastMs = new Date(last).getTime();
  return (Date.now() - lastMs) >= hours * 3600 * 1000;
}
function markCooldown(state, name, kind) {
  const acc = getAccState(state, name);
  acc[kind] = new Date().toISOString();
  saveState(state);
}

// ── HTTP helpers (via Cloudflare Proxy) ──
function postForm(endpoint, initData, extraFields = {}) {
  const params = new URLSearchParams({ initData, ...extraFields });
  const body = params.toString();
  return new Promise((resolve, reject) => {
    const u = new URL(BASE + endpoint);
    const req = https.request({
      method: 'POST', hostname: u.hostname, path: u.pathname,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
        'Authorization': `Bearer ${PROXY_SECRET}`,
        'User-Agent': 'Mozilla/5.0 (Linux; Android 13) GramNetworkBot/1.0',
        'Origin': 'https://app.gramnetwork.online',
        'Referer': 'https://app.gramnetwork.online/',
      }, timeout: 20000,
    }, (res) => {
      let buf = ''; res.on('data', c => buf += c);
      res.on('end', () => { try { resolve({ status: res.statusCode, json: JSON.parse(buf) }); } catch { resolve({ status: res.statusCode, json: null, raw: buf }); } });
    });
    req.on('error', reject); req.on('timeout', () => req.destroy(new Error('timeout')));
    req.write(body); req.end();
  });
}
function getJson(endpoint, initData) {
  return new Promise((resolve, reject) => {
    const url = BASE + endpoint + (endpoint.includes('?') ? '&' : '?') + 'initData=' + encodeURIComponent(initData);
    const u = new URL(url);
    const req = https.request({
      method: 'GET', hostname: u.hostname, path: u.pathname + u.search,
      headers: {
        'Authorization': `Bearer ${PROXY_SECRET}`,
        'User-Agent': 'Mozilla/5.0 (Linux; Android 13) GramNetworkBot/1.0',
        'Origin': 'https://app.gramnetwork.online',
        'Referer': 'https://app.gramnetwork.online/',
      }, timeout: 20000,
    }, (res) => {
      let buf = ''; res.on('data', c => buf += c);
      res.on('end', () => { try { resolve({ status: res.statusCode, json: JSON.parse(buf) }); } catch { resolve({ status: res.statusCode, json: null, raw: buf }); } });
    });
    req.on('error', reject); req.on('timeout', () => req.destroy(new Error('timeout')));
    req.end();
  });
}

// ── API actions ──
async function checkStatus(acc) {
  try { const r = await getJson('/api/get_user_data.php', acc.initData); return r.json || { success: false }; }
  catch (e) { return { success: false, message: e.message }; }
}

async function startMining(acc) {
  try { const r = await postForm('/api/start_mining.php', acc.initData); return r.json || { success: false }; }
  catch (e) { return { success: false, message: e.message }; }
}

async function claimMining(acc) {
  try { const r = await postForm('/api/claim_mining.php', acc.initData); return r.json || { success: false }; }
  catch (e) { return { success: false, message: e.message }; }
}

async function getTasks(acc) {
  try { const r = await getJson('/api/get_tasks.php', acc.initData); return r.json || { success: false }; }
  catch (e) { return { success: false, message: e.message }; }
}

async function completeTask(acc, taskId) {
  try { const r = await postForm('/api/complete_task.php', acc.initData, { task_id: taskId }); return r.json || { success: false }; }
  catch (e) { return { success: false, message: e.message }; }
}

async function claimDaily(acc) {
  try { const r = await postForm('/api/claim_daily.php', acc.initData); return r.json || { success: false }; }
  catch (e) { return { success: false, message: e.message }; }
}

// ── Energy boost ──
async function boostEnergy(acc) {
  try { const r = await postForm('/api/boost_energy.php', acc.initData); return r.json || { success: false }; }
  catch (e) { return { success: false, message: e.message }; }
}

// ── Mining cycle (smart claim + energy handling) ──
async function runMiningCycle(acc) {
  const status = await checkStatus(acc);
  if (!status.success) {
    log(acc.name, err(`Status check failed: ${JSON.stringify(status).slice(0, 100)}`));
    await sendTelegram(formatNotif('error', acc, { error: status.message || 'Status check failed' }));
    return { success: false };
  }

  const user = status.user || {};
  const miningStatus = (user.mining_status || '').toLowerCase();
  const timeLeftSec = parseInt(user.time_left_seconds) || 0;
  log(acc.name, info(`User: ${user.username || 'unknown'} | Balance: ${user.total_balance || 0} GRM | Mining: ${miningStatus} | TimeLeft: ${timeLeftSec}s`));

  let claimed = false;
  let claimAmount = 0;

  // ── STEP 1: Handle active mining ──
  if (miningStatus === 'active' && timeLeftSec > 0) {
    // Mining still running — wait for it to finish
    const waitSec = timeLeftSec + 30; // +30s buffer
    log(acc.name, info(`Mining active, waiting ${waitSec}s (${Math.round(waitSec/60)}m) for it to finish...`));
    await sleep(waitSec * 1000);

    // Now try to claim
    log(acc.name, info('Mining should be done, claiming...'));
    const claim = await claimMining(acc);
    if (claim.success) {
      claimAmount = claim.amount || 0;
      log(acc.name, ok(`Claimed! ${claimAmount} GRM`));
      await sendTelegram(formatNotif('claim', acc, { 
        username: user.username, 
        amount: claimAmount, 
        balance: Number(user.total_balance) + claimAmount 
      }));
      claimed = true;
    } else {
      log(acc.name, info(`Claim after wait: ${claim.message || 'failed'}`));
    }
  } else if (miningStatus === 'inactive' || miningStatus === '' || miningStatus === 'completed') {
    // Mining finished but not claimed yet — claim now
    log(acc.name, info('Mining finished/Inactive, trying to claim...'));
    const claim = await claimMining(acc);
    if (claim.success) {
      claimAmount = claim.amount || 0;
      log(acc.name, ok(`Claimed! ${claimAmount} GRM`));
      await sendTelegram(formatNotif('claim', acc, { 
        username: user.username, 
        amount: claimAmount, 
        balance: Number(user.total_balance) + claimAmount 
      }));
      claimed = true;
    } else {
      log(acc.name, info(`Claim: ${claim.message || 'nothing to claim'}`));
    }
  } else {
    // Active but no time_left? Try claim anyway
    log(acc.name, info(`Mining status: ${miningStatus}, trying claim...`));
    const claim = await claimMining(acc);
    if (claim.success) {
      claimAmount = claim.amount || 0;
      log(acc.name, ok(`Claimed! ${claimAmount} GRM`));
      await sendTelegram(formatNotif('claim', acc, { 
        username: user.username, 
        amount: claimAmount, 
        balance: Number(user.total_balance) + claimAmount 
      }));
      claimed = true;
    } else {
      log(acc.name, info(`Claim: ${claim.message || 'not ready'}`));
    }
  }

  // ── STEP 2: Start new mining session ──
  log(acc.name, info('Starting mining...'));
  const start = await startMining(acc);
  if (start.success) {
    log(acc.name, ok(`Mining started! Duration: ${start.duration || '4h'}`));
    await sendTelegram(formatNotif('start', acc, { 
      username: user.username, 
      duration: start.duration || '4h' 
    }));
  } else {
    const startMsg = (start.message || '').toLowerCase();
    log(acc.name, info(`Start: ${start.message || 'already active'}`));
    
    // Handle "Not enough energy" — try boost
    if (startMsg.includes('energy') || startMsg.includes('not enough')) {
      log(acc.name, info('Energy depleted, trying boost...'));
      const boost = await boostEnergy(acc);
      if (boost.success) {
        log(acc.name, ok('Energy boosted! Retrying start...'));
        await sleep(2000);
        const retry = await startMining(acc);
        if (retry.success) {
          log(acc.name, ok(`Mining started after boost! Duration: ${retry.duration || '4h'}`));
          await sendTelegram(formatNotif('start', acc, { 
            username: user.username, 
            duration: retry.duration || '4h' 
          }));
        } else {
          log(acc.name, info(`Retry after boost: ${retry.message || 'failed'}`));
          await sendTelegram(formatNotif('error', acc, { error: `Energy low + boost failed: ${retry.message}` }));
        }
      } else {
        log(acc.name, info(`Boost failed: ${boost.message || 'no boost available'}`));
        await sendTelegram(formatNotif('error', acc, { error: `Not enough energy, boost unavailable` }));
      }
    }
  }

  return { success: true, claimed, claimAmount, balance: user.total_balance };
}

async function runDaily(acc) {
  log(acc.name, info('Claiming daily...'));
  const daily = await claimDaily(acc);
  if (daily.success) {
    log(acc.name, ok(`Daily claimed! ${daily.amount || 0} GRM`));
    const status = await checkStatus(acc);
    await sendTelegram(formatNotif('daily', acc, { 
      username: status.user?.username, 
      amount: daily.amount || 0 
    }));
  } else {
    log(acc.name, info(`Daily: ${daily.message || 'already claimed'}`));
  }
}

async function runTasks(acc) {
  const tasks = await getTasks(acc);
  if (!tasks.success || !tasks.tasks) {
    log(acc.name, info('No tasks available'));
    return;
  }

  for (const task of tasks.tasks) {
    if (task.completed) continue;
    log(acc.name, info(`Completing task: ${task.title || task.id}...`));
    const result = await completeTask(acc, task.id);
    if (result.success) {
      log(acc.name, ok(`Task done! +${task.reward || 0} GRM`));
      const status = await checkStatus(acc);
      await sendTelegram(formatNotif('task', acc, { 
        username: status.user?.username, 
        task: task.title || task.id, 
        reward: task.reward || 0 
      }));
    } else {
      log(acc.name, info(`Task: ${result.message || 'failed'}`));
    }
    await sleep(2000);
  }
}

// ── Status report ──
async function sendStatusReport() {
  const accs = loadAccounts();
  for (const acc of accs) {
    const status = await checkStatus(acc);
    if (status.success) {
      const user = status.user || {};
      await sendTelegram(formatNotif('status', acc, {
        username: user.username,
        balance: user.total_balance || 0,
        mining: user.mining_active || false,
      }));
    }
  }
}

// ── Main ──
async function main() {
  const args = process.argv.slice(2);
  const cmd = args[0] || 'menu';

  if (cmd === 'add') {
    const name = args[1];
    const initData = args[2];
    if (!name || !initData) {
      console.log('Usage: node grammine.js add <name> <initData>');
      return;
    }
    ensureDirs();
    saveAccount({ name, initData, enabled: true });
    console.log(ok(`Account '${name}' added!`));
    return;
  }

  if (cmd === 'list') {
    const accs = loadAccounts(false);
    console.log(`\nAccounts (${accs.length}):`);
    for (const acc of accs) {
      const status = await checkStatus(acc);
      const user = status.user || {};
      console.log(`  ${acc.enabled !== false ? '✓' : '✗'} ${acc.name}: ${user.username || '?'} | ${user.total_balance || 0} GRM`);
    }
    return;
  }

  if (cmd === 'status') {
    await sendStatusReport();
    console.log(ok('Status report sent!'));
    return;
  }

  if (cmd === 'run') {
    const mode = args[1] || 'full';
    const accs = loadAccounts();
    for (const acc of accs) {
      log(acc.name, info(`Running ${mode}...`));
      if (mode === 'mine' || mode === 'full') await runMiningCycle(acc);
      if (mode === 'daily' || mode === 'full') await runDaily(acc);
      if (mode === 'task' || mode === 'full') await runTasks(acc);
      await sleep(2000);
    }
    return;
  }

  if (cmd === 'loop') {
    const settings = loadSettings();
    // Check every 15 min — actual waiting happens inside runMiningCycle
    const checkIntervalMs = 15 * 60 * 1000;
    console.log(ok(`Loop mode: check every 15 min (smart claim handles timing)`));
    await sendTelegram(`🚀 <b>Gram Miner Started (Smart Mode)</b>\n⏰ Check every 15min, auto-wait for mining finish\n📍 VPS + Cloudflare Proxy`);
    
    while (true) {
      const accs = loadAccounts();
      for (const acc of accs) {
        await runMiningCycle(acc);
        await sleep(settings.delayBetweenAccountsMs);
      }
      
      const nextRun = new Date(Date.now() + checkIntervalMs);
      console.log(info(`Next check: ${toWIB(nextRun)} WIB`));
      await sleep(checkIntervalMs);
    }
  }

  // Interactive menu
  console.log('\n=== Gram Network Miner (VPS + Proxy + TG Notif) ===');
  console.log('1. Run once (full)');
  console.log('2. Run once (mine only)');
  console.log('3. Run once (daily only)');
  console.log('4. Run once (tasks only)');
  console.log('5. Loop forever');
  console.log('6. Add account');
  console.log('7. List accounts');
  console.log('8. Send status report');
  console.log('0. Exit');
  
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.question('\nChoice: ', async (choice) => {
    rl.close();
    switch (choice) {
      case '1': {
        const accs = loadAccounts();
        for (const acc of accs) {
          await runMiningCycle(acc);
          await runDaily(acc);
          await runTasks(acc);
        }
        break;
      }
      case '2': {
        const accs = loadAccounts();
        for (const acc of accs) await runMiningCycle(acc);
        break;
      }
      case '3': {
        const accs = loadAccounts();
        for (const acc of accs) await runDaily(acc);
        break;
      }
      case '4': {
        const accs = loadAccounts();
        for (const acc of accs) await runTasks(acc);
        break;
      }
      case '5': {
        const settings = loadSettings();
        const intervalMs = settings.intervalMinutes * 60 * 1000;
        console.log(ok(`Loop mode: mining every ${settings.intervalMinutes} min`));
        await sendTelegram(`🚀 <b>Gram Miner Started</b>\n⏰ Every ${settings.intervalMinutes} min\n📍 VPS + Cloudflare Proxy`);
        
        while (true) {
          const accs = loadAccounts();
          for (const acc of accs) {
            await runMiningCycle(acc);
            await sleep(settings.delayBetweenAccountsMs);
          }
          
          const waitTime = intervalMs + Math.random() * settings.jitterSeconds * 1000;
          const nextRun = new Date(Date.now() + waitTime);
          console.log(info(`Next run: ${toWIB(nextRun)} WIB`));
          await sleep(waitTime);
        }
      }
      case '6': {
        const rl2 = readline.createInterface({ input: process.stdin, output: process.stdout });
        rl2.question('Account name: ', (name) => {
          rl2.question('initData: ', (data) => {
            ensureDirs();
            saveAccount({ name, initData: data, enabled: true });
            console.log(ok(`Account '${name}' added!`));
            rl2.close();
          });
        });
        break;
      }
      case '7': {
        const accs = loadAccounts(false);
        console.log(`\nAccounts (${accs.length}):`);
        for (const acc of accs) {
          const status = await checkStatus(acc);
          const user = status.user || {};
          console.log(`  ${acc.enabled !== false ? '✓' : '✗'} ${acc.name}: ${user.username || '?'} | ${user.total_balance || 0} GRM`);
        }
        break;
      }
      case '8': {
        await sendStatusReport();
        console.log(ok('Status report sent!'));
        break;
      }
      case '0': return;
      default: console.log('Invalid choice');
    }
  });
}

main().catch(console.error);
