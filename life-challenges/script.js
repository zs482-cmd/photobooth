import { challenges } from './challenges.js';

const $ = (id) => document.getElementById(id);
const machine = $('machineTilt');
const capsules = $('capsules');
const overlay = $('resultOverlay');
const stage = overlay.querySelector('.result-stage');
const drawButton = $('drawBtn');
const storageKey = 'little-adventures-drawn-v1';
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
let drawn = [];
let busy = false;
try {
  const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
  if (Array.isArray(saved)) drawn = [...new Set(saved.filter(n => Number.isInteger(n) && n >= 0 && n < challenges.length))];
} catch { /* Start fresh if storage was corrupted. */ }

function updateCount() { $('drawCount').textContent = drawn.length; }
updateCount();

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

// The whole machine has real depth: pointer movement reveals its side and top.
document.querySelector('.machine-area').addEventListener('pointermove', (event) => {
  if (busy || matchMedia('(max-width: 1100px)').matches) return;
  const rect = event.currentTarget.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width - .5;
  const y = (event.clientY - rect.top) / rect.height - .5;
  machine.style.transform = `rotateY(${-9 + x * 20}deg) rotateX(${2 - y * 9}deg)`;
});
document.querySelector('.machine-area').addEventListener('pointerleave', () => { machine.style.transform = ''; });

const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
async function draw() {
  if (busy) return;
  if (drawn.length === challenges.length) drawn = [];
  const remaining = challenges.map((_, i) => i).filter(i => !drawn.includes(i));
  const choice = remaining[Math.floor(Math.random() * remaining.length)];
  busy = true;
  drawButton.disabled = true;
  drawButton.querySelector('span').textContent = '扭蛋正在旋转…';
  machine.classList.add('mixing');
  await pause(reducedMotion ? 100 : 1600);
  machine.classList.remove('mixing');
  drawButton.querySelector('span').textContent = '扭蛋落下来了…';
  const ball = document.createElement('div');
  ball.className = 'dispensed';
  document.querySelector('.machine-area').append(ball);
  await pause(reducedMotion ? 100 : 1100);
  drawn.push(choice);
  localStorage.setItem(storageKey, JSON.stringify(drawn));
  updateCount();
  $('paperNumber').textContent = `NO. ${String(choice + 1).padStart(3,'0')} / 100`;
  $('paperText').textContent = challenges[choice];
  stage.classList.remove('open');
  overlay.hidden = false;
  ball.remove();
  await pause(reducedMotion ? 30 : 650);
  stage.classList.add('open');
  await pause(reducedMotion ? 30 : 450);
  $('closeResult').focus();
  drawButton.disabled = false;
  drawButton.querySelector('span').textContent = '抽一个挑战';
  busy = false;
}
function close() { overlay.hidden = true; stage.classList.remove('open'); drawButton.focus(); }
drawButton.addEventListener('click', draw);
$('againBtn').addEventListener('click', () => { close(); draw(); });
$('closeResult').addEventListener('click', close);
overlay.querySelector('.result-backdrop').addEventListener('click', close);
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !overlay.hidden) close(); });
$('resetBtn').addEventListener('click', () => { drawn = []; localStorage.removeItem(storageKey); updateCount(); });

if (challenges.length !== 100) console.error(`Expected 100 challenges, got ${challenges.length}`);
