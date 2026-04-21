#pragma once
#include "game.h"
#include "map.h"
#include "pathfinding.h"

// How many ticks each mode lasts
static const int SCATTER_TICKS   = 28;
static const int CHASE_TICKS     = 80;
static const int FRIGHTEN_TICKS  = 40;
static const int EATEN_TICKS     = 20;

inline void initGhosts(GameState& gs) {
    gs.ghosts.clear();
    gs.ghostFrightTimers.clear();

    // Ghost spawn positions in the ghost house
    const Pos spawns[] = {{10,9},{10,10},{10,11},{9,10}};
    const Pos scatters[] = {{1,1},{1,COLS-2},{ROWS-2,1},{ROWS-2,COLS-2}};
    const char syms[] = {'B','P','I','C'};
    const std::string names[] = {"Blinky","Pinky","Inky","Clyde"};

    int id = 0;
    for (int i = 0; i < 4; i++) {
        Ghost g;
        g.id             = id++;
        g.pos            = spawns[i];
        g.scatter_target = scatters[i];
        g.state          = SCATTER;
        g.stateTimer     = SCATTER_TICKS;
        g.symbol         = syms[i];
        g.name           = names[i];
        gs.ghosts.push_back(g);
        gs.ghostFrightTimers[g.id] = 0;
    }
}

// ─────────────────────────────────────────────
//  Update one ghost
// ─────────────────────────────────────────────
inline void updateGhost(GameState& gs, Ghost& ghost) {
    // --- State timer ---
    ghost.stateTimer--;
    if (ghost.stateTimer <= 0) {
        switch (ghost.state) {
            case SCATTER:
                ghost.state = CHASE;
                ghost.stateTimer = CHASE_TICKS;
                break;
            case CHASE:
                ghost.state = SCATTER;
                ghost.stateTimer = SCATTER_TICKS;
                break;
            case FRIGHTENED:
                ghost.state = CHASE;
                ghost.stateTimer = CHASE_TICKS;
                gs.ghostFrightTimers[ghost.id] = 0;
                break;
            case EATEN:
                ghost.state = SCATTER;
                ghost.stateTimer = SCATTER_TICKS;
                break;
        }
    }

    // --- Choose target ---
    Dir nextDir = NONE;
    (void)ghost.scatter_target; // used below in scatter state

    if (ghost.state == CHASE && !gs.players.empty()) {
        // Each ghost targets differently
        if (ghost.id == 0) {
            // Blinky: A* directly to nearest player
            Pos nearest = gs.players[0].pos;
            int bestDist = INT_MAX;
            for (auto& p : gs.players) {
                if (!p.alive) continue;
                int d = manhattan(ghost.pos, p.pos);
                if (d < bestDist) { bestDist = d; nearest = p.pos; }
            }
            nextDir = astarNextDir(gs, ghost.pos, nearest);
        } else if (ghost.id == 1) {
            // Pinky: BFS 4 tiles ahead of player
            if (!gs.players.empty() && gs.players[0].alive) {
                Pos ahead = gs.players[0].pos;
                Pos off   = dirOffset(gs.players[0].dir);
                ahead.r  += off.r * 4; ahead.c += off.c * 4;
                ahead.r   = std::max(0, std::min(ROWS-1, ahead.r));
                ahead.c   = std::max(0, std::min(COLS-1, ahead.c));
                nextDir   = bfsNextDir(gs, ghost.pos, ahead);
            }
        } else if (ghost.id == 2) {
            // Inky: BFS to player 1 if present
            if (gs.players.size() > 1 && gs.players[1].alive)
                nextDir = bfsNextDir(gs, ghost.pos, gs.players[1].pos);
            else if (!gs.players.empty() && gs.players[0].alive)
                nextDir = bfsNextDir(gs, ghost.pos, gs.players[0].pos);
        } else {
            // Clyde: scatter if close, chase if far
            if (!gs.players.empty() && gs.players[0].alive) {
                int d = manhattan(ghost.pos, gs.players[0].pos);
                if (d > 8) nextDir = bfsNextDir(gs, ghost.pos, gs.players[0].pos);
                else       nextDir = bfsNextDir(gs, ghost.pos, ghost.scatter_target);
            }
        }
    } else if (ghost.state == FRIGHTENED) {
        // DFS flee from nearest player
        Pos threat = {ROWS/2, COLS/2};
        int minD = INT_MAX;
        for (auto& p : gs.players) {
            if (!p.alive) continue;
            int d = manhattan(ghost.pos, p.pos);
            if (d < minD) { minD = d; threat = p.pos; }
        }
        nextDir = dfsFleeDir(gs, ghost.pos, threat);
    } else if (ghost.state == SCATTER) {
        nextDir = bfsNextDir(gs, ghost.pos, ghost.scatter_target);
    } else if (ghost.state == EATEN) {
        // Return to ghost house
        nextDir = bfsNextDir(gs, ghost.pos, {10, 10});
    }

    // --- Move ---
    if (nextDir != NONE) {
        Pos off = dirOffset(nextDir);
        Pos np  = warp({ghost.pos.r + off.r, ghost.pos.c + off.c});
        if (isWalkable(gs, np.r, np.c)) {
            ghost.pos = np;
            ghost.dir = nextDir;
        }
    }
}

// ─────────────────────────────────────────────
inline void frightenAllGhosts(GameState& gs) {
    for (Ghost& g : gs.ghosts) {
        if (g.state != EATEN) {
            g.state      = FRIGHTENED;
            g.stateTimer = FRIGHTEN_TICKS;
            gs.ghostFrightTimers[g.id] = FRIGHTEN_TICKS;
        }
    }
}
