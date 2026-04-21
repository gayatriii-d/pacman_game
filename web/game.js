// ════════════════════════════════════════════════════════════
//  TWO-TEAM PAC-MAN  –  JavaScript port of C++ engine
//  Data Structures: vector(Array), list(Array), map(Map),
//  stack(Array), queue(Array), priority_queue(MinHeap),
//  set(Set), unordered_map(Map), 2D array
//  Algorithms: BFS, A*, DFS-flee
// ════════════════════════════════════════════════════════════

// ── Constants ──
const ROWS = 21, COLS = 21;
const TICK_MS = 150;
const SCORE_DOT = 10, SCORE_POWER = 50, SCORE_GHOST = 200;
const POWER_TICKS = 35;
const SCATTER_TICKS = 28, CHASE_TICKS = 80, FRIGHTEN_TICKS = 40, EATEN_TICKS = 20;

// Tile types
const EMPTY = 0, WALL = 1, DOT = 2, POWER = 3, WARP = 4;
// Directions
const UP = 0, RIGHT = 1, DOWN = 2, LEFT = 3, NONE = 4;
// Teams
const TEAM_A = 0, TEAM_B = 1;
// Ghost states
const SCATTER = 0, CHASE = 1, FRIGHTENED = 2, EATEN_STATE = 3;

// ── Base Map ──
const BASE_MAP = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,3,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,3,1],
  [1,2,1,1,2,1,1,1,2,1,1,1,2,1,1,1,2,1,1,2,1],
  [1,2,1,1,2,1,1,1,2,1,1,1,2,1,1,1,2,1,1,2,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,2,1,2,1,1,1,1,1,1,1,2,1,2,1,1,2,1],
  [1,2,2,2,2,1,2,2,2,2,1,2,2,2,2,1,2,2,2,2,1],
  [1,1,1,1,2,1,1,1,0,1,1,1,0,1,1,1,2,1,1,1,1],
  [1,1,1,1,2,1,0,0,0,0,0,0,0,0,0,1,2,1,1,1,1],
  [1,1,1,1,2,1,0,1,1,0,0,0,1,1,0,1,2,1,1,1,1],
  [4,0,0,0,2,0,0,1,0,0,0,0,0,1,0,0,2,0,0,0,4],
  [1,1,1,1,2,1,0,1,1,1,1,1,1,1,0,1,2,1,1,1,1],
  [1,1,1,1,2,1,0,0,0,0,0,0,0,0,0,1,2,1,1,1,1],
  [1,1,1,1,2,1,0,1,1,1,1,1,1,1,0,1,2,1,1,1,1],
  [1,2,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,2,1,1,1,2,1,1,1,2,1,1,1,2,1,1,2,1],
  [1,3,2,1,2,2,2,2,2,2,0,2,2,2,2,2,2,1,2,3,1],
  [1,1,2,1,2,1,2,1,1,1,1,1,1,1,2,1,2,1,2,1,1],
  [1,2,2,2,2,1,2,2,2,2,1,2,2,2,2,1,2,2,2,2,1],
  [1,2,1,1,1,1,1,1,2,1,1,1,2,1,1,1,1,1,1,2,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

// ── Helpers ──
function posKey(r, c) { return r * 100 + c; }
function manhattan(a, b) { return Math.abs(a.r - b.r) + Math.abs(a.c - b.c); }
function dirOffset(d) {
  return [{r:-1,c:0},{r:0,c:1},{r:1,c:0},{r:0,c:-1},{r:0,c:0}][d];
}
function warpPos(r, c) {
  if (r < 0) r = ROWS - 1; if (r >= ROWS) r = 0;
  if (c < 0) c = COLS - 1; if (c >= COLS) c = 0;
  return {r, c};
}

// ── MinHeap for A* (DATA STRUCTURE 6: priority_queue) ──
class MinHeap {
  constructor() { this.h = []; }
  push(item) {
    this.h.push(item);
    let i = this.h.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.h[p].cost <= this.h[i].cost) break;
      [this.h[p], this.h[i]] = [this.h[i], this.h[p]]; i = p;
    }
  }
  pop() {
    const top = this.h[0];
    const last = this.h.pop();
    if (this.h.length > 0) {
      this.h[0] = last;
      let i = 0;
      while (true) {
        let s = i, l = 2*i+1, r = 2*i+2;
        if (l < this.h.length && this.h[l].cost < this.h[s].cost) s = l;
        if (r < this.h.length && this.h[r].cost < this.h[s].cost) s = r;
        if (s === i) break;
        [this.h[s], this.h[i]] = [this.h[i], this.h[s]]; i = s;
      }
    }
    return top;
  }
  get size() { return this.h.length; }
}

