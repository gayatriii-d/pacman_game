@echo off
REM ═══════════════════════════════════════════
REM  build.bat – Windows MinGW build script
REM  Requires: g++ (MinGW or MSYS2) in PATH
REM ═══════════════════════════════════════════

echo Building Two-Team Pac-Man...
g++ -std=c++17 -O2 -Wall -Iinclude -o pacman.exe src\main.cpp

if %ERRORLEVEL% == 0 (
    echo.
    echo  Build SUCCESS! Run: pacman.exe
) else (
    echo.
    echo  Build FAILED. Make sure g++ is installed.
    echo  Install MSYS2 from: https://www.msys2.org
    echo  Then run: pacman -S mingw-w64-x86_64-gcc
)
pause
