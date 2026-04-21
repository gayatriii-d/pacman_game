# 🟡 Pac-Man vs The Haunted — Browser Game

A fully-featured **single-player Pac-Man** game that runs in the browser (Chrome/Edge/Firefox).  
You play against **4 AI ghosts** powered by real pathfinding algorithms (A\*, BFS, DFS).

---

## 🚀 How to Run

Just open in Chrome — no server, no install needed:

```
pacman_game/web/index.html  →  double-click or drag into Chrome
```

---

## 🎮 Controls

| Action       | Key                        |
|--------------|----------------------------|
| Move         | `W A S D` or Arrow Keys    |
| Pause/Resume | `P`                        |
| Quit         | `Q`                        |

> On the name screen, press **Enter** to start the game instantly.

---

## 🏆 Objective

- Eat all **dots** on the map to win
- Avoid ghosts — they will chase you using AI
- Eat a **power pellet** to frighten ghosts, then eat them for bonus points
- You lose if all 3 lives are gone

---

## 🔢 Scoring

| Item                  | Points |
|-----------------------|--------|
| Dot `·`               | 10     |
| Power Pellet `●`      | 50     |
| Eating a ghost 👻     | 200    |

---

## 👻 Ghost AI

| Ghost  | Color  | Algorithm       | Behaviour                              |
|--------|--------|-----------------|----------------------------------------|
| Blinky | 🔴 Red  | **A\***         | Directly chases you (optimal path)     |
| Pinky  | 🩷 Pink | **BFS**         | Targets 4 tiles ahead of you          |
| Inky   | 🩵 Cyan | **BFS**         | Flanks you from the side              |
| Clyde  | 🟠 Orange | **BFS/Scatter** | Chases if far, retreats if close     |
| Any (frightened) | 🔵 Blue | **DFS-flee** | Runs away from you              |

---

## 🧠 Data Structures Used

| # | Data Structure       | Where Used                                  |
|---|----------------------|---------------------------------------------|
| 1 | `Array` (vector)     | Player list                                 |
| 2 | `Array` (list)       | Ghost linked-list traversal                 |
| 3 | `Map` (adjacency)    | Graph of walkable cells for pathfinding     |
| 4 | `Array` (stack)      | Move history / replay log (LIFO)            |
| 5 | `Array` (queue)      | BFS frontier + power-pellet event queue     |
| 6 | `MinHeap`            | A\* open-set (priority queue)               |
| 7 | `Set`                | Dot position lookup O(log n)                |
| 8 | `Map` (hash)         | Ghost frighten timer cache O(1)             |
| 9 | 2D Array (21×21)     | Game grid / map representation              |

> Click any row in the **📚 Data Structures** panel inside the game to see a live animation of that structure.

---

## 🗺 Map

- **21 × 21** grid
- Warp tunnels on row 10 (left ↔ right sides)
- Ghost house in the centre (inaccessible to player)
- Power pellets in the 4 corners

---

## 📁 Project Structure

```
pacman_game/
├── web/
│   ├── index.html      ← Open this in Chrome to play
│   ├── game.js         ← Game engine (state, physics, AI)
│   ├── renderer.js     ← HTML5 Canvas renderer
│   ├── main.js         ← Game loop, input, UI controller
│   ├── dsanim.js       ← Data structure animations
│   └── style.css       ← UI styling
├── src/
│   └── main.cpp        ← C++ console version (entry point)
├── include/
│   ├── game.h          ← Data structures, types, GameState
│   ├── map.h           ← Map layout + graph builder
│   ├── pathfinding.h   ← BFS, A*, DFS algorithms
│   ├── ghost_ai.h      ← Ghost state machine + AI
│   ├── engine.h        ← Core game tick, collision, scoring
│   ├── renderer.h      ← ANSI console renderer
│   └── input.h         ← Cross-platform keyboard input
├── build.bat           ← Windows build script (C++ version)
├── Makefile            ← Linux/macOS build (C++ version)
└── README.md
```

---

## ⚙️ Requirements

**Browser version (recommended):**
- Any modern browser — Chrome, Edge, Firefox ✅
- No install, no server required

**C++ console version:**
- `g++` with C++17 support
- Windows Terminal or any ANSI-capable terminal

---

## 🔨 Build C++ Version (optional)

**Windows:**
```cmd
build.bat
pacman.exe
```

**Linux / macOS:**
```bash
make
./pacman
```

**One-liner:**
```bash
g++ -std=c++17 -O2 -Iinclude -o pacman src/main.cpp && ./pacman
```

---

*Made with C++ & JavaScript · No external libraries required*