// ── BFS (DATA STRUCTURE 5: queue) ──
function bfsNextDir(graph, start, target) {
  if (start.r === target.r && start.c === target.c) return NONE;
  const queue = [{r: start.r, c: start.c}];          // DS5: queue (Array as queue)
  const cameFrom = new Map();                          // DS3: map
  const sk = posKey(start.r, start.c);
  cameFrom.set(sk, sk);
  while (queue.length > 0) {
    const cur = queue.shift();
    const ck = posKey(cur.r, cur.c);
    if (cur.r === target.r && cur.c === target.c) {
      let step = {r: target.r, c: target.c};
      while (true) {
        const pk = cameFrom.get(posKey(step.r, step.c));
        const prev = {r: Math.floor(pk / 100), c: pk % 100};
        if (prev.r === start.r && prev.c === start.c) break;
        step = prev;
      }
      const dr = step.r - start.r, dc = step.c - start.c;
      if (dr === -1) return UP; if (dr === 1) return DOWN;
      if (dc === -1) return LEFT; if (dc === 1) return RIGHT;
      return NONE;
    }
    const node = graph.get(ck);
    if (!node) continue;
    for (const nb of node.neighbors) {
      const nk = posKey(nb.r, nb.c);
      if (!cameFrom.has(nk)) { cameFrom.set(nk, ck); queue.push(nb); }
    }
  }
  return NONE;
}

// ── A* (DATA STRUCTURE 6: priority_queue / MinHeap) ──
function astarNextDir(graph, start, target) {
  if (start.r === target.r && start.c === target.c) return NONE;
  const open = new MinHeap();                          // DS6: priority_queue
  const gCost = new Map();                             // DS3: map
  const cameFrom = new Map();
  const sk = posKey(start.r, start.c);
  gCost.set(sk, 0);
  open.push({cost: manhattan(start, target), r: start.r, c: start.c});
  cameFrom.set(sk, sk);
  while (open.size > 0) {
    const cur = open.pop();
    const ck = posKey(cur.r, cur.c);
    if (cur.r === target.r && cur.c === target.c) {
      let step = {r: target.r, c: target.c};
      while (true) {
        const pk = cameFrom.get(posKey(step.r, step.c));
        const prev = {r: Math.floor(pk / 100), c: pk % 100};
        if (prev.r === start.r && prev.c === start.c) break;
        step = prev;
      }
      const dr = step.r - start.r, dc = step.c - start.c;
      if (dr === -1) return UP; if (dr === 1) return DOWN;
      if (dc === -1) return LEFT; if (dc === 1) return RIGHT;
      return NONE;
    }
    const node = graph.get(ck);
    if (!node) continue;
    for (const nb of node.neighbors) {
      const nk = posKey(nb.r, nb.c);
      const tentative = (gCost.get(ck) || 0) + 1;
      if (!gCost.has(nk) || tentative < gCost.get(nk)) {
        gCost.set(nk, tentative);
        cameFrom.set(nk, ck);
        open.push({cost: tentative + manhattan(nb, target), r: nb.r, c: nb.c});
      }
    }
  }
  return NONE;
}

// ── DFS-flee (DATA STRUCTURE 4: stack) ──
function dfsFleeDir(graph, pos, threat) {
  const node = graph.get(posKey(pos.r, pos.c));
  if (!node) return NONE;
  let best = NONE, bestDist = -1;
  for (const nb of node.neighbors) {
    const d = manhattan(nb, threat);
    if (d > bestDist) {
      bestDist = d;
      const dr = nb.r - pos.r, dc = nb.c - pos.c;
      if (dr === -1) best = UP; else if (dr === 1) best = DOWN;
      else if (dc === -1) best = LEFT; else best = RIGHT;
    }
  }
  return best;
}

// ── Game State ──
class GameState {
  constructor() {
    this.grid = Array.from({length: ROWS}, () => new Array(COLS).fill(0)); // DS9: 2D array
    this.dotsRemaining = 0;
    this.players = [];                    // DS1: vector (Array)
    this.ghosts = [];                     // DS2: list (Array)
    this.graph = new Map();               // DS3: map (adjacency list)
    this.moveHistory = [];                // DS4: stack (Array)
    this.powerEvents = [];                // DS5: queue (Array)
    this.leaderboard = new MinHeap();     // DS6: priority_queue
    this.dotSet = new Set();              // DS7: set
    this.ghostFrightTimers = new Map();   // DS8: unordered_map
    this.teamScore = [0, 0];
    this.tick = 0;
    this.running = false;
    this.gameOver = false;
    this.winner = -1;
    this.totalDots = 0;
  }
}

