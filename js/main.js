let user = null;
let orbInterval = null;
let questInterval = null;

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

async function api(path, opts) {
  opts = opts || {};
  var headers = {};
  var body = opts.body;
  if (opts.method && opts.method !== 'GET') {
    headers['Content-Type'] = 'application/json';
    if (!body) body = '{}';
  }
  var res = await fetch(path, {
    headers: headers,
    body: body,
    method: opts.method || 'GET',
  });
  var data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

async function loadUser() {
  try {
    user = await api('/api/user');
    var fallback = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQABNjN9GQAAAAlwSFlzAAAWJQAAFiUBSVIk8AAAAA0lEQVQI12P4z8BQDwAEgAF/QualzQAAAABJRU5ErkJggg==';
    document.getElementById('userAvatar').src = user.avatar || fallback;
    document.getElementById('userName').textContent = user.username;
    document.getElementById('topbarAvatar').src = user.avatar || fallback;
    document.getElementById('topbarName').textContent = user.username;
    document.getElementById('userTag').textContent = '@' + (user.id || 'user');

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
  } catch (err) {
    window.location.href = '/';
  }
}

async function fetchOrbs() {
  try {
    var data = await api('/api/orbs');
    var count = Number(data.orbs).toLocaleString();
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

    await api('/api/quest/start', { method: 'POST' });
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
    var data = await api('/api/quest/status');
    if (data.progress) {
      var p = data.progress;
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

      var allDone = p.complete || (p.quests && p.quests.every(function(q) { return q.status === 'done'; }));
      document.getElementById('startQuestBtn').disabled = data.running && !allDone;
      document.getElementById('startQuestBtn').textContent = data.running && !allDone ? '♡ IN PROGRESS' : '♡ COMPLETE QUESTS';
      document.getElementById('questStatus').textContent = data.running && !allDone ? 'running' : 'complete';
      document.getElementById('questStatus').style.color = data.running && !allDone ? 'var(--peach)' : 'var(--mint)';
      document.getElementById('progressText').textContent = p.done + ' / ' + p.total;
      document.getElementById('progressBar').style.width = (p.total > 0 ? (p.done / p.total) * 100 : 0) + '%';
      document.getElementById('progressStatusText').textContent =
        data.running && p.quests && p.quests.some(function(q) { return q.status === 'running'; }) ? 'running' : p.done === p.total ? 'complete' : 'done';

      var listEl = document.getElementById('questList');
      if (p.quests) {
        listEl.innerHTML = p.quests.map(function(q) {
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
  try {
    var data = await api('/api/feedback');
    var list = document.getElementById('feedbackList');
    if (!data.feedback || data.feedback.length === 0) {
      list.innerHTML = '<span style="color:var(--text-dim);font-size:10px;">no feedback yet</span>';
      return;
    }
    list.innerHTML = data.feedback.map(function(f) {
      var time = '';
      if (f.timestamp) {
        var d = new Date(f.timestamp);
        var now = new Date();
        var diff = (now - d) / 1000;
        if (diff < 60) time = 'now';
        else if (diff < 3600) time = Math.floor(diff / 60) + 'm';
        else if (diff < 86400) time = Math.floor(diff / 3600) + 'h';
        else time = Math.floor(diff / 86400) + 'd';
      }
      return '<div class="fb-item">' +
        '<div class="fb-item-top">' +
        '<img class="fb-avatar" src="' + f.avatar + '">' +
        '<span class="fb-author">' + f.author + '</span>' +
        (time ? '<span class="fb-time">' + time + '</span>' : '') +
        '</div>' +
        '<div class="fb-content">' + f.content + '</div>' +
        '</div>';
    }).join('');
  } catch {
    document.getElementById('feedbackList').innerHTML = '<span style="color:var(--text-dim);font-size:10px;">failed to load</span>';
  }
}

async function logout() {
  try {
    await api('/api/logout', { method: 'POST' });
  } catch {}
  window.location.href = '/';
}

document.addEventListener('DOMContentLoaded', loadUser);
