// ════════════════════════════════════════════════════════════
//  MAIN.JS  –  Game loop, input, UI controller
// ════════════════════════════════════════════════════════════

let gs = null;
let animTick = 0;
let paused = false;
let gameLoopId = null;
let lastTickTime = 0;
let inputA = NONE, inputB = NONE;
let savedNameA = 'Alpha', savedNameB = 'Beta';

// ── Screen manager ──
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
}

// ── Starfield background ──
(function initStarfield() {
  const canvas = document.getElementById('bg-canvas');
  const ctx = canvas.getContext('2d');
  let stars = [];

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    stars = Array.from({length: 120}, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.3,
      a: Math.random(),
      speed: Math.random() * 0.005 + 0.002
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const s of stars) {
      s.a += s.speed;
      const alpha = 0.3 + 0.4 * Math.abs(Math.sin(s.a));
      ctx.fillStyle = `rgba(180,180,255,${alpha})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  resize();
  draw();
})();

// ── Keyboard input ──
const KEY_MAP = {
  'w': {dir: UP},    'W': {dir: UP},
  's': {dir: DOWN},  'S': {dir: DOWN},
  'a': {dir: LEFT},  'A': {dir: LEFT},
  'd': {dir: RIGHT}, 'D': {dir: RIGHT},
  'ArrowUp':    {dir: UP},
  'ArrowDown':  {dir: DOWN},
  'ArrowLeft':  {dir: LEFT},
  'ArrowRight': {dir: RIGHT},
};

document.addEventListener('keydown', e => {
  if (!gs || !gs.running) return;
  if (e.key === 'p' || e.key === 'P') { togglePause(); return; }
  if (e.key === 'q' || e.key === 'Q') { quitGame(); return; }
  const m = KEY_MAP[e.key];
  if (!m) return;
  e.preventDefault();
  inputA = m.dir;
});

// ── Mobile touch controls (swipe) ──
let touchStartX = 0, touchStartY = 0;
document.addEventListener('touchstart', e => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
}, {passive: true});
document.addEventListener('touchend', e => {
  if (!gs || !gs.running || paused) return;
  const dx = e.changedTouches[0].clientX - touchStartX;
  const dy = e.changedTouches[0].clientY - touchStartY;
  if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;
  let dir;
  if (Math.abs(dx) > Math.abs(dy)) dir = dx > 0 ? RIGHT : LEFT;
  else                              dir = dy > 0 ? DOWN  : UP;
  // Touch controls Player A by default
  inputA = dir;
}, {passive: true});

// ── Start game ──
function startGame() {
  savedNameA = document.getElementById('nameA').value.trim() || 'Player';

  gs = new GameState();
  initGame(gs, savedNameA);

  const canvas = document.getElementById('game-canvas');
  initCanvas(canvas);

  inputA = NONE;
  paused = false;
  animTick = 0;
  lastTickTime = performance.now();

  showScreen('game-screen');
  updateSidePanel();
  requestAnimationFrame(renderLoop);
  scheduleNextTick();
}

function restartGame() {
  if (gameLoopId) { clearTimeout(gameLoopId); gameLoopId = null; }
  showScreen('lobby-screen');
}

function quitGame() {
  if (gameLoopId) { clearTimeout(gameLoopId); gameLoopId = null; }
  gs = null;
  showScreen('title-screen');
}

function togglePause() {
  paused = !paused;
  document.getElementById('pause-overlay').classList.toggle('hidden', !paused);
  if (!paused) scheduleNextTick();
}

// ── Game tick loop ──
function scheduleNextTick() {
  if (gameLoopId) clearTimeout(gameLoopId);
  gameLoopId = setTimeout(tickLoop, TICK_MS);
}

function tickLoop() {
  if (!gs || !gs.running) return;
  if (paused) return;

  // Apply player input every tick — no throttle
  if (inputA !== NONE) { movePlayer(gs, 0, inputA); inputA = NONE; }

  gameTick(gs);
  updateSidePanel();

  if (gs.gameOver) {
    showGameOver();
    return;
  }
  scheduleNextTick();
}

// ── Render loop (runs at 60fps independent of tick) ──
function renderLoop() {
  if (!gs) return;
  animTick++;
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  renderFrame(ctx, gs, animTick);
  requestAnimationFrame(renderLoop);
}

function updateSidePanel() {
  if (!gs) return;
  const pA = gs.players[0];
  const livesLost = (3 - pA.lives) * 200;

  document.getElementById('tick-display').textContent = gs.tick;
  document.getElementById('name-a').textContent  = pA.name;
  document.getElementById('score-a').textContent = pA.score;
  document.getElementById('score-haunted').textContent = livesLost;

  document.getElementById('lives-name-a').textContent = pA.name;
  document.getElementById('lives-a').innerHTML = '❤️'.repeat(Math.max(0, pA.lives));

  document.getElementById('dots-count').textContent = gs.dotsRemaining;
  const pct = gs.totalDots > 0 ? (gs.dotsRemaining / gs.totalDots * 100) : 0;
  document.getElementById('dots-bar').style.width = pct + '%';
}

// ── Game over screen ──
function showGameOver() {
  if (gameLoopId) { clearTimeout(gameLoopId); gameLoopId = null; }

  const pA = gs.players[0];
  const livesLost = (3 - pA.lives) * 200;
  document.getElementById('go-name-a').textContent  = pA.name;
  document.getElementById('go-score-a').textContent = pA.score;
  document.getElementById('go-score-haunted').textContent = livesLost;

  const wt = document.getElementById('winner-text');
  if (gs.winner === 0) {
    wt.textContent = `🏆 ${pA.name} Wins!`;
    wt.className = 'winner-text winner-a';
  } else if (gs.winner === 1) {
    wt.textContent = '👻 The Haunted Wins!';
    wt.className = 'winner-text winner-b';
  } else {
    wt.textContent = "🤝 It's a Draw!";
    wt.className = 'winner-text winner-draw';
  }

  showScreen('gameover-screen');
}

// [TEMPORARY] Colored ghost row on title screen
(function ghostRowAnim() {
  const canvas = document.getElementById('ghost-row-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const COLORS = ['#FF8888','#FFCCFF','#88FFFF','#FFD199'];
  let t = 0;

  function drawG(x, y, color, tick) {
    const r = 16, bob = Math.sin(tick * 0.08 + x) * 4;
    y += bob;
    ctx.save();
    ctx.shadowColor = color; ctx.shadowBlur = 12;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, Math.PI, 0);
    ctx.lineTo(x + r, y + r);
    for (let i = 3; i >= 0; i--)
      ctx.lineTo(x - r + i * (r * 2 / 3), y + r + (i % 2 === 0 ? 5 : 0));
    ctx.lineTo(x - r, y + r);
    ctx.closePath(); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(x-5, y-3, 4, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(x+5, y-3, 4, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#00f';
    ctx.beginPath(); ctx.arc(x-4, y-3, 2, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(x+6, y-3, 2, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    COLORS.forEach((c, i) => drawG(25 + i * 50, 28, c, t + i * 15));
    t++;
    requestAnimationFrame(draw);
  }
  draw();
})();
