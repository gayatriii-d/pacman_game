#pragma once
#include "game.h"
#include "map.h"
#include "ghost_ai.h"

static const int SCORE_DOT    = 10;
static const int SCORE_POWER  = 50;
static const int SCORE_GHOST  = 200;
static const int POWER_TICKS  = 35;

// ─────────────────────────────────────────────
//  Initialize a fresh game
// ─────────────────────────────────────────────
inline void initGame(GameState& gs,
                     const std::string& nameA,
                     const std::string& nameB) {
    initMap(gs);
    buildGraph(gs);
    initGhosts(gs);

    gs.players.clear();

    // Player A  (Team A) – spawns top-left area
    Player pA;
    pA.name   = nameA;
    pA.team   = TEAM_A;
    pA.pos    = {1, 1};
    pA.symbol = 'A';
    pA.lives  = 3;
    gs.players.push_back(pA);

    // Player B  (Team B) – spawns bottom-right area
    Player pB;
    pB.name   = nameB;
    pB.team   = TEAM_B;
    pB.pos    = {ROWS-2, COLS-2};
    pB.symbol = 'B';
    pB.lives  = 3;
    gs.players.push_back(pB);

    gs.teamScore[0] = gs.teamScore[1] = 0;
    gs.tick    = 0;
    gs.running = true;
    gs.gameOver= false;
    gs.winner  = -1;

    // Clear move history stack
    while (!gs.moveHistory.empty()) gs.moveHistory.pop();
    while (!gs.powerEvents.empty()) gs.powerEvents.pop();
}

// ─────────────────────────────────────────────
//  Try to move a player in direction d
// ─────────────────────────────────────────────
inline void movePlayer(GameState& gs, int pidx, Dir d) {
    if (pidx < 0 || pidx >= (int)gs.players.size()) return;
    Player& p = gs.players[pidx];
    if (!p.alive) return;
    if (d == NONE) return;

    Pos off = dirOffset(d);
    Pos np  = warp({p.pos.r + off.r, p.pos.c + off.c});

    if (!isWalkable(gs, np.r, np.c)) return;

    Pos oldPos = p.pos;
    int gained = 0;

    p.dir = d;
    p.pos = np;

    // Eat dot?
    if (gs.grid[np.r][np.c] == DOT) {
        gs.grid[np.r][np.c] = EMPTY;
        gs.dotSet.erase(np);
        gs.dotsRemaining--;
        gained = SCORE_DOT;
        p.score += gained;
        gs.teamScore[p.team] += gained;
    }
    // Eat power pellet?
    else if (gs.grid[np.r][np.c] == POWER) {
        gs.grid[np.r][np.c] = EMPTY;
        gs.dotSet.erase(np);
        gs.dotsRemaining--;
        gained = SCORE_POWER;
        p.score += gained;
        gs.teamScore[p.team] += gained;
        p.powered     = true;
        p.powerTimer  = POWER_TICKS;
        frightenAllGhosts(gs);
        // Enqueue power event (DATA STRUCTURE 5: queue)
        gs.powerEvents.push({gs.tick, pidx});
    }

    // Record move (DATA STRUCTURE 4: stack)
    MoveRecord rec{gs.tick, pidx, oldPos, p.pos, gained};
    gs.moveHistory.push(rec);
}

// ─────────────────────────────────────────────
//  Check ghost collisions for all players
// ─────────────────────────────────────────────
inline void checkGhostCollisions(GameState& gs) {
    for (Player& p : gs.players) {
        if (!p.alive) continue;
        for (Ghost& g : gs.ghosts) {
            if (g.pos != p.pos) continue;

            if (g.state == FRIGHTENED) {
                // Player eats ghost
                int bonus = SCORE_GHOST;
                p.score              += bonus;
                gs.teamScore[p.team] += bonus;
                g.state      = EATEN;
                g.stateTimer = EATEN_TICKS;
                gs.ghostFrightTimers[g.id] = 0;
            } else if (g.state != EATEN) {
                // Ghost kills player
                p.lives--;
                if (p.lives <= 0) {
                    p.alive = false;
                } else {
                    // Respawn
                    p.pos    = (p.team == TEAM_A) ? Pos{1,1} : Pos{ROWS-2, COLS-2};
                    p.powered = false;
                    p.powerTimer = 0;
                }
            }
        }
    }
}

// ─────────────────────────────────────────────
//  Power-pellet tick-down
// ─────────────────────────────────────────────
inline void tickPowerEvents(GameState& gs) {
    for (Player& p : gs.players) {
        if (p.powered) {
            p.powerTimer--;
            if (p.powerTimer <= 0) {
                p.powered = false;
                p.powerTimer = 0;
            }
        }
    }
}

// ─────────────────────────────────────────────
//  Check win conditions
// ─────────────────────────────────────────────
inline void checkWinConditions(GameState& gs) {
    // All dots eaten
    if (gs.dotsRemaining <= 0) {
        gs.gameOver = true;
        gs.running  = false;
        if (gs.teamScore[0] > gs.teamScore[1])      gs.winner = 0;
        else if (gs.teamScore[1] > gs.teamScore[0])  gs.winner = 1;
        else                                          gs.winner = 2;
        return;
    }

    // All players of a team dead
    bool aAlive = false, bAlive = false;
    for (auto& p : gs.players) {
        if (p.alive && p.team == TEAM_A) aAlive = true;
        if (p.alive && p.team == TEAM_B) bAlive = true;
    }
    if (!aAlive && !bAlive) { gs.gameOver = true; gs.running = false; gs.winner = 2; }
    else if (!aAlive)       { gs.gameOver = true; gs.running = false; gs.winner = 1; }
    else if (!bAlive)       { gs.gameOver = true; gs.running = false; gs.winner = 0; }
}

// ─────────────────────────────────────────────
//  Update leaderboard (max-heap)
// ─────────────────────────────────────────────
inline void updateLeaderboard(GameState& gs) {
    // Rebuild from players each time (simple approach)
    while (!gs.leaderboard.empty()) gs.leaderboard.pop();
    for (auto& p : gs.players)
        gs.leaderboard.push({p.name, p.score});
}

// ─────────────────────────────────────────────
//  Master tick  – call once per frame
// ─────────────────────────────────────────────
inline void gameTick(GameState& gs) {
    if (!gs.running) return;
    gs.tick++;

    tickPowerEvents(gs);

    // Update ghosts (iterate linked list – DATA STRUCTURE 2)
    for (Ghost& g : gs.ghosts)
        updateGhost(gs, g);

    checkGhostCollisions(gs);
    checkWinConditions(gs);
    updateLeaderboard(gs);
}
