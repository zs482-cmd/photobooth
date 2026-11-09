import { challenges } from './challenges.js';

const $ = (id) => document.getElementById(id);
const machine = $('machineTilt');
const capsules = $('capsules');
const overlay = $('resultOverlay');
const stage = overlay.querySelector('.result-stage');
const drawButton = $('drawBtn');
const storageKey = 'little-adventures-drawn-v1';
const bookKey = 'little-adventures-book-v1';
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
let drawn = [];
let entries = [];
let currentChoice = null;
let busy = false;
try {
  const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
  if (Array.isArray(saved)) drawn = [...new Set(saved.filter(n => Number.isInteger(n) && n >= 0 && n < challenges.length))];
} catch { /* Start fresh if storage was corrupted. */ }
try {
  const saved = JSON.parse(localStorage.getItem(bookKey) || '[]');
  if (Array.isArray(saved)) entries = saved.filter(item => item && Number.isInteger(item.id) && item.id >= 0 && item.id < challenges.length && typeof item.done === 'boolean');
  entries = [...new Map(entries.map(item => [item.id, item])).values()];
} catch { /* Start with an empty notebook. */ }
function persistBook() { localStorage.setItem(bookKey, JSON.stringify(entries)); }
function updateBookBadge() { $('bookBadge').hidden = entries.length === 0; }
updateBookBadge();

const colors = ['#eaaab3','#a7c1dd','#f7c997','#a9d5c5','#d2b8d9','#f4d78e'];
const spots = [[5,4],[36,2],[68,5],[20,26],[53,25],[79,27],[1,51],[33,50],[65,50],[17,73],[50,73],[77,73]];
spots.forEach(([x,y],i) => {
  const ball = document.createElement('i');
  ball.className = 'mini-capsule';
  ball.style.cssText = `left:${x}%;top:${y}%;--c:${colors[i % colors.length]};--z:${i % 3 * 8}px;--r:${i * 47}deg;--delay:${(i % 5) * -.12}s`;
  capsules.append(ball);
});

for (let i = 0; i < 58; i++) {
  const flake = document.createElement('i');
  flake.className = 'flake';
  const size = 2 + Math.random() * 7;
  flake.style.cssText = `left:${Math.random()*100}%;--s:${size}px;--o:${.3+Math.random()*.7};--blur:${size>6?1:0}px;--d:${8+Math.random()*11}s;--delay:${-Math.random()*19}s;--drift:${-80+Math.random()*160}px`;
  $('snowfall').append(flake);
}

const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
async function draw() {
  if (busy) return;
  if (drawn.length === challenges.length) drawn = [];
  const remaining = challenges.map((_, i) => i).filter(i => !drawn.includes(i));
  const choice = remaining[Math.floor(Math.random() * remaining.length)];
  busy = true;
  drawButton.disabled = true;
  drawButton.setAttribute('aria-label', '扭蛋正在旋转');
  machine.classList.add('mixing');
  await pause(reducedMotion ? 100 : 1600);
  machine.classList.remove('mixing');
  drawButton.setAttribute('aria-label', '扭蛋落下来了');
  const ball = document.createElement('div');
  ball.className = 'dispensed';
  document.querySelector('.machine-area').append(ball);
  await pause(reducedMotion ? 100 : 1100);
  drawn.push(choice);
  localStorage.setItem(storageKey, JSON.stringify(drawn));
  currentChoice = choice;
  $('paperNumber').textContent = `NO. ${String(choice + 1).padStart(3,'0')} / 100`;
  $('paperText').textContent = challenges[choice];
  const alreadySaved = entries.some(item => item.id === choice);
  $('saveBtn').setAttribute('aria-label', alreadySaved ? '查看记录本' : '放进记录本');
  $('saveBtn').title = alreadySaved ? '查看记录本' : '放进记录本';
  stage.classList.remove('open');
  overlay.hidden = false;
  ball.remove();
  await pause(reducedMotion ? 30 : 650);
  stage.classList.add('open');
  await pause(reducedMotion ? 30 : 450);
  $('closeResult').focus();
  drawButton.disabled = false;
  drawButton.setAttribute('aria-label', '转动旋钮，抽一个挑战');
  busy = false;
}
function close() { overlay.hidden = true; stage.classList.remove('open'); drawButton.focus(); }
function renderBook() {
  const list = $('bookList');
  list.replaceChildren();
  const completed = entries.filter(item => item.done).length;
  $('bookSummary').textContent = entries.length ? `已完成 ${completed} 件 · 还有 ${entries.length - completed} 件等着你` : '抽到喜欢的挑战，就收进这里。';
  if (!entries.length) {
    const empty = document.createElement('div');
    empty.className = 'book-empty';
    empty.textContent = '记录本还是空的，先去抽一个挑战吧 ✦';
    list.append(empty);
    return;
  }
  entries.forEach((item, index) => {
    const row = document.createElement('label');
    row.className = 'book-item';
    if (item.done) row.classList.add('done');
    const check = document.createElement('input');
    check.type = 'checkbox';
    check.checked = item.done;
    check.setAttribute('aria-label', `完成：${challenges[item.id]}`);
    check.addEventListener('change', () => { item.done = check.checked; persistBook(); renderBook(); });
    const mark = document.createElement('span');
    mark.className = 'book-check';
    const label = document.createElement('span');
    label.className = 'book-item-text';
    label.textContent = challenges[item.id];
    const number = document.createElement('small');
    number.textContent = `NO. ${String(item.id + 1).padStart(3, '0')}`;
    row.style.setProperty('--row', index);
    row.append(check, mark, label, number);
    list.append(row);
  });
}
function openBook() { renderBook(); $('bookOverlay').hidden = false; $('closeBookBtn').focus(); }
function closeBook() { $('bookOverlay').hidden = true; $('openBookBtn').focus(); }
drawButton.addEventListener('click', draw);
$('againBtn').addEventListener('click', () => { close(); draw(); });
$('saveBtn').addEventListener('click', () => {
  if (currentChoice === null) return;
  if (!entries.some(item => item.id === currentChoice)) { entries.unshift({ id: currentChoice, done: false }); persistBook(); updateBookBadge(); }
  close();
  openBook();
});
$('openBookBtn').addEventListener('click', openBook);
$('closeBookBtn').addEventListener('click', closeBook);
document.querySelector('.book-backdrop').addEventListener('click', closeBook);
$('closeResult').addEventListener('click', close);
overlay.querySelector('.result-backdrop').addEventListener('click', close);
document.addEventListener('keydown', e => { if (e.key !== 'Escape') return; if (!$('bookOverlay').hidden) closeBook(); else if (!overlay.hidden) close(); });

if (challenges.length !== 100) console.error(`Expected 100 challenges, got ${challenges.length}`);
