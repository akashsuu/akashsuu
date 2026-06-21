let user = null;
let orbInterval = null;
let questInterval = null;
const COAPI = 'https://coapi.bot.nu';
const COQUETTE_API_KEY = 'cq_694695ad6a42caa20845c0221f5025b177550b0cef51263a';

function getUserId() { return localStorage.getItem('coquette_userId') || ''; }

function toggleDropdown(e) {
  e.stopPropagation();
  document.getElementById('topbarDropdown').classList.toggle('show');
}

document.addEventListener('click', function() {
  document.getElementById('topbarDropdown').classList.remove('show');
});

function toast(msg, type) {
  var el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast ' + (type || 'success') + ' show';
  setTimeout(function() { el.classList.remove('show'); }, 4000);
}

async function api(method, path, opts) {
  opts = opts || {};
  var headers = { 'x-api-key': COQUETTE_API_KEY };
  var body = opts.body;
  if (method && method !== 'GET') {
    headers['Content-Type'] = 'application/json';
    if (!body) body = {};
    if (typeof body === 'object') {
      body.userId = getUserId();
      body = JSON.stringify(body);
    }
  }
  var res = await fetch(COAPI + path, {
    method: method,
    headers: headers,
    body: body,
  });
  var data = await res.json();
  if (!res.ok) throw new Error(data.error || data.message || 'Request failed');
  return data;
}

async function loadUser() {
  var userId = getUserId();
  if (!userId) { window.location.href = '/'; return; }

  var savedName = localStorage.getItem('coquette_username');
  user = { id: userId, username: savedName || userId, avatar: '', hasAccess: true, hasToken: !!localStorage.getItem('coquette_hasToken') };
  var fallback = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQABNjN9GQAAAAlwSFlzAAAWJQAAFiUBSVIk8AAAAA0lEQVQI12P4z8BQDwAEgAF/QualzQAAAABJRU5ErkJggg==';
  document.getElementById('userAvatar').src = user.avatar || fallback;
  document.getElementById('userName').textContent = user.username;
  document.getElementById('topbarAvatar').src = user.avatar || fallback;
  document.getElementById('topbarName').textContent = user.username;
  document.getElementById('userTag').textContent = '@' + user.id;

  document.getElementById('startQuestBtn').disabled = false;
  document.getElementById('welcomeSub').textContent = 'start a quest session';

  if (user.hasToken) {
    document.getElementById('orbsSection').style.display = 'block';
    fetchOrbs();
    orbInterval = setInterval(fetchOrbs, 30000);
  }

  checkQuestStatus();
  questInterval = setInterval(checkQuestStatus, 10000);
  loadFeedback();
}

async function fetchOrbs() {
  try {
    var data = await api('POST', '/api/orbs');
    var count = Number(data.data?.orbs || data.orbs || 0).toLocaleString();
    document.getElementById('orbCount').textContent = count;
    document.getElementById('orbsBig').textContent = count;
    document.getElementById('orbDisplay').style.display = 'flex';
  } catch (err) {
    console.error('Orb fetch failed:', err.message);
  }
}

async function startQuest() {
  try {
    var btn = document.getElementById('startQuestBtn');
    btn.disabled = true;
    btn.textContent = 'STARTING...';

    await api('POST', '/api/quest');
    toast('Quest session queued!');
    document.getElementById('questStatus').textContent = 'queued';
    document.getElementById('questStatus').style.color = 'var(--peach)';

    setTimeout(function() {
      checkQuestStatus();
      if (questInterval) clearInterval(questInterval);
      questInterval = setInterval(checkQuestStatus, 10000);
    }, 2000);
  } catch (err) {
    toast(err.message, 'error');
    document.getElementById('startQuestBtn').disabled = false;
    document.getElementById('startQuestBtn').textContent = '♡ COMPLETE QUESTS';
  }
}

async function checkQuestStatus() {
  try {
    var data = await api('POST', '/api/status');
    if (data.data.progress) {
      var p = data.data.progress;
      document.getElementById('questProgress').style.display = 'block';

      if (p.noQuests) {
        document.getElementById('startQuestBtn').disabled = false;
        document.getElementById('startQuestBtn').textContent = '♡ COMPLETE QUESTS';
        document.getElementById('questStatus').textContent = 'no quests';
        document.getElementById('questStatus').style.color = 'var(--rose)';
        document.getElementById('progressText').textContent = '0 / 0';
        document.getElementById('progressBar').style.width = '0%';
        document.getElementById('progressStatusText').textContent = p.message || 'no quests found';
        document.getElementById('questList').innerHTML = '<div class="quest-item" style="justify-content:center;color:var(--text-dim);">✗ ' + (p.message || 'no valid quests') + '</div>';
        return;
      }

      var quests = p.quests || [];
      var done = quests.filter(function(q) { return q.status === 'done'; }).length;
      var total = quests.length;
      var running = data.data.running;
      var allDone = p.complete || (quests.length > 0 && done === total);

      document.getElementById('startQuestBtn').disabled = running && !allDone;
      document.getElementById('startQuestBtn').textContent = running && !allDone ? '♡ IN PROGRESS' : '♡ COMPLETE QUESTS';
      document.getElementById('questStatus').textContent = running && !allDone ? 'running' : 'complete';
      document.getElementById('questStatus').style.color = running && !allDone ? 'var(--peach)' : 'var(--mint)';
      document.getElementById('progressText').textContent = done + ' / ' + total;
      document.getElementById('progressBar').style.width = (total > 0 ? (done / total) * 100 : 0) + '%';
      document.getElementById('progressStatusText').textContent =
        running && quests.some(function(q) { return q.status === 'running'; }) ? 'running' : done === total ? 'complete' : 'done';

      var listEl = document.getElementById('questList');
      if (quests.length > 0) {
        listEl.innerHTML = quests.map(function(q) {
          var icon = q.status === 'done' ? '✦' : q.status === 'running' ? '♡' : '✗';
          var color = q.status === 'done' ? 'var(--mint)' : q.status === 'running' ? 'var(--peach)' : 'var(--rose)';
          return '<div class="quest-item">' +
            '<span style="color:' + color + ';">' + icon + ' ' + q.name + '</span>' +
            '<span style="color:var(--text-dim);">' + (q.reward || '—') + '</span>' +
            '</div>';
        }).join('');
      }
    } else {
      document.getElementById('questProgress').style.display = 'none';
      document.getElementById('startQuestBtn').disabled = false;
      document.getElementById('startQuestBtn').textContent = '♡ COMPLETE QUESTS';
      document.getElementById('questStatus').textContent = 'inactive';
      document.getElementById('questStatus').style.color = 'var(--text-dim)';
    }
  } catch (err) {
    console.error('Quest status check failed:', err.message);
  }
}

async function loadFeedback() {
  var list = document.getElementById('feedbackList');
  if (list) list.innerHTML = '<span style="color:var(--text-dim);font-size:10px;">no feedback yet</span>';
}

async function logout() {
  localStorage.removeItem('coquette_userId');
  localStorage.removeItem('coquette_username');
  localStorage.removeItem('coquette_hasToken');
  window.location.href = '/';
}

document.addEventListener('DOMContentLoaded', loadUser);