function initMap(gs) {
  gs.dotsRemaining = 0;
  gs.dotSet.clear();
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      gs.grid[r][c] = BASE_MAP[r][c];
      if (gs.grid[r][c] === DOT || gs.grid[r][c] === POWER) {
        gs.dotsRemaining++;
        gs.dotSet.add(posKey(r, c));
      }
    }
  gs.totalDots = gs.dotsRemaining;
}

function buildGraph(gs) {
  gs.graph.clear();
  const dr = [-1, 0, 1, 0], dc = [0, 1, 0, -1];
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      if (gs.grid[r][c] === WALL) continue;
      const neighbors = [];
      for (let d = 0; d < 4; d++) {
        const w = warpPos(r + dr[d], c + dc[d]);
        if (gs.grid[w.r][w.c] !== WALL) neighbors.push(w);
      }
      gs.graph.set(posKey(r, c), {r, c, neighbors});
    }
}

function initGhosts(gs) {
  gs.ghosts = [];
  gs.ghostFrightTimers.clear();
  const spawns    = [{r:10,c:9},{r:10,c:10},{r:10,c:11},{r:9,c:10}];
  const scatters  = [{r:1,c:1},{r:1,c:COLS-2},{r:ROWS-2,c:1},{r:ROWS-2,c:COLS-2}];
  const syms      = ['👻','👻','👻','👻'];
  const names     = ['Blinky','Pinky','Inky','Clyde'];
  const colors    = ['#FF0000','#FFB8FF','#00FFFF','#FFB852'];
  const algos     = ['A*','BFS','BFS','BFS/Scatter'];
  for (let i = 0; i < 4; i++) {
    gs.ghosts.push({
      id: i, name: names[i], sym: syms[i], color: colors[i], algo: algos[i],
      pos: {...spawns[i]}, scatter_target: {...scatters[i]},
      dir: RIGHT, state: SCATTER, stateTimer: SCATTER_TICKS
    });
    gs.ghostFrightTimers.set(i, 0);
  }
}

function initGame(gs, nameA) {
  initMap(gs);
  buildGraph(gs);
  initGhosts(gs);
  gs.players = [
    { name: nameA, team: TEAM_A, pos: {r:1,c:1}, dir: NONE, score: 0, lives: 3, powered: false, powerTimer: 0, alive: true },
  ];
  gs.teamScore = [0, 0];
  gs.tick = 0; gs.running = true; gs.gameOver = false; gs.winner = -1;
  gs.moveHistory = []; gs.powerEvents = [];
  gs.leaderboard = new MinHeap();
}

function isWalkable(gs, r, c) {
  if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return false;
  return gs.grid[r][c] !== WALL;
}

function movePlayer(gs, pidx, d) {
  if (d === NONE) return;
  const p = gs.players[pidx];
  if (!p || !p.alive) return;
  const off = dirOffset(d);
  const np = warpPos(p.pos.r + off.r, p.pos.c + off.c);
  if (!isWalkable(gs, np.r, np.c)) return;
  const oldPos = {...p.pos};
  let gained = 0;
  p.dir = d; p.pos = np;
  if (gs.grid[np.r][np.c] === DOT) {
    gs.grid[np.r][np.c] = EMPTY;
    gs.dotSet.delete(posKey(np.r, np.c));
    gs.dotsRemaining--;
    gained = SCORE_DOT;
    p.score += gained; gs.teamScore[p.team] += gained;
  } else if (gs.grid[np.r][np.c] === POWER) {
    gs.grid[np.r][np.c] = EMPTY;
    gs.dotSet.delete(posKey(np.r, np.c));
    gs.dotsRemaining--;
    gained = SCORE_POWER;
    p.score += gained; gs.teamScore[p.team] += gained;
    p.powered = true; p.powerTimer = POWER_TICKS;
    frightenAllGhosts(gs);
    gs.powerEvents.push({tick: gs.tick, pidx}); // DS5: queue push
  }
  gs.moveHistory.push({tick: gs.tick, pidx, from: oldPos, to: {...p.pos}, gained}); // DS4: stack push
}

function frightenAllGhosts(gs) {
  for (const g of gs.ghosts) {
    if (g.state !== EATEN_STATE) {
      g.state = FRIGHTENED; g.stateTimer = FRIGHTEN_TICKS;
      gs.ghostFrightTimers.set(g.id, FRIGHTEN_TICKS);
    }
  }
}

