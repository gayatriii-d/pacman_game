/*════════════════════════════════════════════════════════════════
 TWO-TEAM PAC-MAN  –  C++ Console Game

 Data Structures Used:
   1. std::vector       – player list
   2. std::list         – ghost linked-list
   3. std::map          – adjacency-list graph (ordered)
   4. std::stack        – move history / undo log
   5. std::queue        – BFS frontier + power-event queue
   6. std::priority_queue – A* open-set + leaderboard heap
   7. std::set          – dot positions for O(log n) lookup
   8. std::unordered_map – ghost frighten timer cache O(1)
   9. 2D array          – grid/map

 Algorithms:
   • BFS   – shortest-path ghost chase (Pinky, Inky)
   • A*    – optimal ghost chase (Blinky)
   • DFS-like – flee direction (Clyde frightened)
*/

#include <iostream>
#include <string>
#include <limits>
#include "game.h"
#include "map.h"
#include "engine.h"
#include "renderer.h"
#include "input.h"

// ─────────────────────────────────────────────
//  TICK RATE  (milliseconds per frame)
// ─────────────────────────────────────────────
static const int TICK_MS = 50;

// ─────────────────────────────────────────────
//  Title screen
// ─────────────────────────────────────────────
static void showTitle() {
    clearScreen();
    std::cout << CLR_HEAD
              << R"(
  ████████╗██╗    ██╗ ██████╗       ████████╗███████╗ █████╗ ███╗   ███╗
     ██╔══╝██║    ██║██╔═══██╗         ██╔══╝██╔════╝██╔══██╗████╗ ████║
     ██║   ██║ █╗ ██║██║   ██║         ██║   █████╗  ███████║██╔████╔██║
     ██║   ██║███╗██║██║   ██║         ██║   ██╔══╝  ██╔══██║██║╚██╔╝██║
     ██║   ╚███╔███╔╝╚██████╔╝         ██║   ███████╗██║  ██║██║ ╚═╝ ██║
     ╚═╝    ╚══╝╚══╝  ╚═════╝          ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝
)"
              << CLR_RESET
              << CLR_PA << "\n          TWO  TEAMS  ──  ONE  BOARD  ──  ONE  WINNER\n\n" << CLR_RESET
              << "  Data Structures: vector · list · map · stack · queue\n"
              << "                   priority_queue · set · unordered_map · 2D array\n\n"
              << "  Algorithms      : BFS · A* · DFS-flee\n\n"
              << CLR_HEAD << "  Controls:\n" << CLR_RESET
              << "    " << CLR_PA << "Team A" << CLR_RESET << " (Player A)- keys :  (W / A / S / D) \n"
              << "    " << CLR_PB << "Team B" << CLR_RESET << " (Player B):\n\n"
              << "  Q = Quit   P = Pause\n\n";
}

// ─────────────────────────────────────────────
//  Get player names
// ─────────────────────────────────────────────
static void getNames(std::string& nameA, std::string& nameB) {
#ifndef _WIN32
    setRawMode(false);   // make sure line-mode for input
#endif
    std::cout << CLR_PA << "  Enter Team A player name: " << CLR_RESET;
    std::getline(std::cin, nameA);
    if (nameA.empty()) nameA = "Alpha";

    std::cout << CLR_PB << "  Enter Team B player name: " << CLR_RESET;
    std::getline(std::cin, nameB);
    if (nameB.empty()) nameB = "Beta";

    std::cout << "\n  Press ENTER to start...\n";
    std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n');
}

// ─────────────────────────────────────────────
//  MAIN LOOP
// ─────────────────────────────────────────────
int main() {
    enableAnsi();

    showTitle();

    std::string nameA, nameB;
    getNames(nameA, nameB);

    // ── Game setup ──
    GameState gs;
    initGame(gs, nameA, nameB);

    InputState inp;
    bool paused = false;

#ifndef _WIN32
    setRawMode(true);
#endif

    renderGame(gs);

    while (gs.running) {
        // Poll input
        pollInput(inp);

        if (inp.quit) break;
        if (inp.pause) paused = !paused;
        if (paused) {
            sleepMs(TICK_MS);
            continue;
        }

        // Apply player moves
        if (inp.playerADir != NONE) {
            movePlayer(gs, 0, inp.playerADir);
            inp.playerADir = NONE;
        }
        if (inp.playerBDir != NONE) {
            movePlayer(gs, 1, inp.playerBDir);
            inp.playerBDir = NONE;
        }

        // Advance game state
        gameTick(gs);

        // Render
        renderGame(gs);

        sleepMs(TICK_MS);
    }

#ifndef _WIN32
    setRawMode(false);
#endif

    // Game over screen
    renderGameOver(gs);
    std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n');
    std::cin.get();

    return 0;
}
