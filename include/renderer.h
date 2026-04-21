#pragma once
#include "game.h"
#include <sstream>

// ─────────────────────────────────────────────
//  ANSI colour helpers (Linux/macOS; strip on Windows)
// ─────────────────────────────────────────────
#ifdef _WIN32
  #include <windows.h>
  #ifndef ENABLE_VIRTUAL_TERMINAL_PROCESSING
    #define ENABLE_VIRTUAL_TERMINAL_PROCESSING 0x0004
  #endif
  static void enableAnsi() {
      HANDLE h = GetStdHandle(STD_OUTPUT_HANDLE);
      DWORD mode = 0;
      GetConsoleMode(h, &mode);
      SetConsoleMode(h, mode | ENABLE_VIRTUAL_TERMINAL_PROCESSING);
  }
#else
  static void enableAnsi() {}
#endif

#define CLR_RESET   "\033[0m"
#define CLR_WALL    "\033[44m\033[37m"   // blue bg, white fg
#define CLR_DOT     "\033[33m"           // yellow
#define CLR_POWER   "\033[1;33m"         // bright yellow
#define CLR_PA      "\033[1;32m"         // bright green  (Player A)
#define CLR_PB      "\033[1;31m"         // bright red    (Player B)
#define CLR_GHOST   "\033[35m"           // magenta
#define CLR_FRIGHT  "\033[34m"           // blue (frightened ghost)
#define CLR_EATEN   "\033[37m"           // white (eaten ghost, eyes)
#define CLR_HEAD    "\033[1;36m"         // header cyan

// ─────────────────────────────────────────────
//  Clear screen
// ─────────────────────────────────────────────
inline void clearScreen() {
#ifdef _WIN32
    system("cls");
#else
    std::cout << "\033[2J\033[H";
#endif
}

// ─────────────────────────────────────────────
//  Build a render buffer, then print atomically
// ─────────────────────────────────────────────
inline void renderGame(const GameState& gs) {
    clearScreen();

    // Build overlay maps: ghost positions, player positions
    std::map<Pos, const Ghost*>  ghostAt;
    std::map<Pos, const Player*> playerAt;

    for (const Ghost& g : gs.ghosts)
        ghostAt[g.pos] = &g;
    for (const Player& p : gs.players)
        if (p.alive) playerAt[p.pos] = &p;

    std::ostringstream buf;

    // ── Header ──
    buf << CLR_HEAD
        << "╔══════════════════════════════════════════╗\n"
        << "║         TWO-TEAM PAC-MAN   tick="
        << gs.tick
        << std::string(gs.tick < 10 ? 5 : gs.tick < 100 ? 4 : 3, ' ')
        << "║\n"
        << "╚══════════════════════════════════════════╝\n"
        << CLR_RESET;

    // ── Grid ──
    for (int r = 0; r < ROWS; r++) {
        for (int c = 0; c < COLS; c++) {
            Pos cur{r, c};

            // Player takes priority
            if (playerAt.count(cur)) {
                const Player* p = playerAt[cur];
                buf << (p->team == TEAM_A ? CLR_PA : CLR_PB);
                buf << (p->powered ? 'C' : p->symbol);   // 'C' for Chomping
                buf << CLR_RESET;
                continue;
            }
            // Ghost
            if (ghostAt.count(cur)) {
                const Ghost* g = ghostAt[cur];
                if      (g->state == FRIGHTENED) buf << CLR_FRIGHT << 'F';
                else if (g->state == EATEN)      buf << CLR_EATEN  << 'e';
                else                             buf << CLR_GHOST  << g->symbol;
                buf << CLR_RESET;
                continue;
            }
            // Tile
            int t = gs.grid[r][c];
            switch (t) {
                case WALL:  buf << CLR_WALL  << '#' << CLR_RESET; break;
                case DOT:   buf << CLR_DOT   << '.' << CLR_RESET; break;
                case POWER: buf << CLR_POWER << 'o' << CLR_RESET; break;
                case WARP:  buf << ' '; break;
                default:    buf << ' ';
            }
        }
        buf << '\n';
    }

    // ── Status panel ──
    buf << CLR_HEAD << "\n── PLAYERS ────────────────────────────────\n" << CLR_RESET;
    for (const Player& p : gs.players) {
        buf << (p.team == TEAM_A ? CLR_PA : CLR_PB)
            << '[' << (p.team == TEAM_A ? "Team-A" : "Team-B") << "] "
            << p.name
            << "  Score:" << p.score
            << "  Lives:" << p.lives
            << (p.powered ? "  *POWERED*" : "")
            << (!p.alive  ? "  [DEAD]"    : "")
            << CLR_RESET << '\n';
    }

    buf << CLR_HEAD << "── TEAM SCORES ────────────────────────────\n" << CLR_RESET;
    buf << CLR_PA << "  Team A: " << gs.teamScore[0] << CLR_RESET
        << "   "
        << CLR_PB << "Team B: " << gs.teamScore[1] << CLR_RESET << '\n';

    buf << CLR_HEAD << "── DOTS LEFT: " << gs.dotsRemaining
        << " ────────────────────────────\n" << CLR_RESET;

    buf << CLR_HEAD << "── CONTROLS ───────────────────────────────\n" << CLR_RESET;
    buf << "  Team A: W/A/S/D   Team B: Arrows/I/J/K/L   Q=Quit  P=Pause\n";

    std::cout << buf.str() << std::flush;
}

// ─────────────────────────────────────────────
inline void renderGameOver(const GameState& gs) {
    clearScreen();
    std::cout << CLR_HEAD
              << "\n\n   ╔═══════════════════════╗\n"
              << "   ║      GAME  OVER       ║\n"
              << "   ╚═══════════════════════╝\n\n"
              << CLR_RESET;

    if (gs.winner == 0)      std::cout << CLR_PA << "   >>> TEAM A WINS! <<<\n" << CLR_RESET;
    else if (gs.winner == 1) std::cout << CLR_PB << "   >>> TEAM B WINS! <<<\n" << CLR_RESET;
    else                     std::cout << CLR_HEAD << "   >>> IT'S A DRAW! <<<\n" << CLR_RESET;

    std::cout << "\n   Final Scores:\n";
    std::cout << CLR_PA << "   Team A: " << gs.teamScore[0] << CLR_RESET << '\n';
    std::cout << CLR_PB << "   Team B: " << gs.teamScore[1] << CLR_RESET << '\n';

    std::cout << "\n   Player Stats:\n";
    for (const Player& p : gs.players) {
        std::cout << "   " << p.name << " – Score: " << p.score << '\n';
    }
    std::cout << "\n   Press Enter to exit.\n";
}
