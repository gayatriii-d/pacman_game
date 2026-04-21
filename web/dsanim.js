// [TEMPORARY] DS Animation Engine
// Each DS gets a unique canvas animation showing how it's used in the game

let dsAnimId = null;

const DS_INFO = {
  1: { title: 'vector — Player List',       desc: 'std::vector stores all players. Random access O(1). Used to iterate and update each player every tick.' },
  2: { title: 'list — Ghost List',           desc: 'std::list stores ghosts as a linked list. Efficient insertion/traversal. Each node points to next ghost.' },
  3: { title: 'map — Adjacency Graph',       desc: 'std::map<Pos, GraphNode> builds the maze graph. Each cell maps to its walkable neighbours for BFS/A*.' },
  4: { title: 'stack — Move History',        desc: 'std::stack records every move (push). Used for move history / replay log. LIFO order.' },
  5: { title: 'queue — BFS Frontier',        desc: 'std::queue drives BFS pathfinding. Nodes explored level by level — guarantees shortest path.' },
  6: { title: 'priority_queue — A* Open Set',desc: 'Min-heap orders nodes by f=g+h cost. A* always expands the cheapest node first — optimal path.' },
  7: { title: 'set — Dot Positions',         desc: 'std::set<Pos> stores remaining dot positions. O(log n) lookup to check if a cell has a dot.' },
  8: { title: 'unordered_map — Fright Cache',desc: 'std::unordered_map<int,int> caches each ghost\'s frighten timer. O(1) average lookup by ghost ID.' },
  9: { title: 'Matrix — Game Grid (21×21)',      desc: 'int grid[21][21] is a 2D matrix. Each cell stores WALL(1), DOT(2), POWER(3), EMPTY(0) or WARP(4). Direct O(1) access by grid[row][col].' },
};

function showDSAnim(n) {
  const info = DS_INFO[n];
  document.getElementById('ds-modal-title').textContent = info.title;
  document.getElementById('ds-modal-desc').textContent  = info.desc;
  document.getElementById('ds-modal').classList.remove('hidden');

  if (dsAnimId) cancelAnimationFrame(dsAnimId);
  const canvas = document.getElementById('ds-anim-canvas');
  const ctx = canvas.getContext('2d');
  let t = 0;

  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ANIMS[n](ctx, canvas.width, canvas.height, t);
    t++;
    dsAnimId = requestAnimationFrame(loop);
  }
  loop();
}

function closeDSAnim() {
  document.getElementById('ds-modal').classList.add('hidden');
  if (dsAnimId) { cancelAnimationFrame(dsAnimId); dsAnimId = null; }
}

// ── Helpers ──
function box(ctx, x, y, w, h, color, label, highlight) {
  ctx.fillStyle = highlight ? color + 'cc' : '#1a1a3a';
  ctx.strokeStyle = color;
  ctx.lineWidth = highlight ? 2 : 1;
  ctx.beginPath(); ctx.roundRect(x, y, w, h, 6); ctx.fill(); ctx.stroke();
  if (label) {
    ctx.fillStyle = highlight ? '#fff' : color;
    ctx.font = `bold ${Math.min(12, w/label.length*1.4)}px monospace`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(label, x + w/2, y + h/2);
  }
}

function arrow(ctx, x1, y1, x2, y2, color) {
  ctx.strokeStyle = color; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  const a = Math.atan2(y2-y1, x2-x1);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 8*Math.cos(a-0.4), y2 - 8*Math.sin(a-0.4));
  ctx.lineTo(x2 - 8*Math.cos(a+0.4), y2 - 8*Math.sin(a+0.4));
  ctx.closePath(); ctx.fill();
}

