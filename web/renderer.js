// ════════════════════════════════════════════════════════════
//  RENDERER  –  HTML5 Canvas drawing for Pac-Man
// ════════════════════════════════════════════════════════════

const CELL = 28; // px per cell
const CANVAS_W = COLS * CELL;
const CANVAS_H = ROWS * CELL;

// Colours
const C_WALL      = '#1a1aff';
const C_WALL_DARK = '#0000aa';
const C_DOT       = '#ffff99';
const C_POWER     = '#FFD700';
const C_BG        = '#000010';
const C_TEAM_A    = '#00FF7F';
const C_TEAM_B    = '#FF4444';
const C_FRIGHT    = '#2121de';
const C_EATEN     = '#aaaaaa';
const GHOST_COLORS = ['#FF0000','#FFB8FF','#00FFFF','#FFB852'];

function initCanvas(canvas) {
  canvas.width  = CANVAS_W;
  canvas.height = CANVAS_H;
}

// ── Draw one frame ──
function renderFrame(ctx, gs, animTick) {
  ctx.fillStyle = C_BG;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Grid
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const x = c * CELL, y = r * CELL;
      const t = gs.grid[r][c];
      if (t === WALL) {
        drawWall(ctx, gs, r, c, x, y);
      } else if (t === DOT) {
        ctx.fillStyle = C_DOT;
        ctx.beginPath();
        ctx.arc(x + CELL/2, y + CELL/2, 2.5, 0, Math.PI*2);
        ctx.fill();
      } else if (t === POWER) {
        const pulse = 0.7 + 0.3 * Math.sin(animTick * 0.15);
        ctx.fillStyle = C_POWER;
        ctx.shadowColor = C_POWER;
        ctx.shadowBlur = 10 * pulse;
        ctx.beginPath();
        ctx.arc(x + CELL/2, y + CELL/2, 5 * pulse, 0, Math.PI*2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }
  }

  // Ghosts
  for (const g of gs.ghosts) {
    drawGhost(ctx, g, animTick);
  }

  // Players
  for (const p of gs.players) {
    if (!p.alive) continue;
    drawPacman(ctx, p, animTick);
  }
}

function drawWall(ctx, gs, r, c, x, y) {
  ctx.fillStyle = C_WALL;
  ctx.fillRect(x, y, CELL, CELL);
  // Inner highlight
  ctx.fillStyle = C_WALL_DARK;
  ctx.fillRect(x + 2, y + 2, CELL - 4, CELL - 4);
  // Blue glow border
  ctx.strokeStyle = '#4444ff';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, CELL - 1, CELL - 1);
}

function drawPacman(ctx, p, animTick) {
  const x = p.pos.c * CELL + CELL / 2;
  const y = p.pos.r * CELL + CELL / 2;
  const r = CELL / 2 - 2;
  const mouthAngle = 0.25 * Math.abs(Math.sin(animTick * 0.3));

  // Direction angle
  const dirAngles = [-Math.PI/2, 0, Math.PI/2, Math.PI, 0];
  const angle = dirAngles[p.dir] || 0;

  const color = p.powered
    ? `hsl(${(animTick * 8) % 360}, 100%, 60%)`
    : (p.team === TEAM_A ? C_TEAM_A : C_TEAM_B);

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  // Glow
  ctx.shadowColor = color;
  ctx.shadowBlur = p.powered ? 20 : 10;

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, r, mouthAngle * Math.PI, (2 - mouthAngle) * Math.PI);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;

  // Eye
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(r * 0.3, -r * 0.5, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  // Lives dots below
  for (let i = 0; i < p.lives; i++) {
    ctx.fillStyle = p.team === TEAM_A ? C_TEAM_A : C_TEAM_B;
    ctx.beginPath();
    ctx.arc(p.pos.c * CELL + 5 + i * 8, p.pos.r * CELL + CELL - 3, 2.5, 0, Math.PI*2);
    ctx.fill();
  }
}

function drawGhost(ctx, g, animTick) {
  const x = g.pos.c * CELL;
  const y = g.pos.r * CELL;
  const cx = x + CELL / 2, cy = y + CELL / 2;
  const r = CELL / 2 - 3;

  let bodyColor, eyeColor;
  if (g.state === FRIGHTENED) {
    const flash = g.stateTimer < 10 && Math.floor(animTick / 5) % 2 === 0;
    bodyColor = flash ? '#ffffff' : C_FRIGHT;
    eyeColor  = '#ffffff';
  } else if (g.state === EATEN_STATE) {
    // Just draw eyes
    drawGhostEyes(ctx, cx, cy, r, '#ffffff');
    return;
  } else {
    bodyColor = GHOST_COLORS[g.id];
    eyeColor  = '#ffffff';
  }

  ctx.save();
  ctx.shadowColor = bodyColor;
  ctx.shadowBlur = 8;

  // Body
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.arc(cx, cy - 2, r, Math.PI, 0);
  // Wavy bottom
  const waveY = y + CELL - 4;
  const segments = 3;
  const segW = (CELL - 6) / segments;
  ctx.lineTo(x + CELL - 3, waveY);
  for (let i = segments; i >= 0; i--) {
    const wx = x + 3 + i * segW;
    const wy = waveY + (i % 2 === 0 ? 4 : 0) + Math.sin(animTick * 0.2 + i) * 2;
    ctx.lineTo(wx, wy);
  }
  ctx.lineTo(x + 3, waveY);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;

  drawGhostEyes(ctx, cx, cy - 2, r, eyeColor);
  ctx.restore();
}

function drawGhostEyes(ctx, cx, cy, r, color) {
  const eyeOffX = r * 0.35, eyeOffY = r * 0.1;
  const eyeR = r * 0.28, pupilR = r * 0.14;
  for (const side of [-1, 1]) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx + side * eyeOffX, cy - eyeOffY, eyeR, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#00f';
    ctx.beginPath();
    ctx.arc(cx + side * eyeOffX + 1, cy - eyeOffY + 1, pupilR, 0, Math.PI*2);
    ctx.fill();
  }
}
