#pragma once
#include "game.h"

#ifdef _WIN32
  #include <conio.h>
  #include <windows.h>

  inline bool kbhitNow() { return _kbhit() != 0; }
  inline int  readKey()  { return _getch(); }
  inline void sleepMs(int ms) { Sleep(ms); }

#else
  #include <termios.h>
  #include <unistd.h>
  #include <fcntl.h>
  #include <sys/select.h>

  inline void setRawMode(bool enable) {
      static struct termios oldt;
      if (enable) {
          struct termios newt;
          tcgetattr(STDIN_FILENO, &oldt);
          newt = oldt;
          newt.c_lflag &= ~(ICANON | ECHO);
          tcsetattr(STDIN_FILENO, TCSANOW, &newt);
          // Non-blocking stdin
          int flags = fcntl(STDIN_FILENO, F_GETFL, 0);
          fcntl(STDIN_FILENO, F_SETFL, flags | O_NONBLOCK);
      } else {
          tcsetattr(STDIN_FILENO, TCSANOW, &oldt);
          int flags = fcntl(STDIN_FILENO, F_GETFL, 0);
          fcntl(STDIN_FILENO, F_SETFL, flags & ~O_NONBLOCK);
      }
  }

  inline bool kbhitNow() {
      struct timeval tv = {0, 0};
      fd_set fds;
      FD_ZERO(&fds);
      FD_SET(STDIN_FILENO, &fds);
      return select(1, &fds, nullptr, nullptr, &tv) > 0;
  }

  inline int readKey() {
      int c = getchar();
      if (c == 27) { // ESC sequence (arrow keys)
          int c2 = getchar();
          if (c2 == '[') {
              int c3 = getchar();
              switch (c3) {
                  case 'A': return 1001; // UP
                  case 'B': return 1002; // DOWN
                  case 'C': return 1003; // RIGHT
                  case 'D': return 1004; // LEFT
              }
          }
          return 27;
      }
      return c;
  }

  inline void sleepMs(int ms) {
      usleep(ms * 1000);
  }
#endif

// ─────────────────────────────────────────────
//  Input state
// ─────────────────────────────────────────────
struct InputState {
    Dir playerADir = NONE;
    Dir playerBDir = NONE;
    bool quit  = false;
    bool pause = false;
};

// ─────────────────────────────────────────────
//  Poll keyboard and update InputState
// ─────────────────────────────────────────────
inline void pollInput(InputState& inp) {
    inp.quit = inp.pause = false;

    while (kbhitNow()) {
        int k = readKey();
        switch (k) {
            // ── Player A: WASD ──
            case 'w': case 'W': inp.playerADir = UP;    break;
            case 's': case 'S': inp.playerADir = DOWN;  break;
            case 'a': case 'A': inp.playerADir = LEFT;  break;
            case 'd': case 'D': inp.playerADir = RIGHT; break;

            // ── Player B: IJKL (or arrow keys) ──
            case 'i': case 'I': case 1001: inp.playerBDir = UP;    break;
            case 'k': case 'K': case 1002: inp.playerBDir = DOWN;  break;
            case 'l': case 'L': case 1003: inp.playerBDir = RIGHT; break;
            case 'j': case 'J': case 1004: inp.playerBDir = LEFT;  break;

            case 'q': case 'Q': inp.quit  = true; break;
            case 'p': case 'P': inp.pause = !inp.pause; break;
        }
    }
}
