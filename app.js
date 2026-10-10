'use strict';
/* TaskFlow: Time Management and Task Prioritization System (front-end)
   Data is stored in the browser (localStorage). A Java Servlet + JDBC backend
   can replace load()/save() later without changing the UI code. */

const KEY = 'taskflow.tasks.v1';
const $ = id => document.getElementById(id);
let tasks = load();
let filter = 'all';

/* ---------- Storage ---------- */
function load() {
  try { const d = JSON.parse(localStorage.getItem(KEY)); if (Array.isArray(d)) return d; } catch (e) { /* ignore */ }
  return seed();
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(tasks)); } catch (e) { /* storage blocked */ } }
function localInput(d) { return new Date(d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 16); }
function seed() {
  const at = h => localInput(new Date(Date.now() + h * 36e5));
  const mk = (title, priority, category, h) => ({ id: Math.random().toString(36).slice(2), title, priority, category, due: at(h), done: false, notified: false });
  return [mk('Submit Java project report', 'High', 'Project', 20), mk('Design database schema', 'High', 'Project', 40),
          mk('Revise JDBC notes', 'Medium', 'Study', 90), mk('Evening walk', 'Low', 'Personal', 200)];
}

/* ---------- Priority logic ---------- */
const daysLeft = t => (new Date(t.due) - Date.now()) / 864e5;
// Higher score = do sooner: priority weight + urgency bonus
function score(t) {
  const d = daysLeft(t);
  return { High: 30, Medium: 20, Low: 10 }[t.priority] + (d < 0 ? 40 : d <= 1 ? 30 : d <= 3 ? 15 : 0);
}
function quadrant(t) {
  const urgent = daysLeft(t) <= 2, important = t.priority !== 'Low';
  return urgent && important ? 'do' : important ? 'plan' : urgent ? 'hand' : 'drop';
}

/* ---------- Helpers ---------- */
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = s => new Date(s).toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
function toast(msg) {
  const el = document.createElement('div'); el.className = 'toast'; el.textContent = msg;
  $('toasts').appendChild(el); setTimeout(() => el.remove(), 6000);
}

/* ---------- Rendering ---------- */
function render() {
  const q = $('search').value.trim().toLowerCase();
  const rows = tasks
    .filter(t => (filter === 'all' || (filter === 'done') === t.done) && t.title.toLowerCase().includes(q))
    .sort((a, b) => a.done - b.done || score(b) - score(a));
  $('list').innerHTML = rows.length ? rows.map(t => {
    const d = daysLeft(t), tag = t.done ? 'Completed' : d < 0 ? 'Overdue' : d <= 1 ? 'Due soon' : '';
    return `<li class="task ${t.priority} ${t.done ? 'done' : ''}">
      <button class="tick" data-id="${t.id}" data-act="tick" aria-label="Toggle done">${t.done ? '✔' : ''}</button>
      <div><div class="t">${esc(t.title)}</div><div class="meta">${t.priority} priority, ${esc(t.category)}, ${fmt(t.due)} ${tag ? '(' + tag + ')' : ''}</div></div>
      <button class="del" data-id="${t.id}" data-act="del" aria-label="Delete task">✕</button></li>`;
  }).join('') : '<li class="empty">No tasks here. Add one using the form.</li>';

  // Stats
  const today = new Date().toDateString(), pend = tasks.filter(t => !t.done);
  const nDone = tasks.length - pend.length, nDue = pend.filter(t => new Date(t.due).toDateString() === today).length,
        nLate = pend.filter(t => daysLeft(t) < 0).length;
  $('sTotal').textContent = tasks.length; $('sToday').textContent = nDue; $('sDone').textContent = nDone; $('sLate').textContent = nLate;
  $('cubeDone').textContent = nDone; $('cubeDue').textContent = nDue; $('cubeLate').textContent = nLate;
  const pct = tasks.length ? Math.round(nDone / tasks.length * 100) : 0;
  $('bar').style.width = pct + '%'; document.querySelector('.progress').setAttribute('aria-valuenow', pct);

  // Priority matrix
  ['do', 'plan', 'hand', 'drop'].forEach(k => {
    const items = pend.filter(t => quadrant(t) === k).sort((a, b) => score(b) - score(a));
    $('q-' + k).innerHTML = items.length ? items.map(t => `<li>${esc(t.title)}</li>`).join('') : '<li style="list-style:none;opacity:.6">Nothing here</li>';
  });
}

/* ---------- Events ---------- */
$('taskForm').addEventListener('submit', e => {
  e.preventDefault();
  const title = $('title').value.trim(); if (!title) return;
  tasks.push({ id: Math.random().toString(36).slice(2), title, priority: $('priority').value, category: $('category').value, due: $('due').value, done: false, notified: false });
  save(); render(); $('title').value = ''; toast('Task added');
});
$('list').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.act === 'del') tasks = tasks.filter(t => t.id !== b.dataset.id);
  else { const t = tasks.find(t => t.id === b.dataset.id); if (t) t.done = !t.done; }
  save(); render();
});
document.querySelectorAll('.chip').forEach(c => c.addEventListener('click', () => {
  document.querySelectorAll('.chip').forEach(x => x.classList.remove('on')); c.classList.add('on'); filter = c.dataset.f; render();
}));
$('search').addEventListener('input', render);

/* 3D tilt on hover for cards */
document.querySelectorAll('.tilt').forEach(el => {
  el.addEventListener('mousemove', e => {
    const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
    el.style.transform = `perspective(600px) rotateX(${-y * 14}deg) rotateY(${x * 14}deg) translateZ(8px)`;
  });
  el.addEventListener('mouseleave', () => { el.style.transform = ''; });
});

/* ---------- Live clock and reminders (runs on a timer) ---------- */
function tick() {
  const n = new Date();
  $('clock').textContent = n.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  $('clockDate').textContent = n.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });
}
function checkReminders() {
  let changed = false;
  tasks.forEach(t => {
    const mins = (new Date(t.due) - Date.now()) / 6e4;
    if (!t.done && !t.notified && mins >= 0 && mins <= 60) { toast(`Reminder: "${t.title}" is due in ${Math.ceil(mins)} min`); t.notified = true; changed = true; }
  });
  if (changed) save();
}
$('due').value = localInput(new Date(Date.now() + 864e5));
tick(); setInterval(tick, 1000);
checkReminders(); setInterval(() => { checkReminders(); render(); }, 30000);
render();
