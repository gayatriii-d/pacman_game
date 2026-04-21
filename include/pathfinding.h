#pragma once
#include "game.h"
#include "map.h"

// ─────────────────────────────────────────────
//  BFS  – shortest path  (uses std::queue)
//  Returns the first step toward target, or NONE
// ─────────────────────────────────────────────
inline Dir bfsNextDir(const GameState& gs, Pos start, Pos target) {
    if (start == target) return NONE;

    // BFS using queue (DATA STRUCTURE 5 pattern)
    std::queue<Pos> frontier;                    // BFS queue
    std::map<Pos,Pos> came_from;
    frontier.push(start);
    came_from[start] = start;

    while (!frontier.empty()) {
        Pos cur = frontier.front(); frontier.pop();

        if (cur == target) {
            // Trace back
            Pos step = target;
            while (came_from[step] != start) step = came_from[step];
            // Determine direction
            int dr = step.r - start.r, dc = step.c - start.c;
            if (dr == -1) return UP;
            if (dr ==  1) return DOWN;
            if (dc == -1) return LEFT;
            if (dc ==  1) return RIGHT;
            return NONE;
        }

        auto it = gs.graph.find(cur);
        if (it == gs.graph.end()) continue;
        for (const Pos& nb : it->second.neighbors) {
            if (came_from.find(nb) == came_from.end()) {
                came_from[nb] = cur;
                frontier.push(nb);
            }
        }
    }
    return NONE;
}

// ─────────────────────────────────────────────
//  A*  – used for player-targeting ghost
//  Priority queue (min-heap) DATA STRUCTURE 6 pattern
// ─────────────────────────────────────────────
inline int manhattan(Pos a, Pos b) {
    return std::abs(a.r - b.r) + std::abs(a.c - b.c);
}

inline Dir astarNextDir(const GameState& gs, Pos start, Pos target) {
    if (start == target) return NONE;

    std::priority_queue<PQEntry, std::vector<PQEntry>, std::greater<PQEntry>> openSet;
    std::map<Pos,int>  gCost;
    std::map<Pos,Pos>  cameFrom;

    gCost[start] = 0;
    openSet.push({manhattan(start, target), start});
    cameFrom[start] = start;

    while (!openSet.empty()) {
        PQEntry cur = openSet.top(); openSet.pop();

        if (cur.pos == target) {
            Pos step = target;
            while (cameFrom[step] != start) step = cameFrom[step];
            int dr = step.r - start.r, dc = step.c - start.c;
            if (dr == -1) return UP;
            if (dr ==  1) return DOWN;
            if (dc == -1) return LEFT;
            if (dc ==  1) return RIGHT;
            return NONE;
        }

        auto it = gs.graph.find(cur.pos);
        if (it == gs.graph.end()) continue;

        for (const Pos& nb : it->second.neighbors) {
            int tentative = gCost[cur.pos] + 1;
            if (gCost.find(nb) == gCost.end() || tentative < gCost[nb]) {
                gCost[nb]    = tentative;
                cameFrom[nb] = cur.pos;
                openSet.push({tentative + manhattan(nb, target), nb});
            }
        }
    }
    return NONE;
}

// ─────────────────────────────────────────────
//  DFS  – used for frightened random-ish ghost
//  Uses std::stack (DATA STRUCTURE 4 pattern)
// ─────────────────────────────────────────────
inline Dir dfsFleeDir(const GameState& gs, Pos pos, Pos threat) {
    // Pick the neighbor furthest from threat
    auto it = gs.graph.find(pos);
    if (it == gs.graph.end()) return NONE;

    Dir best = NONE;
    int bestDist = -1;
    for (const Pos& nb : it->second.neighbors) {
        int d = manhattan(nb, threat);
        if (d > bestDist) { bestDist = d; best = NONE;
            int dr = nb.r - pos.r, dc = nb.c - pos.c;
            if (dr == -1) best = UP;
            else if (dr==1) best = DOWN;
            else if (dc==-1) best = LEFT;
            else best = RIGHT;
        }
    }
    return best;
}
