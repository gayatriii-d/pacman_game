# 🟡 Two-Team Pac-Man — C++ Console Game

A fully-featured **two-player, two-team Pac-Man** game in C++.  
Both players share **one keyboard on one PC** — classic couch-style competition!

---

## 🎮 Controls

| Action        | Team A (Player A) | Team B (Player B)         |
|---------------|-------------------|---------------------------|
| Move Up       | `W`               | `I` or `↑` Arrow          |
| Move Down     | `S`               | `K` or `↓` Arrow          |
| Move Left     | `A`               | `J` or `←` Arrow          |
| Move Right    | `D`               | `L` or `→` Arrow          |
| Quit          | `Q`               | `Q`                       |
| Pause/Resume  | `P`               | `P`                       |

---

## 🏆 Objective

- Eat **dots** (`.`) → 10 points each  
- Eat **power pellets** (`o`) → 50 points + frighten ghosts  
- Eat a **frightened ghost** → 200 points  
- The team with the **highest total score** when all dots are eaten **wins!**
- If all players of a team die, the other team wins automatically.

---

## 🗺 Map Legend

| Symbol | Meaning             |
|--------|---------------------|
| `#`    | Wall                |
| `.`    | Dot (10 pts)        |
| `o`    | Power Pellet (50 pts) |
| `A`    | Team A Player       |
| `B`    | Team B Player       |
| `C`    | Player (POWERED!)   |
| `B/P/I/C` | Ghosts (Blinky/Pinky/Inky/Clyde) |
| `F`    | Frightened Ghost    |
| `e`    | Eaten Ghost (returning) |

---

## 🧠 Data Structures Used

| # | Data Structure       | Where Used                                 |
|---|----------------------|--------------------------------------------|
| 1 | `std::vector`        | Player list                                |
| 2 | `std::list`          | Ghost linked-list (insertion/traversal)    |
| 3 | `std::map`           | Adjacency-list graph for pathfinding       |
| 4 | `std::stack`         | Move history / replay log                  |
| 5 | `std::queue`         | BFS frontier + power-pellet event queue    |
| 6 | `std::priority_queue`| A* open-set + leaderboard max-heap         |
| 7 | `std::set`           | Dot position lookup O(log n)               |
| 8 | `std::unordered_map` | Ghost frighten timer cache O(1)            |
| 9 | 2D array             | Game grid / map representation             |

---

## 🤖 AI Algorithms

| Ghost  | Algorithm    | Behaviour                               |
|--------|--------------|-----------------------------------------|
| Blinky | **A\***      | Directly chases nearest player (optimal)|
| Pinky  | **BFS**      | Targets 4 tiles ahead of Player A       |
| Inky   | **BFS**      | Chases Player B                         |
| Clyde  | **BFS/Scatter** | Chases if far, retreats to corner if close |
| Any (frightened) | **DFS-flee** | Moves toward cell farthest from player |

---

## 🔨 Build Instructions

### Linux / macOS

```bash
# Requirements: g++ with C++17 support
sudo apt install g++    # Ubuntu/Debian
brew install gcc        # macOS

# Build & run
make
./pacman
```

### Windows (MinGW / MSYS2)

1. Install [MSYS2](https://www.msys2.org)
2. In MSYS2 terminal: `pacman -S mingw-w64-x86_64-gcc`
3. Double-click `build.bat` or run in terminal:
```cmd
build.bat
pacman.exe
```

### One-liner (any platform with g++)

```bash
g++ -std=c++17 -O2 -Iinclude -o pacman src/main.cpp && ./pacman
```

---

## 📁 Project Structure

```
pacman_game/
├── src/
│   └── main.cpp          ← Entry point & game loop
├── include/
│   ├── game.h            ← Data structures, types, GameState
│   ├── map.h             ← Map layout + graph builder
│   ├── pathfinding.h     ← BFS, A*, DFS algorithms
│   ├── ghost_ai.h        ← Ghost state machine + AI
│   ├── engine.h          ← Core game tick, collision, scoring
│   ├── renderer.h        ← ANSI console renderer
│   └── input.h           ← Cross-platform keyboard input
├── Makefile              ← Linux/macOS build
├── build.bat             ← Windows build
└── README.md             ← This file
```

---

## ⚙️ Requirements

- **C++17** or later (`std::optional`, structured bindings, etc.)
- Terminal with **ANSI colour support**:  
  - Linux: any terminal ✅  
  - macOS: Terminal.app or iTerm2 ✅  
  - Windows: Windows Terminal (recommended) or CMD with ANSI enabled ✅

---

## 📝 Notes

- The game runs at **~150ms per tick** (≈ 6 FPS). You can adjust `TICK_MS` in `main.cpp`.  
- The ghost house (centre) is inaccessible to players.  
- Warp tunnels (row 10, sides) connect left ↔ right sides.  
- Power pellets last **35 ticks** (~5 seconds).

---

*Made with C++ · No external libraries required*
