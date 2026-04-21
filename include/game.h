#pragma once
#include <iostream>
#include <vector>
#include <queue>
#include <stack>
#include <map>
#include <unordered_map>
#include <list>
#include <string>
#include <algorithm>
#include <cstring>
#include <cstdlib>
#include <ctime>
#include <functional>
#include <memory>
#include <climits>
#include <set>

// ─────────────────────────────────────────────
//  CONSTANTS
// ─────────────────────────────────────────────
const int ROWS        = 21;
const int COLS        = 21;
const int CELL_SIZE   = 32;   // pixels (used by renderer)
const int MAX_PLAYERS = 2;

// Map tile types
enum Tile { EMPTY=0, WALL=1, DOT=2, POWER=3, WARP=4 };

// Directions
enum Dir { UP=0, RIGHT=1, DOWN=2, LEFT=3, NONE=4 };

// Team colours / IDs
enum Team { TEAM_A=0, TEAM_B=1 };

// Ghost states
enum GhostState { SCATTER=0, CHASE=1, FRIGHTENED=2, EATEN=3 };

// ─────────────────────────────────────────────
//  POSITION  (used everywhere)
// ─────────────────────────────────────────────
struct Pos {
    int r, c;
    bool operator==(const Pos& o) const { return r==o.r && c==o.c; }
    bool operator!=(const Pos& o) const { return !(*this==o); }
    bool operator< (const Pos& o) const { return r!=o.r ? r<o.r : c<o.c; }
};

// ─────────────────────────────────────────────
//  GRAPH NODE  (adjacency-list graph for BFS/DFS)
// ─────────────────────────────────────────────
struct GraphNode {
    Pos pos;
    std::vector<Pos> neighbors;
};

// ─────────────────────────────────────────────
//  PRIORITY-QUEUE entry for A*
// ─────────────────────────────────────────────
struct PQEntry {
    int cost;
    Pos pos;
    bool operator>(const PQEntry& o) const { return cost > o.cost; }
};

// ─────────────────────────────────────────────
//  PLAYER
// ─────────────────────────────────────────────
struct Player {
    std::string name;
    Team   team;
    Pos    pos;
    Dir    dir      = NONE;
    int    score    = 0;
    int    lives    = 3;
    bool   powered  = false;   // power-pellet active
    int    powerTimer = 0;
    bool   alive    = true;
    char   symbol   = '@';
};

// ─────────────────────────────────────────────
//  GHOST
// ─────────────────────────────────────────────
struct Ghost {
    std::string name;
    Pos    pos;
    Pos    scatter_target;     // fixed corner for scatter mode
    Dir    dir        = RIGHT;
    GhostState state  = SCATTER;
    int    stateTimer = 0;
    char   symbol     = 'G';
    int    id;
};

// ─────────────────────────────────────────────
//  SCORE ENTRY (for leaderboard / min-heap)
// ─────────────────────────────────────────────
struct ScoreEntry {
    std::string name;
    int score;
    bool operator<(const ScoreEntry& o) const { return score < o.score; } // min-heap default
};

// ─────────────────────────────────────────────
//  MOVE LOG  (stack-based undo / replay)
// ─────────────────────────────────────────────
struct MoveRecord {
    int    tick;
    int    playerIdx;
    Pos    from, to;
    int    scoreGained;
};

// ─────────────────────────────────────────────
//  GAME STATE  (everything the engine needs)
// ─────────────────────────────────────────────
struct GameState {
    // --- Map ---
    int  grid[ROWS][COLS];          // wall/dot/power/empty  (2D array)
    int  dotsRemaining = 0;

    // --- Players (vector) ---
    std::vector<Player> players;    // DATA STRUCTURE 1: std::vector

    // --- Ghosts (linked list via std::list) ---
    std::list<Ghost>    ghosts;     // DATA STRUCTURE 2: std::list

    // --- Graph for pathfinding (adjacency list via map) ---
    std::map<Pos, GraphNode> graph; // DATA STRUCTURE 3: std::map (ordered)

    // --- BFS queue ---
    // used ad-hoc in pathfinding functions

    // --- Move history (stack for undo/replay) ---
    std::stack<MoveRecord> moveHistory; // DATA STRUCTURE 4: std::stack

    // --- Power-pellet timer queue ---
    std::queue<std::pair<int,int>> powerEvents; // DATA STRUCTURE 5: std::queue (tick, playerIdx)

    // --- Leaderboard (max-heap via priority_queue) ---
    std::priority_queue<ScoreEntry> leaderboard; // DATA STRUCTURE 6: priority_queue

    // --- Dot positions set (fast lookup) ---
    std::set<Pos> dotSet;           // DATA STRUCTURE 7: std::set

    // --- Ghost frightened cache (unordered_map) ---
    std::unordered_map<int,int> ghostFrightTimers; // DATA STRUCTURE 8: unordered_map

    // --- Team scores ---
    int teamScore[2] = {0, 0};

    // --- Tick counter ---
    int tick = 0;
    bool running = true;
    bool gameOver = false;
    int  winner   = -1;  // -1=none, 0=TEAM_A, 1=TEAM_B, 2=draw
};
