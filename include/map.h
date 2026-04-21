#pragma once
#include "game.h"

// ─────────────────────────────────────────────
//  DEFAULT MAP  (21x21)
//  1=Wall  2=Dot  3=Power  0=Empty  4=Warp
// ─────────────────────────────────────────────
static const int BASE_MAP[ROWS][COLS] = {
    {1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1},
    {1,3,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,3,1},
    {1,2,1,1,2,1,1,1,2,1,1,1,2,1,1,1,2,1,1,2,1},
    {1,2,1,1,2,1,1,1,2,1,1,1,2,1,1,1,2,1,1,2,1},
    {1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1},
    {1,2,1,1,2,1,2,1,1,1,1,1,1,1,2,1,2,1,1,2,1},
    {1,2,2,2,2,1,2,2,2,2,1,2,2,2,2,1,2,2,2,2,1},
    {1,1,1,1,2,1,1,1,0,1,1,1,0,1,1,1,2,1,1,1,1},
    {1,1,1,1,2,1,0,0,0,0,0,0,0,0,0,1,2,1,1,1,1},
    {1,1,1,1,2,1,0,1,1,0,0,0,1,1,0,1,2,1,1,1,1},
    {4,0,0,0,2,0,0,1,0,0,0,0,0,1,0,0,2,0,0,0,4},
    {1,1,1,1,2,1,0,1,1,1,1,1,1,1,0,1,2,1,1,1,1},
    {1,1,1,1,2,1,0,0,0,0,0,0,0,0,0,1,2,1,1,1,1},
    {1,1,1,1,2,1,0,1,1,1,1,1,1,1,0,1,2,1,1,1,1},
    {1,2,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,2,1},
    {1,2,1,1,2,1,1,1,2,1,1,1,2,1,1,1,2,1,1,2,1},
    {1,3,2,1,2,2,2,2,2,2,0,2,2,2,2,2,2,1,2,3,1},
    {1,1,2,1,2,1,2,1,1,1,1,1,1,1,2,1,2,1,2,1,1},
    {1,2,2,2,2,1,2,2,2,2,1,2,2,2,2,1,2,2,2,2,1},
    {1,2,1,1,1,1,1,1,2,1,1,1,2,1,1,1,1,1,1,2,1},
    {1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1}
};

// ─────────────────────────────────────────────
inline void initMap(GameState& gs) {
    gs.dotsRemaining = 0;
    gs.dotSet.clear();

    for (int r = 0; r < ROWS; r++) {
        for (int c = 0; c < COLS; c++) {
            gs.grid[r][c] = BASE_MAP[r][c];
            if (gs.grid[r][c] == DOT || gs.grid[r][c] == POWER) {
                gs.dotsRemaining++;
                gs.dotSet.insert({r, c});
            }
        }
    }
}

// ─────────────────────────────────────────────
//  BUILD ADJACENCY-LIST GRAPH  (DATA STRUCTURE 3)
// ─────────────────────────────────────────────
inline void buildGraph(GameState& gs) {
    gs.graph.clear();
    const int dr[] = {-1, 0, 1, 0};
    const int dc[] = {0, 1, 0, -1};

    for (int r = 0; r < ROWS; r++) {
        for (int c = 0; c < COLS; c++) {
            if (gs.grid[r][c] == WALL) continue;
            Pos p{r, c};
            GraphNode node;
            node.pos = p;
            for (int d = 0; d < 4; d++) {
                int nr = r + dr[d], nc = c + dc[d];
                // Warp tunnel wrapping
                if (nr < 0) nr = ROWS - 1;
                if (nr >= ROWS) nr = 0;
                if (nc < 0) nc = COLS - 1;
                if (nc >= COLS) nc = 0;
                if (gs.grid[nr][nc] != WALL)
                    node.neighbors.push_back({nr, nc});
            }
            gs.graph[p] = node;
        }
    }
}

// ─────────────────────────────────────────────
inline bool isWalkable(const GameState& gs, int r, int c) {
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return false;
    return gs.grid[r][c] != WALL;
}

inline Pos warp(Pos p) {
    if (p.r < 0)    p.r = ROWS - 1;
    if (p.r >= ROWS) p.r = 0;
    if (p.c < 0)    p.c = COLS - 1;
    if (p.c >= COLS) p.c = 0;
    return p;
}

inline Pos dirOffset(Dir d) {
    switch(d) {
        case UP:    return {-1, 0};
        case DOWN:  return { 1, 0};
        case LEFT:  return { 0,-1};
        case RIGHT: return { 0, 1};
        default:    return { 0, 0};
    }
}