const ANIMS = {
  // 1: vector — sliding highlight across array cells
  1(ctx, W, H, t) {
    const items = ['Player A', 'Player B'];
    const cw = 120, ch = 44, gap = 16;
    const totalW = items.length * cw + (items.length-1) * gap;
    const sx = (W - totalW) / 2, sy = H/2 - ch/2;
    const hi = Math.floor(t / 40) % items.length;

    ctx.fillStyle = '#aaaaff44';
    ctx.font = '10px monospace'; ctx.textAlign = 'center';
    ctx.fillText('players[ ]  — random access O(1)', W/2, 20);

    items.forEach((label, i) => {
      box(ctx, sx + i*(cw+gap), sy, cw, ch, '#00FF7F', label, i === hi);
      ctx.fillStyle = '#555'; ctx.font = '10px monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(`[${i}]`, sx + i*(cw+gap) + cw/2, sy + ch + 14);
    });

    // animated index pointer
    const px = sx + hi*(cw+gap) + cw/2;
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 13px monospace'; ctx.textAlign = 'center';
    ctx.fillText('▲', px, sy + ch + 28);
    ctx.fillStyle = '#FFD70088';
    ctx.font = '10px monospace';
    ctx.fillText('index', px, sy + ch + 42);
  },

  // 2: list — linked nodes with animated pointer travel
  2(ctx, W, H, t) {
    const ghosts = ['Blinky','Pinky','Inky','Clyde'];
    const cw = 62, ch = 36, gap = 18;
    const totalW = ghosts.length*(cw+gap) - gap;
    const sx = (W - totalW)/2, sy = H/2 - ch/2;

    ctx.fillStyle = '#aaaaff44'; ctx.font = '10px monospace'; ctx.textAlign = 'center';
    ctx.fillText('std::list<Ghost>  — linked traversal', W/2, 20);

    const colors = ['#FF0000','#FFB8FF','#00FFFF','#FFB852'];
    ghosts.forEach((g, i) => {
      box(ctx, sx + i*(cw+gap), sy, cw, ch, colors[i], g, false);
      if (i < ghosts.length-1)
        arrow(ctx, sx+i*(cw+gap)+cw, sy+ch/2, sx+(i+1)*(cw+gap), sy+ch/2, colors[i]);
    });

    // travelling dot
    const progress = (t % 120) / 120;
    const totalPath = (ghosts.length-1)*(cw+gap);
    const px = sx + progress * totalPath + cw/2;
    ctx.fillStyle = '#FFD700';
    ctx.beginPath(); ctx.arc(px, sy+ch/2, 5, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#FFD70088'; ctx.font = '10px monospace'; ctx.textAlign = 'center';
    ctx.fillText('iterator', px, sy + ch + 18);
  },

  // 3: map — key→value pairs with highlight
  3(ctx, W, H, t) {
    const entries = ['{1,1}→[]', '{1,2}→[]', '{2,1}→[]', '{4,1}→[]'];
    const hi = Math.floor(t/50) % entries.length;
    const cw = 74, ch = 32, gap = 6;
    const totalH = entries.length*(ch+gap);
    const sy = (H - totalH)/2;

    ctx.fillStyle = '#aaaaff44'; ctx.font = '10px monospace'; ctx.textAlign = 'left';
    ctx.fillText('map<Pos, GraphNode>', 10, 18);

    entries.forEach((e, i) => {
      const y = sy + i*(ch+gap);
      box(ctx, 10, y, cw, ch, '#aaaaff', e.split('→')[0], i===hi);
      arrow(ctx, 10+cw, y+ch/2, 10+cw+20, y+ch/2, '#aaaaff');
      box(ctx, 10+cw+20, y, 80, ch, '#00FFFF', 'neighbors', i===hi);
    });

    ctx.fillStyle = '#FFD700'; ctx.font = '10px monospace'; ctx.textAlign = 'left';
    ctx.fillText('← key (Pos)', 10, H-10);
    ctx.fillStyle = '#00FFFF';
    ctx.fillText('← value (GraphNode)', 10+cw+20, H-10);
  },

  // 4: stack — push/pop animation
  4(ctx, W, H, t) {
    const phase = Math.floor(t / 30) % 8;
    const moves = ['(1,1)→(1,2)', '(1,2)→(1,3)', '(1,3)→(2,3)', '(2,3)→(3,3)'];
    const visible = Math.min(phase + 1, moves.length);
    const cw = 160, ch = 30, gap = 4;
    const sx = (W-cw)/2, baseY = H - 30;

    ctx.fillStyle = '#aaaaff44'; ctx.font = '10px monospace'; ctx.textAlign = 'center';
    ctx.fillText('std::stack<MoveRecord>  — LIFO', W/2, 18);

    for (let i = 0; i < visible; i++) {
      const y = baseY - (i+1)*(ch+gap);
      const isTop = i === visible-1;
      box(ctx, sx, y, cw, ch, '#FFD700', moves[i], isTop);
    }

    // TOP label
    if (visible > 0) {
      const topY = baseY - visible*(ch+gap);
      ctx.fillStyle = '#FFD700'; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'left';
      ctx.fillText('← TOP (last move)', sx + cw + 8, topY + ch/2 + 4);
    }

    // base
    ctx.fillStyle = '#2a2a4a';
    ctx.fillRect(sx-4, baseY-2, cw+8, 6);
  },

  // 5: queue — BFS wave expanding from start
  5(ctx, W, H, t) {
    const CELL = 22, COLS = 7, ROWS = 5;
    const ox = (W - COLS*CELL)/2, oy = (H - ROWS*CELL)/2 + 10;
    const walls = new Set(['1,2','1,3','2,1','3,3','3,4']);
    const start = {r:0,c:0};
    const maxWave = Math.floor(t/18) % (COLS+ROWS+2);

    ctx.fillStyle = '#aaaaff44'; ctx.font = '10px monospace'; ctx.textAlign = 'center';
    ctx.fillText('BFS queue — wave expansion', W/2, 14);

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const key = `${r},${c}`;
        const dist = Math.abs(r-start.r) + Math.abs(c-start.c);
        const isWall = walls.has(key);
        const x = ox + c*CELL, y = oy + r*CELL;
        if (isWall) {
          ctx.fillStyle = '#1a1aff'; ctx.fillRect(x+1,y+1,CELL-2,CELL-2);
        } else if (dist <= maxWave) {
          const alpha = Math.max(0.2, 1 - (maxWave-dist)*0.25);
          ctx.fillStyle = `rgba(0,255,127,${alpha})`;
          ctx.fillRect(x+1,y+1,CELL-2,CELL-2);
          ctx.fillStyle = '#000'; ctx.font = '8px monospace';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(dist, x+CELL/2, y+CELL/2);
        } else {
          ctx.strokeStyle = '#2a2a4a'; ctx.lineWidth = 1;
          ctx.strokeRect(x+1,y+1,CELL-2,CELL-2);
        }
      }
    }
    ctx.fillStyle = '#FFD700'; ctx.font = '10px monospace'; ctx.textAlign = 'center';
    ctx.fillText('numbers = BFS distance from start', W/2, H-8);
  },

  // 6: priority_queue — min-heap with animated pop
  6(ctx, W, H, t) {
    const phase = Math.floor(t/40) % 5;
    const nodes = [
      {cost:3,label:'f=3'},{cost:5,label:'f=5'},{cost:7,label:'f=7'},
      {cost:6,label:'f=6'},{cost:9,label:'f=9'},{cost:8,label:'f=8'},
    ];
    // heap positions (binary tree layout)
    const positions = [
      {x:170,y:30},{x:100,y:80},{x:240,y:80},
      {x:65,y:130},{x:135,y:130},{x:205,y:130},{x:275,y:130},
    ];
    const r = 22;

    ctx.fillStyle = '#aaaaff44'; ctx.font = '10px monospace'; ctx.textAlign = 'center';
    ctx.fillText('MinHeap (priority_queue) — A* open set', W/2, 14);

    // edges
    [[0,1],[0,2],[1,3],[1,4],[2,5],[2,6]].forEach(([p,c]) => {
      if (positions[p] && positions[c])
        arrow(ctx, positions[p].x, positions[p].y+r, positions[c].x, positions[c].y-r, '#2a2a6a');
    });

    nodes.forEach((n, i) => {
      if (!positions[i]) return;
      const {x,y} = positions[i];
      const isMin = i === 0;
      const popping = isMin && phase % 2 === 1;
      const alpha = popping ? Math.abs(Math.sin(t*0.15)) : 1;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = isMin ? '#FFD700' : '#1a1a3a';
      ctx.strokeStyle = isMin ? '#FFD700' : '#4444aa';
      ctx.lineWidth = isMin ? 2 : 1;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = isMin ? '#000' : '#aaaaff';
      ctx.font = 'bold 11px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(n.label, x, y);
      ctx.globalAlpha = 1;
    });

    ctx.fillStyle = '#FFD700'; ctx.font = '10px monospace'; ctx.textAlign = 'center';
    ctx.fillText('root = min cost node (always popped first)', W/2, H-8);
  },

  // 7: set — dot grid with O(log n) search highlight
  7(ctx, W, H, t) {
    const dots = [{r:1,c:1},{r:1,c:3},{r:2,c:2},{r:3,c:1},{r:3,c:3},{r:4,c:2}];
    const CELL = 28, COLS = 5, ROWS = 5;
    const ox = (W - COLS*CELL)/2, oy = (H - ROWS*CELL)/2 + 8;
    const searchIdx = Math.floor(t/60) % dots.length;
    const target = dots[searchIdx];

    ctx.fillStyle = '#aaaaff44'; ctx.font = '10px monospace'; ctx.textAlign = 'center';
    ctx.fillText('std::set<Pos> — dot lookup O(log n)', W/2, 14);

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const x = ox+c*CELL, y = oy+r*CELL;
        ctx.strokeStyle = '#2a2a4a'; ctx.lineWidth = 1;
        ctx.strokeRect(x, y, CELL, CELL);
      }
    }

    dots.forEach(d => {
      const x = ox+d.c*CELL+CELL/2, y = oy+d.r*CELL+CELL/2;
      const isTarget = d.r===target.r && d.c===target.c;
      const pulse = 0.7 + 0.3*Math.sin(t*0.15);
      ctx.fillStyle = isTarget ? `rgba(255,215,0,${pulse})` : '#ffff9988';
      ctx.beginPath(); ctx.arc(x, y, isTarget ? 7 : 4, 0, Math.PI*2); ctx.fill();
    });

    // search label
    ctx.fillStyle = '#FFD700'; ctx.font = '10px monospace'; ctx.textAlign = 'center';
    ctx.fillText(`searching (${target.r},${target.c}) in set…`, W/2, H-8);
  },

  // 8: unordered_map — hash table ghost timer lookup
  8(ctx, W, H, t) {
    const ghosts = [{id:0,name:'Blinky',color:'#FF0000'},{id:1,name:'Pinky',color:'#FFB8FF'},
                    {id:2,name:'Inky',color:'#00FFFF'},{id:3,name:'Clyde',color:'#FFB852'}];
    const hi = Math.floor(t/50) % ghosts.length;
    const cw = 54, ch = 34, gap = 8;
    const totalW = ghosts.length*(cw+gap)-gap;
    const sx = (W-totalW)/2, sy = 30;

    ctx.fillStyle = '#aaaaff44'; ctx.font = '10px monospace'; ctx.textAlign = 'center';
    ctx.fillText('unordered_map<int,int> — O(1) lookup', W/2, 14);

    ghosts.forEach((g, i) => {
      box(ctx, sx+i*(cw+gap), sy, cw, ch, g.color, `id:${g.id}`, i===hi);
      ctx.fillStyle = '#555'; ctx.font = '9px monospace'; ctx.textAlign = 'center';
      ctx.fillText(g.name, sx+i*(cw+gap)+cw/2, sy+ch+12);
    });

    // hash arrow
    const hx = sx + hi*(cw+gap) + cw/2;
    arrow(ctx, hx, sy+ch+2, hx, sy+ch+50, ghosts[hi].color);

    // value box
    const timer = Math.max(0, 40 - (t % 80));
    box(ctx, hx-35, sy+ch+52, 70, 30, ghosts[hi].color, `timer:${timer}`, true);

    ctx.fillStyle = '#aaa'; ctx.font = '10px monospace'; ctx.textAlign = 'center';
    ctx.fillText('frighten timer value', W/2, H-8);
  },

  // 9: Matrix — digital rain + cell access highlight
  9(ctx, W, H, t) {
    const CELL = 14, COLS = 11, ROWS = 11;
    const ox = (W - COLS*CELL)/2, oy = (H - ROWS*CELL)/2 + 8;

    const grid = [
      [1,1,1,1,1,1,1,1,1,1,1],
      [1,3,2,2,2,2,2,2,2,3,1],
      [1,2,1,1,2,1,1,1,2,1,1],
      [1,2,2,2,2,2,2,2,2,2,1],
      [1,2,1,2,1,2,1,2,1,2,1],
      [1,2,2,2,2,0,2,2,2,2,1],
      [1,2,1,2,1,2,1,2,1,2,1],
      [1,2,2,2,2,2,2,2,2,2,1],
      [1,2,1,1,2,1,1,1,2,1,1],
      [1,3,2,2,2,2,2,2,2,3,1],
      [1,1,1,1,1,1,1,1,1,1,1],
    ];

    const tileColor = { 0:'#050510', 1:'#0000cc', 2:'#1a1a00', 3:'#1a1400', 4:'#111' };
    const valColor  = { 0:'#333', 1:'#4444ff', 2:'#aaaa00', 3:'#FFD700', 4:'#555' };

    // access animation: scan row by row
    const total = COLS * ROWS;
    const cur   = Math.floor(t / 5) % total;
    const cr    = Math.floor(cur / COLS);
    const cc    = cur % COLS;

    ctx.fillStyle = '#aaaaff44'; ctx.font = '10px monospace'; ctx.textAlign = 'center';
    ctx.fillText('Matrix  grid[21][21]  —  O(1) access', W/2, 12);

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const x = ox + c*CELL, y = oy + r*CELL;
        const val = grid[r][c];
        const isActive = r === cr && c === cc;
        const isRow    = r === cr;

        // cell background
        ctx.fillStyle = isActive ? '#FFD70033' : isRow ? '#ffffff08' : tileColor[val];
        ctx.fillRect(x, y, CELL-1, CELL-1);

        // matrix rain effect — columns light up ahead of cursor
        if (c === cc && r <= cr) {
          const fade = 1 - (cr - r) / ROWS;
          ctx.fillStyle = `rgba(0,255,80,${fade * 0.15})`;
          ctx.fillRect(x, y, CELL-1, CELL-1);
        }

        // value text
        ctx.fillStyle = isActive ? '#FFD700' : valColor[val];
        ctx.font = `${isActive ? 'bold ' : ''}9px monospace`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(val, x + CELL/2, y + CELL/2);

        // active cell border
        if (isActive) {
          ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 1.5;
          ctx.strokeRect(x, y, CELL-1, CELL-1);
        }
      }
    }

    // legend
    const legend = ['0=empty','1=wall','2=dot','3=power'];
    const lColors = ['#555','#4444ff','#aaaa44','#FFD700'];
    legend.forEach((l, i) => {
      ctx.fillStyle = lColors[i]; ctx.font = '8px monospace'; ctx.textAlign = 'left';
      ctx.fillText(l, ox + i * 82, H - 6);
    });

    ctx.fillStyle = '#FFD700'; ctx.font = '10px monospace'; ctx.textAlign = 'right';
    ctx.fillText(`grid[${cr}][${cc}]=${grid[cr][cc]}`, W-8, H-6);
  },
};