function updateGhost(gs, ghost) {
  ghost.stateTimer--;
  if (ghost.stateTimer <= 0) {
    if (ghost.state === SCATTER)    { ghost.state = CHASE;    ghost.stateTimer = CHASE_TICKS; }
    else if (ghost.state === CHASE) { ghost.state = SCATTER;  ghost.stateTimer = SCATTER_TICKS; }
    else if (ghost.state === FRIGHTENED) { ghost.state = CHASE; ghost.stateTimer = CHASE_TICKS; gs.ghostFrightTimers.set(ghost.id, 0); }
    else if (ghost.state === EATEN_STATE) { ghost.state = SCATTER; ghost.stateTimer = SCATTER_TICKS; }
  }
  let nextDir = NONE;
  const alive = gs.players.filter(p => p.alive);
  if (ghost.state === CHASE && alive.length > 0) {
    if (ghost.id === 0) {
      // Blinky: A* to nearest player
      let nearest = alive[0], bestD = Infinity;
      for (const p of alive) { const d = manhattan(ghost.pos, p.pos); if (d < bestD) { bestD = d; nearest = p; } }
      nextDir = astarNextDir(gs.graph, ghost.pos, nearest.pos);
    } else if (ghost.id === 1) {
      // Pinky: BFS 4 tiles ahead of player A
      const p = gs.players[0];
      if (p && p.alive) {
        const off = dirOffset(p.dir === NONE ? RIGHT : p.dir);
        const ahead = warpPos(p.pos.r + off.r * 4, p.pos.c + off.c * 4);
        nextDir = bfsNextDir(gs.graph, ghost.pos, ahead);
      }
    } else if (ghost.id === 2) {
      // Inky: BFS to player B
      const p = gs.players[1] || gs.players[0];
      if (p && p.alive) nextDir = bfsNextDir(gs.graph, ghost.pos, p.pos);
    } else {
      // Clyde: scatter if close, chase if far
      const p = alive[0];
      if (p) {
        const d = manhattan(ghost.pos, p.pos);
        nextDir = d > 8 ? bfsNextDir(gs.graph, ghost.pos, p.pos)
                        : bfsNextDir(gs.graph, ghost.pos, ghost.scatter_target);
      }
    }
  } else if (ghost.state === FRIGHTENED) {
    let threat = {r: Math.floor(ROWS/2), c: Math.floor(COLS/2)};
    let minD = Infinity;
    for (const p of alive) { const d = manhattan(ghost.pos, p.pos); if (d < minD) { minD = d; threat = p.pos; } }
    nextDir = dfsFleeDir(gs.graph, ghost.pos, threat);
  } else if (ghost.state === SCATTER) {
    nextDir = bfsNextDir(gs.graph, ghost.pos, ghost.scatter_target);
  } else if (ghost.state === EATEN_STATE) {
    nextDir = bfsNextDir(gs.graph, ghost.pos, {r:10, c:10});
  }
  if (nextDir !== NONE) {
    const off = dirOffset(nextDir);
    const np = warpPos(ghost.pos.r + off.r, ghost.pos.c + off.c);
    if (isWalkable(gs, np.r, np.c)) { ghost.pos = np; ghost.dir = nextDir; }
  }
}

function checkGhostCollisions(gs) {
  for (const p of gs.players) {
    if (!p.alive) continue;
    for (const g of gs.ghosts) {
      if (g.pos.r !== p.pos.r || g.pos.c !== p.pos.c) continue;
      if (g.state === FRIGHTENED) {
        p.score += SCORE_GHOST; gs.teamScore[p.team] += SCORE_GHOST;
        g.state = EATEN_STATE; g.stateTimer = EATEN_TICKS;
        gs.ghostFrightTimers.set(g.id, 0);
      } else if (g.state !== EATEN_STATE) {
        p.lives--;
        if (p.lives <= 0) { p.alive = false; }
        else { p.pos = p.team === TEAM_A ? {r:1,c:1} : {r:ROWS-2,c:COLS-2}; p.powered = false; p.powerTimer = 0; }
      }
    }
  }
}

function tickPowerEvents(gs) {
  for (const p of gs.players) {
    if (p.powered) { p.powerTimer--; if (p.powerTimer <= 0) { p.powered = false; p.powerTimer = 0; } }
  }
}

function checkWinConditions(gs) {
  if (gs.dotsRemaining <= 0) {
    gs.gameOver = true; gs.running = false;
    gs.winner = 0; // player cleared all dots
    return;
  }
  const aAlive = gs.players.some(p => p.alive && p.team === TEAM_A);
  if (!aAlive) { gs.gameOver = true; gs.running = false; gs.winner = 1; } // ghosts win
}

function updateLeaderboard(gs) {
  gs.leaderboard = new MinHeap();
  for (const p of gs.players) gs.leaderboard.push({cost: p.score, name: p.name, score: p.score});
}

function gameTick(gs) {
  if (!gs.running) return;
  gs.tick++;
  tickPowerEvents(gs);
  for (const g of gs.ghosts) updateGhost(gs, g);
  checkGhostCollisions(gs);
  checkWinConditions(gs);
  updateLeaderboard(gs);
}
