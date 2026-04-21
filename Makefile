# ═══════════════════════════════════════════════
#  Makefile – Two-Team Pac-Man (C++)
#  Usage:
#    Linux / macOS  :  make
#    Windows (MinGW):  make   (or use build.bat)
# ═══════════════════════════════════════════════

CXX      := g++
CXXFLAGS := -std=c++17 -O2 -Wall -Wextra -Iinclude
TARGET   := pacman

SRC := src/main.cpp

all: $(TARGET)

$(TARGET): $(SRC)
	$(CXX) $(CXXFLAGS) -o $(TARGET) $(SRC)

clean:
	rm -f $(TARGET) pacman.exe

run: all
	./$(TARGET)

.PHONY: all clean run
